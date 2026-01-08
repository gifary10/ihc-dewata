// Configuration Sistem
const PAGES = {
    'company-data': { 
        name: 'Data Perusahaan', 
        url: '#',
        requiresAccess: false
    },
    'company-monitoring': { 
        name: 'Monitoring Perusahaan', 
        url: '#',
        requiresAccess: false
    },
    'staff-data': { 
        name: 'Data Petugas', 
        url: '#',
        requiresAccess: false
    },
    'clinic-monitoring': { 
        name: 'Monitoring Klinik', 
        url: 'https://script.google.com/macros/s/AKfycbzlhW84kn1qeYyku2CIF8sx4mQdkhEAsbOiTLIlpMPqQ8eljQQt01ZidqMCk7J3nqGtWQ/exec',
        requiresAccess: true,
        accessCode: 'dewata'
    },
    'clinic-staff': { 
        name: 'Petugas Klinik', 
        url: 'https://script.google.com/macros/s/AKfycbwKp4y12GjQSOuqO7jh2kiMEd1kMJn8MON6AalA-bLtBUPtYSvj1XBqD-Srumne8Ss/exec',
        requiresAccess: true,
        accessCode: 'ihc'
    },
    'requests': { 
        name: 'Permintaan Layanan', 
        url: '#',
        requiresAccess: false
    }
};

let currentPageId = null;

/**
 * Fungsi navigasi utama
 */
function navigateTo(pageId) {
    const page = PAGES[pageId];
    if (!page) return;

    if (page.requiresAccess) {
        openAccessModal(pageId);
    } else if (page.url === '#') {
        showNotification(`Halaman "${page.name}" dalam tahap pengembangan.`, 'info');
    } else {
        window.location.href = page.url;
    }
}

/**
 * Modal Access Control
 */
function openAccessModal(pageId) {
    currentPageId = pageId;
    const modal = document.getElementById('accessModal');
    const input = document.getElementById('accessCodeInput');
    const error = document.getElementById('accessError');
    const title = document.getElementById('accessModalTitle');

    title.textContent = `Akses ${PAGES[pageId].name}`;
    input.value = '';
    input.classList.remove('error', 'success');
    error.textContent = '';
    
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);
}

function closeAccessModal() {
    document.getElementById('accessModal').classList.add('hidden');
    currentPageId = null;
}

/**
 * Handle submit kode akses
 */
document.getElementById('accessForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('accessCodeInput');
    const error = document.getElementById('accessError');
    const page = PAGES[currentPageId];
    const code = input.value.trim();

    if (code === page.accessCode) {
        input.classList.add('success');
        error.textContent = 'Akses diterima! Mengalihkan...';
        error.style.color = '#198754';
        
        setTimeout(() => {
            window.location.href = page.url;
        }, 500);
    } else {
        input.classList.add('error');
        error.textContent = 'Kode akses salah. Silakan coba lagi.';
        error.style.color = '#dc3545';
        input.value = '';
        input.focus();
    }
});

/**
 * Notification System
 */
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-alert');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.className = `custom-alert alert alert-${type === 'error' ? 'danger' : type} fade show`;
    alert.innerHTML = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 250px;
    `;

    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

/**
 * Inisialisasi
 */
document.addEventListener('DOMContentLoaded', () => {
    // Update tahun di footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAccessModal();
    });

    // Close modal on Click Outside
    document.getElementById('accessModal').addEventListener('click', (e) => {
        if (e.target.id === 'accessModal') closeAccessModal();
    });

});


