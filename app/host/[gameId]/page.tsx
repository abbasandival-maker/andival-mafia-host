"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Play, Moon } from "lucide-react";

import Button from "@/components/ui/Button";
import { listenPlayers } from "@/services/listenPlayers";
import { startGame } from "@/services/startGame";
import { resolveNight } from "@/services/resolveNight";
import { resolveDay } from "@/services/resolveDay";
import { removePlayer } from "@/services/removePlayer";
import { listenGame } from "@/services/listenGame";
import { openDayVoting } from "@/services/openDayVoting";
import { countDayVotes } from "@/services/countDayVotes";
import { finishDay } from "@/services/finishDay";

type Player = {
  id: string;
  nickname: string;
  status: string;
  role?: string;
  alive?: boolean;
};

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

export default function HostPage({ params }: Props) {
  const { gameId } = use(params);

const [players, setPlayers] = useState<Player[]>([]);
const [loading, setLoading] = useState(false);
const [gameStatus, setGameStatus] = useState("waiting");
const [voteResults, setVoteResults] = useState<
  { playerId: string; votes: number }[]
>([]);

const [selectedElimination, setSelectedElimination] =
  useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = listenPlayers(gameId, (data) => {
      setPlayers(data as Player[]);
    });

    return () => unsubscribe();
  }, [gameId]);
useEffect(() => {
  const unsubscribe = listenGame(gameId, (game) => {
    if (game?.status) {
      setGameStatus(game.status);
    }
  });

  return () => unsubscribe();
}, [gameId]);
  // ============================
  // Start Game
  // ============================

  async function handleStartGame() {
    if (players.length < 6) {
      alert("Minimum 6 players required.");
      return;
    }

    setLoading(true);

    try {
      await startGame(gameId);

      alert("Game Started Successfully!");

      console.log("GAME STARTED");

    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Failed to start game.");
      }

    } finally {
      setLoading(false);
    }
  }

  // ============================
  // Finish Night
  // ============================

  // ============================
// Finish Night
// ============================

async function handleFinishNight() {
  setLoading(true);

  try {
    await resolveNight(gameId);

    alert("Night Finished Successfully!");

    console.log("NIGHT FINISHED");

  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("Failed to finish night.");
    }

  } finally {
    setLoading(false);
  }
}

// ============================
// Open Day Voting
// ============================

async function handleOpenDayVoting() {
  setLoading(true);

  try {
    await openDayVoting(gameId);

    alert("Day Voting Opened");

  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("Failed to open day voting.");
    }

  } finally {
    setLoading(false);
  }
}

// ============================
// Finish Voting
// ============================

async function handleFinishVoting() {
  setLoading(true);

  try {
    const results = await countDayVotes(gameId);

    setVoteResults(results);

    if (results.length > 0) {
      setSelectedElimination(results[0].playerId);
      alert("Voting results are ready.");
    } else {
      setSelectedElimination(null);
      alert("No votes were submitted.");
    }

  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("Failed to count votes.");
    }

  } finally {
    setLoading(false);
  }
}

// ============================
// Finish Day
// ============================

async function handleFinishDay() {
  setLoading(true);

  try {
    await resolveDay(gameId);

    alert("Day Finished");

  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("Failed");
    }

  } finally {
    setLoading(false);
  }
}
async function handleEliminatePlayer() {

  if (!selectedElimination) return;

  setLoading(true);

  try {

    await finishDay(
      gameId,
      selectedElimination
    );

    setVoteResults([]);
    setSelectedElimination(null);

  } catch (error) {

    console.error(error);
    alert("Failed to finish day.");

  } finally {

    setLoading(false);

  }

}

async function handleNoElimination() {

  setLoading(true);

  try {

    await finishDay(
      gameId,
      null
    );

    setVoteResults([]);
    setSelectedElimination(null);

  } catch (error) {

    console.error(error);
    alert("Failed to finish day.");

  } finally {

    setLoading(false);

  }

}
  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-6">

      <div className="mx-auto max-w-5xl">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20} />
          Home
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">

          <div>

            <h1 className="text-4xl font-black">
              Host Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Room Code
            </p>

            <h2 className="text-3xl font-bold text-yellow-400">
              {gameId}
            </h2>

          </div>

          <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4">

            <div className="flex items-center gap-3">

              <Users size={28} />

              <div>

                <p className="text-sm text-gray-400">
                  Players
                </p>

                <p className="text-2xl font-bold">
                  {players.length}
                </p>

              </div>

            </div>

          </div>

        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">

          <div className="border-b border-zinc-700 p-5">

            <h3 className="text-xl font-bold">
              Connected Players
            </h3>

          </div>

          {players.length === 0 ? (

            <div className="p-8 text-center text-gray-500">
              Waiting for players...
            </div>
    

          ) : (

            players.map((player) => (

              <div
                key={player.id}
                className="flex items-center justify-between border-b border-zinc-800 p-4 last:border-b-0"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-bold text-black">

                    {player.nickname?.charAt(0).toUpperCase()}

                  </div>

                 <div>
  <p className="font-semibold text-lg">
    {player.nickname}
  </p>

  <div className="mt-1">

    {player.role === "godfather" && (
      <span className="text-red-500 font-bold">
        ☠ Mafia
      </span>
    )}

    {player.role === "doctor" && (
      <span className="text-blue-400 font-bold">
        🩺 Doctor
      </span>
    )}

    {player.role === "detective" && (
      <span className="text-indigo-400 font-bold">
        🔎 Detective
      </span>
    )}

    {player.role === "sniper" && (
      <span className="text-orange-400 font-bold">
        🎯 Sniper
      </span>
    )}

    {player.role === "citizen" && (
      <span className="text-gray-300 font-bold">
        👤 Citizen
      </span>
    )}

    {!player.role && (
      <span className="text-gray-500">
        Waiting...
      </span>
    )}

  </div>
</div>

                </div>

                <div>

             <div className="flex items-center gap-3">

  {player.alive === false ? (
    <span className="rounded-full bg-red-900 px-3 py-1 text-red-300 font-bold">
      💀 DEAD
    </span>
  ) : (
    <span className="rounded-full bg-green-900 px-3 py-1 text-green-300 font-bold">
      🟢 ALIVE
    </span>
  )}

  {gameStatus === "waiting" && (
    <button
      onClick={async () => {
        if (!confirm(`Remove ${player.nickname}?`)) return;

        await removePlayer(gameId, player.id);
      }}
      className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 transition"
    >
      🗑 Remove
    </button>
  )}

</div>


</div>

                </div>

        

            ))

          )}

        </div>

        <div className="mt-8 space-y-4">

   <Button
  onClick={handleStartGame}
  disabled={players.length < 6 || loading}
>
  <Play size={18} />
  {loading ? "Starting..." : "▶ Start Game"}
</Button>

<Button
  onClick={handleFinishNight}
  disabled={loading}
>
  <Moon size={18} />
  {loading ? "Processing..." : "🌙 Finish Night"}
</Button>

<Button
  onClick={handleOpenDayVoting}
  disabled={loading}
>
  🗳 Open Day Voting
</Button>

<Button
  onClick={handleFinishVoting}
  disabled={loading}
>
  ✅ Finish Voting
</Button>

<Button
  onClick={handleFinishDay}
  disabled={loading}
>
  ☀️ Finish Day
</Button>

{players.length < 6 && (
  <p className="text-sm text-gray-500">
    At least 6 players are required to start the game.
  </p>
)}
{players.length < 6 && (
  <p className="text-sm text-gray-500">
    At least 6 players are required to start the game.
  </p>
)}
{voteResults.length > 0 && (

  <div className="mt-10 rounded-xl border border-yellow-600 bg-zinc-900 p-6">

    <h2 className="text-2xl font-black text-yellow-400 mb-6">
      🗳 Voting Results
    </h2>

    <div className="space-y-3">

      {voteResults.map((result) => {

        const player = players.find(
          (p) => p.id === result.playerId
        );

        return (
          <div
            key={result.playerId}
            className="flex items-center justify-between rounded-lg bg-zinc-800 p-4"
          >
            <span className="font-bold">
              {player?.nickname ?? result.playerId}
            </span>

            <span className="text-red-400 font-black">
              {result.votes} Votes
            </span>
          </div>
        );
      })}

    </div>

    {selectedElimination && (

      <div className="mt-8 rounded-xl bg-yellow-950 border border-yellow-600 p-5">

        <p className="text-gray-400">
          Selected Player
        </p>

        <h3 className="text-3xl font-black text-yellow-400">

          {
            players.find(
              (p) => p.id === selectedElimination
            )?.nickname
          }
<div className="mt-8 flex gap-4">

  <button
    onClick={handleEliminatePlayer}
    className="flex-1 rounded-lg bg-red-600 py-3 font-bold hover:bg-red-700"
  >
    🗑 Eliminate
  </button>

  <button
    onClick={handleNoElimination}
    className="flex-1 rounded-lg bg-gray-700 py-3 font-bold hover:bg-gray-600"
  >
    ❌ No Elimination
  </button>

</div>
        </h3>

      </div>

    )}

  </div>

)}
      </div> {/* mt-8 space-y-4 */}

    </div> {/* این div مربوط به mx-auto max-w-5xl است */}

  </main>
);
}