import { UI } from './uiManager.js';
import { Laporan } from './laporanManager.js';
import { FormHandlers } from './formHandlers.js';
import { ObatManager } from './obatManager.js';
import { PenyakitManager } from './penyakitManager.js';
import { PerusahaanManager } from './perusahaanManager.js';
import { namaPerusahaan } from './config.js';

export const EventManager = {
    setupPerusahaanEvents: () => {
        const modalElement = document.getElementById('modalPerusahaan');
        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', () => {
                UI.populatePerusahaanModal();
            });
            
            modalElement.addEventListener('hidden.bs.modal', () => {
                if (namaPerusahaan && PerusahaanManager.dataPerusahaan.length > 0) {
                    setTimeout(() => {
                        PerusahaanManager.loadPerusahaanData().then(() => {
                            UI.populateDepartemenSelects();
                            UI.populatePenyakitKategori();
                            UI.populateObatKategori();
                            
                            setTimeout(() => {
                                Laporan.tampilkan();
                            }, 300);
                        });
                    }, 300);
                }
            });
        }
        
        document.addEventListener('click', function(e) {
            if (e.target.closest('.select-perusahaan')) {
                const button = e.target.closest('.select-perusahaan');
                const nama = button.getAttribute('data-nama');
                
                if (window.Storage) {
                    window.Storage.simpanPerusahaan(nama);
                }
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalPerusahaan'));
                if (modal) modal.hide();
                UI.showNotification(`Perusahaan "${nama}" berhasil dipilih!`, 'success');
                
                setTimeout(() => {
                    PerusahaanManager.loadPerusahaanData().then(() => {
                        UI.populateDepartemenSelects();
                    });
                }, 100);
            }
        });
        
        const btnGantiPerusahaan = document.getElementById('btnGantiPerusahaan');
        if (btnGantiPerusahaan) {
            btnGantiPerusahaan.addEventListener('click', UI.tampilkanModalPerusahaan);
        }
    },

    setupFormEvents: () => {
        const btnSimpanBerobat = document.getElementById('btnSimpanBerobat');
        const btnSimpanKecelakaan = document.getElementById('btnSimpanKecelakaan');
        const btnSimpanKonsultasi = document.getElementById('btnSimpanKonsultasi');
        
        if (btnSimpanBerobat) btnSimpanBerobat.addEventListener('click', FormHandlers.berobat);
        if (btnSimpanKecelakaan) btnSimpanKecelakaan.addEventListener('click', FormHandlers.kecelakaan);
        if (btnSimpanKonsultasi) btnSimpanKonsultasi.addEventListener('click', FormHandlers.konsultasi);
    },

    setupTahunFilter: () => {
        const tahunSelect = document.getElementById('filterTahun');
        if (!tahunSelect) return;
        
        tahunSelect.innerHTML = '';
        
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear + 2; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            tahunSelect.appendChild(option);
        }
        
        tahunSelect.value = currentYear;
        
        tahunSelect.addEventListener('change', () => Laporan.tampilkan());
    },

    setupFilterEvents: () => {
        EventManager.setupTahunFilter();
        
        const filterIds = ['filterTahun', 'filterBulan', 'filterDept'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => Laporan.tampilkan());
            }
        });
        
        const searchNama = document.getElementById('searchNama');
        if (searchNama) {
            searchNama.addEventListener('input', () => Laporan.tampilkan());
        }
    },
    
    setupRefreshButton: () => {
        const reportHeader = document.querySelector('.report-header .d-flex');
        if (reportHeader) {
            const button = document.createElement('button');
            button.id = 'btnRefreshReport';
            button.className = 'btn btn-sm btn-outline-secondary';
            button.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            button.addEventListener('click', () => Laporan.refresh());
            reportHeader.appendChild(button);
        }
    },
    
    populateObatSelect: (kategori) => {
        const obatSelect = document.getElementById('namaObatBerobat');
        if (!obatSelect) return;
        
        obatSelect.innerHTML = '<option value="">Pilih Obat</option>';
        
        let filteredObat = ObatManager.dataObat;
        if (kategori) {
            filteredObat = ObatManager.getObatByKategori(kategori);
        }
        
        if (filteredObat && filteredObat.length > 0) {
            filteredObat.forEach(obat => {
                const option = document.createElement('option');
                option.value = obat.nama;
                option.textContent = obat.nama;
                option.setAttribute('data-kategori', obat.kategori);
                obatSelect.appendChild(option);
            });
        }
    },
    
    populateDiagnosisSelect: (kategoriId) => {
        const penyakitSelect = document.getElementById('namaPenyakitBerobat');
        if (!penyakitSelect) return;
        
        penyakitSelect.innerHTML = '<option value="">Pilih Diagnosis</option>';
        
        const diagnoses = PenyakitManager.getDiagnosesByKategoriId(kategoriId);
        
        if (diagnoses && diagnoses.length > 0) {
            diagnoses.forEach(diagnosis => {
                const option = document.createElement('option');
                option.value = diagnosis;
                option.textContent = diagnosis;
                penyakitSelect.appendChild(option);
            });
        }
    },
    
    setupAllEvents: () => {
        EventManager.setupPerusahaanEvents();
        EventManager.setupFormEvents();
        EventManager.setupFilterEvents();
        EventManager.setupRefreshButton();
        
        const kategoriSelect = document.getElementById('kategoriObatBerobat');
        if (kategoriSelect) {
            kategoriSelect.addEventListener('change', function() {
                const kategori = this.value;
                EventManager.populateObatSelect(kategori);
            });
        }
        
        const kategoriPenyakitSelect = document.getElementById('kategoriPenyakitBerobat');
        if (kategoriPenyakitSelect) {
            kategoriPenyakitSelect.addEventListener('change', function() {
                const kategoriId = parseInt(this.value);
                EventManager.populateDiagnosisSelect(kategoriId);
            });
        }
        
        const radioButtons = document.querySelectorAll('input[name="perluIstirahat"]');
        if (radioButtons.length > 0) {
            radioButtons.forEach(radio => {
                radio.addEventListener('change', function() {
                    const lamaIstirahatInput = document.getElementById('lamaIstirahat');
                    if (lamaIstirahatInput) {
                        const isRequired = this.value === 'Ya';
                        lamaIstirahatInput.disabled = !isRequired;
                        lamaIstirahatInput.required = isRequired;
                        if (isRequired) {
                            lamaIstirahatInput.focus();
                            lamaIstirahatInput.value = '1';
                        } else {
                            lamaIstirahatInput.value = '0';
                        }
                    }
                });
            });
        }
    }
};