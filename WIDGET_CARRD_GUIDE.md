# Guía: Cómo Insertar el Widget en Carrd.co

## 📋 Método 1: Usando el Widget Alojado Localmente (Para Pruebas)

### Paso 1: Acceder a la página de prueba
1. Abre tu navegador en: `http://localhost:8080/widget-test.html`
2. Verás el widget aparecer automáticamente después de 5 segundos
3. También puedes hacer clic en el botón verde en la esquina inferior derecha

### Paso 2: Probar el widget
1. Haz clic en el botón del widget
2. Completa el formulario con tu nombre y teléfono
3. Responde la pregunta de interés
4. El widget te redirigirá a WhatsApp con el mensaje pre-llenado

---

## 🌐 Método 2: Insertar en Carrd.co (Producción)

### Opción A: Usando un CDN Público (Recomendado)

Para que el widget funcione en Carrd.co, necesitas alojar el archivo JavaScript en un servidor público. Aquí tienes las opciones:

#### 1. **Usando GitHub Pages** (GRATIS)

**Paso 1:** Sube el archivo `widget-embed.js` a un repositorio de GitHub

**Paso 2:** Activa GitHub Pages en el repositorio

**Paso 3:** En Carrd.co, ve a Settings → Code → Footer Code y pega:

```html
<script src="https://TU-USUARIO.github.io/TU-REPO/widget-embed.js"></script>
```

#### 2. **Usando Netlify/Vercel** (GRATIS)

**Paso 1:** Despliega el proyecto en Netlify o Vercel

**Paso 2:** En Carrd.co, ve a Settings → Code → Footer Code y pega:

```html
<script src="https://tu-proyecto.netlify.app/widget-embed.js"></script>
```

#### 3. **Usando un CDN como jsDelivr** (GRATIS)

**Paso 1:** Sube el archivo a GitHub

**Paso 2:** Usa jsDelivr para servir el archivo:

```html
<script src="https://cdn.jsdelivr.net/gh/TU-USUARIO/TU-REPO@main/widget-embed.js"></script>
```

---

### Opción B: Código Inline (Más Simple pero Más Largo)

Si prefieres no usar un servidor externo, puedes insertar el código directamente en Carrd.co:

**Paso 1:** En Carrd.co, ve a Settings → Code → Footer Code

**Paso 2:** Pega el siguiente código (copia todo el contenido de `widget-embed.js` y envuélvelo en tags `<script>`):

```html
<script>
// Pega aquí todo el contenido de widget-embed.js
(function() {
  'use strict';
  // ... resto del código
})();
</script>
```

---

## ⚙️ Personalizar el Widget

Antes de insertar el widget, puedes personalizar la configuración editando estas líneas en `widget-embed.js`:

```javascript
const config = {
  primaryColor: '#00C185',           // Color principal del widget
  businessName: 'LeadWidget',        // Nombre de tu negocio
  welcomeMessage: '¡Hola! ¿En qué podemos ayudarte?',  // Mensaje de bienvenida
  nicheQuestion: '¿En qué distrito te encuentras?',    // Pregunta personalizada
  whatsappDestination: '+51987654321',  // Tu número de WhatsApp
  template: 'general'                // Plantilla (general, inmobiliaria, clinica, etc.)
};
```

---

## 🔧 Solución de Problemas en Carrd.co

### Problema: El widget no aparece

**Solución 1:** Verifica que el script esté en el **Footer Code**, no en el Header

**Solución 2:** Asegúrate de que la URL del script sea accesible públicamente
- Abre la URL del script directamente en tu navegador
- Deberías ver el código JavaScript

**Solución 3:** Revisa la consola del navegador (F12)
- Busca errores de CORS o carga de scripts
- Si ves errores de CORS, necesitas alojar el archivo en un servidor con CORS habilitado

### Problema: El widget aparece pero no funciona

**Solución 1:** Verifica que el número de WhatsApp esté en formato internacional
- Correcto: `+51987654321`
- Incorrecto: `987654321`

**Solución 2:** Asegúrate de que Carrd.co permita JavaScript
- Necesitas un plan Pro de Carrd.co para usar código personalizado

---

## 🚀 Método Rápido para Probar AHORA en Carrd.co

### Usando un servicio temporal de hosting:

1. Ve a https://gist.github.com
2. Crea un nuevo Gist con el contenido de `widget-embed.js`
3. Copia la URL del "Raw" del archivo
4. En Carrd.co, pega en Footer Code:

```html
<script src="URL_DEL_RAW_DE_TU_GIST"></script>
```

---

## 📱 Verificar que Funciona

1. Publica tu sitio en Carrd.co
2. Abre el sitio en modo incógnito
3. Espera 5 segundos (el widget debería aparecer automáticamente)
4. O busca el botón verde en la esquina inferior derecha
5. Completa el formulario y verifica que te redirija a WhatsApp

---

## 💡 Próximos Pasos

Una vez que el widget funcione en Carrd.co:

1. **Conecta con tu Dashboard**: Modifica el widget para que envíe los leads a tu base de datos
2. **Activa la IA**: Configura la API key de OpenAI en el panel de IA
3. **Personaliza**: Ajusta colores, mensajes y comportamiento según tu negocio

---

## 📞 Soporte

Si tienes problemas, verifica:
- ✅ Que tengas un plan Pro de Carrd.co (necesario para código personalizado)
- ✅ Que el archivo JavaScript esté accesible públicamente
- ✅ Que no haya errores en la consola del navegador (F12)
- ✅ Que el número de WhatsApp esté en formato correcto
