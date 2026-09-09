import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js 16.3 quickstart",
  description: "Monoframe full stack example with the whole cache stack wired",
};

const routes = [
  { href: "/", label: "Overview" },
  { href: "/directory", label: "Directory" },
  { href: "/live", label: "Live" },
  { href: "/client-cache", label: "Client cache" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
          <header className="flex flex-col gap-4 border-b border-border pb-6">
            <div>
              <p className="text-sm text-text-muted">Monoframe</p>
              <h1 className="text-2xl font-semibold text-text-primary">
                Next.js 16.3 quickstart
              </h1>
            </div>
            <nav className="flex flex-wrap gap-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
