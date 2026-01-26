---
alwaysApply: true
---

# This file outlines some of the library usage guid

## Zod

- This project uses zod 4, so instead of using `z.record(z.string())` use `z.record(z.string(), z.string())`
- Instead of using `z.string().url` which is deprecated, use `z.url()`
- Instead of using ZodIssueCode like `z.ZodIssueCode.custom` use literals `'custom'`
- Instead of using `z.describe`, use the modern `z.meta({ description: ... })` syntax
- Use the latest api `z.looseRecord(z.string(), z.string())` or `z.object({...}).and(z.looseRecord(z.string(), z.string()))` when validate against headers
- Instead of using `z.merge`, use `A.extend(B.shape)` instead.
- Instead of chaining `.nullable().optional()` use `.nullish()` directly

## @tanstack/react-query

- Always use invalidation instead of refetch (unless you absoultely have to)
- 项目里 QueryClient 已配置了全局 MutationCache.onSuccess，会根据 mutationKey[0] 自动调用 invalidateQueries。

每个 useMutation 必须设置 mutationKey，其第 0 个元素要与对应查询的 key 匹配。

成功/失败提示统一用 meta.success / meta.error 控制。

示例：

```tsx
useMutation({
  mutationKey: ["users", "create"],
  mutationFn: $createUser,
  meta: {
    success: { message: "用户已创建" },
    error: { message: "创建失败" },
  },
});
```

这样就会自动失效 `["users"]` 的查询，不需要手动 invalidate。