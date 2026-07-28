"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Shield } from "lucide-react";

import { createGame } from "@/services/gameService";

export default function CreateGamePage() {
  const router = useRouter();

  const [roomName, setRoomName] = useState("");
  const [players, setPlayers] = useState(10);
  const [loading, setLoading] = useState(false);

  async function handleCreateGame() {
    console.log("STEP 1");

    if (!roomName.trim()) {
      alert("Please enter room name");
      return;
    }

    setLoading(true);

    try {
      console.log("STEP 2");

      const gameId = await createGame(roomName);

      console.log("STEP 3", gameId);

      alert("Game Created!\n\nRoom ID: " + gameId);

      console.log("STEP 4");

      router.push(`/host/${gameId}`);

      console.log("STEP 5");
    } catch (error) {
      console.error("CREATE GAME ERROR:", error);

      alert(
        "ERROR:\n\n" +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-6">
      <div className="mx-auto max-w-md">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400 mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        <h1 className="text-3xl font-black">
          Create Game
        </h1>

        <p className="text-gray-400 mt-2 mb-8">
          Create a new Mafia Room
        </p>

        <div className="space-y-6">

          <div>
            <label className="block mb-2">
              Room Name
            </label>

            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Example: TikTok Live"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-4"
            />
          </div>

          <div>
            <label className="block mb-2">
              Max Players
            </label>

            <div className="flex items-center gap-3">
              <Users />

              <input
                type="range"
                min={5}
                max={20}
                value={players}
                onChange={(e) => setPlayers(Number(e.target.value))}
                className="w-full"
              />

              <span>{players}</span>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4">
            <div className="flex items-center gap-2">
              <Shield className="text-yellow-400" />
              <span>Classic Mafia</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateGame}
            disabled={loading}
            className="w-full rounded-xl bg-yellow-500 py-4 text-lg font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Creating..." : "TEST CREATE ROOM"}
          </button>

        </div>

      </div>
    </main>
  );
}