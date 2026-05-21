"use client";
import { create } from "zustand";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime?: string;
  durationMinutes?: number;
  attendees?: string[];
  location?: string;
  notes?: string;
  source: "seed" | "agent";
  createdAt?: string;
};

type CalendarState = {
  events: CalendarEvent[];
  hydrated: boolean;
  setEvents: (events: CalendarEvent[]) => void;
  /** Add to local cache (server already persisted). */
  addEventLocal: (event: CalendarEvent) => void;
  removeEventLocal: (id: string) => void;
  /** Fetch from /api/calendar (server-side Supabase). */
  refresh: (userId: string) => Promise<void>;
  /** Add event via /api/calendar POST + local cache. */
  createEvent: (userId: string, event: Omit<CalendarEvent, "source" | "createdAt"> & { source?: CalendarEvent["source"] }) => Promise<CalendarEvent>;
  /** Delete via /api/calendar/[id] DELETE. */
  deleteEvent: (userId: string, id: string) => Promise<void>;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  hydrated: false,
  setEvents: (events) => set({ events, hydrated: true }),
  addEventLocal: (event) => {
    if (get().events.some((e) => e.id === event.id)) return;
    set({ events: [...get().events, event] });
  },
  removeEventLocal: (id) => set({ events: get().events.filter((e) => e.id !== id) }),
  refresh: async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/calendar", {
        headers: { "x-user-id": encodeURIComponent(userId) },
      });
      const data = await res.json();
      if (Array.isArray(data.events)) {
        set({ events: data.events, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch (e) {
      console.error("[calendar] refresh failed", e);
      set({ hydrated: true });
    }
  },
  createEvent: async (userId, event) => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": encodeURIComponent(userId) },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "create failed");
    const created = data.event as CalendarEvent;
    get().addEventLocal(created);
    return created;
  },
  deleteEvent: async (userId, id) => {
    const res = await fetch(`/api/calendar/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-user-id": encodeURIComponent(userId) },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? "delete failed");
    }
    get().removeEventLocal(id);
  },
}));
