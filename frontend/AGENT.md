---
name: frontend
description: Use this agent when working in the frontend app of this repo. It covers the Vite + React + TypeScript app, route and layout structure, feature-based form flows, React Query mutations, shared axios API access, Zustand state, and the current Tailwind-driven UI style.
---

# Frontend Agent

Use this agent for changes under `frontend/`.

## Architecture

- `src/main.tsx` mounts the app and providers.
- `src/router/index.tsx` defines route structure.
- `src/components/ui/app-shell.tsx` holds the top-level layout shell.
- `src/pages/*` composes page-level screens.
- `src/features/*` holds feature-local components, schemas, and hooks.
- `src/lib/api.ts` provides the shared axios client.
- `src/lib/env.ts` owns frontend env parsing.
- `src/store/*` holds small Zustand app state.
- `src/index.css` defines the visual system and shared Tailwind-backed styling primitives.

## Working Pattern

- Keep pages thin. Compose features from `src/features/*` rather than putting business logic in pages.
- For form flows, colocate:
  - schema
  - hook
  - component
- Use `react-hook-form` with Zod via `zodResolver`.
- Use React Query for server mutations and preserve form reset behavior in success handlers.
- Use the shared axios client for API calls instead of ad hoc fetch wrappers.
- Keep Zustand for simple app-wide UI state, not for server state already handled by React Query.

## Repo-Specific Guardrails

- Preserve the current feature-first structure for contact and dubbing flows.
- Match backend field names and payload formats exactly, especially multipart `FormData` uploads for dubbing.
- Keep the captured Dubzy visual direction in `PRODUCT.md` and `DESIGN.md`: a calm localization studio with editorial brand moments, restrained product UI, and creator content taking visual priority.
- Prefer extending existing CSS variables and utility usage in `src/index.css` over scattering one-off styles.
- Keep route additions explicit in `src/router/index.tsx`.

## Common Tasks

### Add a new form-based feature

- Create a feature folder with schema, hook, and component.
- Put API calls in the feature hook via the shared axios client.
- Keep component responsibility to rendering, wiring inputs, and showing mutation state.

### Add a new page

- Create the page in `src/pages/`.
- Compose feature components into the page.
- Register the route in `src/router/index.tsx`.
- Only change `AppShell` when the new page needs shared layout behavior.

### Change API integration

- Update the feature hook first.
- Keep request/response assumptions aligned with backend validation and response envelopes.
- Use `FormData` for file uploads and plain JSON for standard form submissions unless the backend contract changes.

## Validation

Run these from `frontend/`:

```bash
npm run build
npm run lint
```

Before finishing, confirm routes still render through `AppShell` and any new request payloads match backend expectations.
