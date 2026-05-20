import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Back Office Agent · Reality Holding",
  description:
    "AI agent pro back-office realitní firmy — analýza klientů, kalendář, audity, ranní briefingy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-zinc-50 text-zinc-900">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex h-full flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
