(() => {
  'use strict';
  if (window.FranyelisMeasurement) return;

  const SCRIPT_ID = 'franyelis-google-tag';
  const PAGE_LOCATION = 'https://www.creacionesfranyelis.com/';
  const PAGE_TITLE = 'Curso El Rey de la Navidad | Creaciones Franyelis';
  const COURSE_ID = 'el-rey-de-la-navidad-2026';
  const config = window.FranyelisMeasurementConfig || {};
  const ga4 = config.ga4 || {}, ads = config.ads || {};
  const gaId = typeof ga4.measurementId === 'string' ? ga4.measurementId : '';
  const adsId = typeof ads.conversionId === 'string' ? ads.conversionId : '';
  const adsLabel = typeof ads.whatsappConversionLabel === 'string' ? ads.whatsappConversionLabel : '';
  const gaConfigured = ga4.enabled === true && ga4.prerequisitesReviewed === true && /^G-[A-Z0-9]{4,20}$/.test(gaId);
  const adsConfigured = ads.enabled === true && ads.prerequisitesReviewed === true && /^AW-[0-9]{6,20}$/.test(adsId) && /^[A-Za-z0-9_-]{4,100}$/.test(adsLabel);
  const allowedHost = Array.isArray(config.allowedHosts) && config.allowedHosts.includes(window.location.hostname);
  const allowedPage = () => allowedHost && window.location.protocol === 'https:' && document.body?.dataset.page === 'course';
  const denied = () => ({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  const pageEvents = new Set();
  const actions = new WeakSet();
  let tagRequested = false, retired = false, failed = false, gaStarted = false, adsStarted = false;
  let initialized = false, consent, current = denied();
  let previous = { analytics: false, marketing: false };
  let queue, gtag;

  const has = category => {
    try { return consent?.has(category) === true; } catch (_) { return false; }
  };
  const permissions = () => ({ analytics: has('analytics'), marketing: has('marketing') });
  const consentState = () => {
    const permission = permissions();
    return {
      analytics_storage: permission.analytics && gaConfigured ? 'granted' : 'denied',
      ad_storage: permission.marketing && adsConfigured ? 'granted' : 'denied',
      ad_user_data: permission.marketing && adsConfigured ? 'granted' : 'denied',
      // No personalized advertising or remarketing is approved in this integration.
      ad_personalization: 'denied'
    };
  };
  const command = (...args) => {
    if (!gtag) return false;
    try { gtag(...args); return true; } catch (_) { return false; }
  };
  const pageData = () => ({ page_location: PAGE_LOCATION, page_referrer: '', page_title: PAGE_TITLE, course_id: COURSE_ID });
  const clearGoogleCookies = category => {
    let names;
    try { names = document.cookie.split(';').map(value => value.split('=')[0].trim()); } catch (_) { return; }
    const host = window.location.hostname;
    const domains = ['', host];
    if (host.split('.').length > 2) domains.push(host.split('.').slice(1).join('.'));
    names.filter(name => category === 'analytics' ? /^_ga(?:_|$)/.test(name) : /^_gcl_/.test(name)).forEach(name => {
      [...new Set(domains)].forEach(domain => {
        try { document.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax; Secure'; }
        catch (_) { /* Inaccessible cookies cannot be cleared by this page. */ }
      });
    });
  };
  const stop = () => {
    retired = true;
    if (gaId) window['ga-disable-' + gaId] = true;
    // Discard authorized events that were still pending when permission was withdrawn.
    if (queue) queue.length = 0;
    current = denied();
    command('consent', 'update', current);
    document.getElementById(SCRIPT_ID)?.remove();
    // consent.js performs a safe reload after persisting the withdrawal. Removing a
    // script element alone cannot uninstall provider code that has already executed.
  };
  const canAnalytics = () => allowedPage() && !retired && !failed && gaConfigured && has('analytics') && gaStarted;
  const canAds = () => allowedPage() && !retired && !failed && adsConfigured && has('marketing') && adsStarted;
  const sendAnalytics = (name, extra) => {
    if (!canAnalytics()) return false;
    return command('event', name, { ...pageData(), ...extra, send_to: gaId });
  };
  const initialEvents = () => {
    if (!canAnalytics()) return;
    ['page_view', 'view_course'].forEach(name => {
      if (!pageEvents.has(name) && sendAnalytics(name, {})) pageEvents.add(name);
    });
  };
  const configureDestinations = () => {
    if (gaConfigured && has('analytics') && !gaStarted) {
      gaStarted = true;
      window['ga-disable-' + gaId] = false;
      command('config', gaId, {
        ...pageData(), send_page_view: false, groups: 'franyelis_analytics', ignore_referrer: true,
        allow_google_signals: false, allow_ad_personalization_signals: false
      });
    }
    if (adsConfigured && has('marketing') && !adsStarted) {
      adsStarted = true;
      command('config', adsId, {
        ...pageData(), send_page_view: false, groups: 'franyelis_ads', allow_ad_personalization_signals: false
      });
    }
    initialEvents();
  };
  const start = () => {
    if (!gtag || !allowedPage() || retired || failed) return;
    const permittedId = gaConfigured && has('analytics') ? gaId : adsConfigured && has('marketing') ? adsId : '';
    if (!permittedId) return;
    if (!tagRequested) {
      tagRequested = true;
      command('js', new Date());
      configureDestinations();
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(permittedId);
      script.onerror = () => {
        failed = true;
        if (queue) queue.length = 0;
        script.remove();
      };
      document.head.appendChild(script);
    } else configureDestinations();
  };
  const sync = () => {
    const permission = permissions();
    const withdrewAnalytics = previous.analytics && !permission.analytics;
    const withdrewMarketing = previous.marketing && !permission.marketing;
    if (withdrewAnalytics) clearGoogleCookies('analytics');
    if (withdrewMarketing) clearGoogleCookies('marketing');
    if (tagRequested && (withdrewAnalytics || withdrewMarketing)) stop();
    previous = permission;
    if (retired) return;
    const next = consentState();
    if (Object.keys(next).some(key => next[key] !== current[key])) {
      current = next;
      command('consent', 'update', current);
    }
    start();
  };
  const track = (name, parameters = {}, action) => {
    if (!gtag || !['whatsapp_click', 'directions_click'].includes(name) || !action || action.isTrusted !== true || action.defaultPrevented || actions.has(action)) return false;
    sync();
    if (!canAnalytics() && !(name === 'whatsapp_click' && canAds())) return false;
    // Only this small enumeration leaves the page; href, message, free text, user
    // details and arbitrary caller parameters are never forwarded to Google.
    let source = 'other';
    try {
      if (['hero', 'offer', 'ebook', 'final', 'floating', 'faq', 'footer', 'consult', 'workshop-map'].includes(parameters.source)) source = parameters.source;
    } catch (_) { /* Use a neutral source for malformed input. */ }
    actions.add(action);
    let sent = sendAnalytics(name, { source });
    if (name === 'whatsapp_click' && canAds()) {
      sent = command('event', 'conversion', { ...pageData(), send_to: adsId + '/' + adsLabel }) || sent;
    }
    return sent;
  };
  window.FranyelisMeasurement = Object.freeze({
    track,
    hasLoaded: () => tagRequested,
    getConsentState: () => Object.freeze({ ...current }),
    getStatus: () => Object.freeze({ ga4Configured: gaConfigured, adsConfigured, tagRequested, retired, failed, allowedPage: allowedPage() })
  });

  const init = () => {
    if (initialized) return;
    initialized = true;
    consent = window.FranyelisConsent;
    if (!consent || typeof consent.has !== 'function' || typeof consent.subscribe !== 'function' || document.body?.dataset.page !== 'course') return;
    // Do not adopt an unrelated tag manager, queue or tracker. That would defeat
    // the destination and consent guarantees of this deliberately small setup.
    if (window.gtag || window.dataLayer) return;
    queue = [];
    window.dataLayer = queue;
    gtag = function () { queue.push(arguments); };
    window.gtag = gtag;
    command('consent', 'default', denied());
    command('set', {
      ...pageData(), allow_google_signals: false, allow_ad_personalization_signals: false,
      ads_data_redaction: true, url_passthrough: false
    });
    consent.subscribe(sync);
    const onDirectionsClick = event => {
      if (!event.isTrusted || event.defaultPrevented || (event.type === 'click' ? event.button !== 0 : event.button !== 1)) return;
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      const link = target?.closest('a[data-measurement="directions"]');
      if (link) track('directions_click', { source: 'workshop-map' }, event);
    };
    document.addEventListener('click', onDirectionsClick);
    document.addEventListener('auxclick', onDirectionsClick);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
