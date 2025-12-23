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
    url: 'https://gifary10.github.io/ihc-dewata/klinik/dashboard.html',
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
    // Success
    input.className = 'access-input success';
    showNotification('Kode akses benar! Mengarahkan...', 'success');
    
    // Close modal and navigate
    setTimeout(() => {
      closeAccessModal();
      navigateToProtectedPage(currentPageId);
    }, 800);
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

// New function specifically for protected pages
function navigateToProtectedPage(pageId) {
  const page = PAGES[pageId];
  if (!page) {
    console.error('Halaman tidak ditemukan:', pageId);
    showNotification('Halaman tidak ditemukan', 'error');
    return false;
  }

  // Get the clicked element
  const element = document.querySelector(`[data-page="${pageId}"]`);
  
  // Show loading state
  if (element) {
    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
  }
  
  // Check if the page URL is valid and exists
  if (page.url && page.url !== '#') {
    // First check if the file exists
    checkFileExists(page.url).then(exists => {
      if (exists) {
        // File exists, redirect
        setTimeout(() => {
          window.location.href = page.url;
        }, 500);
      } else {
        // File doesn't exist, show error
        if (element) {
          element.classList.remove('loading');
          element.setAttribute('aria-busy', 'false');
        }
        showNotification(`Halaman "${page.name}" tidak ditemukan. Silakan hubungi administrator.`, 'error');
        console.error(`File not found: ${page.url}`);
      }
    }).catch(error => {
      if (element) {
        element.classList.remove('loading');
        element.setAttribute('aria-busy', 'false');
      }
      showNotification('Terjadi kesalahan saat memeriksa halaman.', 'error');
      console.error('Error checking file:', error);
    });
  } else {
    // No URL specified
    if (element) {
      element.classList.remove('loading');
      element.setAttribute('aria-busy', 'false');
    }
    showNotification(`Halaman "${page.name}" belum tersedia.`, 'info');
  }
  
  return false;
}

// Function to check if a file exists
function checkFileExists(url) {
  return new Promise((resolve) => {
    // For security and simplicity, we'll use a HEAD request
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, true);
    xhr.timeout = 5000;
    
    xhr.onload = function() {
      resolve(xhr.status >= 200 && xhr.status < 400);
    };
    
    xhr.onerror = function() {
      resolve(false);
    };
    
    xhr.ontimeout = function() {
      resolve(false);
    };
    
    try {
      xhr.send();
    } catch (e) {
      resolve(false);
    }
  });
}

// Original navigation function (for non-protected pages)
function navigateTo(pageId) {
  const page = PAGES[pageId];
  if (!page) {
    console.error('Halaman tidak ditemukan:', pageId);
    showNotification('Halaman tidak ditemukan', 'error');
    return false;
  }

  // Get the clicked element
  const element = document.querySelector(`[data-page="${pageId}"]`);
  
  // If page requires access, use the protected page function
  if (page.requiresAccess) {
    requestAccess(pageId);
    return false;
  }
  
  // For pages under development or without access requirement
  if (element) {
    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
  }

  // Simulate API call for pages under development
  setTimeout(() => {
    if (element) {
      element.classList.remove('loading');
      element.setAttribute('aria-busy', 'false');
    }
    showNotification(`Halaman "${page.name}" sedang dalam pengembangan.`, 'info');
    console.log(`Navigasi ke: ${page.name}`);
  }, 500);
  
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

  // Add keyboard navigation and focus management
  const menuCards = document.querySelectorAll('.menu-card');
  menuCards.forEach((card, index) => {
    // Set tabindex for better keyboard navigation
    card.setAttribute('tabindex', '0');
    
    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
      
      // Arrow key navigation between cards
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextCard = menuCards[Math.min(index + 1, menuCards.length - 1)];
        nextCard.focus();
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevCard = menuCards[Math.max(index - 1, 0)];
        prevCard.focus();
      }
    });
    
    // Focus styles
    card.addEventListener('focus', () => {
      card.style.outline = '2px solid var(--primary)';
      card.style.outlineOffset = '2px';
    });
    
    card.addEventListener('blur', () => {
      card.style.outline = 'none';
    });
  });

  // Set focus to first menu card for better accessibility
  if (menuCards.length > 0) {
    menuCards[0].focus();
  }
  
  // Add hover effect for touch devices
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
  }
  
  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('accessModal').classList.contains('hidden')) {
      closeAccessModal();
    }
  });
  
  // Close modal on outside click
  document.getElementById('accessModal').addEventListener('click', (e) => {
    if (e.target.id === 'accessModal') {
      closeAccessModal();
    }
  });
});

// Notification system
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
  notification.setAttribute('aria-live', 'polite');
  notification.style.cssText = `
    top: 100px;
    right: 20px;
    z-index: 1050;
    min-width: 300px;
    max-width: 90%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 8px;
    border: none;
    animation: slideIn 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi ${type === 'error' ? 'bi-exclamation-triangle' : type === 'success' ? 'bi-check-circle' : 'bi-info-circle'} me-2"></i>
      <span>${message}</span>
      <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()" aria-label="Close notification"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  const autoRemove = setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
  
  // Add click handler to close button
  notification.querySelector('.btn-close').addEventListener('click', () => {
    clearTimeout(autoRemove);
  });
  
  // Add animation styles if not already present
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

// Error handling
window.addEventListener('error', (e) => {
  console.error('Application error:', e.error);
  showNotification('Terjadi kesalahan dalam aplikasi. Silakan refresh halaman.', 'error');

});
