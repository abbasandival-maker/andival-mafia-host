"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Button from "@/components/ui/Button";
import { joinGame } from "@/services/joinGame";

export default function JoinPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!nickname.trim()) {
      alert("Please enter your nickname.");
      return;
    }

    if (!gameId.trim()) {
      alert("Please enter the room code.");
      return;
    }

    try {
      setLoading(true);

      const playerId = await joinGame(
        gameId.toUpperCase(),
        nickname.trim()
      );

      localStorage.setItem("playerId", playerId);

      router.push(`/play/${gameId.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      alert("Failed to join the game.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400 mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        <h1 className="text-4xl font-black">
          Join Game
        </h1>

        <p className="text-gray-400 mt-2 mb-8">
          Enter your nickname and room code.
        </p>

        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your Nickname"
          className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-4 mb-4"
        />

        <input
          value={gameId}
          onChange={(e) => setGameId(e.target.value.toUpperCase())}
          placeholder="Room Code"
          className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-4 mb-6 uppercase"
        />

        <Button
          onClick={handleJoin}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join Room"}
        </Button>
      </div>
    </main>
  );
}