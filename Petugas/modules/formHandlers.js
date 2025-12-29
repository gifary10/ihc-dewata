import { GoogleSheetsAPI } from './googleSheets.js';
import { CONFIG, namaPerusahaan } from './config.js';
import { Formatter, Validator } from './utils.js';
import { UI } from './uiManager.js';
import { Laporan } from './laporanManager.js';
import { PenyakitManager } from './penyakitManager.js';
import { ObatManager } from './obatManager.js';

export const FormHandlers = {
    berobat: async () => {
        const btn = document.getElementById('btnSimpanBerobat');
        if (btn.disabled) return;
        
        // Tampilkan spinner di header (menggantikan notification)
        UI.showSaving('Menyimpan data berobat...');
        btn.disabled = true;
        
        try {
            const formData = {
                waktu: document.getElementById('tanggalBerobat')?.value,
                nama: document.getElementById('namaBerobat')?.value,
                departemen: document.getElementById('departemenBerobat')?.value,
                jenisKelamin: document.querySelector('input[name="jenisKelaminBerobat"]:checked')?.value,
                keluhan: document.getElementById('keluhanBerobat')?.value,
                kategoriPenyakit: document.getElementById('kategoriPenyakitBerobat')?.value,
                namaPenyakit: document.getElementById('namaPenyakitBerobat')?.value,
                kategoriObat: document.getElementById('kategoriObatBerobat')?.value,
                namaObat: document.getElementById('namaObatBerobat')?.value,
                jumlahObat: document.getElementById('jumlahObatBerobat')?.value,
                satuanObat: document.getElementById('satuanObatBerobat')?.value,
                aturanPakai: document.getElementById('aturanPakaiBerobat')?.value,
                perluIstirahat: document.querySelector('input[name="perluIstirahat"]:checked')?.value
            };
            
            // Validasi form
            if (!Validator.validateForm(formData)) {
                UI.hideSaving();
                UI.showNotification('Harap lengkapi semua field yang wajib diisi!', 'warning');
                btn.disabled = false;
                return;
            }
            
            // Validasi SKD
            if (!formData.perluIstirahat) {
                UI.hideSaving();
                UI.showNotification('Harap pilih apakah pasien perlu istirahat!', 'warning');
                btn.disabled = false;
                return;
            }
            
            if (formData.perluIstirahat === 'Ya' && 
                (!document.getElementById('lamaIstirahat').value || 
                 document.getElementById('lamaIstirahat').value === '0')) {
                UI.hideSaving();
                UI.showNotification('Harap isi jumlah hari istirahat!', 'warning');
                btn.disabled = false;
                return;
            }

            // Siapkan data untuk Google Sheets
            const kategoriPenyakitObj = PenyakitManager.getKategoriById(formData.kategoriPenyakit);
            const namaKategoriPenyakit = kategoriPenyakitObj ? kategoriPenyakitObj.name : '-';
            const obatData = ObatManager.getObatByNama(formData.namaObat);
            
            const data = {
                ...Formatter.splitDateTime(formData.waktu),
                ...formData,
                perusahaan: namaPerusahaan,
                jenisKunjungan: CONFIG.JENIS_KUNJUNGAN.BEROBAT,
                tindakan: document.getElementById('tindakanBerobat')?.value || '-',
                keteranganPenyakit: document.getElementById('keteranganPenyakitBerobat')?.value || '-',
                lamaIstirahat: document.getElementById('lamaIstirahat')?.value || '0',
                keteranganSKD: document.getElementById('keteranganSKD')?.value || '-',
                namaKategoriPenyakit: namaKategoriPenyakit,
                obatKategori: obatData ? obatData.kategori : formData.kategoriObat
            };
            
            // Kirim ke Google Sheets
            const sheetsResult = await GoogleSheetsAPI.sendData('berobat', data);
            
            btn.disabled = false;
            UI.hideSaving();
            
            if (sheetsResult.success) {
                UI.showNotification('Data berobat berhasil disimpan!', 'success');
            } else {
                UI.showNotification(`Gagal menyimpan data: ${sheetsResult.message}`, 'danger');
                return;
            }
            
            // Reset form dan tampilkan laporan
            FormHandlers.resetAndNotify('berobat');
        } catch (error) {
            btn.disabled = false;
            UI.hideSaving();
            console.error("Error in berobat handler:", error);
            UI.showNotification(`Terjadi kesalahan: ${error.message}`, 'danger');
        }
    },

    kecelakaan: async () => {
        const btn = document.getElementById('btnSimpanKecelakaan');
        if (btn.disabled) return;
        
        // Tampilkan spinner di header (menggantikan notification)
        UI.showSaving('Menyimpan data kecelakaan...');
        btn.disabled = true;
        
        try {
            const formData = {
                waktu: document.getElementById('tanggalKecelakaan')?.value,
                nama: document.getElementById('namaKecelakaan')?.value,
                departemen: document.getElementById('departemenKecelakaan')?.value,
                jenisKelamin: document.getElementById('jenisKelaminKecelakaan')?.value,
                lokasiKejadian: document.getElementById('lokasiKecelakaan')?.value,
                deskripsiKejadian: document.getElementById('deskripsiKecelakaan')?.value
            };

            // Validasi form
            if (!Validator.validateForm(formData)) {
                UI.hideSaving();
                UI.showNotification('Harap lengkapi semua field yang wajib diisi!', 'warning');
                btn.disabled = false;
                return;
            }

            // Siapkan data untuk Google Sheets
            const data = {
                ...Formatter.splitDateTime(formData.waktu),
                ...formData,
                perusahaan: namaPerusahaan,
                jenisKunjungan: CONFIG.JENIS_KUNJUNGAN.KECELAKAAN
            };

            // Kirim ke Google Sheets
            const sheetsResult = await GoogleSheetsAPI.sendData('kecelakaan', data);
            
            btn.disabled = false;
            UI.hideSaving();
            
            if (sheetsResult.success) {
                UI.showNotification('Data kecelakaan berhasil disimpan!', 'success');
            } else {
                UI.showNotification(`Gagal menyimpan data: ${sheetsResult.message}`, 'danger');
                return;
            }
            
            // Reset form dan tampilkan laporan
            FormHandlers.resetAndNotify('kecelakaan');
        } catch (error) {
            btn.disabled = false;
            UI.hideSaving();
            console.error("Error in kecelakaan handler:", error);
            UI.showNotification(`Terjadi kesalahan: ${error.message}`, 'danger');
        }
    },

    konsultasi: async () => {
        const btn = document.getElementById('btnSimpanKonsultasi');
        if (btn.disabled) return;
        
        // Tampilkan spinner di header (menggantikan notification)
        UI.showSaving('Menyimpan data konsultasi...');
        btn.disabled = true;
        
        try {
            const formData = {
                waktu: document.getElementById('tanggalKonsultasi')?.value,
                nama: document.getElementById('namaKonsultasi')?.value,
                departemen: document.getElementById('departemenKonsultasi')?.value,
                jenisKelamin: document.getElementById('jenisKelaminKonsultasi')?.value,
                keluhan: document.getElementById('keluhanKonsultasi')?.value,
                saran: document.getElementById('saranKonsultasi')?.value
            };

            // Validasi form
            if (!Validator.validateForm(formData)) {
                UI.hideSaving();
                UI.showNotification('Harap lengkapi semua field yang wajib diisi!', 'warning');
                btn.disabled = false;
                return;
            }

            // Siapkan data untuk Google Sheets
            const data = {
                ...Formatter.splitDateTime(formData.waktu),
                ...formData,
                perusahaan: namaPerusahaan,
                jenisKunjungan: CONFIG.JENIS_KUNJUNGAN.KONSULTASI
            };

            // Kirim ke Google Sheets
            const sheetsResult = await GoogleSheetsAPI.sendData('konsultasi', data);
            
            btn.disabled = false;
            UI.hideSaving();
            
            if (sheetsResult.success) {
                UI.showNotification('Data konsultasi berhasil disimpan!', 'success');
            } else {
                UI.showNotification(`Gagal menyimpan data: ${sheetsResult.message}`, 'danger');
                return;
            }
            
            // Reset form dan tampilkan laporan
            FormHandlers.resetAndNotify('konsultasi');
        } catch (error) {
            btn.disabled = false;
            UI.hideSaving();
            console.error("Error in konsultasi handler:", error);
            UI.showNotification(`Terjadi kesalahan: ${error.message}`, 'danger');
        }
    },

    resetAndNotify: (jenis) => {
        const forms = {
            berobat: ['formKunjunganBerobat', 'formPenyakitBerobat', 'formObatBerobat', 'formSKDBerobat'],
            kecelakaan: ['formKecelakaan'],
            konsultasi: ['formKonsultasi']
        };

        // Reset form
        forms[jenis]?.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) form.reset();
        });
        
        // Set tanggal default
        UI.setTanggalDefault();
        
        // Reset SKD
        if (jenis === 'berobat') {
            const lamaIstirahatInput = document.getElementById('lamaIstirahat');
            if (lamaIstirahatInput) {
                lamaIstirahatInput.value = '0';
                lamaIstirahatInput.disabled = true;
            }
        }

        // Refresh laporan
        setTimeout(() => {
            Laporan.tampilkan();
        }, 500);
        
        // Buka tab laporan
        setTimeout(() => {
            const laporanTab = document.querySelector('[data-bs-target="#laporan"]');
            if (laporanTab) laporanTab.click();
        }, 1000);
    }
};