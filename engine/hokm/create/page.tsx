"use client";

import { useState } from "react";
import { createHokmGame } from "@/services/hokm/createGame";

export default function HokmCreatePage() {
  const [loading, setLoading] = useState(false);

  async function handleCreateGame() {
    try {
      setLoading(true);

      const game = await createHokmGame();

      console.log("Game Created:", game);

      // مرحله بعد اینجا به لابی منتقل می‌شویم
    } catch (error) {
      console.error(error);
      alert("خطا در ساخت بازی");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-700 p-8">

        <h1 className="text-3xl font-bold text-center">
          ANDIVAL HOKM
        </h1>

        <p className="text-center text-neutral-400 mt-2">
          Live Card Game Platform
        </p>

        <button
          onClick={handleCreateGame}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-red-600 py-3 text-lg font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Game"}
        </button>

      </div>
    </main>
  );
}