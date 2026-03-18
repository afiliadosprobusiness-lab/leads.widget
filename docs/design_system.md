# Lead Widget - Design System Observado

Documento derivado del UI real del repositorio, con foco en las pantallas del dashboard cliente.

## Base visual

- Stack visual: TailwindCSS + shadcn/ui.
- Densidad: SaaS compacta, con cards, pills, tablas/listas y formularios de una columna o grid responsivo.
- Superficies: tarjetas con `rounded-xl` o `rounded-2xl`, bordes suaves y fondos transluidos ligeros.

## Layout

- Mobile-first.
- El dashboard usa `Tabs` top-level y bloques apilados con `space-y-*`.
- Formularios complejos usan grids responsivos `md:grid-cols-2`, `xl:grid-cols-4`, etc.
- En mobile se usa navegacion compacta sticky con botones tipo segmented control.

## Tipografia

- Titulos: `CardTitle` o `text-2xl font-black` para KPIs.
- Descripciones y helper text: `text-sm` o `text-xs text-muted-foreground`.
- Microcopys operativos: `text-[11px]` y pills con uppercase/tracking suave.

## Componentes base

- `Card`, `CardHeader`, `CardContent`, `CardDescription`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Button`, `Input`, `Label`, `Select`, `Switch`, `Dialog`
- Estados y feedback con `useToast`

## Botones

- CTA primario: `Button` default.
- Acciones secundarias: `variant="outline"`.
- Filtros visuales: botones `rounded-full`.
- Estados disabled visibles con opacidad reducida; no se ocultan acciones bloqueadas.

## Badges y estados

- El proyecto usa pills redondeadas con borde para estados.
- Colores recurrentes:
  - azul para informativo/progreso
  - ambar para advertencia o pendiente
  - verde para aprobado/exito
  - rojo/rose para descartado o perdido
  - slate para neutro

## Cards y paneles

- Headers importantes usan borde inferior y gradiente suave `from-primary/10 via-primary/5`.
- KPIs se muestran en tarjetas cortas con color semantico por estado.
- Estados vacios usan borde dashed, icono central y copy corto.

## Formularios

- Labels visibles encima del campo.
- Inputs y selects con helpers debajo cuando hace falta.
- Formularios largos del dashboard usan barras sticky de guardado; se evita perder la accion principal por scroll.

## Listas y tablas

- El CRM mezcla tabla clasica para leads legacy y lista de cards para contactos/deals/tareas.
- Las nuevas listas deben privilegiar:
  - informacion clave arriba
  - metadata secundaria en `text-xs/text-sm`
  - acciones agrupadas en columna lateral en desktop
  - comportamiento apilado en mobile

## Responsive y accesibilidad

- Evitar overflow horizontal; usar `min-w-0`, `truncate`, `break-words`.
- Mantener labels visibles y focus de componentes shadcn.
- Acciones principales deben seguir accesibles en mobile sin depender de hover.

## Extension nueva observada

- La pestaña `Adquisicion` se integra siguiendo exactamente el patron del dashboard:
  - header con gradiente suave
  - filtros en card
  - KPIs semanticos
  - lista de prospects en cards
  - estados `loading`, `empty` y `no matches`
- El origen `Adquisicion` dentro del CRM se representa con la misma gramatica de pill/badge ya usada por etapas y estados.
