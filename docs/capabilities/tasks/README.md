# Capability `tasks`

La lista de trabajo del equipo: una sola lista compartida con las tareas del espacio, donde crear una tarea cuesta escribir un título y donde se ve quién lleva cada una y en qué estado está sin abrir nada. Además, cada tarea puede tener una fecha de vencimiento, que se consulta y se edita en su propia pantalla.

> **Las reglas están en la spec, no aquí.** La referencia es [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md). Este README solo dice dónde vive cada cosa y cómo ponerla en marcha; cuando habla de una regla, enlaza el requisito de la spec que la define.

## Endpoints

Todos van bajo `/api/v1/tasks` y exigen un token Bearer ([Las tareas exigen sesión](../../../openspec/specs/tasks/spec.md#requirement-las-tareas-exigen-sesión)). Las rutas están en `backend/start/routes.ts`.

| Método | Ruta | Controlador | Qué hace | Requisitos |
|---|---|---|---|---|
| `GET` | `/api/v1/tasks` | `TasksController.index` | Devuelve la lista compartida, opcionalmente acotada por `status` | [Una sola lista compartida](../../../openspec/specs/tasks/spec.md#requirement-una-sola-lista-compartida-del-espacio), [Acotar la lista por estado](../../../openspec/specs/tasks/spec.md#requirement-acotar-la-lista-por-estado), [Un filtro válido sin resultados…](../../../openspec/specs/tasks/spec.md#requirement-un-filtro-válido-sin-resultados-es-una-lista-vacía-legítima), [Un estado que no existe se rechaza…](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío), [La lista no lleva el vencimiento](../../../openspec/specs/tasks/spec.md#requirement-la-lista-no-lleva-el-vencimiento) |
| `POST` | `/api/v1/tasks` | `TasksController.store` | Crea una tarea a partir del título | [Creación con solo el título](../../../openspec/specs/tasks/spec.md#requirement-creación-de-una-tarea-con-solo-el-título), [Ninguna tarea sin título](../../../openspec/specs/tasks/spec.md#requirement-ninguna-tarea-sin-título), [Título demasiado largo](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-un-título-demasiado-largo) |
| `GET` | `/api/v1/tasks/:id` | `TasksController.show` | Devuelve una tarea suelta, con su vencimiento resuelto contra `today` | [Consulta de una tarea suelta](../../../openspec/specs/tasks/spec.md#requirement-consulta-de-una-tarea-suelta), [El día de referencia lo pone quien mira](../../../openspec/specs/tasks/spec.md#requirement-el-día-de-referencia-lo-pone-quien-mira) |
| `PATCH` | `/api/v1/tasks/:id/status` | `TaskStatusesController.update` | Cambia el estado | [Cambio de estado de cualquier tarea](../../../openspec/specs/tasks/spec.md#requirement-cambio-de-estado-de-cualquier-tarea), [Tres estados fijos](../../../openspec/specs/tasks/spec.md#requirement-tres-estados-fijos) |
| `PUT` | `/api/v1/tasks/:id/due-date` | `TaskDueDatesController.update` | Fija, cambia o retira la fecha de vencimiento | [Fijar, cambiar y retirar la fecha](../../../openspec/specs/tasks/spec.md#requirement-fijar-cambiar-y-retirar-la-fecha-de-vencimiento), [Cuándo una tarea está vencida](../../../openspec/specs/tasks/spec.md#requirement-cuándo-una-tarea-está-vencida) |

Los parámetros, los cuerpos, los códigos de respuesta y los esquemas de cada operación están en el documento OpenAPI que sirve el backend: `http://localhost:3333/api.json`, con la interfaz en `http://localhost:3333/api`. Ese documento sale de las anotaciones de los controladores y de `backend/app/openapi/schemas.ts`.

## Reglas de negocio

Todas están en la [spec](../../../openspec/specs/tasks/spec.md), agrupadas en requisitos, y cada requisito se concreta en scenarios `WHEN` / `THEN`. Este índice solo sirve para encontrarlas:

- **Crear tareas:**
  - [Creación de una tarea con solo el título](../../../openspec/specs/tasks/spec.md#requirement-creación-de-una-tarea-con-solo-el-título)
  - [Ninguna tarea sin título](../../../openspec/specs/tasks/spec.md#requirement-ninguna-tarea-sin-título)
  - [Aviso ante un título demasiado largo](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-un-título-demasiado-largo)
- **La lista:**
  - [Una sola lista compartida del espacio](../../../openspec/specs/tasks/spec.md#requirement-una-sola-lista-compartida-del-espacio)
  - [Lo que cada tarea muestra de su responsable](../../../openspec/specs/tasks/spec.md#requirement-lo-que-cada-tarea-muestra-de-su-responsable)
  - [Una sola vista de tareas, sin señales de presencia](../../../openspec/specs/tasks/spec.md#requirement-una-sola-vista-de-tareas-sin-señales-de-presencia)
- **Estados:**
  - [Tres estados fijos](../../../openspec/specs/tasks/spec.md#requirement-tres-estados-fijos)
  - [Cambio de estado de cualquier tarea](../../../openspec/specs/tasks/spec.md#requirement-cambio-de-estado-de-cualquier-tarea)
- **Acceso:**
  - [Las tareas exigen sesión](../../../openspec/specs/tasks/spec.md#requirement-las-tareas-exigen-sesión)
- **Filtro por estado:**
  - [Acotar la lista por estado](../../../openspec/specs/tasks/spec.md#requirement-acotar-la-lista-por-estado)
  - [Un filtro válido sin resultados es una lista vacía legítima](../../../openspec/specs/tasks/spec.md#requirement-un-filtro-válido-sin-resultados-es-una-lista-vacía-legítima)
  - [Un estado que no existe se rechaza, no se responde vacío](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío)
- **Vencimiento:**
  - [Fecha de vencimiento opcional](../../../openspec/specs/tasks/spec.md#requirement-fecha-de-vencimiento-opcional)
  - [Fijar, cambiar y retirar la fecha de vencimiento](../../../openspec/specs/tasks/spec.md#requirement-fijar-cambiar-y-retirar-la-fecha-de-vencimiento)
  - [Cuándo una tarea está vencida](../../../openspec/specs/tasks/spec.md#requirement-cuándo-una-tarea-está-vencida)
  - [El día de referencia lo pone quien mira](../../../openspec/specs/tasks/spec.md#requirement-el-día-de-referencia-lo-pone-quien-mira)
  - [Consulta de una tarea suelta](../../../openspec/specs/tasks/spec.md#requirement-consulta-de-una-tarea-suelta)
  - [La lista no lleva el vencimiento](../../../openspec/specs/tasks/spec.md#requirement-la-lista-no-lleva-el-vencimiento)
- **Pantalla de la lista:**
  - [Pantalla de la lista del equipo](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-la-lista-del-equipo)
  - [El espacio sin tareas](../../../openspec/specs/tasks/spec.md#requirement-el-espacio-sin-tareas)
  - [Crear una tarea desde la lista](../../../openspec/specs/tasks/spec.md#requirement-crear-una-tarea-desde-la-lista)
  - [Aviso al intentar crear sin un título válido](../../../openspec/specs/tasks/spec.md#requirement-aviso-al-intentar-crear-sin-un-título-válido)
  - [Cambiar el estado desde la propia fila](../../../openspec/specs/tasks/spec.md#requirement-cambiar-el-estado-desde-la-propia-fila)
  - [El control para acotar la lista](../../../openspec/specs/tasks/spec.md#requirement-el-control-para-acotar-la-lista)
  - [El filtro se pide en la dirección de la lista](../../../openspec/specs/tasks/spec.md#requirement-el-filtro-se-pide-en-la-dirección-de-la-lista)
  - [Una lista sin filas no significa siempre lo mismo](../../../openspec/specs/tasks/spec.md#requirement-una-lista-sin-filas-no-significa-siempre-lo-mismo)
  - [Lo que sale de la vista no se pierde](../../../openspec/specs/tasks/spec.md#requirement-lo-que-sale-de-la-vista-no-se-pierde)
- **Pantalla de una tarea:**
  - [Pantalla de una tarea](../../../openspec/specs/tasks/spec.md#requirement-pantalla-de-una-tarea)
  - [Poner y quitar la fecha desde la pantalla de la tarea](../../../openspec/specs/tasks/spec.md#requirement-poner-y-quitar-la-fecha-desde-la-pantalla-de-la-tarea)
  - [Aviso ante una fecha que no vale](../../../openspec/specs/tasks/spec.md#requirement-aviso-ante-una-fecha-que-no-vale)
  - [La señal de tarea vencida](../../../openspec/specs/tasks/spec.md#requirement-la-señal-de-tarea-vencida)
  - [No tener fecha no se penaliza](../../../openspec/specs/tasks/spec.md#requirement-no-tener-fecha-no-se-penaliza)

De dónde vienen: los changes archivados en `openspec/changes/archive/` (`add-task-list`, `add-task-status-filter` y `add-task-due-date`) explican el porqué de cada requisito en su `proposal.md` y su `design.md`.

### Divergencias conocidas entre spec y código

Comprobadas el 2026-10-08. Mientras sigan aquí, lo que manda es la spec y el defecto está en el código.

- **`GET /api/v1/tasks?status=<valor inventado>`** responde `200` con una lista vacía, en lugar del `422` que exige [Un estado que no existe se rechaza, no se responde vacío](../../../openspec/specs/tasks/spec.md#requirement-un-estado-que-no-existe-se-rechaza-no-se-responde-vacío). La causa es que `listTasksValidator` (`backend/app/validators/task.ts`) acepta cualquier cadena en `status`.

## Dónde está el código

**Backend (`backend/`)**

- Modelo y estados: `app/models/task.ts`. Ahí están `TASK_STATUSES`, `DEFAULT_LIST_STATUSES` y `isOverdueOn()`, que es la única definición de «vencida».
- Migraciones: `database/migrations/*_create_tasks_table.ts` y `*_add_due_date_to_tasks_table.ts`.
- Validadores: `app/validators/task.ts`.
- Controladores: `app/controllers/tasks_controller.ts`, `task_statuses_controller.ts` y `task_due_dates_controller.ts`.
- Transformers:
  - `app/transformers/task_transformer.ts` para la lista, el alta y el cambio de estado;
  - `task_detail_transformer.ts` para la tarea suelta y la fecha;
  - `task_assignee_transformer.ts` para el responsable.
- Esquemas OpenAPI: `app/openapi/schemas.ts`.

**Frontend (`frontend/src/`)**

- Llamadas a la API: `lib/api.ts`, con `listTasks`, `createTask`, `getTask`, `updateTaskStatus` y `setTaskDueDate`.
- Pantallas:
  - `pages/tasks-page.tsx`, en la ruta `/tasks`;
  - `pages/task-page.tsx`, en `/tasks/:id`.

  Las dos van detrás de `routes/protected-route.tsx`.
- Componentes: `components/task-item.tsx` (la fila) y `components/task-filter.tsx` (el control de filtro).

## Cómo se prueba en local

### Arrancar

```bash
# Backend (terminal 1)
cd backend
npm install
cp .env.example .env && node ace generate:key   # solo la primera vez
node ace migration:run
npm run dev                                     # http://localhost:3333

# Frontend (terminal 2)
cd frontend
npm install
cp .env.example .env                            # VITE_API_URL=http://localhost:3333
npm run dev                                     # http://localhost:5173
```

Para probarla desde la interfaz: regístrate en `http://localhost:5173/register` y entrarás en la lista (`/tasks`).

### Tests de integración

```bash
cd backend
node ace test functional --files=tasks   # solo los de esta capability
node ace test                            # la suite entera
```

Están en `backend/tests/functional/tasks/`. Hoy solo cubren el requisito [Lo que cada tarea muestra de su responsable](../../../openspec/specs/tasks/spec.md#requirement-lo-que-cada-tarea-muestra-de-su-responsable): 3 de los 124 scenarios de la spec. El resto no tiene test.

La suite functional usa el mismo fichero SQLite que el servidor de desarrollo (`backend/tmp/db.sqlite3`). Cada test nuevo que escriba debe aislarse con `testUtils.db().withGlobalTransaction()`, como los que ya existen.

El frontend no tiene runner de tests: los requisitos de pantalla solo se pueden comprobar a mano.

### A mano contra la API

Estas llamadas escriben en la base de datos de desarrollo.

```bash
API=http://localhost:3333/api/v1

# Crear una cuenta y quedarse con su token
TOKEN=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"secreto123","passwordConfirmation":"secreto123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

# Crear una tarea, verla en la lista y acotar la lista por estado
curl -s -X POST $API/tasks -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":"Revisar el informe"}'
curl -s $API/tasks -H "Authorization: Bearer $TOKEN"
curl -s "$API/tasks?status=done" -H "Authorization: Bearer $TOKEN"

# Cambiar el estado, ponerle fecha y consultarla suelta (el día de referencia es obligatorio)
curl -s -X PATCH $API/tasks/1/status -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"in_progress"}'
curl -s -X PUT $API/tasks/1/due-date -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"dueDate":"2026-09-30","today":"2026-10-08"}'
curl -s "$API/tasks/1?today=2026-10-08" -H "Authorization: Bearer $TOKEN"
```

Cambia el `1` por el `id` que haya devuelto la creación. Si ya existe la cuenta, usa `POST $API/auth/login` con `email` y `password` para obtener otro token.
