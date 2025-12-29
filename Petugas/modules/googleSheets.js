import { CONFIG, googleSheetsConfig, namaPerusahaan } from './config.js';

export const GoogleSheetsAPI = {
    isConfigured: true,
    syncEnabled: true,
    WEB_APP_URL: googleSheetsConfig.url,
    
    configure: function(config) {
        this.isConfigured = true;
        this.syncEnabled = true;
        console.log("Google Sheets API configured with hardcoded URL");
        return true;
    },
    
    sendData: async function(type, data) {
        if (!this.isConfigured || !this.syncEnabled) {
            console.log("Google Sheets sync disabled or not configured");
            throw new Error("Google Sheets tidak dikonfigurasi atau sinkronisasi dinonaktifkan");
        }
        
        try {
            const sheetData = this.prepareDataForSheets(type, data);
            console.log("Data untuk Google Sheets:", sheetData);
            
            return await this.sendViaPostRequest(type, sheetData);
            
        } catch (error) {
            console.error("Gagal mengirim ke Google Sheets:", error);
            throw new Error(`Gagal mengirim ke Google Sheets: ${error.message}`);
        }
    },
    
    prepareDataForSheets: function(type, data) {
        const baseData = {
            perusahaan: data.perusahaan || namaPerusahaan || '-',
            tanggal: data.tanggal || '-',
            waktu: data.waktu || '-',
            nama: data.nama || '-',
            departemen: data.departemen || '-',
            jenisKelamin: data.jenisKelamin || '-',
            jenisKunjungan: data.jenisKunjungan || type || '-',
            timestamp: new Date().toISOString()
        };
        
        switch(type) {
            case 'berobat':
                return {
                    ...baseData,
                    keluhan: data.keluhan || '-',
                    tindakan: data.tindakan || '-',
                    kategoriDiagnosa: data.namaKategoriPenyakit || '-',
                    namaPenyakit: data.namaPenyakit || '-',
                    keteranganDiagnosa: data.keteranganPenyakit || '-',
                    kategoriObat: data.obatKategori || data.kategoriObat || '-',
                    namaObat: data.namaObat || '-',
                    jumlahObat: data.jumlahObat || '-',
                    satuanObat: data.satuanObat || 'Tablet',
                    aturanPakai: data.aturanPakai || '-',
                    perluIstirahat: data.perluIstirahat || 'Tidak',
                    lamaIstirahat: data.lamaIstirahat || '0',
                    keteranganSKD: data.keteranganSKD || '-'
                };
                
            case 'kecelakaan':
                return {
                    ...baseData,
                    lokasiKejadian: data.lokasiKejadian || '-',
                    deskripsiKejadian: data.deskripsiKejadian || '-'
                };
                
            case 'konsultasi':
                return {
                    ...baseData,
                    keluhan: data.keluhan || '-',
                    saran: data.saran || '-'
                };
                
            default:
                return baseData;
        }
    },
    
    sendViaPostRequest: async function(type, data) {
        try {
            console.log("Mengirim data menggunakan metode POST");
            
            // Persiapkan payload untuk POST
            const payload = {
                action: 'save',
                type: type,
                ...data
            };
            
            console.log("Payload data:", payload);
            
            // Pastikan URL benar
            const url = this.WEB_APP_URL;
            console.log("URL tujuan:", url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            // Gunakan POST request dengan JSON
            const response = await fetch(url, {
                method: 'POST',
                mode: 'no-cors', // Menggunakan 'no-cors' karena Google Apps Script
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Karena menggunakan no-cors, kita tidak bisa membaca response
            // Tapi kita asumsikan berhasil jika tidak ada error
            console.log("Request berhasil dikirim (no-cors mode)");
            
            return { 
                success: true, 
                message: "Data berhasil dikirim ke Google Sheets" 
            };
            
        } catch (error) {
            console.error("POST request error:", error);
            if (error.name === 'AbortError') {
                throw new Error("Timeout: Gagal mengirim data (timeout 15 detik)");
            }
            
            // Coba metode alternatif menggunakan GET jika POST gagal
            console.log("Mencoba metode GET sebagai fallback...");
            return await this.sendViaGetRequest(type, data);
        }
    },
    
    sendViaGetRequest: async function(type, data) {
        try {
            console.log("Mengirim data menggunakan metode GET (fallback)");
            
            const params = new URLSearchParams();
            params.append('action', 'save');
            params.append('type', type);
            
            // Tambahkan semua data sebagai parameter
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    params.append(key, data[key].toString().trim());
                }
            });
            
            params.append('unique_id', new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9));
            
            const url = `${this.WEB_APP_URL}?${params.toString()}`;
            console.log("GET URL length:", url.length);
            console.log("URL parameter contoh:", url.substring(0, 200) + "...");
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log("GET request berhasil dikirim");
            
            return { 
                success: true, 
                message: "Data berhasil dikirim ke Google Sheets (GET method)" 
            };
            
        } catch (error) {
            console.error("GET request error:", error);
            throw new Error(`Gagal mengirim data: ${error.message}`);
        }
    },
    
    testConnection: async function() {
        if (!this.isConfigured) {
            return { success: false, message: "API not configured" };
        }
        
        try {
            const testUrl = `${this.WEB_APP_URL}?action=test&timestamp=${Date.now()}`;
            console.log("Testing connection to:", testUrl);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(testUrl, { 
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return { 
                success: true, 
                message: "Koneksi Google Sheets berhasil" 
            };
        } catch (error) {
            return { 
                success: false, 
                message: `Koneksi gagal: ${error.message}` 
            };
        }
    },
    
    getConfig: function() {
        return { 
            enabled: true,
            url: this.WEB_APP_URL,
            syncEnabled: true
        };
    },
    
    toggleSync: function(enabled) {
        this.syncEnabled = enabled !== false;
        googleSheetsConfig.syncEnabled = this.syncEnabled;
        localStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CONFIG, JSON.stringify(googleSheetsConfig));
        return this.syncEnabled;
    }
};