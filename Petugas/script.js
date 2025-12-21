// ========== KONFIGURASI & KONSTANTA ==========
const CONFIG = {
    STORAGE_KEYS: {
        KUNJUNGAN: 'dataKunjungan',
        PERUSAHAAN: 'namaPerusahaan'
    },
    DEFAULT_DATES: {
        HARI_INI: new Date().toISOString().slice(0, 16),
        AWAL_BULAN: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        AKHIR_BULAN: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    },
    JENIS_KUNJUNGAN: {
        BEROBAT: 'Berobat',
        KECELAKAAN: 'Kecelakaan Kerja',
        KONSULTASI: 'Konsultasi'
    }
};

// ========== STATE MANAGEMENT ==========
let dataKunjungan = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.KUNJUNGAN)) || [];
let namaPerusahaan = localStorage.getItem(CONFIG.STORAGE_KEYS.PERUSAHAAN) || '';

// ========== OBAT MANAGEMENT ==========
const ObatManager = {
    dataObat: [],
    
    loadObatData: async () => {
        try {
            const response = await fetch('obat.json');
            ObatManager.dataObat = await response.json();
            ObatManager.setupObatEvents();
            // Initial population
            ObatManager.populateObatSelect('');
        } catch (error) {
            console.error('Gagal memuat data obat:', error);
            ObatManager.dataObat = [];
        }
    },
    
    setupObatEvents: () => {
        const kategoriSelect = document.getElementById('kategoriObatBerobat');
        const obatSelect = document.getElementById('namaObatBerobat');
        
        if (kategoriSelect) {
            // Filter obat berdasarkan kategori
            kategoriSelect.addEventListener('change', function() {
                const kategori = this.value;
                ObatManager.populateObatSelect(kategori);
            });
        }
        
        // Reset filter saat form reset
        const formObat = document.getElementById('formObatBerobat');
        if (formObat) {
            formObat.addEventListener('reset', function() {
                setTimeout(() => {
                    ObatManager.populateObatSelect('');
                }, 10);
            });
        }
    },
    
    populateObatSelect: (kategori) => {
        const obatSelect = document.getElementById('namaObatBerobat');
        if (!obatSelect) return;
        
        obatSelect.innerHTML = '<option value="">Pilih Obat</option>';
        
        // Filter obat berdasarkan kategori
        let filteredObat = ObatManager.dataObat;
        if (kategori) {
            filteredObat = ObatManager.dataObat.filter(obat => obat.kategori === kategori);
        }
        
        // Tambahkan opsi obat
        filteredObat.forEach(obat => {
            const option = document.createElement('option');
            option.value = obat.nama;
            option.textContent = obat.nama;
            option.setAttribute('data-kategori', obat.kategori);
            obatSelect.appendChild(option);
        });
        
        // Jika tidak ada obat dalam kategori yang dipilih
        if (filteredObat.length === 0 && kategori) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = `Tidak ada obat dalam kategori ${kategori}`;
            option.disabled = true;
            obatSelect.appendChild(option);
        }
    },
    
    getObatByNama: (namaObat) => {
        return ObatManager.dataObat.find(obat => obat.nama === namaObat) || null;
    }
};

// ========== PENYAKIT MANAGEMENT ==========
const PenyakitManager = {
    dataPenyakit: [],
    
    loadPenyakitData: async () => {
        try {
            const response = await fetch('penyakit.json');
            const data = await response.json();
            PenyakitManager.dataPenyakit = data.categories;
            PenyakitManager.setupPenyakitEvents();
            // Initial population
            PenyakitManager.populatePenyakitSelect();
        } catch (error) {
            console.error('Gagal memuat data penyakit:', error);
            PenyakitManager.dataPenyakit = [];
        }
    },
    
    setupPenyakitEvents: () => {
        const kategoriSelect = document.getElementById('kategoriPenyakitBerobat');
        const penyakitSelect = document.getElementById('namaPenyakitBerobat');
        
        if (kategoriSelect && penyakitSelect) {
            // Filter penyakit berdasarkan kategori
            kategoriSelect.addEventListener('change', function() {
                const kategoriId = parseInt(this.value);
                PenyakitManager.populateDiagnosisSelect(kategoriId);
            });
            
            // Reset form handler
            const formPenyakit = document.getElementById('formPenyakitBerobat');
            if (formPenyakit) {
                formPenyakit.addEventListener('reset', function() {
                    setTimeout(() => {
                        PenyakitManager.populatePenyakitSelect();
                    }, 10);
                });
            }
        }
    },
    
    populatePenyakitSelect: () => {
        const kategoriSelect = document.getElementById('kategoriPenyakitBerobat');
        if (!kategoriSelect) return;
        
        kategoriSelect.innerHTML = '<option value="">Pilih Kategori Penyakit</option>';
        
        // Tambahkan opsi kategori
        PenyakitManager.dataPenyakit.forEach(kategori => {
            const option = document.createElement('option');
            option.value = kategori.id;
            option.textContent = kategori.name;
            kategoriSelect.appendChild(option);
        });
    },
    
    populateDiagnosisSelect: (kategoriId) => {
        const penyakitSelect = document.getElementById('namaPenyakitBerobat');
        if (!penyakitSelect) return;
        
        penyakitSelect.innerHTML = '<option value="">Pilih Diagnosis</option>';
        
        // Cari kategori berdasarkan ID
        const kategori = PenyakitManager.dataPenyakit.find(k => k.id === kategoriId);
        
        if (kategori && kategori.diagnoses) {
            // Tambahkan opsi diagnosis
            kategori.diagnoses.forEach(diagnosis => {
                const option = document.createElement('option');
                option.value = diagnosis;
                option.textContent = diagnosis;
                penyakitSelect.appendChild(option);
            });
            
            // Jika tidak ada diagnosis dalam kategori yang dipilih
            if (kategori.diagnoses.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Tidak ada diagnosis dalam kategori ini';
                option.disabled = true;
                penyakitSelect.appendChild(option);
            }
        }
    },
    
    getKategoriById: (kategoriId) => {
        return PenyakitManager.dataPenyakit.find(k => k.id === parseInt(kategoriId)) || null;
    },
    
    getKategoriByDiagnosis: (diagnosisName) => {
        for (const kategori of PenyakitManager.dataPenyakit) {
            if (kategori.diagnoses && kategori.diagnoses.includes(diagnosisName)) {
                return kategori;
            }
        }
        return null;
    }
};

// ========== UTILITY FUNCTIONS ==========
const Storage = {
    simpanData: () => localStorage.setItem(CONFIG.STORAGE_KEYS.KUNJUNGAN, JSON.stringify(dataKunjungan)),
    simpanPerusahaan: (nama) => {
        namaPerusahaan = nama;
        localStorage.setItem(CONFIG.STORAGE_KEYS.PERUSAHAAN, nama);
        UI.tampilkanNamaPerusahaan();
    }
};

const Validator = {
    isRequired: (value) => value && value.toString().trim() !== '',
    validateForm: (fields) => {
        for (const [key, value] of Object.entries(fields)) {
            if (!Validator.isRequired(value)) {
                alert(`Harap isi field: ${key}`);
                return false;
            }
        }
        return true;
    }
};

const Formatter = {
    tanggal: (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-',
    waktu: (dateString) => dateString ? new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    splitDateTime: (datetime) => ({
        tanggal: datetime ? datetime.split('T')[0] : '',
        waktu: datetime || ''
    })
};

// ========== UI MANAGEMENT ==========
const UI = {
    tampilkanNamaPerusahaan: () => {
        const container = document.getElementById('namaPerusahaanContainer');
        const spanNama = document.getElementById('namaPerusahaan');
        
        if (namaPerusahaan && container && spanNama) {
            spanNama.textContent = namaPerusahaan;
            container.classList.remove('d-none');
        } else if (container) {
            container.classList.add('d-none');
        }
    },

    tampilkanModalPerusahaan: () => {
        const modalElement = document.getElementById('modalPerusahaan');
        if (modalElement) {
            new bootstrap.Modal(modalElement).show();
        }
    },

    resetForm: (formId) => {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },

    setTanggalDefault: () => {
        const elements = ['tanggalBerobat', 'tanggalKecelakaan', 'tanggalKonsultasi'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = CONFIG.DEFAULT_DATES.HARI_INI;
        });
    },

    setFilterDefault: () => {
        const filterDari = document.getElementById('filterDari');
        const filterSampai = document.getElementById('filterSampai');
        
        if (filterDari) filterDari.value = CONFIG.DEFAULT_DATES.AWAL_BULAN;
        if (filterSampai) filterSampai.value = CONFIG.DEFAULT_DATES.AKHIR_BULAN;
    }
};

// ========== TABLE BUILDER ==========
const TableBuilder = {
    createBerobatRow: (item, index) => {
        const { tanggal, waktu } = Formatter.splitDateTime(item.waktu);
        const skdStatus = item.perluIstirahat === 'Ya' ? 'Ya' : 'Tidak';
        const hariSKD = item.perluIstirahat === 'Ya' ? item.lamaIstirahat : '0';
        
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
                <td>${item.namaKategoriPenyakit || '-'}</td>
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
            </tr>
        `;
    },

    createKecelakaanRow: (item, index) => {
        const { tanggal, waktu } = Formatter.splitDateTime(item.waktu);
        
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
            </tr>
        `;
    },

    createKonsultasiRow: (item, index) => {
        const { tanggal, waktu } = Formatter.splitDateTime(item.waktu);
        
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
            </tr>
        `;
    },

    populateTables: (filteredData) => {
        // Filter data berdasarkan jenis
        const dataBerobat = filteredData.filter(item => item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.BEROBAT);
        const dataKecelakaan = filteredData.filter(item => item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.KECELAKAAN);
        const dataKonsultasi = filteredData.filter(item => item.jenisKunjungan === CONFIG.JENIS_KUNJUNGAN.KONSULTASI);

        // Populate tabel berobat
        const tableBerobatBody = document.getElementById('tableBerobatBody');
        const totalBerobat = document.getElementById('totalBerobat');
        const totalBerobatSummary = document.getElementById('totalBerobatSummary');
        
        if (tableBerobatBody) {
            tableBerobatBody.innerHTML = dataBerobat.length > 0 ? 
                dataBerobat.map((item, index) => TableBuilder.createBerobatRow(item, index)).join('') :
                `<tr><td colspan="21" class="text-center py-4 text-muted">Tidak ada data berobat</td></tr>`;
        }
        
        if (totalBerobat) totalBerobat.textContent = dataBerobat.length;
        if (totalBerobatSummary) totalBerobatSummary.textContent = dataBerobat.length;

        // Populate tabel kecelakaan
        const tableKecelakaanBody = document.getElementById('tableKecelakaanBody');
        const totalKecelakaan = document.getElementById('totalKecelakaan');
        const totalKecelakaanSummary = document.getElementById('totalKecelakaanSummary');
        
        if (tableKecelakaanBody) {
            tableKecelakaanBody.innerHTML = dataKecelakaan.length > 0 ? 
                dataKecelakaan.map((item, index) => TableBuilder.createKecelakaanRow(item, index)).join('') :
                `<tr><td colspan="10" class="text-center py-4 text-muted">Tidak ada data kecelakaan</td></tr>`;
        }
        
        if (totalKecelakaan) totalKecelakaan.textContent = dataKecelakaan.length;
        if (totalKecelakaanSummary) totalKecelakaanSummary.textContent = dataKecelakaan.length;

        // Populate tabel konsultasi
        const tableKonsultasiBody = document.getElementById('tableKonsultasiBody');
        const totalKonsultasi = document.getElementById('totalKonsultasi');
        const totalKonsultasiSummary = document.getElementById('totalKonsultasiSummary');
        
        if (tableKonsultasiBody) {
            tableKonsultasiBody.innerHTML = dataKonsultasi.length > 0 ? 
                dataKonsultasi.map((item, index) => TableBuilder.createKonsultasiRow(item, index)).join('') :
                `<tr><td colspan="10" class="text-center py-4 text-muted">Tidak ada data konsultasi</td></tr>`;
        }
        
        if (totalKonsultasi) totalKonsultasi.textContent = dataKonsultasi.length;
        if (totalKonsultasiSummary) totalKonsultasiSummary.textContent = dataKonsultasi.length;

        // Update total integrasi
        const totalIntegrasi = document.getElementById('totalIntegrasi');
        if (totalIntegrasi) {
            totalIntegrasi.textContent = filteredData.length;
        }
    }
};

// ========== LAPORAN MANAGEMENT ==========
const Laporan = {
    getFilteredData: () => {
        let filteredData = [...dataKunjungan];
        
        const filters = {
            dari: document.getElementById('filterDari')?.value,
            sampai: document.getElementById('filterSampai')?.value,
            dept: document.getElementById('filterDept')?.value,
            nama: document.getElementById('searchNama')?.value.toLowerCase()
        };
        
        if (filters.dari) filteredData = filteredData.filter(item => item.tanggal >= filters.dari);
        if (filters.sampai) filteredData = filteredData.filter(item => item.tanggal <= filters.sampai);
        if (filters.dept) filteredData = filteredData.filter(item => item.departemen === filters.dept);
        if (filters.nama) filteredData = filteredData.filter(item => 
            item.nama && item.nama.toLowerCase().includes(filters.nama)
        );
        
        return filteredData;
    },

    tampilkan: () => {
        const filteredData = Laporan.getFilteredData();
        TableBuilder.populateTables(filteredData);
    }
};

// ========== FORM HANDLERS ==========
const FormHandlers = {
    berobat: () => {
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
        
        // Validasi
        if (!Validator.validateForm(formData)) return;
        if (!formData.perluIstirahat) {
            alert('Harap pilih apakah pasien perlu istirahat!');
            return;
        }
        if (formData.perluIstirahat === 'Ya' && 
            (!document.getElementById('lamaIstirahat').value || 
             document.getElementById('lamaIstirahat').value === '0')) {
            alert('Harap isi jumlah hari istirahat!');
            return;
        }

        // Dapatkan nama kategori penyakit
        const kategoriPenyakitObj = PenyakitManager.getKategoriById(formData.kategoriPenyakit);
        const namaKategoriPenyakit = kategoriPenyakitObj ? kategoriPenyakitObj.name : '';

        // Dapatkan data obat lengkap
        const obatData = ObatManager.getObatByNama(formData.namaObat);
        
        const data = {
            ...Formatter.splitDateTime(formData.waktu),
            ...formData,
            perusahaan: namaPerusahaan,
            jenisKunjungan: CONFIG.JENIS_KUNJUNGAN.BEROBAT,
            tindakan: document.getElementById('tindakanBerobat')?.value,
            keteranganPenyakit: document.getElementById('keteranganPenyakitBerobat')?.value,
            lamaIstirahat: document.getElementById('lamaIstirahat')?.value || '0',
            keteranganSKD: document.getElementById('keteranganSKD')?.value,
            // Tambahan data
            namaKategoriPenyakit: namaKategoriPenyakit,
            obatKategori: obatData ? obatData.kategori : formData.kategoriObat
        };

        dataKunjungan.push(data);
        Storage.simpanData();
        FormHandlers.resetAndNotify('berobat');
    },

    kecelakaan: () => {
        const formData = {
            waktu: document.getElementById('tanggalKecelakaan')?.value,
            nama: document.getElementById('namaKecelakaan')?.value,
            departemen: document.getElementById('departemenKecelakaan')?.value,
            jenisKelamin: document.getElementById('jenisKelaminKecelakaan')?.value,
            lokasiKejadian: document.getElementById('lokasiKecelakaan')?.value,
            deskripsiKejadian: document.getElementById('deskripsiKecelakaan')?.value
        };

        if (!Validator.validateForm(formData)) return;

        const data = {
            ...Formatter.splitDateTime(formData.waktu),
            ...formData,
            perusahaan: namaPerusahaan,
            jenisKunjungan: CONFIG.JENIS_KUNJUNGAN.KECELAKAAN
        };

        dataKunjungan.push(data);
        Storage.simpanData();
        FormHandlers.resetAndNotify('kecelakaan');
    },

    konsultasi: () => {
        const formData = {
            waktu: document.getElementById('tanggalKonsultasi')?.value,
            nama: document.getElementById('namaKonsultasi')?.value,
            departemen: document.getElementById('departemenKonsultasi')?.value,
            jenisKelamin: document.getElementById('jenisKelaminKonsultasi')?.value,
            keluhan: document.getElementById('keluhanKonsultasi')?.value,
            saran: document.getElementById('saranKonsultasi')?.value
        };

        if (!Validator.validateForm(formData)) return;

        const data = {
            ...Formatter.splitDateTime(formData.waktu),
            ...formData,
            perusahaan: namaPerusahaan,
            jenisKunjungan: CONFIG.JENIS_KUNJUNGAN.KONSULTASI
        };

        dataKunjungan.push(data);
        Storage.simpanData();
        FormHandlers.resetAndNotify('konsultasi');
    },

    resetAndNotify: (jenis) => {
        const forms = {
            berobat: ['formKunjunganBerobat', 'formPenyakitBerobat', 'formObatBerobat', 'formSKDBerobat'],
            kecelakaan: ['formKecelakaan'],
            konsultasi: ['formKonsultasi']
        };

        forms[jenis]?.forEach(formId => UI.resetForm(formId));
        UI.setTanggalDefault();
        
        if (jenis === 'berobat') {
            const lamaIstirahatInput = document.getElementById('lamaIstirahat');
            if (lamaIstirahatInput) {
                lamaIstirahatInput.value = '0';
                lamaIstirahatInput.disabled = true;
            }
            // Reset select obat dan penyakit ke default
            ObatManager.populateObatSelect('');
            PenyakitManager.populatePenyakitSelect();
        }

        alert(`Data ${jenis} berhasil disimpan!`);
        Laporan.tampilkan();
        
        // Navigasi ke tab laporan
        const laporanTab = document.querySelector('[data-bs-target="#laporan"]');
        if (laporanTab) laporanTab.click();
    }
};

// ========== EVENT LISTENERS SETUP ==========
const EventManager = {
    setupPerusahaanEvents: () => {
        document.querySelectorAll('.select-perusahaan').forEach(button => {
            button.addEventListener('click', function() {
                const nama = this.getAttribute('data-nama');
                Storage.simpanPerusahaan(nama);
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalPerusahaan'));
                if (modal) modal.hide();
                alert(`Perusahaan "${nama}" berhasil dipilih!`);
            });
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
        
        // SKD radio button handler
        document.querySelectorAll('input[name="perluIstirahat"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const lamaIstirahatInput = document.getElementById('lamaIstirahat');
                if (lamaIstirahatInput) {
                    const isRequired = this.value === 'Ya';
                    lamaIstirahatInput.disabled = !isRequired;
                    lamaIstirahatInput.required = isRequired;
                    if (isRequired) lamaIstirahatInput.focus();
                    else lamaIstirahatInput.value = '0';
                }
            });
        });
    },

    setupFilterEvents: () => {
        const filterIds = ['filterDari', 'filterSampai', 'filterDept', 'searchNama'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', Laporan.tampilkan);
            }
        });
        
        const searchNama = document.getElementById('searchNama');
        if (searchNama) {
            searchNama.addEventListener('input', Laporan.tampilkan);
        }
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi perusahaan
    if (!namaPerusahaan) {
        UI.tampilkanModalPerusahaan();
    } else {
        UI.tampilkanNamaPerusahaan();
    }
    
    // Load data obat dan penyakit
    ObatManager.loadObatData();
    PenyakitManager.loadPenyakitData();
    
    // Setup events
    EventManager.setupPerusahaanEvents();
    EventManager.setupFormEvents();
    EventManager.setupFilterEvents();
    
    // Set default values
    UI.setTanggalDefault();
    UI.setFilterDefault();
    
    const lamaIstirahatInput = document.getElementById('lamaIstirahat');
    if (lamaIstirahatInput) {
        lamaIstirahatInput.disabled = true;
    }
    
    // Tampilkan laporan awal
    Laporan.tampilkan();
});