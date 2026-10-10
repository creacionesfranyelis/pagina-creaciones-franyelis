# Integración de GA4 y preparación de Google Ads

GA4 está configurado en esta versión local con el ID oficial **`G-QTSNJPFR93`**, `enabled: true` y `prerequisitesReviewed: true`. Se utiliza exclusivamente el cargador existente y solo se permite GA4 en la landing HTTPS de los dominios públicos autorizados después de consentir analítica. Google Ads conserva identificadores vacíos y ambos indicadores en `false`: no se configura ni envía conversiones. Google Maps bajo demanda y Meta Pixel conservan sus controles independientes. El cierre está autorizado para commit y publicación únicamente en la rama de Preview; no habilita por sí solo la medición en la web de Production.

## Identificadores y estado

- GA4: `G-QTSNJPFR93`, flujo web **Creaciones Franyelis - Web**, ID de flujo `16094850805`, URL `https://www.creacionesfranyelis.com`. ID y ajustes confirmados en la sesión de Google Analytics del usuario el 9 de octubre de 2026.
- Google Ads: Conversion ID real, de tipo `AW-…`, y Conversion Label de la acción **clic para iniciar conversación por WhatsApp**. Confirmar la cuenta, categoría y configuración de recuento de la acción.
- La integración de GA4 y el commit/push de `feat/seo-google-indexing` están autorizados para revisión en Preview. Merge a main y Production requieren aprobación posterior. Ads requiere sus identificadores, revisión y autorización propias.

Los identificadores de etiquetas son públicos; no se deben incorporar claves, credenciales o tokens. No sustituir los campos vacíos con ejemplos. No activar una etiqueta simplemente por disponer de un ID.

## Contrato de integración

Orden de carga en la landing: `consent.js`, `measurement-config.js`, `measurement.js` (scripts locales con `defer`). No incluir un segundo snippet de Google ni Google Tag Manager. `measurement.js` usa `FranyelisConsent.has('analytics' / 'marketing')` y `subscribe()`; nunca considera la visita o el clic de WhatsApp como una concesión de consentimiento.

El handler existente de WhatsApp llama una sola vez a `FranyelisMeasurement.track('whatsapp_click', { source }, eventoNativo)`. El objeto nativo se usa únicamente para exigir una acción real y evitar registrar dos veces el mismo evento; nunca se envía. El enlace Cómo llegar se marca `data-measurement="directions"`; el módulo instala un único listener para esta finalidad. No escucha también `ReserveClick`, `PromotionClick` ni otros hooks emitidos por la landing para contabilizar de nuevo el mismo clic.

`FranyelisMeasurement.hasLoaded()` informa al gestor si se inició la carga de Google. `getConsentState()` y `getStatus()` sirven para diagnóstico local. No activar una etiqueta o evento desde esos métodos.

## Consent Mode v2 básico

Antes de cualquier `config` o `event`, la cola local registra `consent/default` con `analytics_storage`, `ad_storage`, `ad_user_data` y `ad_personalization` en `denied`. Esa cola no crea conexiones externas. Cada destino se carga solo con configuración válida, revisión, aprobación y permiso vigente correspondiente.

| Preferencias del visitante | GA4 configurado y aprobado | Ads configurado y aprobado | Meta Pixel | Mapa integrado |
| --- | --- | --- | --- | --- |
| Sin elección válida o rechazadas | No carga | No carga | No carga | No carga |
| Analítica sí, marketing no | Visitas y eventos permitidos | No carga ni conversión | No carga | Solo si se permite y solicita el mapa |
| Analítica no, marketing sí | No se configura ni envían eventos a GA4 | Solo la configuración y conversión de WhatsApp autorizadas | Según el control existente | Solo si se permite y solicita el mapa |
| Analítica sí, marketing sí | Visitas y eventos permitidos | Una conversión por acción real de WhatsApp | Según el control existente | Solo si se permite y solicita el mapa |
| Retirada de analítica o marketing después de cargar Google | Se cierra el envío local y se recarga de forma segura | Se cierra el envío local y se recarga de forma segura | Su retirada conserva el comportamiento existente | No depende de analítica/marketing |

`analytics_storage` solo se concede a GA4 habilitado con permiso de analítica. `ad_storage` y `ad_user_data` solo se conceden a Ads habilitado con permiso de marketing. **`ad_personalization` permanece `denied` incluso al aceptar marketing:** no se ha aprobado personalización o remarketing. También se fijan `allow_google_signals: false`, `allow_ad_personalization_signals: false`, `ads_data_redaction: true` y `url_passthrough: false`.

No se acumulan ni reproducen clics ocurridos antes del consentimiento. Una aceptación registra la visita al documento en ese momento, una sola vez, y los clics posteriores. La retirada descarta la cola pendiente, activa la deshabilitación de GA4, intenta borrar exclusivamente cookies de primera parte `_ga` / `_ga_*` o `_gcl_*` según la categoría retirada y elimina el script propio. El gestor guarda la elección y recarga, pues quitar un script del DOM no desinstala el código de proveedor que ya se ejecutó. Si el navegador impide guardar la retirada, se mantiene el bloqueo local y se informa de la necesidad de cerrar la pestaña y borrar los datos del sitio antes de volver a visitarlo. No se pueden cancelar solicitudes ya iniciadas ni borrar datos ya recibidos por Google desde este navegador.

## Eventos y destinos

| Evento | Disparador | GA4 | Ads |
| --- | --- | --- | --- |
| `page_view` | Primera configuración permitida de GA4 en este documento | Una vez | No es conversión |
| `view_course` | Primera configuración permitida de GA4 en este documento | Una vez | No es conversión |
| `whatsapp_click` | Clic real en el enlace de contacto, incluido teclado y botón central | Un evento por acción | `conversion` dirigida exclusivamente al ID/Label de WhatsApp |
| `directions_click` | Clic real en Cómo llegar | Un evento por acción | No es conversión |

Cada llamada usa `send_to` explícito: el evento de GA4 no se distribuye automáticamente a Ads y viceversa. Los parámetros propios permitidos son `course_id`, un `cta_location` enumerado y datos estáticos de página. El contrato local del handler conserva `{ source }`, pero ese valor se transmite a GA4 únicamente como `cta_location`, en `whatsapp_click` y `directions_click`; no se altera el parámetro independiente de Meta ni los hooks locales. La dirección enviada es siempre `https://www.creacionesfranyelis.com/`, sin query, hash ni URL del Preview; `page_referrer` es vacío. No se extraen ni reenvían datos de contacto, mensajes, comprobantes, cuentas bancarias, texto de enlace ni href de WhatsApp. Un clic no confirma una reserva, un pago o una compra; no se envían `purchase`, `transaction_id`, precio o abono como valor de conversión.

### Atribución UTM controlada

Después de obtener permiso de analítica, y únicamente al configurar por primera vez el destino GA4 autorizado, se leen `utm_source`, `utm_medium`, `utm_campaign` y `utm_content` de la URL actual. Se incorporan como `campaign_source`, `campaign_medium`, `campaign_name` y `campaign_content` a `gtag('config', 'G-QTSNJPFR93', ...)`, antes del primer `page_view`. Los eventos posteriores heredan ese ámbito de configuración; no se añaden overrides de campaña a los clics, un segundo `config`, un evento `campaign_details` ni un `session_start` manual. No se modifican el `set` global, `page_location`, `page_referrer` ni `ignore_referrer`.

La política admite únicamente códigos comerciales aprobados, además de exigir el patrón `^[a-z][a-z0-9_-]*$` y límites de longitud:

| Parámetro | Valores admitidos | Longitud máxima |
| --- | --- | --- |
| `utm_source` | `fb`, `facebook`, `ig`, `instagram` | 16 |
| `utm_medium` | `paid_social` | 16 |
| `utm_campaign` | `rey_navidad_oct2026` | 64 |
| `utm_content` | `anuncio_1_foto` | 64 |

Fuente, medio y campaña son obligatorios para transmitir la combinación. Contenido es opcional; si aparece, debe ser válido. Si cualquiera de los cuatro parámetros admitidos está duplicado, vacío, excede su límite o contiene un valor no aprobado, se omite toda la combinación sin impedir la medición consentida. No se recortan ni normalizan valores para convertir entradas sospechosas en válidas. `utm_term`, otros UTM y el resto de la query no se extraen ni se envían. La lista cerrada impide que un nombre o identificador personal que parezca un slug se acepte como campaña; futuras campañas o creatividades requieren revisar y ampliar explícitamente esta lista.

No se leen los valores de campaña antes del consentimiento, no se guardan en cookies ni storage y no se conservan entre documentos. La aceptación tardía puede utilizar los UTM si siguen en la URL; regresar desde una página legal mediante un enlace limpio puede perderlos. La recarga con permiso vigente vuelve a validar la URL actual. No se reproducen visitas ni clics anteriores a la aceptación.

La configuración sigue la [referencia de campos de GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) y el [ámbito y precedencia de parámetros de Google tag](https://developers.google.com/tag-platform/gtagjs/reference#parameter_scope). Las pruebas aisladas pueden verificar validación, consentimiento, orden de comandos y herencia simulada, pero no acreditan el procesamiento real de adquisición de sesiones. Tras publicación autorizada, comprobar los campos de campaña en las solicitudes y DebugView, y después las dimensiones de adquisición **de la sesión**, sin confundirlas con dimensiones de evento o primer usuario. No añadir `session_start` para intentar corregir informes.

La minimización del referente sigue limitando la atribución de visitas sin UTM admitidos. Esta actualización no recupera campañas históricas ni modifica informes o ajustes remotos. Google recibe necesariamente datos técnicos de conexión cuando se solicita su etiqueta autorizada. La ausencia de datos personales en los parámetros propios no convierte la medición en anónima.

## Revisión de GA4 realizada el 9 de octubre de 2026

- En el flujo, se desactivaron las vistas por cambios de historial y las seis mediciones opcionales: desplazamientos, clics salientes, búsqueda, formularios, vídeo y descargas. Las cargas de página son una opción obligatoria de Google; el código existente mantiene `send_page_view: false` y envía una sola vista manual.
- En la etiqueta `G-QTSNJPFR93` / `GT-MQ766GDB`, se desactivaron igualmente la detección de historial, desplazamientos, clics salientes, formularios, vídeos y descargas.
- Se desactivaron las funciones de datos proporcionados por usuarios y su detección automática (correo, teléfono, nombre/dirección).
- La etiqueta mostraba únicamente el destino Analytics **Creaciones Franyelis - Web**; el flujo indicaba **0 etiquetas de sitio conectadas**. No se añadieron destinos ni etiquetas de Ads.
- No se aceptaron términos de datos de usuarios, ni se configuraron Google Signals, conversiones mejoradas, personalización, compra o reserva pagada. Los parámetros de privacidad del código permanecen intactos.
- La cuenta indicaba que todavía no recibía datos. Las pruebas de esta actualización usan proveedores simulados y no acreditan recepción real en DebugView. La recepción se comprobará tras una publicación autorizada o una prueba conectada expresamente acordada.

## Procedimiento para futuras activaciones o cambios

1. Revisar la propiedad y el flujo web de GA4. Desactivar la medición mejorada de cambios de historial, clics salientes, formularios, búsqueda, vídeo y descargas. `send_page_view: false` evita la vista automática del snippet, pero los cambios de historial y otros eventos configurados en la consola pueden seguir funcionando independientemente. La medición automática de clics salientes puede recopilar `link_url`, incluida la URL de WhatsApp; por eso debe quedar desactivada antes de autorizar la integración.
2. Revisar los ajustes de detección automática del Google tag, destinos asociados y cualquier etiqueta combinada. Ningún destino sin consentimiento debe activarse por configuraciones remotas, etiquetas compartidas, GTM o snippets adicionales. No añadir Google Signals, datos proporcionados por usuarios, conversiones mejoradas, audiencias de remarketing ni personalización publicitaria.
3. Crear en Ads una acción explícita de clic/lead de contacto, **no reserva pagada**. Para contactos, revisar el recuento **Una** por interacción publicitaria. Este ajuste de Ads no sustituye la protección local contra duplicar un mismo evento del navegador.
4. Elegir una sola fuente principal en Ads: la conversión directa implementada aquí. Si se vincula GA4 y se importa el mismo `whatsapp_click`, no contar también esa importación como una segunda conversión principal. No crear una conversión automática por URL ni por todos los clics salientes.
5. Confirmar retención, tratamiento de datos, ubicación/configuración de cuentas y descripción de cookies efectivamente observadas. Actualizar la política si cambian los servicios aprobados. La implementación local no puede verificar ajustes de una cuenta a la que no se ha dado acceso.
6. Tras aprobar los puntos anteriores, completar los IDs reales y establecer `prerequisitesReviewed: true` y `enabled: true` solo para el destino aprobado. La lista de hosts admite únicamente los dominios públicos de Creaciones Franyelis y HTTPS. El Preview y localhost permanecen sin medición de Google; una prueba conectada requiere una autorización y configuración de QA separadas, no reutilizar silenciosamente Production.
7. Ejecutar pruebas de red con Tag Assistant/DebugView y Ads, verificando los cuatro escenarios de consentimiento, destinos, cookies y un clic real por acción. No afirmar recepción real o atribución publicitaria a partir de pruebas aisladas del código.

## Limitaciones y verificación actual

Con el ID oficial y la configuración final se verifican los controles con destinos simulados en un entorno aislado, sin conexión con Google. Se prueban también las exclusiones de localhost, Preview y páginas legales. No se afirma una prueba de recepción real en GA4. GA4 puede generar sus eventos técnicos habituales de sesión/engagement al activarse; la tabla define los cuatro eventos propios de la landing, no promete que sean los únicos eventos técnicos del proveedor. El bloqueo inicial es básico: no hay pings sin consentimiento ni etiquetas cargadas mientras no exista permiso válido. Una actualización/revocación de Consent Mode en una etiqueta ya ejecutada puede comunicar esa instrucción al proveedor; la recarga segura impide continuar con ese código en el documento siguiente. La retirada no es retroactiva sobre información ya transmitida.

## Documentación oficial consultada

- [Consent Mode básico y avanzado](https://developers.google.com/tag-platform/security/concepts/consent-mode).
- [Configuración de Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent).
- [Referencia de Google tag y destinos](https://developers.google.com/tag-platform/gtagjs/reference).
- [Enrutamiento explícito de eventos](https://developers.google.com/tag-platform/gtagjs/routing).
- [Vistas manuales y medición mejorada](https://developers.google.com/analytics/devguides/collection/ga4/views).
- [Parámetros de privacidad y página de GA4](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).
- [Medición mejorada y parámetros automáticos](https://support.google.com/analytics/answer/9216061?hl=en).
- [Conversiones con Google tag](https://developers.google.com/tag-platform/devguides/conversions).
- [Recuento de conversiones de Ads](https://support.google.com/google-ads/answer/3438531?hl=en).
