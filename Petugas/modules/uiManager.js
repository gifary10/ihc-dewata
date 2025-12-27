// File: modules/uiManager.js
import { namaPerusahaan } from './config.js';
import { Formatter } from './utils.js';
import { PerusahaanManager } from './perusahaanManager.js';
import { PenyakitManager } from './penyakitManager.js';
import { ObatManager } from './obatManager.js';

export const UI = {
    tampilkanNamaPerusahaan: () => {
        const container = document.getElementById('namaPerusahaanContainer');
        const spanNama = document.getElementById('namaPerusahaan');
        
        if (namaPerusahaan && container && spanNama) {
            spanNama.textContent = namaPerusahaan;
            container.classList.remove('d-none');
            
            // Tunggu sebentar untuk memastikan data dimuat
            setTimeout(() => {
                UI.populateDepartemenSelects();
                UI.populatePenyakitKategori();
                UI.populateObatKategori();
                
                if (ObatManager && ObatManager.dataObat && ObatManager.dataObat.length > 0) {
                    setTimeout(() => {
                        if (window.EventManager) {
                            EventManager.populateObatSelect('');
                        }
                    }, 100);
                }
            }, 200);
        } else if (container) {
            container.classList.add('d-none');
        }
    },

    tampilkanModalPerusahaan: () => {
        const modalElement = document.getElementById('modalPerusahaan');
        
        UI.populatePerusahaanModal();
        
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    },

    populatePerusahaanModal: () => {
        const perusahaanList = document.getElementById('perusahaanList');
        if (!perusahaanList) return;
        
        perusahaanList.innerHTML = '';
        
        const dataPerusahaan = PerusahaanManager.dataPerusahaan;
        
        if (!dataPerusahaan || dataPerusahaan.length === 0) {
            perusahaanList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> Data perusahaan belum tersedia
                </div>
            `;
            return;
        }
        
        dataPerusahaan.forEach(perusahaan => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action select-perusahaan';
            item.setAttribute('data-nama', perusahaan.nama_perusahaan);
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-building me-2"></i>
                        <strong>${perusahaan.nama_perusahaan}</strong>
                    </div>
                    <i class="bi bi-chevron-right text-muted"></i>
                </div>
                <small class="text-muted">${perusahaan.departemen.length} departemen</small>
            `;
            perusahaanList.appendChild(item);
        });
    },

    populateDepartemenSelects: () => {
        console.log('populateDepartemenSelects dipanggil, perusahaan:', namaPerusahaan);
        
        if (!namaPerusahaan) {
            console.warn('Perusahaan belum dipilih, tidak dapat mengisi departemen');
            return;
        }
        
        if (!PerusahaanManager.dataPerusahaan || PerusahaanManager.dataPerusahaan.length === 0) {
            console.warn('Data perusahaan belum dimuat, mencoba memuat ulang...');
            setTimeout(() => {
                UI.populateDepartemenSelects();
            }, 500);
            return;
        }
        
        // CARA 1: Gunakan fungsi getSelectedPerusahaanDepartemen()
        let departemen = PerusahaanManager.getSelectedPerusahaanDepartemen();
        console.log('Departemen dari getSelectedPerusahaanDepartemen():', departemen);
        
        // CARA 2: Jika masih kosong, cari langsung dari data
        if (!departemen || departemen.length === 0) {
            console.log('Mencari departemen secara manual...');
            const perusahaan = PerusahaanManager.dataPerusahaan.find(p => 
                p.nama_perusahaan === namaPerusahaan
            );
            
            if (perusahaan && perusahaan.departemen && perusahaan.departemen.length > 0) {
                departemen = perusahaan.departemen;
                console.log('Departemen ditemukan secara manual:', departemen);
            } else {
                console.error('Perusahaan tidak ditemukan atau tidak memiliki departemen:', namaPerusahaan);
                UI.updateDepartemenDropdowns([]);
                return;
            }
        }
        
        console.log('Departemen untuk', namaPerusahaan, ':', departemen);
        UI.updateDepartemenDropdowns(departemen);
    },

    updateDepartemenDropdowns: (departemen) => {
        console.log('updateDepartemenDropdowns dipanggil dengan', departemen?.length || 0, 'item');
        
        // List semua dropdown departemen yang perlu diisi
        const selectors = [
            'departemenBerobat',
            'departemenKecelakaan', 
            'departemenKonsultasi',
            'filterDept'
        ];
        
        selectors.forEach(selector => {
            const selectElement = document.getElementById(selector);
            if (!selectElement) {
                console.warn(`Dropdown ${selector} tidak ditemukan`);
                return;
            }
            
            // Simpan value yang sedang dipilih
            const currentValue = selectElement.value;
            
            // Clear dropdown
            selectElement.innerHTML = '';
            
            // Tambahkan option default berdasarkan selector
            const defaultOption = document.createElement('option');
            
            if (selector === 'filterDept') {
                // Untuk filter, gunakan "Semua Departemen"
                defaultOption.value = '';
                defaultOption.textContent = 'Semua Departemen';
                defaultOption.selected = true;
            } else {
                // Untuk form input, gunakan "Pilih Departemen"
                defaultOption.value = '';
                defaultOption.textContent = 'Pilih Departemen';
                defaultOption.disabled = true;
                defaultOption.selected = true;
            }
            
            selectElement.appendChild(defaultOption);
            
            // Tambahkan departemen jika ada
            if (departemen && departemen.length > 0) {
                if (selector === 'filterDept') {
                    // Untuk filter, kita gunakan semua departemen dari semua perusahaan
                    const allDepartemen = PerusahaanManager.getAllDepartemen();
                    
                    // Hapus duplikat dan sort
                    const uniqueDepartemen = [...new Set(allDepartemen)].sort();
                    
                    // Clear dan isi ulang dengan semua departemen
                    selectElement.innerHTML = '';
                    const filterDefaultOption = document.createElement('option');
                    filterDefaultOption.value = '';
                    filterDefaultOption.textContent = 'Semua Departemen';
                    filterDefaultOption.selected = true;
                    selectElement.appendChild(filterDefaultOption);
                    
                    uniqueDepartemen.forEach(dept => {
                        const opt = document.createElement('option');
                        opt.value = dept;
                        opt.textContent = dept;
                        if (dept === currentValue) {
                            opt.selected = true;
                            filterDefaultOption.selected = false;
                        }
                        selectElement.appendChild(opt);
                    });
                    
                    console.log(`Filter departemen diisi dengan ${uniqueDepartemen.length} item`);
                } else {
                    // Untuk form input, gunakan hanya departemen perusahaan yang dipilih
                    departemen.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept;
                        option.textContent = dept;
                        
                        if (dept === currentValue) {
                            option.selected = true;
                            defaultOption.selected = false;
                            defaultOption.disabled = false;
                        }
                        selectElement.appendChild(option);
                    });
                    
                    console.log(`Dropdown ${selector} diisi dengan ${departemen.length} departemen`);
                }
            } else {
                const noOption = document.createElement('option');
                noOption.value = '';
                noOption.textContent = 'Tidak ada departemen tersedia';
                noOption.disabled = true;
                selectElement.appendChild(noOption);
                console.warn(`Tidak ada departemen untuk dropdown ${selector}`);
            }
        });
    },
    
    populateSelect: (selectElement, items, includeAllOption = false, defaultText = 'Pilih') => {
        if (!selectElement) {
            console.warn('Select element tidak ditemukan');
            return;
        }
        
        console.log('Mengisi dropdown', selectElement.id, 'dengan', items.length, 'item');
        
        const currentValue = selectElement.value;
        
        selectElement.innerHTML = '';
        
        if (includeAllOption) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = defaultText;
            defaultOption.selected = true;
            selectElement.appendChild(defaultOption);
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = defaultText;
            defaultOption.selected = true;
            defaultOption.disabled = true;
            selectElement.appendChild(defaultOption);
        }
        
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            
            if (item === currentValue) {
                option.selected = true;
                if (includeAllOption) {
                    defaultOption.selected = false;
                }
            }
            
            selectElement.appendChild(option);
        });
        
        if (items.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = includeAllOption ? 'Tidak ada departemen tersedia' : 'Pilih Departemen';
            option.disabled = !includeAllOption;
            if (includeAllOption) {
                option.selected = true;
            }
            selectElement.appendChild(option);
            console.warn('Tidak ada item untuk dropdown', selectElement.id);
        }
    },
    
    populatePenyakitKategori: () => {
        const kategoriSelect = document.getElementById('kategoriPenyakitBerobat');
        if (!kategoriSelect) return;
        
        kategoriSelect.innerHTML = '<option value="" selected disabled>Pilih Kategori Diagnosa</option>';
        
        if (PenyakitManager.dataPenyakit && PenyakitManager.dataPenyakit.length > 0) {
            console.log('Mengisi dropdown kategori penyakit dengan', PenyakitManager.dataPenyakit.length, 'kategori');
            
            PenyakitManager.dataPenyakit.forEach(kategori => {
                const option = document.createElement('option');
                option.value = kategori.id;
                option.textContent = kategori.name;
                kategoriSelect.appendChild(option);
            });
        } else {
            console.warn('Data penyakit belum dimuat atau kosong');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Data penyakit belum tersedia';
            option.disabled = true;
            kategoriSelect.appendChild(option);
        }
    },
    
    populateObatKategori: () => {
        const kategoriSelect = document.getElementById('kategoriObatBerobat');
        if (!kategoriSelect) return;
        
        kategoriSelect.innerHTML = '<option value="" selected disabled>Pilih Kategori Obat</option>';
        
        const kategoriObat = ['obat', 'alat kesehatan'];
        kategoriObat.forEach(kategori => {
            const option = document.createElement('option');
            option.value = kategori;
            option.textContent = kategori.charAt(0).toUpperCase() + kategori.slice(1);
            kategoriSelect.appendChild(option);
        });
    },

    resetForm: (formId) => {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },

    setTanggalDefault: () => {
        const elements = ['tanggalBerobat', 'tanggalKecelakaan', 'tanggalKonsultasi'];
        const now = new Date().toISOString().slice(0, 16);
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = now;
        });
    },

    setFilterDefault: () => {
        const filterTahun = document.getElementById('filterTahun');
        const filterBulan = document.getElementById('filterBulan');
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        if (filterTahun) {
            filterTahun.value = currentYear.toString();
        }
        
        if (filterBulan) {
            filterBulan.value = currentMonth.toString();
        }
    },
    
    showNotification: (message, type = 'success') => {
        const existingNotif = document.querySelector('.custom-notification');
        if (existingNotif) existingNotif.remove();
        
        const notif = document.createElement('div');
        notif.className = `custom-notification alert alert-${type} alert-dismissible fade show`;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notif.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            if (notif.parentNode) {
                notif.remove();
            }
        }, 5000);
    }
};

export const TableBuilder = {
    createBerobatRow: (item, index) => {
        let tanggal, waktu;
        if (item.waktu && item.waktu.includes(' ')) {
            const [tgl, wkt] = item.waktu.split(' ');
            tanggal = tgl;
            waktu = wkt;
        } else {
            const split = Formatter.splitDateTime(item.waktu || item.tanggal);
            tanggal = split.tanggal;
            waktu = split.waktu;
        }
        
        const skdStatus = item.perluIstirahat === 'Ya' ? 'Ya' : 'Tidak';
        const hariSKD = item.perluIstirahat === 'Ya' ? item.lamaIstirahat : '0';
        
        // PERBAIKAN: Row ID harus index + 2 (karena header di baris 1)
        const rowId = index + 2;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${item.perusahaan || namaPerusahaan}</td>
                <td>${Formatter.tanggal(tanggal)}</td>
                <td>${Formatter.waktu(waktu)}</td>
                <td>${item.nama}</td>
                <td>${item.departemen}</td>
                <td>${item.jenisKelamin}</td>
                <td>${item.jenisKunjungan}</td>
                <td>${item.keluhan}</td>
                <td>${item.tindakan || '-'}</td>
                <td>${item.namaKategoriPenyakit || item.kategoriPenyakit || '-'}</td>
                <td>${item.namaPenyakit}</td>
                <td>${item.keteranganPenyakit || '-'}</td>
                <td>${item.obatKategori || item.kategoriObat}</td>
                <td>${item.namaObat}</td>
                <td>${item.jumlahObat}</td>
                <td>${item.satuanObat || 'Tablet'}</td>
                <td>${item.aturanPakai}</td>
                <td>${skdStatus}</td>
                <td>${hariSKD}</td>
                <td>${item.keteranganSKD || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-data" 
                            data-row-id="${rowId}" 
                            data-sheet-type="berobat"
                            data-row-data='${JSON.stringify(item)}'
                            title="Hapus data">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    createKecelakaanRow: (item, index) => {
        let tanggal, waktu;
        if (item.waktu && item.waktu.includes(' ')) {
            const [tgl, wkt] = item.waktu.split(' ');
            tanggal = tgl;
            waktu = wkt;
        } else {
            const split = Formatter.splitDateTime(item.waktu || item.tanggal);
            tanggal = split.tanggal;
            waktu = split.waktu;
        }
        
        // PERBAIKAN: Row ID harus index + 2 (karena header di baris 1)
        const rowId = index + 2;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${item.perusahaan || namaPerusahaan}</td>
                <td>${Formatter.tanggal(tanggal)}</td>
                <td>${Formatter.waktu(waktu)}</td>
                <td>${item.nama}</td>
                <td>${item.departemen}</td>
                <td>${item.jenisKelamin}</td>
                <td>${item.jenisKunjungan}</td>
                <td>${item.lokasiKejadian}</td>
                <td>${item.deskripsiKejadian}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-data" 
                            data-row-id="${rowId}" 
                            data-sheet-type="kecelakaan"
                            data-row-data='${JSON.stringify(item)}'
                            title="Hapus data">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    createKonsultasiRow: (item, index) => {
        let tanggal, waktu;
        if (item.waktu && item.waktu.includes(' ')) {
            const [tgl, wkt] = item.waktu.split(' ');
            tanggal = tgl;
            waktu = wkt;
        } else {
            const split = Formatter.splitDateTime(item.waktu || item.tanggal);
            tanggal = split.tanggal;
            waktu = split.waktu;
        }
        
        // PERBAIKAN: Row ID harus index + 2 (karena header di baris 1)
        const rowId = index + 2;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${item.perusahaan || namaPerusahaan}</td>
                <td>${Formatter.tanggal(tanggal)}</td>
                <td>${Formatter.waktu(waktu)}</td>
                <td>${item.nama}</td>
                <td>${item.departemen}</td>
                <td>${item.jenisKelamin}</td>
                <td>${item.jenisKunjungan}</td>
                <td>${item.keluhan}</td>
                <td>${item.saran}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-data" 
                            data-row-id="${rowId}" 
                            data-sheet-type="konsultasi"
                            data-row-data='${JSON.stringify(item)}'
                            title="Hapus data">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    populateTables: (filteredData) => {
        const dataBerobat = filteredData.filter(item => 
            item.jenisKunjungan === 'Berobat'
        );
        const dataKecelakaan = filteredData.filter(item => 
            item.jenisKunjungan === 'Kecelakaan Kerja'
        );
        const dataKonsultasi = filteredData.filter(item => 
            item.jenisKunjungan === 'Konsultasi'
        );

        const tableBerobatBody = document.getElementById('tableBerobatBody');
        const totalBerobat = document.getElementById('totalBerobat');
        const totalBerobatSummary = document.getElementById('totalBerobatSummary');
        
        if (tableBerobatBody) {
            tableBerobatBody.innerHTML = dataBerobat.length > 0 ? 
                dataBerobat.map((item, index) => TableBuilder.createBerobatRow(item, index)).join('') :
                `<tr><td colspan="22" class="text-center py-4 text-muted">Tidak ada data berobat</td></tr>`;
        }
        
        if (totalBerobat) totalBerobat.textContent = dataBerobat.length;
        if (totalBerobatSummary) totalBerobatSummary.textContent = dataBerobat.length;

        const tableKecelakaanBody = document.getElementById('tableKecelakaanBody');
        const totalKecelakaan = document.getElementById('totalKecelakaan');
        const totalKecelakaanSummary = document.getElementById('totalKecelakaanSummary');
        
        if (tableKecelakaanBody) {
            tableKecelakaanBody.innerHTML = dataKecelakaan.length > 0 ? 
                dataKecelakaan.map((item, index) => TableBuilder.createKecelakaanRow(item, index)).join('') :
                `<tr><td colspan="11" class="text-center py-4 text-muted">Tidak ada data kecelakaan</td></tr>`;
        }
        
        if (totalKecelakaan) totalKecelakaan.textContent = dataKecelakaan.length;
        if (totalKecelakaanSummary) totalKecelakaanSummary.textContent = dataKecelakaan.length;

        const tableKonsultasiBody = document.getElementById('tableKonsultasiBody');
        const totalKonsultasi = document.getElementById('totalKonsultasi');
        const totalKonsultasiSummary = document.getElementById('totalKonsultasiSummary');
        
        if (tableKonsultasiBody) {
            tableKonsultasiBody.innerHTML = dataKonsultasi.length > 0 ? 
                dataKonsultasi.map((item, index) => TableBuilder.createKonsultasiRow(item, index)).join('') :
                `<tr><td colspan="11" class="text-center py-4 text-muted">Tidak ada data konsultasi</td></tr>`;
        }
        
        if (totalKonsultasi) totalKonsultasi.textContent = dataKonsultasi.length;
        if (totalKonsultasiSummary) totalKonsultasiSummary.textContent = dataKonsultasi.length;

        const totalIntegrasi = document.getElementById('totalIntegrasi');
        if (totalIntegrasi) {
            totalIntegrasi.textContent = filteredData.length;
        }
        
        console.log(`Report populated: ${dataBerobat.length} berobat, ${dataKecelakaan.length} kecelakaan, ${dataKonsultasi.length} konsultasi`);
    }
};