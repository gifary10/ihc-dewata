import { CONFIG, setNamaPerusahaan, namaPerusahaan } from './config.js';
import { UI } from './uiManager.js';

export const Storage = {
    simpanPerusahaan: (nama) => {
        console.log('Menyimpan perusahaan:', nama);
        
        setNamaPerusahaan(nama);
        localStorage.setItem(CONFIG.STORAGE_KEYS.PERUSAHAAN, nama);
        
        UI.tampilkanNamaPerusahaan();
        
        setTimeout(() => {
            if (window.PerusahaanManager) {
                window.PerusahaanManager.loadPerusahaanData().then(() => {
                    UI.populateDepartemenSelects();
                    UI.populatePenyakitKategori();
                    UI.populateObatKategori();
                });
            }
        }, 100);
        
        return nama;
    }
};

export const Validator = {
    isRequired: (value) => value && value.toString().trim() !== '',
    validateForm: (fields) => {
        for (const [key, value] of Object.entries(fields)) {
            if (!Validator.isRequired(value)) {
                console.error(`Field wajib: ${key} belum diisi`);
                return false;
            }
        }
        return true;
    }
};

export const Formatter = {
    tanggal: (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-',
    waktu: (dateString) => dateString ? new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    splitDateTime: (datetime) => {
        if (!datetime) return { tanggal: '-', waktu: '-' };
        const date = new Date(datetime);
        const tanggal = date.toISOString().split('T')[0];
        const waktu = date.toTimeString().split(' ')[0].substring(0, 5);
        return { tanggal, waktu };
    },
    bulanNama: (bulanIndex) => {
        const bulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return bulan[bulanIndex] || '-';
    },
    escapeJson: (obj) => {
        return JSON.stringify(obj).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }
};