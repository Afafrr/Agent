---
applyTo: "tests/**"
---

# Testing Conventions

## Framework

- Use the Node.js built-in `node:test` module (`describe`, `it`, `beforeEach`).
- Use `node:assert` for assertions (`assert.strictEqual`, `assert.deepStrictEqual`).
- No external test frameworks (no Jest, Vitest, Mocha).

## File Layout

- Test files live in `tests/` with `*.test.ts` suffix.
- `tests/run-tests.ts` is the entry point that discovers and runs all test files.

## Mocking Strategy

- Mock at module boundaries: repository functions, handler functions, integration clients.
- Do not mock deep internals or utility pure functions — test those directly.
- Use direct function reassignment for mocks (the codebase does not use DI containers).
- Reset mocks in `beforeEach` to avoid test pollution.

## Naming

- `describe` blocks: name of the function or module under test.
- `it` blocks: describe the behavior, not the implementation. Example: `'creates call record and answers inbound initiated calls'`.
