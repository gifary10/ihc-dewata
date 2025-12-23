// ================= KONFIGURASI =================
const API_URL = "https://script.google.com/macros/s/AKfycbzjHJ_bMJ09shSHcKT0RQva5Vp5TYMYq_YgNq4Yt2w3fFpFXbbqFH7N0rC3vnmAu533/exec";

let rawData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };
let filteredData = { Berobat: [], Kecelakaan: [], Konsultasi: [] };

// Chart instances
let genderChart = null;
let visitTypeChart = null;
let deptBerobatChart = null;
let deptKecelakaanChart = null;
let deptKonsultasiChart = null;

// ================= INISIALISASI =================
document.addEventListener('DOMContentLoaded', function() {
    // Set tanggal saat ini
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);
    
    // Load data
    loadData();
    
    // Setup event listeners
    document.getElementById('btnApplyFilter').addEventListener('click', applyFilter);
    document.getElementById('btnResetFilter').addEventListener('click', resetFilter);
    
    // Apply filter saat dropdown berubah
    document.getElementById('filterPerusahaan').addEventListener('change', updateDepartemenByPerusahaan);
    document.getElementById('filterDepartemen').addEventListener('change', applyFilter);
    document.getElementById('filterTahun').addEventListener('change', applyFilter);
    document.getElementById('filterBulan').addEventListener('change', applyFilter);
});

// ================= FUNGSI UTAMA =================
async function loadData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        rawData = data;
        
        console.log("Data loaded successfully:", {
            Berobat: rawData.Berobat?.length || 0,
            Kecelakaan: rawData.Kecelakaan?.length || 0,
            Konsultasi: rawData.Konsultasi?.length || 0
        });
        
        initFilters();
        applyFilter();
    } catch (error) {
        console.error("Error loading data:", error);
        showError("Gagal memuat data. Silakan coba lagi.");
    }
}

function initFilters() {
    const perusahaanSet = new Set();
    const departemenSet = new Set();
    const tahunSet = new Set();

    // Kumpulkan semua data dari semua jenis kunjungan
    const allData = [
        ...(rawData.Berobat || []),
        ...(rawData.Kecelakaan || []),
        ...(rawData.Konsultasi || [])
    ];

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
}

// Fungsi untuk meng-update departemen berdasarkan perusahaan yang dipilih
function updateDepartemenByPerusahaan() {
    const perusahaan = document.getElementById('filterPerusahaan').value;
    const fDepartemen = document.getElementById('filterDepartemen');
    
    if (perusahaan === 'all') {
        // Jika memilih "Semua Perusahaan", tampilkan semua departemen
        const allDepartemen = new Set();
        
        // Kumpulkan semua departemen dari semua data
        const allData = [
            ...(rawData.Berobat || []),
            ...(rawData.Kecelakaan || []),
            ...(rawData.Konsultasi || [])
        ];
        
        allData.forEach(d => {
            if (d['Departemen']) allDepartemen.add(d['Departemen']);
        });
        
        fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
        allDepartemen.forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
    } else {
        // Jika memilih perusahaan tertentu, filter departemen berdasarkan perusahaan
        const departemenByPerusahaan = new Set();
        
        // Kumpulkan departemen hanya dari perusahaan yang dipilih
        const allData = [
            ...(rawData.Berobat || []),
            ...(rawData.Kecelakaan || []),
            ...(rawData.Konsultasi || [])
        ];
        
        allData.forEach(d => {
            if (d['Perusahaan'] === perusahaan && d['Departemen']) {
                departemenByPerusahaan.add(d['Departemen']);
            }
        });
        
        fDepartemen.innerHTML = '<option value="all">Semua Departemen</option>';
        departemenByPerusahaan.forEach(d => fDepartemen.innerHTML += `<option value="${d}">${d}</option>`);
    }
    
    // Reset dropdown departemen ke "Semua Departemen" saat perusahaan berubah
    fDepartemen.value = 'all';
    
    // Terapkan filter setelah mengubah dropdown departemen
    applyFilter();
}

function applyFilter() {
    const perusahaan = document.getElementById('filterPerusahaan').value;
    const departemen = document.getElementById('filterDepartemen').value;
    const tahun = document.getElementById('filterTahun').value;
    const bulan = document.getElementById('filterBulan').value;

    // Filter data
    filteredData.Berobat = (rawData.Berobat || []).filter(d => filterCondition(d, perusahaan, departemen, tahun, bulan));
    filteredData.Kecelakaan = (rawData.Kecelakaan || []).filter(d => filterCondition(d, perusahaan, departemen, tahun, bulan));
    filteredData.Konsultasi = (rawData.Konsultasi || []).filter(d => filterCondition(d, perusahaan, departemen, tahun, bulan));

    console.log("Filter applied:", {
        Berobat: filteredData.Berobat.length,
        Kecelakaan: filteredData.Kecelakaan.length,
        Konsultasi: filteredData.Konsultasi.length,
        filters: { perusahaan, departemen, tahun, bulan }
    });

    // Update semua komponen dashboard
    updateStatistics();
    updateCharts();
    updateTables();
    updateDataRangeInfo();
}

function filterCondition(data, perusahaan, departemen, tahun, bulan) {
    // Filter perusahaan
    if (perusahaan !== 'all' && data['Perusahaan'] !== perusahaan) return false;
    
    // Filter departemen
    if (departemen !== 'all' && data['Departemen'] !== departemen) return false;
    
    // Filter tahun dan bulan
    if (tahun !== 'all' || bulan !== 'all') {
        let dateToCheck;
        
        // Coba ambil dari TimeStamp
        if (data['TimeStamp']) {
            dateToCheck = new Date(data['TimeStamp']);
        }
        // Coba ambil dari Tanggal
        else if (data['Tanggal']) {
            const dateParts = data['Tanggal'].split('-');
            if (dateParts.length >= 3) {
                dateToCheck = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`);
            }
        }
        
        // Jika ada tanggal yang valid
        if (dateToCheck && !isNaN(dateToCheck.getTime())) {
            if (tahun !== 'all' && dateToCheck.getFullYear().toString() !== tahun) return false;
            if (bulan !== 'all' && (dateToCheck.getMonth() + 1).toString() !== bulan) return false;
        }
    }
    
    return true;
}

function resetFilter() {
    document.getElementById('filterPerusahaan').value = 'all';
    document.getElementById('filterDepartemen').value = 'all';
    document.getElementById('filterTahun').value = 'all';
    document.getElementById('filterBulan').value = 'all';
    
    // Reset dropdown departemen ke semua opsi
    updateDepartemenByPerusahaan();
}

function updateDataRangeInfo() {
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
        const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        parts.push(`Bulan: ${bulanNames[parseInt(bulan)-1]}`);
    }
    
    if (parts.length === 0) {
        info += "Semua Data";
    } else {
        info += parts.join(", ");
    }
    
    document.getElementById('dataRangeInfo').textContent = info;
}

// ================= STATISTIK =================
function updateStatistics() {
    const allData = [
        ...filteredData.Berobat,
        ...filteredData.Kecelakaan,
        ...filteredData.Konsultasi
    ];
    
    // Hitung statistik dasar
    const totalLaki = allData.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length;
    const totalPerempuan = allData.filter(d => d['Jenis Kelamin'] === 'Perempuan').length;
    const totalKunjungan = allData.length;
    
    // Hitung total SKD dari data Berobat
    const totalSKD = filteredData.Berobat.filter(d => 
        d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya'
    ).length;
    
    // Update statistik utama
    document.getElementById('statTotalLaki').textContent = totalLaki;
    document.getElementById('statTotalPerempuan').textContent = totalPerempuan;
    document.getElementById('statTotalSKD').textContent = totalSKD;
    document.getElementById('statTotalKunjungan').textContent = totalKunjungan;
    
    // Update statistik jenis kunjungan
    document.getElementById('statBerobat').textContent = filteredData.Berobat.length;
    document.getElementById('statKecelakaan').textContent = filteredData.Kecelakaan.length;
    document.getElementById('statKonsultasi').textContent = filteredData.Konsultasi.length;
}

// ================= CHARTS =================
function updateCharts() {
    updateGenderChart();
    updateVisitTypeChart();
    updateDepartmentCharts();
}

function updateGenderChart() {
    const ctx = document.getElementById('genderChart');
    const allData = [
        ...filteredData.Berobat,
        ...filteredData.Kecelakaan,
        ...filteredData.Konsultasi
    ];
    
    const totalLaki = allData.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length;
    const totalPerempuan = allData.filter(d => d['Jenis Kelamin'] === 'Perempuan').length;
    const totalUnknown = allData.length - totalLaki - totalPerempuan;
    
    if (genderChart) genderChart.destroy();
    
    genderChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Laki-laki', 'Perempuan', 'Tidak Diketahui'],
            datasets: [{
                data: [totalLaki, totalPerempuan, totalUnknown],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(201, 203, 207, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(201, 203, 207, 1)'
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
}

function updateVisitTypeChart() {
    const ctx = document.getElementById('visitTypeChart');
    const berobatCount = filteredData.Berobat.length;
    const kecelakaanCount = filteredData.Kecelakaan.length;
    const konsultasiCount = filteredData.Konsultasi.length;
    
    if (visitTypeChart) visitTypeChart.destroy();
    
    visitTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Berobat', 'Kecelakaan', 'Konsultasi'],
            datasets: [{
                data: [berobatCount, kecelakaanCount, konsultasiCount],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
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
                }
            }
        }
    });
}

function updateDepartmentCharts() {
    updateDepartmentChart('deptBerobatChart', filteredData.Berobat, 'Berobat', '#28a745');
    updateDepartmentChart('deptKecelakaanChart', filteredData.Kecelakaan, 'Kecelakaan', '#dc3545');
    updateDepartmentChart('deptKonsultasiChart', filteredData.Konsultasi, 'Konsultasi', '#17a2b8');
}

function updateDepartmentChart(canvasId, data, label, color) {
    const ctx = document.getElementById(canvasId);
    
    // Hitung per departemen
    const deptCounts = {};
    data.forEach(d => {
        const dept = d['Departemen'] || 'Tidak Diketahui';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    // Urutkan dari yang terbanyak
    const sortedDepts = Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Ambil top 10 saja
    
    const labels = sortedDepts.map(item => item[0]);
    const counts = sortedDepts.map(item => item[1]);
    
    // Hancurkan chart lama jika ada
    switch(canvasId) {
        case 'deptBerobatChart':
            if (deptBerobatChart) deptBerobatChart.destroy();
            break;
        case 'deptKecelakaanChart':
            if (deptKecelakaanChart) deptKecelakaanChart.destroy();
            break;
        case 'deptKonsultasiChart':
            if (deptKonsultasiChart) deptKonsultasiChart.destroy();
            break;
    }
    
    const backgroundColor = color + '33'; // Tambah transparansi
    const borderColor = color;
    
    // Buat chart baru
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Jumlah ${label}`,
                data: counts,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Jumlah'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Departemen'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Simpan instance chart
    switch(canvasId) {
        case 'deptBerobatChart':
            deptBerobatChart = newChart;
            break;
        case 'deptKecelakaanChart':
            deptKecelakaanChart = newChart;
            break;
        case 'deptKonsultasiChart':
            deptKonsultasiChart = newChart;
            break;
    }
}

// ================= TABLES & LISTS =================
function updateTables() {
    updateDepartmentStats();
    updateTopPenyakit();
    updateTopObat();
    updateSKDTable();
}

function updateDepartmentStats() {
    const container = document.getElementById('departmentStats');
    const allData = [
        ...filteredData.Berobat,
        ...filteredData.Kecelakaan,
        ...filteredData.Konsultasi
    ];
    
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
        
        // Tentukan jenis kunjungan
        if (d['Jenis Kunjungan']) {
            if (d['Jenis Kunjungan'].includes('Berobat')) deptStats[dept].berobat++;
            if (d['Jenis Kunjungan'].includes('Kecelakaan')) deptStats[dept].kecelakaan++;
            if (d['Jenis Kunjungan'].includes('Konsultasi')) deptStats[dept].konsultasi++;
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
}

function updateTopPenyakit() {
    const container = document.getElementById('topPenyakit');
    const penyakitCounts = {};
    
    // Hitung frekuensi diagnosa dari data Berobat
    filteredData.Berobat.forEach(d => {
        const diagnosa = d['Diagnosa'] || d['Keterangan Diagnosa'] || 'Tidak Diketahui';
        if (diagnosa && diagnosa !== '-') {
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
}

function updateTopObat() {
    const container = document.getElementById('topObat');
    const obatCounts = {};
    
    // Hitung frekuensi obat dari data Berobat
    filteredData.Berobat.forEach(d => {
        const obat = d['Nama Obat'] || 'Tidak Diketahui';
        if (obat && obat !== '-') {
            // Pisahkan jika ada beberapa obat
            const obatList = obat.split(',').map(o => o.trim());
            obatList.forEach(o => {
                if (o) {
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
}

function updateSKDTable() {
    const tbody = document.getElementById('skdTableBody');
    const allData = [
        ...filteredData.Berobat,
        ...filteredData.Kecelakaan,
        ...filteredData.Konsultasi
    ];
    
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
        if (d['Jenis Kunjungan'] && d['Jenis Kunjungan'].includes('Berobat')) {
            const isSKD = d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya';
            if (isSKD) {
                deptSKDStats[dept].skd++;
                
                // Hitung berdasarkan jenis kelamin
                if (d['Jenis Kelamin'] === 'Laki-laki') {
                    deptSKDStats[dept].skdLaki++;
                } else if (d['Jenis Kelamin'] === 'Perempuan') {
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

// ================= UTILITY FUNCTIONS =================
function showError(message) {
    // Implementasi notifikasi error sederhana
    console.error(message);
    alert(message);
}

// Auto-refresh data setiap 5 menit
setInterval(() => {
    loadData();
    console.log("Auto-refreshing data...");
}, 5 * 60 * 1000);
