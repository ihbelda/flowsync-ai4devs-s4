# Capability `tasks`

La lista de trabajo del equipo. Hay **una sola lista compartida** con las tareas del espacio, y en cada fila se ve de un vistazo quién lleva cada tarea y en qué estado está. Crear una tarea cuesta escribir su título: nace pendiente y a nombre de quien la crea. Desde la lista se cambia el estado en un gesto y se acota por estado. Al abrir una tarea se ve y se edita su fecha de vencimiento, y si está vencida se anuncia.

> **Las reglas no están en este README.** Están en la spec, [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md), con sus scenarios. Aquí solo se enlazan. Si este fichero y la spec dicen cosas distintas, manda la spec, y este fichero tiene un error.

## Endpoints

Todos cuelgan de `/api/v1/tasks`, exigen `Authorization: Bearer <token>` (grupo con `middleware.auth()` en [`start/routes.ts`](../../../backend/start/routes.ts)) y devuelven el cuerpo envuelto en `{ "data": ... }`.

| Método | Ruta | Controlador | Entrada | Devuelve |
|---|---|---|---|---|
| `GET` | `/api/v1/tasks` | [`TasksController.index`](../../../backend/app/controllers/tasks_controller.ts) | query `status` opcional | lista de tareas (`TaskTransformer`) |
| `POST` | `/api/v1/tasks` | [`TasksController.store`](../../../backend/app/controllers/tasks_controller.ts) | cuerpo `{ title }` | la tarea creada (`TaskTransformer`), `201` |
| `GET` | `/api/v1/tasks/:id` | [`TasksController.show`](../../../backend/app/controllers/tasks_controller.ts) | query `today` | la tarea con vencimiento (`TaskDetailTransformer`) |
| `PATCH` | `/api/v1/tasks/:id/status` | [`TaskStatusesController.update`](../../../backend/app/controllers/task_statuses_controller.ts) | cuerpo `{ status }` | la tarea actualizada (`TaskTransformer`) |
| `PUT` | `/api/v1/tasks/:id/due-date` | [`TaskDueDatesController.update`](../../../backend/app/controllers/task_due_dates_controller.ts) | cuerpo `{ dueDate, today }` | la tarea con vencimiento (`TaskDetailTransformer`) |

Hay dos formas de tarea:

- **`TaskTransformer`**, la de la lista, la creación y el cambio de estado. No lleva ni fecha de vencimiento ni condición de vencida.
- **`TaskDetailTransformer`**, la de la tarea suelta y el cambio de fecha. Añade `dueDate` e `isOverdue`.

`today` es el día de quien mira, y el servidor nunca pone el suyo. Los validadores lo leen de `request.all()`, así que llega por query o por cuerpo indistintamente.

Los campos, los códigos de respuesta y los errores de cada operación están en el documento OpenAPI que sirve el backend: la interfaz en `http://localhost:3333/api` y el JSON en `http://localhost:3333/api.json`. Ese documento sale de los decoradores de los controladores y de [`app/openapi/schemas.ts`](../../../backend/app/openapi/schemas.ts), así que describe lo que hace el código. Contra la spec se contrasta, no se toma como la regla.

## Reglas de negocio

Índice de los requisitos de la [spec](../../../openspec/specs/tasks/spec.md), agrupados por tema. Cada enlace lleva al requisito y a sus scenarios.

**Crear una tarea**
- [Creación de una tarea con solo el título](../../../openspec/specs/tasks/spec.md#requirement-creación-de-una-tarea-con-solo-el-título)
- [Ninguna tarea sin título](../../../openspec/specs/tasks/spec.md#requirement-ninguna-tarea-sin-título)
- [Aviso ante un título demasiado largo](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-un-título-demasiado-largo)

**La lista y el filtro por estado**
- [Una sola lista compartida del espacio](../../../openspec/specs/tasks/spec.md#requirement-una-sola-lista-compartida-del-espacio)
- [Acotar la lista por estado](../../../openspec/specs/tasks/spec.md#requirement-acotar-la-lista-por-estado)
- [Un filtro válido sin resultados es una lista vacía legítima](../../../openspec/specs/tasks/spec.md#requirement-un-filtro-válido-sin-resultados-es-una-lista-vacía-legítima)
- [Un estado que no existe se rechaza, no se responde vacío](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío)
- [La lista no lleva el vencimiento](../../../openspec/specs/tasks/spec.md#requirement-la-lista-no-lleva-el-vencimiento)

**Responsable, estados y sesión**
- [Lo que cada tarea muestra de su responsable](../../../openspec/specs/tasks/spec.md#requirement-lo-que-cada-tarea-muestra-de-su-responsable)
- [Tres estados fijos](../../../openspec/specs/tasks/spec.md#requirement-tres-estados-fijos)
- [Cambio de estado de cualquier tarea](../../../openspec/specs/tasks/spec.md#requirement-cambio-de-estado-de-cualquier-tarea)
- [Las tareas exigen sesión](../../../openspec/specs/tasks/spec.md#requirement-las-tareas-exigen-sesión)

**Una tarea suelta y su vencimiento**
- [Consulta de una tarea suelta](../../../openspec/specs/tasks/spec.md#requirement-consulta-de-una-tarea-suelta)
- [Fecha de vencimiento opcional](../../../openspec/specs/tasks/spec.md#requirement-fecha-de-vencimiento-opcional)
- [Fijar, cambiar y retirar la fecha de vencimiento](../../../openspec/specs/tasks/spec.md#requirement-fijar-cambiar-y-retirar-la-fecha-de-vencimiento)
- [Cuándo una tarea está vencida](../../../openspec/specs/tasks/spec.md#requirement-cuándo-una-tarea-está-vencida)
- [El día de referencia lo pone quien mira](../../../openspec/specs/tasks/spec.md#requirement-el-día-de-referencia-lo-pone-quien-mira)

**Interfaz: la lista**
- [Pantalla de la lista del equipo](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-la-lista-del-equipo)
- [El espacio sin tareas](../../../openspec/specs/tasks/spec.md#requirement-el-espacio-sin-tareas)
- [Crear una tarea desde la lista](../../../openspec/specs/tasks/spec.md#requirement-crear-una-tarea-desde-la-lista)
- [Aviso al intentar crear sin un título válido](../../../openspec/specs/tasks/spec.md#requirement-aviso-al-intentar-crear-sin-un-título-válido)
- [Cambiar el estado desde la propia fila](../../../openspec/specs/tasks/spec.md#requirement-cambiar-el-estado-desde-la-propia-fila)
- [Una sola vista de tareas, sin señales de presencia](../../../openspec/specs/tasks/spec.md#requirement-una-sola-vista-de-tareas-sin-señales-de-presencia)
- [El control para acotar la lista](../../../openspec/specs/tasks/spec.md#requirement-el-control-para-acotar-la-lista)
- [El filtro se pide en la dirección de la lista](../../../openspec/specs/tasks/spec.md#requirement-el-filtro-se-pide-en-la-dirección-de-la-lista)
- [Una lista sin filas no significa siempre lo mismo](../../../openspec/specs/tasks/spec.md#requirement-una-lista-sin-filas-no-significa-siempre-lo-mismo)
- [Lo que sale de la vista no se pierde](../../../openspec/specs/tasks/spec.md#requirement-lo-que-sale-de-la-vista-no-se-pierde)

**Interfaz: la pantalla de una tarea**
- [Pantalla de una tarea](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-una-tarea)
- [Poner y quitar la fecha desde la pantalla de la tarea](../../../openspec/specs/tasks/spec.md#requirement-poner-y-quitar-la-fecha-desde-la-pantalla-de-la-tarea)
- [Aviso ante una fecha que no vale](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-una-fecha-que-no-vale)
- [La señal de tarea vencida](../../../openspec/specs/tasks/spec.md#requirement-la-señal-de-tarea-vencida)
- [No tener fecha no se penaliza](../../../openspec/specs/tasks/spec.md#requirement-no-tener-fecha-no-se-penaliza)

El porqué de cada decisión (alternativas descartadas, riesgos y desviaciones frente a las historias del backlog) está en los changes archivados que introdujeron estos requisitos, en [`openspec/changes/archive/`](../../../openspec/changes/archive/).

## Dónde está en el código

**Backend** (`backend/`)
- Modelo: [`app/models/task.ts`](../../../backend/app/models/task.ts). Contiene `TASK_STATUSES`, `DEFAULT_LIST_STATUSES` y `isOverdueOn()`, que es la única definición de «vencida» del sistema.
- Validadores: [`app/validators/task.ts`](../../../backend/app/validators/task.ts)
- Transformers: [`task_transformer.ts`](../../../backend/app/transformers/task_transformer.ts), [`task_detail_transformer.ts`](../../../backend/app/transformers/task_detail_transformer.ts) y [`task_assignee_transformer.ts`](../../../backend/app/transformers/task_assignee_transformer.ts)
- Migraciones: [`create_tasks_table`](../../../backend/database/migrations/1786642030284_create_tasks_table.ts) y [`add_due_date_to_tasks_table`](../../../backend/database/migrations/1786644500000_add_due_date_to_tasks_table.ts)

**Frontend** (`frontend/src/`)
- Rutas `/tasks` y `/tasks/:id`, protegidas con sesión: [`routes/app-routes.tsx`](../../../frontend/src/routes/app-routes.tsx)
- Pantallas: [`pages/tasks-page.tsx`](../../../frontend/src/pages/tasks-page.tsx) y [`pages/task-page.tsx`](../../../frontend/src/pages/task-page.tsx)
- Componentes: [`components/task-item.tsx`](../../../frontend/src/components/task-item.tsx) y [`components/task-filter.tsx`](../../../frontend/src/components/task-filter.tsx)
- Llamadas a la API: `listTasks`, `createTask`, `getTask`, `setTaskDueDate` y `updateTaskStatus` en [`lib/api.ts`](../../../frontend/src/lib/api.ts)

## Cómo se prueba en local

### Tests automáticos

```bash
cd backend
node ace test functional --files="tasks/*"
```

Hoy la capability solo tiene [`tests/functional/tasks/assignee.spec.ts`](../../../backend/tests/functional/tasks/assignee.spec.ts), que cubre lo que la tarea expone de su responsable. El resto de la spec no tiene tests. Cada grupo se aísla con `testUtils.db().withGlobalTransaction()`, que hace falta porque la base de pruebas es el mismo fichero que la de desarrollo (`backend/tmp/db.sqlite3`). Un test nuevo que escriba tiene que hacer lo mismo. El frontend no tiene runner de tests.

### A mano contra la API

Con el backend en marcha (`npm run dev` en `backend/`, tras `node ace migration:run` la primera vez):

```bash
API=http://localhost:3333/api/v1
JSON='content-type: application/json'

# Una cuenta y su token. fullName es obligatorio como clave, aunque sea null.
curl -s -X POST $API/auth/signup -H "$JSON" \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"secreto123","passwordConfirmation":"secreto123"}'
TOKEN=$(curl -s -X POST $API/auth/login -H "$JSON" \
  -d '{"email":"ada@example.com","password":"secreto123"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')
AUTH="authorization: Bearer $TOKEN"

ID=$(curl -s -X POST $API/tasks -H "$AUTH" -H "$JSON" -d '{"title":"Revisar el informe"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])')             # 201

curl -s "$API/tasks" -H "$AUTH"                                                          # pendientes y en curso
curl -s "$API/tasks?status=done" -H "$AUTH"                                              # solo las hechas
curl -s -X PATCH $API/tasks/$ID/status -H "$AUTH" -H "$JSON" -d '{"status":"in_progress"}'
curl -s "$API/tasks/$ID?today=2026-09-30" -H "$AUTH"                                     # con dueDate e isOverdue
curl -s -X PUT $API/tasks/$ID/due-date -H "$AUTH" -H "$JSON" -d '{"dueDate":"2026-09-01","today":"2026-09-30"}'
```

Estas llamadas escriben en `backend/tmp/db.sqlite3`, la base de desarrollo. Para empezar de cero: `node ace migration:fresh`.

La interfaz de Scalar en `http://localhost:3333/api` permite lanzar las mismas peticiones desde el navegador.

### A mano en la interfaz

Con el backend en marcha, `npm run dev` en `frontend/` y `http://localhost:5173`. Tras entrar se llega a `/tasks`, y cada fila abre `/tasks/:id`.
