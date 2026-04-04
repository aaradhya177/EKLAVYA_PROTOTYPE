# Shared API Client

`frontend/shared/api` contains the typed data access layer used by the Expo mobile app and the Next.js web apps.

## What is included

- `client.ts`: shared Axios instance with request and response interceptors
- `modules/`: one typed module per backend domain
- `queryClient.ts`: TanStack Query client and persistence helpers
- `../hooks/`: domain hooks for queries and mutations
- `../stores/authStore.ts`: persisted auth state for web and mobile
- `../mocks/`: MSW handlers for tests and Storybook

## Base URL

The client resolves its backend base URL in this order:

1. `NEXT_PUBLIC_API_URL`
2. `EXPO_PUBLIC_API_URL`
3. `http://localhost:8000`

## Request behavior

Every request automatically adds:

- `Authorization: Bearer <accessToken>` from the shared auth store
- `X-Request-ID` as a UUID per request
- `Accept-Language` from the configured runtime bridge

## Response behavior

- Successful responses unwrap the backend `APIResponse<T>` envelope and return `data`
- `401` triggers token refresh and retries the original request once
- `451` triggers the consent-required runtime action
- `429` shows a warning toast and retries after the server delay
- `5xx` shows an error toast and reports to Sentry

## Runtime bridge

Platform apps should configure the bridge at startup:

```ts
import { configureRuntimeBridge } from "@athleteos/shared/stores";

configureRuntimeBridge({
  getLanguage: () => currentLocale,
  redirectToLogin: () => router.push("/login"),
  showConsentRequired: () => setConsentModalOpen(true),
  showToast: ({ title, variant }) => toast({ title, variant })
});
```

## Query client

Use the shared query client helpers in app bootstrap code:

```ts
import {
  queryClient,
  setupMobileQueryPersistence,
  setupWebQueryPersistence
} from "@athleteos/shared/api";
```

- Web persistence uses `localStorage`
- Mobile persistence uses `AsyncStorage`

## Mock server

MSW fixtures live under `frontend/shared/mocks`.

- `handlers.ts`: endpoint handlers
- `server.ts`: Node test server
- `browser.ts`: browser worker for Storybook

Storybook can start the browser worker before rendering stories, while Vitest uses the Node server from `vitest.setup.ts`.
