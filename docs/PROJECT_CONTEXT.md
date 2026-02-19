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
  2. Bot conversa y precalifica.
  3. Bot solicita numero telefonico.
  4. Bot muestra consentimiento de contacto en lenguaje claro.
  5. Usuario acepta expresamente.
  6. AICloser ejecuta llamada outbound en menos de 60 segundos.
- El flujo comercial de cierre cambia: no se prioriza llamada manual o WhatsApp como paso final del demo; el handoff primario es redireccion automatica a pagina/landing de IACloser.
- Lead Chat debe funcionar tambien para clientes sin website como pagina publica full-screen (link compartible), independiente del script embebible.

## Integracion de datos a IACloser (contexto funcional)
- Durante la conversacion, Lead Chat acumula informacion de calificacion y la prepara para handoff.
- Antes de iniciar outbound, frontend/backend deben enviar un payload JSON a la API de IACloser con consentimiento previo.
- Campos minimos requeridos por negocio:
  - `name` (nombre)
  - `phone` (numero para llamada)
  - `collected_info` (informacion recopilada por el chat)
- Se debe incluir ademas trazabilidad de consentimiento (ej. `consent.accepted`, `consent.accepted_at`, `consent.text_version`) para auditoria.
- Si el usuario no acepta consentimiento expreso, el sistema no debe disparar handoff ni llamada outbound.

## Reglas UI/UX
- Mobile-first.
- Estados de carga/error/vacio en dashboards.
- Landing `/partners` con bloques de confianza (testimonios en carrusel horizontal) y FAQ en acordeon accesible.
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
- El dashboard expone controles Lead Chat-only (headline/subheadline, popup de oferta, CTA y mensajes de actividad en vivo) con aviso de alcance exclusivo para la pagina Lead Chat.
