// pdfGenerator.js - OPTIMIZED VERSION
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
                format: 'a4',
                compress: true // Enable compression
            });

            // Get current date dan filter values
            const currentDate = new Date();
            const formattedDate = utils.formatDate(currentDate);
            
            const perusahaan = document.getElementById('filterPerusahaan').value;
            const departemen = document.getElementById('filterDepartemen').value;
            const tahun = document.getElementById('filterTahun').value;
            const bulan = document.getElementById('filterBulan').value;

            // Optimasi: Set semua properties sekaligus
            doc.setProperties({
                title: 'Laporan Statistik Klinik IHC',
                subject: 'Laporan Kesehatan dan Keselamatan Kerja',
                author: 'Klinik Dewata Tirta Medika',
                keywords: 'kesehatan, klinik, IHC, statistik, laporan',
                creator: 'Dashboard IHC'
            });

            // OPTIMASI: Group semua operasi yang terkait
            this.addHeaderSection(doc, formattedDate, perusahaan, departemen, tahun, bulan);
            this.addStatisticsSection(doc);
            
            // Capture charts dengan quality yang lebih rendah untuk ukuran file yang lebih kecil
            await this.addChartsSection(doc);
            
            this.addTablesSection(doc);
            this.addFooterSection(doc);

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

    addHeaderSection(doc, currentDate, perusahaan, departemen, tahun, bulan) {
        // Header dengan styling yang lebih konsisten
        doc.setFont('helvetica', 'bold');
        
        // Judul utama
        doc.setFontSize(18);
        doc.setTextColor(2, 49, 153);
        doc.text('LAPORAN STATISTIK KLINIK', 105, 20, { align: 'center' });
        
        // Sub judul
        doc.setFontSize(12);
        doc.setTextColor(108, 117, 125);
        doc.setFont('helvetica', 'normal');
        doc.text('Klinik Dewata Tirta Medika - In House Clinic', 105, 27, { align: 'center' });

        // Informasi laporan - dipadatkan
        doc.setFontSize(9);
        doc.setTextColor(33, 37, 41);
        
        // Grid informasi dalam 2 kolom
        const infoLeft = [
            `Tanggal Laporan: ${currentDate}`,
            `Dibuat Oleh: Sistem Dashboard IHC`
        ];
        
        const infoRight = [
            `Periode: ${this.getPeriodText(tahun, bulan)}`,
            `Total Data: ${dataService.getAllFilteredData().length} records`
        ];
        
        // Tampilkan informasi kiri
        infoLeft.forEach((text, index) => {
            doc.text(text, 20, 40 + (index * 5));
        });
        
        // Tampilkan informasi kanan
        infoRight.forEach((text, index) => {
            doc.text(text, 130, 40 + (index * 5));
        });

        // Filter info dalam satu baris
        const filterInfo = this.generateFilterInfo(perusahaan, departemen, tahun, bulan);
        doc.text(`Filter Terapan: ${filterInfo}`, 20, 52);

        // Garis pemisah yang lebih tipis
        doc.setDrawColor(2, 49, 153);
        doc.setLineWidth(0.3);
        doc.line(20, 57, 190, 57);
    },

    addStatisticsSection(doc) {
        let yPosition = 65;
        
        // Section title dengan background
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition, 170, 8, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('STATISTIK UTAMA', 25, yPosition + 5.5);
        
        yPosition += 12;

        // Get statistics dengan caching
        const stats = this.calculateStatistics();
        
        // Table header yang lebih kompak
        doc.setFontSize(10);
        doc.setFillColor(2, 49, 153);
        doc.setTextColor(255, 255, 255);
        doc.rect(20, yPosition, 170, 6, 'F');
        
        // Header columns
        const headers = ['KATEGORI', 'JUMLAH', 'PERSENTASE'];
        const colPositions = [25, 130, 165];
        const colAlign = ['left', 'right', 'right'];
        
        headers.forEach((header, i) => {
            doc.text(header, colPositions[i], yPosition + 4, { align: colAlign[i] });
        });
        
        yPosition += 6;

        // Table rows - data yang lebih relevan
        doc.setFont('helvetica', 'normal');
        
        const statisticsData = [
            { label: 'Total Kunjungan', value: stats.totalKunjungan },
            { label: 'Kunjungan Berobat', value: stats.berobatCount, percentage: stats.berobatCount / stats.totalKunjungan },
            { label: 'Kecelakaan Kerja', value: stats.kecelakaanCount, percentage: stats.kecelakaanCount / stats.totalKunjungan },
            { label: 'Konsultasi', value: stats.konsultasiCount, percentage: stats.konsultasiCount / stats.totalKunjungan },
            { label: 'Total SKD', value: stats.totalSKD },
            { label: 'Laki-laki (SKD)', value: stats.skdLaki },
            { label: 'Perempuan (SKD)', value: stats.skdPerempuan }
        ];

        statisticsData.forEach((item, index) => {
            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(20, yPosition, 170, 5, 'F');
            }
            
            doc.setTextColor(33, 37, 41);
            doc.text(item.label, 25, yPosition + 3.5);
            
            // Format number with thousands separator
            const formattedValue = item.value.toLocaleString('id-ID');
            doc.text(formattedValue, 130, yPosition + 3.5, { align: 'right' });
            
            // Percentage jika ada
            if (item.percentage !== undefined) {
                const percentage = (item.percentage * 100).toFixed(1);
                doc.text(`${percentage}%`, 165, yPosition + 3.5, { align: 'right' });
            }
            
            yPosition += 5;
        });

        // Spacing untuk section berikutnya
        yPosition += 8;
        return yPosition;
    },

    async addChartsSection(doc) {
        let yPosition = 125;
        
        // Section title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('VISUALISASI DATA', 20, yPosition);
        yPosition += 8;

        try {
            // Daftar charts yang akan di-capture dengan urutan yang logis
            const chartsToCapture = [
                { id: 'genderChart', label: 'Distribusi Gender', width: 85, height: 60 },
                { id: 'visitTypeChart', label: 'Jenis Kunjungan', width: 85, height: 60 }
            ];

            // Capture dan tambahkan charts dalam baris yang sama
            for (let i = 0; i < chartsToCapture.length; i++) {
                const chart = chartsToCapture[i];
                const xPos = 20 + (i * 95);
                
                // Chart label
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(108, 117, 125);
                doc.text(chart.label, xPos, yPosition - 3);
                
                // Capture chart dengan pengaturan yang dioptimasi
                const chartImg = await this.captureChart(chart.id);
                if (chartImg) {
                    doc.addImage(chartImg, 'JPEG', xPos, yPosition, chart.width, chart.height);
                } else {
                    doc.setFontSize(8);
                    doc.setTextColor(220, 53, 69);
                    doc.text('Chart tidak tersedia', xPos + 10, yPosition + 30);
                }
                
                // Jika ini chart kedua, tambahkan baris baru
                if (i === chartsToCapture.length - 1) {
                    yPosition += chart.height + 15;
                }
            }

            // Charts per departemen - diatur dalam grid 2x1
            const deptCharts = [
                { id: 'deptBerobatChart', label: 'Berobat per Departemen' },
                { id: 'deptKecelakaanChart', label: 'Kecelakaan per Departemen' }
            ];

            for (let i = 0; i < deptCharts.length; i++) {
                const chart = deptCharts[i];
                const xPos = 20 + (i * 95);
                
                // Chart label
                doc.setFontSize(10);
                doc.setTextColor(108, 117, 125);
                doc.text(chart.label, xPos, yPosition - 3);
                
                const chartImg = await this.captureChart(chart.id);
                if (chartImg) {
                    doc.addImage(chartImg, 'JPEG', xPos, yPosition, 85, 45);
                }
                
                if (i === deptCharts.length - 1) {
                    yPosition += 50;
                }
            }

        } catch (error) {
            console.warn('Error capturing charts for PDF:', error);
            doc.setFontSize(9);
            doc.setTextColor(255, 193, 7);
            doc.text('Catatan: Beberapa grafik tidak dapat dimuat dalam laporan ini', 20, yPosition + 20);
            yPosition += 30;
        }

        return yPosition;
    },

    addTablesSection(doc) {
        // Cek jika ada data sebelum membuat tabel
        const allData = dataService.getAllFilteredData();
        if (allData.length === 0) {
            doc.setFontSize(11);
            doc.setTextColor(108, 117, 125);
            doc.text('Tidak ada data untuk ditampilkan dalam tabel.', 20, 210);
            return;
        }

        // Add new page untuk tabel
        doc.addPage();
        let yPosition = 20;

        // Section title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('ANALISIS DETAIL', 20, yPosition);
        yPosition += 8;

        // 1. Tabel SKD (disingkat jika terlalu banyak)
        this.addSKDTable(doc, yPosition);
        
        // 2. Tabel Top Penyakit (halaman berikutnya jika perlu)
        doc.addPage();
        yPosition = 20;
        this.addTopPenyakitTable(doc, yPosition);
    },

    addSKDTable(doc, startY) {
        let yPosition = startY + 5;
        
        // Sub title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('SKD per Departemen (Top 15)', 20, yPosition);
        yPosition += 5;

        // Get dan sort data SKD
        const skdData = this.calculateSKDData();
        const topSKD = skdData.slice(0, 15); // Batasi 15 departemen teratas

        // Setup tabel
        doc.setFontSize(8);
        
        // Header tabel
        const headers = ['DEPARTEMEN', 'TOTAL', 'SKD', '% SKD', 'L', 'P'];
        const colWidths = [60, 20, 20, 20, 15, 15];
        const colAlign = ['left', 'right', 'right', 'right', 'right', 'right'];
        
        // Draw header
        doc.setFillColor(2, 49, 153);
        doc.setTextColor(255, 255, 255);
        let xPos = 20;
        
        headers.forEach((header, i) => {
            doc.rect(xPos, yPosition, colWidths[i], 5, 'F');
            doc.text(header, xPos + 2, yPosition + 3.2, { align: colAlign[i] });
            xPos += colWidths[i];
        });
        
        yPosition += 5;

        // Draw rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 37, 41);
        
        topSKD.forEach((row, index) => {
            xPos = 20;
            
            // Warna baris bergantian
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(20, yPosition, 150, 4.5, 'F');
            }

            // Data cells
            const rowData = [
                row.dept.length > 25 ? row.dept.substring(0, 22) + '...' : row.dept,
                row.total.toString(),
                row.skd.toString(),
                row.percentage + '%',
                row.skdLaki.toString(),
                row.skdPerempuan.toString()
            ];

            rowData.forEach((cell, i) => {
                doc.text(cell, xPos + 2, yPosition + 3.2, { align: colAlign[i] });
                xPos += colWidths[i];
            });

            yPosition += 4.5;
            
            // Check page break
            if (yPosition > 270 && index < topSKD.length - 1) {
                doc.addPage();
                yPosition = 20;
                
                // Redraw header di halaman baru
                xPos = 20;
                doc.setFillColor(2, 49, 153);
                doc.setTextColor(255, 255, 255);
                headers.forEach((header, i) => {
                    doc.rect(xPos, yPosition, colWidths[i], 5, 'F');
                    doc.text(header, xPos + 2, yPosition + 3.2, { align: colAlign[i] });
                    xPos += colWidths[i];
                });
                yPosition += 5;
            }
        });
    },

    addTopPenyakitTable(doc, startY) {
        let yPosition = startY + 5;
        
        // Sub title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Top 10 Penyakit', 20, yPosition);
        yPosition += 5;

        // Get top penyakit data
        const topPenyakit = this.calculateTopPenyakit();
        
        if (topPenyakit.length === 0) {
            doc.setFontSize(9);
            doc.setTextColor(108, 117, 125);
            doc.text('Tidak ada data penyakit yang tersedia.', 20, yPosition + 10);
            return;
        }

        // Setup tabel
        doc.setFontSize(9);
        
        // Header tabel yang lebih sederhana
        const headers = ['NO', 'NAMA PENYAKIT / DIAGNOSA', 'JUMLAH KASUS'];
        const colWidths = [15, 120, 35];
        
        // Draw header
        doc.setFillColor(40, 167, 69);
        doc.setTextColor(255, 255, 255);
        let xPos = 20;
        
        headers.forEach((header, i) => {
            doc.rect(xPos, yPosition, colWidths[i], 5, 'F');
            doc.text(header, xPos + (i === 1 ? 5 : 2), yPosition + 3.2, 
                    { align: i === 2 ? 'right' : 'left' });
            xPos += colWidths[i];
        });
        
        yPosition += 5;

        // Draw rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 37, 41);
        
        topPenyakit.forEach((item, index) => {
            xPos = 20;
            
            // Warna baris bergantian
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(20, yPosition, 170, 4.5, 'F');
            }

            // Data cells
            const rowData = [
                (index + 1).toString(),
                item.penyakit.length > 50 ? item.penyakit.substring(0, 47) + '...' : item.penyakit,
                item.count.toString()
            ];

            rowData.forEach((cell, i) => {
                const align = i === 2 ? 'right' : 'left';
                const padding = i === 1 ? 5 : 2;
                doc.text(cell, xPos + padding, yPosition + 3.2, { align });
                xPos += colWidths[i];
            });

            yPosition += 4.5;
        });
    },

    addFooterSection(doc) {
        const pageCount = doc.internal.getNumberOfPages();
        const currentDate = new Date();
        const timestamp = `${currentDate.getDate().toString().padStart(2,'0')}/${(currentDate.getMonth()+1).toString().padStart(2,'0')}/${currentDate.getFullYear()} ${currentDate.getHours().toString().padStart(2,'0')}:${currentDate.getMinutes().toString().padStart(2,'0')}`;
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(2, 49, 153);
            doc.setLineWidth(0.2);
            doc.line(20, 280, 190, 280);
            
            // Footer text - lebih informatif
            doc.setFontSize(7);
            doc.setTextColor(108, 117, 125);
            
            // Left: Page info
            doc.text(`Halaman ${i} dari ${pageCount}`, 25, 285);
            
            // Center: Copyright
            doc.text('© 2025 Klinik Dewata Tirta Medika - Sistem Dashboard IHC', 105, 285, { align: 'center' });
            
            // Right: Timestamp
            doc.text(`Dicetak: ${timestamp}`, 165, 285, { align: 'right' });
            
            // Confidential notice
            doc.setFontSize(6);
            doc.setTextColor(153, 153, 153);
            doc.text('Dokumen ini bersifat rahasia dan hanya untuk penggunaan internal.', 105, 290, { align: 'center' });
        }
    },

    // ============ HELPER METHODS ============
    
    async captureChart(chartId) {
        try {
            const chartElement = document.getElementById(chartId);
            if (!chartElement) return null;
            
            // Gunakan quality yang lebih rendah untuk mengurangi ukuran file
            const canvas = await html2canvas(chartElement, {
                scale: 1.5, // Reduced from 2.0
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 5000 // Timeout 5 detik
            });
            
            // Konversi ke JPEG dengan kualitas 0.8 untuk kompresi yang lebih baik
            return canvas.toDataURL('image/jpeg', 0.8);
            
        } catch (error) {
            console.warn(`Failed to capture chart ${chartId}:`, error);
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

    generateFilterInfo(perusahaan, departemen, tahun, bulan) {
        const parts = [];
        if (perusahaan !== 'all') parts.push(`Perusahaan: ${perusahaan}`);
        if (departemen !== 'all') parts.push(`Departemen: ${departemen}`);
        if (tahun !== 'all') parts.push(`Tahun: ${tahun}`);
        if (bulan !== 'all') parts.push(`Bulan: ${BULAN_NAMES[parseInt(bulan)-1]}`);
        
        return parts.length > 0 ? parts.join(', ') : 'Semua Data';
    },

    getPeriodText(tahun, bulan) {
        if (tahun === 'all' && bulan === 'all') return 'Semua Periode';
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
        
        let fileName = 'Laporan_Klinik_IHC';
        if (parts.length > 0) fileName += '_' + parts.join('_');
        fileName += '_' + timestamp + '.pdf';
        
        // Clean filename
        return fileName.replace(/[^a-zA-Z0-9_\-.()[\]]/g, '_');
    }
};
