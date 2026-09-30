# 2. Los tests de integración son la única fuente de verdad ejecutable del comportamiento

## Contexto

El [ADR 0001](0001-openspec-como-fuente-de-verdad.md) hizo de las specs de OpenSpec (`openspec/specs/<capability>/spec.md`) la fuente de verdad viva del comportamiento, con los deltas de cada change como única vía para modificarlas. Este ADR parte del supuesto de que, un año después, hemos dejado de mantener esas specs, y registra con qué las sustituimos.

El propio 0001 dejaba escrito su punto débil: «la spec no se protege sola». Era una verdad declarada que nada comprobaba, y cuando se escribió ya se había separado del código dos veces:

- El filtro por estado se implementó sin tocar la spec, y hizo falta un change retroactivo (`add-task-status-filter`) para ponerla al día.
- La spec exigía `422` para `GET /api/v1/tasks?status=archivado`, mientras que el validador declaraba `vine.string().optional()` y el sistema respondía `200` con una lista vacía. Nadie lo detectó hasta que se contrastó a mano con el documento OpenAPI.

Los demás costes que el 0001 anticipaba van en la misma dirección:

- cada criterio de aceptación se escribe dos veces, como criterio y como scenario, con la trazabilidad a mano;
- los `MODIFIED` que se pisan cuando dos changes tocan el mismo requisito;
- los changes retroactivos que no entregan nada;
- la dependencia del CLI de OpenSpec y de sus skills.

Todo eso es mantenimiento, y lo que se deja de mantener deja de ser verdad sin avisar a nadie.

Los tests funcionales del backend no tienen ese problema: si describen algo que el sistema no hace, fallan. Cuando se escribió el 0001, la base de la que partiríamos era esta:

- 23 tests en `backend/tests/functional/`: 20 en `auth` y 3 en `tasks`, todos en `tasks/assignee.spec.ts`. Frente a ellos, 169 scenarios en las specs.
- Aislamiento con `testUtils.db().withGlobalTransaction()` en cada grupo. Hace falta porque la base de pruebas y la de desarrollo son el mismo fichero SQLite.
- El cliente de Japa tipado contra el registro generado de rutas (`.adonisjs/client/registry/`), así que un test que llama a una ruta o envía un campo que no existe no compila.
- Sin integración continua en el repositorio y sin runner de tests en el frontend.

## Decisión

Los tests de integración del backend (`backend/tests/functional/**/*.spec.ts`, suite `functional` de Japa) son la única fuente de verdad ejecutable del comportamiento de FlowSync. Lo que los tests afirman es el contrato. Lo que ningún test afirma no está garantizado, aunque hoy funcione.

En concreto:

1. **Un cambio de comportamiento observable llega con el cambio de sus tests, en el mismo PR.** Un test en rojo es un contrato roto, no un test que actualizar para que pase. Quien revisa lee el diff de los tests como el diff del contrato.
2. **Cada test nombra una regla, no un mecanismo.** El título, en castellano, es la frase que antes era un scenario («un estado inventado se rechaza con 422 sobre `status`»). Los grupos se organizan por capability (`Tasks | filtro`, `Auth | sesión`), y el porqué que antes vivía en el requisito va en el comentario de cabecera del grupo, como ya hacen `assignee.spec.ts` y `signup.spec.ts`.
3. **Los scenarios vigentes se migran de uno en uno, y las divergencias se deciden, no se copian.** Cuando un scenario ya no coincide con lo que hace el código, como el de `?status=archivado`, se decide en ese momento cuál de los dos es el correcto y el test afirma esa decisión. Queda prohibido escribir el test contra el comportamiento actual solo para que pase en verde.
4. **`openspec/` se congela como archivo histórico.** No se abren changes nuevos ni se actualizan las specs principales, pero no se borra: los proposals y designs archivados siguen siendo el único registro de por qué se tomaron las decisiones de producto de 2026. Se lee como «lo que se creía entonces», nunca como descripción del sistema actual.
5. **Las decisiones que no caben en un test van a un ADR.** Esto incluye los trade-offs, las alternativas descartadas y las desviaciones conscientes frente a una historia del backlog.
6. **El documento OpenAPI sigue derivando del código.** No es una segunda verdad: describe la forma de la API, y los tests deciden si esa forma es la correcta.
7. **Los tests solo son verdad si se ejecutan.** Se añade una integración continua que corra la suite `functional` en cada PR, y un PR con la suite en rojo no se fusiona.

## Estado

Aceptado — 2027-09-30. Reemplaza al [ADR 0001](0001-openspec-como-fuente-de-verdad.md).

## Consecuencias

**Lo que ganamos**

- La verdad deja de poder separarse del código en silencio: una regla que el sistema no cumple aparece como un test en rojo, no como un contraste manual meses después.
- Desaparece una capa entera de mantenimiento. Ya no hay criterios escritos dos veces, ni deltas que se pisan al archivar, ni changes retroactivos, ni dependencia del CLI de OpenSpec.
- El contrato se escribe en el mismo lenguaje y el mismo PR que el código, y el compilador ya rechaza rutas y campos que no existen.

**Lo que nos cuesta**

- **Todo lo que no se migre deja de estar garantizado.** Se parte de 23 tests frente a 169 scenarios. Hasta cerrar esa distancia, la fuente de verdad cubre menos que la que sustituye, y los requisitos no migrados quedan como texto congelado sin nadie que responda de ellos.
- **La interfaz se queda sin verdad ejecutable.** Buena parte de los scenarios de `tasks` describen pantallas: la lista, el filtro en la URL, los cuatro finales de una lista sin filas, la señal de tarea vencida. Los tests de integración del backend no los alcanzan y el frontend no tiene runner. O se monta uno de extremo a extremo, o ese comportamiento pasa a no estar escrito en ningún sitio vigente.
- **Los requisitos negativos son difíciles de afirmar.** «No existe ninguna operación para crear un estado», «no hay vista de mis tareas» o «no se muestra quién está conectado» eran frases de una línea en la spec. Como test, o se reducen a una comprobación parcial o se pierden.
- **Un test codifica lo que el sistema hace, no necesariamente lo que debe hacer.** Sin una spec contra la que contrastarlo, un test escrito sobre un comportamiento defectuoso lo consagra. La regla 3 lo mitiga en la migración; después depende solo de quien revise.
- **El porqué queda disperso.** Pasa a estar repartido entre comentarios de cabecera, ADRs y descripciones de PR, y se pierde el documento único y legible por producto que era la spec. Quien no lee TypeScript deja de tener dónde consultar qué hace el sistema.
- **Un test se cambia tan fácilmente como el código que prueba.** La spec obligaba a pasar por un change con proposal. Ahora la única barrera entre cambiar el contrato y cambiar un `assert` es la revisión del PR.
- **La suite pasa a ser crítica, y hay que invertir en ella.** Hace falta integración continua, que hoy no existe. También hace falta que el aislamiento por transacción global siga siendo suficiente mientras la base de pruebas sea el mismo fichero que la de desarrollo, y que la suite siga siendo lo bastante rápida como para que nadie se la salte.
- **`openspec/` se queda desactualizado sin avisar.** Un archivo congelado con apariencia de spec viva invita a leerlo como vigente. Hay que dejarlo marcado como histórico, y el README del backlog, que remitía a los criterios de aceptación, también tiene que decir dónde está ahora la verdad.
