import { API_URL } from './config.js';

let rawData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };
let filteredData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };

export const dataService = {
    rawData,
    filteredData,

    async loadData() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            
            // Validasi struktur data
            this.rawData = {
                Berobat: Array.isArray(data.Berobat) ? data.Berobat : [],
                Kecelakaan: Array.isArray(data.Kecelakaan) ? data.Kecelakaan : [],
                Konsultasi: Array.isArray(data.Konsultasi) ? data.Konsultasi : []
            };
            
            console.log("Data loaded successfully:", {
                Berobat: this.rawData.Berobat.length,
                Kecelakaan: this.rawData.Kecelakaan.length,
                Konsultasi: this.rawData.Konsultasi.length
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
        this.filteredData = {
            Berobat: Array.isArray(newFilteredData.Berobat) ? newFilteredData.Berobat : [],
            Kecelakaan: Array.isArray(newFilteredData.Kecelakaan) ? newFilteredData.Kecelakaan : [],
            Konsultasi: Array.isArray(newFilteredData.Konsultasi) ? newFilteredData.Konsultasi : []
        };
    }
};