import { dataService } from './dataService.js';
import { BULAN_NAMES } from './config.js';
import { filterManager } from './filterManager.js';
import { chartManager } from './chartManager.js';
import { tableManager } from './tableManager.js';

export const uiManager = {
    initFilters() {
        const perusahaanSet = new Set();
        const departemenSet = new Set();
        const tahunSet = new Set();

        const allData = dataService.getAllData();

        allData.forEach(d => {
            if (d['Perusahaan']) perusahaanSet.add(d['Perusahaan']);
            if (d['Departemen']) departemenSet.add(d['Departemen']);
            
            // Ekstrak tahun dari timestamp
            if (d['TimeStamp']) {
                const date = new Date(d['TimeStamp']);
                if (!isNaN(date.getFullYear())) {
                    tahunSet.add(date.getFullYear().toString());
                }
            }
            
            // Coba ekstrak dari kolom Tanggal juga
            if (d['Tanggal']) {
                const dateParts = d['Tanggal'].split('-');
                if (dateParts.length >= 1) {
                    const year = dateParts[0];
                    if (year.length === 4) tahunSet.add(year);
                }
            }
        });

        // Urutkan tahun secara descending
        const sortedTahun = Array.from(tahunSet).sort((a, b) => b - a);

        // Update dropdown Perusahaan
        const fPerusahaan = document.getElementById('filterPerusahaan');
        if (fPerusahaan) {
            fPerusahaan.innerHTML = '<option value="all">Semua Perusahaan</option>';
            Array.from(perusahaanSet).sort().forEach(p => fPerusahaan.innerHTML += `<option value="${p}">${p}</option>`);
        }

        // Update dropdown Departemen dengan semua departemen awalnya
        const fDepartemen = document.getElementById('filterDepartemen');
        if (fDepartemen) {
            fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
            Array.from(departemenSet).sort().forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
        }

        // Update dropdown Tahun
        const fTahun = document.getElementById('filterTahun');
        if (fTahun) {
            fTahun.innerHTML = '<option value="all">Semua Tahun</option>';
            sortedTahun.forEach(t => fTahun.innerHTML += `<option value="${t}">${t}</option>`);
        }
    },

    updateDepartemenByPerusahaan() {
        const perusahaan = document.getElementById('filterPerusahaan')?.value;
        const fDepartemen = document.getElementById('filterDepartemen');
        
        if (!fDepartemen) return;
        
        if (perusahaan === 'all') {
            const allDepartemen = new Set();
            const allData = dataService.getAllData();
            
            allData.forEach(d => {
                if (d['Departemen']) allDepartemen.add(d['Departemen']);
            });
            
            fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
            Array.from(allDepartemen).sort().forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
        } else {
            const departemenByPerusahaan = new Set();
            const allData = dataService.getAllData();
            
            allData.forEach(d => {
                if (d['Perusahaan'] === perusahaan && d['Departemen']) {
                    departemenByPerusahaan.add(d['Departemen']);
                }
            });
            
            fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
            Array.from(departemenByPerusahaan).sort().forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
        }
        
        fDepartemen.value = 'all';
    },

    updateStatistics() {
        const allData = dataService.getAllFilteredData();
        const totalKunjungan = allData.length;
        
        // Update statistik utama
        this.updateElementText('statTotalKunjungan', totalKunjungan.toLocaleString());
        this.updateElementText('statBerobat', dataService.getFilteredBerobat().length.toLocaleString());
        this.updateElementText('statKecelakaan', dataService.getFilteredKecelakaan().length.toLocaleString());
        this.updateElementText('statKonsultasi', dataService.getFilteredKonsultasi().length.toLocaleString());
    },

    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    },

    updateDataRangeInfo() {
        const perusahaan = document.getElementById('filterPerusahaan')?.value;
        const departemen = document.getElementById('filterDepartemen')?.value;
        const tahun = document.getElementById('filterTahun')?.value;
        const bulan = document.getElementById('filterBulan')?.value;
        
        const dataRangeInfo = document.getElementById('dataRangeInfo');
        if (!dataRangeInfo) return;
        
        let info = "Menampilkan data: ";
        const parts = [];
        
        if (perusahaan !== 'all') parts.push(`Perusahaan: ${perusahaan}`);
        if (departemen !== 'all') parts.push(`Departemen: ${departemen}`);
        if (tahun !== 'all') parts.push(`Tahun: ${tahun}`);
        if (bulan !== 'all') {
            parts.push(`Bulan: ${BULAN_NAMES[parseInt(bulan)-1]}`);
        }
        
        if (parts.length === 0) {
            info += "Semua Data";
        } else {
            info += parts.join(", ");
        }
        
        dataRangeInfo.textContent = info;
    },

    async updateDashboard() {
        this.updateStatistics();
        chartManager.updateAllCharts();
        tableManager.updateAllTables();
        this.updateDataRangeInfo();
    },

    getCurrentFilterValues() {
        return {
            perusahaan: document.getElementById('filterPerusahaan')?.value || 'all',
            departemen: document.getElementById('filterDepartemen')?.value || 'all',
            tahun: document.getElementById('filterTahun')?.value || 'all',
            bulan: document.getElementById('filterBulan')?.value || 'all'
        };
    },

    async applyFilter() {
        const { perusahaan, departemen, tahun, bulan } = this.getCurrentFilterValues();
        filterManager.applyFilter(perusahaan, departemen, tahun, bulan);
        await this.updateDashboard();
    }
};