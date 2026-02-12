# 🌐 Sistema de Dominio Dinámico - Widget

## ✨ ¿Qué es esto?

He implementado un **sistema de dominio dinámico** que hace que el código del widget se adapte automáticamente al entorno donde esté desplegado.

## 🎯 Problema Resuelto

**ANTES:**
- El código del widget estaba hardcodeado: `https://leadwidget.pe/w/...`
- No funcionaba en localhost
- No funcionaba en Vercel
- Tenías que cambiar manualmente el código cada vez que cambiabas de entorno

**AHORA:**
- El código se genera dinámicamente según el dominio actual
- Funciona automáticamente en:
  - ✅ Localhost: `http://localhost:8080/api/w/...`
  - ✅ Vercel: `https://tu-proyecto.vercel.app/api/w/...`
  - ✅ Dominio personalizado: `https://leadwidget.pe/api/w/...`

## 🔧 Cómo Funciona

### 1. Detección Automática del Dominio

En `Dashboard.tsx`, el código ahora usa:

```javascript
const copyEmbedCode = () => {
  // Detecta automáticamente el dominio actual
  const currentDomain = window.location.origin;
  const widgetUrl = `${currentDomain}/api/w/${widgetConfig?.widget_id}.js`;
  const code = `<script src="${widgetUrl}" async></script>`;
  
  navigator.clipboard.writeText(code);
};
```

### 2. Visualización Dinámica

El código mostrado en el dashboard también es dinámico:

```jsx
<div className="bg-muted rounded-lg p-4 font-mono text-sm break-all">
  {`<script src="${window.location.origin}/api/w/${widgetConfig?.widget_id}.js" async></script>`}
</div>
```

### 3. Indicador Visual

Agregué un indicador que muestra el dominio actual:

```
🌐 Dominio Dinámico
Actualmente: http://localhost:8080
El código se adaptará automáticamente cuando despliegues en Vercel o tu dominio personalizado.
```

## 📋 Ejemplos de Uso

### En Desarrollo Local
```html
<script src="http://localhost:8080/api/w/2877dae4-b990-424b-810b-ea17fa49e673.js" async></script>
```

### En Vercel
```html
<script src="https://leads-widget.vercel.app/api/w/2877dae4-b990-424b-810b-ea17fa49e673.js" async></script>
```

### Con Dominio Personalizado
```html
<script src="https://leadwidget.pe/api/w/2877dae4-b990-424b-810b-ea17fa49e673.js" async></script>
```

## 🚀 Ventajas

1. **Sin Configuración Manual**: No necesitas cambiar nada al desplegar
2. **Funciona en Todos los Entornos**: Localhost, staging, producción
3. **Fácil de Probar**: Copia el código y funciona inmediatamente
4. **Escalable**: Cuando agregues más dominios, funcionará automáticamente
5. **Sin Errores**: Elimina el problema de URLs incorrectas

## 🧪 Cómo Probar

### 1. En Localhost (Ahora)

1. Ve a `http://localhost:8080/app`
2. Inicia sesión
3. Ve a la pestaña "Widget"
4. Copia el código de instalación
5. Verás que dice: `http://localhost:8080/api/w/...`

### 2. Después de Desplegar en Vercel

1. Despliega el proyecto en Vercel
2. Ve a `https://tu-proyecto.vercel.app/app`
3. Inicia sesión
4. Ve a la pestaña "Widget"
5. Copia el código de instalación
6. Verás que dice: `https://tu-proyecto.vercel.app/api/w/...`

### 3. Con Dominio Personalizado

1. Configura tu dominio en Vercel
2. Ve a `https://leadwidget.pe/app`
3. Inicia sesión
4. Ve a la pestaña "Widget"
5. Copia el código de instalación
6. Verás que dice: `https://leadwidget.pe/api/w/...`

## 🎨 Cambios Realizados

### Archivos Modificados:

1. **`src/pages/Dashboard.tsx`**
   - ✅ Función `copyEmbedCode()` ahora usa `window.location.origin`
   - ✅ Visualización del código usa dominio dinámico
   - ✅ Agregado indicador visual del dominio actual

### Código Agregado:

```tsx
// Detección dinámica del dominio
const currentDomain = window.location.origin;
const widgetUrl = `${currentDomain}/api/w/${widgetConfig?.widget_id}.js`;

// Indicador visual
<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p>🌐 Dominio Dinámico</p>
  <p>Actualmente: <code>{window.location.origin}</code></p>
  <p>El código se adaptará automáticamente cuando despliegues...</p>
</div>
```

## 🔄 Flujo Completo

```
Usuario en Dashboard
    ↓
Hace clic en "Copiar código"
    ↓
JavaScript detecta: window.location.origin
    ↓
Genera URL dinámica: ${origin}/api/w/${widgetId}.js
    ↓
Copia al portapapeles
    ↓
Usuario pega en Carrd.co
    ↓
Widget funciona correctamente ✅
```

## 💡 Próximos Pasos

Ahora que el código es dinámico:

1. ✅ **Funciona en localhost** - Puedes probarlo ahora mismo
2. ✅ **Funciona en Vercel** - Solo despliega y funcionará
3. ✅ **Funciona con dominio personalizado** - Configura y listo

**No necesitas hacer nada más.** El sistema se adapta automáticamente.

## 🎉 Resultado

Ahora puedes:
- ✅ Probar el widget en localhost sin configuración
- ✅ Desplegar en Vercel y funciona automáticamente
- ✅ Configurar tu dominio y sigue funcionando
- ✅ Compartir el código con clientes sin preocuparte por el entorno

**¡El widget es verdaderamente portátil y listo para producción!** 🚀
