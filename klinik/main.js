// Main entry point for the dashboard application
import { dataService } from './modules/dataService.js';
import { uiManager } from './modules/uiManager.js';
import { utils } from './modules/utils.js';

class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
        this.loadingCount = 0;
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

    showMiniOnButton(buttonId, show = true) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (show) {
            if (!button.querySelector('.mini-loading')) {
                const spinner = document.createElement('span');
                spinner.className = 'mini-loading';
                button.appendChild(spinner);
                button.disabled = true;
            }
        } else {
            const spinner = button.querySelector('.mini-loading');
            if (spinner) {
                spinner.remove();
                button.disabled = false;
            }
        }
    }
}

// Buat instance LoadingManager
const loadingManager = new LoadingManager();

// ================= INISIALISASI =================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Update tanggal saat ini
        uiManager.updateCurrentDate();
        
        // Tampilkan loading overlay
        loadingManager.show('Memuat data dari server...');
        
        // Test connection first
        console.log("Testing connection to Google Sheets API...");
        const testResult = await dataService.testConnection();
        
        if (testResult.success) {
            console.log("Connection successful, loading data...");
            // Load data
            await dataService.loadData();
            
            // Setup filters
            uiManager.initFilters();
            
            // Setup event listeners
            setupEventListeners();
            
            // Apply initial filter
            await uiManager.applyFilter();
            
            // Sembunyikan loading
            loadingManager.hide();
            
            // Show success message
            console.log("Dashboard loaded successfully with Google Sheets data");
        } else {
            throw new Error("Koneksi ke server gagal. Periksa koneksi internet Anda.");
        }
        
    } catch (error) {
        console.error("Initialization error:", error);
        utils.showError(error.message);
        loadingManager.hide();
        
        // Show retry button
        showRetryButton();
    }
});

function setupEventListeners() {
    // Download PDF button
    document.getElementById('btnDownloadPDF').addEventListener('click', async () => {
        loadingManager.showMiniOnButton('btnDownloadPDF', true);
        try {
            // Import pdfGenerator
            const { pdfGenerator } = await import('./modules/pdfGenerator.js');
            await pdfGenerator.generatePDF();
        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showError('Gagal membuat laporan PDF: ' + error.message);
        } finally {
            loadingManager.showMiniOnButton('btnDownloadPDF', false);
        }
    });
    
    // Dropdown change listeners dengan debouncing
    let filterTimeout;
    
    const handleFilterChange = async () => {
        if (filterTimeout) clearTimeout(filterTimeout);
        
        filterTimeout = setTimeout(async () => {
            loadingManager.show('Menerapkan filter...');
            try {
                await uiManager.applyFilter();
            } catch (error) {
                console.error("Filter error:", error);
                utils.showError("Gagal menerapkan filter: " + error.message);
            } finally {
                loadingManager.hide();
            }
        }, 300);
    };
    
    // Perusahaan dropdown change
    document.getElementById('filterPerusahaan').addEventListener('change', () => {
        uiManager.updateDepartemenByPerusahaan();
        handleFilterChange();
    });
    
    // Other dropdowns change
    document.getElementById('filterDepartemen').addEventListener('change', handleFilterChange);
    document.getElementById('filterTahun').addEventListener('change', handleFilterChange);
    document.getElementById('filterBulan').addEventListener('change', handleFilterChange);
}

async function handleRefresh() {
    loadingManager.show('Memperbarui data...');
    try {
        // Test connection first
        const testResult = await dataService.testConnection();
        
        if (testResult.success) {
            await dataService.loadData();
            await uiManager.applyFilter();
            console.log("Data refreshed successfully");
        } else {
            throw new Error("Koneksi gagal. Tidak dapat memuat data terbaru.");
        }
    } catch (error) {
        console.error("Refresh error:", error);
        utils.showError("Gagal memperbarui data: " + error.message);
    } finally {
        loadingManager.hide();
    }
}

function showRetryButton() {
    const container = document.querySelector('.container');
    const retryDiv = document.createElement('div');
    retryDiv.className = 'alert alert-warning text-center';
    retryDiv.innerHTML = `
        <h5 class="alert-heading">Gagal Memuat Data</h5>
        <p>Terjadi kesalahan saat memuat data dari server.</p>
        <button id="btnRetry" class="btn btn-primary mt-2">
            <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
        </button>
    `;
    
    // Remove old retry button if exists
    const oldRetry = document.getElementById('retryContainer');
    if (oldRetry) oldRetry.remove();
    
    retryDiv.id = 'retryContainer';
    container.insertBefore(retryDiv, container.firstChild);
    
    document.getElementById('btnRetry').addEventListener('click', async () => {
        loadingManager.show('Mencoba memuat data kembali...');
        try {
            const testResult = await dataService.testConnection();
            if (testResult.success) {
                await dataService.loadData();
                await uiManager.applyFilter();
                retryDiv.remove();
            } else {
                throw new Error("Koneksi masih gagal.");
            }
        } catch (error) {
            console.error("Retry failed:", error);
            utils.showError("Masih gagal: " + error.message);
        } finally {
            loadingManager.hide();
        }
    });
}

// Auto-refresh data setiap 5 menit
let refreshInterval;
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    
    refreshInterval = setInterval(async () => {
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
    }, 5 * 60 * 1000); // 5 minutes
}

// Start auto-refresh ketika halaman selesai load
setTimeout(() => {
    startAutoRefresh();
}, 10000); // Mulai 10 detik setelah load

// Pause auto-refresh ketika tab tidak aktif
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log("Auto-refresh paused");
        }
    } else {
        if (!refreshInterval) {
            startAutoRefresh();
            console.log("Auto-refresh resumed");
        }
    }
});

// Export untuk akses global jika diperlukan
window.loadingManager = loadingManager;

// Export untuk testing jika diperlukan
export { loadingManager };