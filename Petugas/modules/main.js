import { CONFIG, namaPerusahaan, googleSheetsConfig } from './config.js';
import { GoogleSheetsAPI } from './googleSheets.js';
import { PerusahaanManager } from './perusahaanManager.js';
import { ObatManager } from './obatManager.js';
import { PenyakitManager } from './penyakitManager.js';
import { UI } from './uiManager.js';
import { EventManager } from './eventManager.js';
import { Laporan } from './laporanManager.js';
import { DeleteManager } from './deleteManager.js';

UI.setupHeaderFooter = () => {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    const updateHeaderPerusahaan = () => {
        const perusahaanElement = document.getElementById('namaPerusahaanHeader');
        const gantiBtn = document.getElementById('btnGantiPerusahaanHeader');
        
        if (perusahaanElement) {
            perusahaanElement.textContent = namaPerusahaan || '-';
        }
        
        if (gantiBtn) {
            gantiBtn.addEventListener('click', UI.tampilkanModalPerusahaan);
        }
    };
    
    updateHeaderPerusahaan();
};

document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Memulai inisialisasi aplikasi...');
        
        UI.setupHeaderFooter();
        
        const loadPromises = [
            PerusahaanManager.loadPerusahaanData().catch(err => {
                console.error('Gagal memuat data perusahaan:', err);
                return [];
            }),
            ObatManager.loadObatData().catch(err => {
                console.error('Gagal memuat data obat:', err);
                return [];
            }),
            PenyakitManager.loadPenyakitData().catch(err => {
                console.error('Gagal memuat data penyakit:', err);
                return [];
            })
        ];
        
        await Promise.all(loadPromises);
        
        console.log('Data berhasil dimuat:');
        console.log('- Perusahaan:', PerusahaanManager.dataPerusahaan?.length || 0);
        console.log('- Obat:', ObatManager.dataObat?.length || 0);
        console.log('- Penyakit kategori:', PenyakitManager.dataPenyakit?.length || 0);
        
        if (!namaPerusahaan) {
            console.log('Perusahaan belum dipilih, menampilkan modal...');
            UI.tampilkanModalPerusahaan();
        } else {
            console.log('Perusahaan sudah dipilih:', namaPerusahaan);
            UI.tampilkanNamaPerusahaan();
            
            if (PerusahaanManager.dataPerusahaan && PerusahaanManager.dataPerusahaan.length > 0) {
                const perusahaanExists = PerusahaanManager.dataPerusahaan.some(
                    p => p.nama_perusahaan === namaPerusahaan
                );
                
                if (!perusahaanExists) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.PERUSAHAAN);
                    setTimeout(() => UI.tampilkanModalPerusahaan(), 500);
                }
            }
        }
        
        GoogleSheetsAPI.configure(googleSheetsConfig);
        EventManager.setupAllEvents();
        UI.setTanggalDefault();
        UI.setFilterDefault();
        EventManager.setupTahunFilter();
        
        if (ObatManager.dataObat && ObatManager.dataObat.length > 0) {
            EventManager.populateObatSelect('');
        }
        
        if (PenyakitManager.dataPenyakit && PenyakitManager.dataPenyakit.length > 0) {
            UI.populatePenyakitKategori();
        }
        
        if (namaPerusahaan && PerusahaanManager.dataPerusahaan && PerusahaanManager.dataPerusahaan.length > 0) {
            setTimeout(() => {
                const perusahaanExists = PerusahaanManager.dataPerusahaan.some(
                    p => p.nama_perusahaan === namaPerusahaan
                );
                
                if (perusahaanExists) {
                    UI.populateDepartemenSelects();
                }
            }, 1000);
        }
        
        DeleteManager.setupDeleteButtons();
        
        setTimeout(() => {
            Laporan.tampilkan();
        }, 1000);
        
        console.log('Inisialisasi aplikasi selesai.');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        UI.showNotification('Gagal menginisialisasi aplikasi: ' + error.message, 'danger');
        setTimeout(() => UI.tampilkanModalPerusahaan(), 1000);
    }
});

// Fungsi debugging yang diperlukan
window.debugData = function() {
    console.log("=== DEBUG DATA ===");
    console.log("Nama perusahaan:", namaPerusahaan);
    console.log("Data perusahaan:", PerusahaanManager.dataPerusahaan);
    console.log("Data obat:", ObatManager.dataObat?.length || 0, "items");
    console.log("Data penyakit:", PenyakitManager.dataPenyakit?.length || 0, "categories");
    
    alert(`Perusahaan: ${namaPerusahaan || '(belum dipilih)'}\nData obat: ${ObatManager.dataObat?.length || 0} items\nData penyakit: ${PenyakitManager.dataPenyakit?.length || 0} categories`);
};

window.refreshReportData = function() {
    Laporan.refresh();
};