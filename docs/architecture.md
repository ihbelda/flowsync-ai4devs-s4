# Arquitectura de FlowSync

Este diagrama de contenedores (nivel 2 del modelo C4) muestra las piezas que se
despliegan y ejecutan por separado en FlowSync, y cómo se hablan entre ellas:
una SPA de React servida por Vite, una API HTTP de AdonisJS y un fichero SQLite.
Dentro de cada contenedor se indican los elementos reales del código que
determinan su forma —las rutas declaradas, los controladores, los modelos de
Lucid, los transformers y la capa de acceso a datos—, pero el diagrama se queda
en el nivel de contenedor y no descompone ninguno en componentes. Todo lo
dibujado está verificado leyendo el repositorio: `start/routes.ts`,
`app/controllers/`, `app/models/`, `app/transformers/`, `providers/api_provider.ts`,
`config/database.ts`, `database/migrations/` y `frontend/src/`. No aparece nada
que el código no sostenga: no hay despliegue, ni cachés, ni servicios externos,
ni colas, ni más base de datos que el SQLite local.

```mermaid
C4Container
    title Diagrama de contenedores - FlowSync

    Person(miembro, "Miembro del equipo", "Se registra, inicia sesion y trabaja sobre la lista compartida de tareas del espacio")

    System_Boundary(flowsync, "FlowSync") {
        Container(spa, "Aplicacion web", "React 19, Vite 8, react-router, Tailwind v4, shadcn/ui", "SPA en :5173. Pantallas /login, /register, /tasks, /tasks/:id y /profile (routes/app-routes.tsx), protegidas por los guards ProtectedRoute y PublicOnlyRoute. Todo el contacto con la API pasa por lib/api.ts, que desenvuelve la clave data de la respuesta y traduce los errores a ApiError")

        ContainerDb(storage, "localStorage del navegador", "Web Storage API", "Guarda el token de acceso bajo la clave flowsync.token. auth-provider.tsx lo rehidrata al arrancar contra GET /account/profile")

        Container(api, "API HTTP", "AdonisJS 7, TypeScript 6, VineJS 4", "Escucha en :3333. Rutas bajo /api/v1 (start/routes.ts): auth/signup, auth/login, account/profile, account/logout, tasks, tasks/:id, tasks/:id/status y tasks/:id/due-date. Los controladores validan con VineJS, operan sobre los modelos y serializan con los transformers; api_provider.ts envuelve toda respuesta bajo la clave data")

        ContainerDb(db, "Base de datos", "SQLite via better-sqlite3, Lucid 22", "Fichero backend/tmp/db.sqlite3. Tablas users, auth_access_tokens y tasks, creadas por database/migrations/. El esquema de los modelos se autogenera en database/schema.ts")
    }

    Rel(miembro, spa, "Usa", "HTTP, localhost:5173")
    Rel(spa, storage, "Guarda y relee el token de sesion", "sincrono")
    Rel(spa, api, "Llama a /api/v1/** con cabecera Authorization Bearer", "JSON sobre HTTP, VITE_API_URL")
    Rel(api, db, "Lee y escribe tareas, cuentas y tokens", "Lucid 22 ORM")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```
