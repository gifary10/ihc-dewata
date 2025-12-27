import { dataService } from './dataService.js';

export const tableManager = {
    updateAllTables() {
        this.updateDepartmentStats();
        this.updateTopPenyakit();
        this.updateTopObat();
        this.updateSKDTable();
    },

    updateDepartmentStats() {
        const container = document.getElementById('departmentStats');
        const allData = dataService.getAllFilteredData();
        
        // Hitung statistik per departemen
        const deptStats = {};
        allData.forEach(d => {
            const dept = d['Departemen'] || 'Tidak Diketahui';
            if (!deptStats[dept]) {
                deptStats[dept] = {
                    total: 0,
                    berobat: 0,
                    kecelakaan: 0,
                    konsultasi: 0
                };
            }
            deptStats[dept].total++;
            
            // Tentukan jenis kunjungan berdasarkan Jenis Kunjungan atau SheetType
            const jenisKunjungan = d['Jenis Kunjungan'] || '';
            const sheetType = d['SheetType'] || '';
            
            if (jenisKunjungan.includes('Berobat') || sheetType === 'Berobat') {
                deptStats[dept].berobat++;
            } else if (jenisKunjungan.includes('Kecelakaan') || sheetType === 'Kecelakaan') {
                deptStats[dept].kecelakaan++;
            } else if (jenisKunjungan.includes('Konsultasi') || sheetType === 'Konsultasi') {
                deptStats[dept].konsultasi++;
            }
        });
        
        // Ubah ke array dan urutkan
        const sortedStats = Object.entries(deptStats)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 8); // Ambil top 8
        
        if (sortedStats.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-bar-chart"></i>
                    <p>Data tidak tersedia</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        sortedStats.forEach(([dept, stats], index) => {
            html += `
                <div class="department-row">
                    <div class="department-name">${dept}</div>
                    <div class="department-stats">
                        <span>Total: <strong>${stats.total}</strong></span>
                        <span>B:${stats.berobat} K:${stats.kecelakaan} C:${stats.konsultasi}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    updateTopPenyakit() {
        const container = document.getElementById('topPenyakit');
        const penyakitCounts = {};
        
        // Hitung frekuensi diagnosa dari data Berobat
        dataService.getFilteredBerobat().forEach(d => {
            // Coba beberapa kemungkinan field name
            const diagnosa = d['Nama Penyakit'] || d['Keterangan Diagnosa'] || d['Diagnosa'] || 'Tidak Diketahui';
            if (diagnosa && diagnosa !== '-' && diagnosa !== '') {
                penyakitCounts[diagnosa] = (penyakitCounts[diagnosa] || 0) + 1;
            }
        });
        
        // Urutkan dan ambil top 10
        const topPenyakit = Object.entries(penyakitCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (topPenyakit.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-clipboard-data"></i>
                    <p>Data tidak tersedia</p>
                </div>
            `;
            return;
        }
        
        let html = '<ul class="top-list">';
        topPenyakit.forEach(([penyakit, count], index) => {
            const rank = index + 1;
            html += `
                <li>
                    <div class="rank">${rank}</div>
                    <div class="item-name">${penyakit}</div>
                    <div class="item-count">${count}</div>
                </li>
            `;
        });
        html += '</ul>';
        
        container.innerHTML = html;
    },

    updateTopObat() {
        const container = document.getElementById('topObat');
        const obatCounts = {};
        
        // Hitung frekuensi obat dari data Berobat
        dataService.getFilteredBerobat().forEach(d => {
            const obat = d['Nama Obat'] || 'Tidak Diketahui';
            if (obat && obat !== '-' && obat !== '') {
                // Pisahkan jika ada beberapa obat
                const obatList = obat.split(',').map(o => o.trim());
                obatList.forEach(o => {
                    if (o && o !== '-') {
                        obatCounts[o] = (obatCounts[o] || 0) + 1;
                    }
                });
            }
        });
        
        // Urutkan dan ambil top 10
        const topObat = Object.entries(obatCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (topObat.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-capsule"></i>
                    <p>Data tidak tersedia</p>
                </div>
            `;
            return;
        }
        
        let html = '<ul class="top-list">';
        topObat.forEach(([obat, count], index) => {
            const rank = index + 1;
            html += `
                <li>
                    <div class="rank">${rank}</div>
                    <div class="item-name">${obat}</div>
                    <div class="item-count">${count}</div>
                </li>
            `;
        });
        html += '</ul>';
        
        container.innerHTML = html;
    },

    updateSKDTable() {
        const tbody = document.getElementById('skdTableBody');
        const allData = dataService.getAllFilteredData();
        
        // Hitung statistik SKD per departemen
        const deptSKDStats = {};
        
        allData.forEach(d => {
            const dept = d['Departemen'] || 'Tidak Diketahui';
            if (!deptSKDStats[dept]) {
                deptSKDStats[dept] = {
                    total: 0,
                    skd: 0,
                    skdLaki: 0,
                    skdPerempuan: 0
                };
            }
            deptSKDStats[dept].total++;
            
            // Cek SKD hanya untuk data Berobat
            const isBerobat = d['Jenis Kunjungan']?.includes('Berobat') || d['SheetType'] === 'Berobat';
            if (isBerobat) {
                // Cek SKD dari field 'Perlu Istirahat' atau 'SKD'
                const isSKD = (d['Perlu Istirahat'] && d['Perlu Istirahat'].toString().toLowerCase() === 'ya') ||
                             (d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya');
                
                if (isSKD) {
                    deptSKDStats[dept].skd++;
                    
                    // Hitung berdasarkan jenis kelamin
                    const jk = d['Jenis Kelamin'] || '';
                    if (jk.includes('Laki') || jk.includes('Laki-laki')) {
                        deptSKDStats[dept].skdLaki++;
                    } else if (jk.includes('Perempuan')) {
                        deptSKDStats[dept].skdPerempuan++;
                    }
                }
            }
        });
        
        // Ubah ke array dan urutkan
        const sortedDepts = Object.entries(deptSKDStats)
            .sort((a, b) => b[1].total - a[1].total);
        
        if (sortedDepts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">Data tidak tersedia</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        sortedDepts.forEach(([dept, stats]) => {
            const persentaseSKD = stats.total > 0 ? ((stats.skd / stats.total) * 100).toFixed(1) : '0.0';
            
            html += `
                <tr>
                    <td>${dept}</td>
                    <td>${stats.total}</td>
                    <td>${stats.skd}</td>
                    <td>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${persentaseSKD}%" 
                                 aria-valuenow="${persentaseSKD}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100"></div>
                        </div>
                        <small class="chart-label">${persentaseSKD}%</small>
                    </td>
                    <td>${stats.skdLaki}</td>
                    <td>${stats.skdPerempuan}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
};