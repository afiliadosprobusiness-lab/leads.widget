# Contexto Arquitectonico - leads.widget

Snapshot derivado del codigo real del repo al 2026-03-20.

## Stack real

- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui + Radix
- Firebase Web SDK (Auth + Firestore)
- Vercel con `routes`, funciones locales `api/*.js` y fallback `/api/*` a backend externo configurable por `BACKEND_URL`

## Estructura observada

- `src/pages/Dashboard.tsx`: dashboard cliente principal, CRM legacy reactivado en UI y pestana `Adquisicion`
- `src/pages/PartnerDashboard.tsx`: portal partner
- `src/lib/*`: utilidades de chat, auth, tracking y helpers de dominio
- `api/*.js`: funciones serverless locales para rutas que no deben caer al backend externo (`chat`, `crm`, `meta-capi`, `debug`, etc.)
- `api/external/[...path].js`: proxy generico al backend externo usando `BACKEND_URL`
- `server/crm/*`: logica server-side del CRM local (`contacts-merge`, `deals`, `tasks`, `timeline`)

## Rutas y modulos funcionales

- Dashboard cliente: `/app`
- Lead Chat publico: `/lead-chat/:identity`
- Portal partner: `/partner`
- Auth/local API:
  - `/api/chat`
  - `/api/chat-event`
  - `/api/analyze-conversation`
  - `/api/generate-prompt`
  - `/api/crm/contacts` y `/api/crm/contacts/:contactId` (backend externo autenticado)
  - `/api/crm/contacts-merge`, `/api/crm/deals`, `/api/crm/tasks`, `/api/crm/timeline` (funcion local)
  - `/api/meta-capi-*`

## Integraciones observadas

- Backend externo `leads.widget.backend` via proxy local y `BACKEND_URL`
- Firebase Auth para tokens Bearer y estado de sesion
- Firestore para datos cliente/CRM
- PayPal
- OpenAI
- Google Places API via backend externo en modulo `Adquisicion`

## Acquisition UI (2026-03-18)

- La pestana `Adquisicion` existe dentro de `Dashboard.tsx`.
- Mantiene el contrato visual de `AcquisitionProspect` en camelCase.
- El frontend consume:
  - `POST /api/acquisition/search`
  - `GET /api/acquisition/prospects`
  - `PATCH /api/acquisition/prospects`
- Todas las llamadas usan Bearer Firebase ID token del usuario autenticado.
- Al aprobar un prospect, el backend crea o mergea `crm_contacts`; el frontend sincroniza el contacto resultante consultando `GET /api/crm/contacts/:contactId` o refrescando el listado CRM autenticado.

## CRM UI (2026-03-20)

- `Dashboard.tsx` lista contactos desde `GET /api/crm/contacts`.
- El alta manual usa `POST /api/crm/contacts` y evita duplicados cuando la respuesta devuelve `action = merged`.
- El detalle usa `GET /api/crm/contacts/:contactId`.
- La edicion de contacto y los cambios de etapa usan `PATCH /api/crm/contacts/:contactId`.
- El dashboard mantiene filtros client-side de busqueda/etapa/foco sobre el dataset real traido del backend.

## Restricciones observadas

- El frontend no debe duplicar la logica de scoring, dedupe o merge de Acquisition; eso vive en backend.
- Las funciones locales `api/*.js` se resuelven antes del fallback global; si una ruta no existe localmente, Vercel la envia a `api/external/[...path].js`.
- `vercel.json` solo intercepta rutas CRM legacy (`contacts-merge`, `deals`, `tasks`, `timeline`); el resto del fallback usa `BACKEND_URL` sin hardcodear hosting.
