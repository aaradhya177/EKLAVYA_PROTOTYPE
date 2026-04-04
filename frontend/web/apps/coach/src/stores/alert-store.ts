"use client";

import { create } from "zustand";

import { alerts, type CoachAlert } from "@/lib/mock-data";

type AlertStore = {
  activeAlerts: CoachAlert[];
  lastChecked: string | null;
  setAlerts: (items: CoachAlert[]) => void;
  acknowledgeAlert: (id: string) => void;
  acknowledgeMany: (ids: string[]) => void;
  updateLastChecked: (value: string) => void;
};

export const useAlertStore = create<AlertStore>((set) => ({
  activeAlerts: alerts,
  lastChecked: null,
  setAlerts: (items) => set({ activeAlerts: items }),
  acknowledgeAlert: (id) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.map((alert) => (alert.id === id ? { ...alert, reviewed: true } : alert))
    })),
  acknowledgeMany: (ids) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.map((alert) => (ids.includes(alert.id) ? { ...alert, reviewed: true } : alert))
    })),
  updateLastChecked: (value) => set({ lastChecked: value })
}));
