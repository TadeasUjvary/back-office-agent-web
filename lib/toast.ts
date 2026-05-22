"use client";
import { create } from "zustand";

export type ToastTone = "success" | "info" | "error";

export type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id"> & { id?: string; durationMs?: number }) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ id, durationMs = 3800, ...rest }) => {
    const toastId = id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts.filter((t) => t.id !== toastId), { id: toastId, ...rest }] }));
    if (durationMs > 0 && typeof window !== "undefined") {
      window.setTimeout(() => get().dismiss(toastId), durationMs);
    }
    return toastId;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable outside React render. */
export const toast = {
  success: (title: string, body?: string) => useToastStore.getState().push({ tone: "success", title, body }),
  info: (title: string, body?: string) => useToastStore.getState().push({ tone: "info", title, body }),
  error: (title: string, body?: string) => useToastStore.getState().push({ tone: "error", title, body }),
};
