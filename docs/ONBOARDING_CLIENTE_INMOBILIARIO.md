# Onboarding Cliente Inmobiliario (Lotes e Inmuebles) - Lead Widget

## Objetivo
Recolectar toda la informacion necesaria para configurar `leads.widget` con foco en conversion real: precalificacion, contenido comercial y cierre por WhatsApp (o ICallCloser si aplica).

## 1) Checklist de arranque (bloqueante)
- `Business name` (nombre comercial exacto).
- `WhatsApp destino` con codigo de pais (ejemplo: `51987654321`).
- `Zona(s) de atencion` prioritarias.
- `Tipo de oferta principal`: lotes, departamentos, casas, mixto.
- `Rango de precios real` (min/max).
- `Activos de bienvenida` (imagen/audio/video) al menos 1.
- `Catalogo inicial` (minimo 5 fichas cargadas si ya tienen inventario).
- `Prompt IA` validado para su nicho.

## 2) Datos del negocio (Dashboard > Configuracion del widget + IA)
- `Nombre del negocio`.
- `Nicho/industria`: `inmobiliaria`.
- `Descripcion corta del negocio` (3-5 lineas).
- `Propuesta de valor` (por que compran contigo).
- `Horario comercial`.
- `Tiempo de respuesta humano estimado`.
- `Asesores comerciales disponibles`.
- `Idiomas de atencion` (ES/EN).

## 3) Datos comerciales clave para precalificar (obligatorio)
Definir reglas concretas para que la IA descarte curiosos y pase solo leads utiles:

- `Tipo de interes`: comprar, alquilar, invertir.
- `Producto`: lote, departamento, casa, terreno.
- `Zona preferida`.
- `Presupuesto`.
- `Cuota inicial minima` (si financia).
- `Plazo de compra/mudanza` (inmediato, 30 dias, 3 meses, etc).
- `Forma de pago`: contado, credito, directo constructor.
- `Objetivo`: vivienda propia, segunda vivienda, inversion.
- `Nombre y telefono` (siempre requeridos antes de cierre).
- `DNI validado` (si usaran compuerta de identidad).

## 4) Configuracion de cierre
### Opcion A: WhatsApp (recomendado para inicio)
- Confirmar numero destino de WhatsApp.
- Definir mensaje de handoff esperado.
- Definir condiciones exactas de pase:
  - presupuesto confirmado
  - zona confirmada
  - plazo confirmado
  - nombre + telefono completos
  - DNI validado (si habilitado)

### Opcion B: ICallCloser
- URL de handoff.
- Texto y version de consentimiento legal.
- Reglas de consentimiento explicito (`SI/YES`) antes del pase.

## 5) Activos multimedia (para subir en Dashboard)
## 5.1 Bienvenida del chat
- `Imagen de bienvenida` (recomendada).
- `Audio de bienvenida` (opcional).
- `Video corto de bienvenida` (opcional).

## 5.2 Catalogo de lotes/inmuebles
Por cada unidad, pedir:
- `ID interno`.
- `Titulo comercial`.
- `Tipo`: lote, departamento, casa, terreno.
- `Zona/distrito`.
- `Precio`.
- `Area m2`.
- `Dormitorios` (si aplica).
- `Banos` (si aplica).
- `Estado`: disponible, separado, vendido.
- `Fotos` (hasta 5 por unidad).
- `Videos` (hasta 2 por unidad).

### Limites tecnicos recomendados
- Imagen de propiedad: `<= 5MB`.
- Video de propiedad: `<= 15MB`.
- Video de bienvenida: `<= 25MB` (ideal 8-15MB).
- Maximo catalogo: `100 propiedades`.

## 6) Guion conversacional (input para Prompt IA)
Pedir al cliente:
- `Como saluda su marca` (tono).
- `Objeciones frecuentes` (precio, ubicacion, confianza, financiamiento).
- `Respuestas sugeridas por objecion`.
- `CTA principal`.
- `Casos de exito breves`.
- `No negociables` (ejemplo: no negociar debajo de X).
- `Preguntas obligatorias de precalificacion` en orden.

## 7) Tracking y analitica (opcional, recomendado)
- `Facebook Pixel ID`.
- `TikTok Pixel ID`.
- `Google Tag ID`.
- KPI objetivo inicial:
  - conversaciones iniciadas
  - leads calificados
  - clics a WhatsApp
  - ratio de conversion a cita/visita

## 8) Seguridad y cumplimiento
- Confirmar que no se compartiran credenciales sensibles por chat.
- Definir mensaje de privacidad basico.
- Si hay handoff con llamada, validar texto legal de consentimiento.
- Alinear uso de datos de DNI segun politica comercial/legal del cliente.

## 9) Formulario rapido para enviar al cliente (copiar/pegar)
```txt
ONBOARDING LEAD WIDGET - INMOBILIARIA

1. DATOS DE NEGOCIO
- Nombre comercial:
- Ciudad/pais:
- WhatsApp comercial (con codigo pais):
- Horario de atencion:
- Tipo de oferta principal (lotes/depas/casas/mixto):

2. PERFIL DE LEAD IDEAL
- Compra o alquiler:
- Zonas objetivo:
- Presupuesto minimo y maximo:
- Cuota inicial minima (si aplica):
- Plazo ideal de cierre:

3. REGLAS DE PRECALIFICACION
- Preguntas obligatorias (en orden):
- Criterios para considerar lead calificado:
- Criterios de descarte:

4. CIERRE
- Canal de cierre: WhatsApp o ICallCloser
- Condiciones exactas para pasar a cierre:

5. CONTENIDO DE BIENVENIDA
- Mensaje inicial (ES):
- Mensaje inicial (EN, opcional):
- Imagen bienvenida (link o archivo):
- Audio bienvenida (link o archivo):
- Video bienvenida (link o archivo):

6. CATALOGO (adjuntar CSV o lista)
Por propiedad/lote:
- ID
- Titulo
- Tipo
- Zona
- Precio
- Area m2
- Dormitorios/Banos (si aplica)
- Link fotos (hasta 5)
- Link videos (hasta 2)

7. MENSAJES COMERCIALES
- Diferencial principal:
- Objeciones frecuentes:
- Respuesta recomendada por objecion:
- CTA final:

8. TRACKING (opcional)
- Facebook Pixel ID:
- TikTok Pixel ID:
- Google Tag ID:
```

## 10) Entregable interno recomendado (tu equipo)
Antes de lanzar, completar:
- Widget configurado con `template=inmobiliaria`.
- Prompt de contexto cargado con datos reales del cliente.
- Prompt del sistema con reglas de calificacion y cierre.
- Comando de validacion de identidad habilitado (`VALIDAR_DNI`).
- 1 prueba end-to-end:
  - saludo
  - DNI
  - calificacion completa
  - comando de cierre
  - apertura de WhatsApp con payload correcto.
