export const ObatManager = {
    dataObat: [],
    
    loadObatData: async () => {
        try {
            const response = await fetch('data/obat.json');
            ObatManager.dataObat = await response.json();
            return ObatManager.dataObat;
        } catch (error) {
            console.error('Gagal memuat data obat:', error);
            ObatManager.dataObat = [];
            return [];
        }
    },
    
    getObatByNama: (namaObat) => {
        return ObatManager.dataObat.find(obat => obat.nama === namaObat) || null;
    },
    
    getObatByKategori: (kategori) => {
        if (!kategori) return ObatManager.dataObat;
        return ObatManager.dataObat.filter(obat => obat.kategori === kategori);
    }
};