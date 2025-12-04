"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  title?: string;
  action?: ReactNode;
};

export function AppHeader({ title = "Earth-data command center", action }: AppHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-6xl space-y-4 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Image
            src="/ard-logo.png"
            alt="ARD Soil Intelligence"
            width={180}
            height={60}
            priority
            className="h-12 w-auto drop-shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
          />
          <p className="text-xs uppercase tracking-[0.4em] text-[#6f7e58]">Soil & Site Intelligence Platform</p>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-[#46563a]">
          <Link href="/" className="transition hover:text-[#1f341f]">
            Home
          </Link>
          <Link href="/about" className="transition hover:text-[#1f341f]">
            About
          </Link>
        </nav>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-[#1f341f]">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
