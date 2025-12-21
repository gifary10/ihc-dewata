// ========== KONFIGURASI & KONSTANTA ==========
const CONFIG = {
    STORAGE_KEYS: {
        KUNJUNGAN: 'dataKunjungan',
        PERUSAHAAN: 'namaPerusahaan'
    },
    JENIS_KUNJUNGAN: {
        BEROBAT: 'Berobat',
        KECELAKAAN: 'Kecelakaan Kerja',
        KONSULTASI: 'Konsultasi'
    },
    BULAN_INDONESIA: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    DEFAULT_DEPARTEMEN: [
        'HRD', 'Produksi', 'Engineering', 'Maintenance', 'Quality Control',
        'Logistik', 'IT', 'Finance', 'Marketing', 'R&D'
    ]
};

// ========== STATE MANAGEMENT ==========
let semuaDataKunjungan = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.KUNJUNGAN)) || [];
let filteredData = [];
let semuaPerusahaan = [];
let semuaDepartemen = [];
let chartGender = null;
let chartVisitType = null;
let chartDeptBerobat = null;
let chartDeptKecelakaan = null;
let chartDeptKonsultasi = null;

// ========== FILTER FUNCTIONS ==========
const FilterManager = {
    init: () => {
        // Set default year to current year
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Populate year filter
        FilterManager.populateYearFilter();
        
        // Set default filters
        document.getElementById('filterTahun').value = currentYear.toString();
        document.getElementById('filterBulan').value = 'all';
        document.getElementById('filterPerusahaan').value = 'all';
        document.getElementById('filterDepartemen').value = 'all';
        
        // Load perusahaan list
        FilterManager.loadPerusahaanList();
        
        // Load departemen list
        FilterManager.loadDepartemenList();
        
        // Apply filter
        FilterManager.applyFilter();
    },
    
    populateYearFilter: () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const yearSelect = document.getElementById('filterTahun');
        
        // Add options for current year and previous 5 years
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString();
            yearSelect.appendChild(option);
        }
        
        // Add "all" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Semua Tahun';
        yearSelect.insertBefore(allOption, yearSelect.firstChild);
    },
    
    loadPerusahaanList: () => {
        // Get unique perusahaan from data
        const perusahaanSet = new Set();
        semuaDataKunjungan.forEach(item => {
            if (item.perusahaan) {
                perusahaanSet.add(item.perusahaan);
            }
        });
        
        // Add default perusahaan options
        const perusahaanOptions = [
            'Delonix Hotel',
            'PT XYZ Manufacturing',
            'PT Global Teknik',
            'PT Maju Jaya',
            'PT Sehat Sentosa'
        ];
        
        perusahaanOptions.forEach(p => perusahaanSet.add(p));
        
        semuaPerusahaan = Array.from(perusahaanSet).sort();
        
        const selectElement = document.getElementById('filterPerusahaan');
        selectElement.innerHTML = '<option value="all">Semua Perusahaan</option>';
        
        semuaPerusahaan.forEach(perusahaan => {
            const option = document.createElement('option');
            option.value = perusahaan;
            option.textContent = perusahaan;
            selectElement.appendChild(option);
        });
    },
    
    loadDepartemenList: () => {
        // Get unique departemen from data
        const departemenSet = new Set();
        semuaDataKunjungan.forEach(item => {
            if (item.departemen) {
                departemenSet.add(item.departemen);
            }
        });
        
        // Add default departemen options
        CONFIG.DEFAULT_DEPARTEMEN.forEach(d => departemenSet.add(d));
        
        semuaDepartemen = Array.from(departemenSet).sort();
        
        const selectElement = document.getElementById('filterDepartemen');
        selectElement.innerHTML = '<option value="all">Semua Departemen</option>';
        
        semuaDepartemen.forEach(departemen => {
            const option = document.createElement('option');
            option.value = departemen;
            option.textContent = departemen;
            selectElement.appendChild(option);
        });
    },
    
    applyFilter: () => {
        filteredData = [...semuaDataKunjungan];
        
        const filters = {
            perusahaan: document.getElementById('filterPerusahaan').value,
            departemen: document.getElementById('filterDepartemen').value,
            bulan: document.getElementById('filterBulan').value,
            tahun: document.getElementById('filterTahun').value
        };
        
        // Filter perusahaan
        if (filters.perusahaan !== 'all') {
            filteredData = filteredData.filter(item => item.perusahaan === filters.perusahaan);
        }
        
        // Filter departemen
        if (filters.departemen !== 'all') {
            filteredData = filteredData.filter(item => item.departemen === filters.departemen);
        }
        
        // Filter tahun
        if (filters.tahun !== 'all') {
            filteredData = filteredData.filter(item => {
                if (item.tanggal) {
                    const itemDate = new Date(item.tanggal);
                    return itemDate.getFullYear() === parseInt(filters.tahun);
                }
                return false;
            });
        }
        
        // Filter bulan
        if (filters.bulan !== 'all') {
            filteredData = filteredData.filter(item => {
                if (item.tanggal) {
                    const itemDate = new Date(item.tanggal);
                    return (itemDate.getMonth() + 1) === parseInt(filters.bulan);
                }
                return false;
            });
        }
        
        // Update UI dengan data terfilter
        Dashboard.updateAllCharts();
        
        // Update data range info
        FilterManager.updateDataRangeInfo();
    },
    
    resetFilter: () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        document.getElementById('filterPerusahaan').value = 'all';
        document.getElementById('filterDepartemen').value = 'all';
        document.getElementById('filterBulan').value = 'all';
        document.getElementById('filterTahun').value = currentYear.toString();
        
        FilterManager.applyFilter();
    },
    
    updateDataRangeInfo: () => {
        const perusahaan = document.getElementById('filterPerusahaan').value;
        const departemen = document.getElementById('filterDepartemen').value;
        const bulan = document.getElementById('filterBulan').value;
        const tahun = document.getElementById('filterTahun').value;
        
        let info = '';
        
        if (perusahaan !== 'all') {
            info += `Perusahaan: ${perusahaan} | `;
        }
        
        if (departemen !== 'all') {
            info += `Departemen: ${departemen} | `;
        }
        
        if (tahun !== 'all') {
            info += `Tahun: ${tahun} | `;
        }
        
        if (bulan !== 'all') {
            info += `Bulan: ${CONFIG.BULAN_INDONESIA[parseInt(bulan) - 1]} | `;
        }
        
        info += `Total Data: ${filteredData.length}`;
        
        document.getElementById('dataRangeInfo').textContent = info;
    }
};

// ========== DASHBOARD FUNCTIONS ==========
const Dashboard = {
    init: () => {
        // Set current date
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);
        
        // Initialize filters
        FilterManager.init();
        
        // Setup event listeners
        Dashboard.setupEventListeners();
    },
    
    setupEventListeners: () => {
        document.getElementById('btnApplyFilter').addEventListener('click', FilterManager.applyFilter);
        document.getElementById('btnResetFilter').addEventListener('click', FilterManager.resetFilter);
    },
    
    updateAllCharts: () => {
        // Update statistics
        Dashboard.updateStatistics();
        
        // Update charts
        Dashboard.updateGenderChart();
        Dashboard.updateVisitTypeChart();
        
        // Update department bar charts
        Dashboard.updateDepartmentBarCharts();
        
        // Update department stats
        Dashboard.updateDepartmentStats();
        
        // Update top lists
        Dashboard.updateTopPenyakit();
        Dashboard.updateTopObat();
        
        // Update SKD table
        Dashboard.updateSKDTable();
    },
    
    updateStatistics: () => {
        // Hitung statistik
        const stats = Dashboard.calculateStatistics();
        
        // Update stat cards
        document.getElementById('statTotalLaki').textContent = stats.totalLaki;
        document.getElementById('statTotalPerempuan').textContent = stats.totalPerempuan;
        document.getElementById('statTotalSKD').textContent = stats.totalSKD;
        document.getElementById('statTotalKunjungan').textContent = stats.totalKunjungan;
        document.getElementById('statBerobat').textContent = stats.berobat;
        document.getElementById('statKecelakaan').textContent = stats.kecelakaan;
        document.getElementById('statKonsultasi').textContent = stats.konsultasi;
    },
    
    calculateStatistics: () => {
        const stats = {
            totalLaki: 0,
            totalPerempuan: 0,
            totalSKD: 0,
            totalKunjungan: filteredData.length,
            berobat: 0,
            kecelakaan: 0,
            konsultasi: 0
        };
        
        filteredData.forEach(item => {
            // Hitung jenis kelamin
            if (item.jenisKelamin === 'Laki-laki') stats.totalLaki++;
            if (item.jenisKelamin === 'Perempuan') stats.totalPerempuan++;
            
            // Hitung jenis kunjungan
            if (item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.BEROBAT) stats.berobat++;
            if (item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.KECELAKAAN) stats.kecelakaan++;
            if (item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.KONSULTASI) stats.konsultasi++;
            
            // Hitung SKD
            if (item.perluIstirahat === 'Ya') stats.totalSKD++;
        });
        
        return stats;
    },
    
    updateGenderChart: () => {
        const stats = Dashboard.calculateStatistics();
        const ctx = document.getElementById('genderChart').getContext('2d');
        
        // Destroy existing chart
        if (chartGender) {
            chartGender.destroy();
        }
        
        chartGender = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Laki-laki', 'Perempuan'],
                datasets: [{
                    data: [stats.totalLaki, stats.totalPerempuan],
                    backgroundColor: [
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgb(0, 123, 255)',
                        'rgb(220, 53, 69)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    updateVisitTypeChart: () => {
        const stats = Dashboard.calculateStatistics();
        const ctx = document.getElementById('visitTypeChart').getContext('2d');
        
        // Destroy existing chart
        if (chartVisitType) {
            chartVisitType.destroy();
        }
        
        chartVisitType = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Berobat', 'Kecelakaan', 'Konsultasi'],
                datasets: [{
                    data: [stats.berobat, stats.kecelakaan, stats.konsultasi],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(23, 162, 184, 0.8)'
                    ],
                    borderColor: [
                        'rgb(40, 167, 69)',
                        'rgb(220, 53, 69)',
                        'rgb(23, 162, 184)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    updateDepartmentBarCharts: () => {
        Dashboard.updateDeptBerobatChart();
        Dashboard.updateDeptKecelakaanChart();
        Dashboard.updateDeptKonsultasiChart();
    },
    
    updateDeptBerobatChart: () => {
        const ctx = document.getElementById('deptBerobatChart').getContext('2d');
        
        // Destroy existing chart
        if (chartDeptBerobat) {
            chartDeptBerobat.destroy();
        }
        
        // Hitung data per departemen untuk kunjungan berobat
        const deptData = Dashboard.calculateDeptDataByVisitType(CONFIG.JENIS_KUNJUNGAN.BEROBAT);
        
        if (deptData.labels.length === 0) {
            ctx.canvas.parentNode.innerHTML = '<div class="no-data"><i class="bi bi-bar-chart"></i><p>Tidak ada data berobat</p></div>';
            return;
        }
        
        chartDeptBerobat = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deptData.labels,
                datasets: [{
                    label: 'Jumlah Berobat',
                    data: deptData.values,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgb(40, 167, 69)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Jumlah Kunjungan'
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    },
    
    updateDeptKecelakaanChart: () => {
        const ctx = document.getElementById('deptKecelakaanChart').getContext('2d');
        
        // Destroy existing chart
        if (chartDeptKecelakaan) {
            chartDeptKecelakaan.destroy();
        }
        
        // Hitung data per departemen untuk kecelakaan
        const deptData = Dashboard.calculateDeptDataByVisitType(CONFIG.JENIS_KUNJUNGAN.KECELAKAAN);
        
        if (deptData.labels.length === 0) {
            ctx.canvas.parentNode.innerHTML = '<div class="no-data"><i class="bi bi-bar-chart"></i><p>Tidak ada data kecelakaan</p></div>';
            return;
        }
        
        chartDeptKecelakaan = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deptData.labels,
                datasets: [{
                    label: 'Jumlah Kecelakaan',
                    data: deptData.values,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgb(220, 53, 69)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Jumlah Kecelakaan'
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    },
    
    updateDeptKonsultasiChart: () => {
        const ctx = document.getElementById('deptKonsultasiChart').getContext('2d');
        
        // Destroy existing chart
        if (chartDeptKonsultasi) {
            chartDeptKonsultasi.destroy();
        }
        
        // Hitung data per departemen untuk konsultasi
        const deptData = Dashboard.calculateDeptDataByVisitType(CONFIG.JENIS_KUNJUNGAN.KONSULTASI);
        
        if (deptData.labels.length === 0) {
            ctx.canvas.parentNode.innerHTML = '<div class="no-data"><i class="bi bi-bar-chart"></i><p>Tidak ada data konsultasi</p></div>';
            return;
        }
        
        chartDeptKonsultasi = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: deptData.labels,
                datasets: [{
                    label: 'Jumlah Konsultasi',
                    data: deptData.values,
                    backgroundColor: 'rgba(23, 162, 184, 0.7)',
                    borderColor: 'rgb(23, 162, 184)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Jumlah Konsultasi'
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    },
    
    calculateDeptDataByVisitType: (visitType) => {
        const deptCount = {};
        
        filteredData.forEach(item => {
            if (item.departemen && item.jenisKunjungan === visitType) {
                if (!deptCount[item.departemen]) {
                    deptCount[item.departemen] = 0;
                }
                deptCount[item.departemen]++;
            }
        });
        
        // Sort by count (descending) and limit to top 10
        const sortedEntries = Object.entries(deptCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return {
            labels: sortedEntries.map(entry => entry[0]),
            values: sortedEntries.map(entry => entry[1])
        };
    },
    
    updateDepartmentStats: () => {
        const container = document.getElementById('departmentStats');
        
        if (filteredData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-bar-chart"></i>
                    <p>Data tidak tersedia</p>
                </div>
            `;
            return;
        }
        
        // Hitung statistik per departemen
        const deptStats = {};
        
        filteredData.forEach(item => {
            if (!item.departemen) return;
            
            if (!deptStats[item.departemen]) {
                deptStats[item.departemen] = {
                    total: 0,
                    laki: 0,
                    perempuan: 0,
                    berobat: 0,
                    kecelakaan: 0,
                    konsultasi: 0
                };
            }
            
            deptStats[item.departemen].total++;
            
            // Hitung jenis kelamin
            if (item.jenisKelamin === 'Laki-laki') deptStats[item.departemen].laki++;
            if (item.jenisKelamin === 'Perempuan') deptStats[item.departemen].perempuan++;
            
            // Hitung jenis kunjungan
            if (item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.BEROBAT) {
                deptStats[item.departemen].berobat++;
            }
            if (item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.KECELAKAAN) {
                deptStats[item.departemen].kecelakaan++;
            }
            if (item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.KONSULTASI) {
                deptStats[item.departemen].konsultasi++;
            }
        });
        
        // Sort by total (descending)
        const sortedDepts = Object.keys(deptStats).sort((a, b) => deptStats[b].total - deptStats[a].total);
        
        // Generate HTML
        let html = '';
        
        sortedDepts.forEach(dept => {
            const stats = deptStats[dept];
            html += `
                <div class="department-row">
                    <div class="department-name">${dept}</div>
                    <div class="department-stats">
                        <div>
                            <span class="badge-male me-2">L: ${stats.laki}</span>
                            <span class="badge-female me-2">P: ${stats.perempuan}</span>
                        </div>
                        <div>
                            <span class="text-success me-2">B: ${stats.berobat}</span>
                            <span class="text-danger me-2">K: ${stats.kecelakaan}</span>
                            <span class="text-info">C: ${stats.konsultasi}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    updateTopPenyakit: () => {
        const container = document.getElementById('topPenyakit');
        
        if (filteredData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-clipboard-data"></i>
                    <p>Data tidak tersedia</p>
                </div>
            `;
            return;
        }
        
        // Hitung frekuensi penyakit
        const penyakitCount = {};
        
        filteredData.forEach(item => {
            if (item.namaPenyakit && item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.BEROBAT) {
                if (!penyakitCount[item.namaPenyakit]) {
                    penyakitCount[item.namaPenyakit] = 0;
                }
                penyakitCount[item.namaPenyakit]++;
            }
        });
        
        // Convert to array and sort
        const penyakitArray = Object.keys(penyakitCount).map(nama => ({
            nama,
            count: penyakitCount[nama]
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        
        if (penyakitArray.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-clipboard-data"></i>
                    <p>Tidak ada data penyakit</p>
                </div>
            `;
            return;
        }
        
        // Generate HTML
        let html = '<ul class="top-list">';
        
        penyakitArray.forEach((item, index) => {
            html += `
                <li>
                    <div class="rank">${index + 1}</div>
                    <div class="item-name">${item.nama}</div>
                    <div class="item-count">${item.count}</div>
                </li>
            `;
        });
        
        html += '</ul>';
        container.innerHTML = html;
    },
    
    updateTopObat: () => {
        const container = document.getElementById('topObat');
        
        if (filteredData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-capsule"></i>
                    <p>Data tidak tersedia</p>
                </div>
            `;
            return;
        }
        
        // Hitung frekuensi obat
        const obatCount = {};
        
        filteredData.forEach(item => {
            if (item.namaObat && item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.BEROBAT) {
                if (!obatCount[item.namaObat]) {
                    obatCount[item.namaObat] = 0;
                }
                obatCount[item.namaObat] += parseInt(item.jumlahObat) || 1;
            }
        });
        
        // Convert to array and sort
        const obatArray = Object.keys(obatCount).map(nama => ({
            nama,
            count: obatCount[nama]
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        
        if (obatArray.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="bi bi-capsule"></i>
                    <p>Tidak ada data obat</p>
                </div>
            `;
            return;
        }
        
        // Generate HTML
        let html = '<ul class="top-list">';
        
        obatArray.forEach((item, index) => {
            html += `
                <li>
                    <div class="rank">${index + 1}</div>
                    <div class="item-name">${item.nama}</div>
                    <div class="item-count">${item.count}</div>
                </li>
            `;
        });
        
        html += '</ul>';
        container.innerHTML = html;
    },
    
    updateSKDTable: () => {
        const tbody = document.getElementById('skdTableBody');
        
        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">Data tidak tersedia</td>
                </tr>
            `;
            return;
        }
        
        // Hitung SKD per departemen
        const deptSKD = {};
        
        filteredData.forEach(item => {
            if (!item.departemen) return;
            
            if (!deptSKD[item.departemen]) {
                deptSKD[item.departemen] = {
                    total: 0,
                    skd: 0,
                    skdLaki: 0,
                    skdPerempuan: 0
                };
            }
            
            deptSKD[item.departemen].total++;
            
            if (item.perluIstirahat === 'Ya') {
                deptSKD[item.departemen].skd++;
                
                if (item.jenisKelamin === 'Laki-laki') {
                    deptSKD[item.departemen].skdLaki++;
                } else if (item.jenisKelamin === 'Perempuan') {
                    deptSKD[item.departemen].skdPerempuan++;
                }
            }
        });
        
        // Sort by total SKD (descending)
        const sortedDepts = Object.keys(deptSKD).sort((a, b) => deptSKD[b].skd - deptSKD[a].skd);
        
        // Generate HTML
        let html = '';
        
        sortedDepts.forEach(dept => {
            const stats = deptSKD[dept];
            const persentaseSKD = stats.total > 0 ? ((stats.skd / stats.total) * 100).toFixed(1) : 0;
            
            html += `
                <tr>
                    <td><strong>${dept}</strong></td>
                    <td>${stats.total}</td>
                    <td><span class="badge bg-warning text-dark">${stats.skd}</span></td>
                    <td>${persentaseSKD}%</td>
                    <td>${stats.skdLaki}</td>
                    <td>${stats.skdPerempuan}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    Dashboard.init();
});