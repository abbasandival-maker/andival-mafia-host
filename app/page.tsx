"use client";

import Link from "next/link";
import { Plus, LogIn, Crown } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white flex items-center justify-center p-6">

      <div className="w-full max-w-xl">

        <div className="text-center mb-12">

          <h1 className="text-5xl font-black text-yellow-400">
            ANDIVAL
          </h1>

          <h2 className="text-3xl font-bold mt-2">
            Mafia Host
          </h2>

          <p className="text-gray-400 mt-4">
            Professional TikTok Live Mafia Game
          </p>

        </div>

        <div className="space-y-5">

          <Link
            href="/create"
            className="flex items-center justify-center gap-3 rounded-2xl bg-yellow-500 py-5 text-xl font-bold text-black hover:bg-yellow-400 transition"
          >
            <Plus size={24} />
            Create Room
          </Link>

          <Link
            href="/join"
            className="flex items-center justify-center gap-3 rounded-2xl bg-zinc-900 border border-zinc-700 py-5 text-xl font-bold hover:bg-zinc-800 transition"
          >
            <LogIn size={24} />
            Join Room
          </Link>

          <Link
            href="/host"
            className="flex items-center justify-center gap-3 rounded-2xl bg-zinc-900 border border-zinc-700 py-5 text-xl font-bold hover:bg-zinc-800 transition"
          >
            <Crown size={24} />
            Host Panel
          </Link>

        </div>

      </div>

    </main>
  );
}