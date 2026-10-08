# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4) de FlowSync tal y como está hoy en el código. La SPA en React (`frontend/`) se ejecuta en el navegador y guarda el token de sesión en `localStorage`. Habla solo con la API AdonisJS (`backend/`) por HTTP/JSON, desde `src/lib/api.ts`. La API autentica con access tokens opacos, valida con VineJS, serializa con transformers dentro de un envoltorio `{ data }` y persiste con Lucid en un único fichero SQLite. Cada contenedor indica las rutas, controladores, modelos o tablas que contiene.

```mermaid
C4Container
  title FlowSync — diagrama de contenedores

  Person(member, "Miembro del equipo", "Cuenta registrada que gestiona las tareas compartidas del espacio")

  System_Boundary(flowsync, "FlowSync") {
    Container(spa, "SPA web", "React 19, Vite 8, react-router, Tailwind v4, shadcn/ui", "Rutas /login y /register (solo sin sesión); /tasks, /tasks/:id y /profile (con sesión). Única puerta a la API: src/lib/api.ts")
    ContainerDb(storage, "localStorage", "Almacenamiento del navegador", "Token de acceso bajo la clave flowsync.token")
    Container(api, "API REST", "AdonisJS 7, VineJS 4, Auth 10 (guard api)", "Todas las rutas bajo /api/v1. Controladores: NewAccount, AccessTokens, Profile, Tasks, TaskStatuses, TaskDueDates. Transformers: User, Task, TaskDetail, TaskAssignee")
    ContainerDb(db, "Base de datos", "SQLite (better-sqlite3) vía Lucid 22", "tmp/db.sqlite3 con las tablas users, auth_access_tokens y tasks")
  }

  Rel(member, spa, "Usa", "Navegador, localhost:5173 en desarrollo")
  Rel(spa, storage, "Guarda y lee el token")
  Rel(spa, api, "Llama a /auth, /account y /tasks", "JSON/HTTP, Authorization: Bearer")
  Rel(api, db, "Lee y escribe User, Task y access tokens", "Lucid ORM")

  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```
