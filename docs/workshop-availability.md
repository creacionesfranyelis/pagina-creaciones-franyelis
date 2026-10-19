# Cierre de inscripciones: 24 y 25 de octubre de 2026

## Estado confirmado por la organización

El 19 de octubre de 2026, el titular confirmó expresamente que **las jornadas del sábado 24 y del domingo 25 de octubre tienen todos sus cupos completos**. No hay nuevas fechas autorizadas.

La landing muestra ambas fechas completas, sin contador, cifras de reservas, cupos restantes ni barra de ocupación. No se deriva ni publica una cantidad vendida a partir de una capacidad teórica. El estado procede de la confirmación del titular; no se declara una comprobación documental independiente.

## Cierre estático y seguro

Se retiran `assets/js/workshop-availability.js`, `content/workshop-availability.json` y la carga del antiguo módulo. La disponibilidad se comunica directamente en el HTML. No hay lectura de inventario, actualización automática ni un modo de respaldo que vuelva a anunciar plazas habilitadas.

El aviso y los CTA de consulta permanecen correctos sin JavaScript, ante fallos de red o si un navegador conserva una respuesta antigua del antiguo JSON. Los precios, pagos y bonos que se conservan se identifican como antecedentes de estas ediciones o condiciones de las inscripciones existentes; no son una oferta para nuevas reservas.

Todos los CTA dirigidos a posibles nuevos participantes permiten únicamente **«Consultar próximos talleres»** en el WhatsApp oficial +56 9 3319 3773, con este texto:

> Hola, vi que los cupos del curso de Pan de Jamón están agotados. Me gustaría recibir información cuando abran una nueva fecha

La consulta la inicia voluntariamente el visitante. No confirma reservas, no solicita un nuevo pago, no crea una base de contactos ni una suscripción automática.

## Control administrativo de futuras actualizaciones

1. Almerida Shop SpA conserva el registro real de participantes y pagos fuera de Git y de las carpetas públicas, con acceso restringido.
2. Una nueva fecha, una reapertura o un cambio de disponibilidad requiere confirmación expresa del titular. Una cancelación no vuelve a abrir automáticamente las inscripciones en la web.
3. Una persona con acceso autorizado al repositorio prepara una edición aislada y revisa conjuntamente HTML, CTA, WhatsApp, condiciones y datos estructurados.
4. Se obtiene autorización de publicación antes de commit, push, merge o despliegue. La modificación local no cambia Production.
5. Solo si posteriormente se aprueba un inventario numérico se define y valida una nueva fuente agregada fiable. Nunca se calculan reservas desde clics, visitas o eventos de analítica.

No existe panel administrativo público, formulario de edición, servicio de escritura ni endpoint que permita modificar reservas. No se publican nombres, teléfonos, comprobantes o datos bancarios.

## Privacidad y medición

El cierre no agrega cookies, almacenamiento, servicios externos ni eventos. Se conservan GA4, Meta Pixel, Consent Mode v2 y UTM. Un clic de consulta a WhatsApp sigue representando intención de contacto; no acredita compra, pago ni reserva confirmada. El estado de disponibilidad no concede consentimiento ni altera las campañas.
