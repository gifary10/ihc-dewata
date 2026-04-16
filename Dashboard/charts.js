let charts = {};

// Register after Chart.js loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        Chart.defaults.set('plugins.datalabels', {
            color: '#8b949e',
            font: { family: "'JetBrains Mono', monospace", weight: '500', size: 10 },
            formatter: v => v > 0 ? v : ''
        });
    }
});

// ── Destroy helpers ─────────────────────────────────
function destroyCharts(...keys) {
    keys.forEach(k => {
        if (charts[k]) { charts[k].destroy(); charts[k] = null; }
    });
}

// ── Detail Modal ─────────────────────────────────────

function showDetailModal(title, data, columns) {
    const modal = el('detail-modal');
    const body  = el('modal-body');
    const titleEl = el('modal-title');
    const countEl = el('modal-count');
    if (!modal || !body) return;

    titleEl.textContent = title;
    countEl.textContent = `${data.length} data`;

    const ths  = columns.map(c => `<th>${escapeHtml(c)}</th>`).join('');
    const rows = data.length === 0
        ? `<tr class="empty-row"><td colspan="${columns.length}"><i class="fa-solid fa-inbox" style="margin-right:6px"></i>Tidak ada data</td></tr>`
        : data.map(row => `<tr>${columns.map(col => `<td title="${escapeHtml(row[col])}">${escapeHtml(row[col])}</td>`).join('')}</tr>`).join('');

    body.innerHTML = `
        <table>
            <thead><tr>${ths}</tr></thead>
            <tbody>${rows}</tbody>
        </table>`;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDetailModal(e) {
    if (e && e.target !== el('detail-modal')) return;
    el('detail-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetailModal();
});

// ── Chart Base Options ───────────────────────────────

const baseChartColors = {
    teal:   '#14b8a6',
    blue:   '#3b82f6',
    red:    '#ef4444',
    yellow: '#f59e0b',
    green:  '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
};
const darkGrid = {
    color: 'rgba(255,255,255,0.05)',
};

const darkTicks = {
    color: '#6e7681',
    font: { family: "'JetBrains Mono', monospace", size: 10 }
};

// ── Factory: Line Chart ──────────────────────────────
function makeLineChart(canvasId, label, data, color, onClickFn) {
    const canvas = el(canvasId);
    if (!canvas) return null;
    destroyCharts(canvasId);
    return charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: MONTH_LABELS,
            datasets: [{
                label, data,
                borderColor: color,
                backgroundColor: color + '15',
                tension: 0.4, fill: true, borderWidth: 2,
                pointBackgroundColor: color,
                pointBorderColor: '#161b22',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                datalabels: { display: true, align: 'top', offset: 6, color: '#8b949e', font: { size: 10 } },
                tooltip: { backgroundColor: '#1c2430', borderColor: '#30363d', borderWidth: 1, titleColor: '#e6edf3', bodyColor: '#8b949e', padding: 10 }
            },
            scales: {
                x: { grid: darkGrid, ticks: darkTicks },
                y: { beginAtZero: true, grid: darkGrid, ticks: { ...darkTicks, stepSize: 1 } }
            },
            onClick: (_, els) => { if (els.length) onClickFn(els[0].index); }
        }
    });
}

// ── Factory: Horizontal Bar Chart ───────────────────
function makeHBarChart(canvasId, label, chartData, color, onClickFn) {
    const canvas = el(canvasId);
    if (!canvas) return null;
    destroyCharts(canvasId);
    return charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label, data: chartData.values,
                backgroundColor: color + 'cc',
                hoverBackgroundColor: color,
                borderRadius: 4, borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: {
                legend: { display: false },
                datalabels: { display: true, anchor: 'end', align: 'right', offset: 4, color: '#8b949e', font: { size: 10 } },
                tooltip: { backgroundColor: '#1c2430', borderColor: '#30363d', borderWidth: 1, titleColor: '#e6edf3', bodyColor: '#8b949e', padding: 10 }
            },
            scales: {
                x: { beginAtZero: true, grid: darkGrid, ticks: darkTicks },
                y: { grid: { display: false }, ticks: { ...darkTicks, font: { size: 11 } } }
            },
            onClick: (_, els) => { if (els.length) onClickFn(els[0].index); }
        }
    });
}

// ── Factory: Doughnut Chart ──────────────────────────
function makeDoughnutChart(canvasId, chartData, colors, onClickFn) {
    const canvas = el(canvasId);
    if (!canvas) return null;
    destroyCharts(canvasId);
    return charts[canvasId] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{ data: chartData.values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#8b949e', font: { size: 11 }, padding: 12, usePointStyle: true } },
                datalabels: {
                    display: true, color: '#fff',
                    font: { weight: '700', size: 12 },
                    formatter: (v, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                        return pct > 6 ? pct + '%' : '';
                    }
                },
                tooltip: { backgroundColor: '#1c2430', borderColor: '#30363d', borderWidth: 1, titleColor: '#e6edf3', bodyColor: '#8b949e', padding: 10 }
            },
            onClick: (_, els) => { if (els.length) onClickFn(els[0].index); }
        }
    });
}

// ── Factory: Bar Chart (Daily) ───────────────────────
function makeBarChart(canvasId, label, chartData, color, onClickFn) {
    const canvas = el(canvasId);
    if (!canvas) return null;
    destroyCharts(canvasId);
    return charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label, data: chartData.values,
                backgroundColor: color + 'aa',
                hoverBackgroundColor: color,
                borderRadius: 4, borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: true, align: 'top', offset: 4, color: '#8b949e', font: { size: 9 }, formatter: v => v > 0 ? v : '' },
                tooltip: { backgroundColor: '#1c2430', borderColor: '#30363d', borderWidth: 1, titleColor: '#e6edf3', bodyColor: '#8b949e', padding: 10 }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...darkTicks, maxRotation: 0, autoSkip: true, maxTicksLimit: 16 } },
                y: { beginAtZero: true, grid: darkGrid, ticks: { ...darkTicks, stepSize: 1 } }
            },
            onClick: (_, els) => { if (els.length && onClickFn) onClickFn(els[0].index); }
        }
    });
}

// ════════════════════════════════════════════════════
//  BEROBAT CHARTS
// ════════════════════════════════════════════════════

function getVisitTimeCategory(waktu) {
    if (!waktu) return null;
    const parts = waktu.trim().split(':');
    if (parts.length < 2) return null;
    const hour = parseInt(parts[0], 10);
    if (isNaN(hour)) return null;
    if (hour >= 6  && hour < 12) return 'Pagi (06:00–11:59)';
    if (hour >= 12 && hour < 18) return 'Siang (12:00–17:59)';
    if (hour >= 18 && hour < 24) return 'Malam (18:00–23:59)';
    return 'Dini Hari (00:00–05:59)';
}

function getYearlyData(data) {
    const yearCount = {};
    data.forEach(r => {
        if (r.tahun && r.tahun > 0) {
            yearCount[r.tahun] = (yearCount[r.tahun] || 0) + 1;
        }
    });
    const sorted = Object.keys(yearCount).sort();
    return { labels: sorted, values: sorted.map(y => yearCount[y]) };
}

function getVisitTimeCategoryData(data) {
    const cats = {
        'Pagi (06:00–11:59)': 0,
        'Siang (12:00–17:59)': 0,
        'Malam (18:00–23:59)': 0,
        'Dini Hari (00:00–05:59)': 0,
    };
    data.forEach(r => {
        const cat = getVisitTimeCategory(r.Waktu);
        if (cat && cats[cat] !== undefined) cats[cat]++;
    });
    const labels = Object.keys(cats).filter(k => cats[k] > 0);
    const values = labels.map(k => cats[k]);
    return { labels, values };
}

function getGenderByDeptData(data) {
    // returns { depts, laki, perempuan }
    const deptSet = {};
    data.forEach(r => {
        const dept = r.Departemen || 'Tidak Diketahui';
        const g    = (r['Jenis Kelamin'] || '').toLowerCase();
        if (!deptSet[dept]) deptSet[dept] = { laki: 0, perempuan: 0 };
        if (g.includes('laki')) deptSet[dept].laki++;
        else if (g.includes('perempuan')) deptSet[dept].perempuan++;
    });
    // sort by total desc, top 10
    const sorted = Object.entries(deptSet)
        .sort((a, b) => (b[1].laki + b[1].perempuan) - (a[1].laki + a[1].perempuan))
        .slice(0, 10);
    return {
        depts: sorted.map(([k]) => k),
        laki:  sorted.map(([, v]) => v.laki),
        perempuan: sorted.map(([, v]) => v.perempuan),
    };
}

function makeGroupedBarChart(canvasId, chartData, onClickFn) {
    const canvas = el(canvasId);
    if (!canvas) return null;
    destroyCharts(canvasId);
    return charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: chartData.depts,
            datasets: [
                {
                    label: 'Laki-laki',
                    data: chartData.laki,
                    backgroundColor: baseChartColors.blue + 'cc',
                    hoverBackgroundColor: baseChartColors.blue,
                    borderRadius: 3, borderSkipped: false,
                },
                {
                    label: 'Perempuan',
                    data: chartData.perempuan,
                    backgroundColor: baseChartColors.purple + 'cc',
                    hoverBackgroundColor: baseChartColors.purple,
                    borderRadius: 3, borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#6e7681', font: { size: 11 }, padding: 12, usePointStyle: true } },
                datalabels: { display: true, align: 'top', offset: 2, color: '#8b949e', font: { size: 9 }, formatter: v => v > 0 ? v : '' },
                tooltip: { backgroundColor: '#1c2430', borderColor: '#30363d', borderWidth: 1, titleColor: '#e6edf3', bodyColor: '#8b949e', padding: 10 }
            },
            scales: {
                x: { grid: { display: false }, ticks: { ...darkTicks, maxRotation: 35, autoSkip: false } },
                y: { beginAtZero: true, grid: darkGrid, ticks: { ...darkTicks, stepSize: 1 } }
            },
            onClick: (_, els) => { if (els.length && onClickFn) onClickFn(els[0].index, els[0].datasetIndex); }
        }
    });
}

function chartCategoryBlock(icon, title, description) {
    return `<div class="chart-category">
        <div class="chart-category-header">
            <span class="chart-category-icon">${icon}</span>
            <span class="chart-category-title">${title}</span>
        </div>
        <p class="chart-category-desc">${description}</p>
    </div>`;
}

function createBerobatCharts(data, containerId, dataDiagnosa = [], dataObat = []) {
    const container = el(containerId);
    if (!container) return;

    const cols = [
        'Timestamp','ID','Tanggal','Waktu','Perusahaan','Departemen','Nama','Jenis Kelamin',
        'Keluhan','Kategori Diagnosa','Nama Diagnosa','Kategori Obat','Nama Obat',
        'Jumlah Obat','Satuan Obat','Tindakan','Perlu Istirahat','Jumlah Hari Istirahat','Keterangan Berobat'
    ];
    const colsDiagnosa = ['Tanggal','Nama','Departemen','Perusahaan','Nama Diagnosa'];
    const colsObat     = ['Tanggal','Nama','Departemen','Perusahaan','Nama Obat','Jumlah Obat','Satuan Obat'];

    container.innerHTML = `

        ${chartCategoryBlock(
            '<i class="fa-solid fa-chart-column" style="color:var(--teal)"></i>',
            'Tren Kunjungan',
            'Menampilkan pola kunjungan pasien berobat dari waktu ke waktu — harian, bulanan, dan tahunan — untuk mengidentifikasi periode dengan beban kunjungan tertinggi maupun terendah.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-12">
                <div class="chart-title"><i class="fa-solid fa-chart-column"></i> Kunjungan per Hari <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-berobat-daily"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-chart-line"></i> Per Bulan <span class="chart-hint">klik titik → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-berobat-monthly"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-calendar-check"></i> Per Tahun <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-berobat-yearly"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-users" style="color:var(--blue)"></i>',
            'Demografi Pasien',
            'Menganalisis distribusi pasien berdasarkan jenis kelamin dan asal departemen. Membantu memahami kelompok mana yang paling sering mengakses layanan kesehatan serta memetakan pola kunjungan lintas unit kerja.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-4">
                <div class="chart-title"><i class="fa-solid fa-venus-mars"></i> Jenis Kelamin <span class="chart-hint">klik slice → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-berobat-gender"></canvas></div>
            </div>
            <div class="chart-card col-8">
                <div class="chart-title"><i class="fa-solid fa-building"></i> Per Departemen <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-berobat-dept"></canvas></div>
            </div>
            <div class="chart-card col-12">
                <div class="chart-title"><i class="fa-solid fa-venus-mars"></i> Jenis Kelamin per Departemen <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-300"><canvas id="ch-berobat-gender-dept"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-clock" style="color:var(--yellow)"></i>',
            'Waktu Kunjungan',
            'Memetakan distribusi kunjungan berdasarkan waktu dalam sehari, yang dikelompokkan menjadi empat kategori: Dini Hari (00:00–05:59), Pagi (06:00–11:59), Siang (12:00–17:59), dan Malam (18:00–23:59). Informasi ini berguna untuk mengoptimalkan penjadwalan tenaga medis.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-12">
                <div class="chart-title"><i class="fa-solid fa-clock"></i> Distribusi Waktu Kunjungan <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-berobat-waktu"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-stethoscope" style="color:var(--yellow)"></i>',
            'Diagnosa & Pengobatan',
            'Menampilkan 10 diagnosa paling sering ditegakkan dan 10 obat paling banyak diresepkan (berdasarkan frekuensi), serta 20 obat dengan total kuantitas terbesar berdasarkan jumlah unit yang dikeluarkan. Data bersumber dari sheet D-Diagnosa dan D-Obat — penting untuk mengetahui pola penyakit dominan dan kebutuhan manajemen stok obat di klinik.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-stethoscope"></i> Top 10 Diagnosa <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-320"><canvas id="ch-berobat-diagnosa"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-pills"></i> Top 10 Obat (Frekuensi Resep) <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-320"><canvas id="ch-berobat-obat"></canvas></div>
            </div>
            <div class="chart-card col-12">
                <div class="chart-title"><i class="fa-solid fa-box-open"></i> Top 20 Obat — Total Jumlah Dikeluarkan <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-320"><canvas id="ch-berobat-obat-jumlah"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-bed" style="color:var(--red)"></i>',
            'Istirahat Kerja',
            'Menampilkan jumlah kasus yang memerlukan istirahat (Ya/Tidak) dan 10 pasien dengan total hari istirahat terbanyak. Data ini membantu menilai dampak penyakit terhadap produktivitas kerja karyawan.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-bed"></i> Status Perlu Istirahat <span class="chart-hint">klik slice → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-berobat-istirahat-status"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-calendar-days"></i> Top 10 Hari Istirahat <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-berobat-istirahat"></canvas></div>
            </div>
        </div>`;

    // ── Daily
    const daily = getDailyData(data);
    makeBarChart('ch-berobat-daily', 'Kunjungan', daily, baseChartColors.teal, idx => {
        const day = daily.labels[idx];
        showDetailModal(`Berobat — Tanggal ${day}`, data.filter(r => extractDayFromDate(r.Tanggal) === day), cols);
    });

    // ── Monthly
    makeLineChart('ch-berobat-monthly', 'Kunjungan', getMonthlyData(data), baseChartColors.blue, idx => {
        showDetailModal(`Berobat — ${MONTH_LABELS[idx]}`, data.filter(r => r.bulan === idx + 1), cols);
    });

    // ── Yearly
    const yearlyData = getYearlyData(data);
    makeBarChart('ch-berobat-yearly', 'Kunjungan', yearlyData, baseChartColors.teal, idx => {
        const yr = parseInt(yearlyData.labels[idx]);
        showDetailModal(`Berobat — Tahun ${yr}`, data.filter(r => r.tahun === yr), cols);
    });

    // ── Gender (doughnut)
    const genderData = getGenderData(data);
    makeDoughnutChart('ch-berobat-gender', genderData,
        [baseChartColors.blue, baseChartColors.purple, baseChartColors.teal], idx => {
        const val = genderData.labels[idx];
        const subset = data.filter(r => {
            const g = (r['Jenis Kelamin'] || '').toLowerCase();
            if (val === 'Laki-laki') return g.includes('laki');
            if (val === 'Perempuan') return g.includes('perempuan');
            return !g.includes('laki') && !g.includes('perempuan');
        });
        showDetailModal(`Berobat — ${val}`, subset, cols);
    });

    // ── Dept
    const deptData = getTopData(data, 'Departemen', 10);
    makeHBarChart('ch-berobat-dept', 'Kunjungan', deptData, baseChartColors.green, idx => {
        const val = deptData.labels[idx];
        showDetailModal(`Berobat — ${val}`, data.filter(r => r.Departemen === val), cols);
    });

    // ── Gender × Departemen (grouped bar)
    const genderDeptData = getGenderByDeptData(data);
    makeGroupedBarChart('ch-berobat-gender-dept', genderDeptData, (idx, dsIdx) => {
        const dept  = genderDeptData.depts[idx];
        const gender = dsIdx === 0 ? 'laki' : 'perempuan';
        const subset = data.filter(r => {
            const g = (r['Jenis Kelamin'] || '').toLowerCase();
            return r.Departemen === dept && g.includes(gender);
        });
        const label = dsIdx === 0 ? 'Laki-laki' : 'Perempuan';
        showDetailModal(`Berobat — ${dept} (${label})`, subset, cols);
    });

    // ── Waktu Kunjungan
    const waktuData = getVisitTimeCategoryData(data);
    makeBarChart('ch-berobat-waktu', 'Kunjungan', waktuData, baseChartColors.yellow, idx => {
        const cat = waktuData.labels[idx];
        const subset = data.filter(r => getVisitTimeCategory(r.Waktu) === cat);
        showDetailModal(`Berobat — ${cat}`, subset, cols);
    });

    // ── Top 10 Diagnosa (dari D-Diagnosa)
    const diagnosaData = getTopData(dataDiagnosa, 'Nama Diagnosa', 10);
    makeHBarChart('ch-berobat-diagnosa', 'Jumlah', diagnosaData, baseChartColors.yellow, idx => {
        const val = diagnosaData.labels[idx];
        showDetailModal(`Diagnosa: ${val}`, dataDiagnosa.filter(r => r['Nama Diagnosa'] === val), colsDiagnosa);
    });

    // ── Top 10 Obat (dari D-Obat, frekuensi resep)
    const obatData = getTopData(dataObat, 'Nama Obat', 10);
    makeHBarChart('ch-berobat-obat', 'Penggunaan', obatData, baseChartColors.orange, idx => {
        const val = obatData.labels[idx];
        showDetailModal(`Obat: ${val}`, dataObat.filter(r => r['Nama Obat'] === val), colsObat);
    });

    // ── Top 20 Obat by Jumlah (total unit dikeluarkan)
    const obatJumlahData = getTopObatByJumlah(dataObat, 20);
    makeHBarChart('ch-berobat-obat-jumlah', 'Total Unit', obatJumlahData, baseChartColors.purple, idx => {
        const val = obatJumlahData.labels[idx];
        showDetailModal(`Obat (Jumlah): ${val}`, dataObat.filter(r => r['Nama Obat'] === val), colsObat);
    });

    // ── Status Istirahat (doughnut)
    const istirahatStatusData = (() => {
        let ya = 0, tidak = 0;
        data.forEach(r => {
            const v = (r['Perlu Istirahat'] || '').toLowerCase();
            if (v.includes('ya')) ya++;
            else tidak++;
        });
        const labels = [], values = [];
        if (ya > 0)    { labels.push('Perlu Istirahat');  values.push(ya); }
        if (tidak > 0) { labels.push('Tidak Istirahat');  values.push(tidak); }
        return { labels, values };
    })();
    makeDoughnutChart('ch-berobat-istirahat-status', istirahatStatusData,
        [baseChartColors.red, baseChartColors.teal], idx => {
        const val = istirahatStatusData.labels[idx];
        const isYa = val === 'Perlu Istirahat';
        const subset = data.filter(r => {
            const v = (r['Perlu Istirahat'] || '').toLowerCase();
            return isYa ? v.includes('ya') : !v.includes('ya');
        });
        showDetailModal(`Berobat — ${val}`, subset, cols);
    });

    // ── Top 10 Hari Istirahat (bar)
    const istirahatData = getTopIstirahatData(data);
    makeHBarChart('ch-berobat-istirahat', 'Hari', istirahatData, baseChartColors.red, idx => {
        const nama = istirahatData.labels[idx].split(' (')[0];
        showDetailModal(`Berobat — Istirahat: ${nama}`, data.filter(r => r.Nama === nama), cols);
    });
}

// ════════════════════════════════════════════════════
//  KECELAKAAN CHARTS
// ════════════════════════════════════════════════════

function createKecelakaanCharts(data, containerId) {
    const container = el(containerId);
    if (!container) return;

    const cols = [
        'Timestamp','ID','Tanggal','Waktu','Perusahaan','Departemen','Nama','Jenis Kelamin',
        'Lokasi Kejadian','Penyebab','Bagian Yang Terluka','Tindakan','Deskripsi Kejadian'
    ];

    container.innerHTML = `

        ${chartCategoryBlock(
            '<i class="fa-solid fa-chart-line" style="color:var(--red)"></i>',
            'Tren Kecelakaan',
            'Menampilkan pola kejadian kecelakaan kerja dari waktu ke waktu. Tren bulanan membantu mengidentifikasi periode dengan frekuensi kecelakaan tinggi sehingga tindakan pencegahan dapat difokuskan pada periode tersebut.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-chart-line"></i> Per Bulan <span class="chart-hint">klik titik → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-kec-monthly"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-building"></i> Per Departemen <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-kec-dept"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-users" style="color:var(--blue)"></i>',
            'Demografi Korban',
            'Memetakan distribusi korban kecelakaan berdasarkan jenis kelamin. Informasi ini membantu dalam menyusun program keselamatan kerja yang lebih tepat sasaran sesuai profil tenaga kerja yang rentan.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-4">
                <div class="chart-title"><i class="fa-solid fa-venus-mars"></i> Jenis Kelamin <span class="chart-hint">klik slice → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-kec-gender"></canvas></div>
            </div>
            <div class="chart-card col-8">
                <div class="chart-title"><i class="fa-solid fa-location-dot"></i> Top Lokasi Kejadian <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-kec-lokasi"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-person-falling-burst" style="color:var(--orange,#f0883e)"></i>',
            'Analisis Kejadian',
            'Menguraikan kecelakaan berdasarkan bagian tubuh yang terluka dan penyebab kejadian. Data ini sangat penting untuk menentukan prioritas pengadaan alat pelindung diri (APD) dan menyusun program pelatihan keselamatan yang relevan.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-person-falling-burst"></i> Bagian Terluka <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-kec-luka"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-circle-exclamation"></i> Penyebab <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-kec-penyebab"></canvas></div>
            </div>
        </div>`;

    makeLineChart('ch-kec-monthly', 'Kecelakaan', getMonthlyData(data), baseChartColors.red, idx => {
        showDetailModal(`Kecelakaan — ${MONTH_LABELS[idx]}`, data.filter(r => r.bulan === idx + 1), cols);
    });

    const deptData = getTopData(data, 'Departemen', 10);
    makeHBarChart('ch-kec-dept', 'Kecelakaan', deptData, baseChartColors.red, idx => {
        const val = deptData.labels[idx];
        showDetailModal(`Kecelakaan — ${val}`, data.filter(r => r.Departemen === val), cols);
    });

    const genderData = getGenderData(data);
    makeDoughnutChart('ch-kec-gender', genderData,
        [baseChartColors.blue, baseChartColors.purple, baseChartColors.teal], idx => {
        const val = genderData.labels[idx];
        const subset = data.filter(r => {
            const g = (r['Jenis Kelamin'] || '').toLowerCase();
            if (val === 'Laki-laki') return g.includes('laki');
            if (val === 'Perempuan') return g.includes('perempuan');
            return !g.includes('laki') && !g.includes('perempuan');
        });
        showDetailModal(`Kecelakaan — ${val}`, subset, cols);
    });

    const lokasiData = getTopData(data, 'Lokasi Kejadian', 10);
    makeHBarChart('ch-kec-lokasi', 'Kejadian', lokasiData, baseChartColors.orange, idx => {
        const val = lokasiData.labels[idx];
        showDetailModal(`Kecelakaan — Lokasi: ${val}`, data.filter(r => r['Lokasi Kejadian'] === val), cols);
    });

    const lukaData = getTopData(data, 'Bagian Yang Terluka', 10);
    makeHBarChart('ch-kec-luka', 'Kasus', lukaData, baseChartColors.yellow, idx => {
        const val = lukaData.labels[idx];
        showDetailModal(`Kecelakaan — Bagian: ${val}`, data.filter(r => r['Bagian Yang Terluka'] === val), cols);
    });

    const penyebabData = getTopData(data, 'Penyebab', 10);
    makeHBarChart('ch-kec-penyebab', 'Kasus', penyebabData, baseChartColors.purple, idx => {
        const val = penyebabData.labels[idx];
        showDetailModal(`Kecelakaan — Penyebab: ${val}`, data.filter(r => r.Penyebab === val), cols);
    });
}

// ════════════════════════════════════════════════════
//  KONSULTASI CHARTS
// ════════════════════════════════════════════════════

function createKonsultasiCharts(data, containerId) {
    const container = el(containerId);
    if (!container) return;

    const cols = [
        'Timestamp','ID','Tanggal','Waktu','Perusahaan','Departemen','Nama','Jenis Kelamin',
        'Keluhan','Riwayat Penyakit','Saran'
    ];

    container.innerHTML = `

        ${chartCategoryBlock(
            '<i class="fa-solid fa-chart-line" style="color:var(--green)"></i>',
            'Tren Konsultasi',
            'Menampilkan pola kunjungan konsultasi medis dari waktu ke waktu. Analisis tren bulanan membantu mengidentifikasi periode dengan permintaan konsultasi tinggi, sehingga ketersediaan tenaga medis dapat direncanakan dengan lebih baik.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-chart-line"></i> Per Bulan <span class="chart-hint">klik titik → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-kon-monthly"></canvas></div>
            </div>
            <div class="chart-card col-6">
                <div class="chart-title"><i class="fa-solid fa-building"></i> Per Departemen <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-240"><canvas id="ch-kon-dept"></canvas></div>
            </div>
        </div>

        ${chartCategoryBlock(
            '<i class="fa-solid fa-users" style="color:var(--blue)"></i>',
            'Demografi Pasien',
            'Menganalisis distribusi pasien konsultasi berdasarkan jenis kelamin. Data ini membantu memahami karakteristik pasien yang aktif memanfaatkan layanan konsultasi medis di klinik.'
        )}
        <div class="chart-grid">
            <div class="chart-card col-4">
                <div class="chart-title"><i class="fa-solid fa-venus-mars"></i> Jenis Kelamin <span class="chart-hint">klik slice → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-kon-gender"></canvas></div>
            </div>
            <div class="chart-card col-8">
                <div class="chart-title"><i class="fa-solid fa-comment-medical"></i> Top Keluhan <span class="chart-hint">klik bar → detail</span></div>
                <div class="chart-wrap h-280"><canvas id="ch-kon-keluhan"></canvas></div>
            </div>
        </div>`;

    makeLineChart('ch-kon-monthly', 'Konsultasi', getMonthlyData(data), baseChartColors.green, idx => {
        showDetailModal(`Konsultasi — ${MONTH_LABELS[idx]}`, data.filter(r => r.bulan === idx + 1), cols);
    });

    const deptData = getTopData(data, 'Departemen', 10);
    makeHBarChart('ch-kon-dept', 'Konsultasi', deptData, baseChartColors.green, idx => {
        const val = deptData.labels[idx];
        showDetailModal(`Konsultasi — ${val}`, data.filter(r => r.Departemen === val), cols);
    });

    const genderData = getGenderData(data);
    makeDoughnutChart('ch-kon-gender', genderData,
        [baseChartColors.blue, baseChartColors.purple, baseChartColors.teal], idx => {
        const val = genderData.labels[idx];
        const subset = data.filter(r => {
            const g = (r['Jenis Kelamin'] || '').toLowerCase();
            if (val === 'Laki-laki') return g.includes('laki');
            if (val === 'Perempuan') return g.includes('perempuan');
            return !g.includes('laki') && !g.includes('perempuan');
        });
        showDetailModal(`Konsultasi — ${val}`, subset, cols);
    });

    const keluhanData = getTopData(data, 'Keluhan', 10);
    makeHBarChart('ch-kon-keluhan', 'Kasus', keluhanData, baseChartColors.teal, idx => {
        const val = keluhanData.labels[idx];
        showDetailModal(`Konsultasi — Keluhan: ${val}`, data.filter(r => r.Keluhan === val), cols);
    });
}
