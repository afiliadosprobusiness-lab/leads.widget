# Backend Externo - Guia de Conexion

## Objetivo
Mantener el frontend funcionando con rutas `/api/*` mientras el backend vive en Cloud Run.

## Paso 1: Desplegar backend
Despliega `leads.widget.backend` y copia la URL final de Cloud Run.

Ejemplo:
`https://leads-widget-backend-xxxx-uc.a.run.app`

## Paso 2: Rewrite en Vercel (frontend)
En Vercel, agrega este `vercel.json` (o reemplaza la regla `/api`):

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://REEMPLAZAR_BACKEND_RUN_URL/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

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
No cambies los fetch del frontend por ahora. La compatibilidad se mantiene por rewrites en `/api/*`.
