import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML as e, icon } from '../templates/corporate-components.mjs';
import { page, photo, productPath, productCard, categoryTiles, categoryNavigation, catalogHero, productDetail } from '../templates/catalog-components.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corporate = JSON.parse(await readFile(path.join(root, 'content/corporate.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'content/products.json'), 'utf8'));
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requiredCategories = ['tortas', 'panaderia', 'comida-venezolana', 'pasapalos', 'bebidas'];
const states = ['available', 'pending_confirmation', 'unavailable'];
const ids = new Set(), routes = new Set();
if (catalog.schemaVersion !== 1 || catalog.categories.length !== 5 || requiredCategories.some(id => !catalog.categories.some(category => category.id === id))) throw new Error('Expected exactly the five approved categories');
for (const category of catalog.categories) {
  if (category.path !== `/productos/${category.id}/` || !idPattern.test(category.id)) throw new Error('Unsafe category route');
  if (new Set(category.subcategories.map(item => item.id)).size !== category.subcategories.length) throw new Error('Duplicate subcategory');
}
for (const product of catalog.products) {
  const category = catalog.categories.find(item => item.id === product.categoryId);
  if (!idPattern.test(product.id) || !idPattern.test(product.slug) || ids.has(product.id) || routes.has(productPath(product))) throw new Error('Unsafe or duplicate product ID / route');
  ids.add(product.id); routes.add(productPath(product));
  if (!category || !category.subcategories.some(item => item.id === product.subcategoryId)) throw new Error('Unknown product taxonomy');
  if (product.measurement.productId !== product.id || product.measurement.categoryId !== product.categoryId) throw new Error('Measurement IDs disagree with the product');
  if (!states.includes(product.availability.status) || product.publication.status !== 'local_review') throw new Error('Invalid product state');
  if (product.price.status !== 'pending_confirmation' || product.price.amount !== null || product.price.currency !== 'CLP') throw new Error('Numeric product prices are not approved in this phase');
  for (const collection of [product.presentations, product.variants]) {
    if (new Set(collection.map(item => item.id)).size !== collection.length || collection.some(item => !idPattern.test(item.id))) throw new Error('Invalid option IDs');
  }
  for (const image of product.images) {
    if (!idPattern.test(image.base) || !Number.isInteger(image.width) || !Number.isInteger(image.height) || !image.alt) throw new Error('Invalid image');
    for (const width of [480, image.max]) await access(path.join(root, 'assets/images', image.base + '-' + width + '.webp'));
  }
}
const categories = catalog.categories.map(category => {
  const existing = corporate.categories.find(item => item.id === category.id);
  const product = catalog.products.find(item => item.categoryId === category.id && item.images.length);
  return { ...category, icon: existing.icon, shortDescription: existing.description, image: product?.images[0] || null };
});
const brand = corporate.brand;
const homeCrumb = { name: 'Inicio', path: '/inicio/' };
const catalogCrumb = { name: 'Productos', path: '/productos/' };
const listed = products => products.map(product => ({ productId: product.id, categoryId: product.categoryId, productSlug: product.slug }));
const cards = products => products.map(product => productCard(product, categories.find(item => item.id === product.categoryId), brand)).join('\n');
const output = [];
const featured = ['tortas-personalizadas', 'pan-de-jamon', 'tequenos-de-queso'].map(id => catalog.products.find(item => item.id === id));
const introCategory = { name: 'Productos', headline: 'Sabores para cada\nmomento especial.', description: 'Tortas para celebrar, tradición venezolana y bocados para compartir. Explora nuestras preparaciones y cuéntanos qué necesitas.', image: catalog.products.find(p => p.id === 'tortas-personalizadas').images[1] };
const hubBody = catalogHero(introCategory, [homeCrumb, catalogCrumb]) + `<section class="catalog-section" id="catalogo"><div class="container"><div class="section-heading"><p class="eyebrow">Elige lo que quieres compartir</p><h2>Nuestras cinco categorías</h2><p>Encuentra una preparación para tu mesa, tu celebración o tu próximo encuentro.</p></div>${categoryTiles(categories)}</div></section><section class="catalog-section"><div class="container"><div class="section-heading"><p class="eyebrow">Empieza a explorar</p><h2>De nuestra cocina a tu mesa</h2></div><div class="product-grid">${cards(featured)}</div><p class="catalog-note">Cada pedido comienza con una conversación. Consulta el precio, las opciones y la disponibilidad de tu preparación antes de confirmar.</p></div></section>`;
output.push(['productos/index.html', page(hubBody, { title: 'Productos artesanales y sabores venezolanos | Creaciones Franyelis', description: 'Explora tortas, Pan de Jamón, comida venezolana, pasapalos y Ponche Crema de Creaciones Franyelis. Consulta tu pedido por WhatsApp.', route: '/productos/', crumbs: [homeCrumb, catalogCrumb], brand, image: introCategory.image, items: categories.map(c => ({ name: c.name, path: c.path })), pageType: 'catalog' }, { pageType: 'catalog', listProducts: listed(featured) })]);
for (const category of categories) {
  const products = catalog.products.filter(product => product.categoryId === category.id);
  const crumbs = [homeCrumb, catalogCrumb, { name: category.name, path: category.path }];
  const filter = category.id === 'pasapalos' ? `<div class="catalog-filter" hidden><label for="product-type">¿Qué quieres compartir?</label><select id="product-type" name="product-type"><option value="all">Todos los pasapalos</option>${category.subcategories.map(item => `<option value="${e(item.id)}">${e(item.name)}</option>`).join('')}</select></div>` : '';
  const categoryBody = catalogHero(category, crumbs) + `<section class="catalog-section" id="catalogo"><div class="container">${categoryNavigation(categories, category.id)}<div class="catalog-toolbar"><div><p class="eyebrow">${e(category.name)}</p><h2>Explora nuestras preparaciones</h2></div>${filter}<p class="catalog-results-status" role="status" aria-live="polite">${products.length} ${products.length === 1 ? 'producto para consultar' : 'productos para consultar'}</p></div><div class="product-grid">${cards(products)}</div><p class="catalog-note">${products.some(p => p.presentations.length) ? 'Las presentaciones y rellenos indicados son referencias de nuestro catálogo. Confirma su vigencia, precio y disponibilidad por WhatsApp.' : 'Consulta los formatos, opciones, precio y disponibilidad por WhatsApp. No hay un pedido confirmado hasta acordar sus condiciones.'}</p></div></section>`;
  output.push([category.path.slice(1) + 'index.html', page(categoryBody, { ...category.seo, route: category.path, crumbs, brand, image: category.image, items: products.map(product => ({ name: product.name, path: productPath(product) })), pageType: 'category' }, { pageType: 'category', categoryId: category.id, listProducts: listed(products) })]);
  for (const product of products) {
    const route = productPath(product), productCrumbs = [...crumbs, { name: product.name, path: route }];
    const related = products.filter(item => item.id !== product.id).slice(0, 3);
    const body = productDetail(product, category, productCrumbs, brand) + (related.length ? `<section class="catalog-section product-related"><div class="container"><h2>También puedes explorar</h2><div class="product-grid">${cards(related)}</div></div></section>` : '');
    const context = { pageType: 'product', productId: product.id, productName: product.name, categoryId: category.id, subcategoryId: product.subcategoryId, productSlug: product.slug, whatsapp: brand.whatsapp, options: product.presentations.map(item => ({ id: item.id, label: item.label, presentationId: item.id })), variants: product.variants.map(item => ({ id: item.id, label: item.label })), availability: product.availability.status, ctaLocation: 'product-detail', listProducts: listed(related), measurement: { status: 'local_only_no_provider', meta: { content_name: product.name, content_category: category.id, content_ids: [product.id], content_type: 'product' } } };
    output.push([route.slice(1) + 'index.html', page(body, { ...product.seo, route, crumbs: productCrumbs, brand, image: product.images[0], pageType: 'product' }, context)]);
  }
}
// A closed route manifest: never touch the course landing, sitemap or legal files.
for (const [destination, html] of output) {
  if (!destination.startsWith('productos/') || destination.includes('..')) throw new Error('Output outside catalog');
  await mkdir(path.dirname(path.join(root, destination)), { recursive: true });
  await writeFile(path.join(root, destination), html);
}
console.log(`Generated ${output.length} local catalog pages: 5 categories and ${catalog.products.length} products. No numeric prices, tracking providers or sitemap changes.`);
