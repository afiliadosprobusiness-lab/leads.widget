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
- En la experiencia publica de Lead Chat, la oferta comercial no se muestra como modal inicial; aparece de forma inline cuando la conversacion ya tiene intencion.
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
- Testimonios de landing principal usan scroll horizontal con autoavance (desktop/mobile), controles prev/next y avatar por caso para reforzar prueba social.
- Lead Chat (`/lead-chat/:identity`) usa layout inmersivo centrado en el chat (alto casi completo en desktop/mobile), deja espacio inferior para avisos dinamicos y mantiene consentimiento/handoff inline dentro del flujo principal del chat (sin panel lateral de opciones).
- Lead Chat desktop prioriza UX centrada (ancho contenido acotado), estilo visual premium tipo glass y tarjeta de testimonios con efecto tornasol dinamico al hover.
- Composer de Lead Chat incluye selector rapido de emojis, entrada por voz (speech-to-text) y control sutil de tema claro/oscuro para mejorar retencion de uso.
- Lead Chat agrega microcopy de reduccion de friccion debajo del input (`Demo real sin costo`, `Llamada en menos de 2 minutos`, `Sin tarjeta de credito`) y una barra superior de prueba social (`3 personas probando la demo ahora`).
- Quick replies de Lead Chat y `SalesWidget` usan una sola fila con scroll horizontal suave (sin wrap) para mantener CTA compactos en todas las resoluciones.
- Lead Chat consume `language` del widget config para defaults EN/ES (mensaje inicial, quick replies, consentimiento, estados y copys de conversion).
- Widget embebido (`public/widget-embed.js`) replica mejoras de retencion: quick replies en una sola fila con scroll horizontal (mobile-first), selector de emojis, entrada por voz y toggle sutil claro/oscuro.
- Widget embebido usa ingles por defecto y permite cambiar en 1 clic a espanol desde el header, aplicando textos UI y testimonios rotativos.
- Widget embebido actualiza defaults comerciales EN/ES (mensaje de apertura y quick replies) al enfoque de llamada en menos de 2 minutos.
- Widget embebido muestra una barra de testimonios en la parte baja del panel (entre mensajes e input) con glow de transicion en cada cambio para reforzar prueba social sin interrumpir el chat.
- Lead Chat reemplaza el toast de `Live activity` por una barra inferior de testimonios con glow de transicion sincronizado al rotador de testimonios.
- El widget comercial (`SalesWidget`) tambien esta activo en `/partners`.
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
- Firestore rules ampliadas para colecciones partner, manteniendo mutacion directa restringida a superadmin en cliente web.
- Superadmin incorpora fallback de compatibilidad a Firestore para modulo de agencias cuando el backend aun no expone `/api/admin/partners*` en el entorno desplegado.
- Eliminacion de usuario desde superadmin usa borrado completo (Firebase Auth + datos principales), no solo soft delete.
- En Superadmin/Agencias, la accion de payout es contextual: muestra `Aprobar payout` o `Marcar pagado` segun existan payouts pendientes.
- Plan PLUS: branding del widget admite `branding_text` y `branding_link` para personalizar texto y URL del footer (fallback seguro a `/crear-ahora?ref=<clientId>`).
- En `experience_mode=lead_chat`, el dashboard prioriza compartir enlace publico del chat; no depende de instalar script en una web.
- El dashboard expone controles Lead Chat-only (eyebrow del header, headline/subheadline, badge superior, bloque de oferta inline, CTA y mensajes de actividad/testimonios) con aviso de alcance exclusivo para la pagina Lead Chat.
- En dashboard, los defaults de Lead Chat quedan alineados al guion de conversion en 3 pasos y el selector de idioma (`es/en`) puede aplicar automaticamente copy EN/ES mientras no se haya personalizado manualmente.
- En IA > Prompt del Sistema, el dashboard ahora incluye plantillas predefinidas editables (campos `[REEMPLAZA_*]`) y prioriza flujo USA de llamada con consentimiento usando `ICALLCLOSER_READY`.
- `WHATSAPP_REDIRECT` se mantiene como opcion secundaria; la guia permite alternar comando (ICallCloser/WhatsApp) e insertarlo al prompt con un boton.
- En configuracion Lead Chat, la URL de redireccion post-consentimiento queda fija en `https://ai-call-closer.vercel.app/` y no es editable desde dashboard.
