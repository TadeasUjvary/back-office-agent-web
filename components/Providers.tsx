"use client";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useCalendarStore } from "@/lib/calendar-store";
import { Toaster } from "@/components/Toaster";

function CalendarHydrator() {
  const { user, hydrated } = useAuth();
  useEffect(() => {
    if (!hydrated || !user) return;
    useCalendarStore.getState().refresh(user);
  }, [hydrated, user]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CalendarHydrator />
      {children}
      <Toaster />
    </AuthProvider>
  );
}
