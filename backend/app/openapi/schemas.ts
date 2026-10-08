import { TASK_STATUSES } from '#models/task'
import { ApiProperty, ApiPropertyOptional } from '@foadonis/openapi/decorators'

/**
 * Esquemas de las respuestas de tasks para el documento OpenAPI.
 *
 * Cada clase se publica una sola vez en `components.schemas`, con el nombre de
 * la clase, y las operaciones la referencian con un `$ref`. Describen lo que
 * el código devuelve hoy —los transformers de `app/transformers/` y los
 * errores de VineJS, auth y Lucid—, no lo que debería devolver: si algún día
 * divergen, se corrige el código o se corrige esto, pero no se maquilla aquí.
 *
 * Los `declare` son solo para que TypeScript acepte el decorador sobre la
 * propiedad: estas clases nunca se instancian.
 */

/**
 * El responsable tal y como viaja con una tarea (`TaskAssigneeTransformer`):
 * lo justo para identificarlo. Nunca el email ni nada más de la cuenta.
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

  @ApiProperty({
    type: 'string',
    description: 'Siempre presente, también cuando `fullName` es nulo.',
  })
  declare initials: string
}

/**
 * Una tarea tal y como sale en la lista, en el alta y en el cambio de estado
 * (`TaskTransformer`). No lleva vencimiento a propósito: la lista no debe
 * poder mostrarlo.
 */
export class Task {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 200 })
  declare title: string

  @ApiProperty({ enum: [...TASK_STATUSES] })
  declare status: string

  @ApiProperty({ type: () => TaskAssignee })
  declare assignee: TaskAssignee

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare updatedAt: string
}

/**
 * Una tarea suelta, con su vencimiento (`TaskDetailTransformer`). La condición
 * de vencida se resuelve contra el `today` que manda quien pide.
 */
export class TaskDetail {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 200 })
  declare title: string

  @ApiProperty({ enum: [...TASK_STATUSES] })
  declare status: string

  @ApiProperty({
    type: 'string',
    format: 'date',
    nullable: true,
    description: 'Día del calendario `AAAA-MM-DD`, sin hora ni huso. Nulo si no tiene fecha.',
  })
  declare dueDate: string | null

  @ApiProperty({
    type: 'boolean',
    description:
      'Vencida si y solo si tiene fecha, esa fecha es anterior a `today` y la tarea no está en `done`.',
  })
  declare isOverdue: boolean

  @ApiProperty({ type: () => TaskAssignee })
  declare assignee: TaskAssignee

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare updatedAt: string
}

/** Envoltorio `{ data }` que añade `ctx.serialize()` a toda respuesta. */
export class TaskResponse {
  @ApiProperty({ type: () => Task })
  declare data: Task
}

export class TaskDetailResponse {
  @ApiProperty({ type: () => TaskDetail })
  declare data: TaskDetail
}

/** La lista llega entera en un array: no hay paginación. */
export class TaskListResponse {
  @ApiProperty({ type: () => [Task] })
  declare data: Task[]
}

/** Un error de validación de VineJS, señalando el campo que falla. */
export class ValidationErrorItem {
  @ApiProperty({ type: 'string' })
  declare message: string

  @ApiProperty({
    type: 'string',
    description: 'Regla de VineJS que ha fallado, p. ej. `required`.',
  })
  declare rule: string

  @ApiProperty({ type: 'string', description: 'Campo que ha fallado, p. ej. `title`.' })
  declare field: string

  @ApiPropertyOptional({
    type: 'object',
    description: 'Datos de la regla, p. ej. `choices` en un `enum`.',
  })
  declare meta?: Record<string, unknown>
}

/** Cuerpo de un `422`. */
export class ValidationErrorResponse {
  @ApiProperty({ type: () => [ValidationErrorItem] })
  declare errors: ValidationErrorItem[]
}

export class ErrorMessage {
  @ApiProperty({ type: 'string' })
  declare message: string
}

/** Cuerpo de un `401`: falta el token o no es válido. */
export class UnauthorizedResponse {
  @ApiProperty({ type: () => [ErrorMessage] })
  declare errors: ErrorMessage[]
}

/**
 * Cuerpo de un `404` cuando la tarea no existe (`E_ROW_NOT_FOUND` de Lucid).
 * Fuera de producción el manejador de errores añade además `name` y la pila.
 */
export class NotFoundResponse {
  @ApiProperty({ type: 'string' })
  declare message: string
}
