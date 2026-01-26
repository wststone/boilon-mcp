---
globs: *.ts,*.tsx
alwaysApply: false
---

# TypeScript Code Style Guide

- Avoid explicit type annotations when TypeScript can infer types.
- Avoid defining `any` type variables (e.g., `let a: number;` instead of `let a;`).
- Use the most accurate type possible (e.g., use `Record<PropertyKey, unknown>` instead of `object`).
- Prefer `type` over `interface` (e.g., define react component props).
- Use `as const satisfies XyzInterface` instead of `as const` when suitable
- import index.ts module(directory module) like `@/db` instead of `@/db/index`
- Instead of calling Date.now() multiple times, assign it to a constant once and reuse it. This ensures consistency and improves readability
- Always refactor repeated logic into a reusable function
- Do NOT remove meaningful code comments, be sure to keep original comments when providing applied code
- Update the code comments when needed after you modify the related code
- Do NOT write explicit return types for functions (unless there is a VERY good reason)
- Use `Number.isFinite` and `Number.isNaN` vs global `isFinite` and `isNaN`