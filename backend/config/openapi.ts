import { defineConfig } from '@foadonis/openapi'

export default defineConfig({
  ui: 'scalar',
  document: {
    info: {
      title: 'FlowSync API',
      version: 'v1',
    },
    components: {
      securitySchemes: {
        // `@ApiBearerAuth()` referencia este nombre: los access tokens opacos del guard `api`.
        bearer: { type: 'http', scheme: 'bearer' },
      },
    },
  },
})
