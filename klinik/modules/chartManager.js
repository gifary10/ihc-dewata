import { dataService } from './dataService.js';
import { BULAN_NAMES } from './config.js';

export const chartManager = {
    genderChart: null,
    visitTypeChart: null,
    deptBerobatChart: null,
    deptKecelakaanChart: null,
    deptKonsultasiChart: null,
    monthlyBerobatChart: null,
    monthlyKecelakaanChart: null,
    monthlyKonsultasiChart: null,

    updateAllCharts() {
        this.updateGenderChart();
        this.updateVisitTypeChart();
        this.updateMonthlyCharts();
        this.updateDepartmentCharts();
    },

    updateGenderChart() {
        const ctx = document.getElementById('genderChart');
        const allData = dataService.getAllFilteredData();
        
        const totalLaki = allData.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length;
        const totalPerempuan = allData.filter(d => d['Jenis Kelamin'] === 'Perempuan').length;
        const totalUnknown = allData.length - totalLaki - totalPerempuan;
        
        // Add center text
        const total = totalLaki + totalPerempuan + totalUnknown;
        
        if (this.genderChart) this.genderChart.destroy();
        
        this.genderChart = new Chart(ctx, {
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
                    borderWidth: 2,
                    borderJoinStyle: 'round',
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            color: '#343a40'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#023199',
                        bodyColor: '#333',
                        borderColor: 'rgba(2, 49, 153, 0.1)',
                        borderWidth: 1,
                        boxPadding: 5,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                }
            },
            plugins: [{
                id: 'doughnutCenterText',
                beforeDraw: function(chart) {
                    if (chart.config.type === 'doughnut') {
                        const width = chart.width;
                        const height = chart.height;
                        const ctx = chart.ctx;
                        
                        ctx.restore();
                        const fontSize = (height / 150).toFixed(2);
                        ctx.font = `800 ${fontSize}em 'Segoe UI', sans-serif`;
                        ctx.textBaseline = 'middle';
                        
                        const text = total.toLocaleString();
                        const textX = Math.round((width - ctx.measureText(text).width) / 2);
                        const textY = height / 2 - 10;
                        
                        // Background gradient
                        const gradient = ctx.createLinearGradient(0, 0, width, 0);
                        gradient.addColorStop(0, '#023199');
                        gradient.addColorStop(1, '#1a4ab1');
                        
                        ctx.fillStyle = gradient;
                        ctx.fillText(text, textX, textY);
                        
                        // Subtitle
                        ctx.font = `500 ${fontSize/2}em 'Segoe UI', sans-serif`;
                        const subText = 'Total';
                        const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
                        const subTextY = height / 2 + 15;
                        
                        ctx.fillStyle = '#6c757d';
                        ctx.fillText(subText, subTextX, subTextY);
                        
                        ctx.save();
                    }
                }
            }]
        });
    },

    updateVisitTypeChart() {
        const ctx = document.getElementById('visitTypeChart');
        const berobatCount = dataService.getFilteredBerobat().length;
        const kecelakaanCount = dataService.getFilteredKecelakaan().length;
        const konsultasiCount = dataService.getFilteredKonsultasi().length;
        
        const total = berobatCount + kecelakaanCount + konsultasiCount;
        
        if (this.visitTypeChart) this.visitTypeChart.destroy();
        
        this.visitTypeChart = new Chart(ctx, {
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
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            color: '#343a40'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#023199',
                        bodyColor: '#333',
                        borderColor: 'rgba(2, 49, 153, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                }
            },
            plugins: [{
                id: 'pieCenterText',
                beforeDraw: function(chart) {
                    if (chart.config.type === 'pie') {
                        const width = chart.width;
                        const height = chart.height;
                        const ctx = chart.ctx;
                        
                        ctx.restore();
                        const fontSize = (height / 150).toFixed(2);
                        ctx.font = `800 ${fontSize}em 'Segoe UI', sans-serif`;
                        ctx.textBaseline = 'middle';
                        
                        const text = total.toLocaleString();
                        const textX = Math.round((width - ctx.measureText(text).width) / 2);
                        const textY = height / 2;
                        
                        // Background gradient
                        const gradient = ctx.createLinearGradient(0, 0, width, 0);
                        gradient.addColorStop(0, '#023199');
                        gradient.addColorStop(1, '#1a4ab1');
                        
                        ctx.fillStyle = gradient;
                        ctx.fillText(text, textX, textY);
                        
                        ctx.save();
                    }
                }
            }]
        });
    },

    updateMonthlyCharts() {
        this.updateMonthlyChart('monthlyBerobatChart', dataService.getFilteredBerobat(), 'Berobat', '#28a745');
        this.updateMonthlyChart('monthlyKecelakaanChart', dataService.getFilteredKecelakaan(), 'Kecelakaan', '#dc3545');
        this.updateMonthlyChart('monthlyKonsultasiChart', dataService.getFilteredKonsultasi(), 'Konsultasi', '#17a2b8');
    },

    updateMonthlyChart(canvasId, data, label, color) {
        const ctx = document.getElementById(canvasId);
        
        // Hitung per bulan (1-12)
        const monthlyCounts = Array(12).fill(0);
        
        data.forEach(d => {
            let month = null;
            
            // Coba ambil dari TimeStamp
            if (d['TimeStamp']) {
                const date = new Date(d['TimeStamp']);
                if (!isNaN(date.getTime())) {
                    month = date.getMonth(); // 0-11
                }
            }
            
            // Coba ambil dari Tanggal jika TimeStamp tidak ada
            if (month === null && d['Tanggal']) {
                const dateParts = d['Tanggal'].split('-');
                if (dateParts.length >= 2) {
                    month = parseInt(dateParts[1]) - 1; // Convert to 0-11
                }
            }
            
            // Tambahkan ke counts jika month valid
            if (month !== null && month >= 0 && month < 12) {
                monthlyCounts[month]++;
            }
        });
        
        // Hancurkan chart lama jika ada
        this.destroyChart(canvasId);
        
        // Buat gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, color + 'CC');
        gradient.addColorStop(1, color + '33');
        
        // Tentukan warna teks berdasarkan kecerahan warna background
        const getTextColor = (bgColor) => {
            // Untuk warna hijau (#28a745), merah (#dc3545), biru (#17a2b8)
            // Gunakan warna putih untuk kontras
            return '#ffffff';
        };
        
        const textColor = getTextColor(color);
        
        // Buat chart baru
        const chartConfig = {
            type: 'bar',
            data: {
                labels: BULAN_NAMES,
                datasets: [{
                    label: `Jumlah ${label}`,
                    data: monthlyCounts,
                    backgroundColor: gradient,
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#023199',
                        bodyColor: '#333',
                        borderColor: 'rgba(2, 49, 153, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(tooltipItems) {
                                return BULAN_NAMES[tooltipItems[0].dataIndex];
                            },
                            label: function(context) {
                                return `Jumlah: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 11
                            },
                            stepSize: 1,
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Jumlah',
                            color: '#343a40',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'Bulan',
                            color: '#343a40',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            },
            plugins: [{
                id: 'barLabels',
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    
                    ctx.save();
                    ctx.fillStyle = textColor;
                    ctx.font = 'bold 12px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    meta.data.forEach((bar, index) => {
                        const value = chart.data.datasets[0].data[index];
                        if (value > 0) {
                            const x = bar.x;
                            const y = bar.y;
                            const barHeight = bar.height;
                            
                            // Cek apakah bar cukup tinggi untuk menampilkan teks di dalamnya
                            if (barHeight > 20) {
                                // Jika bar cukup tinggi, letakkan teks di tengah bar
                                const textY = y - (barHeight / 2) + 1;
                                ctx.fillText(value, x, textY);
                            } else {
                                // Jika bar terlalu pendek, letakkan teks di atas bar
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(value, x, bar.y - 3);
                            }
                        }
                    });
                    
                    ctx.restore();
                }
            }]
        };
        
        const newChart = new Chart(ctx, chartConfig);
        
        // Simpan instance chart
        this.setChartInstance(canvasId, newChart);
    },

    updateDepartmentCharts() {
        this.updateDepartmentChart('deptBerobatChart', dataService.getFilteredBerobat(), 'Berobat', '#28a745');
        this.updateDepartmentChart('deptKecelakaanChart', dataService.getFilteredKecelakaan(), 'Kecelakaan', '#dc3545');
        this.updateDepartmentChart('deptKonsultasiChart', dataService.getFilteredKonsultasi(), 'Konsultasi', '#17a2b8');
    },

    updateDepartmentChart(canvasId, data, label, color) {
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
            .slice(0, 8); // Ambil top 8 saja
        
        const labels = sortedDepts.map(item => item[0]);
        const counts = sortedDepts.map(item => item[1]);
        
        // Hancurkan chart lama jika ada
        this.destroyChart(canvasId);
        
        // Buat gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color + 'CC');
        gradient.addColorStop(1, color + '33');
        
        // Tentukan warna teks
        const getTextColor = (bgColor) => {
            return '#ffffff'; // Putih untuk kontras dengan warna-warna cerah
        };
        
        const textColor = getTextColor(color);
        
        // Buat chart baru
        const chartConfig = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Jumlah ${label}`,
                    data: counts,
                    backgroundColor: gradient,
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#023199',
                        bodyColor: '#333',
                        borderColor: 'rgba(2, 49, 153, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `Jumlah: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 11
                            },
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Jumlah',
                            color: '#343a40',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'Departemen',
                            color: '#343a40',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            },
            plugins: [{
                id: 'barLabels',
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    
                    ctx.save();
                    ctx.fillStyle = textColor;
                    ctx.font = 'bold 12px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    meta.data.forEach((bar, index) => {
                        const value = chart.data.datasets[0].data[index];
                        if (value > 0) {
                            const x = bar.x;
                            const y = bar.y;
                            const barHeight = bar.height;
                            
                            // Cek apakah bar cukup tinggi untuk menampilkan teks di dalamnya
                            if (barHeight > 20) {
                                // Jika bar cukup tinggi, letakkan teks di tengah bar
                                const textY = y - (barHeight / 2) + 1;
                                ctx.fillText(value, x, textY);
                            } else {
                                // Jika bar terlalu pendek, letakkan teks di atas bar
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(value, x, bar.y - 3);
                            }
                        }
                    });
                    
                    ctx.restore();
                }
            }]
        };
        
        const newChart = new Chart(ctx, chartConfig);
        
        // Simpan instance chart
        this.setChartInstance(canvasId, newChart);
    },

    destroyChart(canvasId) {
        switch(canvasId) {
            case 'deptBerobatChart':
                if (this.deptBerobatChart) {
                    this.deptBerobatChart.destroy();
                    this.deptBerobatChart = null;
                }
                break;
            case 'deptKecelakaanChart':
                if (this.deptKecelakaanChart) {
                    this.deptKecelakaanChart.destroy();
                    this.deptKecelakaanChart = null;
                }
                break;
            case 'deptKonsultasiChart':
                if (this.deptKonsultasiChart) {
                    this.deptKonsultasiChart.destroy();
                    this.deptKonsultasiChart = null;
                }
                break;
            case 'monthlyBerobatChart':
                if (this.monthlyBerobatChart) {
                    this.monthlyBerobatChart.destroy();
                    this.monthlyBerobatChart = null;
                }
                break;
            case 'monthlyKecelakaanChart':
                if (this.monthlyKecelakaanChart) {
                    this.monthlyKecelakaanChart.destroy();
                    this.monthlyKecelakaanChart = null;
                }
                break;
            case 'monthlyKonsultasiChart':
                if (this.monthlyKonsultasiChart) {
                    this.monthlyKonsultasiChart.destroy();
                    this.monthlyKonsultasiChart = null;
                }
                break;
        }
    },

    setChartInstance(canvasId, chartInstance) {
        switch(canvasId) {
            case 'deptBerobatChart':
                this.deptBerobatChart = chartInstance;
                break;
            case 'deptKecelakaanChart':
                this.deptKecelakaanChart = chartInstance;
                break;
            case 'deptKonsultasiChart':
                this.deptKonsultasiChart = chartInstance;
                break;
            case 'monthlyBerobatChart':
                this.monthlyBerobatChart = chartInstance;
                break;
            case 'monthlyKecelakaanChart':
                this.monthlyKecelakaanChart = chartInstance;
                break;
            case 'monthlyKonsultasiChart':
                this.monthlyKonsultasiChart = chartInstance;
                break;
        }
    },

    destroyAllCharts() {
        if (this.genderChart) {
            this.genderChart.destroy();
            this.genderChart = null;
        }
        if (this.visitTypeChart) {
            this.visitTypeChart.destroy();
            this.visitTypeChart = null;
        }
        if (this.deptBerobatChart) {
            this.deptBerobatChart.destroy();
            this.deptBerobatChart = null;
        }
        if (this.deptKecelakaanChart) {
            this.deptKecelakaanChart.destroy();
            this.deptKecelakaanChart = null;
        }
        if (this.deptKonsultasiChart) {
            this.deptKonsultasiChart.destroy();
            this.deptKonsultasiChart = null;
        }
        if (this.monthlyBerobatChart) {
            this.monthlyBerobatChart.destroy();
            this.monthlyBerobatChart = null;
        }
        if (this.monthlyKecelakaanChart) {
            this.monthlyKecelakaanChart.destroy();
            this.monthlyKecelakaanChart = null;
        }
        if (this.monthlyKonsultasiChart) {
            this.monthlyKonsultasiChart.destroy();
            this.monthlyKonsultasiChart = null;
        }
    }
};
