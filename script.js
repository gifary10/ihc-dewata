// Configuration
const PAGES = {
  'company-data': { 
    name: 'Data Perusahaan', 
    url: '#',
    status: 'development',
    requiresAccess: false
  },
  'company-monitoring': { 
    name: 'Monitoring Perusahaan', 
    url: '#',
    status: 'development',
    requiresAccess: false
  },
  'staff-data': { 
    name: 'Data Petugas', 
    url: '#',
    status: 'development',
    requiresAccess: false
  },
  'clinic-monitoring': { 
    name: 'Monitoring Klinik', 
    url: 'klinik/dashboard.html',
    status: 'ready',
    requiresAccess: true,
    accessCode: 'dewata'
  },
  'clinic-staff': { 
    name: 'Petugas Klinik', 
    url: 'Petugas/petugas.html',
    status: 'ready',
    requiresAccess: true,
    accessCode: 'ihc'
  },
  'requests': { 
    name: 'Permintaan Layanan', 
    url: '#',
    status: 'development',
    requiresAccess: false
  }
};

// State variables for access control
let currentPageId = null;

// Access control modal functions
function requestAccess(pageId) {
  const page = PAGES[pageId];
  if (!page) {
    showNotification('Halaman tidak ditemukan', 'error');
    return false;
  }

  currentPageId = pageId;
  
  // Update modal content
  document.getElementById('accessModalTitle').textContent = `Akses ${page.name}`;
  document.getElementById('accessCodeInput').value = '';
  document.getElementById('accessCodeInput').className = 'access-input';
  document.getElementById('accessCodeInput').disabled = false;
  document.getElementById('accessError').className = 'access-error';
  document.getElementById('accessError').textContent = '';
  
  // Show modal
  const modal = document.getElementById('accessModal');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  
  // Focus on input
  setTimeout(() => {
    document.getElementById('accessCodeInput').focus();
  }, 100);
  
  return false;
}

function closeAccessModal() {
  const modal = document.getElementById('accessModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentPageId = null;
}

function submitAccessCode(event) {
  event.preventDefault();
  
  const input = document.getElementById('accessCodeInput');
  const errorElement = document.getElementById('accessError');
  const code = input.value.trim();
  const page = PAGES[currentPageId];
  
  // Clear previous error
  errorElement.className = 'access-error';
  input.className = 'access-input';
  
  // Check if code is empty
  if (!code) {
    errorElement.textContent = 'Kode akses tidak boleh kosong';
    errorElement.className = 'access-error show';
    input.className = 'access-input error';
    input.focus();
    return false;
  }
  
  // Check if page exists
  if (!page) {
    errorElement.textContent = 'Halaman tidak ditemukan';
    errorElement.className = 'access-error show';
    input.className = 'access-input error';
    showNotification('Halaman tidak ditemukan', 'error');
    setTimeout(closeAccessModal, 2000);
    return false;
  }
  
  // Check access code
  if (code === page.accessCode) {
    // Success - langsung redirect tanpa delay
    input.className = 'access-input success';
    
    // Tutup modal dan redirect langsung
    closeAccessModal();
    window.location.href = page.url;
    
    return false;
  } else {
    // Wrong code
    errorElement.textContent = 'Kode akses salah';
    input.className = 'access-input error';
    input.value = '';
    input.focus();
    errorElement.className = 'access-error show';
  }
  
  return false;
}

// Simplified navigation function
function navigateTo(pageId) {
  const page = PAGES[pageId];
  if (!page) {
    console.error('Halaman tidak ditemukan:', pageId);
    showNotification('Halaman tidak ditemukan', 'error');
    return false;
  }

  // Jika halaman memerlukan akses, tampilkan modal
  if (page.requiresAccess) {
    requestAccess(pageId);
    return false;
  }
  
  // Untuk halaman dalam pengembangan
  if (page.url === '#') {
    showNotification(`Halaman "${page.name}" sedang dalam pengembangan.`, 'info');
    return false;
  }
  
  // Untuk halaman yang tersedia
  window.location.href = page.url;
  
  return false;
}

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Header scroll effect
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Add keyboard navigation for modal
  document.addEventListener('keydown', (e) => {
    // Close modal on escape key
    if (e.key === 'Escape' && !document.getElementById('accessModal').classList.contains('hidden')) {
      closeAccessModal();
    }
    
    // Submit on Enter in access input
    if (e.key === 'Enter' && !document.getElementById('accessModal').classList.contains('hidden') && 
        document.activeElement.id === 'accessCodeInput') {
      document.querySelector('.access-form').requestSubmit();
    }
  });
  
  // Close modal on outside click
  document.getElementById('accessModal').addEventListener('click', (e) => {
    if (e.target.id === 'accessModal') {
      closeAccessModal();
    }
  });
});

// Notification system (simplified)
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} position-fixed`;
  notification.setAttribute('role', 'alert');
  notification.style.cssText = `
    top: 100px;
    right: 20px;
    z-index: 1050;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    font-size: 0.9rem;
  `;
  
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
  
  // Add animation styles
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
