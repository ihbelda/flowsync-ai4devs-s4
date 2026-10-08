# 2. Los tests de integración como única fuente de verdad ejecutable

## Contexto

Según el [ADR 0001](0001-openspec-como-fuente-de-verdad.md), la spec viva de `openspec/specs/` era la fuente de verdad de FlowSync y solo cambiaba a través de delta-specs archivadas. Ese ADR ya listaba entre sus costes el que ha acabado pesando más: **la spec decía lo que el sistema debía hacer, pero nada comprobaba que lo hiciera**.

En el propio repositorio hay casos concretos:

- `add-task-status-filter` dio por implementado que un `status` inventado se rechaza con `422`, pero `GET /api/v1/tasks?status=archivado` responde `200` con una lista vacía. La spec lo afirmaba y el código hacía otra cosa, y nada lo detectó.
- `add-task-list` se archivó con la verificación del email sin marcar. La lista devolvió el email del responsable hasta que lo destapó `backend/tests/functional/tasks/assignee.spec.ts`, y lo encontró un test, no la spec.
- Los tres changes de 2026-08-13 se archivaron con «Sin tests» como decisión explícita. La spec creció hasta 169 scenarios entre `auth` y `tasks` sin que archivar exigiera ninguna verificación.

Al mismo tiempo, los tests de integración ya hacían de contrato en la práctica:

- Los ficheros de `backend/tests/functional/` declaran en su cabecera qué requisito cubren y tienen un test por scenario, con el título en lenguaje del dominio («el responsable no trae el email ni datos de acceso de su cuenta»).
- Corren contra la API real, con Japa, el cliente HTTP tipado por el registro de Tuyau y la base de datos aislada en una transacción.
- Cuando el código y lo esperado divergen, fallan, que es justo lo que la spec no podía hacer.

Mantener las dos cosas a la vez significa escribir cada conducta dos veces, en el scenario y en el test, y dejar que se desincronicen. Con el equipo dedicando el esfuerzo a los tests, las delta-specs se han convertido en un paso que se rellena por obligación.

## Decisión

**Los tests de integración son la única fuente de verdad ejecutable de lo que hace FlowSync. OpenSpec deja de mantenerse.**

1. **Lo que pasa los tests es lo que el sistema hace y debe hacer.** Una conducta que no está cubierta por un test no está garantizada, por mucho que la describa un documento.
2. **Todo cambio de comportamiento observable llega con el test que lo fija.** Si cambia una conducta existente, cambia su test en el mismo commit. Cuenta como observable toda ruta, código de respuesta, forma de un objeto, regla de validación o conducta de una pantalla.
3. **Los tests se escriben para que se lean como especificación:**
   - un `test.group` por requisito, con el nombre del requisito;
   - un `test` por scenario, con el título en castellano y en términos del dominio, no de la implementación;
   - una cabecera que explique el porqué cuando no sea evidente.
4. **`openspec/` se congela, no se borra.** Las specs y los changes archivados quedan como registro histórico de solo lectura: explican el porqué de la primera versión de cada conducta. Si contradicen un test, manda el test.
5. **El documento OpenAPI de `/api.json`** se sigue generando de las anotaciones de los controladores. Describe el contrato para quien consume la API, pero no es fuente de verdad: si contradice un test, se corrige el documento.
6. **Antes de congelar `openspec/`, cada scenario de la spec viva se pasa a test o se descarta de forma explícita**, anotando el motivo. Ninguno se pierde por omisión.

## Estado

Aceptada, el 2027-10-08.

Reemplaza al [ADR 0001](0001-openspec-como-fuente-de-verdad.md).

## Consecuencias

**Lo que ganamos**

- **La verdad se comprueba en cada ejecución.** Una divergencia entre lo esperado y lo que hace el código es un test en rojo, no un error silencioso que alguien encuentra meses después.
- **Cada conducta se escribe una sola vez.** Desaparece la doble escritura scenario + test y, con ella, la desincronización entre ambos.
- **Los cambios se revisan por su efecto.** El diff de un test cambiado muestra exactamente qué conducta deja de valer y cuál pasa a valer.
- **Menos ceremonia para cambios pequeños.** Un ajuste de comportamiento es un test y su código, sin proposal, design, tasks ni delta.

**Lo que nos cuesta**

- **Un test fija lo que hay, no lo que debería haber.** Con la spec, un fallo era una divergencia visible respecto a lo pretendido. Con los tests, un fallo cubierto por un test mal planteado se convierte en la verdad. Si alguien hubiera escrito un test que esperase `200` con lista vacía para `status=archivado`, ese defecto sería hoy comportamiento oficial. La intención solo queda protegida si quien escribe el test la conoce.
- **Se pierde el porqué.** Un test dice qué pasa, no por qué se decidió así ni qué se dejó fuera a propósito. Lo que contaban los `proposal.md` y `design.md` (los motivos de cada límite, las decisiones de producto abiertas como PA-3, PA-7 o PA-8, lo que quedaba «fuera de alcance, y a propósito») no tiene sustituto. Queda congelado en `openspec/`, pero no se actualiza.
- **La interfaz se queda sin fuente de verdad.** El frontend no tiene runner de tests. Gran parte de los scenarios de la spec viva son de pantalla: la lista y su control de filtro, la pantalla de una tarea, los avisos junto al campo, los mensajes de lista vacía, la operación con teclado. Mientras no se monte un runner en `frontend/` con tests que los cubran, esas conductas no tienen ninguna fuente de verdad vigente, y la decisión 6 obliga a descartarlas en vez de trasladarlas.
- **Lo que «no debe existir» se prueba mal.** Requisitos como «no existe ninguna operación para crear un estado», «no hay vista de mis tareas» o «sin señales de presencia» son afirmaciones de ausencia. Se pueden aproximar, por ejemplo recorriendo las rutas registradas, pero un test no demuestra que algo no exista en ninguna parte.
- **Producto pierde un documento legible.** Una spec en castellano con `SHALL` / `WHEN` / `THEN` la podía leer y discutir alguien que no programa. Los tests están en TypeScript, atados a Japa y AdonisJS, y aunque sus títulos sean legibles, sus aserciones no lo son para todo el mundo.
- **La verdad depende de que los tests sean fiables.** La suite functional comparte el fichero SQLite del servidor de desarrollo (`config/database.ts` no tiene override por entorno) y se aísla con transacciones globales. Un test que pasa por accidente o que depende del estado de esa base es una verdad falsa, y ya no hay un documento independiente contra el que contrastarlo.
- **Congelar no es gratis.** Pasar los 169 scenarios a tests o descartarlos con su motivo es trabajo que hay que hacer antes de dejar de mantener `openspec/`. Si se salta, la spec congelada seguirá pareciendo vigente para quien llegue nuevo, y contradirá a los tests sin que nada lo marque.
