import Task from '#models/task'
import { setTaskDueDateValidator, toCalendarDay } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskDetailTransformer from '#transformers/task_detail_transformer'
import { ErrorResponse, TaskDetailResponse, calendarDaySchema } from '#openapi/schemas'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'

@ApiBearerAuth()
@ApiResponse({ status: 401, type: ErrorResponse, description: 'Falta el token o no es válido.' })
export default class TaskDueDatesController {
  /**
   * Fijar, cambiar y retirar la fecha de vencimiento son la misma operación, y
   * por eso comparten endpoint: quitar la fecha no es borrar un recurso, es
   * poner el valor «sin fecha», que es un valor legítimo del campo.
   *
   * Endpoint propio en vez de un update genérico de la tarea, por el mismo
   * motivo que el estado: por ahí se colarían el título y el responsable, que
   * este change no permite tocar.
   *
   * Cualquiera con sesión puede cambiar la fecha de cualquier tarea, igual que
   * el estado. No se comprueba quién es el responsable.
   */
  @ApiOperation({
    summary: 'Fijar, cambiar o retirar la fecha de vencimiento',
    description:
      'Devuelve la tarea con el vencimiento ya resuelto contra `today`. ' +
      '`today` se lee de cuerpo o query indistintamente; el frontend lo envía en el cuerpo.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['dueDate', 'today'],
      properties: {
        dueDate: { ...calendarDaySchema, nullable: true, description: '`null` retira la fecha.' },
        today: { ...calendarDaySchema, description: 'Día de referencia de quien mira.' },
      },
    },
  })
  @ApiResponse({ status: 200, type: TaskDetailResponse })
  @ApiResponse({ status: 404, description: 'La tarea no existe.' })
  @ApiResponse({
    status: 422,
    type: ErrorResponse,
    description: '`dueDate` o `today` faltan, están mal formados o no existen.',
  })
  async update({ params, request, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    const { today, dueDate } = await request.validateUsing(setTaskDueDateValidator)

    // El `DateTime` del validador se queda aquí: hacia dentro, una fecha de
    // vencimiento es un día en texto y nunca un instante.
    task.dueDate = dueDate === null ? null : toCalendarDay(dueDate)
    await task.save()
    await task.load('assignee')

    // Se devuelve ya resuelta contra el día de quien pide, para que aplazar una
    // tarea vencida deje de mostrarla vencida en esta misma respuesta.
    return serialize(TaskDetailTransformer.transform(task, toCalendarDay(today)))
  }
}
