---
paths:
  - 'routes/*.php'
  - 'app/Http/Controllers/**/*.php'
---

# Routes

## Internal URLs
Name every route. Prefer `route()` for application URLs in tests, notifications and responses. Routes live in `routes/api.php` without an `/api` prefix, because the whole application is the API.

Literal paths are acceptable in route declarations, static `Route::redirect()` declarations, package configuration that accepts a path, tests that intentionally verify a conventional path, isolated request fixtures, and explicit defensive fallbacks. Do not add other hardcoded internal application URLs.

## Route handlers
Use controller classes for stateful request handling and mutations. Route closures are acceptable for trivial JSON responses that contain no reusable application logic. Use `Route::redirect()` for static redirects.

Prefer implicit route model binding for first party model parameters. Explicit binding is acceptable when a package or configurable model requires it.

## Middleware
Attach static middleware to route definitions or route groups. Protect authenticated routes with `auth:sanctum`. Controller middleware is acceptable when it is conditional or specifically coupled to that controller.
