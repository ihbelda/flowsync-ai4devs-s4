import Task, { DEFAULT_LIST_STATUSES } from '#models/task'
import {
  createTaskValidator,
  listTasksValidator,
  taskReferenceDayValidator,
  toCalendarDay,
} from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import TaskDetailTransformer from '#transformers/task_detail_transformer'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@foadonis/openapi/decorators'
import {
  NotFoundResponse,
  TaskDetailResponse,
  TaskListResponse,
  TaskResponse,
  UnauthorizedResponse,
  ValidationErrorResponse,
} from '#openapi/schemas'

@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token o no es válido.',
  type: UnauthorizedResponse,
})
export default class TasksController {
  /**
   * La lista del espacio: una sola, la misma para todo el mundo, sin filtrar
   * por quién la pide. El responsable va precargado en la misma consulta —
   * es el 100 % de los accesos y resolverlo tarea a tarea sería el error caro
   * y evidente aquí.
   *
   * Admite acotarse por estado, y aquí hay tres caminos que no se cruzan:
   * un estado válido devuelve solo el suyo (aunque no haya ninguna, y eso es
   * una lista vacía legítima, no un error); no pedir nada devuelve lo que
   * sigue abierto; y un estado que no existe ni siquiera llega, porque el
   * validador lo corta antes con un 422. Devolverlo vacío sería el fallo
   * silencioso que esta lista no se puede permitir.
   *
   * Acotar es solo lectura: ninguna tarea cambia por consultarla.
   */
  @ApiOperation({
    summary: 'Lista de tareas del espacio',
    description:
      'La misma lista para cualquier cuenta, de la más reciente a la más antigua, entera y sin paginar. Sin `status` devuelve las pendientes y en curso, nunca las hechas.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: 'string',
    description:
      'Acota la lista a un único estado: `pending`, `in_progress` o `done`. Hoy el servidor no rechaza otros valores: cualquier otra cadena responde `200` con una lista vacía.',
  })
  @ApiResponse({
    status: 200,
    description: 'Las tareas del alcance pedido.',
    type: TaskListResponse,
  })
  @ApiResponse({
    status: 422,
    description: '`status` no es una cadena (por ejemplo, se ha enviado más de uno).',
    type: ValidationErrorResponse,
  })
  async index({ request, serialize }: HttpContext) {
    const { status } = await request.validateUsing(listTasksValidator)

    const query = Task.query().preload('assignee')

    if (status) {
      query.where('status', status)
    } else {
      // Sin filtro no es «todas»: lo hecho se queda fuera.
      query.whereIn('status', [...DEFAULT_LIST_STATUSES])
    }

    const tasks = await query
      .orderBy('createdAt', 'desc')
      // Desempate estable: dos tareas creadas en el mismo milisegundo tienen
      // la misma marca de tiempo, y sin esto su orden relativo sería el que
      // quisiera la base de datos.
      .orderBy('id', 'desc')

    return serialize(TaskTransformer.transform(tasks))
  }

  /**
   * Una tarea suelta, con todo lo que tiene: es la única lectura que informa
   * del vencimiento, y por eso es la única que exige el día de quien mira.
   */
  @ApiOperation({
    summary: 'Una tarea suelta',
    description:
      'Incluye la fecha de vencimiento y la condición de vencida, resuelta contra el `today` de quien pide. No comprueba quién es el responsable.',
  })
  @ApiQuery({
    name: 'today',
    required: true,
    schema: { type: 'string', format: 'date' },
    description: 'Día de referencia de quien mira, `AAAA-MM-DD`. No hay valor por defecto.',
  })
  @ApiResponse({ status: 200, description: 'La tarea.', type: TaskDetailResponse })
  @ApiResponse({ status: 404, description: 'La tarea no existe.', type: NotFoundResponse })
  @ApiResponse({
    status: 422,
    description: 'Falta `today` o no es una fecha válida.',
    type: ValidationErrorResponse,
  })
  async show({ params, request, serialize }: HttpContext) {
    const { today } = await request.validateUsing(taskReferenceDayValidator)
    const task = await Task.findOrFail(params.id)
    await task.load('assignee')

    return serialize(TaskDetailTransformer.transform(task, toCalendarDay(today)))
  }

  /**
   * Crear cuesta un título. El responsable y el estado no se leen de la
   * petición ni aunque vengan: los pone el sistema.
   */
  @ApiOperation({
    summary: 'Crear una tarea',
    description:
      'Solo pide el título. La tarea nace `pending`, sin fecha y a nombre de quien la crea; cualquier otro campo del cuerpo se ignora.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Se recortan los espacios de los extremos antes de validar la longitud.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'La tarea creada.', type: TaskResponse })
  @ApiResponse({
    status: 422,
    description: 'Título ausente, vacío, de solo espacios o de más de 200 caracteres.',
    type: ValidationErrorResponse,
  })
  async store({ request, response, auth, serialize }: HttpContext) {
    const { title } = await request.validateUsing(createTaskValidator)
    const user = auth.getUserOrFail()

    // El estado va explícito y no se deja al valor por defecto de la columna:
    // el modelo recién creado no vuelve a leerse de la base de datos, así que
    // ese defecto no llegaría a la respuesta.
    const task = await Task.create({ title, status: 'pending', assigneeId: user.id })
    await task.load('assignee')

    // El estado se marca aparte y el cuerpo se devuelve: `serialize()` entrega
    // una promesa que resuelve el pipeline al devolverla, y pasársela a
    // `response.created()` deja la respuesta con el cuerpo vacío.
    response.status(201)
    return serialize(TaskTransformer.transform(task))
  }
}
