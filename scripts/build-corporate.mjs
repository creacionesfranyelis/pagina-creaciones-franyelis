import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { escapeHTML as e, icon, header, footer, contact, picture, categoryCard, courseCard, externalLink, orderURL } from '../templates/corporate-components.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root,'content/corporate.json'),'utf8'));
const {brand,person,course,categories} = data;
// The existing course remains the authority. Refuse to generate a divergent card.
const existing = await readFile(path.join(root,'index.html'),'utf8');
const graph = JSON.parse(existing.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const instance = graph.find(item=>item['@type']==='Course').hasCourseInstance;
for(const key of ['startDate','endDate','duration']) if(instance[key]!==course[key]) throw new Error('Course card disagrees with the approved landing: '+key);
for(const value of [course.normalPrice,course.promoPrice,course.deposit,course.balance]) if(!existing.includes('$'+new Intl.NumberFormat('es-CL').format(value))) throw new Error('Price not present in approved landing');
if(course.deposit+course.balance!==course.promoPrice || course.url!=='/' || categories.length!==5) throw new Error('Invalid corporate content contract');
const origin='https://www.creacionesfranyelis.com';
const json = value => JSON.stringify(value,null,2).replace(/</g,'\\u003c');
function head(title, description, route, about=false) {
  const image=about?'franyelis-almerida-real-800.webp':'torta-celebracion-instagram-640.webp';
  const organization={'@type':'Organization','@id':origin+'/#organization',name:brand.name,legalName:brand.legalName,url:origin+'/',logo:origin+'/assets/images/brand-logo.webp',sameAs:[brand.instagram,brand.facebook]};
  const page={'@type':about?'AboutPage':'WebPage','@id':origin+route+'#webpage',url:origin+route,name:title,description,inLanguage:'es-CL',isPartOf:{'@type':'WebSite',url:origin+'/'},about:{'@id':organization['@id']}};
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta name="robots" content="noindex,follow">
<meta name="theme-color" content="#fffaf5">
<link rel="canonical" href="${origin+route}">
<link rel="icon" type="image/png" href="/assets/images/favicon.png">
<meta property="og:type" content="website"><meta property="og:locale" content="es_CL">
<meta property="og:site_name" content="${e(brand.name)}">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${origin+route}">
<meta property="og:image" content="${origin}/assets/images/${image}">
<meta property="og:image:alt" content="${about?'Franyelis Almerida, instructora de Creaciones Franyelis':'Torta de celebración de Creaciones Franyelis'}">
<meta property="og:image:width" content="${about?800:640}"><meta property="og:image:height" content="${about?800:640}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${origin}/assets/images/${image}">
<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[organization,page]})}</script>
<script>document.documentElement.classList.add('corporate-js');</script>
${about?'':'<script src="/assets/js/early-booking.js"></script>'}
<link rel="stylesheet" href="/assets/css/corporate.css">
<link rel="stylesheet" href="/assets/css/consent.css">
<script src="/assets/js/consent.js" defer></script>
<script src="/assets/js/corporate-nav.js" defer></script>`;
}
function page(body,title,description,route,type) {
  return `<!doctype html>\n<html lang="es">\n<head>\n${head(title,description,route,type==='about')}\n</head>\n<body id="top" data-page="corporate-${type==='home'?'home':'about'}">\n${header(brand,type)}\n<main id="main" tabindex="-1">\n${body}\n</main>\n${footer(brand)}\n</body>\n</html>\n`;
}
const home=`<section class="home-hero" aria-labelledby="hero-title"><div class="container home-hero-grid"><div class="hero-copy"><p class="eyebrow">Creaciones Franyelis</p><h1 id="hero-title">Más que recetas,<br>creamos momentos<br><em>especiales.</em> ${icon('heart')}</h1><p class="hero-lead">Tortas, panadería, pasapalos, comida tradicional venezolana y cursos preparados con dedicación.</p><div class="hero-actions">${externalLink(orderURL(brand),icon('whatsapp')+'Haz tu pedido por WhatsApp','button')}<a class="text-link" href="#productos">Ver nuestros productos ${icon('arrow')}</a></div><ul class="hero-signatures"><li>${icon('heart')}<span>Preparaciones<br>artesanales</span></li><li>${icon('chef')}<span>Tradición<br>venezolana</span></li><li>${icon('people')}<span>Pedidos por<br>WhatsApp</span></li></ul></div><figure class="hero-photo">${picture('torta-celebracion-instagram',640,'Torta artesanal decorada con crema blanca y detalles de colores, del Instagram oficial de Creaciones Franyelis',{eager:true,sizes:'(max-width: 640px) 100vw, 56vw'})}<figcaption>Endulzamos<br>tus momentos ${icon('heart')}</figcaption></figure></div></section>
<section class="section products-section" id="productos" aria-labelledby="products-title"><div class="container"><div class="section-heading"><p class="eyebrow">Para compartir y celebrar</p><h2 id="products-title">Nuestros Productos</h2><p>Tradición, sabor y cariño en cada preparación.</p></div><div class="category-grid">${categories.map(category=>categoryCard(category,brand)).join('\n')}</div><p class="section-note">Cuéntanos qué necesitas. Consulta formatos y disponibilidad por WhatsApp.</p></div></section>
<section class="section courses-section" id="cursos" aria-labelledby="courses-title"><div class="container courses-layout"><div class="courses-intro"><p class="eyebrow">Aprende con nosotros</p><h2 id="courses-title">Cursos <br>y Talleres</h2><p>Aprende, disfruta y lleva la tradición a tu mesa.</p><a class="text-link" href="/">Conoce el curso de Pan de Jamón ${icon('arrow')}</a></div>${courseCard(course)}</div></section>
<section class="section story-section" aria-labelledby="story-title"><div class="container story-grid"><figure class="story-photo">${picture('franyelis-almerida-real',800,'Franyelis Almerida, instructora de Creaciones Franyelis',{sizes:'(max-width: 640px) 90vw, 420px'})}<figcaption>Franyelis Almerida</figcaption></figure><div class="story-copy"><p class="eyebrow">Repostería con amor</p><h2 id="story-title">Somos<br><span>Creaciones Franyelis</span></h2><p class="story-lead">Pasión por la repostería y la tradición venezolana.</p><p>Tortas para celebrar, sabores para compartir y experiencias para aprender. Te invitamos a conocer nuestras preparaciones y a Franyelis, instructora de nuestros talleres.</p><a class="button button--small" href="/nosotros/">Conoce a Franyelis ${icon('arrow')}</a></div><ul class="brand-values"><li>${icon('heart')}<span>Preparaciones<br>artesanales</span></li><li>${icon('people')}<span>Tradición<br>venezolana</span></li><li>${icon('leaf')}<span>Cariño en<br>cada detalle</span></li></ul></div></section>
${contact(brand)}`;
const about=`<section class="about-intro section" aria-labelledby="about-title"><div class="container about-intro-grid"><div><p class="eyebrow">Nosotros · Creaciones Franyelis</p><h1 id="about-title">Sabores que unen.<br><em>Momentos que quedan.</em></h1><p class="intro-lead">Repostería con amor y tradición venezolana para celebrar, compartir y aprender.</p><p>Creaciones Franyelis reúne tortas, panadería, pasapalos, comida tradicional venezolana y bebidas artesanales. Un lugar para encontrar sabores para tu mesa y acercarte a su preparación en nuestros talleres.</p><a class="text-link" href="/productos/">Descubre nuestras preparaciones ${icon('arrow')}</a></div><figure class="about-cake">${picture('torta-rosada-instagram',640,'Torta de celebración con crema rosada y blanca, publicada por Creaciones Franyelis',{eager:true,sizes:'(max-width: 640px) 90vw, 450px'})}<figcaption>Más que recetas, creamos momentos especiales.</figcaption></figure></div></section>
<section class="section instructor-section" aria-labelledby="instructor-title"><div class="container instructor-grid"><figure class="instructor-photo">${picture('franyelis-almerida-real',800,'Fotografía real de Franyelis Almerida, instructora de Creaciones Franyelis',{sizes:'(max-width: 640px) 90vw, 480px'})}<figcaption>${e(person.name)}<span>${e(person.role)}</span></figcaption></figure><div class="instructor-copy"><p class="eyebrow">Aprender también es compartir</p><h2 id="instructor-title">Conoce a<br><span>${e(person.name)}</span></h2><p class="role">${e(person.role)}</p><p>${e(person.presentation)}</p><a class="button button--small" href="/">Conoce su curso de Pan de Jamón ${icon('arrow')}</a><p class="instructor-signature">La cocina también cuenta historias. ${icon('heart')}</p></div></div></section>
<section class="section about-values-section" aria-labelledby="values-title"><div class="container"><div class="section-heading"><p class="eyebrow">Lo que compartimos contigo</p><h2 id="values-title">Tradición, creatividad y cercanía</h2></div><div class="value-grid"><article>${icon('cake')}<h3>Repostería personalizada</h3><p>Cuéntanos tu idea para una celebración y consulta las opciones para tu torta.</p></article><article>${icon('leaf')}<h3>Sabores venezolanos</h3><p>Pan de Jamón, hallacas, bollitos y pasapalos que invitan a compartir la mesa.</p></article><article>${icon('chef')}<h3>Aprendizaje práctico</h3><p>Acércate a cada preparación paso a paso, de la mano de Franyelis.</p></article></div></div></section>
<section class="section workshops-section" aria-labelledby="workshops-title"><div class="container"><div class="workshops-heading"><div><p class="eyebrow">Experiencias de talleres anteriores</p><h2 id="workshops-title">La tradición se aprende<br><em>con las manos.</em></h2></div><p>Preparar, preguntar y compartir el proceso. Estas fotografías muestran momentos de nuestros talleres anteriores.</p></div><div class="workshop-grid"><figure><img src="/assets/images/alumnos-taller-pan-de-jamon-480.webp" srcset="/assets/images/alumnos-taller-pan-de-jamon-480.webp 480w, /assets/images/alumnos-taller-pan-de-jamon-900.webp 900w" sizes="(max-width: 640px) 90vw, 48vw" width="900" height="1600" alt="Participantes preparando pan de jamón durante un taller anterior" loading="lazy" decoding="async"><figcaption>Compartiendo la preparación del Pan de Jamón.</figcaption></figure><figure><img src="/assets/images/taller-demostracion-pan-de-jamon-480.webp" srcset="/assets/images/taller-demostracion-pan-de-jamon-480.webp 480w, /assets/images/taller-demostracion-pan-de-jamon-900.webp 900w" sizes="(max-width: 640px) 90vw, 48vw" width="900" height="900" alt="Demostración de preparación durante un taller anterior" loading="lazy" decoding="async"><figcaption>Una demostración, paso a paso.</figcaption></figure></div><a class="text-link" href="/">Ver el próximo taller de Pan de Jamón ${icon('arrow')}</a></div></section>
<section class="about-brand-note"><div class="container"><p>Creaciones Franyelis es el nombre comercial bajo el cual opera <strong>Almerida Shop SpA</strong>. Franyelis Almerida participa como instructora del curso.</p></div></section>
${contact(brand)}`;
// Closed output list: never write the existing course or legal files.
const outputs=[['inicio/index.html',page(home,'Creaciones Franyelis | Repostería y sabores venezolanos','Tortas personalizadas, panadería, pasapalos, sabores venezolanos y cursos. Conoce Creaciones Franyelis y consulta tu pedido por WhatsApp.','/inicio/','home')],['nosotros/index.html',page(about,'Nosotros y Franyelis Almerida | Creaciones Franyelis','Conoce Creaciones Franyelis, a su instructora Franyelis Almerida y las experiencias de nuestros talleres. Repostería con amor y tradición venezolana.','/nosotros/','about')]];
for(const [destination,html] of outputs) { await mkdir(path.dirname(path.join(root,destination)),{recursive:true}); await writeFile(path.join(root,destination),html); }
console.log('Generated only /inicio/ and /nosotros/. Existing course and legal files preserved.');
