# Lead Widget - Contexto Arquitectonico

Documento primario derivado del codigo observable en `src/`, `api/`, `public/`, `vercel.json` y `docs/contract.md`.

## Proposito del producto

Lead Widget es un frontend SaaS para captacion y operacion comercial. Combina:

- widget embebible para capturar leads
- experiencia publica `Lead Chat`
- dashboard cliente para configuracion, analitica, seguridad, billing y CRM legacy
- portal partner separado

## Stack confirmado

- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui (Radix)
- react-router-dom para rutas
- Firebase Web SDK para Auth, Firestore y Storage
- Vercel como capa de hosting/serverless

## Estructura principal del frontend

- `src/pages/`: pantallas principales. `Dashboard.tsx` concentra el dashboard cliente.
- `src/components/`: componentes reutilizables de UI y negocio.
- `src/components/ui/`: primitives shadcn/ui.
- `src/lib/`: helpers y normalizadores puros.
- `public/widget-embed.js`: widget publico embebible.
- `api/`: funciones serverless locales para rutas `/api/*`.

## Rutas principales detectadas

- `/`: landing principal
- `/app`: dashboard cliente
- `/partners`: landing partner
- `/partner`: dashboard partner
- `/lead-chat/:identity` y `/lc/:identity`: experiencia publica Lead Chat

## Modulos funcionales observados

- Configuracion del widget y branding
- Configuracion IA y prompts
- CRM legacy operativo en el dashboard cliente
- Analiticas y consola de conversaciones IA
- Seguridad y bloqueos
- Billing y cambio de plan
- Portal partner

## Estado y manejo de datos

- `Dashboard.tsx` usa `useState`, `useMemo` y `useEffect` para la mayor parte del estado local.
- Firestore se consulta directamente desde cliente para perfiles, configs y varias vistas legacy.
- CRM v2 usa endpoints locales `/api/crm*` para merge/contactos/deals/tasks/timeline.
- Desde marzo 2026 existe una capa visual local-only de `Adquisicion` en `/app`:
  - vive en memoria del dashboard
  - usa dataset mock local
  - no persiste en Firestore
  - no crea nuevos endpoints frontend en esta fase
  - al aprobar, inserta contactos solo en el estado local de `crmContacts` con `source = acquisition_google_places`

## Integraciones externas reales detectadas

- Firebase Auth / Firestore / Storage
- PayPal
- Cloudinary (cuando hay env vars configuradas)
- backend HTTP externo via rewrites `/api/*`
- funciones locales Vercel para CRM, Meta CAPI, debug y utilidades administrativas

## Variables y configuracion relevante

- `vercel.json` prioriza funciones locales `api/*.js` antes del fallback al backend externo.
- El dashboard cliente distingue planes `trial`, `crm` y `pro` (con compatibilidad legacy `plus`).
- El plan `crm` mantiene bloqueo visual sobre tabs avanzados; en la UI actual quedan accesibles `CRM`, `Pagos` y `Cuenta`.

## Decisiones arquitectonicas observables

- Se privilegia evolucion sobre reemplazo: `Dashboard.tsx` concentra mucha logica pero reutiliza primitives consistentes.
- El CRM cliente sigue vivo por compatibilidad operativa aunque parte del negocio diario migro a WhatsWidget CRM.
- La nueva experiencia de adquisicion se implementa como extension visual del dashboard existente, no como modulo separado.

## Restricciones confirmadas

- No introducir dependencias nuevas sin justificacion fuerte.
- Mantener consistencia con patrones actuales del dashboard.
- Evitar romper contratos actuales de `/api/*`.

## Pendientes de validacion

- No confirmado en el repositorio si la futura persistencia de adquisicion vivira en el backend externo o en funciones locales Vercel.
- Pendiente de validacion la estrategia final de scoring server-side para adquisicion; en frontend actual solo existe mock visual.
