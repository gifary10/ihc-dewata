// ============================================
//  KONFIGURASI HALAMAN
// ============================================
const PAGES = {
  'clinic-monitoring': {
    name: 'Monitoring Klinik',
    url: 'Dashboard/dash.html',
    requiresAccess: true,
    accessCode: 'dewata'
  },
  'clinic-staff': {
    name: 'Petugas Klinik',
    url: 'input/input.html',
    requiresAccess: true,
    accessCode: 'ihc'
  }
};

let currentPageId = null;
let passwordVisible = false;


// ============================================
//  NAVIGASI
// ============================================
function navigateTo(pageId) {
  const page = PAGES[pageId];
  if (!page) return;

  if (page.requiresAccess) {
    openAccessModal(pageId);
  } else {
    window.location.href = page.url;
  }
}


// ============================================
//  ACCESS MODAL
// ============================================
function openAccessModal(pageId) {
  currentPageId = pageId;

  const modal   = document.getElementById('accessModal');
  const input   = document.getElementById('accessCodeInput');
  const error   = document.getElementById('accessError');
  const title   = document.getElementById('accessModalTitle');

  // Set judul modal sesuai halaman
  title.textContent = `Akses ${PAGES[pageId].name}`;

  // Reset state input
  input.value = '';
  input.type  = 'password';
  input.classList.remove('error', 'success');
  error.textContent  = '';
  error.style.color  = '';

  // Reset ikon mata
  passwordVisible = false;
  const eyeIcon = document.getElementById('eyeIcon');
  if (eyeIcon) {
    eyeIcon.className = 'fa-solid fa-eye';
  }

  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 120);
}

function closeAccessModal() {
  document.getElementById('accessModal').classList.add('hidden');
  currentPageId = null;
}

function togglePassword() {
  const input   = document.getElementById('accessCodeInput');
  const eyeIcon = document.getElementById('eyeIcon');
  if (!input || !eyeIcon) return;

  passwordVisible = !passwordVisible;
  input.type      = passwordVisible ? 'text' : 'password';
  eyeIcon.className = passwordVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
}


// ============================================
//  SUBMIT KODE AKSES
// ============================================
document.getElementById('accessForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const input = document.getElementById('accessCodeInput');
  const error = document.getElementById('accessError');
  const page  = PAGES[currentPageId];

  if (!page) return;

  const code = input.value.trim();

  if (code === page.accessCode) {
    input.classList.remove('error');
    input.classList.add('success');
    error.innerHTML = '<i class="fa-solid fa-circle-check"></i> Akses diterima! Mengalihkan...';
    error.style.color = '#16a34a';

    setTimeout(() => {
      closeAccessModal();
      window.location.href = page.url;
    }, 600);
  } else {
    input.classList.remove('success');
    input.classList.add('error');
    error.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Kode akses salah. Silakan coba lagi.';
    error.style.color = '';
    input.value = '';
    input.focus();
  }
});


// ============================================
//  INISIALISASI
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Tahun footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Tutup modal dengan Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAccessModal();
  });

  // Tutup modal klik di luar
  document.getElementById('accessModal').addEventListener('click', (e) => {
    if (e.target.id === 'accessModal') closeAccessModal();
  });
});