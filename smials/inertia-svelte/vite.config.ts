import { globSync, readFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { wayfinder } from '@laravel/vite-plugin-wayfinder'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import laravel from 'laravel-vite-plugin'
import { bunny } from 'laravel-vite-plugin/fonts'
import AutoImport from 'unplugin-auto-import/vite'
import { watch } from 'vite-plugin-watch'
import { defineConfig } from 'vite-plus'

const jsDir = fileURLToPath(new URL('./resources/js', import.meta.url))

/**
 * Auto import every component and layout by its file name, so names match the Vue kit.
 */
function components() {
  return globSync(['components/*.svelte', 'layouts/**/*.svelte'], {
    cwd: jsDir,
  }).map((file) => ({
    from: join(jsDir, file),
    imports: [['default', basename(file, '.svelte')] as [string, string]],
  }))
}

/**
 * Auto import every shadcn-svelte component with a Ui prefix, so names match the Vue kit.
 * Bare names that are also exported under an alias, such as Root in Select, are skipped.
 */
function uiComponents() {
  return globSync('components/ui/*/index.ts', { cwd: jsDir }).map((file) => {
    const code = readFileSync(join(jsDir, file), 'utf-8').replace(/\/\/.*/g, '')
    const exports = [...code.matchAll(/export \{([^}]*)\}/g)]
      .flatMap(([, names]) => names.split(','))
      .map((name) => name.trim().split(' as '))
    const aliased = new Set(
      exports.filter((names) => names.length > 1).map(([name]) => name),
    )

    return {
      from: `@/components/ui/${basename(dirname(file))}`,
      imports: exports
        .filter((names) => names.length > 1 || !aliased.has(names[0]))
        .map((names) => names.at(-1)!)
        .filter((name) => /^[A-Z]/.test(name))
        .map((name): [string, string] => [name, `Ui${name}`]),
    }
  })
}

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    htmlWhitespaceSensitivity: 'css',
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
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc'],
    categories: {
      correctness: 'warn',
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
      input: ['resources/css/app.css', 'resources/js/app.ts'],
      ssr: 'resources/js/ssr.ts',
      refresh: true,
      fonts: [
        bunny('Instrument Sans', {
          weights: [400, 500, 600],
        }),
      ],
    }),
    tailwindcss(),
    svelte(),
    wayfinder({
      formVariants: true,
    }),
    AutoImport({
      dts: 'auto-imports.d.ts',
      dtsMode: 'overwrite',
      include: [/\.[jt]s$/, /\.svelte$/, /\.svelte\.[jt]s$/],
      imports: [
        'svelte',
        {
          svelte: ['untrack'],
          '@inertiajs/svelte': [
            'page',
            'router',
            'useForm',
            'useRemember',
            'Link',
            'Form',
            'Deferred',
          ],
        },
        ...components(),
        ...uiComponents(),
      ],
      dirs: ['resources/js/composables'],
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
