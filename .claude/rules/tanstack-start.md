---
description: Rules for working with tanstack/react-start framework in admin app
globs: apps/admin/*
alwaysApply: false
---

# Tanstack Start Code Style Guide

## Framework Overview

- The tanstack start framework is a fullstack typescript framework
- It uses a file-based routing system where all routes are located in the `src/routes folder`. For example, the route /files corresponds to the file `src/routes/files.tsx`
- This project uses the latest version which is based on nitro/vite integration instead of vinxi, use context7 to get the latest documentation when researching

## Server Actions

- When creating a server action using `createServerFn` from `@tanstack/react-start` follow the `$...` naming convention. For example a function that list agents user created should be called `$listAgents`.
- Put server action in seperate file than client code
- When calling server actions from the client, all data should be placed inside the data property.
- Redirects are already handlded by `setupRouterSsrQueryIntegration`, there is no need to use `useServerFn` from `@tanstack/react-start`

## Route Components

- Components that are only used within a route should be placed in a folder with the -components suffix inside the src/routes directory. Note that files starting with - are not routes themselves, but components used specifically within routes.
- API Routes are located inside routes/api/...

## React Query Integration

- Always use invalidation instead of refetch (unless you absoultely have to)
- Always use debounce with search functionality