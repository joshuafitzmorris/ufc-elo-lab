import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://ufcelolab.com"
  ),
  title: {
    default: "UFC Elo Lab",
    template: "%s | UFC Elo Lab",
  },
  description:
    "Performance-weighted UFC fighter ratings that reward dominant finishes. Compare classic Elo vs performance-based rankings across all weight classes.",
  openGraph: {
    type: "website",
    siteName: "UFC Elo Lab",
    title: "UFC Elo Lab",
    description:
      "Performance-weighted UFC fighter ratings that reward dominant finishes. Compare classic Elo vs performance-based rankings across all weight classes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UFC Elo Lab",
    description:
      "Performance-weighted UFC fighter ratings that reward dominant finishes.",
  },
};

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/rankings", label: "Rankings" },
  { href: "/leaderboard", label: "Classic" },
  { href: "/compare", label: "Compare" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} antialiased`}>
        <header className="sticky top-0 z-10 border-b border-[var(--outline)] bg-[var(--surface)]/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
            >
              UFC Elo Lab
            </Link>
            <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1 transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
