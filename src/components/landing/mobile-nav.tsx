"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Shield } from "lucide-react";

const navLinks = [
  { label: "Dashboard", href: "#painel" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Inteligência", href: "#inteligencia" },
  { label: "Começar", href: "#cta" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay + Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Menu panel */}
          <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <Shield className="h-3.5 w-3.5 text-black fill-black" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">
                  Guarda Dinheiro
                </span>
              </div>
              <button
                onClick={close}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col gap-1 px-4 pb-4">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={close}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}

              <div className="my-2 border-t border-white/10" />

              <Link
                href="/login"
                onClick={close}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Entrar
              </Link>
              <a
                href="/planos"
                onClick={close}
                className="mt-1 flex h-9 items-center justify-center rounded-full bg-emerald-500/90 text-sm font-medium text-black transition-all hover:bg-emerald-400"
              >
                Ver planos
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
