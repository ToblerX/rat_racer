import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rat Racer — CV Optimizer",
  description: "Analyze and optimize your CV for specific job vacancies using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Rat Racer
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-primary transition-colors">
                New Analysis
              </Link>
              <Link
                href="/saved"
                className="hover:text-primary transition-colors"
              >
                Saved CVs
              </Link>
              <Link
                href="/history"
                className="hover:text-primary transition-colors"
              >
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
