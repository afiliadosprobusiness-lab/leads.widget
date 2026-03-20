# Backend Externo - Guia de Conexion

## Objetivo
Mantener el frontend funcionando con rutas `/api/*` mientras el backend externo opera desde Railway sin romper el contrato publico.

## Paso 1: Desplegar backend
Despliega `leads.widget.backend` y confirma la URL final de Railway.

Ejemplo:
`https://api-production-dced.up.railway.app`

## Paso 2: Routing frontend en Vercel

- `vercel.json` ya reescribe el fallback `/api/*` directo a Railway:
  - `/api/crm/contacts`
  - `/api/crm/contacts/:contactId`
  - `/api/acquisition/*`
  - y cualquier otra ruta sin funcion local dedicada

La variable `BACKEND_URL` sigue existiendo para las funciones locales que proxyean manualmente (`api/chat.js`, `api/track.js`, `api/verify-payment.js`, `api/icloser/handoff.js`, `api/w/[widgetId].js`).

Configura en Vercel:

- `BACKEND_URL=https://api-production-dced.up.railway.app`

## Paso 3: Variables recomendadas en backend
- `FIREBASE_SERVICE_ACCOUNT`
- `OPENAI_API_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV=live`
- `CORS_ORIGINS=https://TU_FRONTEND.vercel.app,https://TU_DOMINIO`
- `PUBLIC_APP_URL=https://TU_FRONTEND.vercel.app`

## Paso 4: Smoke test
1. `GET https://BACKEND_URL/health`
2. Frontend login/dashboard
3. Widget embed: `https://TU_FRONTEND/api/w/USER_OR_WIDGET_ID.js`
4. Chat demo y chat cliente
5. Verificacion de pago

## Nota
No cambies los fetch del frontend. La compatibilidad se mantiene por rutas relativas `/api/*`; el cambio ocurre en la capa de routing/proxy de Vercel.
