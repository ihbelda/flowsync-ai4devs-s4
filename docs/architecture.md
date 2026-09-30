# Arquitectura de FlowSync

Este es el diagrama de contenedores de FlowSync —el nivel 2 del modelo C4—: las
piezas que se ejecutan por separado y cómo se hablan entre ellas. Son cuatro —la
SPA de React, la API de AdonisJS, el `localStorage` del navegador y el fichero
SQLite—, cada una con su tecnología entre corchetes y una línea de lo que hace,
y cada flecha con el protocolo por el que va. Se queda en el nivel de contenedor
y no descompone ninguno en componentes: los controladores, los modelos de Lucid
y los transformers viven dentro de la API y serían ya un diagrama de nivel 3.
Está dibujado con `flowchart` y no con el modo `C4Container` de Mermaid, que
sigue siendo experimental y falla en bastantes visores aunque su sintaxis sea
válida. Todo lo que aparece está verificado leyendo el repositorio:
`start/routes.ts` para los endpoints, `app/controllers/`, `app/models/`,
`app/transformers/` y `providers/api_provider.ts` para la forma de la API,
`config/database.ts` y `database/migrations/` para la capa de datos, y
`frontend/src/` para las pantallas, los guards, `lib/api.ts` y
`auth-provider.tsx`. No se dibuja nada que el código no sostenga: no hay
despliegue, ni cachés, ni servicios externos, ni colas, ni más base de datos que
el SQLite local.

```mermaid
%%{init: {"flowchart": {"wrappingWidth": 420}}}%%
flowchart TB
    miembro(["Miembro del equipo<br/>[Persona]<br/>Trabaja sobre la lista compartida del espacio"])

    subgraph flowsync["Sistema FlowSync"]
        direction TB

        spa["Aplicacion web<br/>[React 19, Vite 8, react-router, Tailwind v4]<br/>SPA en el puerto 5173. Pantallas de registro, login,<br/>lista de tareas, tarea y perfil, con guards de sesion.<br/>Habla con la API solo a traves de lib/api.ts"]

        storage[("localStorage del navegador<br/>[Web Storage API]<br/>Token de acceso bajo la clave flowsync.token")]

        api["API HTTP<br/>[AdonisJS 7, TypeScript 6, VineJS 4]<br/>Puerto 3333, rutas bajo /api/v1: registro, login,<br/>perfil, logout, lista y alta de tareas, tarea suelta,<br/>cambio de estado y fecha de vencimiento"]

        db[("Base de datos<br/>[SQLite via better-sqlite3, Lucid 22]<br/>backend/tmp/db.sqlite3 con las tablas<br/>users, auth_access_tokens y tasks")]
    end

    miembro -->|"Usa<br/>[HTTP, puerto 5173]"| spa
    spa -->|"Guarda y relee el token de sesion"| storage
    spa -->|"Llama a /api/v1 con Authorization Bearer<br/>[JSON sobre HTTP, URL en VITE_API_URL]"| api
    api -->|"Lee y escribe cuentas, tokens y tareas<br/>[Lucid 22 ORM]"| db

    classDef persona fill:#08427B,stroke:#052E56,color:#FFFFFF
    classDef contenedor fill:#438DD5,stroke:#2E6295,color:#FFFFFF
    class miembro persona
    class spa,storage,api,db contenedor
    style flowsync fill:none,stroke:#888888,stroke-dasharray: 6 4
```
