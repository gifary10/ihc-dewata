import { dataService } from './dataService.js';
import { CHART_COLORS, CHART_BORDER_COLORS } from './config.js';

export const chartManager = {
    genderChart: null,
    visitTypeChart: null,
    deptBerobatChart: null,
    deptKecelakaanChart: null,
    deptKonsultasiChart: null,

    updateAllCharts() {
        this.updateGenderChart();
        this.updateVisitTypeChart();
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
                        display: false
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
        
        // Add custom legend
        this.addCustomLegend('genderChart', 
            ['Laki-laki', 'Perempuan', 'Tidak Diketahui'],
            ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(201, 203, 207, 0.8)']
        );
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
                        display: false
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
        
        // Add custom legend
        this.addCustomLegend('visitTypeChart',
            ['Berobat', 'Kecelakaan', 'Konsultasi'],
            ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)']
        );
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
            }
        };
        
        const newChart = new Chart(ctx, chartConfig);
        
        // Simpan instance chart
        this.setChartInstance(canvasId, newChart);
    },

    // Method untuk menambahkan custom legend
    addCustomLegend(chartId, labels, colors) {
        const chartContainer = document.getElementById(chartId).closest('.chart-container');
        const existingLegend = chartContainer.querySelector('.custom-legend');
        
        if (existingLegend) {
            existingLegend.remove();
        }
        
        if (labels.length > 6) return; // Skip jika terlalu banyak item
        
        const legendContainer = document.createElement('div');
        legendContainer.className = 'custom-legend';
        
        labels.forEach((label, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const colorBox = document.createElement('span');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = colors[index % colors.length];
            
            const textSpan = document.createElement('span');
            textSpan.textContent = label;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(textSpan);
            legendContainer.appendChild(legendItem);
        });
        
        chartContainer.appendChild(legendContainer);
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
    }
};