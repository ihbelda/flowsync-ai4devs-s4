import User from '#models/user'
import Task from '#models/task'
import { test } from '@japa/runner'
import type { Assert } from '@japa/assert'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que una tarea enseña de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable se identifica, no se filtra
 * nada más de su cuenta, y una cuenta sin nombre sigue teniendo iniciales.
 *
 * Una tarea se obtiene por dos caminos —suelta y dentro de la lista— y el
 * requisito vale para los dos, así que cada test comprueba ambas lecturas.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function sesion(client: any, email: string, fullName: string | null) {
    const user = await User.create({ fullName, email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return { user, token: response.body().data.token as string }
  }

  /**
   * El `assignee` de una misma tarea leído suelto y desde la lista. La tarea se
   * crea directamente en el modelo para que estos tests no dependan del alta.
   */
  async function lecturas(client: any, assert: Assert, token: string, assignee: User) {
    const task = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: assignee.id,
    })

    const suelta = await client
      .get(`/api/v1/tasks/${task.id}`)
      .qs({ today: '2026-10-08' })
      .header('Authorization', `Bearer ${token}`)
    suelta.assertStatus(200)

    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
    lista.assertStatus(200)

    const enLista = lista.body().data.find((t: { id: number }) => t.id === task.id)
    assert.exists(enLista, 'la tarea no aparece en la lista')

    return {
      suelta: suelta.body().data.assignee,
      lista: enLista?.assignee,
    }
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const { user, token } = await sesion(client, 'ada@example.com', 'Ada Lovelace')

    for (const [camino, assignee] of Object.entries(await lecturas(client, assert, token, user))) {
      assert.equal(assignee?.fullName, 'Ada Lovelace', `nombre en la tarea ${camino}`)
      assert.equal(assignee?.initials, 'AL', `iniciales en la tarea ${camino}`)
    }
  })

  test('el responsable no trae el email ni datos de acceso de su cuenta', async ({
    client,
    assert,
  }) => {
    // Quien mira no es el responsable: lo que no debe salir es el dato de otro.
    const { user: ada } = await sesion(client, 'ada@example.com', 'Ada Lovelace')
    const { token } = await sesion(client, 'alan@example.com', 'Alan Turing')

    for (const [camino, assignee] of Object.entries(await lecturas(client, assert, token, ada))) {
      assert.isObject(assignee, `assignee en la tarea ${camino}`)
      // «Ningún otro dato de esa cuenta»: lo único admitido es lo que la identifica.
      // Va primero para que, si falla, el informe enseñe todas las claves de más
      // y no solo la primera.
      assert.containsSubset(['id', 'fullName', 'initials'], Object.keys(assignee))
      assert.notProperty(assignee, 'email', `email en la tarea ${camino}`)
      assert.notProperty(assignee, 'password', `contraseña en la tarea ${camino}`)
      assert.notInclude(JSON.stringify(assignee), 'ada@example.com', `tarea ${camino}`)
    }
  })

  test('un responsable sin nombre llega con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const { user, token } = await sesion(client, 'ada@example.com', null)

    for (const [camino, assignee] of Object.entries(await lecturas(client, assert, token, user))) {
      assert.property(assignee, 'fullName', `nombre en la tarea ${camino}`)
      assert.isNull(assignee.fullName, `nombre en la tarea ${camino}`)
      assert.isString(assignee.initials, `iniciales en la tarea ${camino}`)
      assert.isNotEmpty(assignee.initials, `iniciales en la tarea ${camino}`)
    }
  })
})
