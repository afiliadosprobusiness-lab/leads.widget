# 🛍️ Plan de Desarrollo: Shopify App para Lead Widget

Este documento detalla la estrategia y arquitectura para llevar Lead Widget al ecosistema de Shopify, permitiendo una instalación "Ncode" (sin código) y nativa para los comerciantes.

## 🎯 Objetivo
Crear una **Shopify App** pública (o personalizada inicialmente) que permita a los dueños de tiendas insertar el widget de WhatsApp simplemente activándolo desde el editor visual de temas de Shopify, vinculando automáticamente su `Widget ID`.

---

## 🏗️ Arquitectura Técnica

A diferencia de WordPress (PHP), Shopify usa **Theme App Extensions** y **App Embed Blocks**.

### Componentes:
1.  **Shopify App (Backend/Frontend):**
    *   Usaremos el stack moderno: **Remix (Node.js)**.
    *   Actúa como el panel de control dentro de Shopify Admin.
    *   Gestiona la autenticación (OAuth) y la facturación (Billing API) si decidimos cobrar a través de Shopify.
2.  **Theme App Extension (El Widget):**
    *   Bloque de código Liquid/JS que se inyecta en la tienda (`App Embed Block`).
    *   **NO** edita el código del tema del cliente (es seguro y limpio).
    *   Contendrá un campo de configuración `text` para que el usuario pegue su `Widget ID`.

### Flujo de Datos:
1.  Usuario instala la App en su tienda Shopify.
2.  La App le muestra instrucciones y su `Widget ID` (si ya tiene cuenta) o le permite crear una.
3.  Usuario va al Editor de Temas -> App Embeds.
4.  Activa "Lead Widget" y pega su ID.
5.  El script de Lead Widget (`api/w/[id].js`) se carga en la tienda.

---

## 📋 Requisitos Previos (Para la próxima sesión)

Para poder desarrollar esto, necesitarás:

1.  **Cuenta de Shopify Partners (Gratis):**
    *   Regístrate en [partners.shopify.com](https://partners.shopify.com/).
    *   Es necesario para crear apps y tiendas de prueba.
2.  **Tienda de Desarrollo:**
    *   Dentro de tu panel de Partners, crea una "Development Store" para probar la app mientras la construimos.
3.  **Node.js & NPM:** (Ya los tienes instalados).

---

## 🚀 Fases de Implementación

### Fase 1: Inicialización (Scaffolding)
*   Ejecutar `npm init @shopify/app@latest`.
*   Configurar el proyecto localmente.

### Fase 2: Theme Extension
*   Crear la extensión de tipo `App Embed Block`.
*   Configurar el `schema` para aceptar el `Widget ID` (campo de texto).
*   Inyectar el script asíncrono que apunta a tu backend en Vercel.

### Fase 3: Conexión con Firebase
*   (Opcional para V1) Hacer que la App de Shopify cree automáticamente la cuenta en tu Firebase si no existe, usando los datos de la tienda.

### Fase 4: Despliegue
*   Subir la app a un hosting (Fly.io, Heroku o Vercel - aunque Shopify prefiere Fly/Heroku para Remix debido a websockets/long-running processes, pero para solo extensiones es más simple).
*   Publicar versión.

---

## 💡 Ventajas de esta integración
*   **Zero Code:** El cliente no toca HTML nunca.
*   **Velocidad:** Shopify sirve los assets de la extensión via CDN global.
*   **Presencia:** Posibilidad de aparecer en la App Store (millones de clientes potenciales).
