# Disponibilidad de la jornada del 24 de octubre de 2026

## Estado actual informado por la organización

El 13 de octubre de 2026, el titular confirmó **4 reservas para el 24 de octubre** en respuesta a la consulta sobre abonos verificados y confirmaciones enviadas por WhatsApp. La actualización manual se registró a las 04:32:38 de Santiago (`2026-10-13T07:32:38.000Z`). La cifra procede de esa confirmación del titular; la web no consulta registros bancarios ni presume una verificación documental independiente.

El archivo agregado usa `manual_verified`, capacidad 15 y `confirmedReservations: 4`. Por ello la página muestra **4 reservas confirmadas, 11 cupos restantes y una barra del 26,7 %**. El Hero y el componente usan el mismo archivo, sin duplicar el inventario ni sumar clics. La fecha de última comprobación manual permanece visible.

## Modo de respaldo sin cifra verificada

La capacidad oficial es de **15 cupos**. Si no hay una cifra fiable confirmada por la organización, `content/workshop-availability.json` debe conservar `status: "unverified"`, `confirmedReservations: null` y `verifiedAt: null`.

En ese modo de respaldo, la página muestra únicamente **«15 cupos habilitados»**. Esto expresa capacidad inicial; no afirma que hoy queden 15 cupos. Los valores de reservas confirmadas, cupos restantes y la barra permanecen ocultos. No se cuenta ninguna visita, clic o conversación de WhatsApp como reserva.

## Actualización manual con acceso controlado

1. Una persona autorizada de Almerida Shop SpA revisa el registro privado de participantes, verifica los abonos y las confirmaciones enviadas por WhatsApp. Debe conciliar cancelaciones/devoluciones que correspondan antes de calcular el total.
2. Esa persona edita solamente el archivo público agregado `content/workshop-availability.json` a través del repositorio con acceso restringido. El registro de participantes, nombres, teléfonos, comprobantes y demás datos personales nunca se incluye en este archivo ni en Git.
3. Se cambia `status` a `"manual_verified"`, se asigna a `confirmedReservations` un entero real entre 0 y 15 y a `verifiedAt` la fecha/hora efectiva de la conciliación en formato UTC ISO, con milisegundos y Z. No se inventa ni se anticipa una fecha de comprobación.
4. Otra persona autorizada revisa el cambio y se obtiene la autorización de publicación correspondiente antes de realizar commit, push o despliegue. La edición local por sí sola no cambia Production.
5. Tras publicar, se comprueba la cifra y la fecha de la última revisión en la página. Debe mantenerse una rutina de conciliación conforme haya nuevas reservas. El contador describe la última revisión manual y no se presenta como inventario en tiempo real.
6. Si se pierde la fiabilidad de los datos o no se puede conciliar el registro, se restablecen `unverified`, `null`, `null` y se publica esa retirada mediante el mismo procedimiento controlado.

No se crea panel administrativo público, formulario de edición, servicio de escritura ni endpoint que permita modificar reservas. Los permisos de acceso al repositorio y el proceso de aprobación existente controlan la actualización.

## Contrato y validación

Campos exactos admitidos: `schemaVersion`, `workshopDate`, `timeZone`, `capacity`, `status`, `confirmedReservations`, `verifiedAt`.

Valores fijos: versión 1, fecha `2026-10-24`, zona `America/Santiago`, capacidad 15. Cualquier campo adicional, versión/fecha/capacidad distinta, cifra fraccionaria, negativa o superior a 15, marca de tiempo inválida/futura o estado no reconocido mantiene el modo sin contador. Lo mismo ocurre si falla la descarga, el JSON o se exceden 2048 caracteres. La fecha de revisión se muestra en hora de Santiago.

Cuando se han confirmado las 15 reservas, el componente muestra **«24 de octubre — ¡Cupos completos!»** y sustituye todos los mensajes de WhatsApp oficiales de la página por una consulta sobre próximas jornadas. Las etiquetas de los CTA marcados `data-reservation-cta` cambian a «Consultar próximas jornadas». Los atributos de medición existentes se conservan y no se añade ningún evento. Como protección adicional, el responsable debe retirar las invitaciones estáticas de reserva al cerrar esa jornada; sin JavaScript o ante un fallo de red, el sitio conserva su contenido estático.

## Privacidad y medición

Se realiza una sola lectura de un JSON local del mismo origen, sin credenciales y sin referrer. No se emplean cookies, almacenamiento, datos personales, servicios externos, píxeles ni eventos de analítica. No se altera GA4, Meta Pixel, Consent Mode ni la captura de UTM. El estado de disponibilidad nunca concede consentimiento.

Este archivo no contiene reglas del ebook, precios, pagos, devoluciones ni cambios de fecha. Esas condiciones permanecen en el contenido comercial aprobado.
