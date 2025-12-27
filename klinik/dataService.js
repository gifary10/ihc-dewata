import { API_URL } from './config.js';

let rawData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };
let filteredData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };

export const dataService = {
    rawData,
    filteredData,

    async loadData() {
        try {
            console.log('Memulai proses pengambilan data dari:', API_URL);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout 30 detik
            
            const res = await fetch(API_URL, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            console.log('Data mentah diterima:', data);
            
            // Validasi dan sanitize data
            this.rawData = {
                Berobat: this.sanitizeData(Array.isArray(data.Berobat) ? data.Berobat : []),
                Kecelakaan: this.sanitizeData(Array.isArray(data.Kecelakaan) ? data.Kecelakaan : []),
                Konsultasi: this.sanitizeData(Array.isArray(data.Konsultasi) ? data.Konsultasi : [])
            };
            
            console.log("Data berhasil dimuat:", {
                Berobat: this.rawData.Berobat.length,
                Kecelakaan: this.rawData.Kecelakaan.length,
                Konsultasi: this.rawData.Konsultasi.length,
                Total: this.getAllData().length
            });
            
            // Reset filtered data ke semua data
            this.filteredData = { ...this.rawData };
            
            return this.rawData;
        } catch (error) {
            console.error("Error loading data:", error);
            
            if (error.name === 'AbortError') {
                throw new Error("Permintaan data timeout. Silakan coba lagi.");
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error("Gagal terhubung ke server. Periksa koneksi internet Anda.");
            } else {
                throw new Error(`Gagal memuat data: ${error.message}`);
            }
        }
    },

    // Fungsi untuk sanitize data
    sanitizeData(dataArray) {
        if (!Array.isArray(dataArray)) {
            console.warn('Data bukan array, mengembalikan array kosong');
            return [];
        }
        
        return dataArray.map((item, index) => {
            const sanitized = {};
            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    // Konversi nilai null/undefined ke string kosong
                    let value = item[key];
                    if (value === null || value === undefined) {
                        value = '';
                    }
                    
                    // Konversi ke string jika bukan string
                    if (typeof value !== 'string') {
                        value = String(value);
                    }
                    
                    // Trim whitespace
                    value = value.trim();
                    
                    sanitized[key] = value;
                }
            }
            
            // Tambahkan ID unik jika tidak ada
            if (!sanitized['_id']) {
                sanitized['_id'] = `row_${index}_${Date.now()}`;
            }
            
            return sanitized;
        }).filter(item => {
            // Filter out completely empty rows
            return Object.values(item).some(value => value && value.trim() !== '');
        });
    },

    getAllData() {
        try {
            return [
                ...(this.rawData.Berobat || []),
                ...(this.rawData.Kecelakaan || []),
                ...(this.rawData.Konsultasi || [])
            ];
        } catch (error) {
            console.error('Error getting all data:', error);
            return [];
        }
    },

    getAllFilteredData() {
        try {
            return [
                ...(this.filteredData.Berobat || []),
                ...(this.filteredData.Kecelakaan || []),
                ...(this.filteredData.Konsultasi || [])
            ];
        } catch (error) {
            console.error('Error getting filtered data:', error);
            return [];
        }
    },

    getFilteredBerobat() {
        return this.filteredData.Berobat || [];
    },

    getFilteredKecelakaan() {
        return this.filteredData.Kecelakaan || [];
    },

    getFilteredKonsultasi() {
        return this.filteredData.Konsultasi || [];
    },

    setFilteredData(newFilteredData) {
        this.filteredData = {
            Berobat: Array.isArray(newFilteredData.Berobat) ? newFilteredData.Berobat : [],
            Kecelakaan: Array.isArray(newFilteredData.Kecelakaan) ? newFilteredData.Kecelakaan : [],
            Konsultasi: Array.isArray(newFilteredData.Konsultasi) ? newFilteredData.Konsultasi : []
        };
        
        console.log('Filtered data updated:', {
            Berobat: this.filteredData.Berobat.length,
            Kecelakaan: this.filteredData.Kecelakaan.length,
            Konsultasi: this.filteredData.Konsultasi.length
        });
    }
};