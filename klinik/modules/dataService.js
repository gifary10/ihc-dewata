import { API_URL } from './config.js';

let rawData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };
let filteredData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };

export const dataService = {
    rawData,
    filteredData,

    async loadData() {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            this.rawData = data;
            
            console.log("Data loaded successfully:", {
                Berobat: this.rawData.Berobat?.length || 0,
                Kecelakaan: this.rawData.Kecelakaan?.length || 0,
                Konsultasi: this.rawData.Konsultasi?.length || 0
            });
            
            return this.rawData;
        } catch (error) {
            console.error("Error loading data:", error);
            throw new Error("Gagal memuat data. Silakan coba lagi.");
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