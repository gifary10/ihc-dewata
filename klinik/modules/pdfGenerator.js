// pdfGenerator.js - FIXED VERSION WITHOUT GRADIENT METHOD
import { dataService } from './dataService.js';
import { BULAN_NAMES } from './config.js';
import { utils } from './utils.js';

export const pdfGenerator = {
    async generatePDF() {
        try {
            // Show loading dengan pesan yang lebih spesifik
            if (window.loadingManager) {
                window.loadingManager.show('Menyiapkan laporan PDF...');
            }

            // Tunggu sedikit untuk memastikan UI stabil
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create PDF document dengan pengaturan yang lebih optimal
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Get current date dan filter values
            const currentDate = new Date();
            const formattedDate = utils.formatDate(currentDate);
            
            const perusahaan = document.getElementById('filterPerusahaan').value;
            const departemen = document.getElementById('filterDepartemen').value;
            const tahun = document.getElementById('filterTahun').value;
            const bulan = document.getElementById('filterBulan').value;
            
            // Get nama perusahaan dari filter atau default
            const namaPerusahaan = perusahaan !== 'all' ? perusahaan : 'Klinik Dewata Tirta Medika';
            const namaBulan = bulan !== 'all' ? BULAN_NAMES[parseInt(bulan)-1] : '';
            const judulBulan = namaBulan ? `BULAN ${namaBulan.toUpperCase()}` : '';

            // Optimasi: Set semua properties sekaligus
            doc.setProperties({
                title: `Laporan IHC ${judulBulan}`,
                subject: 'Laporan Kesehatan dan Keselamatan Kerja',
                author: namaPerusahaan,
                keywords: 'kesehatan, klinik, IHC, statistik, laporan',
                creator: 'Dashboard IHC'
            });

            // Define consistent colors (matching dashboard theme)
            const COLORS = {
                primary: [2, 49, 153],       // #023199
                secondary: [108, 117, 125],  // #6c757d
                success: [40, 167, 69],      // #28a745
                danger: [220, 53, 69],       // #dc3545
                warning: [255, 193, 7],      // #ffc107
                info: [23, 162, 184],        // #17a2b8
                light: [248, 249, 250],      // #f8f9fa
                dark: [33, 37, 41]           // #212529
            };

            // Halaman 1: Cover dengan Logo dan Judul
            this.addCoverPage(doc, judulBulan, namaPerusahaan, formattedDate, COLORS);
            
            // Halaman 2: Statistik Utama
            doc.addPage();
            this.addStatisticsSection(doc, namaPerusahaan, COLORS);
            
            // Halaman 3: Visualisasi Data
            doc.addPage();
            await this.addVisualizationSection(doc, COLORS);
            
            // Halaman 4: Analisis Data
            doc.addPage();
            this.addAnalysisSection(doc, COLORS);
            
            // Halaman 5: Kesimpulan dan Saran
            doc.addPage();
            this.addConclusionSection(doc, namaBulan, tahun, COLORS);

            // Tambahkan footer ke semua halaman
            this.addFooter(doc, COLORS);

            // Save dengan nama file yang lebih informatif
            const fileName = this.generateFileName(perusahaan, departemen, tahun, bulan);
            doc.save(fileName);

            // Hide loading
            if (window.loadingManager) {
                setTimeout(() => window.loadingManager.hide(), 300);
            }

            return true;

        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showError(`Gagal membuat laporan PDF: ${error.message}`);
            
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
            return false;
        }
    },

    addCoverPage(doc, judulBulan, namaPerusahaan, currentDate, colors) {
        // Background color sederhana (matching dashboard)
        doc.setFillColor(...colors.light);
        doc.rect(0, 0, 210, 297, 'F');
        
        // Header border decoration
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(2);
        doc.line(20, 25, 190, 25);
        doc.line(20, 272, 190, 272);
        
        try {
            // Tambahkan logo jika tersedia
            const logoImg = new Image();
            logoImg.src = 'logo.png';
            
            // Tambahkan logo di tengah
            doc.addImage(logoImg, 'PNG', 85, 60, 40, 40);
        } catch (error) {
            console.log('Logo tidak ditemukan, lanjut tanpa logo');
        }
        
        // Judul utama dengan efek teks
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        
        // Primary color text
        doc.setTextColor(...colors.primary);
        doc.text('LAPORAN IHC', 105, 120, { align: 'center' });
        
        // Sub judul bulan
        if (judulBulan) {
            doc.setFontSize(20);
            doc.setTextColor(...colors.secondary);
            doc.text(judulBulan, 105, 140, { align: 'center' });
        }
        
        // Garis pemisah tanpa gradient
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(2);
        doc.line(60, 150, 150, 150);
        
        // Nama perusahaan
        doc.setFontSize(18);
        doc.setTextColor(...colors.dark);
        doc.text(namaPerusahaan, 105, 170, { align: 'center' });
        
        // Subtitle perusahaan
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.secondary);
        doc.text('In House Clinic - Layanan Kesehatan Perusahaan', 105, 185, { align: 'center' });
        
        // Informasi laporan dalam card-like box
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(50, 210, 110, 40, 3, 3, 'FD');
        
        doc.setFontSize(11);
        doc.setTextColor(...colors.primary);
        doc.text('INFORMASI LAPORAN', 105, 220, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        doc.text(`Tanggal: ${currentDate}`, 105, 230, { align: 'center' });
        doc.text('Dibuat otomatis oleh Sistem Dashboard IHC', 105, 240, { align: 'center' });
        
        // Confidential notice
        doc.setFontSize(9);
        doc.setTextColor(...colors.secondary);
        doc.text('Dokumen ini bersifat rahasia dan hanya untuk penggunaan internal', 105, 255, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(153, 153, 153);
        doc.text('© 2025 In House Clinic Management System', 105, 265, { align: 'center' });
    },

    addStatisticsSection(doc, namaPerusahaan, colors) {
        let yPosition = 20;
        
        // Header section dengan style konsisten
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('STATISTIK UTAMA', 105, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Garis dekoratif di bawah judul
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.line(60, yPosition, 150, yPosition);
        yPosition += 5;
        
        // Informasi periode dalam card style
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.3);
        doc.roundedRect(20, yPosition, 170, 10, 3, 3, 'FD');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.secondary);
        doc.text(`Perusahaan: ${namaPerusahaan}`, 25, yPosition + 6);
        doc.text(`Periode: ${this.getCurrentFilterPeriod()}`, 165, yPosition + 6, { align: 'right' });
        yPosition += 15;

        // Get statistics dengan caching
        const stats = this.calculateStatistics();
        const totalData = dataService.getAllFilteredData().length;
        
        // Box summary dengan style card dashboard
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition, 170, 12, 5, 5, 'FD');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('RINGKASAN DATA', 25, yPosition + 8);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        doc.text(`Total Data: ${totalData} record${totalData !== 1 ? 's' : ''}`, 165, yPosition + 8, { align: 'right' });
        yPosition += 17;

        // Table header dengan style konsisten
        doc.setFontSize(10);
        doc.setFillColor(...colors.primary);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(20, yPosition, 170, 7, 3, 3, 'F');
        
        // Header columns
        const headers = ['KATEGORI', 'JUMLAH', 'PERSENTASE'];
        const colPositions = [25, 130, 165];
        const colAlign = ['left', 'right', 'right'];
        
        headers.forEach((header, i) => {
            doc.text(header, colPositions[i], yPosition + 4.5, { align: colAlign[i] });
        });
        
        yPosition += 7;

        // Table rows - data yang lebih relevan
        doc.setFont('helvetica', 'normal');
        
        const statisticsData = [
            { label: 'Total Kunjungan', value: stats.totalKunjungan },
            { label: 'Kunjungan Berobat', value: stats.berobatCount, percentage: stats.berobatCount / stats.totalKunjungan },
            { label: 'Kecelakaan Kerja', value: stats.kecelakaanCount, percentage: stats.kecelakaanCount / stats.totalKunjungan },
            { label: 'Konsultasi', value: stats.konsultasiCount, percentage: stats.konsultasiCount / stats.totalKunjungan },
            { label: 'Total SKD', value: stats.totalSKD, percentage: stats.totalSKD / stats.berobatCount },
            { label: 'Laki-laki', value: stats.totalLaki, percentage: stats.totalLaki / stats.totalKunjungan },
            { label: 'Perempuan', value: stats.totalPerempuan, percentage: stats.totalPerempuan / stats.totalKunjungan },
            { label: 'Laki-laki (SKD)', value: stats.skdLaki },
            { label: 'Perempuan (SKD)', value: stats.skdPerempuan }
        ];

        statisticsData.forEach((item, index) => {
            // Alternate row colors seperti di dashboard
            if (index % 2 === 0) {
                doc.setFillColor(...colors.light);
                doc.roundedRect(20, yPosition, 170, 6, 0, 0, 'F');
            }
            
            doc.setTextColor(...colors.dark);
            doc.text(item.label, 25, yPosition + 3.5);
            
            // Format number with thousands separator
            const formattedValue = item.value.toLocaleString('id-ID');
            doc.text(formattedValue, 130, yPosition + 3.5, { align: 'right' });
            
            // Percentage jika ada
            if (item.percentage !== undefined && !isNaN(item.percentage)) {
                const percentage = (item.percentage * 100).toFixed(1);
                doc.text(`${percentage}%`, 165, yPosition + 3.5, { align: 'right' });
            } else {
                doc.text('-', 165, yPosition + 3.5, { align: 'right' });
            }
            
            yPosition += 6;
        });

        // Statistik tambahan dalam box terpisah
        yPosition += 8;
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition, 170, 40, 5, 5, 'FD');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('ANALISIS SINGKAT', 25, yPosition + 7);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        const analyses = [];
        const berobatPercentage = (stats.berobatCount / stats.totalKunjungan * 100).toFixed(1);
        analyses.push(`• ${berobatPercentage}% dari total kunjungan adalah untuk berobat`);
        
        if (stats.kecelakaanCount > 0) {
            const kecelakaanPercentage = (stats.kecelakaanCount / stats.totalKunjungan * 100).toFixed(1);
            analyses.push(`• Terdapat ${stats.kecelakaanCount} kasus kecelakaan kerja (${kecelakaanPercentage}%)`);
        }
        
        if (stats.totalSKD > 0) {
            const skdPercentage = (stats.totalSKD / stats.berobatCount * 100).toFixed(1);
            analyses.push(`• ${skdPercentage}% pasien berobat mendapatkan Surat Keterangan Dokter`);
        }
        
        // Tampilkan analisis
        let analysisY = yPosition + 15;
        analyses.forEach((analysis, index) => {
            if (analysisY > yPosition + 35) return;
            doc.text(analysis, 25, analysisY);
            analysisY += 5;
        });
    },

    async addVisualizationSection(doc, colors) {
        let yPosition = 20;
        
        // Section title dengan style konsisten
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('VISUALISASI DATA', 105, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Garis dekoratif
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.line(60, yPosition, 150, yPosition);
        yPosition += 5;
        
        // Deskripsi section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.secondary);
        doc.text('Grafik berikut menunjukkan distribusi dan trend data kunjungan klinik', 105, yPosition, { align: 'center' });
        yPosition += 12;

        try {
            // Container untuk chart pertama
            doc.setFillColor(...colors.light);
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(0.5);
            doc.roundedRect(20, yPosition, 170, 95, 5, 5, 'FD');
            
            // Chart 1: Distribusi Gender (di atas)
            const genderChartElement = document.getElementById('genderChart');
            if (genderChartElement) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.dark);
                doc.text('Distribusi Jenis Kelamin', 105, yPosition + 8, { align: 'center' });
                
                const genderImg = await this.captureChart(genderChartElement);
                if (genderImg) {
                    doc.addImage(genderImg, 'JPEG', 45, yPosition + 15, 120, 70);
                } else {
                    doc.setFontSize(10);
                    doc.setTextColor(...colors.danger);
                    doc.text('Grafik tidak tersedia', 105, yPosition + 50, { align: 'center' });
                }
            }
            
            yPosition += 100;

            // Container untuk chart kedua
            doc.setFillColor(...colors.light);
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(0.5);
            doc.roundedRect(20, yPosition, 170, 95, 5, 5, 'FD');
            
            // Chart 2: Jenis Kunjungan
            const visitChartElement = document.getElementById('visitTypeChart');
            if (visitChartElement) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.dark);
                doc.text('Distribusi Jenis Kunjungan', 105, yPosition + 8, { align: 'center' });
                
                const visitImg = await this.captureChart(visitChartElement);
                if (visitImg) {
                    doc.addImage(visitImg, 'JPEG', 45, yPosition + 15, 120, 70);
                }
            }
            
            yPosition += 100;

            // Jika masih ada ruang di halaman ini, tambah chart bulanan
            if (yPosition < 150) {
                // Header untuk chart bulanan
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.primary);
                doc.text('TREND BULANAN', 105, yPosition, { align: 'center' });
                yPosition += 10;
                
                // Chart bulanan pertama
                const monthlyBerobatChart = document.getElementById('monthlyBerobatChart');
                if (monthlyBerobatChart && yPosition < 230) {
                    doc.setFillColor(...colors.light);
                    doc.setDrawColor(...colors.primary);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(20, yPosition, 170, 65, 5, 5, 'FD');
                    
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.dark);
                    doc.text('Berobat per Bulan', 105, yPosition + 8, { align: 'center' });
                    
                    const chartImg = await this.captureChart(monthlyBerobatChart);
                    if (chartImg) {
                        doc.addImage(chartImg, 'JPEG', 30, yPosition + 15, 150, 40);
                    }
                    
                    yPosition += 70;
                }
            } else {
                // Tambah halaman baru untuk chart bulanan
                doc.addPage();
                yPosition = 20;
                
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.primary);
                doc.text('TREND BULANAN', 105, yPosition, { align: 'center' });
                yPosition += 15;
            }

            // Chart bulanan dalam grid layout
            const monthlyCharts = [
                { id: 'monthlyBerobatChart', label: 'Berobat per Bulan' },
                { id: 'monthlyKecelakaanChart', label: 'Kecelakaan per Bulan' },
                { id: 'monthlyKonsultasiChart', label: 'Konsultasi per Bulan' }
            ];

            for (let i = 0; i < monthlyCharts.length; i++) {
                const chart = monthlyCharts[i];
                
                // Cek jika perlu halaman baru
                if (yPosition > 180) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const chartElement = document.getElementById(chart.id);
                if (chartElement) {
                    doc.setFillColor(...colors.light);
                    doc.setDrawColor(...colors.primary);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(20, yPosition, 170, 65, 5, 5, 'FD');
                    
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.dark);
                    doc.text(chart.label, 105, yPosition + 8, { align: 'center' });
                    
                    const chartImg = await this.captureChart(chartElement);
                    if (chartImg) {
                        doc.addImage(chartImg, 'JPEG', 30, yPosition + 15, 150, 40);
                    }
                    
                    yPosition += 70;
                }
            }

            // Chart per departemen
            // Header baru
            if (yPosition > 120) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.primary);
            doc.text('DISTRIBUSI PER DEPARTEMEN', 105, yPosition, { align: 'center' });
            yPosition += 15;

            const deptCharts = [
                { id: 'deptBerobatChart', label: 'Berobat per Departemen' },
                { id: 'deptKecelakaanChart', label: 'Kecelakaan per Departemen' },
                { id: 'deptKonsultasiChart', label: 'Konsultasi per Departemen' }
            ];

            for (let i = 0; i < deptCharts.length; i++) {
                const chart = deptCharts[i];
                
                // Cek jika perlu halaman baru
                if (yPosition > 180) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const chartElement = document.getElementById(chart.id);
                if (chartElement) {
                    doc.setFillColor(...colors.light);
                    doc.setDrawColor(...colors.primary);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(20, yPosition, 170, 65, 5, 5, 'FD');
                    
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.dark);
                    doc.text(chart.label, 105, yPosition + 8, { align: 'center' });
                    
                    const chartImg = await this.captureChart(chartElement);
                    if (chartImg) {
                        doc.addImage(chartImg, 'JPEG', 30, yPosition + 15, 150, 40);
                    }
                    
                    yPosition += 70;
                }
            }

        } catch (error) {
            console.warn('Error capturing charts for PDF:', error);
            doc.setFontSize(10);
            doc.setTextColor(...colors.warning);
            doc.text('Catatan: Beberapa grafik tidak dapat dimuat dalam laporan ini', 105, yPosition + 20, { align: 'center' });
        }
    },

    addAnalysisSection(doc, colors) {
        let yPosition = 20;
        
        // Section title dengan style konsisten
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('ANALISIS DATA', 105, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Garis dekoratif
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.line(60, yPosition, 150, yPosition);
        yPosition += 5;
        
        // Subtitle
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.secondary);
        doc.text('Analisis mendalam terhadap data kunjungan klinik', 105, yPosition, { align: 'center' });
        yPosition += 15;

        // Container untuk analisis
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition, 170, 250, 5, 5, 'FD');
        
        let contentY = yPosition + 10;

        // 1. Analisis Top Penyakit
        const topPenyakit = this.calculateTopPenyakit();
        if (topPenyakit.length > 0) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.success);
            doc.text('1. Analisis Top 10 Penyakit', 25, contentY);
            contentY += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.dark);
            
            const totalPenyakit = topPenyakit.reduce((sum, item) => sum + item.count, 0);
            const top3Percentage = topPenyakit.slice(0, 3).reduce((sum, item) => sum + item.count, 0) / totalPenyakit * 100;
            
            doc.text(`• Total kasus penyakit: ${totalPenyakit}`, 30, contentY);
            contentY += 5;
            doc.text(`• 3 penyakit teratas mencakup ${top3Percentage.toFixed(1)}% dari total kasus`, 30, contentY);
            contentY += 10;
            
            // Tabel top penyakit
            contentY = this.addTopPenyakitTable(doc, contentY, colors);
            contentY += 10;
        }

        // 2. Analisis SKD per Departemen
        const skdData = this.calculateSKDData();
        if (skdData.length > 0) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.info);
            doc.text('2. Analisis SKD per Departemen', 25, contentY);
            contentY += 8;
            
            const totalSKD = skdData.reduce((sum, item) => sum + item.skd, 0);
            const avgPercentage = skdData.reduce((sum, item) => sum + parseFloat(item.percentage), 0) / skdData.length;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.dark);
            
            doc.text(`• Total SKD dikeluarkan: ${totalSKD}`, 30, contentY);
            contentY += 5;
            doc.text(`• Rata-rata persentase SKD per departemen: ${avgPercentage.toFixed(1)}%`, 30, contentY);
            contentY += 10;
            
            // Tabel SKD
            contentY = this.addSKDTable(doc, contentY, colors);
            contentY += 10;
        }

        // 3. Analisis Top Obat
        const topObat = this.calculateTopObat();
        if (topObat.length > 0) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.warning);
            doc.text('3. Analisis Penggunaan Obat', 25, contentY);
            contentY += 8;
            
            const totalObat = topObat.reduce((sum, item) => sum + item.count, 0);
            const top5Percentage = topObat.slice(0, 5).reduce((sum, item) => sum + item.count, 0) / totalObat * 100;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.dark);
            
            doc.text(`• Total resep obat: ${totalObat}`, 30, contentY);
            contentY += 5;
            doc.text(`• 5 obat teratas mencakup ${top5Percentage.toFixed(1)}% dari total resep`, 30, contentY);
            contentY += 10;
            
            // Tabel top obat
            this.addTopObatTable(doc, contentY, colors);
        }
    },

    addConclusionSection(doc, namaBulan, tahun, colors) {
        let yPosition = 20;
        
        // Section title dengan style konsisten
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('KESIMPULAN DAN SARAN', 105, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Garis dekoratif
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.line(60, yPosition, 150, yPosition);
        yPosition += 15;
        
        // Container untuk kesimpulan dan saran
        doc.setFillColor(...colors.light);
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition, 170, 230, 5, 5, 'FD');
        
        let contentY = yPosition + 10;
        
        // Informasi periode
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.dark);
        
        let periodeText = 'Seluruh Periode';
        if (tahun !== 'all' && namaBulan) {
            periodeText = `${namaBulan} ${tahun}`;
        } else if (tahun !== 'all') {
            periodeText = `Tahun ${tahun}`;
        }
        
        doc.text(`Berdasarkan analisis data periode ${periodeText}:`, 25, contentY);
        contentY += 10;

        // Get statistics untuk kesimpulan
        const stats = this.calculateStatistics();
        const topPenyakit = this.calculateTopPenyakit();
        const skdData = this.calculateSKDData();

        // Kesimpulan
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.success);
        doc.text('KESIMPULAN:', 25, contentY);
        contentY += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        const conclusions = [];
        
        // 1. Total kunjungan
        conclusions.push(`• Total kunjungan klinik: ${stats.totalKunjungan} kunjungan`);
        
        // 2. Distribusi kunjungan
        const berobatPct = (stats.berobatCount / stats.totalKunjungan * 100).toFixed(1);
        const kecelakaanPct = (stats.kecelakaanCount / stats.totalKunjungan * 100).toFixed(1);
        const konsultasiPct = (stats.konsultasiCount / stats.totalKunjungan * 100).toFixed(1);
        
        conclusions.push(`• Distribusi: Berobat (${berobatPct}%), Kecelakaan (${kecelakaanPct}%), Konsultasi (${konsultasiPct}%)`);
        
        // 3. Top penyakit jika ada
        if (topPenyakit.length > 0) {
            const top1 = topPenyakit[0];
            conclusions.push(`• Penyakit terbanyak: "${top1.penyakit.substring(0, 50)}${top1.penyakit.length > 50 ? '...' : ''}" (${top1.count} kasus)`);
        }
        
        // 4. SKD analysis
        if (stats.totalSKD > 0) {
            const skdPct = (stats.totalSKD / stats.berobatCount * 100).toFixed(1);
            conclusions.push(`• SKD dikeluarkan: ${stats.totalSKD} (${skdPct}% dari kunjungan berobat)`);
        }
        
        // 5. Kecelakaan jika ada
        if (stats.kecelakaanCount > 0) {
            conclusions.push(`• Terdapat ${stats.kecelakaanCount} kasus kecelakaan kerja yang memerlukan perhatian khusus`);
        }

        // Tampilkan kesimpulan
        conclusions.forEach((conclusion) => {
            if (contentY > yPosition + 100) return;
            doc.text(conclusion, 30, contentY);
            contentY += 5;
        });

        // Saran
        contentY += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.danger);
        doc.text('SARAN:', 25, contentY);
        contentY += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        const suggestions = [];
        
        // Saran berdasarkan analisis
        if (stats.kecelakaanCount > 0) {
            suggestions.push('• Tingkatkan program keselamatan kerja untuk mengurangi angka kecelakaan');
        }
        
        if (topPenyakit.length > 0) {
            const topDisease = topPenyakit[0].penyakit;
            suggestions.push(`• Lakukan program kesehatan terkait "${topDisease.substring(0, 30)}..." sebagai penyakit terbanyak`);
        }
        
        if (skdData.length > 0) {
            const deptWithHighSKD = skdData.filter(d => parseFloat(d.percentage) > 20);
            if (deptWithHighSKD.length > 0) {
                suggestions.push('• Evaluasi kondisi kerja di departemen dengan persentase SKD tinggi');
            }
        }
        
        // Saran umum
        suggestions.push('• Pertahankan kualitas layanan klinik yang sudah baik');
        suggestions.push('• Tingkatkan promosi layanan konsultasi kesehatan');
        suggestions.push('• Lakukan pemeriksaan kesehatan berkala untuk pencegahan dini');
        
        // Tampilkan saran
        suggestions.forEach((suggestion) => {
            if (contentY > yPosition + 180) return;
            doc.text(suggestion, 30, contentY);
            contentY += 5;
        });

        // Penutup
        contentY += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...colors.secondary);
        doc.text('Laporan ini diharapkan dapat menjadi bahan pertimbangan untuk peningkatan', 25, contentY);
        contentY += 5;
        doc.text('layanan kesehatan perusahaan. Sistem akan terus dimonitor dan dianalisis', 25, contentY);
        contentY += 5;
        doc.text('untuk perbaikan berkelanjutan.', 25, contentY);
    },

    // ============ HELPER METHODS ============
    
    async captureChart(chartElement) {
        try {
            if (!chartElement) return null;
            
            // Gunakan quality yang optimal
            const canvas = await html2canvas(chartElement, {
                scale: 1.5,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 5000
            });
            
            // Konversi ke JPEG dengan kualitas yang baik
            return canvas.toDataURL('image/jpeg', 0.8);
            
        } catch (error) {
            console.warn(`Failed to capture chart:`, error);
            return null;
        }
    },

    calculateStatistics() {
        const allData = dataService.getAllFilteredData();
        const berobatData = dataService.getFilteredBerobat();
        
        return {
            totalKunjungan: allData.length,
            totalLaki: allData.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length,
            totalPerempuan: allData.filter(d => d['Jenis Kelamin'] === 'Perempuan').length,
            berobatCount: berobatData.length,
            kecelakaanCount: dataService.getFilteredKecelakaan().length,
            konsultasiCount: dataService.getFilteredKonsultasi().length,
            totalSKD: berobatData.filter(d => 
                d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya'
            ).length,
            skdLaki: berobatData.filter(d => 
                d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya' && 
                d['Jenis Kelamin'] === 'Laki-laki'
            ).length,
            skdPerempuan: berobatData.filter(d => 
                d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya' && 
                d['Jenis Kelamin'] === 'Perempuan'
            ).length
        };
    },

    calculateSKDData() {
        const allData = dataService.getAllFilteredData();
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
            
            if (d['Jenis Kunjungan'] && d['Jenis Kunjungan'].includes('Berobat')) {
                const isSKD = d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya';
                if (isSKD) {
                    deptSKDStats[dept].skd++;
                    
                    if (d['Jenis Kelamin'] === 'Laki-laki') {
                        deptSKDStats[dept].skdLaki++;
                    } else if (d['Jenis Kelamin'] === 'Perempuan') {
                        deptSKDStats[dept].skdPerempuan++;
                    }
                }
            }
        });

        return Object.entries(deptSKDStats)
            .map(([dept, stats]) => ({
                dept,
                total: stats.total,
                skd: stats.skd,
                percentage: stats.total > 0 ? ((stats.skd / stats.total) * 100).toFixed(1) : '0.0',
                skdLaki: stats.skdLaki,
                skdPerempuan: stats.skdPerempuan
            }))
            .sort((a, b) => b.total - a.total);
    },

    calculateTopPenyakit() {
        const penyakitCounts = {};
        
        dataService.getFilteredBerobat().forEach(d => {
            const diagnosa = d['Diagnosa'] || d['Keterangan Diagnosa'] || 'Tidak Diketahui';
            if (diagnosa && diagnosa !== '-') {
                penyakitCounts[diagnosa] = (penyakitCounts[diagnosa] || 0) + 1;
            }
        });
        
        return Object.entries(penyakitCounts)
            .map(([penyakit, count]) => ({ penyakit, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    },

    calculateTopObat() {
        const obatCounts = {};
        
        dataService.getFilteredBerobat().forEach(d => {
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
        
        return Object.entries(obatCounts)
            .map(([obat, count]) => ({ obat, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    },

    addTopPenyakitTable(doc, startY, colors) {
        let yPosition = startY;
        const topPenyakit = this.calculateTopPenyakit();
        
        if (topPenyakit.length === 0) return yPosition;
        
        // Header tabel
        doc.setFontSize(9);
        doc.setFillColor(...colors.success);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(25, yPosition, 160, 5, 2, 2, 'F');
        
        const headers = ['NO', 'NAMA PENYAKIT / DIAGNOSA', 'JUMLAH'];
        const colWidths = [15, 120, 25];
        
        let xPos = 25;
        headers.forEach((header, i) => {
            doc.text(header, xPos + (i === 0 ? 2 : 5), yPosition + 3.5, 
                    { align: i === 2 ? 'right' : 'left' });
            xPos += colWidths[i];
        });
        
        yPosition += 5;
        
        // Data rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        topPenyakit.forEach((item, index) => {
            xPos = 25;
            
            // Warna baris bergantian
            if (index % 2 === 0) {
                doc.setFillColor(...colors.light);
                doc.roundedRect(25, yPosition, 160, 4.5, 0, 0, 'F');
            }
            
            const rowData = [
                (index + 1).toString(),
                item.penyakit.length > 50 ? item.penyakit.substring(0, 47) + '...' : item.penyakit,
                item.count.toString()
            ];
            
            rowData.forEach((cell, i) => {
                const align = i === 2 ? 'right' : 'left';
                const padding = i === 0 ? 2 : 5;
                doc.text(cell, xPos + padding, yPosition + 3.2, { align });
                xPos += colWidths[i];
            });
            
            yPosition += 4.5;
        });
        
        return yPosition;
    },

    addSKDTable(doc, startY, colors) {
        let yPosition = startY;
        const skdData = this.calculateSKDData();
        const topSKD = skdData.slice(0, 8);
        
        if (topSKD.length === 0) return yPosition;
        
        // Header tabel
        doc.setFontSize(8);
        doc.setFillColor(...colors.info);
        doc.setTextColor(255, 255, 255);
        
        const headers = ['DEPARTEMEN', 'TOTAL', 'SKD', '% SKD', 'L', 'P'];
        const colWidths = [60, 20, 20, 20, 15, 15];
        
        let xPos = 25;
        headers.forEach((header, i) => {
            doc.roundedRect(xPos, yPosition, colWidths[i], 5, 1, 1, 'F');
            doc.text(header, xPos + 2, yPosition + 3.2, 
                    { align: i === 0 ? 'left' : 'right' });
            xPos += colWidths[i];
        });
        
        yPosition += 5;
        
        // Data rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        topSKD.forEach((row, index) => {
            xPos = 25;
            
            // Warna baris bergantian
            if (index % 2 === 0) {
                doc.setFillColor(...colors.light);
                doc.roundedRect(25, yPosition, 140, 4.5, 0, 0, 'F');
            }
            
            const rowData = [
                row.dept.length > 25 ? row.dept.substring(0, 22) + '...' : row.dept,
                row.total.toString(),
                row.skd.toString(),
                row.percentage + '%',
                row.skdLaki.toString(),
                row.skdPerempuan.toString()
            ];
            
            rowData.forEach((cell, i) => {
                const align = i === 0 ? 'left' : 'right';
                doc.text(cell, xPos + (i === 0 ? 2 : 0), yPosition + 3.2, { align });
                xPos += colWidths[i];
            });
            
            yPosition += 4.5;
        });
        
        return yPosition;
    },

    addTopObatTable(doc, startY, colors) {
        let yPosition = startY;
        const topObat = this.calculateTopObat();
        
        if (topObat.length === 0) return;
        
        // Header tabel
        doc.setFontSize(9);
        doc.setFillColor(...colors.warning);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(25, yPosition, 160, 5, 2, 2, 'F');
        
        const headers = ['NO', 'NAMA OBAT', 'JUMLAH RESEP'];
        const colWidths = [15, 120, 25];
        
        let xPos = 25;
        headers.forEach((header, i) => {
            doc.text(header, xPos + (i === 0 ? 2 : 5), yPosition + 3.5, 
                    { align: i === 2 ? 'right' : 'left' });
            xPos += colWidths[i];
        });
        
        yPosition += 5;
        
        // Data rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.dark);
        
        topObat.forEach((item, index) => {
            xPos = 25;
            
            // Warna baris bergantian
            if (index % 2 === 0) {
                doc.setFillColor(...colors.light);
                doc.roundedRect(25, yPosition, 160, 4.5, 0, 0, 'F');
            }
            
            const rowData = [
                (index + 1).toString(),
                item.obat.length > 50 ? item.obat.substring(0, 47) + '...' : item.obat,
                item.count.toString()
            ];
            
            rowData.forEach((cell, i) => {
                const align = i === 2 ? 'right' : 'left';
                const padding = i === 0 ? 2 : 5;
                doc.text(cell, xPos + padding, yPosition + 3.2, { align });
                xPos += colWidths[i];
            });
            
            yPosition += 4.5;
        });
        
        return yPosition;
    },

    getCurrentFilterPeriod() {
        const tahun = document.getElementById('filterTahun').value;
        const bulan = document.getElementById('filterBulan').value;
        
        if (tahun === 'all' && bulan === 'all') return 'Seluruh Periode';
        if (tahun !== 'all' && bulan === 'all') return `Tahun ${tahun}`;
        if (tahun === 'all' && bulan !== 'all') return `Bulan ${BULAN_NAMES[parseInt(bulan)-1]}`;
        return `${BULAN_NAMES[parseInt(bulan)-1]} ${tahun}`;
    },

    generateFileName(perusahaan, departemen, tahun, bulan) {
        const parts = [];
        if (perusahaan !== 'all') parts.push(perusahaan.replace(/\s+/g, '_'));
        if (departemen !== 'all') parts.push(departemen.replace(/\s+/g, '_'));
        if (tahun !== 'all') parts.push(tahun);
        if (bulan !== 'all') parts.push(BULAN_NAMES[parseInt(bulan)-1]);
        
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
        
        let fileName = 'Laporan_IHC';
        if (parts.length > 0) fileName += '_' + parts.join('_');
        fileName += '_' + timestamp + '.pdf';
        
        // Clean filename
        return fileName.replace(/[^a-zA-Z0-9_\-.()[\]]/g, '_');
    },

    addFooter(doc, colors) {
        const pageCount = doc.internal.getNumberOfPages();
        const currentDate = new Date();
        const timestamp = `${currentDate.getDate().toString().padStart(2,'0')}/${(currentDate.getMonth()+1).toString().padStart(2,'0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2,'0')}:${currentDate.getMinutes().toString().padStart(2,'0')}`;
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(0.3);
            doc.line(20, 280, 190, 280);
            
            // Footer text
            doc.setFontSize(7);
            doc.setTextColor(...colors.secondary);
            
            // Left: Page info
            doc.text(`Halaman ${i} dari ${pageCount}`, 25, 285);
            
            // Center: Copyright
            doc.text('© 2025 In House Clinic Management System', 105, 285, { align: 'center' });
            
            // Right: Timestamp
            doc.text(`Dicetak: ${timestamp}`, 165, 285, { align: 'right' });
            
            // Confidential notice
            doc.setFontSize(6);
            doc.setTextColor(153, 153, 153);
            doc.text('Dokumen ini bersifat rahasia dan hanya untuk penggunaan internal.', 105, 290, { align: 'center' });
        }
    }
};
