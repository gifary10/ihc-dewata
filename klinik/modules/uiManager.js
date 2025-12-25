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
        fPerusahaan.innerHTML = '<option value="all">Semua Perusahaan</option>';
        perusahaanSet.forEach(p => fPerusahaan.innerHTML += `<option value="${p}">${p}</option>`);

        // Update dropdown Departemen dengan semua departemen awalnya
        const fDepartemen = document.getElementById('filterDepartemen');
        fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
        departemenSet.forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);

        // Update dropdown Tahun
        const fTahun = document.getElementById('filterTahun');
        fTahun.innerHTML = '<option value="all">Semua Tahun</option>';
        sortedTahun.forEach(t => fTahun.innerHTML += `<option value="${t}">${t}</option>`);
    },

    updateDepartemenByPerusahaan() {
        const perusahaan = document.getElementById('filterPerusahaan').value;
        const fDepartemen = document.getElementById('filterDepartemen');
        
        if (perusahaan === 'all') {
            const allDepartemen = new Set();
            const allData = dataService.getAllData();
            
            allData.forEach(d => {
                if (d['Departemen']) allDepartemen.add(d['Departemen']);
            });
            
            fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
            allDepartemen.forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
        } else {
            const departemenByPerusahaan = new Set();
            const allData = dataService.getAllData();
            
            allData.forEach(d => {
                if (d['Perusahaan'] === perusahaan && d['Departemen']) {
                    departemenByPerusahaan.add(d['Departemen']);
                }
            });
            
            fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
            departemenByPerusahaan.forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
        }
        
        fDepartemen.value = 'all';
    },

    updateStatistics() {
        const allData = dataService.getAllFilteredData();
        
        // Hitung statistik dasar
        const totalLaki = allData.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length;
        const totalPerempuan = allData.filter(d => d['Jenis Kelamin'] === 'Perempuan').length;
        const totalKunjungan = allData.length;
        
        // Hitung total SKD dari data Berobat
        const totalSKD = dataService.getFilteredBerobat().filter(d => 
            d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya'
        ).length;
        
        // Update statistik utama
        document.getElementById('statTotalLaki').textContent = totalLaki.toLocaleString();
        document.getElementById('statTotalPerempuan').textContent = totalPerempuan.toLocaleString();
        document.getElementById('statTotalSKD').textContent = totalSKD.toLocaleString();
        document.getElementById('statTotalKunjungan').textContent = totalKunjungan.toLocaleString();
        
        // Update statistik jenis kunjungan
        document.getElementById('statBerobat').textContent = dataService.getFilteredBerobat().length.toLocaleString();
        document.getElementById('statKecelakaan').textContent = dataService.getFilteredKecelakaan().length.toLocaleString();
        document.getElementById('statKonsultasi').textContent = dataService.getFilteredKonsultasi().length.toLocaleString();
    },

    updateDataRangeInfo() {
        const perusahaan = document.getElementById('filterPerusahaan').value;
        const departemen = document.getElementById('filterDepartemen').value;
        const tahun = document.getElementById('filterTahun').value;
        const bulan = document.getElementById('filterBulan').value;
        
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
        
        document.getElementById('dataRangeInfo').textContent = info;
    },

    async updateDashboard() {
        this.updateStatistics();
        chartManager.updateAllCharts();
        tableManager.updateAllTables();
        this.updateDataRangeInfo();
    },

    resetFilter() {
        document.getElementById('filterPerusahaan').value = 'all';
        document.getElementById('filterDepartemen').value = 'all';
        document.getElementById('filterTahun').value = 'all';
        document.getElementById('filterBulan').value = 'all';
        
        this.updateDepartemenByPerusahaan();
    },

    getCurrentFilterValues() {
        return {
            perusahaan: document.getElementById('filterPerusahaan').value,
            departemen: document.getElementById('filterDepartemen').value,
            tahun: document.getElementById('filterTahun').value,
            bulan: document.getElementById('filterBulan').value
        };
    },

    // Method untuk mengelola loading tombol PDF
    async applyFilter() {
        const { perusahaan, departemen, tahun, bulan } = this.getCurrentFilterValues();
        filterManager.applyFilter(perusahaan, departemen, tahun, bulan);
        await this.updateDashboard();
    },

    // Method untuk toggle loading tombol PDF
    togglePDFLoading(show) {
        const btn = document.getElementById('btnDownloadPDF');
        if (!btn) return;

        if (show) {
            if (!btn.querySelector('.mini-loading')) {
                const spinner = document.createElement('span');
                spinner.className = 'mini-loading';
                btn.appendChild(spinner);
                btn.disabled = true;
            }
        } else {
            const spinner = btn.querySelector('.mini-loading');
            if (spinner) {
                spinner.remove();
                btn.disabled = false;
            }
        }
    }
};
