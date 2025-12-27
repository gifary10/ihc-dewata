// Main entry point for the dashboard application
import { dataService } from './dataService.js';
import { uiManager } from './uiManager.js';
import { utils } from './utils.js';
import { chartManager } from './chartManager.js';
import { tableManager } from './tableManager.js';
import { filterManager } from './filterManager.js';
import { pdfGenerator } from './pdfGenerator.js';

class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
        this.loadingCount = 0;
        
        if (!this.overlay) {
            console.error('Loading overlay element not found!');
            this.overlay = document.createElement('div');
            this.overlay.id = 'loadingOverlay';
            this.overlay.className = 'loading-overlay hidden';
            this.overlay.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner"></div>
                    <div class="loading-text">Memuat Data</div>
                    <div class="loading-subtext">Silakan tunggu...</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
    }

    show(message = 'Memuat Data') {
        this.loadingCount++;
        
        if (this.loadingCount === 1) {
            this.overlay.classList.remove('hidden');
            this.updateMessage(message);
        }
        
        return this.loadingCount;
    }

    hide() {
        if (this.loadingCount > 0) {
            this.loadingCount--;
        }
        
        if (this.loadingCount === 0) {
            setTimeout(() => {
                this.overlay.classList.add('hidden');
            }, 300);
        }
        
        return this.loadingCount;
    }

    updateMessage(message) {
        const loadingText = this.overlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
}

const loadingManager = new LoadingManager();

// ================= INISIALISASI =================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Aplikasi dimulai...');
        
        const now = new Date();
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            currentDateElement.textContent = utils.formatDate(now);
        }
        
        const currentYearElement = document.getElementById('currentYear');
        if (currentYearElement) {
            currentYearElement.textContent = now.getFullYear();
        }
        
        loadingManager.show('Memuat data dari server...');
        
        await dataService.loadData();
        console.log('Data berhasil dimuat');
        
        uiManager.initFilters();
        console.log('Filter diinisialisasi');
        
        setupEventListeners();
        console.log('Event listeners dipasang');
        
        await uiManager.applyFilter();
        console.log('Filter diterapkan');
        
        loadingManager.hide();
        console.log('Aplikasi siap');
        
        startAutoRefresh();
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showError(`Terjadi kesalahan saat memulai aplikasi: ${error.message}`);
        loadingManager.hide();
    }
});

function setupEventListeners() {
    const pdfButton = document.getElementById('btnDownloadPDF');
    if (pdfButton) {
        pdfButton.addEventListener('click', handlePDFDownload);
    }
    
    let filterTimeout;
    
    const handleFilterChange = async () => {
        if (filterTimeout) clearTimeout(filterTimeout);
        
        filterTimeout = setTimeout(async () => {
            loadingManager.show('Menerapkan filter...');
            try {
                await uiManager.applyFilter();
            } catch (error) {
                console.error('Filter error:', error);
                utils.showError('Gagal menerapkan filter: ' + error.message);
            } finally {
                loadingManager.hide();
            }
        }, 500);
    };
    
    const filterPerusahaan = document.getElementById('filterPerusahaan');
    if (filterPerusahaan) {
        filterPerusahaan.addEventListener('change', () => {
            uiManager.updateDepartemenByPerusahaan();
            handleFilterChange();
        });
    }
    
    ['filterDepartemen', 'filterTahun', 'filterBulan'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', handleFilterChange);
        }
    });
    
    // Handle window resize untuk chart
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (chartManager) {
                chartManager.destroyAllCharts();
                chartManager.updateAllCharts();
            }
        }, 250);
    });
}

async function handlePDFDownload() {
    if (window.isGeneratingPDF) return; // ⛔ cegah klik dobel

    window.isGeneratingPDF = true; // 🔒 LOCK PDF

    try {
        // Pastikan html2pdf sudah dimuat
        if (typeof html2pdf === 'undefined') {
            await loadHTML2PDF();
        }

        // hentikan auto-refresh sementara
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }

        // tunggu DOM & chart stabil
        await new Promise(resolve => setTimeout(resolve, 800));

        // generate PDF
        await pdfGenerator.generatePDF();

    } catch (error) {
        console.error('Error generating PDF:', error);
        utils.showError('Gagal membuat laporan PDF: ' + error.message);
    } finally {
        window.isGeneratingPDF = false; // 🔓 buka lock
        startAutoRefresh(); // nyalakan auto-refresh lagi
    }
}

// Fungsi untuk memastikan html2pdf dimuat
function loadHTML2PDF() {
    return new Promise((resolve, reject) => {
        if (typeof html2pdf !== 'undefined') {
            resolve();
            return;
        }
        
        // Coba muat ulang script
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
            console.log('html2pdf loaded successfully');
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Gagal memuat library html2pdf'));
        };
        document.head.appendChild(script);
    });
}

let refreshInterval;
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(async () => {
        if (document.hidden) return;
        
        try {
            console.log("Auto-refresh data...");
            loadingManager.show('Memperbarui data...');
            await dataService.loadData();
            await uiManager.applyFilter();
            console.log("Auto-refresh berhasil");
        } catch (error) {
            console.error("Auto-refresh failed:", error);
        } finally {
            loadingManager.hide();
        }
    }, 5 * 60 * 1000); // 5 menit
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log('Auto-refresh dihentikan');
        }
    } else {
        if (!refreshInterval) {
            startAutoRefresh();
            console.log('Auto-refresh dimulai ulang');
        }
    }
});

// Export untuk debugging
window.loadingManager = loadingManager;
window.dataService = dataService;
window.uiManager = uiManager;
window.chartManager = chartManager;
window.tableManager = tableManager;
window.pdfGenerator = pdfGenerator;

export { loadingManager };