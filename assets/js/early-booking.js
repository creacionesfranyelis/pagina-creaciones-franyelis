(() => {
  'use strict';
  // Manual switch. The deadline includes all of 18 October in America/Santiago.
  const ENABLED = true;
  const DEADLINE = Date.parse('2026-10-19T00:00:00-03:00');
  const root = document.documentElement;
  const isActive = () => ENABLED && Number.isFinite(Date.now()) && Date.now() < DEADLINE;
  const labels = {
    hero: 'Reservar con $30.000', mobile: 'Reservar con $30.000',
    ebook: 'Reservar mi cupo + recibir mi ebook', final: 'Reservar mi cupo por WhatsApp'
  };
  const inquiry = 'Hola, quiero información para inscribirme en el curso El Rey de la Navidad.';
  const ebookInquiry = 'Hola, quiero reservar mi cupo para el curso El Rey de la Navidad con un abono de $30.000 y recibir el ebook De tu cocina a tu negocio. ¿Me comparten los pasos y cómo confirmar mi reserva hasta el 18 de octubre?';
  let initialized = false, timer;
  const sync = () => {
    const active = isActive();
    root.classList.toggle('early-booking-active', active);
    root.dataset.earlyBookingState = active ? 'active' : 'inactive';
    document.querySelectorAll('[data-reservation-cta]').forEach(link => {
      const label = link.querySelector('[data-cta-label]');
      if (label) label.textContent = active ? labels[link.dataset.source] : 'Consultar disponibilidad';
      const message = active && link.dataset.source === 'ebook' ? ebookInquiry : inquiry;
      link.href = 'https://wa.me/56933193773?text=' + encodeURIComponent(message);
    });
    clearTimeout(timer);
    if (active && initialized) timer = setTimeout(sync, Math.min(DEADLINE - Date.now(), 3600000));
  };
  // This tiny head script sets visibility before the first paint; no late-layout swap.
  root.classList.toggle('early-booking-active', isActive());
  root.dataset.earlyBookingState = isActive() ? 'active' : 'inactive';
  window.FranyelisEarlyBooking = Object.freeze({ isActive, sync });
  const init = () => {
    initialized = true;
    sync();
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', sync);
    // Refresh both href and offer state before the existing delegated click handler.
    document.addEventListener('click', sync, true);
    document.addEventListener('auxclick', sync, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
