# Arquitectura de FlowSync

Diagrama de contenedores (nivel 2 de C4, dibujado como `flowchart` para que lo pinte cualquier visor de Mermaid) de FlowSync tal y como está hoy en el código. La SPA en React (`frontend/`) se ejecuta en el navegador y guarda el token de sesión en `localStorage`. Habla solo con la API AdonisJS (`backend/`) por HTTP/JSON, desde `src/lib/api.ts`. La API autentica con access tokens opacos, valida con VineJS, serializa con transformers dentro de un envoltorio `{ data }` y persiste con Lucid en un único fichero SQLite. Cada contenedor indica las rutas, controladores, modelos o tablas que contiene.

```mermaid
flowchart TB
  member["<b>Miembro del equipo</b><br/>[Persona]<br/>Cuenta registrada que gestiona<br/>las tareas compartidas del espacio"]

  subgraph flowsync["FlowSync"]
    spa["<b>SPA web</b><br/>[Contenedor: React 19, Vite 8, react-router,<br/>Tailwind v4, shadcn/ui]<br/>Rutas /login y /register sin sesión;<br/>/tasks, /tasks/:id y /profile con sesión.<br/>Única puerta a la API: src/lib/api.ts"]
    storage[("<b>localStorage</b><br/>[Almacenamiento del navegador]<br/>Token de acceso bajo la clave flowsync.token")]
    api["<b>API REST</b><br/>[Contenedor: AdonisJS 7, VineJS 4,<br/>Auth 10 con guard api]<br/>Rutas bajo /api/v1. Controladores: NewAccount,<br/>AccessTokens, Profile, Tasks, TaskStatuses, TaskDueDates.<br/>Transformers: User, Task, TaskDetail, TaskAssignee"]
    db[("<b>Base de datos</b><br/>[SQLite con better-sqlite3 vía Lucid 22]<br/>tmp/db.sqlite3 con las tablas<br/>users, auth_access_tokens y tasks")]
  end

  member -- "Usa<br/>[navegador, localhost:5173 en desarrollo]" --> spa
  spa -- "Guarda y lee el token" --> storage
  spa -- "Llama a /auth, /account y /tasks<br/>[JSON/HTTP, Authorization: Bearer]" --> api
  api -- "Lee y escribe User, Task y access tokens<br/>[Lucid ORM]" --> db

  classDef person fill:#08427b,stroke:#052e56,color:#fff
  classDef container fill:#1168bd,stroke:#0b4884,color:#fff
  class member person
  class spa,storage,api,db container
```
