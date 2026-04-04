type RuntimeAuthBridge = {
  getLanguage: () => string;
  redirectToLogin: () => void;
  showConsentRequired: () => void;
  showToast: (options: { title: string; variant?: "success" | "error" | "warning" | "info" }) => void;
};

const defaultBridge: RuntimeAuthBridge = {
  getLanguage: () => "en",
  redirectToLogin: () => undefined,
  showConsentRequired: () => undefined,
  showToast: () => undefined
};

let bridge = defaultBridge;

export const configureRuntimeBridge = (nextBridge: Partial<RuntimeAuthBridge>) => {
  bridge = { ...bridge, ...nextBridge };
};

export const runtimeBridge = {
  getLanguage: () => bridge.getLanguage(),
  redirectToLogin: () => bridge.redirectToLogin(),
  showConsentRequired: () => bridge.showConsentRequired(),
  showToast: (options: { title: string; variant?: "success" | "error" | "warning" | "info" }) => bridge.showToast(options),
  configure: configureRuntimeBridge
};
