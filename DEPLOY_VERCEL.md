# 🚀 Guía de Despliegue en Vercel

## Paso 1: Preparar el Proyecto

### 1.1 Asegúrate de tener Git inicializado
```bash
git init
git add .
git commit -m "Initial commit - WhatsApp Leads Peru"
```

### 1.2 Crea un repositorio en GitHub
1. Ve a https://github.com/new
2. Crea un nuevo repositorio (puede ser privado)
3. Sigue las instrucciones para subir tu código:

```bash
git remote add origin https://github.com/TU-USUARIO/whatsapp-leads-peru.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Desplegar en Vercel

### 2.1 Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Regístrate con tu cuenta de GitHub

### 2.2 Importar el proyecto
1. Click en "Add New..." → "Project"
2. Selecciona tu repositorio `whatsapp-leads-peru`
3. Click en "Import"

### 2.3 Configurar el proyecto

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 2.4 Agregar Variables de Entorno

En la sección "Environment Variables", agrega:

```
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

Puedes obtener estos valores de tu archivo `.env` local o desde Supabase Dashboard.

### 2.5 Desplegar
1. Click en "Deploy"
2. Espera 2-3 minutos
3. ¡Listo! Tu proyecto estará en `https://tu-proyecto.vercel.app`

---

## Paso 3: Configurar el Dominio del Widget

### Opción A: Usar el dominio de Vercel

Una vez desplegado, tu widget estará disponible en:
```
https://tu-proyecto.vercel.app/w/WIDGET_ID.js
```

### Opción B: Configurar dominio personalizado (leadwidget.pe)

1. En Vercel, ve a Settings → Domains
2. Agrega tu dominio `leadwidget.pe`
3. Configura los DNS según las instrucciones de Vercel
4. Espera la propagación (5-30 minutos)

---

## Paso 4: Actualizar el Dashboard

Ahora necesitas actualizar el código del Dashboard para que genere el código de instalación correcto.

### 4.1 Editar Dashboard.tsx

Busca la línea que genera el código embed (aproximadamente línea 479):

**ANTES:**
```javascript
const code = `<script src="https://leadwidget.pe/w/${widgetConfig?.widget_id}.js" async></script>`;
```

**DESPUÉS:**
```javascript
const code = `<script src="https://tu-proyecto.vercel.app/api/w/${widgetConfig?.widget_id}.js" async></script>`;
```

O si ya configuraste tu dominio personalizado:
```javascript
const code = `<script src="https://leadwidget.pe/api/w/${widgetConfig?.widget_id}.js" async></script>`;
```

### 4.2 Hacer commit y push

```bash
git add .
git commit -m "Update widget URL to Vercel deployment"
git push
```

Vercel automáticamente detectará el cambio y redesplegará.

---

## Paso 5: Probar el Widget

### 5.1 Obtener tu código de instalación

1. Ve a tu dashboard desplegado: `https://tu-proyecto.vercel.app/app`
2. Inicia sesión
3. Ve a la pestaña "Widget"
4. Copia el código de instalación

### 5.2 Probar en Carrd.co

1. Ve a tu sitio en Carrd.co
2. Settings → Code → Footer Code
3. Pega el código:
```html
<script src="https://tu-proyecto.vercel.app/api/w/TU_WIDGET_ID.js" async></script>
```
4. Guarda y publica
5. Visita tu sitio y verifica que el widget aparezca

---

## 🔧 Solución de Problemas

### Error: "Widget not found"
- Verifica que el `widget_id` en la URL sea correcto
- Revisa que la tabla `widget_configs` tenga datos

### Error: CORS
- Verifica que `vercel.json` tenga los headers correctos
- El archivo ya está configurado con `Access-Control-Allow-Origin: *`

### El widget no aparece
1. Abre la consola del navegador (F12)
2. Busca errores en la pestaña "Console"
3. Verifica que el script se esté cargando en la pestaña "Network"

### Variables de entorno no funcionan
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Asegúrate de que estén configuradas
3. Redespliega el proyecto (Deployments → ... → Redeploy)

---

## 📊 Monitoreo

### Ver logs en Vercel
1. Ve a tu proyecto en Vercel
2. Click en "Deployments"
3. Click en el deployment activo
4. Ve a "Functions" para ver logs de las API routes

### Analytics
Vercel automáticamente te da analytics de:
- Visitas
- Performance
- Errores

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel automáticamente:
1. Detecta el push
2. Construye el proyecto
3. Despliega la nueva versión
4. ¡Todo en ~2 minutos!

---

## 💡 Próximos Pasos

1. ✅ Desplegar en Vercel
2. ✅ Configurar variables de entorno
3. ✅ Actualizar URL del widget en Dashboard
4. ✅ Probar en Carrd.co
5. 🔜 Configurar dominio personalizado (opcional)
6. 🔜 Aplicar migración SQL para campos de IA
7. 🔜 Configurar API de OpenAI

---

## 📞 Comandos Útiles

```bash
# Ver el proyecto localmente
npm run dev

# Construir para producción
npm run build

# Preview de la build
npm run preview

# Desplegar manualmente con Vercel CLI (opcional)
npx vercel
```

---

## ✨ Resultado Final

Una vez completado, tendrás:

- ✅ Dashboard funcionando en `https://tu-proyecto.vercel.app`
- ✅ Widget dinámico en `https://tu-proyecto.vercel.app/api/w/WIDGET_ID.js`
- ✅ Código embebible funcionando en Carrd.co y cualquier sitio web
- ✅ Leads guardándose automáticamente en Supabase
- ✅ Despliegue automático con cada push a GitHub

¡Tu SaaS está listo para producción! 🎉
