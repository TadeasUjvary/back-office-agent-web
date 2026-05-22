"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { Mascot } from "@/components/Mascot";

export default function LoginPage() {
  const router = useRouter();
  const { user, hydrated, login } = useAuth();
  const [name, setName] = useState("");

  // If already signed in, jump to /
  useEffect(() => {
    if (hydrated && user) router.replace("/");
  }, [hydrated, user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    login(trimmed);
    router.replace("/");
  };

  return (
    <div className="flex h-full items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center">
          <Mascot size={72} rounded="rounded-2xl" />
          <p className="eyebrow mt-5">Reality Holding</p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text">
            Back Office Agent
          </h1>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-surface p-6 lift"
        >
          <p className="eyebrow mb-2">Reality Holding</p>
          <h2 className="mb-1 text-[17px] font-semibold tracking-tight text-text">
            Vítejte zpátky
          </h2>
          <p className="mb-5 text-[13px] text-text-muted">
            Zadejte své jméno a můžeme začít. Konverzace se ukládají pod ním.
          </p>

          <label className="block">
            <span className="eyebrow mb-1.5 block">Jméno</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="např. Tadeáš"
              className="w-full rounded-md border border-border-strong bg-bg-2 px-3 py-2 text-[14px] outline-none transition-colors focus:border-accent focus:shadow-[0_0_0_3px_rgba(64,138,113,0.22)]"
            />
          </label>

          <Button
            type="submit"
            className="mt-5 w-full justify-center"
            disabled={!name.trim()}
          >
            Vstoupit <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
