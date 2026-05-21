"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const onLogin = pathname === "/login";

  useEffect(() => {
    if (hydrated && !user && !onLogin) {
      router.replace("/login");
    }
  }, [hydrated, user, onLogin, router]);

  // Pre-hydration: empty shell to avoid flash
  if (!hydrated) {
    return <div className="h-full bg-bg" />;
  }

  if (onLogin) {
    return <>{children}</>;
  }

  // Guarded zone — if no user, render empty shell while redirect kicks in
  if (!user) {
    return <div className="h-full bg-bg" />;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex h-full flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
