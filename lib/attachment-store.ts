"use client";
import { create } from "zustand";

export type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  text: string;
  truncated?: boolean;
  addedAt: string;
};

type AttachmentState = {
  attachments: Attachment[];
  add: (a: Omit<Attachment, "id" | "addedAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useAttachmentStore = create<AttachmentState>((set, get) => ({
  attachments: [],
  add: (a) =>
    set({
      attachments: [
        ...get().attachments,
        { ...a, id: `att-${Math.random().toString(36).slice(2, 10)}`, addedAt: new Date().toISOString() },
      ],
    }),
  remove: (id) => set({ attachments: get().attachments.filter((x) => x.id !== id) }),
  clear: () => set({ attachments: [] }),
}));
