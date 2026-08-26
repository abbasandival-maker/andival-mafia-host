"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createHokmGame } from "@/services/hokm/createGame";

export default function HokmCreatePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleCreateGame() {
    if (loading) return;

    try {
      setLoading(true);

      const game = await createHokmGame();

      console.log("Game Created:", game);

      router.push(`/hokm/host/${game.gameId}`);
    } catch (error) {
      console.error("Create Game Error:", error);
      alert("خطا در ساخت بازی");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-700 p-8">

        <h1 className="text-center text-4xl font-bold">
          ANDIVAL HOKM
        </h1>

        <p className="mt-3 text-center text-neutral-400">
          Live Card Game Platform
        </p>

        <button
          onClick={handleCreateGame}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-red-600 py-3 text-lg font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Game..." : "Create Game"}
        </button>

      </div>
    </main>
  );
}