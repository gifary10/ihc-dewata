// pdfGenerator.js
import { dataService } from './dataService.js';
import { BULAN_NAMES } from './config.js';
import { utils } from './utils.js';

export const pdfGenerator = {
    async generatePDF() {
        try {
            // Show loading
            if (window.loadingManager) {
                window.loadingManager.show('Membuat laporan PDF...');
            }

            // Create PDF document
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Get current date
            const currentDate = new Date();
            const formattedDate = utils.formatDate(currentDate);
            
            // Get filter values
            const perusahaan = document.getElementById('filterPerusahaan').value;
            const departemen = document.getElementById('filterDepartemen').value;
            const tahun = document.getElementById('filterTahun').value;
            const bulan = document.getElementById('filterBulan').value;

            // Set document properties
            doc.setProperties({
                title: 'Laporan Klinik IHC',
                subject: 'Laporan Statistik Kesehatan',
                author: 'Klinik Dewata Tirta Medika'
            });

            // Add header
            this.addHeader(doc, formattedDate, perusahaan, departemen, tahun, bulan);

            // Add statistics section
            this.addStatistics(doc);

            // Add charts section
            await this.addCharts(doc);

            // Add tables section
            this.addTables(doc);

            // Add footer
            this.addFooter(doc);

            // Save PDF
            const fileName = this.generateFileName(perusahaan, departemen, tahun, bulan);
            doc.save(fileName);

            // Hide loading
            if (window.loadingManager) {
                window.loadingManager.hide();
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showError('Gagal membuat laporan PDF: ' + error.message);
            
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    },

    addHeader(doc, currentDate, perusahaan, departemen, tahun, bulan) {
        // Company logo and title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('LAPORAN STATISTIK KLINIK', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setTextColor(108, 117, 125);
        doc.setFont('helvetica', 'normal');
        doc.text('Klinik Dewata Tirta Medika', 105, 28, { align: 'center' });

        // Report info
        doc.setFontSize(10);
        doc.setTextColor(33, 37, 41);
        doc.text(`Tanggal Laporan: ${currentDate}`, 20, 40);
        doc.text(`Dibuat Oleh: Sistem Dashboard IHC`, 20, 45);

        // Filter info
        let filterInfo = 'Filter: ';
        const filterParts = [];
        if (perusahaan !== 'all') filterParts.push(`Perusahaan: ${perusahaan}`);
        if (departemen !== 'all') filterParts.push(`Departemen: ${departemen}`);
        if (tahun !== 'all') filterParts.push(`Tahun: ${tahun}`);
        if (bulan !== 'all') filterParts.push(`Bulan: ${BULAN_NAMES[parseInt(bulan)-1]}`);
        
        if (filterParts.length === 0) {
            filterInfo += 'Semua Data';
        } else {
            filterInfo += filterParts.join(', ');
        }
        
        doc.text(filterInfo, 20, 50);

        // Add line separator
        doc.setDrawColor(2, 49, 153);
        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);
    },

    addStatistics(doc) {
        let yPosition = 65;
        
        // Section title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('STATISTIK UTAMA', 20, yPosition);
        
        yPosition += 10;

        // Get statistics
        const allData = dataService.getAllFilteredData();
        const totalLaki = allData.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length;
        const totalPerempuan = allData.filter(d => d['Jenis Kelamin'] === 'Perempuan').length;
        const totalKunjungan = allData.length;
        const totalSKD = dataService.getFilteredBerobat().filter(d => 
            d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya'
        ).length;
        
        const berobatCount = dataService.getFilteredBerobat().length;
        const kecelakaanCount = dataService.getFilteredKecelakaan().length;
        const konsultasiCount = dataService.getFilteredKonsultasi().length;

        // Statistics table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        
        // Table header
        doc.setFillColor(2, 49, 153);
        doc.setTextColor(255, 255, 255);
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.text('JENIS STATISTIK', 25, yPosition + 5.5);
        doc.text('JUMLAH', 165, yPosition + 5.5, { align: 'right' });
        
        yPosition += 8;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 37, 41);
        
        const stats = [
            ['Total Kunjungan', totalKunjungan],
            ['Laki-laki', totalLaki],
            ['Perempuan', totalPerempuan],
            ['Total SKD', totalSKD],
            ['Kunjungan Berobat', berobatCount],
            ['Kecelakaan Kerja', kecelakaanCount],
            ['Konsultasi', konsultasiCount]
        ];

        stats.forEach(([label, value], index) => {
            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(20, yPosition, 170, 8, 'F');
            }
            
            doc.text(label, 25, yPosition + 5.5);
            doc.text(value.toString(), 165, yPosition + 5.5, { align: 'right' });
            yPosition += 8;
        });

        yPosition += 5;
        
        // Add some space
        return yPosition;
    },

    async addCharts(doc) {
        let yPosition = 140;
        
        // Section title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('GRAFIK STATISTIK', 20, yPosition);
        
        yPosition += 10;

        try {
            // Capture gender chart
            const genderChart = document.getElementById('genderChart');
            if (genderChart) {
                const chartCanvas = await html2canvas(genderChart, {
                    scale: 2,
                    backgroundColor: '#ffffff'
                });
                
                const chartImg = chartCanvas.toDataURL('image/png');
                doc.addImage(chartImg, 'PNG', 20, yPosition, 80, 60);
            }

            // Capture visit type chart
            const visitTypeChart = document.getElementById('visitTypeChart');
            if (visitTypeChart) {
                const chartCanvas = await html2canvas(visitTypeChart, {
                    scale: 2,
                    backgroundColor: '#ffffff'
                });
                
                const chartImg = chartCanvas.toDataURL('image/png');
                doc.addImage(chartImg, 'PNG', 110, yPosition, 80, 60);
            }

            yPosition += 70;

            // Capture department charts
            const deptCharts = [
                { id: 'deptBerobatChart', title: 'Berobat per Departemen' },
                { id: 'deptKecelakaanChart', title: 'Kecelakaan per Departemen' },
                { id: 'deptKonsultasiChart', title: 'Konsultasi per Departemen' }
            ];

            for (let i = 0; i < deptCharts.length; i++) {
                if (i > 0 && i % 2 === 0) {
                    doc.addPage();
                    yPosition = 20;
                }

                const chartElement = document.getElementById(deptCharts[i].id);
                if (chartElement) {
                    const chartCanvas = await html2canvas(chartElement, {
                        scale: 2,
                        backgroundColor: '#ffffff'
                    });
                    
                    const chartImg = chartCanvas.toDataURL('image/png');
                    const xPos = (i % 2 === 0) ? 20 : 110;
                    
                    // Add chart title
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(33, 37, 41);
                    doc.text(deptCharts[i].title, xPos, yPosition - 5);
                    
                    doc.addImage(chartImg, 'PNG', xPos, yPosition, 80, 40);
                    
                    if (i % 2 === 1) {
                        yPosition += 50;
                    }
                }
            }

        } catch (error) {
            console.error('Error capturing charts:', error);
            doc.setFontSize(10);
            doc.setTextColor(220, 53, 69);
            doc.text('Gagal memuat grafik untuk PDF', 20, yPosition);
            yPosition += 20;
        }

        return yPosition;
    },

    addTables(doc) {
        // Add new page for tables
        doc.addPage();
        let yPosition = 20;

        // Section title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 49, 153);
        doc.text('DATA DETAIL', 20, yPosition);
        
        yPosition += 10;

        // SKD Table
        doc.setFontSize(12);
        doc.text('SKD per Departemen', 20, yPosition);
        yPosition += 5;

        // Get SKD data
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

        const sortedDepts = Object.entries(deptSKDStats)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10); // Limit to top 10

        // Create table
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        // Table header
        const headers = ['Departemen', 'Total', 'SKD', '%', 'Laki', 'Perempuan'];
        const colWidths = [50, 20, 20, 20, 20, 30];
        let xPos = 20;

        // Draw header
        doc.setFillColor(2, 49, 153);
        doc.setTextColor(255, 255, 255);
        headers.forEach((header, i) => {
            doc.rect(xPos, yPosition, colWidths[i], 7, 'F');
            doc.text(header, xPos + 2, yPosition + 4.5);
            xPos += colWidths[i];
        });

        yPosition += 7;

        // Draw rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 37, 41);
        
        sortedDepts.forEach(([dept, stats], rowIndex) => {
            xPos = 20;
            
            // Alternate row colors
            if (rowIndex % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(20, yPosition, 170, 6, 'F');
            }

            const persentaseSKD = stats.total > 0 ? ((stats.skd / stats.total) * 100).toFixed(1) : '0.0';
            
            const rowData = [
                dept,
                stats.total.toString(),
                stats.skd.toString(),
                persentaseSKD + '%',
                stats.skdLaki.toString(),
                stats.skdPerempuan.toString()
            ];

            rowData.forEach((cell, i) => {
                doc.text(cell, xPos + 2, yPosition + 4);
                xPos += colWidths[i];
            });

            yPosition += 6;

            // Add new page if needed
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
        });

        return yPosition;
    },

    addFooter(doc) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(2, 49, 153);
            doc.setLineWidth(0.3);
            doc.line(20, 280, 190, 280);
            
            // Page number
            doc.setFontSize(8);
            doc.setTextColor(108, 117, 125);
            doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: 'center' });
            
            // Copyright
            doc.text('© 2025 Klinik Dewata Tirta Medika - In House Clinic Dashboard', 105, 290, { align: 'center' });
        }
    },

    generateFileName(perusahaan, departemen, tahun, bulan) {
        let fileName = 'Laporan_Klinik_IHC_';
        
        if (perusahaan !== 'all') fileName += perusahaan + '_';
        if (departemen !== 'all') fileName += departemen + '_';
        if (tahun !== 'all') fileName += tahun + '_';
        if (bulan !== 'all') fileName += BULAN_NAMES[parseInt(bulan)-1] + '_';
        
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
        
        fileName += timestamp + '.pdf';
        
        return fileName.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    }
};