# 1. Las delta-specs de OpenSpec como fuente de verdad viva

## Contexto

FlowSync describe lo que hace en `openspec/`, con dos capas que se alimentan entre sí:

- **La spec viva**, en `openspec/specs/<capability>/spec.md`. Hay dos capabilities: `auth` (19 requisitos, 45 scenarios) y `tasks` (32 requisitos, 124 scenarios). Cada requisito usa `SHALL` / `NO SHALL` y se concreta en scenarios `WHEN` / `THEN`, muchos con la ruta HTTP, el cuerpo y el código de respuesta esperados.
- **Los changes**, en `openspec/changes/`. Cada uno trae `proposal.md`, `design.md`, `tasks.md` y una **delta-spec** por capability afectada, organizada en bloques `ADDED`, `MODIFIED` y `REMOVED Requirements`. Al archivar un change, su delta se funde en la spec viva y la carpeta pasa a `changes/archive/AAAA-MM-DD-<nombre>/`. Hoy no hay ningún change activo; los tres que existen están archivados:

| Change archivado | Delta sobre `tasks` | Delta sobre `auth` |
|---|---|---|
| `2026-08-13-add-task-list` | 14 requisitos `ADDED` (crea la capability) | 3 `MODIFIED`, 1 `ADDED` |
| `2026-08-13-add-task-status-filter` | 7 `ADDED`, 4 `MODIFIED` | — |
| `2026-08-13-add-task-due-date` | 11 `ADDED`, 1 `MODIFIED` | — |

Así se relacionan:

- **La spec viva de `tasks` es exactamente la suma de esas tres deltas.** 14 + 7 + 11 dan los 32 requisitos, y los `MODIFIED` reescriben enteros requisitos que ya existían, en vez de añadir otros nuevos. Por ejemplo, *Una sola lista compartida del espacio* nació diciendo «todas las tareas» y el change del filtro la reescribió como «pendientes y en curso».
- **Varias deltas tocan el mismo requisito.** *Una sola vista de tareas, sin señales de presencia* la modifican tanto el filtro como el vencimiento. El texto vivo depende del orden en que se archivaron, y los tres changes llevan la misma fecha.
- **`auth` no tiene change de origen en el archivo.** Ya existía antes de usar este flujo, así que su historia empieza a mitad.
- **No todos los changes describen trabajo futuro.** `add-task-status-filter` lo dice expresamente: documenta un comportamiento que ya estaba implementado, porque el código había dejado falsos requisitos de la spec viva.
- **`openspec/config.yaml`** solo fija `schema: spec-driven`. Las secciones de contexto y de reglas siguen siendo la plantilla comentada.

Además, la spec ya funciona en la práctica como contrato. Los tests de `backend/tests/functional/` citan el requisito y los scenarios que cubren. La revisión del documento OpenAPI se hizo contra los scenarios de `tasks`. La interfaz y la API se discuten con los nombres de los requisitos, no con los del código.

Falta una decisión explícita sobre qué manda cuando la spec y el código no coinciden. Este ADR la registra.

## Decisión

**La spec viva de `openspec/specs/` es la fuente de verdad de lo que FlowSync hace, y solo cambia a través de delta-specs archivadas.**

1. **Lo que dice la spec viva es lo que el sistema debe hacer.** Si el código hace otra cosa, el defecto está en el código, salvo que un change diga lo contrario.
2. **Ningún cambio de comportamiento observable llega a `main` sin su delta-spec.** Cuenta como observable toda ruta, código de respuesta, forma de un objeto, regla de validación o conducta de una pantalla. La delta debe dejar claro qué requisitos se añaden, cuáles se reescriben enteros y cuáles se retiran.
3. **La spec viva no se edita a mano.** Solo cambia al archivar un change, que es el momento en que la delta se funde.
4. **Si se descubre comportamiento ya implementado que la spec no recoge, se abre un change retroactivo**, como hizo `add-task-status-filter`. No se corrige la spec en silencio.
5. **Los artefactos de un change** (`proposal`, `design`, `tasks`) explican el porqué y quedan en el archivo como historia. No son normativos una vez archivado el change: lo normativo es la spec viva.

## Estado

Aceptada, el 2026-10-08.

Registra a posteriori una práctica que ya se seguía desde los tres changes del 2026-08-13.

## Consecuencias

**Lo que ganamos**

- **Una respuesta única a «¿qué tiene que hacer esto?».** Un requisito tiene un solo sitio, y sus scenarios se pueden convertir directamente en tests o en anotaciones del contrato de la API. Ya se ha hecho así con los tests del responsable y con el documento OpenAPI.
- **Historia del porqué.** Cada requisito se puede rastrear hasta el change que lo introdujo o lo reescribió, con la propuesta y el diseño que lo justificaron. Ahí quedan también las decisiones que se tomaron y las que se dejaron abiertas a propósito, como PA-3, PA-7 o PA-8.
- **Los cambios se revisan por su efecto, no por su diff.** Una delta con `MODIFIED` obliga a escribir entero el requisito nuevo. Así se ve qué conducta deja de valer, como pasó con «la lista ya no es todas».
- **Los huecos se pueden medir.** Al ser la referencia, se puede contar cuánto de ella está verificado y cuánto no.

**Lo que nos cuesta**

- **La spec dice la verdad sobre lo que debería pasar, no sobre lo que pasa.** Nada en el flujo comprueba que el código cumple la spec al archivar, y ya hay casos que lo demuestran:
  - `add-task-status-filter` afirma como implementado que un `status` inventado se rechaza con `422`. Hoy `GET /api/v1/tasks?status=archivado` responde `200` con una lista vacía.
  - `add-task-list` se archivó con la tarea «6.3 Verificar que ninguna respuesta de tareas incluye el email del responsable» sin marcar, y la lista estuvo devolviendo ese email hasta que un test lo destapó.

  Tratar la spec como verdad sin verificación convierte esas divergencias en errores silenciosos en vez de en avisos.
- **Archivar no exige haber terminado.** Los tres changes declaran como fuera de alcance «Sin tests», y entre `add-task-list` y `add-task-due-date` se archivaron 9 tareas de verificación sin hacer. Cuando se adoptó la práctica, de los 124 scenarios de `tasks` no había ni uno cubierto por un test. El coste de esta decisión incluye pagar después esa verificación.
- **Las deltas obligan a reescribir requisitos enteros.** Un `MODIFIED` reemplaza el requisito completo, así que un cambio pequeño exige copiar y retocar un bloque largo. Si dos changes tocan el mismo requisito, el resultado depende del orden de archivo, y con varios changes en paralelo eso es un conflicto que nadie avisa.
- **La spec viva solo se lee bien entera.** `tasks/spec.md` ya supera las 750 líneas, mezcla requisitos de API y de interfaz en la misma capability, y no indica qué change introdujo cada requisito. Para saberlo hay que ir al archivo.
- **Más trabajo antes de cada cambio.** Incluso un ajuste de comportamiento pequeño exige un change con propuesta, diseño, tareas y delta. Es justo lo que da la historia, pero frena los arreglos rápidos y tienta a saltárselo, y cada vez que se salta, la spec deja de ser la verdad.
- **La cobertura de la historia es parcial.** `auth` no tiene change de origen, y `config.yaml` no recoge contexto ni reglas del proyecto. Quien llegue nuevo tendrá la spec, pero no siempre el porqué de su primera versión.
- **Dependemos de una herramienta y de su formato.** El merge de deltas lo hace OpenSpec. Si cambia su formato o se deja de usar, el archivo sigue siendo legible, pero fundir las deltas pasaría a ser trabajo manual.
