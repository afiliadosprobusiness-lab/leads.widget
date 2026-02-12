# Lead Widget (Frontend) - Project Context

## Objetivo de negocio
Lead Widget convierte trafico en leads: un widget embebible (chat + formularios) configurable desde un dashboard. El usuario instala un script una sola vez y luego los cambios se reflejan al refrescar la web (config se carga desde Firestore / backend). Incluye planes, pagos y modulo de afiliados.

## Tech Stack
- App: React 18 + TypeScript + Vite
- UI: TailwindCSS + shadcn/ui (Radix UI) + lucide-react
- Routing: react-router-dom
- Data: Firebase (Web SDK: Auth + Firestore) + listeners realtime
- i18n: i18next + react-i18next
- Pagos: PayPal SDK (y flujos manuales locales cuando aplique)
- Deploy: Vercel (frontend)

## Arquitectura (decisiones clave)
- Configuracion centralizada:
  - Los ajustes del widget (branding, colores, prompts, testimonios, etc.) se guardan en Firestore.
  - El script embebible se sirve desde el backend externo (`leads.widget.backend`) para mantener compatibilidad con multiples CMS y controlar el payload.
- Tracking declarativo:
  - El dashboard solo permite configurar `facebook_pixel_id`, `tiktok_pixel_id` y `google_tag_id` en `widget_configs`.
  - No se admite ni persiste codigo arbitrario de tracking desde UI.
  - IDs se normalizan y validan antes de guardar; valores vacios se guardan como `null`.
  - Firestore Rules bloquea `custom_tracking_code` y `custom_code` en create/update de `widget_configs`.
- IA:
  - El frontend nunca debe llamar directo a OpenAI.
  - El chat del widget consume el backend (`/api/chat`) que usa `OPENAI_API_KEY`.
- Afiliados:
  - Los enlaces de referido se atribuyen al registrar usuarios; la integridad se valida en backend.
- Seguridad:
  - Secrets (OpenAI/PayPal/Firebase Admin) solo en Cloud Run.
  - En Vercel, solo `VITE_*` publicas.

## Reglas UI/UX
- Mobile-first con dashboard usable en telefonos.
- Realtime "sin romper": el usuario no debe reinstalar scripts; solo refrescar para ver cambios.
- Estados obligatorios:
  - Carga, error de permisos (Firestore rules), y vacios con mensajes accionables.
- Accesibilidad:
  - Labels/inputs correctos, foco visible, contraste AA.
- Landing:
  - Se retiraron los bloques promocionales de instalacion nativa en WordPress y de integracion nativa con Shopify.
  - Se agrego una seccion de testimonios con carrusel responsive e i18n (`landing_testimonials`).
  - Se elimino la ruta/pagina publica de afiliados (`/afiliados`) en este proyecto.
  - Footer legal enlazado a paginas dedicadas: `/legal/privacy`, `/legal/terms`, `/legal/claims`.

## Convenciones de codigo
- TypeScript (evitar `any`).
- Reusar componentes `src/components/ui/*`.
- Los scripts embebibles deben ser robustos:
  - No depender de DOM especifico del sitio.
  - Evitar colisiones CSS (namespacing/clases del widget).

## Configuracion (resumen)
- Firebase Web config (Vercel): `VITE_FIREBASE_*`
- Admin: `VITE_ADMIN_EMAIL` (superadmin)
- Backend URL publica: `VITE_BACKEND_URL` (o equivalente)
- Firestore rules:
  - Separan permisos usuario vs superadmin (ver `firestore.rules`).
