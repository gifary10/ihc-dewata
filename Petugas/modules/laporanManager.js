import { GoogleSheetsAPI } from './googleSheets.js';
import { namaPerusahaan } from './config.js';
import { Formatter } from './utils.js';
import { TableBuilder } from './uiManager.js';
import { UI } from './uiManager.js';

export const Laporan = {
    async getFilteredData() {
        try {
            const allData = await this.fetchDataFromGoogleSheets();
            return this.filterLocalData(allData);
        } catch (error) {
            console.error("Error fetching data from Google Sheets:", error);
            UI.showNotification("Gagal memuat data dari Google Sheets", "danger");
            return [];
        }
    },

    async fetchDataFromGoogleSheets() {
        if (!GoogleSheetsAPI.isConfigured || !GoogleSheetsAPI.syncEnabled) {
            throw new Error("Google Sheets tidak dikonfigurasi atau sinkronisasi dinonaktifkan");
        }
        
        if (!GoogleSheetsAPI.WEB_APP_URL) {
            throw new Error("Google Sheets URL tidak dikonfigurasi");
        }
        
        console.log("Fetching data from Google Sheets...");
        
        const [berobatData, kecelakaanData, konsultasiData] = await Promise.all([
            this.fetchSheetData('berobat'),
            this.fetchSheetData('kecelakaan'),
            this.fetchSheetData('konsultasi')
        ]);
        
        const allData = [...berobatData, ...kecelakaanData, ...konsultasiData];
        console.log(`Total data fetched from Google Sheets: ${allData.length}`);
        
        return allData;
    },

    async fetchSheetData(sheetType) {
        try {
            const url = `${GoogleSheetsAPI.WEB_APP_URL}?action=getdata&sheet=${this.getSheetName(sheetType)}&timestamp=${Date.now()}`;
            
            console.log(`Fetching ${sheetType} data from:`, url.substring(0, 100) + "...");
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || "Failed to fetch data");
            }
            
            const convertedData = this.convertFromGoogleSheetsFormat(result.data, sheetType);
            console.log(`Fetched ${convertedData.length} ${sheetType} records`);
            
            return convertedData;
        } catch (error) {
            console.error(`Error fetching ${sheetType} data:`, error);
            throw error;
        }
    },

    getSheetName(sheetType) {
        const sheetNames = {
            'berobat': 'Berobat',
            'kecelakaan': 'Kecelakaan',
            'konsultasi': 'Konsultasi'
        };
        return sheetNames[sheetType] || sheetType;
    },

    convertFromGoogleSheetsFormat(googleData, sheetType) {
        if (!Array.isArray(googleData)) return [];
        
        return googleData.map(row => {
            const baseData = {
                perusahaan: row.Perusahaan || row.perusahaan || namaPerusahaan || '-',
                tanggal: row.Tanggal || row.tanggal || '-',
                waktu: `${row.Tanggal || row.tanggal || ''} ${row.Waktu || row.waktu || ''}`.trim(),
                nama: row.Nama || row.nama || '-',
                departemen: row.Departemen || row.departemen || '-',
                jenisKelamin: row['Jenis Kelamin'] || row.jenis_kelamin || '-',
                jenisKunjungan: row['Jenis Kunjungan'] || row.jenis_kunjungan || sheetType
            };
            
            switch(sheetType) {
                case 'berobat':
                    return {
                        ...baseData,
                        keluhan: row.Keluhan || row.keluhan || '-',
                        tindakan: row.Tindakan || row.tindakan || '-',
                        namaKategoriPenyakit: row['Kategori Diagnosa'] || row.kategori_diagnosa || '-',
                        namaPenyakit: row['Nama Penyakit'] || row.nama_penyakit || '-',
                        keteranganPenyakit: row['Keterangan Diagnosa'] || row.keterangan_diagnosa || '-',
                        obatKategori: row['Kategori Obat'] || row.kategori_obat || '-',
                        kategoriObat: row['Kategori Obat'] || row.kategori_obat || '-',
                        namaObat: row['Nama Obat'] || row.nama_obat || '-',
                        jumlahObat: row.Jumlah || row.jumlah_obat || '-',
                        satuanObat: row.Satuan || row.satuan_obat || 'Tablet',
                        aturanPakai: row['Aturan Pakai'] || row.aturan_pakai || '-',
                        perluIstirahat: row['Perlu Istirahat'] || row.perlu_istirahat || 'Tidak',
                        lamaIstirahat: row['Jumlah Hari SKD'] || row.lama_istirahat || '0',
                        keteranganSKD: row['Keterangan SKD'] || row.keterangan_skd || '-'
                    };
                    
                case 'kecelakaan':
                    return {
                        ...baseData,
                        lokasiKejadian: row['Lokasi Kejadian'] || row.lokasi_kejadian || '-',
                        deskripsiKejadian: row['Deskripsi Kejadian'] || row.deskripsi_kejadian || '-'
                    };
                    
                case 'konsultasi':
                    return {
                        ...baseData,
                        keluhan: row.Keluhan || row.keluhan || '-',
                        saran: row.Saran || row.saran || '-'
                    };
                    
                default:
                    return baseData;
            }
        });
    },

    filterLocalData(data) {
        const filters = {
            tahun: document.getElementById('filterTahun')?.value,
            bulan: document.getElementById('filterBulan')?.value,
            dept: document.getElementById('filterDept')?.value,
            nama: document.getElementById('searchNama')?.value?.toLowerCase()
        };
        
        let filteredData = [...data];
        
        // Filter berdasarkan perusahaan yang dipilih (jika ada)
        if (namaPerusahaan) {
            filteredData = filteredData.filter(item => 
                (item.perusahaan === namaPerusahaan || 
                 item.Perusahaan === namaPerusahaan) &&
                item.perusahaan !== ''
            );
        }
        
        // Filter berdasarkan tahun
        if (filters.tahun) {
            const selectedYear = parseInt(filters.tahun);
            filteredData = filteredData.filter(item => {
                if (!item.tanggal) return false;
                const itemDate = new Date(item.tanggal);
                return itemDate.getFullYear() === selectedYear;
            });
        }
        
        // Filter berdasarkan bulan
        if (filters.bulan && filters.bulan !== 'all') {
            const selectedMonth = parseInt(filters.bulan);
            filteredData = filteredData.filter(item => {
                if (!item.tanggal) return false;
                const itemDate = new Date(item.tanggal);
                return itemDate.getMonth() === selectedMonth;
            });
        }
        
        if (filters.dept) {
            filteredData = filteredData.filter(item => item.departemen === filters.dept);
        }
        
        if (filters.nama) {
            filteredData = filteredData.filter(item => 
                item.nama && item.nama.toLowerCase().includes(filters.nama)
            );
        }
        
        filteredData.sort((a, b) => {
            const dateA = new Date(a.waktu || a.tanggal);
            const dateB = new Date(b.waktu || b.tanggal);
            return dateB - dateA;
        });
        
        return filteredData;
    },

    async tampilkan() {
        try {
            // Tampilkan notification memuat data
            UI.showNotification('Memuat data laporan...', 'info');
            
            const filteredData = await this.getFilteredData();
            TableBuilder.populateTables(filteredData);
            
            this.displayFilterInfo();
            
            // Tampilkan notification sukses
            UI.showNotification(`Laporan berhasil dimuat (${filteredData.length} data)`, 'success');
            
        } catch (error) {
            console.error("Error displaying report:", error);
            UI.showNotification("Gagal memuat data dari Google Sheets", "danger");
        }
    },
    
    displayFilterInfo: () => {
        const tahun = document.getElementById('filterTahun')?.value;
        const bulan = document.getElementById('filterBulan')?.value;
        const dept = document.getElementById('filterDept')?.value;
        
        const bulanNama = {
            '0': 'Januari', '1': 'Februari', '2': 'Maret', '3': 'April',
            '4': 'Mei', '5': 'Juni', '6': 'Juli', '7': 'Agustus',
            '8': 'September', '9': 'Oktober', '10': 'November', '11': 'Desember',
            'all': 'Semua Bulan'
        };
        
        let infoText = `Perusahaan: ${namaPerusahaan || '(belum dipilih)'}`;
        
        if (tahun) {
            infoText += ` | Tahun ${tahun}`;
        }
        
        if (bulan && bulan !== 'all') {
            infoText += `, ${bulanNama[bulan]}`;
        }
        
        if (dept) {
            infoText += ` | Departemen ${dept}`;
        }
        
        let infoElement = document.getElementById('filterInfo');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'filterInfo';
            infoElement.className = 'filter-info';
            
            const laporanCard = document.querySelector('#laporan .card-body');
            if (laporanCard) {
                const filterSection = laporanCard.querySelector('.row.mb-4');
                if (filterSection) {
                    filterSection.parentNode.insertBefore(infoElement, filterSection.nextSibling);
                }
            }
        }
        
        infoElement.innerHTML = `<i class="bi bi-funnel"></i> Filter aktif: ${infoText}`;
    },

    async refresh() {
        try {
            UI.showNotification("Memuat data terbaru dari Google Sheets...", "info");
            await this.tampilkan();
        } catch (error) {
            console.error("Error refreshing report:", error);
            UI.showNotification("Gagal memuat data terbaru", "danger");
        }
    }
};