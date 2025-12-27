// penyakitManager.js - Pastikan data dimuat dengan benar
export const PenyakitManager = {
    dataPenyakit: [],
    
    loadPenyakitData: async () => {
        try {
            const response = await fetch('data/penyakit.json');
            const data = await response.json();
            PenyakitManager.dataPenyakit = data.categories;
            
            // Debug: Tampilkan data yang dimuat
            console.log('Data penyakit dimuat:', PenyakitManager.dataPenyakit.length, 'kategori');
            
            return PenyakitManager.dataPenyakit;
        } catch (error) {
            console.error('Gagal memuat data penyakit:', error);
            PenyakitManager.dataPenyakit = [];
            return [];
        }
    },
    
    getKategoriById: (kategoriId) => {
        const id = parseInt(kategoriId);
        return PenyakitManager.dataPenyakit.find(k => k.id === id) || null;
    },
    
    getDiagnosesByKategoriId: (kategoriId) => {
        const kategori = PenyakitManager.getKategoriById(kategoriId);
        return kategori ? kategori.diagnoses : [];
    }
};

// Ekspos ke window untuk debugging
window.PenyakitManager = PenyakitManager;