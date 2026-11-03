/* Privacy-conscious, opt-in logo-usage analytics.
 * To enable aggregated counts, paste the Umami Website ID below.
 * No student identity, files, text, or designs are sent.
 */
(function () {
  'use strict';

  // Obtain from your Umami website's tracking-code settings.
  const UMAMI_WEBSITE_ID = 'b7b12dc9-cd5c-4465-b28c-58961dc1914d';

  const pending = [];
  let ready = false;
  const categories = new Set(['Robotics Teams', 'School Logos', 'FIRST Logos']);

  function send(event) {
    if (!ready || typeof window.umami?.track !== 'function') return false;
    try {
      window.umami.track('logo_used', event);
      return true;
    } catch (error) {
      // Analytics should never interrupt designing buttons.
      return false;
    }
  }

  function trackLogo({ path, category, color } = {}) {
    if (!UMAMI_WEBSITE_ID || !categories.has(category)) return;
    // Only preapproved repository logos, never student uploads or project text.
    if (typeof path !== 'string' || !/^logos\/[a-z0-9_./-]{1,160}$/i.test(path) || path.includes('..')) return;
    const data = { logo: path, category };
    if (category === 'Robotics Teams' && ['black', 'orange', 'white'].includes(color)) {
      data.color = color;
    }
    if (!send(data) && pending.length < 50) pending.push(data);
  }

  window.ButtonLogoAnalytics = { trackLogo };

  // With an empty website ID, the designer remains entirely untracked.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(UMAMI_WEBSITE_ID)) return;
  const script = document.createElement('script');
  script.src = 'https://cloud.umami.is/script.js';
  script.defer = true;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.autoPageview = 'false';
  script.addEventListener('load', () => {
    ready = typeof window.umami?.track === 'function';
    if (ready) pending.splice(0).forEach(send);
  });
  script.addEventListener('error', () => { pending.length = 0; });
  document.head.append(script);
})();
