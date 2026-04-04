import { vi } from "vitest";

const memoryStorage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStorage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      memoryStorage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStorage.delete(key);
    })
  }
}));

vi.mock("expo-router", () => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  },
  Link: ({ children }: { children: unknown }) => children,
  Redirect: () => null,
  Slot: () => null,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
  Stack: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => ({ sessionId: "501" })
}));

vi.mock("expo-local-authentication", () => ({
  hasHardwareAsync: vi.fn(async () => true),
  authenticateAsync: vi.fn(async () => ({ success: true }))
}));

vi.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: vi.fn(async () => ({
    canceled: false,
    assets: [{ uri: "file://profile.png" }]
  }))
}));

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  addNotificationReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  getPermissionsAsync: vi.fn(async () => ({ granted: true })),
  requestPermissionsAsync: vi.fn(async () => ({ granted: true })),
  getExpoPushTokenAsync: vi.fn(async () => ({ data: "ExponentPushToken[test]" })),
  IosAuthorizationStatus: { PROVISIONAL: 2 }
}));

vi.mock("expo-network", () => ({
  getNetworkStateAsync: vi.fn(async () => ({ isConnected: true, isInternetReachable: true }))
}));
