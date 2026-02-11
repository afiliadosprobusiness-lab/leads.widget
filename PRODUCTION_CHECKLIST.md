# 🚀 Checklist: Preparación para Producción

## ✅ COMPLETADO

### Frontend & UI
- [x] Landing page diseñada
- [x] Sistema de autenticación (Login/Register)
- [x] Dashboard del cliente completo
- [x] Panel de Super Admin completo
- [x] Configuración de IA (OpenAI/Anthropic/Google)
- [x] Widget embebible creado
- [x] Código dinámico según dominio
- [x] Diseño responsive

### Backend & Database
- [x] Tablas de Supabase creadas
- [x] Migración de campos IA preparada
- [x] Autenticación configurada
- [x] API route del widget creada

### Deployment
- [x] Configurado para Vercel
- [x] Routing de SPA arreglado
- [x] Error de CSS build arreglado

---

## 🔴 CRÍTICO - HACER ANTES DE LANZAR

### 1. Aplicar Migración de Base de Datos (5 min)

**Archivo**: `supabase/migrations/20260122184800_add_ai_config.sql`

**Pasos**:
1. Ve a Supabase Dashboard → SQL Editor
2. Copia y pega el contenido del archivo
3. Click en "Run"

**Verifica**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name LIKE 'ai_%';
```

Deberías ver: `ai_provider`, `ai_api_key`, `ai_model`, etc.

---

### 2. Crear Usuario Super Admin (5 min)

**Opción A: Desde Supabase Dashboard**
1. Authentication → Users → Add User
2. Email: `superadmin@leadwidget.pe`
3. Password: (tu contraseña segura)
4. Confirmar email automáticamente

**Opción B: Desde SQL**
```sql
-- Primero crea el usuario en Auth
-- Luego agrega el rol:
INSERT INTO user_roles (user_id, role)
VALUES ('UUID_DEL_USUARIO', 'superadmin');
```

---

### 3. Configurar Variables de Entorno en Vercel (2 min)

1. Vercel Dashboard → tu proyecto → Settings → Environment Variables
2. Agrega:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```
3. Click "Save"
4. Redeploy el proyecto

---

### 4. Hacer Push de Cambios (2 min)

```bash
git add .
git commit -m "Add widget API route and fix routing"
git push
```

Vercel redesplegará automáticamente.

---

## ⚠️ IMPORTANTE - HACER PRONTO

### 5. Configurar Políticas de Seguridad (RLS) (15 min)

Actualmente las tablas están abiertas. Necesitas configurar Row Level Security:

**Para `leads`**:
```sql
-- Solo el dueño puede ver sus leads
CREATE POLICY "Users can view own leads"
ON leads FOR SELECT
USING (client_id = auth.uid());

-- Cualquiera puede insertar (para el widget)
CREATE POLICY "Anyone can insert leads"
ON leads FOR INSERT
WITH CHECK (true);
```

**Para `widget_configs`**:
```sql
-- Solo el dueño puede ver/editar su config
CREATE POLICY "Users can manage own config"
ON widget_configs FOR ALL
USING (user_id = auth.uid());
```

**Para `profiles`**:
```sql
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());
```

---

### 6. Configurar Email Templates (10 min)

En Supabase → Authentication → Email Templates:

1. **Confirm Signup**: Personaliza el email de confirmación
2. **Reset Password**: Personaliza el email de recuperación
3. **Magic Link**: Si usas magic links

---

### 7. Configurar Dominio Personalizado (Opcional, 30 min)

Si tienes `leadwidget.pe`:

1. Vercel → Settings → Domains → Add Domain
2. Agrega `leadwidget.pe` y `www.leadwidget.pe`
3. Configura DNS según instrucciones de Vercel
4. Espera propagación (5-30 min)

---

## 💡 RECOMENDADO - MEJORAR EXPERIENCIA

### 8. Agregar Analytics (10 min)

**Google Analytics**:
1. Crea una propiedad en Google Analytics
2. Agrega el script en `index.html`

**Vercel Analytics** (más fácil):
1. Vercel Dashboard → Analytics → Enable
2. Listo (gratis hasta 100k eventos/mes)

---

### 9. Configurar Emails Transaccionales (30 min)

Para enviar emails de bienvenida, notificaciones, etc:

**Opción 1: Resend** (recomendado)
1. Crea cuenta en resend.com
2. Verifica tu dominio
3. Crea templates
4. Integra con Supabase Edge Functions

**Opción 2: SendGrid**
Similar a Resend

---

### 10. Implementar Sistema de Pagos Real (2 horas)

Actualmente solo sube comprobantes. Para automatizar:

**Opción A: Mercado Pago** (Perú)
- Integración con API
- Webhooks para verificación automática
- Suscripciones recurrentes

**Opción B: Stripe** (Internacional)
- Más fácil de integrar
- Mejor documentación
- Suscripciones automáticas

---

### 11. Conectar IA Real (1 hora)

Actualmente solo guardas la config. Para que funcione:

1. Crear Supabase Edge Function para IA
2. Recibir mensajes del widget
3. Llamar a OpenAI/Anthropic/Google
4. Retornar respuesta al widget
5. Guardar conversación en BD

---

### 12. Agregar Monitoreo de Errores (15 min)

**Sentry** (recomendado):
```bash
npm install @sentry/react
```

Configura en `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "tu_dsn_de_sentry",
  environment: import.meta.env.MODE,
});
```

---

## 🎯 OPCIONAL - FUNCIONALIDADES FUTURAS

### 13. Dashboard Analytics Avanzado
- [ ] Gráficas de conversión
- [ ] Mapa de calor del widget
- [ ] A/B testing de mensajes
- [ ] Funnel de conversión

### 14. Integraciones
- [ ] Zapier
- [ ] Make (Integromat)
- [ ] Google Sheets
- [ ] CRM (HubSpot, Salesforce)

### 15. Funcionalidades Premium
- [ ] Widget con video
- [ ] Chat en vivo
- [ ] Chatbot con IA avanzada
- [ ] Múltiples widgets por cliente
- [ ] White label

---

## 📊 ESTADO ACTUAL

### ✅ Listo para MVP (80%)
- Frontend completo
- Backend básico
- Widget funcional
- Deployment configurado

### ⚠️ Falta para Producción (20%)
- Migración de BD aplicada
- Usuario super admin creado
- Variables de entorno en Vercel
- RLS configurado
- Push de cambios

### 💡 Mejoras Futuras
- IA funcionando
- Pagos automatizados
- Analytics avanzado
- Emails transaccionales

---

## 🚀 PLAN DE LANZAMIENTO

### Fase 1: MVP (Esta Semana)
1. Aplicar migración de BD
2. Crear super admin
3. Configurar variables de entorno
4. Push y deploy
5. Probar todo el flujo

### Fase 2: Beta (Próxima Semana)
1. Invitar 5-10 clientes beta
2. Recoger feedback
3. Arreglar bugs
4. Configurar RLS
5. Agregar analytics

### Fase 3: Producción (2 Semanas)
1. Implementar pagos reales
2. Conectar IA
3. Configurar dominio personalizado
4. Marketing y lanzamiento oficial

---

## ✅ CHECKLIST RÁPIDO PARA HOY

Para tener el MVP funcionando HOY:

- [ ] Aplicar migración SQL (5 min)
- [ ] Crear usuario super admin (5 min)
- [ ] Configurar variables de entorno en Vercel (2 min)
- [ ] Push de cambios (2 min)
- [ ] Probar `/superadmin` (1 min)
- [ ] Probar crear widget (2 min)
- [ ] Probar widget en Carrd.co (5 min)
- [ ] Verificar que leads se guarden (2 min)

**Total: ~25 minutos** ⏱️

---

## 🎉 DESPUÉS DE COMPLETAR

Tu SaaS estará:
- ✅ Desplegado en producción
- ✅ Accesible públicamente
- ✅ Funcional para clientes
- ✅ Capturando leads reales
- ✅ Listo para monetizar

¡Felicidades! 🚀
