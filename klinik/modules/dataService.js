import { API_URL } from './config.js';

let rawData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };
let filteredData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };

export const dataService = {
    rawData,
    filteredData,

    async loadData() {
        try {
            console.log("Loading data from API...");
            
            // Load data dari setiap sheet secara terpisah
            const [berobatData, kecelakaanData, konsultasiData] = await Promise.all([
                this.loadSheetData('Berobat'),
                this.loadSheetData('Kecelakaan'),
                this.loadSheetData('Konsultasi')
            ]);
            
            this.rawData = {
                Berobat: berobatData,
                Kecelakaan: kecelakaanData,
                Konsultasi: konsultasiData
            };
            
            console.log("Data loaded successfully:", {
                Berobat: this.rawData.Berobat?.length || 0,
                Kecelakaan: this.rawData.Kecelakaan?.length || 0,
                Konsultasi: this.rawData.Konsultasi?.length || 0,
                source: 'ok.gs API'
            });
            
            return this.rawData;
        } catch (error) {
            console.error("Error loading data:", error);
            throw new Error("Gagal memuat data. Silakan coba lagi atau periksa koneksi.");
        }
    },

    async loadSheetData(sheetName) {
        try {
            // Menggunakan parameter action=getdata untuk ok.gs dengan sheet name
            const url = `${API_URL}?action=getdata&sheet=${sheetName}&timestamp=${Date.now()}`;
            console.log(`Loading ${sheetName} data from:`, url);
            
            const res = await fetch(url);
            
            if (!res.ok) {
                console.warn(`Failed to load ${sheetName}: HTTP ${res.status}`);
                return [];
            }
            
            const data = await res.json();
            
            if (data.success && data.data) {
                console.log(`${sheetName} data loaded:`, data.data.length, "records");
                return this.cleanSheetData(data.data, sheetName);
            } else {
                console.warn(`No data found for ${sheetName}`);
                return [];
            }
        } catch (error) {
            console.error(`Error loading ${sheetName}:`, error);
            return [];
        }
    },

    // Bersihkan dan format data dari sheet
    cleanSheetData(data, sheetName) {
        if (!Array.isArray(data)) return [];
        
        return data.map(item => {
            // Normalize field names based on sheet type
            const cleanedItem = { ...item };
            
            // Add sheet type for filtering
            cleanedItem['SheetType'] = sheetName;
            
            // Standardize field names
            if (sheetName === 'Berobat') {
                // Handle different field name variations
                if (item['Jenis Kunjungan'] === undefined && item['JenisKunjungan']) {
                    cleanedItem['Jenis Kunjungan'] = item['JenisKunjungan'];
                }
                if (item['Perlu Istirahat'] === undefined && item['PerluIstirahat']) {
                    cleanedItem['Perlu Istirahat'] = item['PerluIstirahat'];
                }
                if (item['Jumlah Hari SKD'] === undefined && item['JumlahHariSKD']) {
                    cleanedItem['Jumlah Hari SKD'] = item['JumlahHariSKD'];
                }
                // Add SKD flag for berobat data
                if (item['Perlu Istirahat'] && item['Perlu Istirahat'].toString().toLowerCase() === 'ya') {
                    cleanedItem['SKD'] = 'Ya';
                } else {
                    cleanedItem['SKD'] = 'Tidak';
                }
            }
            
            // Ensure required fields exist
            if (!cleanedItem['Jenis Kunjungan']) {
                if (sheetName === 'Berobat') cleanedItem['Jenis Kunjungan'] = 'Berobat';
                if (sheetName === 'Kecelakaan') cleanedItem['Jenis Kunjungan'] = 'Kecelakaan Kerja';
                if (sheetName === 'Konsultasi') cleanedItem['Jenis Kunjungan'] = 'Konsultasi';
            }
            
            return cleanedItem;
        });
    },

    // Test connection to ok.gs API
    async testConnection() {
        try {
            const url = `${API_URL}?action=test`;
            const res = await fetch(url);
            const data = await res.json();
            console.log("Connection test result:", data);
            return data;
        } catch (error) {
            console.error("Connection test failed:", error);
            return { success: false, error: error.message };
        }
    },

    getAllData() {
        return [
            ...(this.rawData.Berobat || []),
            ...(this.rawData.Kecelakaan || []),
            ...(this.rawData.Konsultasi || [])
        ];
    },

    getAllFilteredData() {
        return [
            ...(this.filteredData.Berobat || []),
            ...(this.filteredData.Kecelakaan || []),
            ...(this.filteredData.Konsultasi || [])
        ];
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
        this.filteredData = newFilteredData;
    }
};