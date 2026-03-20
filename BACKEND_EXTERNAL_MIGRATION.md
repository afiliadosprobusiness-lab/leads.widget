# Backend Externo - Guia de Conexion

## Objetivo
Mantener el frontend funcionando con rutas `/api/*` mientras el backend externo puede vivir en Cloud Run o Railway.

## Paso 1: Desplegar backend
Despliega `leads.widget.backend` y copia la URL final de Cloud Run.

Ejemplo:
`https://leads-widget-backend-xxxx-uc.a.run.app`

## Paso 2: Variable `BACKEND_URL` en Vercel (frontend)
El frontend ya no debe hardcodear el host del backend en `vercel.json`.

Configura en Vercel:

- `BACKEND_URL=https://REEMPLAZAR_BACKEND_URL`

El fallback `/api/*` reescribe internamente a `api/external/[...path].js`, y esa funcion reenvia al backend usando `BACKEND_URL`.

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
No cambies los fetch del frontend. La compatibilidad se mantiene por rutas relativas `/api/*`; solo cambia el upstream configurado en `BACKEND_URL`.
