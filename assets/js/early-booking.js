(() => {
  'use strict';
  // The 24 October workshop has its own approved price and bonuses.
  // The former 18 October promotion must neither hide them nor rewrite its CTAs.
  window.FranyelisEarlyBooking = Object.freeze({ isActive: () => false, sync: () => {} });
})();
