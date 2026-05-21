"use client";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { useCalendarStore } from "@/lib/calendar-store";
import { loadSeedEvents } from "@/lib/calendar-seed";

function CalendarSeeder() {
  useEffect(() => {
    useCalendarStore.getState().seed(loadSeedEvents());
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CalendarSeeder />
      {children}
    </AuthProvider>
  );
}
