# Contexto Arquitectonico - leads.widget

Snapshot derivado del codigo real del repo al 2026-03-18.

## Stack real

- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui + Radix
- Firebase Web SDK (Auth + Firestore)
- Vercel con `routes` y fallback `/api/*` a backend externo

## Estructura observada

- `src/pages/Dashboard.tsx`: dashboard cliente principal, CRM legacy reactivado en UI y pestana `Adquisicion`
- `src/pages/PartnerDashboard.tsx`: portal partner
- `src/lib/*`: utilidades de chat, auth, tracking y helpers de dominio
- `api/*.js`: funciones serverless locales para rutas que no deben caer al backend externo (`chat`, `crm`, `meta-capi`, `debug`, etc.)
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
  - `/api/crm/*`
  - `/api/meta-capi-*`

## Integraciones observadas

- Backend externo `leads.widget.backend` via rewrite `/api/(.*)`
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
- Al aprobar un prospect, el backend crea o mergea `crm_contacts`; el frontend solo sincroniza el contacto resultante para reflejo visual inmediato.

## Restricciones observadas

- El frontend no debe duplicar la logica de scoring, dedupe o merge de Acquisition; eso vive en backend.
- Las funciones locales `api/*.js` se resuelven antes del fallback global; si una ruta no existe localmente, Vercel la envia al backend externo.
- El dashboard sigue leyendo `crm_contacts` desde Firestore para renderizado del workspace CRM.
