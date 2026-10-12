(function () {
  'use strict';

  if (document.documentElement.dataset.catalogReady === 'true') return;
  document.documentElement.dataset.catalogReady = 'true';

  const officialWhatsApp = '56933193773';
  const identifier = value => typeof value === 'string' && value.length <= 90 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : '';
  const label = value => typeof value === 'string' && value.trim().length <= 180 && !/[\u0000-\u001f\u007f<>]/.test(value) ? value.trim() : '';

  function readContext() {
    const source = document.getElementById('catalog-context');
    if (!source) return null;
    try {
      const context = JSON.parse(source.textContent);
      return context && typeof context === 'object' && !Array.isArray(context) ? context : null;
    } catch (_) {
      return null;
    }
  }

  const context = readContext();

  function eventContext(product) {
    const productId = identifier(product.productId);
    const categoryId = identifier(product.categoryId);
    const productSlug = identifier(product.productSlug);
    const pageType = identifier(context && context.pageType);
    if (!productId || !categoryId || !productSlug || !pageType) return null;
    return { page_type: pageType, product_id: productId, category_id: categoryId, product_slug: productSlug };
  }

  function emit(action, product, selection, ctaLocation) {
    const detail = eventContext(product);
    if (!detail) return;
    detail.action = action;
    if (selection && identifier(selection.variantId)) detail.variant_id = selection.variantId;
    if (selection && identifier(selection.presentationId)) detail.presentation_id = selection.presentationId;
    if (identifier(ctaLocation)) detail.cta_location = ctaLocation;
    // A local integration hook only. No analytics provider is called here.
    window.dispatchEvent(new CustomEvent('franyelis:catalog', { detail }));
  }

  function initFilter() {
    const select = document.querySelector('.catalog-filter select[name="product-type"]');
    if (!select) return;
    const wrapper = select.closest('.catalog-filter');
    const cards = [...document.querySelectorAll('.product-grid .product-card[data-product-group]')];
    const status = document.querySelector('.catalog-results-status');
    const permitted = new Set([...select.options].map(option => option.value));

    function filter() {
      const type = permitted.has(select.value) ? select.value : '';
      let count = 0;
      cards.forEach(card => {
        const visible = !type || type === 'all' || card.dataset.productGroup === type;
        card.hidden = !visible;
        if (visible) count += 1;
      });
      if (status) status.textContent = count === 1 ? '1 producto encontrado' : count + ' productos encontrados';
    }

    try {
      const values = new URLSearchParams(window.location.search).getAll('tipo');
      if (values.length === 1 && permitted.has(values[0])) select.value = values[0];
    } catch (_) {
      // The default selection remains usable if query parsing is unavailable.
    }
    if (wrapper) wrapper.hidden = false;
    select.addEventListener('change', filter);
    filter();
  }

  function initGallery() {
    const photo = document.querySelector('.product-main-photo img');
    const thumbs = [...document.querySelectorAll('.product-thumbs button[data-photo-target]')];
    if (!photo || !thumbs.length) return;

    thumbs.forEach(button => {
      button.addEventListener('click', () => {
        let target;
        try {
          target = new URL(button.dataset.photoTarget, window.location.href);
        } catch (_) {
          return;
        }
        if (target.origin !== window.location.origin || !/^\/assets\/images\/[a-z0-9][a-z0-9._-]*\.(?:webp|jpe?g|png)$/i.test(target.pathname) || target.search || target.hash) return;
        const alt = label(button.dataset.photoAlt);
        const width = Number(button.dataset.photoWidth || button.getAttribute('data-width'));
        const height = Number(button.dataset.photoHeight || button.getAttribute('data-height'));
        // Clear responsive sources so the browser displays the chosen photograph.
        const picture = photo.closest('picture');
        if (picture) picture.querySelectorAll('source').forEach(source => source.removeAttribute('srcset'));
        photo.removeAttribute('srcset');
        photo.removeAttribute('sizes');
        photo.src = target.href;
        if (alt) photo.alt = alt;
        if (Number.isInteger(width) && width > 0 && width <= 10000 && Number.isInteger(height) && height > 0 && height <= 10000) {
          photo.width = width;
          photo.height = height;
        }
        thumbs.forEach(thumb => thumb.setAttribute('aria-pressed', String(thumb === button)));
      });
    });
    const group = document.querySelector('.product-thumbs');
    if (group) group.hidden = false;
  }

  function initProduct() {
    if (!context || context.pageType !== 'product') return null;
    const product = eventContext(context);
    const productName = label(context.productName);
    if (!product || !productName || context.whatsapp !== officialWhatsApp) return null;

    const select = document.getElementById('product-option');
    const variantSelect = document.getElementById('product-variant');
    const links = [...document.querySelectorAll('a[data-product-whatsapp]')];
    const options = new Map();
    const variants = new Map();
    if (Array.isArray(context.options)) {
      context.options.forEach(option => {
        if (!option || typeof option !== 'object') return;
        const id = identifier(option.id), text = label(option.label);
        if (id && text && !options.has(id)) options.set(id, { label: text, eventId: identifier(option.presentationId) || id });
      });
    }
    if (Array.isArray(context.variants)) {
      context.variants.forEach(variant => {
        if (!variant || typeof variant !== 'object') return;
        const id = identifier(variant.id), text = label(variant.label);
        if (id && text && !variants.has(id)) variants.set(id, { label: text, eventId: identifier(variant.variantId) || id });
      });
    }

    function selectedOptions() {
      const presentation = select && options.has(select.value) ? options.get(select.value) : null;
      const variant = variantSelect && variants.has(variantSelect.value) ? variants.get(variantSelect.value) : null;
      return { presentation, variant, presentationId: presentation && presentation.eventId, variantId: variant && variant.eventId };
    }

    function updateLinks() {
      const selection = selectedOptions();
      const preference = selection.presentation ? selection.presentation.label + (selection.variant ? ', relleno ' + selection.variant.label : '') : selection.variant ? 'el relleno ' + selection.variant.label : '';
      const message = 'Hola, quiero consultar por ' + productName + ' de Creaciones Franyelis.' + (preference ? ' Me interesa ' + preference + '.' : '') + ' ¿Me pueden confirmar precio y disponibilidad?';
      links.forEach(link => {
        try {
          const url = new URL(link.dataset.whatsappBase || link.href, window.location.href);
          if (url.protocol !== 'https:' || url.hostname !== 'wa.me' || url.pathname !== '/' + officialWhatsApp) return;
          url.search = '';
          url.hash = '';
          url.searchParams.set('text', message);
          link.href = url.href;
        } catch (_) {
          // Keep the server-rendered consultation link if the context is invalid.
        }
      });
    }

    if (select) select.addEventListener('change', updateLinks);
    if (variantSelect) variantSelect.addEventListener('change', updateLinks);
    updateLinks();
    const controls = document.querySelector('.product-options');
    if (controls && links.length && (select || variantSelect)) controls.hidden = false;
    emit('view_product', context);
    return { selectedOptions };
  }

  initFilter();
  initGallery();
  const productState = initProduct();

  document.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !context) return;
    const whatsappLink = target.closest('a[data-product-whatsapp]');
    if (whatsappLink && productState) {
      emit('whatsapp_intent', context, productState.selectedOptions(), identifier(context.ctaLocation) || 'product-detail');
      return;
    }

    const productLink = target.closest('a[data-product-id]');
    if (!productLink || !Array.isArray(context.listProducts)) return;
    const product = context.listProducts.find(item => item && item.productId === productLink.dataset.productId);
    if (product) emit(productLink.hasAttribute('data-catalog-whatsapp') ? 'whatsapp_intent' : 'select_product', product, null, identifier(productLink.dataset.ctaLocation) || 'catalog-card');
  });
}());
