import { dataService } from './dataService.js';
import { BULAN_NAMES } from './config.js';
import { utils } from './utils.js';

export const pdfGenerator = {
    async generatePDF() {
        try {
            if (window.loadingManager) {
                window.loadingManager.show('Menyiapkan laporan PDF...');
            }

            // Tunggu sedikit untuk memastikan semua chart selesai dirender
            await new Promise(resolve => setTimeout(resolve, 500));

            const currentDate = new Date();
            const formattedDate = utils.formatDate(currentDate);
            
            const perusahaan = document.getElementById('filterPerusahaan').value;
            const departemen = document.getElementById('filterDepartemen').value;
            const tahun = document.getElementById('filterTahun').value;
            const bulan = document.getElementById('filterBulan').value;
            
            const namaPerusahaan = perusahaan !== 'all' ? perusahaan : 'Klinik Dewata Tirta Medika';
            const namaBulan = bulan !== 'all' ? BULAN_NAMES[parseInt(bulan)-1] : '';
            const judulBulan = namaBulan ? `BULAN ${namaBulan.toUpperCase()}` : '';

            const pdfContent = this.createPDFContent(namaPerusahaan, judulBulan, formattedDate);
            
            const options = {
                margin: [15, 15, 15, 15],
                filename: this.generateFileName(perusahaan, departemen, tahun, bulan),
                image: { 
                    type: 'jpeg', 
                    quality: 0.98 
                },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait'
                }
            };

            console.log('Generating PDF with options:', options);
            
            // Periksa apakah html2pdf tersedia
            if (typeof html2pdf === 'undefined') {
                throw new Error('html2pdf library tidak dimuat. Silakan refresh halaman.');
            }
            
            // Generate PDF
            await html2pdf().set(options).from(pdfContent).save();

            // Bersihkan elemen setelah selesai
            setTimeout(() => {
                if (pdfContent && pdfContent.parentNode) {
                    pdfContent.parentNode.removeChild(pdfContent);
                }
            }, 1000);

            return true;

        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showError(`Gagal membuat laporan PDF: ${error.message}`);
            return false;
        } finally {
            if (window.loadingManager) {
                setTimeout(() => window.loadingManager.hide(), 300);
            }
        }
    },

    createPDFContent(namaPerusahaan, judulBulan, currentDate) {
        const pdfDiv = document.createElement('div');
        pdfDiv.id = 'pdf-content-container';
        pdfDiv.style.cssText = `
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #333;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 20mm;
            box-sizing: border-box;
            visibility: visible;
            opacity: 1;
            position: absolute;
            left: -9999px;
            top: 0;
        `;

        const stats = this.calculateStatistics();
        const topPenyakit = this.calculateTopPenyakit();
        const topObat = this.calculateTopObat();
        const skdData = this.calculateSKDData();
        
        pdfDiv.innerHTML = this.generatePDFHTML(stats, topPenyakit, topObat, skdData, namaPerusahaan, judulBulan, currentDate);
        
        document.body.appendChild(pdfDiv);
        
        return pdfDiv;
    },

    generatePDFHTML(stats, topPenyakit, topObat, skdData, namaPerusahaan, judulBulan, currentDate) {
        return `
            <div class="pdf-content" style="width: 100%; min-height: 257mm;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #023199; padding-bottom: 20px;">
                    <h1 style="color: #023199; font-size: 24px; margin-bottom: 10px;">LAPORAN IHC</h1>
                    ${judulBulan ? `<h2 style="color: #666; font-size: 18px; margin-bottom: 15px;">${judulBulan}</h2>` : ''}
                    <h3 style="color: #333; font-size: 16px;">${this.escapeHtml(namaPerusahaan)}</h3>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">
                        Tanggal Laporan: ${currentDate} | Periode: ${this.getCurrentFilterPeriod()}
                    </p>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #023199; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        Ringkasan Data
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 12px;">
                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Kunjungan</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #023199;">
                                ${stats.totalKunjungan.toLocaleString()}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">Kunjungan Berobat</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
                                ${stats.berobatCount.toLocaleString()} (${stats.totalKunjungan > 0 ? ((stats.berobatCount / stats.totalKunjungan * 100).toFixed(1)) : '0.0'}%)
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">Kecelakaan Kerja</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
                                ${stats.kecelakaanCount.toLocaleString()} (${stats.totalKunjungan > 0 ? ((stats.kecelakaanCount / stats.totalKunjungan * 100).toFixed(1)) : '0.0'}%)
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">Konsultasi</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
                                ${stats.konsultasiCount.toLocaleString()} (${stats.totalKunjungan > 0 ? ((stats.konsultasiCount / stats.totalKunjungan * 100).toFixed(1)) : '0.0'}%)
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">Total SKD Dikeluarkan</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">
                                ${stats.totalSKD.toLocaleString()} (${stats.berobatCount > 0 ? ((stats.totalSKD / stats.berobatCount * 100).toFixed(1)) : '0.0'}%)
                            </td>
                        </tr>
                    </table>
                </div>

                ${topPenyakit.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="color: #023199; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        Top 10 Penyakit / Diagnosa
                    </h3>
                    ${this.generateTopPenyakitTable(topPenyakit)}
                </div>
                ` : ''}

                ${topObat.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="color: #023199; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        Top 10 Obat Terbanyak
                    </h3>
                    ${this.generateTopObatTable(topObat)}
                </div>
                ` : ''}

                ${skdData.length > 0 ? `
                <div style="margin-bottom: 30px; page-break-inside: avoid;">
                    <h3 style="color: #023199; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        Analisis SKD per Departemen
                    </h3>
                    ${this.generateSKDTable(skdData)}
                </div>
                ` : ''}

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 11px;">
                    <p>© 2025 In House Clinic Management System • ${currentDate} • Laporan dibuat otomatis dari Dashboard IHC</p>
                </div>
            </div>
        `;
    },

    generateTopPenyakitTable(topPenyakit) {
        if (topPenyakit.length === 0) {
            return '<p style="text-align: center; color: #666; padding: 20px;">Data tidak tersedia</p>';
        }

        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 11px;">
                <thead>
                    <tr style="background-color: #023199; color: white;">
                        <th style="padding: 8px; text-align: left; width: 10%;">No</th>
                        <th style="padding: 8px; text-align: left; width: 70%;">Penyakit / Diagnosa</th>
                        <th style="padding: 8px; text-align: right; width: 20%;">Jumlah Kasus</th>
                    </tr>
                </thead>
                <tbody>
        `;

        topPenyakit.forEach((item, index) => {
            const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            tableHTML += `
                <tr style="background-color: ${rowColor};">
                    <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${this.truncateText(item.penyakit, 60)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #023199;">
                        ${item.count.toLocaleString()}
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    },

    generateTopObatTable(topObat) {
        if (topObat.length === 0) {
            return '<p style="text-align: center; color: #666; padding: 20px;">Data tidak tersedia</p>';
        }

        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 11px;">
                <thead>
                    <tr style="background-color: #17a2b8; color: white;">
                        <th style="padding: 8px; text-align: left; width: 10%;">No</th>
                        <th style="padding: 8px; text-align: left; width: 70%;">Nama Obat</th>
                        <th style="padding: 8px; text-align: right; width: 20%;">Jumlah Resep</th>
                    </tr>
                </thead>
                <tbody>
        `;

        topObat.forEach((item, index) => {
            const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            tableHTML += `
                <tr style="background-color: ${rowColor};">
                    <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${index + 1}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${this.truncateText(item.obat, 60)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #17a2b8;">
                        ${item.count.toLocaleString()}
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    },

    generateSKDTable(skdData) {
        if (skdData.length === 0) {
            return '<p style="text-align: center; color: #666; padding: 20px;">Data tidak tersedia</p>';
        }

        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 11px;">
                <thead>
                    <tr style="background-color: #28a745; color: white;">
                        <th style="padding: 8px; text-align: left;">Departemen</th>
                        <th style="padding: 8px; text-align: center;">Total</th>
                        <th style="padding: 8px; text-align: center;">SKD</th>
                        <th style="padding: 8px; text-align: center;">% SKD</th>
                    </tr>
                </thead>
                <tbody>
        `;

        skdData.slice(0, 10).forEach((item, index) => {
            const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            const percentage = parseFloat(item.percentage);
            tableHTML += `
                <tr style="background-color: ${rowColor};">
                    <td style="padding: 6px; border: 1px solid #ddd;">${this.truncateText(item.dept, 30)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.total}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: center; color: #28a745; font-weight: bold;">${item.skd}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
                        <div style="width: 100%; background-color: #e9ecef; border-radius: 3px; height: 6px; margin-bottom: 3px;">
                            <div style="width: ${Math.min(percentage, 100)}%; height: 100%; background-color: #28a745; border-radius: 3px;"></div>
                        </div>
                        <div style="font-size: 10px; color: #666;">${item.percentage}%</div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    },

    truncateText(text, maxLength) {
        if (!text) return 'Tidak Diketahui';
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    calculateStatistics() {
        const allData = dataService.getAllFilteredData();
        const berobatData = dataService.getFilteredBerobat();
        
        return {
            totalKunjungan: allData.length,
            berobatCount: berobatData.length,
            kecelakaanCount: dataService.getFilteredKecelakaan().length,
            konsultasiCount: dataService.getFilteredKonsultasi().length,
            totalSKD: berobatData.filter(d => 
                d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya'
            ).length
        };
    },

    calculateSKDData() {
        const allData = dataService.getAllFilteredData();
        const deptSKDStats = {};
        
        allData.forEach(d => {
            const dept = d['Departemen'] || 'Tidak Diketahui';
            if (!deptSKDStats[dept]) {
                deptSKDStats[dept] = { total: 0, skd: 0 };
            }
            deptSKDStats[dept].total++;
            
            if (d['Jenis Kunjungan'] && d['Jenis Kunjungan'].includes('Berobat')) {
                const isSKD = d['SKD'] && d['SKD'].toString().toLowerCase() === 'ya';
                if (isSKD) {
                    deptSKDStats[dept].skd++;
                }
            }
        });

        return Object.entries(deptSKDStats)
            .map(([dept, stats]) => ({
                dept,
                total: stats.total,
                skd: stats.skd,
                percentage: stats.total > 0 ? ((stats.skd / stats.total) * 100).toFixed(1) : '0.0'
            }))
            .sort((a, b) => b.total - a.total);
    },

    calculateTopPenyakit() {
        const penyakitCounts = {};
        
        dataService.getFilteredBerobat().forEach(d => {
            const diagnosa = d['Diagnosa'] || d['Keterangan Diagnosa'] || 'Tidak Diketahui';
            if (diagnosa && diagnosa !== '-' && diagnosa.trim() !== '') {
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
            if (obat && obat !== '-' && obat.trim() !== '') {
                const obatList = obat.split(',').map(o => o.trim());
                obatList.forEach(o => {
                    if (o && o.trim() !== '') {
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
        
        return fileName;
    }
};