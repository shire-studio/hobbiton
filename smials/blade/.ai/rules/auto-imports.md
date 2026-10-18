---
paths:
  - 'resources/js/**/*.ts'
  - 'vite.config.ts'
  - 'tsconfig.json'
  - 'package.json'
---

# Auto imports

This kit renders Blade views, so nothing is auto imported. Keep `resources/js` small, write it in TypeScript and import every module explicitly. Reach for anonymous Blade components under `resources/views/components` before adding JavaScript.
