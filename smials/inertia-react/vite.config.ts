import { globSync, readFileSync } from 'fs'
import { basename, join } from 'path'
import { fileURLToPath } from 'url'
import { wayfinder } from '@laravel/vite-plugin-wayfinder'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import { bunny } from 'laravel-vite-plugin/fonts'
import AutoImport from 'unplugin-auto-import/vite'
import { watch } from 'vite-plugin-watch'
import { defineConfig } from 'vite-plus'

const uiDir = fileURLToPath(
  new URL('./resources/js/components/ui', import.meta.url),
)

/**
 * Auto import every shadcn/ui component with a Ui prefix, so names match the Vue kit.
 */
function uiComponents() {
  return globSync('*.tsx', { cwd: uiDir }).map((file) => ({
    from: `@/components/ui/${basename(file, '.tsx')}`,
    imports: [
      ...readFileSync(join(uiDir, file), 'utf-8').matchAll(
        /export \{([^}]*)\}/g,
      ),
    ]
      .flatMap(([, names]) => names.split(','))
      .map((name) => name.trim())
      .filter((name) => /^[A-Z]/.test(name))
      .map((name): [string, string] => [name, `Ui${name}`]),
  }))
}

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 80,
    sortTailwindcss: {
      stylesheet: 'resources/css/app.css',
      functions: ['cn', 'cva'],
    },
    tabWidth: 2,
    sortPackageJson: false,
    sortImports: {
      newlinesBetween: false,
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    },
    ignorePatterns: [
      'resources/js/components/ui/*',
      'resources/js/types/generated.d.ts',
      'resources/views/mail/*',
      'resources/js/actions/*',
      'resources/js/routes/*',
      'resources/js/wayfinder/*',
      'resources/js/types/home/runner/*',
      'resources/js/types/typescript-transformer-manifest.json',
    ],
  },
  lint: {
    plugins: ['eslint', 'react', 'typescript', 'unicorn', 'oxc'],
    categories: {
      correctness: 'warn',
    },
    rules: {
      // Components are auto imported, and TypeScript checks them through auto-imports.d.ts.
      'react/jsx-no-undef': 'off',
    },
    ignorePatterns: [
      'vendor',
      'node_modules',
      'public',
      'bootstrap/ssr',
      'vite.config.ts',
      'resources/js/actions',
      'resources/js/routes',
      'resources/js/wayfinder',
      'resources/js/components/ui',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
    },
  },
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
      fonts: [
        bunny('Instrument Sans', {
          weights: [400, 500, 600],
        }),
      ],
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    wayfinder({
      formVariants: true,
    }),
    AutoImport({
      dts: 'auto-imports.d.ts',
      dtsMode: 'overwrite',
      include: [/\.[jt]sx?$/],
      imports: [
        'react',
        {
          '@inertiajs/react': [
            'useForm',
            'usePage',
            'useRemember',
            'usePrefetch',
            'router',
            'Link',
            'Form',
            'Head',
            'Deferred',
          ],
        },
        ...uiComponents(),
      ],
      dirs: [
        'resources/js/composables',
        'resources/js/components',
        'resources/js/layouts/**',
      ],
      defaultExportByFilename: true,
    }),
    watch({
      pattern: 'app/{Data,Enums}/**/*.php',
      command: 'composer run transform-types',
    }),
  ],
  server: {
    watch: {
      ignored: [
        '**/.agents/**',
        '**/.ai/**',
        '**/.claude/**',
        '**/.codex/**',
        '**/.cursor/**',
        '**/.junie/**',
        '**/vendor/**',
      ],
    },
  },
})
