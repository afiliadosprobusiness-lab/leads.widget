# Guia rapida CRM v2 (leads.widget)

## 1) Flujo minimo diario
1. Entra a `Dashboard > CRM > Contactos`.
2. Crea o importa contactos (manual, CSV o `Sincronizar leads`).
3. En cada contacto, pulsa `Abrir detalle`.
4. En `Deals`, crea una oportunidad (`Crear deal`).
5. En `Tasks`, crea una tarea de seguimiento.
6. En `Timeline`, revisa cambios y notas.
7. En `Pipeline deals`, mueve oportunidades entre etapas.
8. En `Mis tareas`, filtra por `Hoy`, `Vencidas`, `Proximas`, `Completadas`.

## 2) Vistas del CRM
- `Contactos`: alta/importacion, cambio de etapa del contacto, acceso a detalle.
- `Pipeline deals`: kanban de oportunidades por etapa (`new`, `contacted`, `qualified`, `won`, `lost`).
- `Mis tareas`: seguimiento operativo por vencimiento y estado.

## 3) Que pasa al pulsar "Abrir detalle"
- Se abre el panel `Detalle de contacto` en la misma pantalla.
- El dashboard hace scroll/focus automatico a ese panel para que sea visible.
- Dentro del detalle tienes 3 tabs: `Deals`, `Timeline`, `Tasks`.

## 4) Como crear tareas correctamente
- Ve al tab `Tasks` del detalle de contacto (o usa `Task` desde un deal).
- Campo obligatorio: `Titulo de tarea`.
- Opcional: `Fecha/hora` y `Prioridad`.
- Al crearla, veras confirmacion y el evento queda en `Timeline`.

## 5) Reglas clave del sistema
- Dedupe/merge: primero por `phone`, fallback por `email`.
- Un contacto puede tener varios deals.
- Tareas vencidas pasan a `overdue` automaticamente.
- Cambios de etapa, tareas y notas quedan registrados en `Timeline`.

## 6) Si algo "no hace nada"
- `Abrir detalle`: revisa que aparezca el panel `Detalle de contacto` (auto scroll activo).
- `Crear tarea`: valida que el titulo no este vacio.
- Si hay error de permisos/autenticacion, recarga sesion y vuelve a intentar.
