# Configuración de Autenticación Social en Firebase

## ✅ Implementación Completada

Se ha añadido **Google Sign-In** a tu aplicación para reducir la fricción del cliente:
- ✅ **Google Sign-In** - Listo para usar

> **Nota:** Facebook Sign-In está en el código pero desactivado debido a problemas con Meta Developers. Puedes activarlo más adelante cuando resuelvas el acceso a Facebook Developers.

## 📋 Configurar Google Sign-In en Firebase

### Paso 1: Habilitar Google Sign-In

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Navega a **Authentication** → **Sign-in method**
4. Haz clic en **Google**
5. Activa el switch "**Habilitar**"
6. Selecciona un email de soporte (puede ser tu email del proyecto)
7. Haz clic en **Guardar**

✅ **¡Listo!** Google Sign-In ya funciona automáticamente.

---

## 🎨 Características Implementadas

### 1. Botón de Social Login con Google
- Diseño moderno con los colores de marca de Google
- Icono SVG oficial de Google
- Estados de carga individuales
- Responsive y accesible

### 2. Flujo de Autenticación
- Popup de autenticación (más rápido y moderno)
- Creación automática de perfil de usuario si no existe
- Redirección automática al dashboard después del login
- Manejo de errores con mensajes específicos en español

### 3. Seguridad
- Detección de cuentas duplicadas
- Manejo de popups bloqueados
- Validación de errores de Firebase
- Protección contra cierre accidental del popup

### 4. Traducciones
Se añadieron las siguientes traducciones en español e inglés:
- `auth_pages.login.social_google`: "Continuar con Google"
- `auth_pages.login.divider`: "O continúa con"
- `auth_pages.login.error_title`: "Error"

---

## 🧪 Cómo Probar

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:8080/login`

3. Verás el nuevo botón de Google antes del formulario de email/password

4. **Durante desarrollo (antes de configurar Firebase):**
   - El botón está activo pero mostrará un error si no has configurado Google en Firebase
   - Mensaje de error: "Error al iniciar sesión con Google"

5. **Después de configurar Firebase:**
   - Haz clic en "Continuar con Google" → Abrirá popup de Google
   - Después de autenticarte, serás redirigido automáticamente al dashboard

---

## 🔧 Archivos Modificados

1. **`src/lib/auth.tsx`**
   - Añadidas funciones `signInWithGoogle()` (y `signInWithFacebook()` lista para futuro)
   - Creación automática de perfiles de usuario
   - Manejo de errores específicos

2. **`src/pages/Login.tsx`**
   - Añadido botón de Google con icono oficial
   - Estado de carga individual
   - Diseño con separador visual
   - Handler para Google authentication

3. **`src/locales/es.json`** y **`src/locales/en.json`**
   - Añadidas traducciones para los nuevos elementos

---

## ❓ Preguntas Frecuentes

### ¿Por qué solo Google y no Facebook?
Por simplicidad y velocidad de implementación. Google no requiere configuración de App en plataformas externas. Facebook está en el código pero comentado, listo para activar cuando configures Facebook Developers.

### ¿Qué pasa si un usuario ya tiene cuenta con email y luego intenta con Google?
Firebase enlazará automáticamente las cuentas si usan el mismo email. Si hay conflicto, mostrará un error explicando que ya existe una cuenta con ese email.

### ¿Funciona en producción?
Sí, una vez que habilites Google Sign-In en Firebase Console funcionará tanto en desarrollo como en producción.

---

## 📱 Próximos Pasos Opcionales

Si quieres añadir más métodos de autenticación en el futuro:
- **Facebook** - Ya está en el código, solo necesitas descomentar el botón y configurar Facebook Developers
- Apple Sign-In
- Microsoft
- Twitter
- GitHub

El código está diseñado para que sea fácil añadir más proveedores siguiendo el mismo patrón.

---

## 🎉 ¡Listo!

Una vez que configures Firebase como se indica arriba, tus usuarios podrán iniciar sesión con Google y Facebook con un solo clic, reduciendo significativamente la fricción de registro. 💪
