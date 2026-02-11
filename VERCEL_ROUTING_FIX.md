# 🔧 Solución: Error 404 en Rutas de Vercel

## ❌ Problema

Cuando intentas acceder directamente a rutas como:
- `https://tu-proyecto.vercel.app/superadmin`
- `https://tu-proyecto.vercel.app/app`
- `https://tu-proyecto.vercel.app/login`

Vercel devuelve un error 404 "Page Not Found".

## 🤔 ¿Por Qué Sucede?

Tu aplicación es una **Single Page Application (SPA)** usando React Router. Esto significa:

1. **En desarrollo local**: El servidor de Vite maneja todas las rutas y siempre sirve `index.html`
2. **En producción (Vercel)**: Por defecto, Vercel busca archivos físicos para cada ruta
3. **El problema**: No existe un archivo físico `/superadmin.html`, solo existe `/index.html`

## ✅ Solución Implementada

He actualizado el archivo `vercel.json` para que **todas las rutas** redirijan a `index.html`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### ¿Qué hace esto?

- **Captura todas las rutas**: `/(.*)`
- **Las redirige a index.html**: Donde React Router toma el control
- **React Router maneja la navegación**: Muestra el componente correcto según la ruta

## 🚀 Cómo Aplicar la Solución

### Opción 1: Push a GitHub (Recomendado)

```bash
git add vercel.json
git commit -m "Fix SPA routing for Vercel"
git push
```

Vercel automáticamente detectará el cambio y redesplegará.

### Opción 2: Redesplegar Manualmente en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Click en "Deployments"
3. Click en "..." del último deployment
4. Click en "Redeploy"

## 🧪 Verificar que Funciona

Después del redespliegue, prueba acceder directamente a:

✅ `https://tu-proyecto.vercel.app/superadmin`
✅ `https://tu-proyecto.vercel.app/app`
✅ `https://tu-proyecto.vercel.app/login`
✅ `https://tu-proyecto.vercel.app/register`

Todas deberían funcionar correctamente.

## 📋 Rutas Disponibles en tu App

Según `src/App.tsx`, estas son las rutas configuradas:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Landing | Página principal |
| `/login` | Login | Inicio de sesión |
| `/register` | Register | Registro de usuarios |
| `/app` | Dashboard | Panel del cliente |
| `/superadmin` | SuperAdmin | Panel de super administrador |
| `*` | NotFound | Página 404 |

## 🔍 Detalles Técnicos

### Antes (❌ No funcionaba)

```
Usuario → https://tu-proyecto.vercel.app/superadmin
         ↓
Vercel busca archivo: /superadmin.html
         ↓
No existe → 404 Error
```

### Después (✅ Funciona)

```
Usuario → https://tu-proyecto.vercel.app/superadmin
         ↓
Vercel rewrite: /(.*) → /index.html
         ↓
Sirve: /index.html
         ↓
React Router lee la URL: /superadmin
         ↓
Muestra: <SuperAdmin /> componente
```

## 🎯 Configuración Completa de vercel.json

```json
{
  "rewrites": [
    { 
      "source": "/(.*)", 
      "destination": "/index.html" 
    }
  ]
}
```

Esta es la configuración **mínima y recomendada** para SPAs en Vercel.

## 🔐 Credenciales de Super Admin

Recuerda que para acceder a `/superadmin` necesitas:

**Email**: `superadmin@leadwidget.pe`
**Contraseña**: La que configuraste en Supabase

Si no tienes un usuario super admin creado, necesitas:

1. Ir a Supabase Dashboard
2. Authentication → Users
3. Crear un usuario con email `superadmin@leadwidget.pe`
4. Ir a Table Editor → `user_roles`
5. Insertar un registro:
   - `user_id`: El ID del usuario creado
   - `role`: `superadmin`

## 🐛 Solución de Problemas

### Problema: Sigue sin funcionar después del redespliegue

**Solución 1**: Limpia la caché del navegador
- Chrome: Ctrl + Shift + Delete
- O abre en modo incógnito

**Solución 2**: Verifica que el archivo se subió
```bash
git status
git log --oneline -1
```

**Solución 3**: Fuerza un redespliegue
1. Haz un cambio mínimo (agrega un espacio en README.md)
2. Commit y push
3. Vercel redesplegará

### Problema: Las rutas funcionan pero el CSS no carga

**Solución**: Verifica que el build se completó correctamente
- Ve a Vercel Dashboard → Deployments
- Click en el último deployment
- Revisa los logs de build
- Busca errores en la sección "Build Logs"

## 📚 Recursos Adicionales

- [Vercel SPA Configuration](https://vercel.com/docs/concepts/projects/project-configuration#rewrites)
- [React Router with Vercel](https://vercel.com/guides/deploying-react-with-vercel)

## ✅ Checklist de Verificación

Después de aplicar la solución:

- [ ] `vercel.json` actualizado con rewrites
- [ ] Cambios commiteados y pusheados a GitHub
- [ ] Vercel redesplegó automáticamente
- [ ] Puedes acceder a `/superadmin` directamente
- [ ] Puedes acceder a `/app` directamente
- [ ] Puedes acceder a `/login` directamente
- [ ] La navegación interna funciona correctamente
- [ ] El CSS y assets cargan correctamente

¡Listo! Ahora tu SPA funciona correctamente en Vercel. 🎉
