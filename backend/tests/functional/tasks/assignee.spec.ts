import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea enseña de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: que el responsable se pueda identificar, que
 * junto a la tarea no viaje ningún otro dato de su cuenta, y que una cuenta sin
 * nombre siga llegando con iniciales.
 *
 * Cada scenario se comprueba sobre las dos lecturas que devuelven responsable
 * —la lista y la tarea suelta—, porque el requisito habla de «cada tarea» y el
 * scenario del email dice explícitamente «suelta o dentro de la lista». Son dos
 * transformers distintos, así que cumplirlo en uno no dice nada del otro.
 *
 * El aislamiento es una transacción global y no un truncate a propósito: la
 * suite functional pega contra el mismo fichero SQLite que el servidor de
 * desarrollo (`config/database.ts` no tiene override por entorno), y vaciarlo
 * se llevaría por delante los datos con los que se está trabajando. Por lo
 * mismo la lista puede traer tareas ajenas al test, así que la suya se busca
 * por id en vez de darla por única.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /**
   * `GET /tasks/:id` exige el día de referencia de quien mira. Aquí no se está
   * probando el vencimiento: vale cualquier día mientras sea válido.
   */
  const HOY = '2026-09-30'

  async function sesion(client: any, fullName: string | null, email: string) {
    const user = await User.create({ fullName, email, password: 'secreto123' })

    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return { user, token: login.body().data.token as string }
  }

  /**
   * El tipo generado para el cuerpo de la lista es la unión de «una tarea» y
   * «un array de tareas», así que se acota antes de buscar en él.
   */
  function buscar(data: unknown, id: number) {
    const tareas: any[] = Array.isArray(data) ? data : [data]

    return tareas.find((tarea: { id: number }) => tarea?.id === id)
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const { user, token } = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: user.id,
    })

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    lista.assertStatus(200)
    const enLista = buscar(lista.body().data, tarea.id)
    assert.isDefined(enLista, 'la tarea recién creada tiene que venir en la lista')
    assert.equal(enLista.assignee.fullName, 'Ada Lovelace')
    assert.equal(enLista.assignee.initials, 'AL')

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    assert.equal(suelta.body().data.assignee.fullName, 'Ada Lovelace')
    assert.equal(suelta.body().data.assignee.initials, 'AL')
  })

  test('la tarea no filtra el email ni ningún otro dato de la cuenta', async ({
    client,
    assert,
  }) => {
    const { user, token } = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const tarea = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: user.id,
    })

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    lista.assertStatus(200)
    const enLista = buscar(lista.body().data, tarea.id)
    assert.isDefined(enLista, 'la tarea recién creada tiene que venir en la lista')
    assert.notProperty(enLista.assignee, 'email')
    assert.notProperty(enLista.assignee, 'password')
    // No basta con que no haya una clave `email`: el email no puede salir por
    // ninguna otra, ni siquiera de propina.
    assert.notInclude(JSON.stringify(enLista), 'ada@example.com')

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    assert.notProperty(suelta.body().data.assignee, 'email')
    assert.notProperty(suelta.body().data.assignee, 'password')
    assert.notInclude(JSON.stringify(suelta.body().data), 'ada@example.com')
  })

  test('un responsable sin nombre llega con el nombre nulo y las iniciales puestas', async ({
    client,
    assert,
  }) => {
    const { user, token } = await sesion(client, null, 'ada@example.com')
    const tarea = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: user.id,
    })

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    lista.assertStatus(200)
    const enLista = buscar(lista.body().data, tarea.id)
    assert.isDefined(enLista, 'la tarea recién creada tiene que venir en la lista')
    assert.isNull(enLista.assignee.fullName)
    // Las iniciales siguen llegando: son lo que permite representar a la cuenta
    // sin recurrir a su email.
    assert.equal(enLista.assignee.initials, 'AE')

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    assert.isNull(suelta.body().data.assignee.fullName)
    assert.equal(suelta.body().data.assignee.initials, 'AE')
  })
})
