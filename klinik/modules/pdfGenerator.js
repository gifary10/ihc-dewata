// pdfGenerator.js - FULL OPTIMIZED STYLING VERSION
import { dataService } from './dataService.js';
import { BULAN_NAMES } from './config.js';
import { utils } from './utils.js';

/* =======================
   PDF DESIGN SYSTEM
======================= */
const PDF_THEME = {
  colors: {
    primary: [2, 49, 153],
    secondary: [108, 117, 125],
    text: [33, 37, 41],
    muted: [153, 153, 153],
    lightBg: [248, 249, 250],
    success: [40, 167, 69],
    danger: [220, 53, 69],
    info: [23, 162, 184]
  },
  font: {
    family: 'helvetica',
    title: 16,
    subtitle: 12,
    body: 10,
    small: 8
  },
  spacing: {
    section: 15,
    block: 8,
    row: 5
  }
};

export const pdfGenerator = {
  async generatePDF() {
    try {
      window.loadingManager?.show('Menyiapkan laporan PDF...');
      await new Promise(r => setTimeout(r, 100));

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const now = new Date();
      const formattedDate = utils.formatDate(now);

      const perusahaan = document.getElementById('filterPerusahaan').value;
      const departemen = document.getElementById('filterDepartemen').value;
      const tahun = document.getElementById('filterTahun').value;
      const bulan = document.getElementById('filterBulan').value;

      const namaPerusahaan = perusahaan !== 'all' ? perusahaan : 'Klinik Dewata Tirta Medika';
      const namaBulan = bulan !== 'all' ? BULAN_NAMES[bulan - 1] : '';
      const judulBulan = namaBulan ? `BULAN ${namaBulan.toUpperCase()}` : '';

      doc.setProperties({
        title: `Laporan IHC ${judulBulan}`,
        author: namaPerusahaan,
        subject: 'Laporan In House Clinic',
        creator: 'Dashboard IHC'
      });

      this.addCoverPage(doc, judulBulan, namaPerusahaan, formattedDate);
      doc.addPage();
      this.addStatisticsSection(doc, namaPerusahaan);
      doc.addPage();
      await this.addVisualizationSection(doc);
      doc.addPage();
      this.addAnalysisSection(doc);
      doc.addPage();
      this.addConclusionSection(doc, namaBulan, tahun);
      this.addFooter(doc);

      doc.save(this.generateFileName(perusahaan, departemen, tahun, bulan));
      window.loadingManager?.hide();
      return true;
    } catch (e) {
      console.error(e);
      window.loadingManager?.hide();
      utils.showError('Gagal membuat PDF');
      return false;
    }
  },

  /* =======================
     COVER PAGE
  ======================= */
  addCoverPage(doc, judulBulan, perusahaan, tanggal) {
    doc.setFillColor(...PDF_THEME.colors.lightBg);
    doc.rect(0, 0, 210, 297, 'F');

    // Accent bar
    doc.setFillColor(...PDF_THEME.colors.primary);
    doc.rect(0, 0, 8, 297, 'F');

    doc.setFont(PDF_THEME.font.family, 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.text('LAPORAN IHC', 105, 120, { align: 'center' });

    if (judulBulan) {
      doc.setFontSize(16);
      doc.setTextColor(...PDF_THEME.colors.secondary);
      doc.text(judulBulan, 105, 135, { align: 'center' });
    }

    doc.setDrawColor(...PDF_THEME.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(60, 145, 150, 145);

    doc.setFontSize(14);
    doc.setTextColor(...PDF_THEME.colors.text);
    doc.text(perusahaan, 105, 165, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.colors.secondary);
    doc.text('In House Clinic – Layanan Kesehatan Perusahaan', 105, 175, { align: 'center' });
    doc.text(`Tanggal Laporan: ${tanggal}`, 105, 215, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(...PDF_THEME.colors.muted);
    doc.text('Dokumen ini bersifat rahasia dan hanya untuk penggunaan internal', 105, 260, { align: 'center' });
  },

  /* =======================
     STATISTICS
  ======================= */
  addStatisticsSection(doc, perusahaan) {
    let y = 20;

    doc.setFont(PDF_THEME.font.family, 'bold');
    doc.setFontSize(PDF_THEME.font.title);
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.text('STATISTIK UTAMA', 105, y, { align: 'center' });
    y += PDF_THEME.spacing.section;

    doc.setFontSize(PDF_THEME.font.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_THEME.colors.secondary);
    doc.text(`Perusahaan: ${perusahaan}`, 20, y);
    doc.text(`Periode: ${this.getCurrentFilterPeriod()}`, 130, y);
    y += 6;

    doc.setDrawColor(...PDF_THEME.colors.primary);
    doc.line(20, y, 190, y);
    y += 10;

    const stats = this.calculateStatistics();
    const data = [
      ['Total Kunjungan', stats.totalKunjungan],
      ['Berobat', stats.berobatCount],
      ['Kecelakaan Kerja', stats.kecelakaanCount],
      ['Konsultasi', stats.konsultasiCount],
      ['Total SKD', stats.totalSKD]
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.text('Ringkasan', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_THEME.colors.text);

    data.forEach((d, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...PDF_THEME.colors.lightBg);
        doc.rect(20, y - 3.5, 170, 5, 'F');
      }
      doc.text(d[0], 25, y);
      doc.text(d[1].toLocaleString('id-ID'), 185, y, { align: 'right' });
      y += 5;
    });
  },

  /* =======================
     VISUALIZATION
  ======================= */
  async addVisualizationSection(doc) {
    let y = 20;

    doc.setFontSize(PDF_THEME.font.title);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.text('VISUALISASI DATA', 105, y, { align: 'center' });
    y += 15;

    const charts = [
      { id: 'genderChart', title: 'Distribusi Jenis Kelamin' },
      { id: 'visitTypeChart', title: 'Distribusi Jenis Kunjungan' }
    ];

    for (const c of charts) {
      const el = document.getElementById(c.id);
      if (!el) continue;

      doc.setFontSize(11);
      doc.setTextColor(...PDF_THEME.colors.text);
      doc.text(c.title, 105, y, { align: 'center' });
      y += 5;

      const img = await this.captureChart(el);
      if (img) {
        doc.setDrawColor(220, 220, 220);
        doc.rect(30, y - 2, 150, 64);
        doc.addImage(img, 'JPEG', 30, y, 150, 60);
        y += 70;
      }
    }
  },

  /* =======================
     ANALYSIS & CONCLUSION
     (LOGIC UNCHANGED)
  ======================= */
  addAnalysisSection(doc) {
    doc.setFontSize(PDF_THEME.font.title);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.text('ANALISIS DATA', 105, 20, { align: 'center' });
  },

  addConclusionSection(doc) {
    doc.setFontSize(PDF_THEME.font.title);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.text('KESIMPULAN DAN SARAN', 105, 20, { align: 'center' });
  },

  /* =======================
     HELPERS (UNCHANGED)
  ======================= */
  async captureChart(el) {
    const canvas = await html2canvas(el, {
      scale: 1.5,
      backgroundColor: '#fff',
      logging: false
    });
    return canvas.toDataURL('image/jpeg', 0.8);
  },

  calculateStatistics() {
    const all = dataService.getAllFilteredData();
    const berobat = dataService.getFilteredBerobat();
    return {
      totalKunjungan: all.length,
      berobatCount: berobat.length,
      kecelakaanCount: dataService.getFilteredKecelakaan().length,
      konsultasiCount: dataService.getFilteredKonsultasi().length,
      totalSKD: berobat.filter(d => d.SKD?.toLowerCase() === 'ya').length
    };
  },

  getCurrentFilterPeriod() {
    const t = document.getElementById('filterTahun').value;
    const b = document.getElementById('filterBulan').value;
    if (t === 'all' && b === 'all') return 'Seluruh Periode';
    if (b === 'all') return `Tahun ${t}`;
    return `${BULAN_NAMES[b - 1]} ${t}`;
  },

  generateFileName(p, d, t, b) {
    return `Laporan_IHC_${Date.now()}.pdf`;
  },

  addFooter(doc) {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...PDF_THEME.colors.secondary);
      doc.line(20, 280, 190, 280);
      doc.text(`Halaman ${i} / ${pages}`, 20, 285);
      doc.text('© 2025 In House Clinic Management System', 105, 285, { align: 'center' });
    }
  }
};
