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
            // Tambah sedikit delay untuk menghindari flicker
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
        // Set tanggal saat ini
        const now = new Date();
        document.getElementById('currentDate').textContent = utils.formatDate(now);
        
        // Tampilkan loading overlay
        loadingManager.show('Memuat data dari server...');
        
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
        
    } catch (error) {
        utils.showError(error.message);
        loadingManager.hide();
    }
});

function setupEventListeners() {
    // Apply Filter button
    document.getElementById('btnApplyFilter').addEventListener('click', async () => {
        loadingManager.showMiniOnButton('btnApplyFilter', true);
        try {
            await uiManager.applyFilter();
        } finally {
            loadingManager.showMiniOnButton('btnApplyFilter', false);
        }
    });
    
    // Reset Filter button
    document.getElementById('btnResetFilter').addEventListener('click', async () => {
        uiManager.resetFilter();
        loadingManager.showMiniOnButton('btnResetFilter', true);
        try {
            await uiManager.applyFilter();
        } finally {
            loadingManager.showMiniOnButton('btnResetFilter', false);
        }
    });
    
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
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl + F untuk apply filter
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('btnApplyFilter').click();
        }
        
        // Ctrl + R untuk reset filter
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            document.getElementById('btnResetFilter').click();
        }
        
        // Ctrl + P untuk download PDF
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            document.getElementById('btnDownloadPDF').click();
        }
    });
}

// Auto-refresh data setiap 5 menit
let refreshInterval;
function startAutoRefresh() {
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
        }
    } else {
        if (!refreshInterval) {
            startAutoRefresh();
        }
    }
});

// Export untuk akses global jika diperlukan
window.loadingManager = loadingManager;

// Export untuk testing jika diperlukan
export { loadingManager };