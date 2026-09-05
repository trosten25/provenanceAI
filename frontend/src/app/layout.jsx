import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata = {
  title: "ProvenanceAI | Academic Integrity",
  description: "Stylometric Authorship Verification",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-900 min-h-screen flex flex-col font-sans">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg text-white">
                <ShieldCheck size={20} />
              </div>
              <span className="font-extrabold text-lg text-primary tracking-tight">
                Provenance<span className="text-secondary">AI</span>
              </span>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 text-sm font-semibold text-primary hover:text-secondary transition"
              >
                1. Ingest Baselines
              </Link>
              <Link
                href="/verify"
                className="px-4 py-2 text-sm font-semibold bg-accent text-primary rounded-lg shadow-sm hover:opacity-90 transition"
              >
                2. Audit Assignment
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}