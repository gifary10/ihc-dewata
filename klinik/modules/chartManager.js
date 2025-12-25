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
                    borderWidth: 1
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
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
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
            }
        });
    },

    updateVisitTypeChart() {
        const ctx = document.getElementById('visitTypeChart');
        const berobatCount = dataService.getFilteredBerobat().length;
        const kecelakaanCount = dataService.getFilteredKecelakaan().length;
        const konsultasiCount = dataService.getFilteredKonsultasi().length;
        
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
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
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
            }
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
        
        // Buat chart baru dengan styling default
        const chartConfig = {
            type: 'bar',
            data: {
                labels: BULAN_NAMES,
                datasets: [{
                    label: label,
                    data: monthlyCounts,
                    backgroundColor: color + '80', // 50% opacity
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
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
        
        // Buat chart baru dengan styling default
        const chartConfig = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: counts,
                    backgroundColor: color + '80', // 50% opacity
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
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
