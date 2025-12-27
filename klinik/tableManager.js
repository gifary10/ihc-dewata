import { dataService } from './dataService.js';

export const tableManager = {
    updateAllTables() {
        try {
            this.updateDepartmentStats();
            this.updateTopPenyakit();
            this.updateTopObat();
            this.updateSKDTable();
        } catch (error) {
            console.error('Error updating tables:', error);
        }
    },

    updateDepartmentStats() {
        const container = document.getElementById('departmentStats');
        if (!container) {
            console.warn('Container departmentStats tidak ditemukan');
            return;
        }
        
        const allData = dataService.getAllFilteredData();
        
        // Hitung statistik per departemen
        const deptStats = {};
        allData.forEach(d => {
            const dept = d['Departemen'] || 'Tidak Diketahui';
            if (!deptStats[dept]) {
                deptStats[dept] = { total: 0 };
            }
            deptStats[dept].total++;
        });
        
        // Ubah ke array dan urutkan
        const sortedStats = Object.entries(deptStats)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 8);
        
        if (sortedStats.length === 0) {
            container.innerHTML = this.createNoDataHTML('bi-bar-chart', 'Data tidak tersedia');
            return;
        }
        
        let html = '';
        sortedStats.forEach(([dept, stats]) => {
            html += `
                <div class="department-row">
                    <div class="department-name">${this.escapeHtml(dept)}</div>
                    <div class="department-stats">
                        <span>Total: <strong>${stats.total}</strong></span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    updateTopPenyakit() {
        const container = document.getElementById('topPenyakit');
        if (!container) {
            console.warn('Container topPenyakit tidak ditemukan');
            return;
        }
        
        const penyakitCounts = {};
        
        dataService.getFilteredBerobat().forEach(d => {
            const diagnosa = d['Diagnosa'] || d['Keterangan Diagnosa'] || 'Tidak Diketahui';
            if (diagnosa && diagnosa !== '-') {
                penyakitCounts[diagnosa] = (penyakitCounts[diagnosa] || 0) + 1;
            }
        });
        
        const topPenyakit = Object.entries(penyakitCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (topPenyakit.length === 0) {
            container.innerHTML = this.createNoDataHTML('bi-clipboard-data', 'Data tidak tersedia');
            return;
        }
        
        container.innerHTML = this.createTopListHTML(topPenyakit);
    },

    updateTopObat() {
        const container = document.getElementById('topObat');
        if (!container) {
            console.warn('Container topObat tidak ditemukan');
            return;
        }
        
        const obatCounts = {};
        
        dataService.getFilteredBerobat().forEach(d => {
            const obat = d['Nama Obat'] || 'Tidak Diketahui';
            if (obat && obat !== '-') {
                const obatList = obat.split(',').map(o => o.trim());
                obatList.forEach(o => {
                    if (o && o !== '-') {
                        obatCounts[o] = (obatCounts[o] || 0) + 1;
                    }
                });
            }
        });
        
        const topObat = Object.entries(obatCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (topObat.length === 0) {
            container.innerHTML = this.createNoDataHTML('bi-capsule', 'Data tidak tersedia');
            return;
        }
        
        container.innerHTML = this.createTopListHTML(topObat);
    },

    updateSKDTable() {
        const tbody = document.getElementById('skdTableBody');
        if (!tbody) {
            console.warn('Tabel SKD tidak ditemukan');
            return;
        }
        
        const allData = dataService.getAllFilteredData();
        
        const deptSKDStats = {};
        
        allData.forEach(d => {
            const dept = d['Departemen'] || 'Tidak Diketahui';
            if (!deptSKDStats[dept]) {
                deptSKDStats[dept] = { total: 0, skd: 0 };
            }
            deptSKDStats[dept].total++;
            
            if (d['Jenis Kunjungan'] && d['Jenis Kunjungan'].toString().toLowerCase().includes('berobat')) {
                const isSKD = d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya';
                if (isSKD) {
                    deptSKDStats[dept].skd++;
                }
            }
        });
        
        const sortedDepts = Object.entries(deptSKDStats)
            .sort((a, b) => b[1].total - a[1].total);
        
        if (sortedDepts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Data tidak tersedia</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.createSKDTableHTML(sortedDepts);
    },

    // Helper methods
    createNoDataHTML(icon, message) {
        return `
            <div class="no-data">
                <i class="bi ${icon}"></i>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    },

    createTopListHTML(items) {
        let html = '<ul class="top-list">';
        items.forEach(([item, count], index) => {
            const rank = index + 1;
            html += `
                <li>
                    <div class="rank">${rank}</div>
                    <div class="item-name">${this.escapeHtml(item)}</div>
                    <div class="item-count">${count}</div>
                </li>
            `;
        });
        html += '</ul>';
        return html;
    },

    createSKDTableHTML(sortedDepts) {
        let html = '';
        sortedDepts.forEach(([dept, stats]) => {
            const persentaseSKD = stats.total > 0 ? ((stats.skd / stats.total) * 100).toFixed(1) : '0.0';
            const width = Math.min(parseFloat(persentaseSKD), 100);
            
            html += `
                <tr>
                    <td>${this.escapeHtml(dept)}</td>
                    <td>${stats.total}</td>
                    <td>${stats.skd}</td>
                    <td>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${width}%" 
                                 aria-valuenow="${persentaseSKD}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100"></div>
                        </div>
                        <small class="chart-label">${persentaseSKD}%</small>
                    </td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;
        });
        return html;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};