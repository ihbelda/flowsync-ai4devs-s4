# 1. Las specs de OpenSpec son la fuente de verdad viva del comportamiento

## Contexto

El comportamiento de FlowSync está escrito hoy en varios sitios a la vez, y no dicen lo mismo:

- **PRD y alcance** (`docs/prd/`) y **historias con criterios de aceptación** (`docs/backlog/`, con códigos `FS-*`, `CA-*` y preguntas abiertas `PA-*`). El README del backlog dice que los criterios «dirigen la implementación» y que, frente a Jira, «manda el repositorio», pero no dice qué manda cuando es el propio repositorio el que se contradice.
- **`openspec/`**, con el esquema `spec-driven` y un `config.yaml` sin reglas propias:
  - `specs/auth/spec.md` — 19 requisitos, 45 scenarios.
  - `specs/tasks/spec.md` — 32 requisitos, 124 scenarios.
  - `changes/archive/` — tres changes archivados, los tres fechados el 2026-08-13: `add-task-list`, `add-task-due-date` y `add-task-status-filter`. Cada uno trae `proposal.md`, `design.md`, `tasks.md` y un delta por capability tocada, con bloques `## ADDED Requirements` y `## MODIFIED Requirements`.
- **El código**, y desde hace poco el documento OpenAPI que se genera de él (`/api.json`).

La relación entre las specs y los changes es aditiva y se puede comprobar: los 32 requisitos de `tasks` son exactamente los 14 + 11 + 7 que añaden los tres deltas. Los `MODIFIED` sustituyen el bloque entero del requisito en vez de añadir líneas, y por eso el delta de `add-task-status-filter` vuelve a copiar dentro de *Una sola vista de tareas, sin señales de presencia* el scenario que había añadido `add-task-due-date`. En `auth` no pasa lo mismo: su delta solo aporta 4 requisitos y los otros 15 ya estaban antes de que existiera ningún change archivado.

Ya ha habido deriva entre la spec y el código, y la hemos pagado:

- El filtro por estado (FS-142) se implementó sin tocar `openspec/`, y `specs/tasks/spec.md` siguió diciendo que la lista devolvía «todas las tareas del espacio». Lo detectó el proposal de `add-task-due-date` y lo dejó anotado como riesgo, y hizo falta un change entero, `add-task-status-filter`, que dice de sí mismo que «documenta comportamiento que ya está implementado» y «no toca código».
- Ese mismo change afirma que `listTasksValidator` tiene «`status` opcional y acotado al enum», y la spec exige un `422` para `?status=archivado`. El validador declara `vine.string().optional()`, y hoy esa petición responde `200` con una lista vacía. Nadie lo había visto porque nada lo comprueba: los tres changes dicen explícitamente «sin tests», y la capability `tasks` solo tiene un fichero de tests (`tests/functional/tasks/assignee.spec.ts`).

Necesitamos un único sitio que responda «qué hace el sistema hoy y qué se ha comprometido a hacer», que se pueda leer sin reconstruir historia y contra el que se pueda juzgar si el código está bien o mal.

## Decisión

Las specs principales de OpenSpec, `openspec/specs/<capability>/spec.md`, son la fuente de verdad viva del comportamiento de FlowSync. Las delta-specs de cada change son la única vía para modificarlas.

En concreto:

1. **Todo cambio de comportamiento observable entra como change.** Vive en `openspec/changes/<nombre>/` con su proposal, design, tasks y un delta por capability afectada. Un requisito `MODIFIED` se reescribe entero, incluidos los scenarios que otros changes ya le hubieran añadido.
2. **Archivar es lo que cierra el trabajo.** Al archivar, el delta se integra en la spec principal y el change pasa a `changes/archive/AAAA-MM-DD-<nombre>/`. Un comportamiento que está en el código y no está en la spec principal no se considera terminado.
3. **Si el código y la spec no coinciden, eso es un defecto, y no hay un bando que gane por defecto.** Se arregla con un change: o bien un delta que cambia la spec, cuando lo que hace el código es lo que se quiere (el precedente es `add-task-status-filter`), o bien un arreglo del código contra la spec vigente, como pide hoy el caso de `?status=archivado`. Ninguno de los dos se ajusta en silencio al otro.
4. **Las historias del backlog son la entrada, no el contrato.** Explican el porqué y alimentan el proposal. Cuando lo construido se aparta de un criterio de aceptación, la desviación se escribe en el `design.md` del change, como `add-task-status-filter` hace con CA-17 frente a CA-9, y la spec recoge lo que el sistema hace de verdad.
5. **El documento OpenAPI deriva del código y queda por debajo de la spec.** Describe lo que el código hace, no lo que debería hacer. Cuando difiere de la spec, esa diferencia es una pista del defecto del punto 3, no una segunda verdad.

## Estado

~~Aceptado — 2026-09-30.~~

Reemplazado por el [ADR 0002](0002-tests-como-fuente-de-verdad-ejecutable.md) — 2027-09-30.

## Consecuencias

**Lo que ganamos**

- Una sola respuesta a «¿qué hace el sistema?»: la spec principal de cada capability, sin tener que recorrer PRD, historias y changes.
- Cada requisito tiene a mano su porqué. El proposal y el design del change archivado que lo introdujo guardan el contexto, las alternativas y las desviaciones conscientes que la spec, por diseño, no cuenta.
- Los scenarios en formato WHEN/THEN son directamente convertibles en tests funcionales y en contrato de API. Es el mismo texto contra el que se acaba de medir el documento OpenAPI.
- La deriva deja de ser una opinión: si la spec dice `422` y el sistema responde `200`, hay un defecto con nombre y un sitio donde resolverlo.

**Lo que nos cuesta**

- **La spec no se protege sola.** Hoy es una verdad declarada, no comprobada: sin tests, una spec «fuente de verdad» puede estar mal sin que nada avise, y ya ha pasado dos veces. Esta decisión solo vale lo que valga la disciplina de cerrarla con tests, y de momento esa deuda es de casi toda la capability `tasks`.
- **Más texto que mantener, y duplicado.** Cada criterio de aceptación reaparece como scenario, y la trazabilidad `CA-*` → scenario se mantiene a mano. La spec de `tasks` ya ocupa unas 750 líneas y mezcla en una sola capability requisitos de API y de interfaz.
- **Los `MODIFIED` se pisan.** Como sustituyen el requisito entero, dos changes vivos que toquen el mismo requisito tienen que conocerse. El segundo debe arrastrar lo que añadió el primero, o lo borra al archivar, y el orden de archivado importa. Con tres changes archivados el mismo día ya hubo que hacerlo una vez.
- **Documentar hecho a hecho es trabajo sin código.** Cuando alguien implementa sin spec, la regla obliga a abrir un change retroactivo como `add-task-status-filter`. Es trabajo que no entrega nada nuevo y que tiende a hacerse tarde o a no hacerse.
- **El archivo no es la historia completa.** Quince de los requisitos de `auth` no tienen change de origen, y en git `openspec/` solo aparece en el commit inicial. Para esa parte, el porqué no está en ningún sitio.
- **Dependemos de una herramienta concreta.** El flujo descansa en el CLI de OpenSpec y en los comandos y skills de `.claude/` (`opsx:*`, `openspec-*`). Si la herramienta cambia de formato o se abandona, las specs siguen siendo Markdown legible, pero la integración de deltas pasa a ser manual.
- **Tres sitios que hay que conciliar en vez de uno.** El backlog sigue existiendo como entrada, OpenAPI como descripción del código y OpenSpec como contrato. La decisión dice cuál manda, no hace que dejen de divergir.
