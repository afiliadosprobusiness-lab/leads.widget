# Prompt listo para backend: Adquisicion + CRM

Copia y pega el siguiente prompt en el repo backend.

```text
Necesito implementar el backend que conecte una UI frontend YA existente del dashboard `leads.widget` para una nueva pestaña `Adquisicion` y su integracion visual con el CRM legacy. No reinterpretar la UI ni inventar shapes distintos: respetar exactamente el flujo y el contrato visual descritos abajo.

Contexto obligatorio:
- Repo frontend: `leads.widget`
- El frontend YA tiene una pestaña top-level `Adquisicion` en `src/pages/Dashboard.tsx`
- Esta primera version frontend es visual/local-only: usa dataset mock, filtros locales y aprobacion/descartes en memoria
- El CRM top-level tambien fue reactivado en la UI
- Los prospects aprobados se convierten visualmente en contactos CRM con `source = acquisition_google_places`
- No hay scraping real ni persistencia en frontend; todo eso debe vivir ahora en backend

Objetivo backend v1:
1. Buscar prospects de negocios usando Google Places API / Maps API
2. Persistirlos en backend
3. Permitir aprobar o descartar
4. Al aprobar, crear o mergear un contacto en `crm_contacts`
5. Mantener compatibilidad con el patron de auth Firebase ya usado en `api/crm.js`

Implementar EXACTAMENTE estos endpoints autenticados:

1. `POST /api/acquisition/search`
2. `GET /api/acquisition/prospects`
3. `PATCH /api/acquisition/prospects`

Auth:
- Reusar el mismo patron de validacion Firebase Bearer token que ya usa `api/crm.js`
- Todas las operaciones deben quedar scopeadas por `client_id`
- Si no hay token valido, responder `401`

Motor de busqueda v1:
- Integrar Google Places API / Maps API
- Esta es la fuente de datos inicial obligatoria
- No agregar scraping HTML como version 1

Coleccion / persistencia:
- Crear y usar coleccion `acquisition_prospects`
- Cada documento debe quedar asociado a `client_id`
- Dedupe obligatorio por `client_id + external_id`

Modelo persistido esperado para cada prospect:
- `id`
- `client_id`
- `external_id`
- `business_name`
- `category`
- `city`
- `country`
- `address`
- `phone`
- `website`
- `rating`
- `reviews_count`
- `commercial_score`
- `maps_url`
- `status`
- `source`
- `crm_contact_id`
- `created_at`
- `updated_at`

Estados permitidos:
- `pending`
- `approved`
- `discarded`

Contrato funcional del frontend que NO debe romperse:

La UI ya espera prospects con esta forma:
- `id`
- `businessName`
- `category`
- `city`
- `country`
- `address`
- `phone`
- `website`
- `rating`
- `reviewsCount`
- `commercialScore`
- `mapsUrl`
- `status`
- `source`

Por lo tanto, el backend debe mapear su modelo persistido a ese shape de respuesta en JSON para el frontend actual.

Flujo exacto esperado:

1. El usuario ejecuta busqueda desde frontend con:
   - `category` / `rubro`
   - `city`
   - `country`
   - `minScore`

2. `POST /api/acquisition/search`
   Debe:
   - validar auth
   - consultar Google Places API / Maps API
   - normalizar resultados
   - calcular `commercial_score` server-side
   - hacer dedupe por `client_id + external_id`
   - persistir nuevos prospects o actualizar existentes
   - devolver lista normalizada para pintar la pre-bandeja

3. `GET /api/acquisition/prospects`
   Debe permitir listar prospects del cliente autenticado
   Filtros recomendados:
   - `status`
   - `city`
   - `country`
   - `category`
   - `minScore`

4. `PATCH /api/acquisition/prospects`
   Debe permitir actualizar estado del prospect
   Request esperado:
   - `id`
   - `status`

   Reglas:
   - solo `approved` o `discarded` como cambios validos de flujo operativo
   - al pasar a `discarded`, solo actualizar estado
   - al pasar a `approved`, crear o mergear contacto CRM

Integracion con CRM al aprobar:

- Al aprobar un prospect:
  - crear o mergear contacto en `crm_contacts`
  - usar `source = acquisition_google_places`
  - guardar `crm_contact_id` dentro del prospect

- Mapeo obligatorio prospect -> contacto CRM:
  - `name = business_name`
  - `interest = category + " - " + city`
  - `stage = "new"`
  - `source = "acquisition_google_places"`
  - `notes` debe incluir:
    - rating
    - reviews_count
    - phone
    - website
    - maps_url

- No crear deals ni tasks automaticamente en esta version

Dedupe CRM:
- Antes de crear contacto, intentar merge/upsert siguiendo el patron actual del CRM del proyecto
- Si ya existe contacto equivalente, reutilizarlo y devolver `crm_contact_id`
- No duplicar contactos por aprobaciones repetidas

Score comercial:
- `commercial_score` se calcula solo server-side
- No confiar en score enviado desde frontend
- Definir una heuristica explicita y mantenible usando al menos:
  - rating
  - reviews_count
  - completitud de telefono
  - completitud de website
  - categoria o senales comerciales utiles si existen
- Dejar la heuristica encapsulada para poder refinarla luego sin romper el endpoint

Validaciones:
- validar tipos y campos requeridos en todos los endpoints
- rechazar estados invalidos
- rechazar ids fuera del tenant
- no exponer errores crudos del proveedor Google

Respuestas esperadas:
- mantener JSON claro y consistente
- incluir mensajes de error accionables
- nunca romper el shape visual esperado por el frontend actual

Compatibilidad:
- No romper `api/crm.js`
- No romper modelos actuales `crm_contacts`
- Mantener enfoque backward-compatible

Entrega esperada en backend:
- endpoints implementados
- integracion Google Places lista
- modelo `acquisition_prospects`
- calculo `commercial_score`
- aprobacion con merge a CRM
- validaciones/auth listas
- notas tecnicas minimas para variables de entorno necesarias

Si hace falta documentacion adicional, describirla con precision, pero primero implementar el flujo.
```
