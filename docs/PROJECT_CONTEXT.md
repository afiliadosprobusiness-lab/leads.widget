# Lead Widget (Frontend) - Project Context

## Objetivo de negocio
Lead Widget convierte trafico en leads con widget embebible + dashboard cliente. Desde 2026-02-16 se agrego canal B2B2B "Partners Leads Widget" con landing publica y dashboard de agencias separado.

## Tech Stack
- App: React 18 + TypeScript + Vite
- UI: TailwindCSS + shadcn/ui (Radix UI) + lucide-react
- Routing: react-router-dom
- Data: Firebase Web SDK (Auth + Firestore)
- Pagos: PayPal SDK + reporte manual Yape/Plin
- Deploy: Vercel

## Arquitectura (decisiones clave)
- Dashboard cliente (`/app`) se mantiene compatible; modulo de afiliados fue deprecado en UI (data historica se conserva en Firestore).
- Nuevo portal partner separado:
  - Landing: `/partners`
  - Login partner: `/login?portal=partner`
  - Registro partner: `/register?account=partner`
  - Dashboard partner: `/partner`
- Auth/roles frontend ahora distingue `client`, `superadmin`, `partner_admin`, `partner_staff` y redirige segun rol.
- Integracion partner siempre via backend (`/api/partners/*`, `/api/admin/partners/*`) para garantizar scoping server-side por `partner_id`.
- Footer landing incluye enlace directo a "Partners Leads Widget".
- Se incorpora experiencia `Lead Chat` como ruta publica (`/lead-chat/:identity`, alias `/lc/:identity`) con flujo full-screen de conversion.

## Flujos principales
- Registro cliente referido:
  - Soporta `partner_code` e `invite` en query/localStorage (`leadwidget_partner_code`, `leadwidget_partner_invite`).
  - `ref` legacy de afiliados sigue aceptado para compatibilidad.
- Registro partner:
  - `account=partner` crea agencia y asigna rol `partner_admin`.
  - Invitaciones internas usan `invite` y asignan `partner_staff` o `partner_admin`.
- Billing cliente:
  - Verificacion PayPal ahora envia Authorization Bearer token al backend.
  - Pagos manuales Yape/Plin guardan `plan_type` y `partner_id` cuando aplica.

## Objetivo activo Lead Chat + IACloser (2026-02-19)
- Nuevo objetivo comercial del canal chat:
  1. Usuario abre chat.
  2. Bot abre con mensaje orientado a resultado economico inmediato (llamada en <2 minutos) y botones de accion.
  3. Flujo de conversion en 3 pasos: objetivo, telefono + consentimiento, activacion emocional.
  4. Bot solicita numero telefonico y muestra consentimiento de contacto en lenguaje claro.
  5. Usuario acepta consentimiento via checkbox obligatorio; frontend envia consentimiento expreso (`SI`/`YES`) al backend para handoff.
  6. AICloser ejecuta llamada outbound en menos de 2 minutos y la UI muestra estado `IA llamando...`.
- El flujo comercial de cierre cambia: no se prioriza llamada manual o WhatsApp como paso final del demo; el handoff primario es redireccion automatica a pagina/landing de IACloser.
- Lead Chat debe funcionar tambien para clientes sin website como pagina publica full-screen (link compartible), independiente del script embebible.
- En la experiencia publica de Lead Chat, no se muestra bloque de oferta comercial inline: el flujo va directo de conversacion a consentimiento/handoff para reducir friccion y evitar duplicidad con la estrategia de Prompt IA.
- La pagina Lead Chat ahora replica elementos de retencion del widget embebido: pop de intencion de salida en PC, teaser de recaptura y efecto de escritura en respuestas del asistente.

## Integracion de datos a IACloser (contexto funcional)
- Durante la conversacion, Lead Chat acumula informacion de calificacion y la prepara para handoff.
- Antes de iniciar outbound, frontend/backend deben enviar un payload JSON a la API de IACloser con consentimiento previo.
- Campos minimos requeridos por negocio:
  - `name` (nombre)
  - `phone` (numero para llamada)
  - `collected_info` (informacion recopilada por el chat)
- Se debe incluir ademas trazabilidad de consentimiento (ej. `consent.accepted`, `consent.accepted_at`, `consent.text_version`) para auditoria.
- Para disparar handoff, el consentimiento debe incluir respuesta afirmativa explicita (`consent.explicit_response = "SI"` o `YES`).
- Si el usuario no acepta consentimiento expreso, el sistema no debe disparar handoff ni llamada outbound.

## Reglas UI/UX
- Mobile-first.
- Estados de carga/error/vacio en dashboards.
- Landing `/partners` con bloques de confianza (testimonios en carrusel horizontal) y FAQ en acordeon accesible.
- Landing principal `/` ahora comunica dos modos de producto: widget embebible y Lead Chat como pagina publica sin web.
- Landing principal `/` muestra pricing comercial actualizado: `S/ 100` mensual + implementacion unica `S/ 200` (copy EN/ES).
- Landing principal `/` fue redisenada con estilo visual premium tipo Apple (glass + gradientes suaves), narrativa simplificada orientada a conversion, preview del widget embebido en hero y secciones actualizadas de capacidades/casos/testimonios/precio.
- Landing principal `/` incluye toggle claro/oscuro visible en navbar (desktop/mobile) y copy reforzado a conversion para trafico pago + cierre por llamada.
- Testimonios de landing principal usan scroll horizontal con autoavance (desktop/mobile), controles prev/next y avatar por caso para reforzar prueba social.
- Testimonios de landing principal, widget embebido y Lead Chat usan efecto visual tipo Instagram (anillo degradado + glow de transicion) para enfatizar prueba social sin bloquear lectura.
- En modo claro, las barras de testimonios de Lead Chat/widget embebido usan una variante visual mas sobria (menos saturada) para mejorar legibilidad sin perder el efecto de prueba social.
- Lead Chat (`/lead-chat/:identity`) usa layout inmersivo centrado en el chat (alto casi completo en desktop/mobile), deja espacio inferior para avisos dinamicos y mantiene consentimiento/handoff inline dentro del flujo principal del chat (sin panel lateral de opciones).
- Lead Chat desktop prioriza UX centrada (ancho contenido acotado), estilo visual premium tipo glass y tarjeta de testimonios con efecto tornasol dinamico al hover.
- Composer de Lead Chat incluye selector rapido de emojis, entrada por voz (speech-to-text) y control sutil de tema claro/oscuro para mejorar retencion de uso.
- En Lead Chat desktop, el toggle claro/oscuro se prioriza en el header derecho con realce visual suave para ubicacion rapida.
- Lead Chat incluye selector manual de idioma `ES/EN` en el header (desktop/mobile); cuando el usuario lo elige, las respuestas se fuerzan en ese idioma durante toda la interaccion.
- Lead Chat agrega microcopy de reduccion de friccion debajo del input (`Demo real sin costo`, `Llamada en menos de 2 minutos`, `Sin tarjeta de credito`) y una barra superior de prueba social con pulsacion leve y mensajes dinamicos de volumen (cifras creibles).
- Lead Chat actualiza el microcopy inferior del composer a formato compacto horizontal con emojis y badge de actividad en vivo para mejorar escaneo rapido en mobile/desktop.
- En Lead Chat, los mensajes teaser dinamicos (barra de captacion encima de quick replies/composer) cambian de idioma junto al selector `ES/EN`.
- En Lead Chat, la pildora superior de actividad (encima de testimonios) usa contador aleatorio dinamico entre `3` y `300` para reforzar prueba social sin saturar el header.
- En Lead Chat, cuando el asistente emite `ICALLCLOSER_READY`, el frontend abre siempre la tarjeta de consentimiento (nombre/telefono prellenados si el asistente los capturo). El handoff solo se ejecuta al enviar el formulario con checkbox de consentimiento obligatorio; luego muestra cuenta regresiva (`3..2..1`) y redirige.
- En la tarjeta de consentimiento de Lead Chat, `nombre` y `telefono` son obligatorios; el boton `Enviar` permanece deshabilitado hasta que ambos sean validos y el checkbox este aceptado.
- Quick replies de Lead Chat y `SalesWidget` usan una sola fila con scroll horizontal suave (sin wrap) para mantener CTA compactos en todas las resoluciones.
- Lead Chat consume `language` del widget config para defaults EN/ES (mensaje inicial, quick replies, consentimiento, estados y copys de conversion).
- Widget embebido (`public/widget-embed.js`) replica mejoras de retencion: quick replies en una sola fila con scroll horizontal (mobile-first), selector de emojis, entrada por voz y toggle sutil claro/oscuro.
- En Lead Chat/widget embebido/SalesWidget, la entrada por voz usa fallback `SpeechRecognition/webkitSpeechRecognition` y autoenvia el mensaje al terminar el dictado.
- En Lead Chat/widget embebido/SalesWidget, cuando el microfono esta activo se muestra un overlay inmersivo tipo "speak now" con animacion para feedback visual inmediato del estado de escucha.
- Lead Chat/widget embebido/SalesWidget interpretan comandos IA de redireccion tanto a WhatsApp como a IACloser (`WHATSAPP_REDIRECT`, `ICLOSER/ICALLCLOSER/IACALLCLOSER_REDIRECT` y alias `*_READY`), con CTA visible y apertura automatica del destino.
- Lead Chat/widget embebido/SalesWidget soportan mensajes multimedia de imagen en respuestas del asistente usando comandos `[IMAGE|IMG|PHOTO: ...]` (incluye variante JSON/pipe) y markdown `![alt](url)` con sanitizacion `http/https`.
- Lead Chat/widget embebido/SalesWidget soportan mensajes multimedia de audio en respuestas del asistente usando comandos `[AUDIO|VOICE|SOUND: ...]` con sanitizacion `http/https`.
- Dashboard permite adjuntar `imagen` y `audio` en el `mensaje de bienvenida`; esos medios se renderizan en Lead Chat y widget embebido desde `welcome_image_url` y `welcome_audio_url`.
- Si el endpoint publico `/api/widget-config/:identity` no devuelve `welcome_image_url/welcome_audio_url`, el widget embebido aplica fallback de lectura a Firestore para no perder multimedia de bienvenida.
- En Lead Chat/widget embebido/SalesWidget, las burbujas con audio fuerzan ancho minimo y muestran tarjeta visual de audio para evitar que el reproductor quede oculto cuando el texto es corto o vacio.
- En Lead Chat/widget embebido/SalesWidget, el reproductor de audio usa UI premium custom (controles play/mute y barra de progreso estilo glass) para mantener consistencia visual entre las 3 experiencias.
- En respuestas con imagen de Cloudinary, Lead Chat/widget embebido/SalesWidget aplican optimizacion de entrega a calidad media (`f_auto,q_auto:good,c_limit,w_960`) cuando la URL no trae transformaciones explicitas.
- En Lead Chat/widget embebido/SalesWidget, el flujo aplica presupuesto de audio dinamico por conversacion (maximo 1 adicional, o 2 en total si existe audio de bienvenida) para controlar costos.
- El popup de exit intent en Lead Chat/widget embebido fue ajustado para textos largos EN/ES (wrap de titulo/descripcion/CTA y botones sin overflow horizontal).
- En Lead Chat/widget embebido/SalesWidget, el idioma por defecto del chat es ingles; si el usuario escribe en espanol el flujo cambia automaticamente a espanol y continua en ese idioma.
- En Lead Chat/widget embebido/SalesWidget, los mensajes teaser de recaptura dentro del chat se muestran solo despues de que el usuario ya interactuo y luego queda inactivo (con animacion sutil de pulso para llamar la atencion sin ser intrusiva).
- Widget embebido usa ingles por defecto y permite cambiar en 1 clic a espanol desde el header, aplicando textos UI, saludo inicial y testimonios rotativos (incluyendo compatibilidad con textos legacy EN/ES).
- Widget embebido actualiza defaults comerciales EN/ES (mensaje de apertura y quick replies) al enfoque de llamada en menos de 2 minutos.
- Widget embebido muestra una barra de testimonios en la parte superior del panel (debajo del header) con glow de transicion en cada cambio para reforzar prueba social sin interrumpir el chat.
- Widget embebido agrega una pildora compacta de actividad encima de testimonios con contador aleatorio dinamico (`3` a `300`) y mensajes localizados EN/ES.
- Widget embebido muestra mensajes teaser dinamicos inline sobre el composer (sin reservar altura extra del layout) para no quitar espacio util al usuario.
- Los campos `teaser_messages` y `quick_replies` del Dashboard se aplican de forma compartida a widget embebido y Lead Chat.
- Lead Chat mantiene una barra superior de testimonios debajo del header (igual que el widget embebido), con glow de transicion en cada cambio para reforzar prueba social.
- Lead Chat reutiliza `lead_chat_live_toasts` (dashboard: mensajes de actividad en vivo) con aliases (`liveActivities`, `liveActivityMessages`) y shape Firestore (`arrayValue`/`stringValue`) para compatibilidad de payload. Si el endpoint publico no trae ese campo, hace fallback de lectura directa a Firestore para `widget_configs` por `lead_chat_slug/widget_id/user_id`.
- En Lead Chat, la barra de estado/acciones se mantiene arriba de testimonios en mobile y desktop; la tarjeta `Live activity` se muestra solo en desktop (`lg+`) para no quitar espacio util al usuario movil.
- En Lead Chat mobile, se oculta el CTA superior `Pre-qualifying` para reducir saturacion visual y se usa contenedor full-height (`100dvh`) sin espacios vacios fuera del chat.
- El widget embebido no muestra `lead_chat_live_toasts`; mantiene solo la barra superior de testimonios.
- El widget comercial (`SalesWidget`) tambien esta activo en `/partners`.
- El `SalesWidget` de landing replica la experiencia visual del embebido (header con acciones, barra de testimonios, composer con emoji/voz) y agrega selector de color con contraste automatico para mantener legibilidad.
- En `SalesWidget` de landing, el header mantiene selector de idioma + paleta de color + cierre (sin toggle de tema en header) para reducir ruido visual.
- Dashboard partner incluye secciones:
  - Ventas/Atribucion
  - Clientes
  - Branding
  - Comisiones
- En Partners/Clientes, `Prox. renovacion` usa `next_renewal_at` y contempla fallback derivado desde backend para cuentas activas sin dato historico.
- En Partners/Branding se edita solo `texto de marca` y `enlace de marca` (flujo simplificado); esos valores alimentan el fallback de branding para clientes PLUS.
- Dashboard partner prioriza un flujo simple (sin soporte/tickets ni gestion de usuarios internos en UI).

## Configuracion relevante
- Front usa rutas `/api/*` (rewrite a backend Cloud Run).
- `vercel.json` prioriza `filesystem` para que funciones locales `api/*.js` (ej. `api/chat.js`) se ejecuten antes del fallback `/api/*` al backend externo.
- Firestore rules ampliadas para colecciones partner, manteniendo mutacion directa restringida a superadmin en cliente web.
- Superadmin incorpora fallback de compatibilidad a Firestore para modulo de agencias cuando el backend aun no expone `/api/admin/partners*` en el entorno desplegado.
- Eliminacion de usuario desde superadmin usa borrado completo (Firebase Auth + datos principales), no solo soft delete.
- En Superadmin/Agencias, la accion de payout es contextual: muestra `Aprobar payout` o `Marcar pagado` segun existan payouts pendientes.
- Plan PLUS: branding del widget admite `branding_text` y `branding_link` para personalizar texto y URL del footer (fallback seguro a `/crear-ahora?ref=<clientId>`).
- En `experience_mode=lead_chat`, el dashboard prioriza compartir enlace publico del chat; no depende de instalar script en una web.
- El dashboard expone controles Lead Chat-only (eyebrow del header, headline/subheadline, badge superior y mensajes de actividad/testimonios) con aviso de alcance exclusivo para la pagina Lead Chat; la oferta inline se controla por estrategia conversacional desde Prompt IA.
- En Dashboard, acciones primarias de guardado (configuracion de widget y cuenta) usan barra sticky para mantener CTA visible durante scroll largo.
- En Dashboard > Configuracion del widget, el boton `Guardar Cambios` se fija arriba del formulario (sticky) con microcopy para que sea ubicable y evitar perdidas por no guardar.
- En dashboard, el CTA `Guardar Cambios` de la pestana Configuracion se muestra en una barra sticky superior del tab para que permanezca visible durante todo el scroll.
- En Dashboard > Configuracion del widget, la barra sticky de guardado usa layout compacto (sin huecos visuales), con offset responsive para que se vea correctamente en mobile y desktop sin perder area util.
- En mobile del widget embebido, el teaser de recaptura es mas compacto/suave, aparece a la izquierda del launcher flotante y al cerrarlo con `X` no vuelve a mostrarse hasta recargar la pagina.
- En dashboard, los defaults de Lead Chat quedan alineados al guion de conversion en 3 pasos y el selector de idioma (`es/en`) puede aplicar automaticamente copy EN/ES mientras no se haya personalizado manualmente.
- En Dashboard > Configuracion del widget > Lead Chat, los textos de encabezado (`eyebrow`, titulo, subtitulo, badge) se editan y reflejan directamente en la cabecera del Lead Chat; ademas se puede personalizar el titulo de la pestana del navegador (`lead_chat_page_title`).
- En Dashboard > IA, la configuracion de prompt se separa en 3 bloques: `Prompt de contexto`, `Mejoras IA` (solo lectura auto), y `Prompt del sistema`.
- En Dashboard > IA, `Prompt de contexto` y `Prompt del sistema` tienen boton `Crear prompt` con modal guiado para generar texto estructurado por formulario (negocio/nicho/reglas/comercial).
- En Dashboard > IA, el canal de cierre (`ICallCloser` o `WhatsApp`) se selecciona desde el modal `Crear prompt` del sistema; el comando se inserta automaticamente al compilar/guardar el prompt.
- En modales `Crear prompt` (contexto/sistema), existe accion `Generar con IA` que consume creditos de la API key OpenAI del cliente y muestra aviso explicito de costo; tambien se mantiene fallback `Generar rapido (sin IA)` local.
- En IA > Prompt del Sistema, el dashboard mantiene boton de plantilla por `Industria / Nicho` (`general`, `inmobiliaria`, `clinica`, `taller`, `delivery`; en `personalizado` usa base general), con enfoque de conversion y soporte de bloque `IMAGE`.
- En IA > Prompt del Sistema (plantillas por nicho), cuando el lead pregunta por precio/costo/inversion, el guion responde la oferta exacta: `S/ 100 mensual + S/ 200 implementacion unica`.
- En Dashboard > Billing, el esquema comercial activo es: `trial` (3 dias gratis) y `PLUS` (S/ 100 mensual); en activacion inicial se muestra `S/ 200` de implementacion unica + primer mes.
- `WHATSAPP_REDIRECT` se mantiene como opcion secundaria frente a `ICALLCLOSER_READY`; ya no se usa la guia manual de insercion, ahora el comando se agrega automaticamente segun el canal seleccionado.
- Upload de bienvenida en dashboard usa Cloudinary cuando existen `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET`; si no existen, usa fallback a Firebase Storage.
- En Dashboard > Configuracion del widget > Audio de bienvenida, ademas de subir archivo/URL ahora se puede grabar audio en el momento (microfono del navegador) y se sube por el mismo pipeline Cloudinary/Firebase.
- Para reducir costo de tokens, Lead Chat/widget embebido/SalesWidget ahora envian al backend una directiva compacta de respuesta y una ventana de historial acotada (ultimos 12 mensajes no-system).
- En Dashboard > IA, `ai_max_tokens` ahora respeta el valor persistido y se normaliza al rango `100..4000` al guardar (evita fallback visual involuntario a `500` tras recargar).
- En configuracion Lead Chat, la URL de redireccion post-consentimiento queda fija en `https://ai-call-closer.vercel.app/` y no es editable desde dashboard.
- En Dashboard > Analiticas, se agrego la `Consola de conversaciones IA` con historial por conversacion, estado (`ok/bloqueado/limite/error`), mensajes usuario/asistente y pista de mejora para depurar fallos del prompt.
- El proxy `POST /api/chat` ahora registra cada intercambio en `ai_chat_logs` (por `client_id/widget_id/conversation_id`) para auditoria y mejora continua del cierre.
- En Dashboard > Analiticas, la consola IA ahora clasifica conversaciones en `No completados`, `Lead completado` y `Riesgo/Hack`, con filtro adicional por estado tecnico (`ok/bloqueado/limite/error`).
- En Dashboard > Analiticas, la consola IA incluye una `Guia rapida` visible en la UI para que el equipo comercial interprete cada estado (`No completados`, `Lead completado`, `Riesgo/Hack`) sin depender de capacitacion externa.
- En Dashboard > Analiticas, los filtros tecnicos de estado (`ok/bloqueado/limite/error`) quedan ocultos por defecto y se muestran solo al activar `Ver diagnostico tecnico`, priorizando UX comercial simple.
- Lead Chat/widget embebido/SalesWidget reportan eventos de apertura (`whatsapp_open`/`iacallcloser_open`) a `POST /api/chat-event`; el dashboard usa esos eventos (`ai_chat_events`) para marcar `Lead completado`.
- En conversaciones `No completadas`, el dashboard ofrece `Analizar conversacion`: boton 1-click que llama `POST /api/analyze-conversation` y devuelve diagnostico (causas raiz, mejoras, patch de prompt y score de calidad).
- `Analizar conversacion` consume creditos de la API key OpenAI configurada por cliente (`ai_api_key`); la UI muestra aviso explicito de consumo para evitar sorpresas de costo.
- En el bloque `Parche de prompt`, la consola incluye CTA `Sugerencia de mejora de prompt` con modal de confirmacion. Al aceptar, agrega esa mejora a `ai_improvements_prompt` y recompila `ai_system_prompt` para guardarlo en `profiles` + `widget_configs`.
- `POST /api/analyze-conversation` exige token Firebase del dashboard y toma la key desde `profiles.ai_api_key` (fallback `widget_configs.ai_api_key` del owner), con fallback heuristico si no existe key.
- `ai_chat_logs` ahora incluye `command_flags` y `security_signal` para enriquecer la deteccion de conversion y riesgo.
