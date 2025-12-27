// Konfigurasi global aplikasi
export const CONFIG = {
    STORAGE_KEYS: {
        PERUSAHAAN: 'namaPerusahaan',
        GOOGLE_SHEETS_CONFIG: 'googleSheetsConfig'
    },
    DEFAULT_DATES: {
        HARI_INI: new Date().toISOString().slice(0, 16),
        TAHUN_INI: new Date().getFullYear(),
        BULAN_INI: new Date().getMonth()
    },
    JENIS_KUNJUNGAN: {
        BEROBAT: 'Berobat',
        KECELAKAAN: 'Kecelakaan Kerja',
        KONSULTASI: 'Konsultasi'
    }
};

// State global
export let namaPerusahaan = localStorage.getItem(CONFIG.STORAGE_KEYS.PERUSAHAAN) || '';
export let googleSheetsConfig = {
    enabled: true,
    url: 'https://script.google.com/macros/s/AKfycbwIhrhgZkIcXsv9gY5BSbxEXMTjT_J26NfZ8MNOtXCxs1B1GO8jigp7l3d0dsGlEefI/exec',
    syncEnabled: true
};

// Setters untuk state
export function setNamaPerusahaan(nama) {
    namaPerusahaan = nama;
    localStorage.setItem(CONFIG.STORAGE_KEYS.PERUSAHAAN, nama);
    
    // Update header jika ada
    const perusahaanElement = document.getElementById('namaPerusahaanHeader');
    if (perusahaanElement) {
        perusahaanElement.textContent = nama;
    }
    
    console.log('Nama perusahaan diperbarui:', nama);
    return nama;
}

export function setGoogleSheetsConfig(config) {
    googleSheetsConfig = { ...googleSheetsConfig, ...config };
    localStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CONFIG, JSON.stringify(googleSheetsConfig));
}

// Fungsi helper untuk update nama perusahaan
export function updateNamaPerusahaan(nama) {
    return setNamaPerusahaan(nama);
}