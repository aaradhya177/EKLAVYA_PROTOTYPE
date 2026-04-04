import { runtimeBridge } from "../stores/runtime";

export const handleMutationSuccess = (message: string) => {
  runtimeBridge.showToast({ title: message, variant: "success" });
};

export const handleMutationError = (message: string) => {
  runtimeBridge.showToast({ title: message, variant: "error" });
};
