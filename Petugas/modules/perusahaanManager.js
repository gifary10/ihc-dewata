import { namaPerusahaan } from './config.js';

export const PerusahaanManager = {
    dataPerusahaan: [],
    
    loadPerusahaanData: async () => {
        try {
            const response = await fetch('data/data.json');
            PerusahaanManager.dataPerusahaan = await response.json();
            console.log('Data perusahaan dimuat:', PerusahaanManager.dataPerusahaan);
            return PerusahaanManager.dataPerusahaan;
        } catch (error) {
            console.error('Gagal memuat data perusahaan:', error);
            PerusahaanManager.dataPerusahaan = [];
            return [];
        }
    },
    
    getDepartemenByPerusahaan: (namaPerusahaan) => {
        console.log('getDepartemenByPerusahaan mencari:', namaPerusahaan);
        console.log('Data perusahaan yang tersedia:', PerusahaanManager.dataPerusahaan);
        
        const perusahaan = PerusahaanManager.dataPerusahaan.find(
            p => p.nama_perusahaan === namaPerusahaan
        );
        
        console.log('Perusahaan ditemukan:', perusahaan);
        return perusahaan ? perusahaan.departemen : [];
    },
    
    getSelectedPerusahaanDepartemen: () => {
        console.log('getSelectedPerusahaanDepartemen dipanggil, namaPerusahaan:', namaPerusahaan);
        return PerusahaanManager.getDepartemenByPerusahaan(namaPerusahaan);
    },
    
    getAllDepartemen: () => {
        const allDepartemen = new Set();
        PerusahaanManager.dataPerusahaan.forEach(perusahaan => {
            if (perusahaan.departemen && Array.isArray(perusahaan.departemen)) {
                perusahaan.departemen.forEach(dept => {
                    if (dept && dept.trim() !== '') {
                        allDepartemen.add(dept.trim());
                    }
                });
            }
        });
        const sorted = Array.from(allDepartemen).sort();
        console.log('Semua departemen unik:', sorted);
        return sorted;
    }
};