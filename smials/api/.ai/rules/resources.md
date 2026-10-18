---
paths:
  - 'app/Http/Controllers/**'
  - 'app/Http/Resources/**'
  - 'app/Enums/**'
  - 'tests/**'
---

# API resources

## Contract source
API responses are the contract with clients. Shape every structured response with a final `JsonResource` under `app/Http/Resources` instead of returning models or hand built arrays from controllers. List each attribute explicitly so adding a model column never leaks it to clients.

Application enums under `app/Enums` hold the string values clients compare against, such as `SessionStatus`. Return the enum's `value` rather than repeating the literal.

## Nullability
Return `null` for absent values instead of omitting keys, so clients can rely on a stable shape. Serialize dates as ISO 8601 strings.

## Verification
Assert the exact JSON shape in feature tests with `assertExactJson` or `assertJsonPath`, including `null` values.
