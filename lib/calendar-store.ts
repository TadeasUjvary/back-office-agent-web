"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime?: string;      // HH:MM
  durationMinutes?: number;
  attendees?: string[];
  location?: string;
  notes?: string;
  source: "seed" | "agent";
  createdAt?: string;
};

type CalendarState = {
  events: CalendarEvent[];
  seeded: boolean;
  seed: (events: CalendarEvent[]) => void;
  addEvent: (event: Omit<CalendarEvent, "id" | "source" | "createdAt"> & { id?: string; source?: "agent" | "seed" }) => CalendarEvent;
  removeEvent: (id: string) => void;
  clearAgent: () => void;
};

function eid() {
  return `evt-${Math.random().toString(36).slice(2, 10)}`;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      seeded: false,
      seed: (events) => {
        if (get().seeded) return;
        set({ events: events.map((e) => ({ ...e, source: e.source ?? "seed" })), seeded: true });
      },
      addEvent: (input) => {
        const event: CalendarEvent = {
          id: input.id ?? eid(),
          title: input.title,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          durationMinutes: input.durationMinutes,
          attendees: input.attendees,
          location: input.location,
          notes: input.notes,
          source: input.source ?? "agent",
          createdAt: new Date().toISOString(),
        };
        // Idempotency: if same id exists, skip
        if (get().events.some((e) => e.id === event.id)) return event;
        set({ events: [...get().events, event] });
        return event;
      },
      removeEvent: (id) => set({ events: get().events.filter((e) => e.id !== id) }),
      clearAgent: () => set({ events: get().events.filter((e) => e.source !== "agent") }),
    }),
    { name: "bo-agent-calendar" },
  ),
);
