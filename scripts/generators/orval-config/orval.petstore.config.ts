import { defineConfig } from 'orval'

export default defineConfig({
  petstore: {
    input: {
      target: '../../../src/gen/openapi/petstore/petstore-openapi.yml',
    },
    output: {
      target: '../../../src/gen/clients/petstore.ts',
      client: 'axios',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: {
          path: '../../../src/BaseClient.ts',
          name: 'orvalMutator',
        },
      },
    },
  },
})
