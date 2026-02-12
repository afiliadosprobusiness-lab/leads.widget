# Lead Widget (Frontend) — Project Context

## Objetivo de negocio
Lead Widget convierte tráfico en leads: un widget embebible (chat + formularios) configurable desde un dashboard. El usuario instala un script una sola vez y luego los cambios se reflejan al refrescar la web (config se carga desde Firestore / backend). Incluye planes, pagos y módulo de afiliados.

## Tech Stack
- App: React 18 + TypeScript + Vite
- UI: TailwindCSS + shadcn/ui (Radix UI) + lucide-react
- Routing: react-router-dom
- Data: Firebase (Web SDK: Auth + Firestore) + listeners realtime
- i18n: i18next + react-i18next
- Pagos: PayPal SDK (y flujos manuales locales cuando aplique)
- Deploy: Vercel (frontend)

## Arquitectura (decisiones clave)
- Configuración centralizada:
  - Los ajustes del widget (branding, colores, prompts, testimonios, etc.) se guardan en Firestore.
  - El script embebible se sirve desde el backend externo (`leads.widget.backend`) para mantener compatibilidad con múltiples CMS y controlar el payload.
- Tracking:
  - El dashboard permite configurar `facebook_pixel_id`, `tiktok_pixel_id`, `google_tag_id` y `custom_tracking_code` en `widget_configs`.
  - Estos campos se sanitizan/validan en frontend y backend antes de inyectarse en el script embebido.
- IA:
  - El frontend nunca debe llamar directo a OpenAI.
  - El chat del widget consume el backend (`/api/chat`) que usa `OPENAI_API_KEY`.
- Afiliados:
  - Los enlaces de referido se atribuyen al registrar usuarios; la integridad se valida en backend.
- Seguridad:
  - Secrets (OpenAI/PayPal/Firebase Admin) solo en Cloud Run.
  - En Vercel, solo `VITE_*` públicas.

## Reglas UI/UX
- Mobile-first con dashboard usable en teléfonos.
- Realtime “sin romper”: el usuario no debe reinstalar scripts; solo refrescar para ver cambios.
- Estados obligatorios:
  - Carga, error de permisos (Firestore rules), y vacíos con mensajes accionables.
- Accesibilidad:
  - Labels/inputs correctos, foco visible, contraste AA.
- Landing:
  - Se retiraron los bloques promocionales de instalación nativa en WordPress y de integración nativa con Shopify.
  - Se agregó una sección de testimonios con carrusel responsive e i18n (`landing_testimonials`).

## Convenciones de código
- TypeScript (evitar `any`).
- Reusar componentes `src/components/ui/*`.
- Los scripts embebibles deben ser robustos:
  - No depender de DOM específico del sitio.
  - Evitar colisiones CSS (namespacing/clases del widget).

## Configuración (resumen)
- Firebase Web config (Vercel): `VITE_FIREBASE_*`
- Admin: `VITE_ADMIN_EMAIL` (superadmin)
- Backend URL pública: `VITE_BACKEND_URL` (o equivalente)
- Firestore rules:
  - Separan permisos usuario vs superadmin (ver `firestore.rules`).
