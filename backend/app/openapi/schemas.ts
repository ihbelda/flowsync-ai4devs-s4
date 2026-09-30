import { TASK_STATUSES } from '#models/task'
import { ApiProperty, ApiPropertyOptional } from '@foadonis/openapi/decorators'

/**
 * Esquemas del documento OpenAPI que se repiten entre operaciones. Cada clase
 * se publica en `components.schemas` con su propio nombre y las respuestas la
 * referencian con `$ref`, así que el nombre de la clase ES el nombre del
 * esquema en el documento.
 *
 * Describen lo que ya devuelven los transformers, no lo que debería devolver
 * la API: si un transformer cambia, este fichero cambia con él.
 */

/**
 * Los tres estados del dominio, sacados del modelo para que el documento no
 * pueda anunciar uno que el código no conoce.
 */
export const taskStatusEnum = [...TASK_STATUSES]

/**
 * Un día del calendario sin hora, tal y como lo validan `today` y `dueDate`.
 */
export const calendarDaySchema = { type: 'string', format: 'date', example: '2026-09-30' } as const

/**
 * El responsable junto a una tarea: `TaskAssigneeTransformer`. Deliberadamente
 * sin email ni ningún otro dato de la cuenta.
 */
export class TaskAssignee {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Nulo si la cuenta se registró sin nombre.',
  })
  declare fullName: string | null

  @ApiProperty({ type: 'string', description: 'Siempre presente, también sin nombre.' })
  declare initials: string
}

/**
 * La tarea de la lista, la creación y el cambio de estado: `TaskTransformer`.
 * No lleva ni fecha de vencimiento ni condición de vencida.
 */
export class TaskSummary {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 200 })
  declare title: string

  @ApiProperty({ enum: taskStatusEnum })
  declare status: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare updatedAt: string

  @ApiProperty({ type: TaskAssignee })
  declare assignee: TaskAssignee
}

/**
 * La tarea suelta y la respuesta al fijar su fecha: `TaskDetailTransformer`.
 * Es lo único que informa del vencimiento, resuelto contra el `today` pedido.
 */
export class TaskDetail {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 200 })
  declare title: string

  @ApiProperty({ enum: taskStatusEnum })
  declare status: string

  @ApiProperty({
    ...calendarDaySchema,
    nullable: true,
    description: 'Nulo si la tarea no tiene fecha.',
  })
  declare dueDate: string | null

  @ApiProperty({
    type: 'boolean',
    description: 'Hay fecha, es anterior a `today` y la tarea no está en `done`.',
  })
  declare isOverdue: boolean

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare updatedAt: string

  @ApiProperty({ type: TaskAssignee })
  declare assignee: TaskAssignee
}

/**
 * Envoltorios `{ data }` que añade `ctx.serialize()` a toda respuesta.
 */
export class TaskSummaryResponse {
  @ApiProperty({ type: TaskSummary })
  declare data: TaskSummary
}

export class TaskDetailResponse {
  @ApiProperty({ type: TaskDetail })
  declare data: TaskDetail
}

export class TaskListResponse {
  @ApiProperty({ type: [TaskSummary], description: 'La lista entera, sin paginar.' })
  declare data: TaskSummary[]
}

/**
 * Un error tal y como lo emiten VineJS (422, con `rule` y `field`) y el guard
 * de auth (401, solo `message`).
 */
export class ErrorItem {
  @ApiProperty({ type: 'string' })
  declare message: string

  @ApiPropertyOptional({ type: 'string', description: 'Regla de VineJS que ha fallado.' })
  declare rule?: string

  @ApiPropertyOptional({ type: 'string', description: 'Campo o parámetro señalado.' })
  declare field?: string

  @ApiPropertyOptional({ type: 'object', description: 'Detalle de la regla, p. ej. `choices`.' })
  declare meta?: Record<string, unknown>
}

export class ErrorResponse {
  @ApiProperty({ type: [ErrorItem] })
  declare errors: ErrorItem[]
}
