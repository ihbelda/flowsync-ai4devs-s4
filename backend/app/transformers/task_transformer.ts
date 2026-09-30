import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'
import TaskAssigneeTransformer from '#transformers/task_assignee_transformer'

/**
 * Una tarea tal y como la devuelven la lista, la creación y el cambio de
 * estado: sin su fecha de vencimiento ni su condición de vencida, que son cosa
 * de `TaskDetailTransformer`.
 *
 * El responsable pasa por `TaskAssigneeTransformer` y no por `UserTransformer`:
 * junto a una tarea solo viaja lo justo para identificarlo —nombre e
 * iniciales—, y ningún otro dato de esa cuenta, en particular su email. Con
 * `UserTransformer` se colaban además `email`, `createdAt` y `updatedAt`, y un
 * dato de cuenta que ya ha salido por la API no se recorta después sin romper a
 * quien lo consuma.
 */
export default class TaskTransformer extends BaseTransformer<Task> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status', 'createdAt', 'updatedAt']),
      assignee: TaskAssigneeTransformer.transform(this.whenLoaded(this.resource.assignee)),
    }
  }
}
