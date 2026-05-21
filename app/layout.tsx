import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Back Office Agent · Reality Holding",
  description:
    "AI agent pro back-office realitní firmy — analýza klientů, kalendář, audity, ranní briefingy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${fraunces.variable} ${plexMono.variable} h-full`}
    >
      <body className="h-full text-ink">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex h-full flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
