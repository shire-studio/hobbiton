---
paths:
  - 'resources/js/**/*.ts'
  - 'vite.config.ts'
  - 'tsconfig.json'
  - 'package.json'
---

# Auto imports

This kit renders Blade views with Livewire and Flux, so nothing is auto imported. Livewire injects Livewire and Alpine for you. Keep `resources/js` small, write it in TypeScript and import every module explicitly. Reach for Flux components, Livewire actions and Alpine before adding JavaScript.
