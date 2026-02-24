# Contrato de integracion actual - leads.widget

Documento descriptivo (no prescriptivo) del comportamiento observado en codigo al momento de este cambio.

## Proposito

Describir el contrato real entre:

- Frontend/dashboard/widget embebido (`leads.widget`)
- Backend HTTP (`leads.widget.backend`)
- Datos compartidos en Firestore

El objetivo es congelar el comportamiento actual para gobernanza contract-first sin cambiar runtime.

## Modelos de datos compartidos

Colecciones Firestore detectadas en uso:

### `profiles` (doc id = `uid`)

Campos observados (pueden coexistir segun flujo):

- `email: string | null`
- `display_name: string`
- `business_name: string`
- `whatsapp_number: string`
- `subscription_status: "trial" | "active" | "pro" | "verified" | "suspended" | string`
- `plan_type: "trial" | "plus" | string` (legacy `pro` puede existir)
- `plus_monthly_price_pen: number | null` (opcional, override de facturacion mensual por cliente para plan PLUS; tiene prioridad sobre el precio global)
- `trial_ends_at: string | null` (ISO date)
- `ai_enabled: boolean`
- `ai_provider: string`
- `ai_api_key: string`
- `ai_model: string`
- `ai_temperature: number`
- `ai_max_tokens: number`
- `business_description: string`
- `ai_context_prompt: string` (opcional, bloque contexto normalizado)
- `ai_improvements_prompt: string` (opcional, mejoras sugeridas por analisis)
- `ai_system_base_prompt: string` (opcional, bloque editable del sistema sin compilacion)
- `ai_closing_channel: "icallcloser" | "whatsapp"` (opcional)
- `ai_system_prompt: string`
- `ai_security_prompt: string`
- `referred_by: string | null`
- `created_at: string` (ISO date)
- `updated_at: string` (ISO date)

### `user_roles` (doc id = `uid`)

- `role: "superadmin" | string`
- `updated_at: string`

### `system_settings` (doc id = config key)

Configuracion global editable por superadmin.

`billing`:
- `plus_monthly_price_pen: number` (precio base global del plan PLUS)
- `updated_at: string` (ISO date, opcional)

### `widget_configs` (doc id auto, publico para lectura)

Campos observados:

- Identidad: `user_id`, `widget_id`
- Branding/UI: `business_name`, `primary_color`, `welcome_message`, `welcome_image_url`, `welcome_audio_url`, `welcome_video_url`, `chat_placeholder`, `launcher_icon`, `hide_branding`, `branding_text`, `branding_link`, `language`, `template`
- Lead Chat/Closer: `experience_mode`, `lead_chat_slug`, `consent_text`, `consent_text_version`, `icloser_redirect_url`, `lead_chat_headline`, `lead_chat_subheadline`, `lead_chat_offer_title`, `lead_chat_offer_description`, `lead_chat_cta_label`, `lead_chat_live_toasts`
- WhatsApp y flujo: `whatsapp_destination`, `niche_question`
- Triggers: `trigger_delay`, `trigger_exit_intent`, `exit_intent_title`, `exit_intent_description`, `exit_intent_cta`, `vibration_intensity`
- Mensajeria: `teaser_messages` (array o string), `quick_replies` (array o string)
- Inmobiliaria: `real_estate_properties` (array de objetos con metadata y media por propiedad; soporta campos legacy `image_url/video_url` y campos extendidos `image_urls[]/video_urls[]`; opcional)
- Testimonios: `testimonials_json` (string JSON), opcional `testimonials` (array)
- IA: `ai_enabled`, `ai_provider`, `ai_api_key`, `ai_model`, `ai_system_prompt`, `business_description`, `ai_context_prompt`, `ai_improvements_prompt`, `ai_system_base_prompt`, `ai_closing_channel`, `ai_temperature`, `ai_max_tokens`, `ai_security_prompt`
- Tracking declarativo: `facebook_pixel_id`, `tiktok_pixel_id`, `google_tag_id`
- Timestamps: `created_at`, `updated_at`

Comportamiento observado:

- `custom_tracking_code` y `custom_code` se eliminan/ignoran (frontend los borra y backend publico responde `customTrackingCode: ""`).

### `meta_capi_configs` (doc id = `uid`, acceso via endpoint local autenticado)

Configuracion privada para preparacion de Conversions API (sin exponer token en colecciones publicas):

- `user_id`
- `business_manager_id`
- `ad_account_id`
- `dataset_id`
- `token_ciphertext_b64` (token cifrado)
- `token_iv_b64`
- `token_tag_b64`
- `access_token_mask` (solo sufijo enmascarado para UI)
- `access_token_updated_at`
- `created_at`, `updated_at`

### `meta_capi_event_logs` (doc id hash, acceso server-side)

Bitacora de envio Meta CAPI para deduplicacion e inspeccion operacional:

- `user_id`
- `dataset_id`
- `event_name`
- `event_id`
- `status` (`sent|error`)
- `upstream_status`
- `upstream_body` (resumen)
- `contact_id`
- `created_at`, `updated_at`

### `analytics`

Eventos generados por backend:

- Track view/otros:
  - `widget_id`, `event_type`, `ip`, `user_agent`, `referer`, `date`, `created_at`
- Chat:
  - `widget_id`, `event_type: "message_sent"`, `ip`, `created_at`

### `ai_chat_logs`

Eventos de consola IA (persistidos por proxy de chat):

- `client_id`
- `widget_id`
- `conversation_id`
- `source` (`lead_chat` | `widget_embed` | `sales_widget` | `unknown`)
- `status` (`ok` | `blocked` | `rate_limited` | `error` | `unknown`)
- `blocked`, `rate_limited`
- `user_message`, `ai_response`, `error_message`
- `history_count`, `history_excerpt` (ultimos turnos truncados)
- `command_flags` (`whatsapp_redirect`, `icallcloser_ready`, `has_image`, `has_audio`, `has_video`, `dni_validation`)
- `security_signal` (bool para alertas de intento de bypass/hack)
- `upstream_status`, `latency_ms`, `user_timezone`
- `ip`, `user_agent`, `referer`
- `created_at`

### `ai_chat_events`

Eventos de conversion/redirect por conversacion (persistidos por endpoint local):

- `client_id`
- `widget_id`
- `conversation_id`
- `source` (`lead_chat` | `widget_embed` | `sales_widget` | `unknown`)
- `event_type` (`whatsapp_open` | `iacallcloser_open`)
- `event_meta` (objeto corto opcional, ej. `trigger=auto|button|handoff`)
- `user_timezone`
- `ip`, `user_agent`, `referer`
- `created_at`

### `blocked_ips`

- `widget_id`
- `ip_address`
- `reason`
- `created_at`
- opcional `ai_raw_response`

### `leads`

Se escriben desde dos flujos (schema heterogeneo):

- Flujo backend IA (`collect_lead`):
  - `client_id`, `widget_id`, `name`, `interest`, `phone`, `created_at`
- Flujo widget embebido via Firestore REST:
  - `client_id`, `name`, `phone`, `interest`, `source`, `status`, `created_at` (timestamp)

### `crm_contacts`

- `client_id`
- `name`, `phone`, `email`, `interest`
- `stage` (`new|contacted|qualified|won|lost`)
- `source`, `source_lead_id`, `notes`
- `dedupe_phone`, `dedupe_email`
- `created_at`, `updated_at`, `last_activity_at`

### `deals`

- `client_id`, `contact_id`
- `title`
- `stage` (`new|contacted|qualified|won|lost`)
- `value`, `currency`
- `probability`
- `expected_close_date`
- `source`
- `owner_user_id`
- `created_at`, `updated_at`

### `tasks`

- `client_id`
- `entity_type` (`contact|deal`)
- `entity_id`
- `title`
- `due_at`
- `status` (`open|done|overdue`)
- `priority` (`low|med|high`)
- `created_by`, `assigned_to`
- `created_at`, `updated_at`, `completed_at`

### `activity_events`

- `client_id`
- `entity_type` (`contact|deal`)
- `entity_id`
- `type`
- `payload_json`
- `created_at`
- `created_by`

### `crm_merge_operations`

- `client_id`
- `idempotency_key`
- `status` (`pending_migration|completed`)
- `primary_contact_id`, `duplicate_contact_id`
- `result`
- `created_at`, `updated_at`

### `payments`

Campos observados:

- `user_id`
- `amount` (string o number segun flujo)
- `currency`
- `payment_method`
- `description`
- `status`
- `paypal_order_id`
- `payer_email`
- `operation_ref`
- `verified_at`, `verified_by`, `verified_by_server`
- `created_at`

### `visits`

- `client_id`
- `source`
- `timestamp`

## Endpoints del backend

Base detectada:

- Backend externo: `leads.widget.backend/src/index.js`
- Capa publica en frontend: rutas relativas `/api/*` consumidas por frontend y widget.

### Backend externo (Cloud Run / Express)

#### `GET /health`

- Respuesta `200`: `{ ok: true, service: "leads-widget-backend", time: "<ISO>" }`

#### `POST /api/track`

- Body JSON:
  - Requerido: `widgetId`
  - Opcional: `eventType` (default `"view"`)
- Respuestas:
  - `200`: `{ success: true }`
  - `200`: `{ success: true, blocked: true }` (IP bloqueada)
  - `200`: `{ success: true, cached: true }` (de-dup en 5s para `view`)
  - `400`: `{ error: "widgetId is required" }`
  - `500`: `{ error: "Internal server error" }`

#### `POST /api/chat`

- Body JSON:
  - Requeridos: `message`, `widgetId`
  - Opcionales: `history` (array `{ role, content }`), `userTimezone`, `conversationId`, `source`
- Respuestas observadas:
  - `200`: `{ response: "<texto>" }`
  - `200`: `{ response: "<texto>", blocked: true }` (cierres de seguridad)
  - `200`: mensajes de estado negocio (trial vencido, AI deshabilitada, falta API key, error tecnico)
  - `200`: cuando el asistente emite comando de identidad (`[VALIDAR_DNI: ...]` o `{validar_dni: ...}`), el proxy local resuelve DNI segun estrategia (`api|eldni|auto|capture`) y responde al usuario con mensaje operacional (mismo shape `{ response: "<texto>" }`).
  - `200`: si el asistente responde solo con comando DNI (sin texto), el proxy consulta internamente al asistente y agrega el siguiente paso de precalificacion segun el prompt configurado (sin volver a pedir DNI).
  - `400`: `{ error: "Message and widgetId are required" }`
  - `403`: `{ response: "<texto>", blocked: true }` (filtros/blocked IP)
  - `404`: `{ error: "Widget not found" }`
  - `429`: `{ response: "<texto>", rateLimited: true }`

#### `POST /api/icloser/handoff`

- Body JSON:
  - Requeridos: `widgetId`, `name`, `phone`
  - Requerido: `consent.accepted === true`
  - Requerido: `consent.explicitResponse` con valor afirmativo explicito (`"SI"`/`"YES"`)
  - Opcionales: `collectedInfo`, `history` (array `{ role, content }`), `consent.textVersion`, `consent.text`
- Comportamiento:
  - Valida consentimiento expreso antes de handoff.
  - Reenvia payload JSON a API externa IACloser (usa `IACLOSER_API_URL` o fallback productivo por defecto).
  - Registra trazabilidad en Firestore (`lead_handoffs`) y agrega lead en `leads` con `source: "lead_chat_iacloser"`.
- Respuestas:
  - `200`: `{ success: true, handoffId: string, leadId: string | null, lead_id: string | null, redirectUrl: string | null, redirect_url: string | null, queuedCallInSeconds: number, etaSeconds: number, eta_seconds: number }`
  - `400`: `{ error: "widgetId is required" | "name is required" | "phone is required" | "Explicit consent is required" | "Explicit consent response 'SI' is required" | "IACLOSER_API_URL is not configured" }`
  - `404`: `{ error: "Widget not found" }`
  - `502`: `{ error: "IACloser handoff failed", details?: object }`
  - `500`: `{ error: "Failed to send handoff" }`

#### `POST /api/users/bootstrap`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- Body JSON:
  - `businessName` (opcional)
  - `referredBy` (opcional)
- Respuestas:
  - `200`: `{ success: true, role: "client" | "superadmin", created: boolean }`
  - `401`: `{ error: "Unauthorized" }`
  - `500`: `{ error: "Failed to bootstrap user profile" }`

#### `GET /api/affiliates/network`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- Query params:
  - `levels` (1..4, default 4)
  - `includeInactive` (`"1"` incluye no activos; default `"0"`)
- Respuesta `200`:
  - `{ upline: Profile | null, levels: Array<{ level: number, users: Profile[] }> }`
  - `Profile` mapeado con: `id`, `email`, `display_name`, `business_name`, `subscription_status`, `plan_type`, `referred_by`, `created_at`
- Errores:
  - `401`: `{ error: "Unauthorized" }`
  - `500`: `{ error: "Failed to load affiliate network" }`

#### `POST /api/admin/delete-user`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- Body JSON:
  - `userId` (requerido)
- Comportamiento:
  - Elimina acceso en Firebase Auth (`deleteUser`) y borra datos principales en Firestore (`profiles`, `user_roles`, `partner_users`, `widget_configs`, `payments`, `visits`, `leads`).
- Respuestas:
  - `200`: `{ success: true, auth_deleted: boolean }`
  - `400`: `{ error: "Missing userId" }`
  - `401`: `{ error: "Unauthorized" }`
  - `403`: `{ error: "Forbidden" }`
  - `403`: `{ error: "Protected superadmin account cannot be deleted" }`
  - `500`: `{ error: "Failed to delete user" }`

#### `POST /api/verify-payment`

- Body JSON:
  - Requerido: `orderID`
  - Opcionales: `user_id`, `plan_type`
- Auth:
  - Usa token Firebase si llega en `Authorization`.
  - Sin token, puede aceptar `user_id` solo si `ALLOW_INSECURE_VERIFY_PAYMENT=true`.
- Respuestas:
  - `200`: `{ success: true, idempotent: true }` (order ya procesada)
  - `200`: `{ success: true, message: "Payment verified and subscription activated" }`
  - `400`: `{ error: "Missing orderID" }`
  - `400`: `{ error: "Missing PAYPAL credentials" }`
  - `400`: `{ error: "Invalid order status: <status>" }`
  - `401`: `{ error: "Unauthorized. Missing valid Firebase token." }`
  - `500`: `{ error: "<paypal/backend error>" }`

#### `GET /api/widget-config/:identity`

- Path param:
  - `identity` (requerido)
- Busqueda:
  - primero `widget_configs.widget_id == identity`
  - fallback `widget_configs.user_id == identity`
  - fallback `widget_configs.lead_chat_slug == identity`
- Respuestas:
  - `200`: `{ config: PublicWidgetConfig }`
  - `400`: `{ error: "Missing widget identity" }`
  - `404`: `{ error: "Widget config not found" }`
  - `500`: `{ error: "Failed to load widget config" }`
- `PublicWidgetConfig` incluye (entre otros):
  - `clientId`, `widgetId`, `businessName`, `primaryColor`, `whatsappDestination`, `language`
  - `welcomeMessage`, `template`, `chatPlaceholder`
  - `triggerDelay`, `exitIntentEnabled`, `exitIntentTitle`, `exitIntentDescription`, `exitIntentCta`
  - `teaserMessages`, `quickReplies`, `testimonials`
  - `realEstateProperties` (puede llegar desde fallback Firestore cuando backend publico no lo expone)
  - `launcherIcon`, `hideBranding`, `brandingText`, `brandingLink`
  - `experienceMode`, `leadChatSlug`, `leadChatUrl`
  - `consentText`, `consentTextVersion`, `iacloserRedirectUrl`, `iacloserEnabled`
  - `leadChatHeadline`, `leadChatSubheadline`, `leadChatOfferTitle`, `leadChatOfferDescription`, `leadChatCtaLabel`, `leadChatLiveToasts`
  - `ai_enabled`, `ai_provider`, `ai_api_key`, `ai_model`, `ai_system_prompt`, `business_description`, `ai_temperature`, `ai_max_tokens`
  - `facebookPixelId`, `tiktokPixelId`, `googleTagId`, `customTrackingCode: ""`, `updatedAt`

#### `GET /api/w/:widgetId.js`

- Retorna JavaScript (`Content-Type: application/javascript`).
- Respuestas:
  - `200`: script bootstrap del widget (inyecta `window.LEADWIDGET_*` y carga `widget-embed.js`)
  - `200`: `console.warn(...)` si `subscription_status === "suspended"`
  - `400`: `// widgetId is required`
  - `404`: `// Widget not found`
  - `500`: `// Error generating widget script`

### CORS y preflight (backend externo)

- `Access-Control-Allow-Methods: GET,POST,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,Authorization`
- `OPTIONS` responde `200` y corta flujo.

### Capa `/api` en `leads.widget` (proxy/routing)

Codigo observado:

- `POST|OPTIONS /api/chat` (proxy a backend externo)
- `POST|OPTIONS /api/chat-event` (persistencia local de eventos por conversacion)
- `POST|OPTIONS /api/analyze-conversation` (diagnostico IA/heuristico de conversaciones no completadas)
- `POST|OPTIONS /api/generate-prompt` (generacion de bloque prompt contexto/sistema usando OpenAI del cliente autenticado)
- `GET|PUT|OPTIONS /api/meta-capi-config` (configuracion privada de credenciales Meta CAPI por cliente autenticado)
- `POST|OPTIONS /api/meta-capi-dispatch` (dispatch autenticado de eventos Meta CAPI para cambios de etapa CRM)
- `POST|OPTIONS /api/crm/contacts-merge` (upsert/merge idempotente de contactos con regla phone->email)
- `GET|POST|PATCH|OPTIONS /api/crm/deals` (CRUD operativo de deals + pipeline por etapa)
- `GET|POST|PATCH|OPTIONS /api/crm/tasks` (CRUD operativo de tareas + filtros Hoy/Vencidas/Proximas/Completadas)
- `GET|POST|OPTIONS /api/crm/timeline` (eventos de actividad + notas manuales)
- `POST|OPTIONS /api/track` (proxy a backend externo)
- `POST|OPTIONS /api/verify-payment` (proxy a backend externo)
- `GET /api/w/:widgetId.js` (proxy a backend externo)
- `GET /api/debug` (verifica acceso Firebase Admin; retorna `status/env`, y en error incluye `stack`)
- `vercel.json` usa `routes` con `handle: filesystem` primero; agrega rewrite interno `/api/crm/:resource` -> `/api/crm?resource=:resource`; y luego fallback `/api/(.*)` -> backend externo Cloud Run

Asuncion:

- En produccion, las funciones locales en `api/*.js` se resuelven primero; rutas `/api/*` sin archivo local caen al backend externo via fallback.
- CRM v2 vive en funciones locales `api/crm/*` y no depende del backend externo para operaciones de deals/tasks/timeline/dedupe.
- El proxy local de `POST /api/chat` ademas persiste trazas resumidas de cada intercambio en `ai_chat_logs` para consola de debugging en Dashboard (sin cambiar el contrato de respuesta hacia el cliente).
- El proxy local de `POST /api/chat` ejecuta resolucion de identidad para comando `VALIDAR_DNI` con estrategia configurable (`DNI_VALIDATION_PROVIDER=auto|api|eldni|capture`), soportando API externa (`DNI_API_*`), fallback por formulario publico ELDNI (`ELDNI_FORM_URL`, `ELDNI_TIMEOUT_MS`) y modo `capture` sin consulta externa.
- `POST /api/analyze-conversation` requiere `Authorization: Bearer <Firebase ID token>` del usuario dashboard; usa `profiles.ai_api_key` (o fallback `widget_configs.ai_api_key` del mismo owner) para ejecutar analisis OpenAI. Si no hay key configurada, responde analisis heuristico (`provider: heuristic_no_client_key`).
- `POST /api/generate-prompt` requiere `Authorization: Bearer <Firebase ID token>` del usuario dashboard; usa `profiles.ai_api_key` (o fallback `widget_configs.ai_api_key`) para generar texto de prompt via OpenAI y devuelve `creditsConsumed: true`.
- `GET|PUT /api/meta-capi-config` requiere `Authorization: Bearer <Firebase ID token>`; persiste IDs de Meta y token cifrado en `meta_capi_configs` (no en `widget_configs` publico).
- `POST /api/meta-capi-dispatch` requiere `Authorization: Bearer <Firebase ID token>`; mapea etapa CRM -> evento Meta y envia via Conversions API usando credenciales cifradas del owner.
- `POST /api/crm/contacts-merge` y `PATCH /api/crm/deals` ejecutan dispatch server-side a Meta CAPI cuando corresponde (`Lead`, `Appointment`, `QualifiedLead`, `Sale`).

#### `POST /api/generate-prompt`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- Body JSON:
  - `promptType: "context" | "system"` (requerido)
  - `locale: "es" | "en"` (opcional)
  - `widgetId` (opcional, ayuda a resolver config owner)
  - `closingMode: "icallcloser" | "whatsapp"` (opcional para `system`)
  - `industry` (opcional)
  - `contextData` o `systemData` (objeto de campos del modal)
- Respuestas:
  - `200`: `{ success: true, prompt: string, promptType, provider: "openai", model: string, creditsConsumed: true }`
  - `400`: `{ error: "promptType must be context or system" }`
  - `400`: `{ error: "No OpenAI API key configured in IA settings." }`
  - `401`: `{ error: "Unauthorized" }`
  - `500`: `{ error: "Could not generate prompt", details?: string }`

#### `GET|PUT /api/meta-capi-config`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- `GET`:
  - Devuelve configuracion privada resumida (sin token plano).
  - `200`: `{ success: true, config: { businessManagerId, adAccountId, datasetId, hasAccessToken, accessTokenMask, updatedAt } }`
- `PUT` body JSON:
  - `businessManagerId` (requerido, numerico)
  - `adAccountId` (requerido, numerico; acepta entrada `act_` y normaliza)
  - `datasetId` (requerido, numerico)
  - `accessToken` (requerido solo si no existe token previo)
- Respuestas:
  - `200`: `{ success: true, config: { ... } }`
  - `400`: `{ error: "<validation>", errors?: string[] }`
  - `401`: `{ error: "Unauthorized" }`
  - `500`: `{ error: "META_CAPI_ENCRYPTION_KEY no esta configurada en el servidor." }` o error de persistencia

#### `POST /api/meta-capi-dispatch`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- Body JSON:
  - `source` (opcional, default `crm_contact_stage`)
  - `previousStage` (opcional)
  - `contact` (requerido):
    - `id`
    - `stage` (`contacted|qualified|won` para dispatch; otras etapas devuelven `stage_not_mapped`)
    - opcional `name`, `phone`, `email`, `source`
- Mapeo de etapa a evento:
  - `contacted` -> `Appointment`
  - `qualified` -> `QualifiedLead`
  - `won` -> `Sale`
- Respuestas:
  - `200`: `{ success: true, sent: boolean, reason: "ok|duplicate_event|not_configured|stage_not_mapped|..." , eventName?, upstreamStatus? }`
  - `400`: `{ error: "<validation>" }`
  - `401`: `{ error: "Unauthorized" }`
  - `500`: `{ error: "No se pudo despachar el evento Meta CAPI", details?: string }`

#### `POST /api/crm/contacts-merge`

- Headers:
  - `Authorization: Bearer <Firebase ID token>` (requerido)
- Body JSON:
  - `incomingContact` (objeto contacto) **o** (`primaryContactId` + `duplicateContactId`)
  - `reason` (opcional)
  - `idempotencyKey` (opcional, recomendado)
- Comportamiento:
  - Aplica regla de dedupe: `phone` principal, fallback `email`.
  - Modo upsert: crea contacto nuevo o fusiona con existente.
  - Modo merge por IDs: migra referencias de `deals/tasks/activity_events` al contacto primario y elimina duplicado.
- Respuestas:
  - `200`: `{ success: true, action: "created"|"merged"|"noop", contact, primary_contact_id, merged_contact_id }`
  - `400`: `{ error: "<validation>" }`
  - `401`: `{ error: "Unauthorized" }`
  - `500`: `{ error: "<runtime>" }`

#### `GET|POST|PATCH /api/crm/deals`

- `GET`: lista deals del cliente (`?pipeline=1` opcional, `?contactId=` opcional)
- `POST`: crea deal con defaults (`title`, `stage=new`, `expected_close_date=+7d` cuando no se envia)
- `PATCH`: actualiza deal (incluye cambio de etapa)
- Respuestas:
  - `200`: `{ deals, metrics, pipeline? }` en GET; `{ success: true, deal }` en PATCH
  - `201`: `{ success: true, deal }` en POST
  - `400|401|403|404|500`: `{ error: string }`

#### `GET|POST|PATCH /api/crm/tasks`

- `GET`: lista tareas por filtro (`window=today|overdue|upcoming|completed|all`, `contactId`, `dealId`)
- `POST`: crea tarea (`entity_type`, `entity_id`, `title`, `due_at`, `priority`)
- `PATCH`: actualiza tarea (`status/title/due_at/priority`)
- Comportamiento:
  - Marca `overdue` automaticamente cuando `due_at < now` y `status=open`.
- Respuestas:
  - `200`: `{ tasks, totals }` en GET; `{ success: true, task }` en PATCH
  - `201`: `{ success: true, task }` en POST
  - `400|401|403|404|500`: `{ error: string }`

#### `GET|POST /api/crm/timeline`

- `GET`: lista eventos por entidad (`entityType+entityId`) o por contacto (`contactId`) con filtro (`all|notes|stage|tasks`)
- `POST`: crea evento manual (`manual_note`) u otros tipos permitidos de actividad
- Respuestas:
  - `200`: `{ events: ActivityEvent[] }`
  - `201`: `{ success: true, event }`
  - `400|401|500`: `{ error: string }`

## Formato de errores

Formatos observados:

- JSON estandar: `{ error: "<mensaje>" }`
- Proxy local caido: `{ error: "<upstream unavailable>", details: "<mensaje>" }` con `502`
- Chat bloqueado/rate-limit usa payload de negocio:
  - `{ response: "<mensaje>", blocked: true }`
  - `{ response: "<mensaje>", rateLimited: true }`
- Endpoints JS (`/api/w/:widgetId.js`) devuelven comentarios JS en error (`// ...`) en vez de JSON.
- `api/debug` local en `500` incluye `stack` (solo diagnostico).

## Reglas de compatibilidad hacia atras

Comportamientos actuales que clientes ya consumen:

- Rutas relativas `/api/*` en frontend/widget (sin versionado explicito).
- `POST /api/chat` devuelve mayormente `200` con campo `response` incluso para varios casos de error de negocio.
- En validacion DNI (`VALIDAR_DNI`), si la validacion externa no esta disponible o el modo es `capture`, se devuelve mensaje no bloqueante de `DNI recibido` para continuar flujo comercial.
- `GET /api/widget-config/:identity` soporta lookup por `widget_id` y fallback por `user_id`.
- `GET /api/w/:widgetId.js` mantiene entrega de script autocontenido y globals `window.LEADWIDGET_CLIENT_ID`, `window.LEADWIDGET_WIDGET_ID`, `window.LEADWIDGET_CONFIG`.
- Si `experience_mode=lead_chat`, `GET /api/w/:widgetId.js` responde script no embebible (warning) y se prioriza `leadChatUrl` publico.
- Tracking declarativo se mantiene en `facebook_pixel_id`, `tiktok_pixel_id`, `google_tag_id`; `custom_tracking_code/custom_code` no se exponen.
- Cuando `facebook_pixel_id` esta configurado, Lead Chat y widget embebido disparan browser events de Meta Pixel: `PageView` al cargar y `Lead` en aperturas de WhatsApp/IACloser.
- `POST /api/verify-payment` es idempotente por `orderID` (`paypal_order_id`).
- CORS acepta `GET,POST,OPTIONS` y header `Authorization`.
- En Plan PLUS, `branding_link` permite redireccion configurable del texto de marca; si falta o es invalido se usa `/crear-ahora?ref=<clientId>`.
- En plantilla `inmobiliaria`, Lead Chat y widget embebido pueden recibir directiva de catalogo para seleccionar multimedia de propiedades via comandos `[IMAGE: ...]` y `[VIDEO: ...]` usando URLs existentes del cliente.
- En comandos multimedia (`[IMAGE: ...]`, `[VIDEO: ...]`), el parser soporta multiples URLs dentro del mismo comando (pipe/CSV/saltos de linea/JSON array) y renderiza carrusel cuando corresponde.
- En plantilla `inmobiliaria`, cuando el texto del asistente identifica una propiedad del catalogo, el cliente puede completar media faltante de esa propiedad para mostrar carrusel completo aunque la IA haya enviado solo una URL.
- Los carruseles multimedia renderizados por cliente soportan desplazamiento horizontal por drag/touch y rueda del mouse para garantizar navegacion de multiples piezas de media.
- `POST /api/chat-event` persiste `ai_chat_events` y, para `whatsapp_open`/`iacallcloser_open`, hace upsert idempotente en `crm_contacts` usando `conversation_id + event_type` para mantener visible el lead en CRM aunque no exista escritura directa desde cliente publico.


## Extensiones Partner Program (2026-02-16)

Nuevos modelos observados:
- `partners`
- `partner_users`
- `partner_invites`
- `partner_checkout_links`
- `partner_leads`
- `partner_client_drafts`
- `partner_tickets`
- `commission_ledger`
- `partner_payouts`
- `audit_events`

Nuevos endpoints backend:
- `POST /api/admin/payments/:paymentId/verify`
- `GET /api/partners/me`
- `GET /api/partners/overview`
- `GET /api/partners/clients`
- `POST|GET /api/partners/checkout-links`
- `POST|GET /api/partners/leads`
- `POST|GET /api/partners/drafts`
- `GET|PUT /api/partners/branding`
- `POST|GET /api/partners/tickets`
- `GET /api/partners/commissions` (`?format=csv` opcional)
- `GET /api/partners/payouts`
- `PUT /api/partners/payout-method`
- `GET /api/partners/users`
- `POST /api/partners/users/invite`
- `GET /api/admin/partners`
- `PATCH /api/admin/partners/:partnerId`
- `GET /api/admin/partners/:partnerId/clients`
- `POST /api/admin/partners/:partnerId/reassign-client`
- `POST /api/admin/commissions/:ledgerId/approve`
- `POST /api/admin/payouts/create`
- `POST /api/admin/payouts/:payoutId/mark-paid`

Cambios de comportamiento relevantes:
- `POST /api/verify-payment` ahora considera `ALLOW_INSECURE_VERIFY_PAYMENT=false` como default recomendado.
- `POST /api/verify-payment` y verificacion manual admin generan `commission_ledger` cuando existe `partner_id`.
- Politica de comisiones implementada: primer pago 50%, pagos siguientes 30%; no se reinicia por cancelacion/reactivacion.
- White-label reforzado server-side: solo `plan_type=plus` permite ocultar o personalizar branding.
- `GET /api/partners/overview` y `GET /api/partners/commissions` pueden materializar filas `pending` en `commission_ledger` para clientes `plus` activos sin pago registrado del periodo (cobro manual externo).
- `PUT /api/partners/branding` acepta `branding_text` y `branding_link` (manteniendo compatibilidad con `agency_name`/`cta_url`).

### Changelog del Contrato
- Fecha: 2026-02-16
- Cambio: agregado modulo Partner Program, endpoints partner/admin y reglas de comision/branding server-side
- Tipo: non-breaking
- Impacto: se mantienen rutas legacy; se suman nuevas capacidades para agencias y superadmin
- Fecha: 2026-02-16
- Cambio: `POST /api/admin/delete-user` pasa de soft delete a borrado completo de acceso (Firebase Auth + datos principales)
- Tipo: non-breaking
- Impacto: permite re-registro inmediato con el mismo email luego de eliminacion por superadmin
- Fecha: 2026-02-16
- Cambio: agregado soporte `branding_link` en `widget_configs` y `brandingLink` en `PublicWidgetConfig` para personalizar URL del texto de marca (Plan PLUS)
- Tipo: non-breaking
- Impacto: mantiene fallback al enlace promocional actual cuando no hay URL valida
- Fecha: 2026-02-16
- Cambio: `next_renewal_at` se fija en verificaciones de pago y `GET /api/partners/clients` aplica fallback derivado para cuentas activas sin dato historico
- Tipo: non-breaking
- Impacto: mejora consistencia visual del campo "Prox. renovacion" en dashboard partner sin cambiar shape del endpoint
- Fecha: 2026-02-16
- Cambio: contabilizacion de comision por cliente PLUS activo en periodo actual aun sin `payments` internos (escenario de cobro manual externo), via filas `pending` auto-generadas
- Tipo: non-breaking
- Impacto: el dashboard partner muestra comision calculada sin depender exclusivamente de pagos procesados por la plataforma
- Fecha: 2026-02-16
- Cambio: branding partner simplificado a `branding_text` + `branding_link` en `PUT /api/partners/branding` (con aliases legacy)
- Tipo: non-breaking
- Impacto: estandariza la configuracion de texto/enlace usados como fallback en widgets PLUS de clientes atribuidos
- Fecha: 2026-02-19
- Cambio: agregado flujo Lead Chat + IACloser con `POST /api/icloser/handoff`, lookup por `lead_chat_slug` y campos publicos (`experience_mode`, `lead_chat_slug`, consentimiento, redirect IACloser)
- Tipo: non-breaking
- Impacto: mantiene rutas legacy de widget embebido; habilita modo pagina publica para captacion y handoff con consentimiento expreso
- Fecha: 2026-02-19
- Cambio: `POST /api/icloser/handoff` agrega fallback productivo de `IACLOSER_API_URL` y aliases de respuesta (`lead_id`, `redirect_url`, `eta_seconds`) manteniendo campos previos
- Tipo: non-breaking
- Impacto: simplifica configuracion de integracion IACloser y mejora compatibilidad con shape del proveedor externo sin romper clientes existentes
- Fecha: 2026-02-19
- Cambio: `POST /api/icloser/handoff` exige consentimiento afirmativo explicito (`consent.explicitResponse = "SI"/"YES"`) ademas de `consent.accepted=true`
- Tipo: non-breaking
- Impacto: refuerza cumplimiento legal del flujo Lead Chat antes del handoff a IACloser
- Fecha: 2026-02-20
- Cambio: se agrega `ai_chat_events` para registrar aperturas a WhatsApp/IACloser por `conversation_id`; `ai_chat_logs` incorpora `command_flags` + `security_signal`; se agregan endpoints locales `POST /api/chat-event` y `POST /api/analyze-conversation`.
- Tipo: non-breaking
- Impacto: habilita consola de conversion por estado (`no completado/completado/riesgo`) y diagnostico asistido de conversaciones no completadas sin romper rutas existentes.
- Fecha: 2026-02-20
- Cambio: `POST /api/analyze-conversation` ahora consume la API key OpenAI configurada por cliente (`ai_api_key`) y exige auth Firebase del dashboard; retorna `creditsConsumed` en el payload.
- Tipo: non-breaking
- Impacto: el costo de analisis se imputa al cliente correcto y se evita uso anonimo del endpoint.
- Fecha: 2026-02-20
- Cambio: configuracion IA en dashboard persiste bloques separados (`ai_context_prompt`, `ai_improvements_prompt`, `ai_system_base_prompt`) y `ai_closing_channel`, compilando `ai_system_prompt` final al guardar.
- Tipo: non-breaking
- Impacto: mejora mantenibilidad del prompt por cliente sin romper campos legacy (`business_description`, `ai_system_prompt`).
- Fecha: 2026-02-20
- Cambio: nuevo endpoint local `POST /api/generate-prompt` para generar `promptType=context|system` con OpenAI usando la API key del cliente autenticado; UI agrega CTA `Generar con IA` con aviso de consumo.
- Tipo: non-breaking
- Impacto: habilita ingenieria de prompt asistida por IA en dashboard sin exponer credenciales y con costo imputado a cada cliente.
- Fecha: 2026-02-20
- Cambio: dashboard y superadmin se alinean al esquema comercial `trial` (3 dias) + `plus` (S/100 mensual) con implementacion unica S/200 en activacion inicial.
- Tipo: non-breaking
- Impacto: elimina opciones operativas de plan `pro` en UI administrativa y actualiza montos de cobro/visualizacion.
- Fecha: 2026-02-21
- Cambio: `widget_configs` agrega `real_estate_properties` (catalogo multimedia por propiedad); parser chat soporta comando `[VIDEO: ...]`; `ai_chat_logs.command_flags` agrega `has_video`.
- Tipo: non-breaking
- Impacto: habilita flujo inmobiliario con fotos/videos contextuales en chat sin romper contratos existentes ni plantillas no-inmobiliarias.
- Fecha: 2026-02-21
- Cambio: `widget_configs` agrega `welcome_video_url`; dashboard permite subir/quitar video de bienvenida y clientes Lead Chat/widget embebido lo renderizan como multimedia inicial.
- Tipo: non-breaking
- Impacto: extiende multimedia de bienvenida (imagen/audio/video) sin romper payloads existentes.
- Fecha: 2026-02-22
- Cambio: `real_estate_properties` amplia media por propiedad con `image_urls[]` (hasta 5) y `video_urls[]` (hasta 2), manteniendo compatibilidad con `image_url/video_url` legacy como primer elemento.
- Tipo: non-breaking
- Impacto: permite catalogo inmobiliario multi-media por propiedad sin romper consumidores existentes que leen una sola URL.
- Fecha: 2026-02-22
- Cambio: dashboard aplica limites de peso para media inmobiliaria en subida (`imagen propiedad <=5MB`, `video propiedad <=15MB`) para controlar costo y rendimiento en Cloudinary.
- Tipo: non-breaking
- Impacto: evita cargas pesadas en plan free sin modificar shape de endpoints ni contratos de lectura.
- Fecha: 2026-02-22
- Cambio: CRM v2 agrega rutas locales `api/crm/*` (`contacts-merge`, `deals`, `tasks`, `timeline`) y nuevos modelos `deals`, `tasks`, `activity_events`, `crm_merge_operations`; dashboard CRM incorpora vistas `Contactos/Pipeline deals/Mis tareas` y `Contact detail` con tabs.
- Tipo: non-breaking
- Impacto: evoluciona CRM operativo a seguimiento comercial con dedupe/merge idempotente sin modificar contratos legacy de chat/widget/pagos ni depender del backend externo.
- Fecha: 2026-02-23
- Cambio: esquema comercial de Billing pasa a `PLUS` base `S/150/mes` + `S/200` de implementacion unica; SuperAdmin puede configurar `profiles.plus_monthly_price_pen` por cliente para override opcional del cargo mensual.
- Tipo: non-breaking
- Impacto: el frontend de dashboard/superadmin mantiene shape existente y agrega personalizacion de cobro por cliente sin romper consumidores actuales.
- Fecha: 2026-02-23
- Cambio: SuperAdmin agrega control global de precio base en `system_settings/billing.plus_monthly_price_pen`; Billing dashboard usa ese valor como fallback cuando no existe `profiles.plus_monthly_price_pen`.
- Tipo: non-breaking
- Impacto: permite facturacion diferenciada por cliente manteniendo un precio base central sin romper flujos ni contratos existentes.
- Fecha: 2026-02-23
- Cambio: nuevo endpoint local `GET|PUT /api/meta-capi-config` para guardar configuracion de Meta CAPI por cliente autenticado; se agrega coleccion privada `meta_capi_configs` con token cifrado (`token_ciphertext_b64/token_iv_b64/token_tag_b64`) y mascara para UI.
- Tipo: non-breaking
- Impacto: habilita captura segura de credenciales Meta sin exponer Access Token en `widget_configs` publico y deja listo el sistema para activar envio de eventos en una siguiente fase.
- Fecha: 2026-02-23
- Cambio: activacion de dispatch Meta CAPI para CRM: nuevo endpoint `POST /api/meta-capi-dispatch`, hooks server-side en `contacts-merge`/`deals`, y bitacora `meta_capi_event_logs` para deduplicacion.
- Tipo: non-breaking
- Impacto: eventos de calidad (`Lead`, `Appointment`, `QualifiedLead`, `Sale`) empiezan a enviarse a Meta sin romper flujos existentes ni exponer credenciales.
- Fecha: 2026-02-24
- Cambio: prompt runtime agrega comando de identidad `VALIDAR_DNI`; proxy local `POST /api/chat` ejecuta validacion server-side cuando detecta `[VALIDAR_DNI: ...]` o `{validar_dni: ...}`, con estrategia configurable (`RENIEC` + fallback `ELDNI`) y registra flag `dni_validation` en `ai_chat_logs.command_flags`.
- Tipo: non-breaking
- Impacto: refuerza precalificacion de leads con validacion de identidad sin cambiar el shape base de respuesta del chat.
- Fecha: 2026-02-24
- Cambio: validacion de DNI en `POST /api/chat` pasa a usar exclusivamente fuente ELDNI; se desactiva el uso runtime de RENIEC para evitar indisponibilidad por token/proveedor.
- Tipo: non-breaking
- Impacto: mejora estabilidad del comando `VALIDAR_DNI` manteniendo el mismo contrato de respuesta (`{ response: "<texto>" }`).
- Fecha: 2026-02-24
- Cambio: Lead Chat y widget embebido activan Meta Pixel browser-side cuando existe `facebook_pixel_id` (`PageView` al cargar y `Lead` en aperturas de WhatsApp/IACloser).
- Tipo: non-breaking
- Impacto: habilita optimizacion de campanas Meta Ads con trafico directo a chat sin cambiar endpoints ni shape de respuestas API.
- Fecha: 2026-02-24
- Cambio: en `POST /api/chat`, cuando la validacion DNI por ELDNI no esta disponible, la respuesta pasa a modo continuidad (no bloqueante) en lugar de error temporal duro.
- Tipo: non-breaking
- Impacto: evita friccion en cierre comercial cuando la fuente publica de DNI presenta intermitencia.
- Fecha: 2026-02-24
- Cambio: `POST /api/chat` incorpora soporte de validacion DNI por API externa (`DNI_API_*`) con prioridad en modo `auto`, manteniendo fallback ELDNI y reintentos robustos.
- Tipo: non-breaking
- Impacto: mejora confiabilidad de validacion DNI en produccion sin cambiar el shape de respuesta del chat.
- Fecha: 2026-02-24
- Cambio: `POST /api/chat` agrega estrategia `DNI_VALIDATION_PROVIDER=capture`; ante indisponibilidad/no-configuracion externa, `VALIDAR_DNI` responde `DNI recibido` y continua precalificacion.
- Tipo: non-breaking
- Impacto: elimina friccion por dependencias externas de validacion DNI manteniendo el mismo contrato `{ response: "<texto>" }`.
- Fecha: 2026-02-24
- Cambio: en `POST /api/chat`, cuando `VALIDAR_DNI` llega sin texto adicional del asistente, el proxy consulta internamente al asistente y agrega el siguiente paso de precalificacion segun el prompt configurado.
- Tipo: non-breaking
- Impacto: evita que la conversacion se estanque tras capturar un DNI valido y mantiene alineado el flujo con la secuencia definida en prompts del cliente.
- Fecha: 2026-02-24
- Cambio: parser multimedia en Lead Chat/widget embebido/SalesWidget acepta multiples URLs de imagen/video dentro de un mismo comando y mantiene render en carrusel.
- Tipo: non-breaking
- Impacto: evita perdida de media cuando la IA responde varias URLs en un solo bloque `[IMAGE]` o `[VIDEO]`.
- Fecha: 2026-02-24
- Cambio: en plantilla `inmobiliaria`, Lead Chat/widget embebido completan automaticamente media faltante de la propiedad mencionada (imagenes/videos del catalogo) cuando la IA devuelve una parte del set.
- Tipo: non-breaking
- Impacto: asegura carrusel completo por propiedad en respuestas inmobiliarias sin cambiar shape de payload.
- Fecha: 2026-02-24
- Cambio: carruseles multimedia de Lead Chat/widget embebido agregan soporte de drag/touch y rueda para scroll horizontal de imagenes/videos.
- Tipo: non-breaking
- Impacto: mejora navegacion de media multiple en desktop/mobile sin cambios de contrato API.
- Fecha: 2026-02-24
- Cambio: `POST /api/chat-event` agrega upsert server-side en `crm_contacts` para eventos `whatsapp_open`/`iacallcloser_open` (idempotente por conversacion + evento).
- Tipo: non-breaking
- Impacto: asegura que conversiones de chat a WhatsApp/IACloser aparezcan en `Listado de contactos` sin depender de escrituras publicas desde navegador.
