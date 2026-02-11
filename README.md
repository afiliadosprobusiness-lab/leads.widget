# Lead Widget — SaaS de Captura de Leads Proactiva con IA

Lead Widget es una plataforma SaaS de vanguardia que transforma sitios web estáticos en máquinas de generación de prospectos. Utilizando Inteligencia Artificial multimodelo y disparadores de comportamiento humano, el sistema pre-cualifica visitantes y los conecta directamente con el equipo de ventas vía WhatsApp.

El sistema incorpora un **"Viral Loop" (Ciclo Viral)** diseñado para el crecimiento exponencial mediante marca de agua estratégica y un sistema de afiliados integrado.

---

## 🚀 Características de Élite & Viral Loop

### 1. Modelo de Crecimiento "Caballo de Troya" (NUEVO)
El sistema está diseñado para venderse solo mientras es utilizado por los clientes.
*   **Viral Loop Integrado:** Cada widget gratuito o del "Plan Pro" incluye una marca de agua estratégica (*"⚡ Tecnología LeadWidget"*) que convierte el tráfico de tus clientes en nuevos prospectos para ti.
*   **Landing Contextual ("Espejo"):** Los clics en la marca de agua dirigen a una landing page especial (`/crear-ahora`) diseñada para capitalizar el momento "Wow" del usuario que acaba de ver el widget en acción.
*   **Sistema de Afiliados "Inception":** Cada usuario tiene acceso a un panel dedicado donde puede generar enlaces de referido, visualizar sus ganancias estimadas con una calculadora inteligente (CPA 20%) y solicitar retiros de fondos vía Yape/Plin/PayPal. Además, cuenta con una landing page pública (`/afiliados`) optimizada para captar nuevos socios.

### 2. Widget de Chat Proactivo e Inteligente
*   **IA de Próxima Generación:** Soporte nativo y optimizado.
*   **Triggers de Conversión:**
    *   **Retraso Temporal:** Saludo automático tras X segundos.
    *   **Scroll Profundo:** Se activa cuando el usuario muestra interés real.
    *   **Intento de Salida (Exit Intent):** Popup de retención que captura al usuario antes de abandonar.
*   **Iconos de Nicho:** Sets de iconos SVG optimizados para Ecommerce, Salud, Talleres, Inmobiliaria, Restaurantes, etc.
*   **Diseño Premium:** Interfaz flotante moderna, vibración háptica configurable y animaciones de "atención".

### 3. Plugins & Integraciones (NUEVO)
*   **Plugin Oficial de WordPress:** Instalación nativa sin código. Compatible con WooCommerce, Elementor y Divi. Descargable desde el Dashboard.
*   **Shopify App (En Desarrollo):** Aplicación nativa basada en Remix para instalación directa desde Shopify Store. Integración vía Theme App Extension.
*   **Compatibilidad Universal:** Scripts optimizados para Wix, Squarespace y sitios HTML/PHP personalizados.
*   **Guía Paso a Paso:** Módulo interactivo en el Dashboard que detecta tu ID y te enseña cómo instalar en cada plataforma.

### 4. Dashboard Integral & Builder Visual
*   **Live Preview:** Constructor de widgets en tiempo real con vista previa exacta de cómo se verá en el sitio web.
*   **Gestión de Leads:** CRM ligero incorporado con exportación a Excel/CSV.
*   **Analytics Hub:** Métricas de rendimiento (Vistas vs Conversiones).
*   **Centro de Afiliados:** Panel completo para socios con calculadora de proyección de ingresos, métricas de referidos en tiempo real (registrados vs pagados) y módulo de solicitud de pagos.
*   **Seguridad:** Panel de gestión de IPs bloqueadas y cortafuegos de IA anti-abuso.

---

## 💎 Estrategia de Monetización & Precios

El sistema implementa una **estrategia de precios híbrida y geolocalizada** para maximizar conversiones locales e internacionales simultáneamente.

### Planes Diferenciados
1.  **Plan Pro (Viral):**
    *   Precio accesible.
    *   **Marca de Agua:** OBLIGATORIA (Fuente de tráfico gratuito para la plataforma).
    *   Funcionalidades completas.
2.  **Plan Plus (Marca Blanca):**
    *   Ticket más alto (aprox. 2x).
    *   **Marca de Agua:** Removible/Personalizable.
    *   Para agencias y negocios establecidos.

### Precios Inteligentes (Smart Pricing)
El sistema detecta automáticamente la ubicación del visitante para adaptar la moneda y los métodos de pago:

| Característica | Mercado Local (Perú/Latam) | Mercado Internacional (USA/Global) |
| :--- | :--- | :--- |
| **Moneda** | **Soles (PEN)** | **Dólares (USD)** |
| **Plan Pro** | **S/ 30 / mes** | **$15 USD / mes** |
| **Plan Plus** | **S/ 60 / mes** | **$29 USD / mes** |
| **Métodos de Pago** | PayPal + **Yape/Plin/Transferencia** | **Solo PayPal** |

> **Nota:** La pestaña de pagos locales se oculta automáticamente para usuarios internacionales para reducir fricción y confusión.

---

## 🛠️ Stack Tecnológico Actualizado

*   **Core:** React 18, TypeScript, Vite.
*   **Estilos:** Tailwind CSS + **Shadcn/UI** (Diseño System Premium).
*   **Backend:** Node.js (Serverless Functions) + Firebase Admin SDK.
*   **Base de Datos:** Firebase Firestore (NoSQL realtime).
*   **Shopify Integration:** Remix Framework + Shopify CLI (Node.js).
*   **Pagos:** Integración nativa con **PayPal SDK** y subida de comprobantes para pagos manuales.
*   **Internacionalización:** **i18n** completo (Español/Inglés) con detección automática de navegador.
*   **PWA:** Soporte progresivo instalable en móviles y escritorio.

---

## 📦 Estructura de Archivos Clave

*   `api/w/[widgetId].js`: **El cerebro del viral loop.** Script que inyecta el widget, gestiona la marca de agua dinámica y el sistema de referidos.
*   `shopify-app`: **Shopify App Nativa.** Aplicación Remix + Theme Extension para integración directa en Shopify Stores.
*   `wordpress-plugin`: **WordPress Integration.** Plugin nativo para distribución en WP Repository.
*   `src/pages/Dashboard.tsx`: Panel principal con lógica de facturación híbrida y builder.
*   `src/pages/Landing.tsx`: Home page optimizada para conversión con detección de idioma/moneda.
*   `src/pages/CreateNow.tsx`: Landing page "Espejo" específica para tráfico proveniente de la marca de agua.
*   `src/pages/AffiliatesLanding.tsx`: Landing page pública para reclutamiento de socios (Multilingüe + Chat Widget).
*   `src/components/AffiliateCard.tsx`: Tarjeta inteligente reutilizable para el programa de referidos, con diseño adaptable a móviles y persistencia de estado.
*   `src/locales/*.json`: Archivos de traducción expandidos para cubrir todo el flujo de afiliados ("Inception").
*   `src/lib/wsp.ts`: Utilidades para la integración profunda con WhatsApp.

---

## 🔒 Seguridad
*   **Cortafuegos de IA:** Análisis de toxicidad en tiempo real.
*   **Rate Limiting:** Protección contra abuso de API.
*   **Aislamiento de Datos:** Reglas de seguridad RLS en Firestore.

---

### 🚀 Lead Widget
*Convierte tráfico en ventas mientras te expandes viralmente.*
