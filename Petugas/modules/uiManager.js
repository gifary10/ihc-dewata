import { namaPerusahaan } from './config.js';
import { Formatter } from './utils.js';
import { PerusahaanManager } from './perusahaanManager.js';
import { PenyakitManager } from './penyakitManager.js';
import { ObatManager } from './obatManager.js';

export const UI = {
    tampilkanNamaPerusahaan: () => {
        const container = document.getElementById('namaPerusahaanContainer');
        const spanNama = document.getElementById('namaPerusahaan');
        const perusahaanDisplay = document.getElementById('perusahaanDisplay');
        const headerPerusahaan = document.getElementById('namaPerusahaanHeader');
        
        if (namaPerusahaan) {
            // Update header
            if (headerPerusahaan) {
                headerPerusahaan.textContent = namaPerusahaan;
            }
            
            // Update display baru
            if (perusahaanDisplay) {
                perusahaanDisplay.textContent = namaPerusahaan;
            }
            
            // Update container lama (jika masih ada)
            if (container && spanNama) {
                spanNama.textContent = namaPerusahaan;
                container.classList.remove('d-none');
            }
            
            setTimeout(() => {
                UI.populateDepartemenSelects();
                UI.populatePenyakitKategori();
                UI.populateObatKategori();
                
                if (ObatManager && ObatManager.dataObat && ObatManager.dataObat.length > 0) {
                    setTimeout(() => {
                        if (window.EventManager) {
                            window.EventManager.populateObatSelect('');
                        }
                    }, 100);
                }
            }, 200);
        } else if (container) {
            container.classList.add('d-none');
        }
        
        // Pastikan display selalu ada isinya
        if (perusahaanDisplay && !perusahaanDisplay.textContent.trim()) {
            perusahaanDisplay.textContent = '-';
        }
    },

    tampilkanModalPerusahaan: () => {
        const modalElement = document.getElementById('modalPerusahaan');
        
        if (!modalElement) {
            console.error('Modal perusahaan tidak ditemukan');
            return;
        }
        
        console.log('Menampilkan modal perusahaan');
        
        UI.populatePerusahaanModal();
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    },

    populatePerusahaanModal: () => {
        const perusahaanList = document.getElementById('perusahaanList');
        if (!perusahaanList) {
            console.error('Element perusahaanList tidak ditemukan');
            return;
        }
        
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
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const nama = item.getAttribute('data-nama');
                console.log('Perusahaan dipilih:', nama);
                
                // Update state global
                window.namaPerusahaan = nama;
                localStorage.setItem('namaPerusahaan', nama);
                
                // Update semua display perusahaan
                const perusahaanDisplay = document.getElementById('perusahaanDisplay');
                const headerPerusahaan = document.getElementById('namaPerusahaanHeader');
                
                if (perusahaanDisplay) {
                    perusahaanDisplay.textContent = nama;
                }
                
                if (headerPerusahaan) {
                    headerPerusahaan.textContent = nama;
                }
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalPerusahaan'));
                if (modal) modal.hide();
                
                UI.showNotification(`Perusahaan "${nama}" dipilih!`, 'success');
                
                setTimeout(() => {
                    // Reload untuk memastikan semua data terupdate
                    location.reload();
                }, 500);
            });
            
            perusahaanList.appendChild(item);
        });
        
        console.log('Modal perusahaan diisi dengan', dataPerusahaan.length, 'item');
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
        
        const perusahaan = PerusahaanManager.dataPerusahaan.find(p => 
            p.nama_perusahaan === namaPerusahaan
        );
        
        if (!perusahaan) {
            console.error('Perusahaan tidak ditemukan:', namaPerusahaan);
            UI.updateDepartemenDropdowns([]);
            return;
        }
        
        const departemen = perusahaan.departemen || [];
        console.log('Departemen untuk', namaPerusahaan, ':', departemen);
        
        if (departemen.length === 0) {
            console.warn('Perusahaan tidak memiliki departemen');
        }
        
        UI.updateDepartemenDropdowns(departemen);
    },

    updateDepartemenDropdowns: (departemen) => {
        console.log('updateDepartemenDropdowns dipanggil dengan', departemen?.length || 0, 'item');
        
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
            
            const currentValue = selectElement.value;
            
            selectElement.innerHTML = '';
            
            if (selector === 'filterDept') {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Semua Departemen';
                defaultOption.selected = true;
                selectElement.appendChild(defaultOption);
                
                const allDepartemen = PerusahaanManager.getAllDepartemen();
                const uniqueDepartemen = [...new Set(allDepartemen)].sort();
                
                uniqueDepartemen.forEach(dept => {
                    const opt = document.createElement('option');
                    opt.value = dept;
                    opt.textContent = dept;
                    if (dept === currentValue) {
                        opt.selected = true;
                        defaultOption.selected = false;
                    }
                    selectElement.appendChild(opt);
                });
                
                console.log(`Filter departemen diisi dengan ${uniqueDepartemen.length} item`);
            } else {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Pilih Departemen';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                selectElement.appendChild(defaultOption);
                
                if (departemen && departemen.length > 0) {
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
                } else {
                    const noOption = document.createElement('option');
                    noOption.value = '';
                    noOption.textContent = 'Tidak ada departemen tersedia';
                    noOption.disabled = true;
                    selectElement.appendChild(noOption);
                    console.warn(`Tidak ada departemen untuk dropdown ${selector}`);
                }
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
        // Hapus semua notifikasi lama jika ada
        const existingNotif = document.querySelector('.custom-notification');
        if (existingNotif) existingNotif.remove();
        
        // Cari atau buat elemen status header
        let statusElement = document.querySelector('.header-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'header-status';
            statusElement.innerHTML = `
                <div class="header-spinner"></div>
                <span class="header-status-text"></span>
            `;
            
            // Tambahkan ke header container
            const headerContainer = document.querySelector('.header-container');
            if (headerContainer) {
                headerContainer.appendChild(statusElement);
            }
        }
        
        // Update class dan konten
        statusElement.className = `header-status ${type}`;
        
        const statusText = statusElement.querySelector('.header-status-text');
        if (statusText) {
            statusText.textContent = message;
        }
        
        // Tampilkan
        setTimeout(() => {
            statusElement.classList.add('show');
        }, 10);
        
        // Sembunyikan setelah beberapa detik (kecuali untuk loading)
        if (type !== 'loading') {
            setTimeout(() => {
                UI.hideHeaderStatus();
            }, 3000);
        }
    },

    // Fungsi untuk menampilkan spinner di header
    showHeaderStatus: (message, type = 'loading') => {
        UI.showNotification(message, type);
    },

    // Fungsi untuk menyembunyikan spinner di header
    hideHeaderStatus: () => {
        const statusElement = document.querySelector('.header-status');
        if (statusElement) {
            statusElement.classList.remove('show');
            
            // Hapus setelah animasi selesai
            setTimeout(() => {
                if (statusElement && !statusElement.classList.contains('show')) {
                    // Kosongkan teks
                    const statusText = statusElement.querySelector('.header-status-text');
                    if (statusText) {
                        statusText.textContent = '';
                    }
                    // Reset ke default
                    statusElement.className = 'header-status';
                }
            }, 300);
        }
    },

    // Fungsi untuk menampilkan spinner saat loading data
    showLoading: (message = 'Memuat data...') => {
        UI.showNotification(message, 'loading');
    },

    // Fungsi untuk menyembunyikan spinner setelah loading selesai
    hideLoading: () => {
        UI.hideHeaderStatus();
    },

    // Fungsi untuk menampilkan spinner saat menyimpan data
    showSaving: (message = 'Menyimpan data...') => {
        UI.showNotification(message, 'loading');
    },

    // Fungsi untuk menyembunyikan spinner setelah penyimpanan selesai
    hideSaving: () => {
        // Biarkan notifikasi sukses ditampilkan terlebih dahulu
        // Hide akan dipanggil setelah timeout dari showNotification
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
                            data-row-data='${JSON.stringify(item).replace(/'/g, "\\'")}'
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
                            data-row-data='${JSON.stringify(item).replace(/'/g, "\\'")}'
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
                            data-row-data='${JSON.stringify(item).replace(/'/g, "\\'")}'
                            title="Hapus data">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
};

export const PaginationManager = {
    currentPage: 1,
    itemsPerPage: 10,
    
    setupPagination: function(data, tableType) {
        const totalPages = Math.ceil(data.length / this.itemsPerPage);
        this.currentPage = 1;
        
        this.displayPaginationControls(data, tableType, totalPages);
        this.displayPage(data, tableType, 1);
    },
    
    displayPage: function(data, tableType, page) {
        this.currentPage = page;
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = data.slice(startIndex, endIndex);
        
        this.populateTablePage(tableType, pageData, startIndex);
        this.updatePaginationInfo(data.length, page);
    },
    
    populateTablePage: function(tableType, data, startIndex) {
        const tableBodyId = this.getTableBodyId(tableType);
        const tableBody = document.getElementById(tableBodyId);
        
        if (!tableBody) return;
        
        let rowsHTML = '';
        
        if (data.length === 0) {
            const colSpan = this.getColumnCount(tableType);
            rowsHTML = `<tr><td colspan="${colSpan}" class="text-center py-4 text-muted">Tidak ada data</td></tr>`;
        } else {
            data.forEach((item, index) => {
                const absoluteIndex = startIndex + index;
                rowsHTML += this.createTableRow(tableType, item, absoluteIndex);
            });
        }
        
        tableBody.innerHTML = rowsHTML;
    },
    
    createTableRow: function(tableType, item, index) {
        switch(tableType) {
            case 'berobat':
                return this.createBerobatRow(item, index);
            case 'kecelakaan':
                return this.createKecelakaanRow(item, index);
            case 'konsultasi':
                return this.createKonsultasiRow(item, index);
            default:
                return '';
        }
    },
    
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
                            data-row-data='${JSON.stringify(item).replace(/'/g, "\\'")}'
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
                            data-row-data='${JSON.stringify(item).replace(/'/g, "\\'")}'
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
                            data-row-data='${JSON.stringify(item).replace(/'/g, "\\'")}'
                            title="Hapus data">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },
    
    getTableBodyId: function(tableType) {
        const tableIds = {
            'berobat': 'tableBerobatBody',
            'kecelakaan': 'tableKecelakaanBody',
            'konsultasi': 'tableKonsultasiBody'
        };
        return tableIds[tableType];
    },
    
    getColumnCount: function(tableType) {
        const columnCounts = {
            'berobat': 22,
            'kecelakaan': 11,
            'konsultasi': 11
        };
        return columnCounts[tableType] || 10;
    },
    
    displayPaginationControls: function(data, tableType, totalPages) {
        const containerId = this.getPaginationContainerId(tableType);
        let container = document.getElementById(containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'pagination-container';
            
            const tableContainer = document.getElementById(this.getTableContainerId(tableType));
            if (tableContainer) {
                tableContainer.parentNode.insertBefore(container, tableContainer.nextSibling);
            }
        }
        
        container.innerHTML = this.generatePaginationHTML(data.length, totalPages, tableType);
        this.setupPaginationEvents(tableType);
    },
    
    getPaginationContainerId: function(tableType) {
        return `pagination-${tableType}`;
    },
    
    getTableContainerId: function(tableType) {
        const containerIds = {
            'berobat': 'berobat-table',
            'kecelakaan': 'kecelakaan-table',
            'konsultasi': 'konsultasi-table'
        };
        return containerIds[tableType];
    },
    
    generatePaginationHTML: function(totalItems, totalPages, tableType) {
        if (totalItems <= this.itemsPerPage) return '';
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="pagination-info">
                    Menampilkan <strong>${Math.min(this.itemsPerPage, totalItems)}</strong> dari <strong>${totalItems}</strong> data
                </div>
                <nav aria-label="Page navigation">
                    <ul class="pagination pagination-sm mb-0">
        `;
        
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link pagination-btn" data-page="prev" data-table="${tableType}">
                    &laquo;
                </button>
            </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <button class="page-link pagination-btn" data-page="${i}" data-table="${tableType}">
                        ${i}
                    </button>
                </li>
            `;
        }
        
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link pagination-btn" data-page="next" data-table="${tableType}">
                    &raquo;
                </button>
            </li>
        `;
        
        html += `
                    </ul>
                </nav>
            </div>
        `;
        
        return html;
    },
    
    setupPaginationEvents: function(tableType) {
        const container = document.getElementById(this.getPaginationContainerId(tableType));
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                e.preventDefault();
                
                const button = e.target;
                const page = button.getAttribute('data-page');
                const targetTable = button.getAttribute('data-table');
                
                const data = this.getTableData(targetTable);
                
                if (data) {
                    let newPage;
                    if (page === 'prev') {
                        newPage = Math.max(1, this.currentPage - 1);
                    } else if (page === 'next') {
                        newPage = Math.min(this.calculateTotalPages(data), this.currentPage + 1);
                    } else {
                        newPage = parseInt(page);
                    }
                    
                    this.displayPage(data, targetTable, newPage);
                    this.updatePaginationControls(data, targetTable);
                }
            }
        });
    },
    
    getTableData: function(tableType) {
        if (!window.tableData) return [];
        
        switch(tableType) {
            case 'berobat':
                return window.tableData.berobat || [];
            case 'kecelakaan':
                return window.tableData.kecelakaan || [];
            case 'konsultasi':
                return window.tableData.konsultasi || [];
            default:
                return [];
        }
    },
    
    calculateTotalPages: function(data) {
        return Math.ceil(data.length / this.itemsPerPage);
    },
    
    updatePaginationControls: function(data, tableType) {
        const totalPages = this.calculateTotalPages(data);
        const container = document.getElementById(this.getPaginationContainerId(tableType));
        
        if (container) {
            container.innerHTML = this.generatePaginationHTML(data.length, totalPages, tableType);
        }
    },
    
    updatePaginationInfo: function(totalItems, currentPage) {
        const startItem = ((currentPage - 1) * this.itemsPerPage) + 1;
        const endItem = Math.min(currentPage * this.itemsPerPage, totalItems);
        
        const infoElements = document.querySelectorAll('.pagination-info');
        infoElements.forEach(element => {
            if (element.innerHTML.includes('Menampilkan')) {
                element.innerHTML = `Menampilkan <strong>${startItem}-${endItem}</strong> dari <strong>${totalItems}</strong> data`;
            }
        });
    }
};