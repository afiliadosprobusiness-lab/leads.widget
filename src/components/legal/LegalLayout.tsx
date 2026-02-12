import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalLayout({ title, subtitle, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="font-bold">Lead Widget</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-10 shadow-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Legal</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{subtitle}</p>
          <p className="mt-3 text-xs text-slate-500">Última actualización: {updatedAt}</p>

          <div className="mt-8 space-y-8 text-slate-200">{children}</div>
        </section>
      </main>
    </div>
  );
}

