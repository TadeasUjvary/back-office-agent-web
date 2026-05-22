import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/Mascot";
import { LayoutDashboard, MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-full flex-1 items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Mascot size={72} rounded="rounded-2xl" state="alive" />
        </div>
        <p className="eyebrow">Chyba 404</p>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-text">
          Tahle stránka neexistuje.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-text-muted">
          Odkaz je nejspíš zastaralý nebo přesunutý. Vraťte se na přehled, nebo se
          rovnou zeptejte asistenta.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link href="/prehled">
            <Button>
              <LayoutDashboard className="size-3.5" /> Přehled
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">
              <MessageSquare className="size-3.5" /> Otevřít chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
