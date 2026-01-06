// PWA Registration and Update Management
// Handles service worker registration, updates, and PWA lifecycle

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

// Service worker registration
export const register = () => {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl);
        navigator.serviceWorker.ready.then(() => {
          console.log('Service worker is running in development mode');
        });
      } else {
        registerValidSW(swUrl);
      }
    });
  }
};

// Register valid service worker
const registerValidSW = async (swUrl) => {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log('Service Worker registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            showUpdateNotification();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

// Check if service worker is valid
const checkValidServiceWorker = async (swUrl) => {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    });

    const contentType = response.headers.get('content-type');
    if (
      response.status === 404 ||
      (contentType != null && contentType.indexOf('javascript') === -1)
    ) {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
    } else {
      registerValidSW(swUrl);
    }
  } catch (error) {
    console.log('No internet connection found. App is running in offline mode.');
  }
};

// Handle service worker messages
const handleServiceWorkerMessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SYNC_COMPLETE':
      handleSyncComplete(payload);
      break;
    case 'ONLINE_STATUS':
      handleOnlineStatusChange(payload);
      break;
    case 'CACHE_CLEARED':
      handleCacheCleared();
      break;
    default:
      console.log('Unknown service worker message:', type);
  }
};

// Handle sync completion
const handleSyncComplete = ({ success, error }) => {
  if (success) {
    showNotification('Data synchronized successfully', 'success');
  } else {
    showNotification(`Sync failed: ${error || 'Unknown error'}`, 'error');
  }
};

// Handle online status change
const handleOnlineStatusChange = ({ online }) => {
  if (online) {
    showNotification('Back online - syncing data...', 'info');
  } else {
    showNotification('You are now offline', 'warning');
  }
};

// Handle cache cleared
const handleCacheCleared = () => {
  showNotification('Cache cleared successfully', 'success');
};

// Show update notification
const showUpdateNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm';
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-bold">Update Available</h4>
        <p class="text-sm">A new version is available. Refresh to update.</p>
      </div>
      <div class="flex gap-2 ml-4">
        <button id="update-dismiss" class="text-blue-200 hover:text-white text-sm underline">Later</button>
        <button id="update-refresh" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium">Update</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Handle update button
  document.getElementById('update-refresh').addEventListener('click', () => {
    window.location.reload();
  });

  // Handle dismiss button
  document.getElementById('update-dismiss').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
};

// Show notification
const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div');
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  notification.className = `fixed top-4 right-4 z-50 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-in`;
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <p class="text-sm">${message}</p>
      <button id="notification-close" class="ml-4 text-white/80 hover:text-white">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Handle close button
  document.getElementById('notification-close').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('animate-slide-out');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
};

// Check for PWA installability
export const checkInstallability = () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button or notification
    showInstallPrompt(deferredPrompt);
  });

  // Check if already installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallPrompt();
  });
};

// Show install prompt
const showInstallPrompt = (deferredPrompt) => {
  const installButton = document.createElement('button');
  installButton.className = 'fixed bottom-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors';
  installButton.innerHTML = `
    <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
    </svg>
    Install App
  `;

  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      deferredPrompt = null;
      hideInstallPrompt();
    }
  });

  document.body.appendChild(installButton);

  // Store reference for hiding
  installButton.id = 'pwa-install-button';
};

// Hide install prompt
const hideInstallPrompt = () => {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.remove();
  }
};

// Get PWA status
export const getPWAStatus = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = window.navigator.standalone === true;

  return {
    isInstalled: isStandalone || isInWebAppiOS,
    canInstall: 'beforeinstallprompt' in window,
    isOfflineCapable: 'serviceWorker' in navigator && 'caches' in window
  };
};

// Unregister service worker (for development)
export const unregister = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
};

export default {
  register,
  unregister,
  checkInstallability,
  getPWAStatus,
  showNotification
};