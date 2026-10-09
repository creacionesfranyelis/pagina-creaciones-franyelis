(() => {
  'use strict';
  if (window.FranyelisConsent) return;

  const KEY = 'franyelis_consent_v1';
  // Revision 2 adds analytics and future Google Ads purposes. Old choices are
  // requested again; a Meta-only acceptance is never expanded automatically.
  const VERSION = 2;
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const PIXEL_ID = '2596910080758723';
  const PIXEL_SCRIPT_ID = 'franyelis-meta-pixel';
  const listeners = new Set();
  const own = (value, name) => Object.prototype.hasOwnProperty.call(value, name);
  const empty = () => ({ version: VERSION, timestamp: null, necessary: true, analytics: false, marketing: false, externalMap: false });
  let state = empty();
  let decided = false;
  let pixelStarted = false;
  let blocked = false;
  let reloading = false;
  let expiryTimer;
  const sentPageEvents = new Set();
  let banner, dialog, analyticsInput, marketingInput, mapInput, notice, returnFocus;
  const googleLoaded = () => window.FranyelisMeasurement?.hasLoaded?.() === true;
  const needsReload = (analyticsWithdrawn, marketingWithdrawn) => (marketingWithdrawn && pixelStarted) || ((analyticsWithdrawn || marketingWithdrawn) && googleLoaded());

  const getStorage = type => {
    try { return window[type]; } catch (_) { return null; }
  };
  const parse = raw => {
    if (typeof raw !== 'string' || raw.length > 1000) return null;
    try {
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const keys = ['version', 'timestamp', 'necessary', 'analytics', 'marketing', 'externalMap'];
      if (Object.keys(value).length !== keys.length || !keys.every(key => own(value, key))) return null;
      if (value.version !== VERSION || value.necessary !== true || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean' || typeof value.externalMap !== 'boolean') return null;
      if (!Number.isSafeInteger(value.timestamp) || value.timestamp < 0 || value.timestamp > Date.now() || Date.now() - value.timestamp >= MAX_AGE) return null;
      return { version: VERSION, timestamp: value.timestamp, necessary: true, analytics: value.analytics, marketing: value.marketing, externalMap: value.externalMap };
    } catch (_) { return null; }
  };
  const readStorage = type => {
    try { return parse(getStorage(type)?.getItem(KEY)); } catch (_) { return null; }
  };
  const snapshot = () => Object.freeze({ ...state });
  const notify = () => {
    const preferences = snapshot();
    listeners.forEach(listener => { try { listener(preferences); } catch (_) { /* One integration must not interrupt the others. */ } });
    try { window.dispatchEvent(new CustomEvent('franyelis:consentchange', { detail: preferences })); } catch (_) { /* Preferences remain effective without a public hook. */ }
  };
  const isCourse = () => document.body?.dataset.page === 'course';
  const isAllowed = category => {
    if (category === 'necessary') return true;
    if (!['analytics', 'marketing', 'externalMap'].includes(category) || state.timestamp === null || Date.now() - state.timestamp >= MAX_AGE || state[category] !== true) return false;
    return category === 'externalMap' || (!reloading && (category === 'analytics' || !blocked));
  };

  // This is the only place that creates Meta's queue or makes a Meta request.
  const startPixel = () => {
    if (pixelStarted || !isCourse() || !isAllowed('marketing')) return;
    pixelStarted = true;
    try {
      if (typeof window.fbq !== 'function') {
        const fbq = function () {
          const revoke = arguments[0] === 'consent' && arguments[1] === 'revoke';
          if (!revoke && (blocked || reloading || !isAllowed('marketing'))) return;
          if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
          else fbq.queue.push(arguments);
        };
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = '2.0';
        fbq.queue = [];
        window.fbq = fbq;
        window._fbq = fbq;
      }
      window.fbq('consent', 'grant');
      window.fbq('init', PIXEL_ID);
      window.fbq('track', 'PageView');
      sentPageEvents.add('PageView');
      window.fbq('track', 'ViewContent', {
        content_name: 'El Rey de la Navidad', content_category: 'Curso Navideño', value: 95000, currency: 'CLP'
      });
      sentPageEvents.add('ViewContent');
      const script = document.createElement('script');
      script.id = PIXEL_SCRIPT_ID;
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    } catch (_) { /* A failed or blocked tracker must not affect the course. */ }
  };
  const clearMetaCookies = () => {
    let present;
    try { present = new Set(document.cookie.split(';').map(cookie => cookie.split('=')[0].trim())); }
    catch (_) { return; }
    const host = window.location.hostname;
    const parts = host.split('.');
    const domains = ['', host];
    if (parts.length > 2) domains.push(parts.slice(1).join('.'));
    ['_fbp', '_fbc'].forEach(name => {
      if (!present.has(name)) return;
      [...new Set(domains)].forEach(domain => {
        try {
          document.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax' + (window.location.protocol === 'https:' ? '; Secure' : '');
        } catch (_) { /* Browser restrictions may prevent deletion; no new events are permitted. */ }
      });
    });
  };
  const stopPixel = () => {
    blocked = true;
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('consent', 'revoke');
        if (Array.isArray(window.fbq.queue)) window.fbq.queue.length = 0;
      }
    } catch (_) { /* Continue removing owned resources even if Meta fails. */ }
    document.getElementById(PIXEL_SCRIPT_ID)?.remove();
    clearMetaCookies();
  };
  const persist = value => {
    const raw = JSON.stringify(value);
    try {
      const local = getStorage('localStorage');
      local.setItem(KEY, raw);
      if (local.getItem(KEY) !== raw) throw new Error('Storage did not retain preferences');
      try { getStorage('sessionStorage')?.removeItem(KEY); } catch (_) { /* A newer local choice wins when session storage is unavailable. */ }
      return { durable: true, reloadSafe: true };
    } catch (_) {
      // A session fallback uses the same necessary preference key, never a marketing identifier.
      try {
        const session = getStorage('sessionStorage');
        session.setItem(KEY, raw);
        if (session.getItem(KEY) === raw) return { durable: false, reloadSafe: true };
      } catch (_) { /* Keep the choice effective in memory. */ }
      let reloadSafe = false;
      try {
        const local = getStorage('localStorage');
        local?.removeItem(KEY);
      } catch (_) { /* Check both fallback stores before allowing a reload. */ }
      try { getStorage('sessionStorage')?.removeItem(KEY); } catch (_) { /* A stale session grant must not be recovered on reload. */ }
      const saved = [readStorage('localStorage'), readStorage('sessionStorage')];
      reloadSafe = saved.every(record => !record?.marketing && !record?.analytics);
      return { durable: false, reloadSafe };
    }
  };
  const hideBanner = () => {
    if (banner?.contains(document.activeElement)) document.querySelector('main')?.focus({ preventScroll: true });
    if (banner) banner.hidden = true;
    document.body?.classList.remove('consent-banner-open');
  };
  const closeSettings = () => {
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({ preventScroll: true });
    else document.querySelector('main')?.focus({ preventScroll: true });
  };
  const scheduleExpiry = () => {
    clearTimeout(expiryTimer);
    if (state.timestamp === null) return;
    const remaining = MAX_AGE - (Date.now() - state.timestamp);
    expiryTimer = setTimeout(() => {
      if (state.timestamp !== null && Date.now() - state.timestamp >= MAX_AGE) {
        const hadMarketing = state.marketing;
        const reload = needsReload(state.analytics, hadMarketing);
        state = empty();
        decided = false;
        if (hadMarketing) stopPixel();
        if (banner) { banner.hidden = false; document.body.classList.add('consent-banner-open'); }
        notify();
        if (reload) {
          reloading = true;
          try { window.location.reload(); } catch (_) { /* Consent remains revoked until renewal. */ }
        }
      } else scheduleExpiry();
    }, Math.max(1, Math.min(remaining, 2147483647)));
  };
  const update = preferences => {
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences) || ['__proto__', 'constructor', 'prototype'].some(key => own(preferences, key))) return snapshot();
    // A partial choice can preserve only permissions that are still valid.
    let analytics = isAllowed('analytics'), marketing = isAllowed('marketing'), externalMap = isAllowed('externalMap');
    try {
      if (own(preferences, 'analytics')) {
        if (typeof preferences.analytics !== 'boolean') return snapshot();
        analytics = preferences.analytics;
      }
      if (own(preferences, 'marketing')) {
        if (typeof preferences.marketing !== 'boolean') return snapshot();
        marketing = preferences.marketing;
      }
      if (own(preferences, 'externalMap')) {
        if (typeof preferences.externalMap !== 'boolean') return snapshot();
        externalMap = preferences.externalMap;
      }
    } catch (_) { return snapshot(); }
    const withdrawing = state.marketing && !marketing;
    const reload = needsReload(state.analytics && !analytics, withdrawing);
    state = { version: VERSION, timestamp: Date.now(), necessary: true, analytics, marketing, externalMap };
    decided = true;
    if (withdrawing) stopPixel();
    else if (!marketing) clearMetaCookies();
    const stored = persist(state);
    hideBanner();
    closeSettings();
    notify();
    scheduleExpiry();
    if (reload) {
      if (stored.reloadSafe) {
        // Reload destroys already executed third-party code, preserving this location.
        reloading = true;
        try { window.location.reload(); } catch (_) { /* The gate stays closed if navigation is unavailable. */ }
      } else if (notice) {
        notice.textContent = 'Se bloqueó el envío de nuevos eventos de esta web. El navegador no pudo guardar la retirada. Cierra esta pestaña y elimina los datos de este sitio desde los controles del navegador antes de volver a visitarlo.';
      }
    } else {
      if (!pixelStarted) blocked = false;
      startPixel();
      if (!stored.durable && notice) notice.textContent = 'Estas preferencias se aplican ahora. Si el navegador no permite guardarlas, volveremos a solicitarlas en otra visita.';
    }
    return snapshot();
  };
  const openSettings = category => {
    if (!dialog) return;
    returnFocus = document.activeElement;
    analyticsInput.checked = isAllowed('analytics');
    marketingInput.checked = isAllowed('marketing');
    mapInput.checked = isAllowed('externalMap');
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.setAttribute('open', ''); dialog.setAttribute('aria-modal', 'true'); }
    }
    (category === 'externalMap' ? mapInput : category === 'analytics' ? analyticsInput : dialog.querySelector('[data-consent-close]')).focus();
  };
  const track = (method, event, parameters) => {
    if (!isCourse() || !isAllowed('marketing') || !['track', 'trackCustom'].includes(method)) return false;
    const standard = ['PageView', 'ViewContent', 'Contact'];
    const custom = ['WhatsAppClick', 'ShareCourse', 'CopyCourseLink'];
    if (!(method === 'track' ? standard : custom).includes(event)) return false;
    startPixel();
    if (sentPageEvents.has(event) || typeof window.fbq !== 'function') return false;
    try { window.fbq(method, event, parameters); return true; } catch (_) { return false; }
  };
  const subscribe = listener => {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    try { listener(snapshot()); } catch (_) { /* Subscription remains active for subsequent changes. */ }
    return () => listeners.delete(listener);
  };
  window.FranyelisConsent = Object.freeze({
    getPreferences: snapshot, preferences: snapshot, has: isAllowed, track, update, subscribe,
    openSettings, openPreferences: openSettings, requestExternalMap: () => openSettings('externalMap'),
    revoke: category => update(category === 'analytics' ? { analytics: false } : category === 'marketing' ? { marketing: false } : category === 'externalMap' ? { externalMap: false } : { analytics: false, marketing: false, externalMap: false }),
    acceptAll: () => update({ analytics: true, marketing: true, externalMap: true }),
    rejectOptional: () => update({ analytics: false, marketing: false, externalMap: false })
  });

  const initUI = () => {
    const container = document.createElement('div');
    container.className = 'consent-ui';
    container.innerHTML = `
      <aside class="consent-banner" aria-labelledby="consent-banner-title" hidden>
        <button class="consent-dismiss" type="button" data-consent-dismiss aria-label="Ocultar aviso sin aceptar cookies">×</button>
        <div class="consent-banner-copy"><h2 id="consent-banner-title">Tu privacidad, tu elección</h2>
          <p>Elige por separado analítica y marketing. Google Analytics requiere analítica; Meta Pixel requiere marketing. Google Ads sigue sin activar. El mapa se carga solo cuando lo solicitas. <a href="/politica-de-cookies/">Conoce nuestra política de cookies</a>.</p></div>
        <div class="consent-actions"><button type="button" data-consent-accept>Aceptar todas</button><button type="button" data-consent-reject>Rechazar opcionales</button><button type="button" data-consent-configure>Configurar preferencias</button></div>
      </aside>
      <dialog class="consent-dialog" aria-labelledby="consent-settings-title" aria-describedby="consent-settings-description">
        <button class="consent-dismiss" type="button" data-consent-close aria-label="Cerrar preferencias sin guardar">×</button>
        <h2 id="consent-settings-title">Configurar cookies</h2><p id="consent-settings-description">Las opciones son voluntarias. Puedes cambiarlas aquí en cualquier momento. Recordamos tu elección durante 180 días.</p>
        <form class="consent-form">
          <div class="consent-choice consent-choice--necessary"><div><strong>Necesarias</strong><p>Recuerdan tus preferencias y permiten el funcionamiento básico de la web.</p></div><span>Siempre activas</span></div>
          <label class="consent-choice" for="consent-analytics"><div><strong>Analítica · Google Analytics 4</strong><p>Permite medir visitas y acciones del curso en el dominio oficial mediante GA4, solo si aceptas. Puedes aceptar analítica y rechazar marketing.</p></div><input id="consent-analytics" type="checkbox" name="analytics"></label>
          <label class="consent-choice" for="consent-marketing"><div><strong>Marketing · Meta y Google Ads</strong><p>Permite medir visitas y acciones mediante Meta Pixel en la landing. Google Ads está preparado, todavía sin activar. Esta elección no autoriza promociones por WhatsApp.</p></div><input id="consent-marketing" type="checkbox" name="marketing"></label>
          <label class="consent-choice" for="consent-external-map"><div><strong>Mapa externo · Google Maps</strong><p>Permite cargar el mapa integrado cuando solicites el mapa. Puedes obtener indicaciones con el enlace externo sin activar esta opción.</p></div><input id="consent-external-map" type="checkbox" name="externalMap"></label>
          <p class="consent-policy-links"><a href="/politica-de-privacidad/">Política de Privacidad</a><span aria-hidden="true"> · </span><a href="/politica-de-cookies/">Política de Cookies</a></p>
          <button class="consent-save" type="submit">Guardar preferencias</button>
          <div class="consent-actions consent-actions--dialog"><button type="button" data-consent-accept>Aceptar todas</button><button type="button" data-consent-reject>Rechazar opcionales</button></div>
        </form>
      </dialog><p class="consent-notice" role="status" aria-live="polite"></p>`;
    document.body.appendChild(container);
    banner = container.querySelector('.consent-banner');
    dialog = container.querySelector('.consent-dialog');
    analyticsInput = container.querySelector('#consent-analytics');
    marketingInput = container.querySelector('#consent-marketing');
    mapInput = container.querySelector('#consent-external-map');
    notice = container.querySelector('.consent-notice');
    container.querySelectorAll('[data-consent-accept]').forEach(button => button.addEventListener('click', () => update({ analytics: true, marketing: true, externalMap: true })));
    container.querySelectorAll('[data-consent-reject]').forEach(button => button.addEventListener('click', () => update({ analytics: false, marketing: false, externalMap: false })));
    container.querySelector('[data-consent-configure]').addEventListener('click', () => openSettings());
    container.querySelector('[data-consent-dismiss]').addEventListener('click', hideBanner);
    dialog.querySelector('[data-consent-close]').addEventListener('click', closeSettings);
    dialog.querySelector('form').addEventListener('submit', event => { event.preventDefault(); update({ analytics: analyticsInput.checked, marketing: marketingInput.checked, externalMap: mapInput.checked }); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
    dialog.addEventListener('close', () => {
      if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({ preventScroll: true });
      else document.querySelector('main')?.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); closeSettings(); return; }
      if (event.key !== 'Tab') return;
      const focusables = [...dialog.querySelectorAll('button, input, a[href]')].filter(element => !element.disabled);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.addEventListener('click', event => {
      const target = event.target.closest?.('[data-cookie-settings]');
      if (target) { event.preventDefault(); openSettings(); }
    });
    if (!decided) { banner.hidden = false; document.body.classList.add('consent-banner-open'); }
  };
  const boot = () => {
    // Prefer the newer session fallback over an old local acceptance after a failed write.
    const local = readStorage('localStorage'), session = readStorage('sessionStorage');
    let saved = session && (!local || session.timestamp > local.timestamp) ? session : local;
    if (session && local && session.timestamp === local.timestamp) saved = { ...local, analytics: local.analytics && session.analytics, marketing: local.marketing && session.marketing, externalMap: local.externalMap && session.externalMap };
    if (saved) { state = saved; decided = true; }
    initUI();
    startPixel();
    notify();
    scheduleExpiry();
  };
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    let incoming = event.key === null ? null : parse(event.newValue);
    let synchronized = null;
    if (incoming && state.timestamp !== null && incoming.timestamp <= state.timestamp) {
      // A delayed or simultaneous record may withdraw a permission, never grant one.
      const analytics = state.analytics && incoming.analytics;
      const marketing = state.marketing && incoming.marketing;
      const externalMap = state.externalMap && incoming.externalMap;
      if (analytics === state.analytics && marketing === state.marketing && externalMap === state.externalMap) {
        if (incoming.timestamp !== state.timestamp || incoming.analytics !== state.analytics || incoming.marketing !== state.marketing || incoming.externalMap !== state.externalMap) {
          const restored = persist(state);
          if (!restored.reloadSafe && notice) {
            notice.textContent = 'Tus preferencias siguen vigentes en esta pestaña, pero el navegador no pudo guardarlas. Cierra esta pestaña y elimina los datos de este sitio desde los controles del navegador antes de volver a visitarlo para evitar recuperar una elección anterior.';
          }
        }
        return;
      }
      incoming = { ...state, analytics, marketing, externalMap };
      // Keep the conservative result on reload without renewing the latest choice.
      synchronized = persist(incoming);
    }
    const withdrawing = state.marketing && !incoming?.marketing;
    const reload = needsReload(state.analytics && !incoming?.analytics, withdrawing);
    state = incoming || empty();
    decided = !!incoming;
    if (withdrawing) stopPixel();
    if (dialog?.open) { analyticsInput.checked = isAllowed('analytics'); marketingInput.checked = isAllowed('marketing'); mapInput.checked = isAllowed('externalMap'); }
    if (decided) hideBanner();
    else if (banner) { banner.hidden = false; document.body.classList.add('consent-banner-open'); }
    notify();
    scheduleExpiry();
    if (reload) {
      // A removed/invalid record can otherwise leave an older session grant.
      // Keep an explicit denial safely before destroying executed vendor code.
      const stored = synchronized || persist({ ...state, timestamp: state.timestamp ?? Date.now() });
      if (stored.reloadSafe) {
        reloading = true;
        try { window.location.reload(); } catch (_) { /* Keep the revoked state in memory. */ }
      } else if (notice) {
        notice.textContent = 'Se bloqueó el envío de nuevos eventos de esta web. El navegador no pudo guardar la retirada. Cierra esta pestaña y elimina los datos de este sitio desde los controles del navegador antes de volver a visitarlo.';
      }
    } else { if (!pixelStarted) blocked = false; startPixel(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
