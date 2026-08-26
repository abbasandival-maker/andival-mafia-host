"use client";

import Link from "next/link";
import {
  Plus,
  LogIn,
  Crown,
  Shield,
  Users,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090C] text-white">

      {/* ================================
          BACKGROUND
      ================================= */}
      <div className="pointer-events-none absolute inset-0">

        {/* Red glow */}
        <div className="absolute left-1/2 top-[-180px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-900/20 blur-[130px]" />

        {/* Gold glow */}
        <div className="absolute bottom-[-250px] left-[-150px] h-[450px] w-[450px] rounded-full bg-yellow-600/10 blur-[140px]" />

        {/* Right glow */}
        <div className="absolute right-[-180px] top-1/3 h-[400px] w-[400px] rounded-full bg-red-950/20 blur-[140px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />

      </div>

      {/* ================================
          CONTENT
      ================================= */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-[460px]">

          {/* ================================
              BRAND
          ================================= */}
          <div className="mb-9 text-center">

            {/* Logo */}
            <div className="relative mx-auto mb-5 flex h-[78px] w-[78px] items-center justify-center">

              <div className="absolute inset-0 rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-transparent to-red-900/20 shadow-[0_0_45px_rgba(234,179,8,0.08)]" />

              <Crown
                size={34}
                className="relative text-yellow-400"
                strokeWidth={1.6}
              />

            </div>

            {/* Official */}
            <div className="mb-3 flex items-center justify-center gap-3">

              <div className="h-px w-9 bg-gradient-to-r from-transparent to-yellow-500/60" />

              <span className="text-[9px] font-bold tracking-[0.32em] text-yellow-500/80">
                OFFICIAL GAME HOST
              </span>

              <div className="h-px w-9 bg-gradient-to-l from-transparent to-yellow-500/60" />

            </div>

            <h1 className="text-4xl font-black tracking-[0.16em] text-white sm:text-5xl">
              ANDIVAL
            </h1>

            <div className="mt-1 text-xs font-bold tracking-[0.42em] text-red-500">
              MAFIA HOST
            </div>

            <p className="mx-auto mt-5 max-w-[330px] text-sm leading-6 text-zinc-500">
              Professional live Mafia experience.
              <br />
              Create a room, join the game, and trust no one.
            </p>

          </div>

          {/* ================================
              MENU
          ================================= */}
          <div className="space-y-3">

            {/* CREATE */}
            <Link
              href="/create"
              className="group flex items-center rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500 to-yellow-400 p-[1px] transition duration-200 hover:scale-[1.015] hover:shadow-[0_0_35px_rgba(234,179,8,0.15)]"
            >
              <div className="flex w-full items-center rounded-2xl bg-[#EAB308] px-4 py-3.5 text-black">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/10">
                  <Plus size={21} strokeWidth={2.3} />
                </div>

                <div className="ml-4 flex-1">
                  <div className="text-base font-black">
                    Create Room
                  </div>

                  <div className="mt-0.5 text-[11px] font-medium text-black/60">
                    Start a new Mafia game
                  </div>
                </div>

                <ChevronRight
                  size={20}
                  className="transition group-hover:translate-x-1"
                />

              </div>
            </Link>

            {/* JOIN */}
            <Link
              href="/join"
              className="group flex items-center rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 backdrop-blur-sm transition duration-200 hover:border-red-500/30 hover:bg-red-950/10"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/10 bg-red-950/25 text-red-400">
                <LogIn size={20} />
              </div>

              <div className="ml-4 flex-1">
                <div className="text-base font-bold text-white">
                  Join Room
                </div>

                <div className="mt-0.5 text-[11px] text-zinc-500">
                  Enter with your 6-digit room code
                </div>
              </div>

              <ChevronRight
                size={19}
                className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-red-400"
              />

            </Link>

            {/* HOST */}
            <Link
              href="/host"
              className="group flex items-center rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 py-3.5 backdrop-blur-sm transition duration-200 hover:border-yellow-500/25 hover:bg-yellow-500/[0.03]"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/10 bg-yellow-500/[0.06] text-yellow-400">
                <Crown size={20} />
              </div>

              <div className="ml-4 flex-1">
                <div className="text-base font-bold text-white">
                  Host Panel
                </div>

                <div className="mt-0.5 text-[11px] text-zinc-500">
                  Manage your live Mafia game
                </div>
              </div>

              <ChevronRight
                size={19}
                className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-yellow-400"
              />

            </Link>

          </div>

          {/* ================================
              STATUS
          ================================= */}
          <div className="mt-7 flex items-center justify-center gap-5 text-[10px] uppercase tracking-[0.14em] text-zinc-600">

            <div className="flex items-center gap-2">
              <Shield size={13} className="text-zinc-500" />
              Secure Game
            </div>

            <div className="h-3 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <Users size={13} className="text-zinc-500" />
              Live Players
            </div>

          </div>

          {/* Footer */}
          <div className="mt-7 text-center">
            <p className="text-[9px] tracking-[0.22em] text-zinc-700">
              © ANDIVAL MAFIA HOST
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}