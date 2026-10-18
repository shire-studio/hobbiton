import tailwindcss from '@tailwindcss/vite'
import laravel from 'laravel-vite-plugin'
import { bunny } from 'laravel-vite-plugin/fonts'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 80,
    sortTailwindcss: {
      stylesheet: 'resources/css/app.css',
    },
    tabWidth: 2,
    sortPackageJson: false,
    sortImports: {
      newlinesBetween: false,
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    },
  },
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc'],
    categories: {
      correctness: 'warn',
    },
    ignorePatterns: ['vendor', 'node_modules', 'public', 'vite.config.ts'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  plugins: [
    laravel({
      input: [
        'resources/css/app.css',
        'resources/js/app.ts',
        'resources/js/passkeys.ts',
      ],
      refresh: true,
      fonts: [
        bunny('Instrument Sans', {
          weights: [400, 500, 600],
        }),
      ],
    }),
    tailwindcss(),
  ],
  server: {
    cors: true,
    watch: {
      ignored: [
        '**/.agents/**',
        '**/.ai/**',
        '**/.claude/**',
        '**/.codex/**',
        '**/.cursor/**',
        '**/.junie/**',
        '**/storage/framework/views/**',
        '**/vendor/**',
      ],
    },
  },
})
