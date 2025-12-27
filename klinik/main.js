// Main entry point for the dashboard application
import { dataService } from './dataService.js';
import { uiManager } from './uiManager.js';
import { utils } from './utils.js';
import { chartManager } from './chartManager.js';
import { tableManager } from './tableManager.js';
import { filterManager } from './filterManager.js';

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
        
        uiManager.initFilters();
        
        setupEventListeners();
        
        await uiManager.applyFilter();
        
        loadingManager.hide();
        
        startAutoRefresh();
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showError(error.message);
        loadingManager.hide();
    }
});

function setupEventListeners() {
    const pdfButton = document.getElementById('btnDownloadPDF');
    if (pdfButton) {
        pdfButton.addEventListener('click', async () => {
            try {
                const { pdfGenerator } = await import('./pdfGenerator.js');
                await pdfGenerator.generatePDF();
            } catch (error) {
                console.error('Error generating PDF:', error);
                utils.showError('Gagal membuat laporan PDF: ' + error.message);
            }
        });
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
        }, 300);
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
}

let refreshInterval;
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(async () => {
        if (document.hidden) return;
        
        try {
            loadingManager.show('Memperbarui data...');
            await dataService.loadData();
            await uiManager.applyFilter();
            console.log("Auto-refreshing data...");
        } catch (error) {
            console.error("Auto-refresh failed:", error);
        } finally {
            loadingManager.hide();
        }
    }, 5 * 60 * 1000);
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    } else {
        if (!refreshInterval) {
            startAutoRefresh();
        }
    }
});

window.loadingManager = loadingManager;
window.dataService = dataService;
window.uiManager = uiManager;

export { loadingManager };