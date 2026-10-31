/* Installable button designer for Android, iPhone/iPad, Windows, macOS and ChromeOS. */
(() => {
  'use strict';
  const button = document.getElementById('installApp');
  if (!button) return;
  const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isInstalled()) { button.hidden = true; return; }
  let deferredPrompt = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'install-help';
  dialog.setAttribute('aria-labelledby', 'install-help-title');
  dialog.innerHTML = '<div class="install-help-inner"><div class="install-help-head"><h2 id="install-help-title">Install Button Studio</h2><button type="button" class="install-help-close" aria-label="Close installation instructions">✕</button></div><p id="install-help-details"></p><p class="install-help-note">The app opens from your home screen or desktop. Your designs stay on this device unless you export them.</p><button type="button" class="btn primary" id="install-help-done">Got it</button></div>';
  document.body.append(dialog);
  dialog.querySelector('.install-help-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('#install-help-done').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  function instructions() {
    const ua = navigator.userAgent;
    const appleMobile = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (appleMobile) return 'In Safari, tap Share (the square with an upward arrow), choose Add to Home Screen, then tap Add. If you opened this inside another app, first open the site in Safari.';
    if (/Android/i.test(ua)) return 'In Chrome, tap the three-dot menu, then Add to Home screen or Install app. Confirm Install. If you are using another in-app browser, open this page in Chrome.';
    if (/Edg\//i.test(ua)) return 'In Microsoft Edge, open the three-dot menu, choose Apps, then Install this site as an app.';
    if (/Chrome|Chromium/i.test(ua)) return 'In Chrome, click the Install icon in the address bar, or open the three-dot menu and choose Cast, save, and share → Install page as app (wording varies by version).';
    if (/Macintosh/i.test(ua)) return 'In Safari on macOS, choose File → Add to Dock. In Chrome or Edge, use the browser Install option.';
    return 'Open this page in Chrome or Edge and use the browser menu to install it. On iPhone or iPad, use Safari → Share → Add to Home Screen.';
  }
  function showGuide() {
    dialog.querySelector('#install-help-details').textContent = instructions();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.alert(instructions());
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    button.textContent = '⬇ Install app';
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.hidden = true;
  });
  button.addEventListener('click', async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      try { await prompt.prompt(); await prompt.userChoice; }
      catch (error) { showGuide(); }
    } else showGuide();
  });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    const workerURL = document.body.dataset.studioEdition === 'general' ? '../service-worker.js' : './service-worker.js';
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(workerURL)
        .catch(err => console.warn('Offline app registration unavailable:', err));
    });
  }
})();