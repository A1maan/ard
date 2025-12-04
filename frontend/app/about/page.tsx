"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

const HIGHLIGHTS = [
  {
    title: "Soil telemetry",
    text: "Fuses moisture, organic content, and compaction feeds to forecast when growers can plant or when heavy equipment can safely roll in.",
  },
  {
    title: "Construction readiness",
    text: "Flags job sites when the ground profile dips below tolerance so you can reroute rigs, schedule grading, or accelerate remediation crews.",
  },
  {
    title: "Nationwide coverage",
    text: "County-level telemetry stitched into one command surface that scales from Central Valley orchards to Appalachian wind corridors.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] via-[#f0ecdf] to-[#e9e2d4] text-[#1f2c1a]">
      <AppHeader
        title="About ARD Soil Intelligence"
        action={
          <Link
            href="/"
            className="rounded-full border border-[#9ab07b] px-5 py-2 text-sm font-medium text-[#2f472f] transition hover:border-[#5d7a46] hover:text-[#1f341f]"
          >
            Back to dashboard
          </Link>
        }
      />
      <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-[#d8cfb4] bg-white/90 px-8 py-10 shadow-[0_40px_80px_rgba(76,64,40,0.15)]">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-[#6f7e58]">About ARD</p>
          <h1 className="text-3xl font-semibold text-[#1f341f]">Soil & Site Intelligence Platform</h1>
          <p className="text-base leading-relaxed text-[#4b5d43]">
            ARD blends agronomic telemetry with construction readiness data so field operators can manage micro-regions on a
            single canvas. Hover or tap a county in the main dashboard and you will see live coverage, soil health indices,
            and deployment readiness for both growers and equipment crews.
          </p>
          <p className="text-base leading-relaxed text-[#4b5d43]">
            The map supports pinch-zooming down to rural parcels, while the side panels surface KPIs, narrative insights, and
            watch lists that help dispatchers decide where to send irrigation teams, drones, graders, or heavy haul fleets.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#d4c9a8] bg-gradient-to-br from-[#fffdf9] to-[#f4eddc] px-4 py-5"
            >
              <p className="text-sm font-semibold text-[#1f341f]">{item.title}</p>
              <p className="mt-2 text-sm text-[#5c6c50]">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d8cfb4] bg-white px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1f341f]">Back to the map</p>
            <p className="text-xs text-[#5c6c50]">Explore the live telemetry and interactive coverage layers.</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#9ab07b] px-5 py-2 text-sm font-medium text-[#2f472f] transition hover:border-[#5d7a46] hover:text-[#1f341f]"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
