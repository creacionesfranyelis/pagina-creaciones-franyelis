import { escapeHTML as e, icon, header, footer, contact, whatsappURL } from './corporate-components.mjs';

export const origin = 'https://www.creacionesfranyelis.com';
export const productPath = p => `/productos/${p.categoryId}/${p.slug}/`;
export const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');

export function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="Migas de pan"><ol>${items.map((item, i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${e(item.name)}</span>` : `<a href="${e(item.path)}">${e(item.name)}</a>`}</li>`).join('')}</ol></nav>`;
}

export function photo(image, { eager = false, sizes = '(max-width: 640px) 44vw, 32vw' } = {}) {
  return `<img src="/assets/images/${e(image.base)}-480.webp" srcset="/assets/images/${e(image.base)}-480.webp 480w, /assets/images/${e(image.base)}-${image.max}.webp ${image.max}w" sizes="${e(sizes)}" width="${image.width}" height="${image.height}" alt="${e(image.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
}

export function placeholder(category, caption = 'Fotografía pendiente') {
  return `<div class="product-placeholder">${icon(category.icon)}<span>${e(caption)}</span></div>`;
}

function availability(product) {
  return ({ available: 'Disponible para consultar', pending_confirmation: 'Disponibilidad por confirmar', unavailable: 'Temporalmente no disponible' })[product.availability.status];
}

export function consultationURL(product, brand) {
  return whatsappURL(brand, `Hola, quiero consultar por ${product.name} de Creaciones Franyelis. ¿Me pueden confirmar precio y disponibilidad?`);
}

function summary(product) {
  const presentations = product.presentations;
  if (!presentations.length) return '';
  if (presentations.length > 3 && presentations.every(p => p.units)) return `${presentations[0].units}–${presentations.at(-1).units} unidades · a confirmar`;
  return presentations.map(p => p.label.replace(/^Bandeja de /, '')).join(' / ') + ' · a confirmar';
}

export function productCard(product, category, brand) {
  const href = productPath(product), id = e(product.id);
  const visual = product.images.length ? photo(product.images[0]) : placeholder(category);
  return `<article class="product-card" data-product-id="${id}" data-product-group="${e(product.subcategoryId)}">
<a class="product-media" href="${href}" data-product-id="${id}" aria-label="Ver detalles de ${e(product.name)}">${visual}</a>
<div class="product-body"><p class="product-status">${e(availability(product))}</p><h3><a href="${href}" data-product-id="${id}">${e(product.name)}</a></h3><p>${e(product.description)}</p>${summary(product) ? `<p>${e(summary(product))}</p>` : ''}<p class="product-price">Consultar precio</p><div class="product-actions"><a class="text-link" href="${href}" data-product-id="${id}">Ver detalles ${icon('arrow')}</a><a class="button" href="${e(consultationURL(product, brand))}" target="_blank" rel="noopener noreferrer" data-product-id="${id}" data-catalog-whatsapp data-cta-location="catalog-card" aria-label="Consultar ${e(product.name)} por WhatsApp">${icon('whatsapp')} Consultar</a></div></div></article>`;
}

export function categoryTiles(categories) {
  return `<div class="catalog-category-grid">${categories.map(category => `<article class="category-card"><a class="category-media" href="${category.path}" aria-label="Ver ${e(category.name)}">${category.image ? photo(category.image) : placeholder(category)}</a><div class="category-body"><h3>${e(category.name)}</h3><p>${e(category.shortDescription)}</p><a class="category-link" href="${category.path}">Ver productos ${icon('arrow')}</a></div></article>`).join('')}</div>`;
}

export function categoryNavigation(categories, current) {
  return `<nav class="catalog-category-nav" aria-label="Categorías de productos">${categories.map(category => `<a href="${category.path}"${category.id === current ? ' aria-current="page"' : ''}>${e(category.name)}</a>`).join('')}</nav>`;
}

export function catalogHead({ title, description, route, crumbs, brand, image, items = [], pageType }) {
  const social = image ? { url: `${origin}/assets/images/${image.base}-${image.max}.webp`, alt: image.alt, width: image.width, height: image.height } : { url: `${origin}/assets/images/brand-logo.webp`, alt: 'Logo oficial de Creaciones Franyelis', width: 160, height: 160 };
  const page = { '@type': pageType === 'product' ? 'WebPage' : 'CollectionPage', '@id': origin + route + '#webpage', url: origin + route, name: title, description, inLanguage: 'es-CL', isPartOf: { '@type': 'WebSite', url: origin + '/' } };
  if (items.length) page.mainEntity = { '@type': 'ItemList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, url: origin + item.path })) };
  // Commercial data are pending: do not manufacture Product offers or ratings.
  const graph = [page, { '@type': 'BreadcrumbList', itemListElement: crumbs.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: origin + item.path })) }];
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#fffaf5">
<link rel="canonical" href="${origin + route}"><link rel="icon" type="image/png" href="/assets/images/favicon.png">
<meta property="og:type" content="website"><meta property="og:locale" content="es_CL"><meta property="og:site_name" content="${e(brand.name)}">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${origin + route}">
<meta property="og:image" content="${social.url}"><meta property="og:image:secure_url" content="${social.url}"><meta property="og:image:alt" content="${e(social.alt)}"><meta property="og:image:width" content="${social.width}"><meta property="og:image:height" content="${social.height}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${social.url}"><meta name="twitter:image:alt" content="${e(social.alt)}">
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>
<script>document.documentElement.classList.add('corporate-js');</script>
<link rel="stylesheet" href="/assets/css/corporate.css"><link rel="stylesheet" href="/assets/css/catalog.css"><link rel="stylesheet" href="/assets/css/consent.css">
<script src="/assets/js/consent.js" defer></script><script src="/assets/js/corporate-nav.js" defer></script><script src="/assets/js/catalog.js" defer></script>`;
}

export function page(body, config, context) {
  return `<!doctype html>\n<html lang="es"><head>\n${catalogHead(config)}\n</head><body id="top" data-page="corporate-${config.pageType}">\n${header(config.brand, 'products')}\n<main id="main" tabindex="-1">\n${body}\n</main>\n${contact(config.brand)}\n${footer(config.brand)}\n<script type="application/json" id="catalog-context">${json(context)}</script>\n</body></html>\n`;
}

export function catalogHero(category, crumbs) {
  return `<section class="catalog-hero"><div class="container">${breadcrumbs(crumbs)}<div class="catalog-hero-grid"><div><p class="eyebrow">Creaciones Franyelis · ${e(category.name)}</p><h1 class="catalog-title">${e(category.headline)}</h1><p class="catalog-intro">${e(category.description)}</p><a class="text-link" href="#catalogo">Explorar productos ${icon('arrow')}</a></div><figure>${category.image ? photo(category.image, { eager: true, sizes: '(max-width: 640px) 90vw, 42vw' }) : placeholder(category)}<figcaption>${category.image ? 'Una preparación de Creaciones Franyelis.' : 'Consulta las opciones y detalles de tu pedido.'}</figcaption></figure></div></div></section>`;
}

export function productDetail(product, category, crumbs, brand) {
  const image = product.images[0];
  const sizes = [...new Set(product.presentations.map(p => p.sizeCm).filter(Boolean))];
  const facts = [
    product.presentations.length ? ['Presentaciones', product.presentations.map(p => p.label).join(' · ')] : null,
    sizes.length ? ['Tamaño de referencia', sizes.map(n => new Intl.NumberFormat('es-CL').format(n) + ' cm').join(' · ')] : null,
    product.variants.length ? ['Rellenos para consultar', product.variants.map(v => v.label).join(' · ')] : null,
    ...product.attributes.map(a => [a.label, a.value])
  ].filter(Boolean);
  const reference = product.evidence.some(item => item.source === 'catalog-pdf');
  const factsBlock = facts.length ? `<section class="product-facts" aria-labelledby="facts-title"><h2 id="facts-title">Conoce las opciones</h2><dl>${facts.map(([name, value]) => `<div><dt>${e(name)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>${reference ? '<p class="product-reference">Presentaciones y características de referencia del catálogo. Confirma su vigencia y disponibilidad antes de pedir.</p>' : ''}</section>` : '';
  const gallery = `<figure class="product-gallery"><div class="product-main-photo">${image ? photo(image, { eager: true, sizes: '(max-width: 850px) 90vw, 42vw' }) : placeholder(category)}</div>${product.images.length > 1 ? `<div class="product-thumbs" hidden role="group" aria-label="Elegir fotografía">${product.images.map((item, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="Ver fotografía ${i + 1} de ${e(product.name)}" data-photo-target="/assets/images/${e(item.base)}-${item.max}.webp" data-photo-alt="${e(item.alt)}" data-photo-width="${item.width}" data-photo-height="${item.height}"><img src="/assets/images/${e(item.base)}-480.webp" width="${item.width}" height="${item.height}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}<figcaption>${image ? e(image.caption) : 'Incorporaremos la fotografía de esta preparación cuando esté disponible.'}</figcaption></figure>`;
  return `<div class="container">${breadcrumbs(crumbs)}<section class="product-detail-grid" aria-labelledby="product-title">${gallery}<div class="product-information"><p class="eyebrow">${e(category.name)}</p><h1 id="product-title">${e(product.name)}</h1><p>${e(product.description)}</p><p class="product-status">${e(availability(product))}</p><p class="product-price">Consultar precio <small>por WhatsApp</small></p>
${product.presentations.length || product.variants.length ? `<div class="product-options" hidden>${product.presentations.length ? `<label for="product-option">Presentación que quieres consultar</label><select id="product-option"><option value="">Selecciona una presentación</option>${product.presentations.map(item => `<option value="${e(item.id)}">${e(item.label)}</option>`).join('')}</select>` : ''}${product.variants.length ? `<label for="product-variant">Relleno que quieres consultar</label><select id="product-variant"><option value="">Selecciona un relleno</option>${product.variants.map(item => `<option value="${e(item.id)}">${e(item.label)}</option>`).join('')}</select>` : ''}<p>La selección prepara tu consulta; todavía no confirma un pedido.</p></div>` : ''}
<a class="button product-whatsapp" href="${e(consultationURL(product, brand))}" target="_blank" rel="noopener noreferrer" data-product-whatsapp>${icon('whatsapp')} ${product.categoryId === 'tortas' ? 'Cotizar mi torta por WhatsApp' : 'Consultar por WhatsApp'}</a><p class="product-order-note">${e(product.ordering.confirmation)}</p><p class="product-order-note">${e(product.delivery.description)}</p>${factsBlock}</div></section></div>
<section class="catalog-section product-faq"><div class="container"><div class="section-heading"><p class="eyebrow">Antes de hacer tu pedido</p><h2>Conversemos los detalles</h2></div><div class="product-faq-list"><details><summary>¿Cómo consulto precio y disponibilidad?</summary><p>Abre la conversación por WhatsApp${product.presentations.length || product.variants.length ? ' con la opción que te interesa' : ''}. Te compartiremos precio, disponibilidad y los pasos para acordar el pedido. Abrir la conversación no confirma una compra.</p></details><details><summary>¿Cómo se acuerda la entrega o el retiro?</summary><p>Consulta las opciones de entrega o retiro por WhatsApp antes de confirmar tu pedido.</p></details></div><a class="text-link" href="${category.path}">Volver a ${e(category.name)} ${icon('arrow')}</a></div></section>`;
}
