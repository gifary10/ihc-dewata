// ════════════════════════════════════════════════════════
//  CONFIG — ganti GAS_URL setelah deploy Web App
// ════════════════════════════════════════════════════════
const GAS_URL  = 'https://script.google.com/macros/s/AKfycbwk5rfdyQiFVmF_n6au9ZBmAqpXX3bkfd-OyerG-jUiVT45Tdq57KY676JmHjopZhBQOA/exec';
const PER_PAGE = 15;

// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
const state = {
  master: null,
  company: '',
  data: {
    berobat:    { rows: [], total: 0, page: 1, totalPages: 1 },
    kecelakaan: { rows: [], total: 0, page: 1, totalPages: 1 },
    konsultasi: { rows: [], total: 0, page: 1, totalPages: 1 },
  },
  filters: {
    berobat:    { search: '', tahun: '', bulan: '', dept: '' },
    kecelakaan: { search: '', tahun: '', bulan: '', dept: '' },
    konsultasi: { search: '', tahun: '', bulan: '', dept: '' },
  },
  editMode:       { sheet: null, rowIndex: null },
  obatList:       [],
  diagnosaList:   [],
  debounceTimers: {},
};

// ════════════════════════════════════════════════════════
//  CUSTOM MODAL FUNCTIONS (Pengganti Bootstrap)
// ════════════════════════════════════════════════════════

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        const firstInput = modal.querySelector('input, select, textarea, button:not(.modal-close)');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.style.display === 'flex') {
                m.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
});

// ════════════════════════════════════════════════════════
//  FORMAT HELPERS
// ════════════════════════════════════════════════════════

function dateToInput(str) {
  if (!str) return '';
  const p = str.split('/');
  if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return str;
}

function inputToDate(str) {
  if (!str) return '';
  const p = str.split('-');
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return str;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }
function nowTime()  { return new Date().toTimeString().slice(0, 5); }

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toggleIstirahat() {
  const v = document.getElementById('b-istirahat')?.value;
  const wrap = document.getElementById('wrap-hari-istirahat');
  if (wrap) wrap.style.display = v === 'Ya' ? 'block' : 'none';
}

// ════════════════════════════════════════════════════════
//  CORS-SAFE API
// ════════════════════════════════════════════════════════
async function gasRequest(action, payload = {}) {
  const params = new URLSearchParams({ action });
  if (Object.keys(payload).length) params.set('payload', JSON.stringify(payload));
  const res = await fetch(GAS_URL + '?' + params.toString());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  if (GAS_URL === 'GANTI_DENGAN_URL_GAS_WEB_APP') {
    hideLoading();
    toast('warning', 'Konfigurasi', 'Ganti GAS_URL dengan URL deployment Google Apps Script Anda.');
    openCompanyModal();
    return;
  }
  try {
    const res = await gasRequest('getMasterData');
    if (res.status !== 'success') throw new Error(res.message);
    state.master = res.data;
    populateMasterDropdowns();
    hideLoading();
    const saved = sessionStorage.getItem('selectedCompany');
    if (saved && state.master.perusahaan.includes(saved)) {
      applyCompany(saved);
    } else {
      openCompanyModal();
    }
  } catch (e) {
    hideLoading();
    toast('error', 'Gagal Memuat', 'Tidak dapat terhubung ke server: ' + e.message);
    openCompanyModal();
  }
});

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// ════════════════════════════════════════════════════════
//  MASTER DROPDOWNS
// ════════════════════════════════════════════════════════
function populateMasterDropdowns() {
  if (!state.master) return;
  const sel = document.getElementById('select-perusahaan');
  if (sel) {
    sel.innerHTML = '<option value="">-- Pilih Perusahaan --</option>';
    state.master.perusahaan.forEach(p =>
      sel.insertAdjacentHTML('beforeend', `<option value="${esc(p)}">${esc(p)}</option>`)
    );
  }
  const katDiag = document.getElementById('b-kat-diagnosa');
  if (katDiag) {
    katDiag.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    Object.keys(state.master.diagnosa).forEach(k =>
      katDiag.insertAdjacentHTML('beforeend', `<option value="${esc(k)}">${esc(k)}</option>`)
    );
  }
  const katObat = document.getElementById('b-kat-obat');
  if (katObat) {
    katObat.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    Object.keys(state.master.obat).forEach(k =>
      katObat.insertAdjacentHTML('beforeend', `<option value="${esc(k)}">${esc(k)}</option>`)
    );
  }
}

function filterNamaDiagnosa() {
  const kat = document.getElementById('b-kat-diagnosa')?.value;
  const sel = document.getElementById('b-nama-diagnosa');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Nama --</option>';
  if (kat && state.master?.diagnosa[kat]) {
    state.master.diagnosa[kat].forEach(n =>
      sel.insertAdjacentHTML('beforeend', `<option value="${esc(n)}">${esc(n)}</option>`)
    );
  }
}

function filterNamaObat() {
  const kat = document.getElementById('b-kat-obat')?.value;
  const sel = document.getElementById('b-nama-obat');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Nama --</option>';
  if (kat && state.master?.obat[kat]) {
    state.master.obat[kat].forEach(n =>
      sel.insertAdjacentHTML('beforeend', `<option value="${esc(n)}">${esc(n)}</option>`)
    );
  }
}

function fillDepartemenDropdown(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Departemen --</option>';
  if (!state.company || !state.master) return;
  (state.master.departemen[state.company] || []).forEach(d =>
    sel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`)
  );
}

// ════════════════════════════════════════════════════════
//  COMPANY SELECTION
// ════════════════════════════════════════════════════════
function openCompanyModal() {
  const sel = document.getElementById('select-perusahaan');
  if (state.company && sel) sel.value = state.company;
  openModal('modalPerusahaan');
}

function saveCompany() {
  const val = document.getElementById('select-perusahaan')?.value;
  if (!val) { toast('warning', 'Perhatian', 'Pilih perusahaan terlebih dahulu.'); return; }
  applyCompany(val);
  closeModal('modalPerusahaan');
}

function applyCompany(company) {
  state.company = company;
  sessionStorage.setItem('selectedCompany', company);
  
  const sidebarName = document.getElementById('sidebar-company-name');
  const topbarCompany = document.getElementById('topbar-company');
  if (sidebarName) sidebarName.textContent = company;
  if (topbarCompany) topbarCompany.textContent = company;
  
  toast('success', 'Perusahaan Dipilih', company);
  
  ['berobat', 'kecelakaan', 'konsultasi'].forEach(type => {
    state.filters[type] = { search: '', tahun: '', bulan: '', dept: '' };
    ['search', 'filter-tahun', 'filter-bulan', 'filter-dept'].forEach(prefix => {
      const el = document.getElementById(`${prefix}-${type}`);
      if (el) el.value = '';
    });
  });
  
  loadData('berobat',    1);
  loadData('kecelakaan', 1);
  loadData('konsultasi', 1);
}

// ════════════════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════════════════
const pageTitles = { berobat:'Data Berobat', kecelakaan:'Data Kecelakaan', konsultasi:'Data Konsultasi' };

function showPage(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  
  const section = document.getElementById('page-' + name);
  if (section) section.classList.add('active');
  
  const navLink = document.querySelector(`.nav-link[data-page="${name}"]`);
  if (navLink) navLink.classList.add('active');
  
  const bnavItem = document.getElementById('bnav-' + name);
  if (bnavItem) bnavItem.classList.add('active');
  
  const topbarTitle = document.getElementById('topbar-title');
  const topbarBreadcrumb = document.getElementById('topbar-breadcrumb');
  if (topbarTitle) topbarTitle.textContent = pageTitles[name] || name;
  if (topbarBreadcrumb) topbarBreadcrumb.textContent = pageTitles[name] || name;
  
  if (window.innerWidth <= 768) toggleSidebar(false);
}

function toggleSidebar(force) {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebar-overlay');
  if (!s || !o) return;
  const open = force !== undefined ? force : !s.classList.contains('open');
  s.classList.toggle('open', open);
  o.classList.toggle('visible', open);
}

// ════════════════════════════════════════════════════════
//  DATA LOADING
// ════════════════════════════════════════════════════════
const sheetMap = { berobat:'Berobat', kecelakaan:'Kecelakaan', konsultasi:'Konsultasi' };

async function loadData(type, page) {
  if (GAS_URL === 'GANTI_DENGAN_URL_GAS_WEB_APP') return;
  if (page !== undefined) state.data[type].page = page;
  renderSkeleton(type);
  const f = state.filters[type];
  try {
    const res = await gasRequest('getData', {
      sheet      : sheetMap[type],
      perusahaan : state.company,
      search     : f.search,
      tahun      : f.tahun,
      bulan      : f.bulan,
      dept       : f.dept,
      page       : state.data[type].page,
      perPage    : PER_PAGE,
    });
    if (res.status !== 'success') throw new Error(res.message);
    state.data[type].rows       = res.data || [];
    state.data[type].total      = res.total || 0;
    state.data[type].page       = res.page  || 1;
    state.data[type].totalPages = res.totalPages || 1;
    updateBadge(type, res.total);
    populateFilterOptions(type, res.filterOptions || {});
    renderTable(type);
  } catch (e) {
    const cols = colCount[type] || 10;
    const tbody = document.getElementById('tbody-' + type);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><i class="fas fa-wifi"></i><p>Gagal memuat: ${esc(e.message)}</p></div></td></tr>`;
    }
    toast('error', 'Gagal Memuat', e.message);
  }
}

function updateBadge(type, n) {
  const badge = document.getElementById('badge-' + type);
  if (badge) badge.textContent = n || 0;
  const bnav = document.getElementById('bnav-badge-' + type);
  if (bnav) { 
    bnav.textContent = n || 0; 
    bnav.style.display = n ? 'block' : 'none'; 
  }
}

// ════════════════════════════════════════════════════════
//  FILTER & SEARCH
// ════════════════════════════════════════════════════════
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function populateFilterOptions(type, options) {
  if (options.tahun) {
    fillFilter(`filter-tahun-${type}`, options.tahun, v => v, v => v);
    const el = document.getElementById(`filter-tahun-${type}`);
    if (el) el.value = state.filters[type].tahun;
  }
  if (options.bulan) {
    fillFilter(`filter-bulan-${type}`, options.bulan, v => v, v => BULAN[parseInt(v) - 1] || v);
    const el = document.getElementById(`filter-bulan-${type}`);
    if (el) el.value = state.filters[type].bulan;
  }
  if (options.dept) {
    fillFilter(`filter-dept-${type}`, options.dept, v => v, v => v);
    const el = document.getElementById(`filter-dept-${type}`);
    if (el) el.value = state.filters[type].dept;
  }
}

function fillFilter(id, arr, valFn, labelFn) {
  const el = document.getElementById(id);
  if (!el) return;
  const firstOption = el.querySelector('option:first-child');
  const firstHTML = firstOption ? firstOption.outerHTML : '<option value="">Semua</option>';
  el.innerHTML = firstHTML;
  arr.forEach(v => el.insertAdjacentHTML('beforeend',
    `<option value="${esc(String(valFn(v)))}">${esc(String(labelFn(v)))}</option>`
  ));
}

function debounceSearch(type) {
  clearTimeout(state.debounceTimers[type]);
  state.debounceTimers[type] = setTimeout(() => {
    const searchInput = document.getElementById('search-' + type);
    state.filters[type].search = searchInput?.value.trim() || '';
    loadData(type, 1);
  }, 350);
}

function applyFilter(type) {
  state.filters[type].tahun = document.getElementById(`filter-tahun-${type}`)?.value || '';
  state.filters[type].bulan = document.getElementById(`filter-bulan-${type}`)?.value || '';
  state.filters[type].dept  = document.getElementById(`filter-dept-${type}`)?.value  || '';
  loadData(type, 1);
}

// ════════════════════════════════════════════════════════
//  TABLE RENDERING
// ════════════════════════════════════════════════════════
const colCount = { berobat: 21, kecelakaan: 15, konsultasi: 13 };

function renderTable(type) {
  const { rows, total, page, totalPages } = state.data[type];
  const start = (page - 1) * PER_PAGE;
  const cols  = colCount[type] || 10;
  const tbody = document.getElementById('tbody-' + type);
  if (!tbody) return;
  
  tbody.innerHTML = rows.length
    ? rows.map((r, i) => buildRow(type, r, start + i + 1)).join('')
    : `<tr><td colspan="${cols}"><div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada data ditemukan</p></div></td></tr>`;
  
  const info = document.getElementById('info-' + type);
  if (info) {
    info.textContent = total
      ? `Menampilkan ${start + 1}–${Math.min(start + PER_PAGE, total)} dari ${total} data`
      : 'Tidak ada data';
  }
  
  renderPagination(type, page, totalPages);
}

function renderSkeleton(type) {
  const cols  = colCount[type] || 10;
  const tbody = document.getElementById('tbody-' + type);
  if (!tbody) return;
  tbody.innerHTML = Array(5).fill(
    '<tr>' + Array(cols).fill('<td><div class="skeleton" style="height:13px;width:85%"></div></td>').join('') + '</tr>'
  ).join('');
}

function buildRow(type, r, no) {
  const idx = r._rowIndex;
  const ts  = esc(r['Timestamp'] || '');
  const tgl = esc(r['Tanggal']   || '');
  const wkt = esc(r['Waktu']     || '');

  const act = `<div class="action-btns">
    <button class="btn-icon btn-edit" onclick="openEditModal('${type}',${idx})" title="Edit"><i class="fas fa-pencil-alt"></i></button>
    <button class="btn-icon btn-delete" onclick="confirmDelete('${type}',${idx})" title="Hapus"><i class="fas fa-trash-alt"></i></button>
  </div>`;

  if (type === 'berobat') return `<tr>
    <td style="text-align:center; width:40px">${no}</td>
    <td class="col-ts">${ts}</td>
    <td class="col-id">${esc(r['ID']||'')}</td>
    <td class="col-tgl">${tgl}</td>
    <td class="col-wkt">${wkt}</td>
    <td>${esc(r['Perusahaan']||'')}</td>
    <td>${esc(r['Departemen']||'')}</td>
    <td><strong>${esc(r['Nama']||'')}</strong></td>
    <td>${esc(r['Jenis Kelamin']||'')}</td>
    <td class="col-wrap">${esc(r['Keluhan']||'')}</td>
    <td class="col-wrap">${esc((r['Kategori Diagnosa']||'').replace(/\|/g,', '))}</td>
    <td class="col-wrap">${esc((r['Nama Diagnosa']||'').replace(/\|/g,', '))}</td>
    <td class="col-wrap">${esc((r['Kategori Obat']||'').replace(/\|/g,', '))}</td>
    <td class="col-wrap">${esc((r['Nama Obat']||'').replace(/\|/g,', '))}</td>
    <td>${esc((r['Jumlah Obat']||'').replace(/\|/g,', '))}</td>
    <td>${esc((r['Satuan Obat']||'').replace(/\|/g,', '))}</td>
    <td class="col-wrap">${esc(r['Tindakan']||'')}</td>
    <td style="text-align:center">${esc(r['Perlu Istirahat']||'')}</td>
    <td style="text-align:center">${esc(r['Jumlah Hari Istirahat']||'')}</td>
    <td class="col-wrap">${esc(r['Keterangan Berobat']||'')}</td>
    <td style="text-align:center">${act}</td>
  </tr>`;

  if (type === 'kecelakaan') return `<tr>
    <td style="text-align:center; width:40px">${no}</td>
    <td class="col-ts">${ts}</td>
    <td class="col-id">${esc(r['ID']||'')}</td>
    <td class="col-tgl">${tgl}</td>
    <td class="col-wkt">${wkt}</td>
    <td>${esc(r['Perusahaan']||'')}</td>
    <td>${esc(r['Departemen']||'')}</td>
    <td><strong>${esc(r['Nama']||'')}</strong></td>
    <td>${esc(r['Jenis Kelamin']||'')}</td>
    <td class="col-wrap">${esc(r['Lokasi Kejadian']||'')}</td>
    <td class="col-wrap">${esc(r['Penyebab']||'')}</td>
    <td class="col-wrap">${esc(r['Bagian Yang Terluka']||'')}</td>
    <td class="col-wrap">${esc(r['Tindakan']||'')}</td>
    <td class="col-wrap">${esc(r['Deskripsi Kejadian']||'')}</td>
    <td style="text-align:center">${act}</td>
  </tr>`;

  if (type === 'konsultasi') return `<tr>
    <td style="text-align:center; width:40px">${no}</td>
    <td class="col-ts">${ts}</td>
    <td class="col-id">${esc(r['ID']||'')}</td>
    <td class="col-tgl">${tgl}</td>
    <td class="col-wkt">${wkt}</td>
    <td>${esc(r['Perusahaan']||'')}</td>
    <td>${esc(r['Departemen']||'')}</td>
    <td><strong>${esc(r['Nama']||'')}</strong></td>
    <td>${esc(r['Jenis Kelamin']||'')}</td>
    <td class="col-wrap">${esc(r['Keluhan']||'')}</td>
    <td class="col-wrap">${esc(r['Riwayat Penyakit']||'')}</td>
    <td class="col-wrap">${esc(r['Saran']||'')}</td>
    <td style="text-align:center">${act}</td>
  </tr>`;

  return '';
}

function renderPagination(type, page, totalPages) {
  const wrap = document.getElementById('pages-' + type);
  if (!wrap) return;
  if (totalPages <= 1) { wrap.innerHTML = ''; return; }
  
  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="gotoPage('${type}',${page-1})"><i class="fas fa-chevron-left"></i></button>`;
  paginationRange(page, totalPages).forEach(p => {
    if (p === '...') html += `<button class="page-btn" disabled>…</button>`;
    else html += `<button class="page-btn ${p===page?'active':''}" onclick="gotoPage('${type}',${p})">${p}</button>`;
  });
  html += `<button class="page-btn" ${page===totalPages?'disabled':''} onclick="gotoPage('${type}',${page+1})"><i class="fas fa-chevron-right"></i></button>`;
  wrap.innerHTML = html;
}

function paginationRange(current, total) {
  if (total <= 7) return Array.from({length:total}, (_,i) => i+1);
  if (current <= 4) return [1,2,3,4,5,'...',total];
  if (current >= total-3) return [1,'...',total-4,total-3,total-2,total-1,total];
  return [1,'...',current-1,current,current+1,'...',total];
}

function gotoPage(type, page) {
  loadData(type, page);
  document.getElementById('page-' + type)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ════════════════════════════════════════════════════════
//  MODAL BEROBAT
// ════════════════════════════════════════════════════════
function openAddModal(type) {
  if (!state.company) { 
    toast('warning','Perhatian','Pilih perusahaan terlebih dahulu.'); 
    openCompanyModal(); 
    return; 
  }
  
  state.editMode   = { sheet: null, rowIndex: null };
  state.obatList     = [];
  state.diagnosaList = [];
  
  if (type === 'berobat') {
    const title = document.getElementById('title-berobat');
    if (title) title.innerHTML = '<i class="fas fa-clipboard-list me-2" style="color:var(--teal)"></i>Tambah Data Berobat';
    resetBerobatForm();
    openModal('modalBerobat');
  } else if (type === 'kecelakaan') {
    const title = document.getElementById('title-kecelakaan');
    if (title) title.innerHTML = '<i class="fas fa-exclamation-triangle me-2" style="color:var(--red)"></i>Tambah Data Kecelakaan';
    resetKecelakaanForm();
    openModal('modalKecelakaan');
  } else if (type === 'konsultasi') {
    const title = document.getElementById('title-konsultasi');
    if (title) title.innerHTML = '<i class="fas fa-comment-medical me-2" style="color:var(--green)"></i>Tambah Data Konsultasi';
    resetKonsultasiForm();
    openModal('modalKonsultasi');
  }
}

function resetBerobatForm() {
  const bTanggal = document.getElementById('b-tanggal');
  const bWaktu = document.getElementById('b-waktu');
  const bPerusahaan = document.getElementById('b-perusahaan');
  if (bTanggal) bTanggal.value = todayStr();
  if (bWaktu) bWaktu.value = nowTime();
  if (bPerusahaan) bPerusahaan.value = state.company;
  
  fillDepartemenDropdown('b-departemen');
  
  ['b-nama','b-keluhan','b-tindakan','b-keterangan','b-jumlah-obat','b-satuan-obat']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  
  const bJk = document.getElementById('b-jk');
  const bIstirahat = document.getElementById('b-istirahat');
  const bHari = document.getElementById('b-hari-istirahat');
  if (bJk) bJk.value = '';
  if (bIstirahat) bIstirahat.value = '';
  if (bHari) bHari.value = '';
  
  const wrapHari = document.getElementById('wrap-hari-istirahat');
  if (wrapHari) wrapHari.style.display = 'none';
  
  const bKatDiag = document.getElementById('b-kat-diagnosa');
  if (bKatDiag) bKatDiag.value = '';
  const bNamaDiag = document.getElementById('b-nama-diagnosa');
  if (bNamaDiag) bNamaDiag.innerHTML = '<option value="">-- Pilih Nama --</option>';
  
  const bKatObat = document.getElementById('b-kat-obat');
  if (bKatObat) bKatObat.value = '';
  const bNamaObat = document.getElementById('b-nama-obat');
  if (bNamaObat) bNamaObat.innerHTML = '<option value="">-- Pilih Nama --</option>';
  
  state.obatList = [];
  state.diagnosaList = [];
  renderObatList();
  renderDiagnosaList();
}

function resetKecelakaanForm() {
  const kTanggal = document.getElementById('k-tanggal');
  const kWaktu = document.getElementById('k-waktu');
  const kPerusahaan = document.getElementById('k-perusahaan');
  if (kTanggal) kTanggal.value = todayStr();
  if (kWaktu) kWaktu.value = nowTime();
  if (kPerusahaan) kPerusahaan.value = state.company;
  
  fillDepartemenDropdown('k-departemen');
  
  ['k-nama','k-lokasi','k-penyebab','k-bagian-terluka','k-tindakan','k-deskripsi']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  
  const kJk = document.getElementById('k-jk');
  if (kJk) kJk.value = '';
}

function resetKonsultasiForm() {
  const koTanggal = document.getElementById('ko-tanggal');
  const koWaktu = document.getElementById('ko-waktu');
  const koPerusahaan = document.getElementById('ko-perusahaan');
  if (koTanggal) koTanggal.value = todayStr();
  if (koWaktu) koWaktu.value = nowTime();
  if (koPerusahaan) koPerusahaan.value = state.company;
  
  fillDepartemenDropdown('ko-departemen');
  
  ['ko-nama','ko-keluhan','ko-riwayat','ko-saran']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  
  const koJk = document.getElementById('ko-jk');
  if (koJk) koJk.value = '';
}

// DIAGNOSA LIST
function tambahDiagnosa() {
  const kat  = document.getElementById('b-kat-diagnosa')?.value;
  const nama = document.getElementById('b-nama-diagnosa')?.value;
  if (!nama) { toast('warning','Perhatian','Pilih nama diagnosa terlebih dahulu.'); return; }
  state.diagnosaList.push({ kategori: kat, nama });
  renderDiagnosaList();
  
  const bKatDiag = document.getElementById('b-kat-diagnosa');
  const bNamaDiag = document.getElementById('b-nama-diagnosa');
  if (bKatDiag) bKatDiag.value = '';
  if (bNamaDiag) bNamaDiag.innerHTML = '<option value="">-- Pilih Nama --</option>';
}

function hapusDiagnosa(idx) {
  state.diagnosaList.splice(idx, 1);
  renderDiagnosaList();
}

function renderDiagnosaList() {
  const tbody = document.getElementById('diagnosa-list-tbody');
  if (!tbody) return;
  if (!state.diagnosaList.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3" style="font-size:12px">Belum ada diagnosa ditambahkan</td></tr>';
    return;
  }
  tbody.innerHTML = state.diagnosaList.map((d,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${esc(d.kategori||'—')}</td>
      <td>${esc(d.nama)}</td>
      <td><button class="btn-remove-obat" onclick="hapusDiagnosa(${i})"><i class="fas fa-times"></i></button></td>
    </tr>`).join('');
}

// OBAT LIST
function tambahObat() {
  const kat    = document.getElementById('b-kat-obat')?.value;
  const nama   = document.getElementById('b-nama-obat')?.value;
  const jumlah = document.getElementById('b-jumlah-obat')?.value;
  const satuan = document.getElementById('b-satuan-obat')?.value;
  if (!nama) { toast('warning','Perhatian','Pilih nama obat terlebih dahulu.'); return; }
  state.obatList.push({ kategori: kat, nama, jumlah, satuan });
  renderObatList();
  
  const bKatObat = document.getElementById('b-kat-obat');
  const bNamaObat = document.getElementById('b-nama-obat');
  const bJumlah = document.getElementById('b-jumlah-obat');
  const bSatuan = document.getElementById('b-satuan-obat');
  if (bKatObat) bKatObat.value = '';
  if (bNamaObat) bNamaObat.innerHTML = '<option value="">-- Pilih Nama --</option>';
  if (bJumlah) bJumlah.value = '';
  if (bSatuan) bSatuan.value = '';
}

function hapusObat(idx) {
  state.obatList.splice(idx, 1);
  renderObatList();
}

function renderObatList() {
  const tbody = document.getElementById('obat-list-tbody');
  if (!tbody) return;
  if (!state.obatList.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3" style="font-size:12px">Belum ada obat ditambahkan</td></tr>';
    return;
  }
  tbody.innerHTML = state.obatList.map((o,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${esc(o.kategori||'—')}</td>
      <td>${esc(o.nama)}</td>
      <td>${esc(o.jumlah||'')}</td>
      <td>${esc(o.satuan||'')}</td>
      <td><button class="btn-remove-obat" onclick="hapusObat(${i})"><i class="fas fa-times"></i></button></td>
    </tr>`).join('');
}

// SAVE FUNCTIONS
async function saveBerobat() {
  const nama = document.getElementById('b-nama')?.value.trim();
  const tgl  = document.getElementById('b-tanggal')?.value;
  const dept = document.getElementById('b-departemen')?.value;
  if (!nama || !tgl || !dept) { toast('warning','Form Tidak Lengkap','Nama, Tanggal, dan Departemen wajib diisi.'); return; }
  
  await doSave('berobat', {
    'Tanggal'              : inputToDate(tgl),
    'Waktu'                : document.getElementById('b-waktu')?.value || '',
    'Perusahaan'           : state.company,
    'Departemen'           : dept,
    'Nama'                 : nama,
    'Jenis Kelamin'        : document.getElementById('b-jk')?.value || '',
    'Keluhan'              : document.getElementById('b-keluhan')?.value.trim() || '',
    'Kategori Diagnosa'    : state.diagnosaList.map(d=>d.kategori).join('|'),
    'Nama Diagnosa'        : state.diagnosaList.map(d=>d.nama).join('|'),
    'Kategori Obat'        : state.obatList.map(o=>o.kategori).join('|'),
    'Nama Obat'            : state.obatList.map(o=>o.nama).join('|'),
    'Jumlah Obat'          : state.obatList.map(o=>o.jumlah).join('|'),
    'Satuan Obat'          : state.obatList.map(o=>o.satuan).join('|'),
    'Tindakan'             : document.getElementById('b-tindakan')?.value.trim() || '',
    'Perlu Istirahat'      : document.getElementById('b-istirahat')?.value || '',
    'Jumlah Hari Istirahat': document.getElementById('b-hari-istirahat')?.value || '',
    'Keterangan Berobat'   : document.getElementById('b-keterangan')?.value.trim() || '',
  });
}

async function saveKecelakaan() {
  const nama = document.getElementById('k-nama')?.value.trim();
  const tgl  = document.getElementById('k-tanggal')?.value;
  const dept = document.getElementById('k-departemen')?.value;
  if (!nama || !tgl || !dept) { toast('warning','Form Tidak Lengkap','Nama, Tanggal, dan Departemen wajib diisi.'); return; }
  
  await doSave('kecelakaan', {
    'Tanggal'             : inputToDate(tgl),
    'Waktu'               : document.getElementById('k-waktu')?.value || '',
    'Perusahaan'          : state.company,
    'Departemen'          : dept,
    'Nama'                : nama,
    'Jenis Kelamin'       : document.getElementById('k-jk')?.value || '',
    'Lokasi Kejadian'     : document.getElementById('k-lokasi')?.value.trim() || '',
    'Penyebab'            : document.getElementById('k-penyebab')?.value.trim() || '',
    'Bagian Yang Terluka' : document.getElementById('k-bagian-terluka')?.value.trim() || '',
    'Tindakan'            : document.getElementById('k-tindakan')?.value.trim() || '',
    'Deskripsi Kejadian'  : document.getElementById('k-deskripsi')?.value.trim() || '',
  });
}

async function saveKonsultasi() {
  const nama = document.getElementById('ko-nama')?.value.trim();
  const tgl  = document.getElementById('ko-tanggal')?.value;
  const dept = document.getElementById('ko-departemen')?.value;
  if (!nama || !tgl || !dept) { toast('warning','Form Tidak Lengkap','Nama, Tanggal, dan Departemen wajib diisi.'); return; }
  
  await doSave('konsultasi', {
    'Tanggal'         : inputToDate(tgl),
    'Waktu'           : document.getElementById('ko-waktu')?.value || '',
    'Perusahaan'      : state.company,
    'Departemen'      : dept,
    'Nama'            : nama,
    'Jenis Kelamin'   : document.getElementById('ko-jk')?.value || '',
    'Keluhan'         : document.getElementById('ko-keluhan')?.value.trim() || '',
    'Riwayat Penyakit': document.getElementById('ko-riwayat')?.value.trim() || '',
    'Saran'           : document.getElementById('ko-saran')?.value.trim() || '',
  });
}

async function doSave(type, row) {
  if (GAS_URL === 'GANTI_DENGAN_URL_GAS_WEB_APP') {
    toast('info','Mode Demo','GAS_URL belum dikonfigurasi. Data tidak tersimpan.'); 
    return;
  }
  
  const isEdit = state.editMode.sheet === type;
  const modalIdMap = { berobat:'modalBerobat', kecelakaan:'modalKecelakaan', konsultasi:'modalKonsultasi' };
  const btnIdMap   = { berobat:'btn-save-berobat', kecelakaan:'btn-save-kecelakaan', konsultasi:'btn-save-konsultasi' };
  const btn = document.getElementById(btnIdMap[type]);
  const origHTML = btn ? btn.innerHTML : '';
  
  if (btn) { 
    btn.disabled = true; 
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Menyimpan...'; 
  }
  
  try {
    let res;
    if (isEdit) {
      const orig = state.data[type].rows.find(r => r._rowIndex === state.editMode.rowIndex);
      row['Timestamp'] = orig?.['Timestamp'] || '';
      row['ID']        = orig?.['ID']        || '';
      res = await gasRequest('updateRow', { sheet: sheetMap[type], rowIndex: state.editMode.rowIndex, row });
    } else {
      res = await gasRequest('addRow', { sheet: sheetMap[type], row });
    }
    
    if (res.status !== 'success') throw new Error(res.message);
    
    toast('success', isEdit ? 'Data Diperbarui' : 'Data Ditambahkan', 'Operasi berhasil dilakukan.');
    closeModal(modalIdMap[type]);
    state.editMode = { sheet: null, rowIndex: null };
    await loadData(type);
  } catch (e) {
    toast('error','Gagal Menyimpan', e.message);
  } finally {
    if (btn) { 
      btn.disabled = false; 
      btn.innerHTML = origHTML; 
    }
  }
}

// ════════════════════════════════════════════════════════
//  EDIT
// ════════════════════════════════════════════════════════
function openEditModal(type, rowIndex) {
  const record = state.data[type].rows.find(r => r._rowIndex === rowIndex);
  if (!record) { toast('error','Error','Data tidak ditemukan.'); return; }
  
  state.editMode   = { sheet: type, rowIndex };
  state.obatList     = [];
  state.diagnosaList = [];

  if (type === 'berobat') {
    resetBerobatForm();
    const title = document.getElementById('title-berobat');
    if (title) title.innerHTML = '<i class="fas fa-pencil-alt me-2"></i>Edit Data Berobat';
    
    const bTanggal = document.getElementById('b-tanggal');
    const bWaktu = document.getElementById('b-waktu');
    const bNama = document.getElementById('b-nama');
    const bJk = document.getElementById('b-jk');
    const bDept = document.getElementById('b-departemen');
    const bKeluhan = document.getElementById('b-keluhan');
    const bTindakan = document.getElementById('b-tindakan');
    const bKeterangan = document.getElementById('b-keterangan');
    const bIstirahat = document.getElementById('b-istirahat');
    const bHari = document.getElementById('b-hari-istirahat');
    
    if (bTanggal) bTanggal.value = dateToInput(record['Tanggal'] || '');
    if (bWaktu) bWaktu.value = record['Waktu'] || '';
    if (bNama) bNama.value = record['Nama']||'';
    if (bJk) bJk.value = record['Jenis Kelamin']||'';
    if (bDept) bDept.value = record['Departemen']||'';
    if (bKeluhan) bKeluhan.value = record['Keluhan']||'';
    if (bTindakan) bTindakan.value = record['Tindakan']||'';
    if (bKeterangan) bKeterangan.value = record['Keterangan Berobat']||'';
    if (bIstirahat) bIstirahat.value = record['Perlu Istirahat']||'';
    if (bHari) bHari.value = record['Jumlah Hari Istirahat']||'';
    
    toggleIstirahat();
    
    const katDiagArr  = (record['Kategori Diagnosa']||'').split('|').filter(Boolean);
    const namaDiagArr = (record['Nama Diagnosa']||'').split('|').filter(Boolean);
    namaDiagArr.forEach((n,i) => state.diagnosaList.push({ kategori: katDiagArr[i]||'', nama: n }));
    renderDiagnosaList();
    
    const katObatArr  = (record['Kategori Obat']||'').split('|').filter(Boolean);
    const namaObatArr = (record['Nama Obat']||'').split('|').filter(Boolean);
    const jumlahArr   = (record['Jumlah Obat']||'').split('|');
    const satuanArr   = (record['Satuan Obat']||'').split('|');
    namaObatArr.forEach((n,i) => state.obatList.push({ 
      kategori: katObatArr[i]||'', 
      nama: n, 
      jumlah: jumlahArr[i]||'', 
      satuan: satuanArr[i]||'' 
    }));
    renderObatList();
    
    openModal('modalBerobat');
    
  } else if (type === 'kecelakaan') {
    resetKecelakaanForm();
    const title = document.getElementById('title-kecelakaan');
    if (title) title.innerHTML = '<i class="fas fa-pencil-alt me-2"></i>Edit Data Kecelakaan';
    
    const kTanggal = document.getElementById('k-tanggal');
    const kWaktu = document.getElementById('k-waktu');
    const kNama = document.getElementById('k-nama');
    const kJk = document.getElementById('k-jk');
    const kDept = document.getElementById('k-departemen');
    const kLokasi = document.getElementById('k-lokasi');
    const kPenyebab = document.getElementById('k-penyebab');
    const kBagian = document.getElementById('k-bagian-terluka');
    const kTindakan = document.getElementById('k-tindakan');
    const kDeskripsi = document.getElementById('k-deskripsi');
    
    if (kTanggal) kTanggal.value = dateToInput(record['Tanggal'] || '');
    if (kWaktu) kWaktu.value = record['Waktu'] || '';
    if (kNama) kNama.value = record['Nama']||'';
    if (kJk) kJk.value = record['Jenis Kelamin']||'';
    if (kDept) kDept.value = record['Departemen']||'';
    if (kLokasi) kLokasi.value = record['Lokasi Kejadian']||'';
    if (kPenyebab) kPenyebab.value = record['Penyebab']||'';
    if (kBagian) kBagian.value = record['Bagian Yang Terluka']||'';
    if (kTindakan) kTindakan.value = record['Tindakan']||'';
    if (kDeskripsi) kDeskripsi.value = record['Deskripsi Kejadian']||'';
    
    openModal('modalKecelakaan');
    
  } else if (type === 'konsultasi') {
    resetKonsultasiForm();
    const title = document.getElementById('title-konsultasi');
    if (title) title.innerHTML = '<i class="fas fa-pencil-alt me-2"></i>Edit Data Konsultasi';
    
    const koTanggal = document.getElementById('ko-tanggal');
    const koWaktu = document.getElementById('ko-waktu');
    const koNama = document.getElementById('ko-nama');
    const koJk = document.getElementById('ko-jk');
    const koDept = document.getElementById('ko-departemen');
    const koKeluhan = document.getElementById('ko-keluhan');
    const koRiwayat = document.getElementById('ko-riwayat');
    const koSaran = document.getElementById('ko-saran');
    
    if (koTanggal) koTanggal.value = dateToInput(record['Tanggal'] || '');
    if (koWaktu) koWaktu.value = record['Waktu'] || '';
    if (koNama) koNama.value = record['Nama']||'';
    if (koJk) koJk.value = record['Jenis Kelamin']||'';
    if (koDept) koDept.value = record['Departemen']||'';
    if (koKeluhan) koKeluhan.value = record['Keluhan']||'';
    if (koRiwayat) koRiwayat.value = record['Riwayat Penyakit']||'';
    if (koSaran) koSaran.value = record['Saran']||'';
    
    openModal('modalKonsultasi');
  }
}

// ════════════════════════════════════════════════════════
//  DELETE
// ════════════════════════════════════════════════════════
function confirmDelete(type, rowIndex) {
  const btnConfirm = document.getElementById('btn-confirm-delete');
  if (btnConfirm) btnConfirm.onclick = () => doDelete(type, rowIndex);
  openModal('modalDelete');
}

async function doDelete(type, rowIndex) {
  if (GAS_URL === 'GANTI_DENGAN_URL_GAS_WEB_APP') {
    toast('info','Mode Demo','GAS_URL belum dikonfigurasi.'); 
    closeModal('modalDelete'); 
    return;
  }
  closeModal('modalDelete');
  try {
    const res = await gasRequest('deleteRow', { sheet: sheetMap[type], rowIndex });
    if (res.status !== 'success') throw new Error(res.message);
    toast('success','Data Dihapus','Data berhasil dihapus dari sistem.');
    await loadData(type);
  } catch (e) {
    toast('error','Gagal Menghapus', e.message);
  }
}

// ════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════
const toastIcons  = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
const toastTitles = { success:'Berhasil', error:'Gagal', warning:'Perhatian', info:'Informasi' };

function toast(type, title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const id   = 'toast-' + Date.now();
  const item = document.createElement('div');
  item.className = `toast-item ${type}`;
  item.id        = id;
  item.innerHTML = `
    <i class="fas ${toastIcons[type]||'fa-info-circle'} toast-icon"></i>
    <div class="toast-body">
      <strong>${esc(title||toastTitles[type])}</strong>
      <span>${esc(message)}</span>
    </div>
    <button class="toast-close" onclick="closeToast('${id}')"><i class="fas fa-times"></i></button>`;
  container.appendChild(item);
  
  requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('show')));
  setTimeout(() => closeToast(id), 4500);
}

function closeToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  setTimeout(() => el.remove(), 400);
}