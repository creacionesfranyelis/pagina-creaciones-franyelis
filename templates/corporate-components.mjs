// Shared, server-rendered components. No runtime fetching or tracking snippets.
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  heart: '<path d="M20.5 4.6c-2.3-2.1-5.9-1.6-8.5 1.3C9.4 3 5.8 2.5 3.5 4.6-.3 8.2 3.1 13 12 21c8.9-8 12.3-12.8 8.5-16.4Z"/>',
  chef: '<path d="M7 18h10v3H7zm0-2V9C1 9 2 2 7 3c1-4 9-4 10 0 5-1 6 6 0 6v7M10 9v5m4-5v5"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m1-18a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v3"/>',
  leaf: '<path d="M4 19C-1 8 9 3 21 3c0 11-4 19-14 16M3 22 17 7m-6 7V8m0 6h6"/>',
  cake: '<path d="M3 21V11h18v10ZM3 15c3 4 4-4 7 0s4-4 7 0 4 0 4 0M7 11V7m5 4V7m5 4V7M7 3v1m5-1v1m5-1v1"/>',
  bread: '<path d="M4 19c-4-3-3-12 1-14 3-2 11-2 14 1 3 3 4 10 0 13Zm3-10 3 4m1-6 3 4m1-6 3 4"/>',
  snacks: '<path d="M2 20h20M4 17l4-11c2-4 7-2 6 2l-3 9ZM12 17l4-11c2-4 7-2 6 2l-3 9ZM6 10l6 2m3-2 6 2"/>',
  bottle: '<path d="M9 3h6v3H9zm0 3v4c-4 2-4 4-4 7v4h14v-4c0-3 0-5-4-7V6M5 15h14m-9 3h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M15 21v-8h3l.5-4H15V7c0-2 1-3 4-3V1c-6-1-8 2-8 6v2H8v4h3v8"/>',
  whatsapp: '<path d="M20 4a10 10 0 0 1-12 16l-6 2 2-6A10 10 0 0 1 20 4Z"/><path d="m8 6-1 2c0 4 5 9 9 9l2-2-3-2-1 1c-2-1-3-2-4-4l1-1Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>'
};
export const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.heart}</svg>`;
export const whatsappURL = (brand, message) => `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
export const orderURL = brand => whatsappURL(brand, 'Hola, quiero hacer un pedido con Creaciones Franyelis. ¿Me comparten las opciones y los pasos para cotizar?');
export const externalLink = (href, text, classes='') => `<a class="${escapeHTML(classes)}" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
export function picture(name, max, alt, {className='', sizes='(max-width: 640px) 92vw, 50vw', eager=false}={}) {
  const height = name === 'pan-de-jamon-artesanal' ? max * 4 / 3 : max;
  return `<img class="${escapeHTML(className)}" src="/assets/images/${escapeHTML(name)}-480.webp" srcset="/assets/images/${escapeHTML(name)}-480.webp 480w, /assets/images/${escapeHTML(name)}-${max}.webp ${max}w" sizes="${escapeHTML(sizes)}" width="${max}" height="${height}" alt="${escapeHTML(alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
}
export function brandLink(brand, small=false) {
  return `<a class="brand${small?' brand--footer':''}" href="/inicio/" aria-label="Creaciones Franyelis, Inicio"><img src="/assets/images/brand-logo.webp" width="160" height="160" alt="Logo oficial de Creaciones Franyelis"${small?' loading="lazy"':''} decoding="async"><span><strong>${escapeHTML(brand.name)}</strong><small>${escapeHTML(brand.tagline)}</small></span></a>`;
}
export function socials(brand) {
  return `<div class="socials">${externalLink(brand.instagram, icon('instagram')+'<span class="sr-only">Instagram de Creaciones Franyelis</span>','social social--instagram')}${externalLink(brand.facebook, icon('facebook')+'<span class="sr-only">Facebook de Creaciones Franyelis</span>','social social--facebook')}</div>`;
}
export function header(brand, current) {
  const items=[['Inicio','/inicio/','home'],['Nosotros','/nosotros/','about'],['Productos','/productos/','products'],['Cursos y Talleres','/inicio/#cursos','courses'],['Contacto','/inicio/#contacto','contact']];
  return `<a class="skip-link" href="#main">Saltar al contenido</a>
<header class="site-header"><div class="container header-inner">${brandLink(brand)}
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="Abrir menú">${icon('menu')}<span>Menú</span></button>
<nav class="site-nav" id="site-navigation" aria-label="Navegación principal">${items.map(([label,href,id])=>`<a href="${href}"${id===current?' aria-current="page"':''}>${label}</a>`).join('')}</nav>
<div class="header-actions">${socials(brand)}${externalLink(orderURL(brand),icon('whatsapp')+'<span>Haz tu pedido</span>','button button--compact')}</div></div></header>`;
}
export function categoryCard(category, brand) {
  const visual=category.image ? picture(category.image,category.imageMax,category.imageAlt,{sizes:'(max-width: 600px) 44vw, (max-width: 1000px) 30vw, 250px'}) : `<div class="category-illustration category-illustration--${category.id}" aria-hidden="true"><span class="illustration-orbit"></span>${icon(category.icon)}<span class="illustration-star">✧</span></div>`;
  return `<article class="category-card" id="categoria-${category.id}"><div class="category-media">${visual}</div><div class="category-body"><h3>${escapeHTML(category.name)}</h3><p>${escapeHTML(category.description)}</p><a class="category-link" href="${escapeHTML(category.plannedPath)}">Ver productos ${icon('arrow')}</a></div></article>`;
}
const pesos = n => '$'+new Intl.NumberFormat('es-CL').format(n);
export function courseCard(course) {
  return `<article class="course-card"><div class="course-card-copy"><span class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Curso presencial</span><h3>${escapeHTML(course.name)}<span>${escapeHTML(course.subject)}</span></h3><p>Incluye bonus de ${escapeHTML(course.bonus)}.</p><ul class="course-details"><li>${icon('calendar')}<time datetime="${course.date}">Domingo 25 de octubre de 2026</time></li><li>${icon('clock')}<span>10:00–14:00 · 4 horas</span></li><li>${icon('pin')}<span>${escapeHTML(course.workshopAddress)}</span></li></ul><div class="course-promotion" data-early-booking><p class="course-price"><del>${pesos(course.normalPrice)}</del><strong>${pesos(course.promoPrice)} <small>CLP</small></strong></p><p class="course-deposit">Abono de reserva: <strong>${pesos(course.deposit)} CLP</strong></p><p class="course-terms">Ahorras ${pesos(course.normalPrice-course.promoPrice)}. Saldo ${pesos(course.balance)} el día del taller, por transferencia antes de comenzar.</p><p class="course-gift">${icon('heart')} Ebook gratis para reservas confirmadas hasta el 18 de octubre, inclusive.</p></div><p class="course-inquiry" data-after-early-booking>Consulta el precio y la disponibilidad en la página del curso.</p><a class="button button--small" href="${course.url}">Ver curso y reservar ${icon('arrow')}</a></div><div class="course-card-photo">${picture('pan-de-jamon-artesanal',900,'Panes de jamón artesanales del curso El Rey de la Navidad',{sizes:'(max-width: 640px) 90vw, (max-width: 1000px) 44vw, 420px'})}</div></article>`;
}
export function contact(brand) {
  return `<section class="contact-ribbon" id="contacto" aria-labelledby="contact-title"><div class="container contact-ribbon-inner"><div><h2 id="contact-title">¡Hagamos tu idea realidad!</h2><p>Escríbenos por WhatsApp y cuéntanos qué necesitas.</p></div>${externalLink(orderURL(brand),icon('whatsapp')+'Contactar ahora','button button--cream')}</div></section>`;
}
export function footer(brand) {
  return `<footer class="site-footer"><div class="container footer-main"><div>${brandLink(brand,true)}<p class="footer-tagline">Repostería con amor,<br>para una vida más dulce. ${icon('heart')}</p></div><div class="footer-navigation"><nav aria-label="Navegación del pie de página"><a href="/inicio/">Inicio</a><a href="/nosotros/">Nosotros</a><a href="/productos/">Productos</a><a href="/inicio/#cursos">Cursos y Talleres</a><a href="/inicio/#contacto">Contacto</a></nav>${socials(brand)}</div><address class="footer-contact">${externalLink(orderURL(brand),icon('whatsapp')+'+56 9 3319 3773') }<a href="mailto:${brand.email}">${icon('mail')}${brand.email}</a><span>Lugar del taller:<br>Toro Mazote 76, Estación Central.</span></address></div><div class="container footer-bottom"><p>© 2026 Creaciones Franyelis · Nombre comercial de Almerida Shop SpA.</p><nav class="legal-links" aria-label="Información legal y privacidad"><a href="/politica-de-privacidad/">Privacidad</a><a href="/terminos-y-condiciones/">Términos y Condiciones</a><a href="/politica-de-cookies/">Cookies</a><button type="button" data-cookie-settings>Configurar cookies</button></nav><a href="#top" class="back-link">Volver arriba ↑</a></div></footer>`;
}
