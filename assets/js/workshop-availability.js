(() => {
  'use strict';

  const section = document.getElementById('workshop-availability');
  if (!section || section.dataset.availabilityInitialized === 'true') return;
  section.dataset.availabilityInitialized = 'true';

  const CAPACITY = 15;
  const DATE = '2026-10-24';
  const ALLOWED_KEYS = [
    'schemaVersion', 'workshopDate', 'timeZone', 'capacity',
    'status', 'confirmedReservations', 'verifiedAt'
  ];
  const DEFAULT_NOTE = 'Tu reserva se confirma cuando Almerida Shop SpA verifica el abono y te envía la confirmación por WhatsApp.';
  const title = section.querySelector('#availability-title');
  const note = section.querySelector('[data-availability-note]');
  const counts = section.querySelector('[data-availability-counts]');
  const progress = section.querySelector('[data-availability-progress]');
  const updated = section.querySelector('[data-availability-updated]');
  const heroSummary = document.querySelector('[data-availability-summary]');

  // Only aggregate, explicitly reconciled numbers can enable the counter.
  function validate(data, now = Date.now()) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const keys = Object.keys(data);
    if (keys.length !== ALLOWED_KEYS.length || keys.some(key => !ALLOWED_KEYS.includes(key))) return null;
    if (data.schemaVersion !== 1 || data.workshopDate !== DATE || data.timeZone !== 'America/Santiago' || data.capacity !== CAPACITY) return null;
    if (data.status === 'unverified' && data.confirmedReservations === null && data.verifiedAt === null) return null;
    if (data.status !== 'manual_verified' || !Number.isInteger(data.confirmedReservations) || data.confirmedReservations < 0 || data.confirmedReservations > CAPACITY) return null;
    if (typeof data.verifiedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.verifiedAt)) return null;
    const checkedAt = Date.parse(data.verifiedAt);
    if (!Number.isFinite(checkedAt) || new Date(checkedAt).toISOString() !== data.verifiedAt || checkedAt > now) return null;
    return { confirmed: data.confirmedReservations, remaining: CAPACITY - data.confirmedReservations, checkedAt };
  }

  function fallback() {
    if (heroSummary) heroSummary.textContent = '¡Habilitamos solo 15 cupos!';
    if (title) title.textContent = '15 cupos habilitados';
    if (note) note.textContent = DEFAULT_NOTE;
    if (counts) counts.hidden = true;
    if (progress) progress.hidden = true;
    if (updated) updated.hidden = true;
  }

  function closeReservations() {
    const message = 'Hola, veo que la jornada de Pan de Jamón venezolano del sábado 24 de octubre de 2026 está completa. Quisiera información sobre próximas jornadas. ¿Me pueden orientar?';
    const href = 'https://wa.me/56933193773?text=' + encodeURIComponent(message);
    document.querySelectorAll('a[href]').forEach(link => {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.protocol !== 'https:' || url.hostname !== 'wa.me' || url.pathname !== '/56933193773') return;
        link.href = href;
        if (!link.hasAttribute('data-reservation-cta')) return;
        link.dataset.reservationState = 'sold_out';
        const label = link.querySelector('[data-cta-label]');
        if (label) label.textContent = 'Consultar próximas jornadas';
        else link.textContent = 'Consultar próximas jornadas';
        if (link.hasAttribute('aria-label')) link.setAttribute('aria-label', 'Consultar próximas jornadas por WhatsApp; el 24 de octubre está completo');
      } catch (_) {
        // An unrelated or invalid link cannot affect availability.
      }
    });
  }

  function render(state) {
    if (!state) return;
    if (heroSummary) heroSummary.textContent = state.remaining === 0
      ? '24 de octubre — ¡Cupos completos!'
      : state.confirmed + ' reservas confirmadas · ' + state.remaining + ' cupos restantes';
    if (title) title.textContent = state.remaining === 0 ? '24 de octubre — ¡Cupos completos!' : 'Disponibilidad de la nueva jornada';
    if (note) note.textContent = state.remaining === 0
      ? 'Las 15 reservas de esta jornada están confirmadas. Escríbenos para consultar próximas fechas.'
      : DEFAULT_NOTE;
    const values = [
      ['[data-availability-capacity]', CAPACITY],
      ['[data-availability-confirmed]', state.confirmed],
      ['[data-availability-remaining]', state.remaining]
    ];
    values.forEach(([selector, value]) => {
      const node = section.querySelector(selector);
      if (node) node.textContent = String(value);
    });
    if (counts) counts.hidden = false;
    if (progress) {
      progress.setAttribute('aria-valuenow', String(state.confirmed));
      progress.setAttribute('aria-valuetext', state.confirmed + ' reservas confirmadas de 15; ' + state.remaining + ' cupos restantes');
      const fill = progress.querySelector('span');
      if (fill) fill.style.width = (state.confirmed / CAPACITY * 100) + '%';
      progress.hidden = false;
    }
    if (updated) {
      const checked = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(state.checkedAt));
      updated.textContent = 'Última comprobación manual: ' + checked + ' (hora de Santiago). La disponibilidad se confirma por WhatsApp.';
      updated.hidden = false;
    }
    if (state.remaining === 0) closeReservations();
  }

  fallback();
  // This read-only public file contains no participant data or tracking identifiers.
  const source = new URL('/content/workshop-availability.json', window.location.origin);
  if (source.origin !== window.location.origin || !/^https?:$/.test(source.protocol)) return;
  fetch(source.href, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(response => response.ok ? response.text() : Promise.reject(new Error('Availability unavailable')))
    .then(text => {
      if (text.length > 2048) throw new Error('Invalid availability size');
      render(validate(JSON.parse(text)));
    })
    .catch(() => { /* Static capacity remains available without an unverified sales count. */ });
})();
