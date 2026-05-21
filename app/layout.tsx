import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AuthShell } from "@/components/AuthShell";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
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
    <html lang="cs" className={`${inter.variable} ${plexMono.variable} h-full`}>
      <body className="h-full">
        <Providers>
          <AuthShell>{children}</AuthShell>
        </Providers>
      </body>
    </html>
  );
}
