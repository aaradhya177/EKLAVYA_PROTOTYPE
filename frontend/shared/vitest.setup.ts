import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();

  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(async () => {
        store.clear();
      })
    }
  };
});

vi.mock("@sentry/browser", () => ({
  captureException: vi.fn()
}));
