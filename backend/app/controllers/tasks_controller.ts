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
  ErrorResponse,
  TaskDetailResponse,
  TaskListResponse,
  TaskSummaryResponse,
  calendarDaySchema,
  taskStatusEnum,
} from '#openapi/schemas'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@foadonis/openapi/decorators'

@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponse, description: 'Falta el token o no es válido.' })
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
    summary: 'Lista compartida de tareas',
    description:
      'Sin `status`, devuelve las pendientes y las que están en curso (no «todas»). ' +
      'Ordenada de la más reciente a la más antigua, sin paginar y sin vencimiento.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: taskStatusEnum,
    description:
      'Un único estado. Hoy el validador acepta cualquier texto: un valor fuera de ' +
      'estos tres responde 200 con lista vacía en vez de 422.',
  })
  @ApiResponse({
    status: 200,
    type: TaskListResponse,
    description: 'La lista, vacía si no hay nada.',
  })
  @ApiResponse({
    status: 422,
    type: ErrorResponse,
    description: '`status` repetido (llega como lista).',
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
    description: 'Incluye su fecha de vencimiento y si está vencida respecto a `today`.',
  })
  @ApiQuery({
    name: 'today',
    required: true,
    schema: calendarDaySchema,
    description: 'Día de referencia de quien mira. No hay valor por defecto.',
  })
  @ApiResponse({ status: 200, type: TaskDetailResponse })
  @ApiResponse({ status: 404, description: 'La tarea no existe.' })
  @ApiResponse({
    status: 422,
    type: ErrorResponse,
    description: '`today` falta o no es un día válido.',
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
      'Solo se lee el título. Nace pendiente, sin fecha y a nombre de quien la crea; ' +
      'cualquier otro campo del cuerpo se ignora.',
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
          description: 'Se recortan los espacios de los extremos antes de medirlo.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: TaskSummaryResponse })
  @ApiResponse({
    status: 422,
    type: ErrorResponse,
    description: 'Título ausente, vacío, de solo espacios o de más de 200 caracteres.',
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
