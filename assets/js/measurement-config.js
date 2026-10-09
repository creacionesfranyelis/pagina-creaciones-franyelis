(() => {
  'use strict';
  // GA4 stream/tag privacy settings reviewed on 2026-10-09; see docs/measurement-setup.md.
  // Each enabled destination still requires its consent category. Ads awaits real IDs.
  window.FranyelisMeasurementConfig = Object.freeze({
    allowedHosts: Object.freeze(['www.creacionesfranyelis.com', 'creacionesfranyelis.com']),
    ga4: Object.freeze({ enabled: true, prerequisitesReviewed: true, measurementId: 'G-QTSNJPFR93' }),
    ads: Object.freeze({ enabled: false, prerequisitesReviewed: false, conversionId: '', whatsappConversionLabel: '' })
  });
})();
