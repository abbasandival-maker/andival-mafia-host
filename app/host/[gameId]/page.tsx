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
import {
  listenMafiaChat,
  MafiaMessage,
} from "@/services/listenMafiaChat";
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
const [phase, setPhase] = useState("");
const [dayVotingOpen, setDayVotingOpen] = useState(false);
const [voteResults, setVoteResults] = useState<

  {
    playerId: string;
    votes: number;
    voters: string[];
  }[]
>([]);

const [selectedElimination, setSelectedElimination] =
  useState<string | null>(null);
  const [mafiaMessages, setMafiaMessages] = useState<MafiaMessage[]>([]);
  useEffect(() => {
    const unsubscribe = listenPlayers(gameId, (data) => {
      setPlayers(data as Player[]);
    });

    return () => unsubscribe();
  }, [gameId]);
useEffect(() => {
  const unsubscribe = listenGame(gameId, (game) => {
    if (!game) return;

    setGameStatus(game.status ?? "");
    setPhase(game.phase ?? "");
    setDayVotingOpen(game.dayVotingOpen ?? false);
});

  return () => unsubscribe();
}, [gameId]);
useEffect(() => {
  const unsubscribe = listenMafiaChat(
    gameId,
    (messages) => {
      setMafiaMessages(messages);
    }
  );

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
<div className="mt-8 mb-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-6 shadow-2xl">

  <h1 className="text-4xl font-black text-cyan-400 tracking-wider">
    🎮 ANDIVAL COMMAND CENTER
  </h1>

  <div className="mt-5 flex flex-wrap gap-6">

    <div>
      <p className="text-xs text-zinc-500">ROOM</p>
      <p className="text-2xl font-black text-yellow-400">{gameId}</p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">PLAYERS</p>
      <p className="text-2xl font-black text-green-400">{players.length}</p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">STATUS</p>
      <p className="text-2xl font-black text-cyan-400">
        {phase.toUpperCase()}
      </p>
    </div>

  </div>

       
<div className="mt-4">

  {phase === "day" && (
    <div className="rounded-lg bg-yellow-900 px-4 py-2 font-bold text-yellow-300">
      ☀️ DAY
    </div>
  )}

  {true && (
    <div className="rounded-lg bg-indigo-900 px-4 py-2 font-bold text-indigo-300">
      🌙 NIGHT
    </div>
  )}

</div>
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

        <div className="mt-10 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl">

          <div className="border-b border-zinc-700 p-5">

            <h3 className="text-xl font-bold">
              👥 LIVE OPERATORS
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
                className="flex items-center justify-between border-b border-zinc-800 p-5 transition-all duration-300 hover:bg-zinc-800/60"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 font-black text-black shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-110">

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

  {gameStatus !== "finished" && (
    <button
      onClick={async () => {

  if (
    !confirm(`Remove ${player.nickname} from the game?`)
  ) {
    return;
  }

  try {

    await removePlayer(gameId, player.id);

  } catch (error) {

    console.error(error);

    alert("Failed to remove player.");

  }

}}
      className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/40"
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

        <div className="mt-8 grid gap-4 md:grid-cols-2">

   <Button
  onClick={handleStartGame}
  disabled={players.length < 6 || loading}
>
  <Play size={18} />
  {loading ? "Starting..." : "▶ Start Game"}
</Button>

{true && (

<Button
    onClick={handleFinishNight}
    disabled={loading}
>

    <Moon size={18} />

    {loading ? "Processing..." : "🌙 Finish Night"}

</Button>

)}

{true && (


<Button
  onClick={handleOpenDayVoting}
  disabled={loading}
>
  🗳 Open Day Voting
</Button>

)}

{true && (

  <Button
    onClick={handleFinishVoting}
    disabled={loading}
  >
    ✅ Finish Voting
  </Button>

)}

{true && (

  <Button
    onClick={handleFinishDay}
    disabled={loading}
  >
    ☀️ Finish Day
  </Button>

)}

{players.length < 6 && (
  <p className="text-sm text-gray-500">
    At least 6 players are required to start the game.
  </p>
)}

{voteResults.length > 0 && (

  <div className="mt-10 rounded-2xl border border-yellow-500/40 bg-gradient-to-b from-zinc-950 to-zinc-900 p-6 shadow-2xl">

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
            className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-yellow-500 hover:bg-zinc-700"
          >
            <span className="font-bold">
              {player?.nickname ?? result.playerId}
            </span>

            <button
  onClick={() =>
    alert(
      `Votes for ${player?.nickname}\n\n${result.voters.join("\n")}`
    )
  }
  className="rounded-lg bg-red-900 px-3 py-2 font-black text-red-300 transition-all duration-300 hover:scale-105 hover:bg-red-700"
>
  {result.votes} Votes 👁
</button>
          </div>
        );
      })}

    </div>

   {selectedElimination && (

  <div className="mt-8 rounded-xl border border-yellow-600 bg-yellow-950 p-5">

    <p className="text-gray-400">
      Selected Player
    </p>

    <h3 className="text-3xl font-black text-yellow-400">
      {
        players.find(
          (p) => p.id === selectedElimination
        )?.nickname
      }
    </h3>

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

  </div>

    )}

  </div>

)}
      </div> {/* mt-8 space-y-4 */}
<div className="mt-10 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-zinc-950 to-black p-6 shadow-2xl">

  <h2 className="text-2xl font-black text-cyan-400 tracking-widest">
    ⚡ SYSTEM STATUS
  </h2>

  <div className="mt-6 grid grid-cols-2 gap-6">

    <div>
      <p className="text-xs text-zinc-500">GAME STATUS</p>
      <p className="text-xl font-black text-green-400">
        {gameStatus.toUpperCase()}
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">PHASE</p>
      <p className="text-xl font-black text-yellow-400">
        {phase.toUpperCase()}
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">PLAYERS</p>
      <p className="text-xl font-black text-cyan-400">
        {players.length}
      </p>
    </div>

    <div>
      <p className="text-xs text-zinc-500">SERVER</p>
      <p className="text-xl font-black text-red-400">
        ● ONLINE
      </p>
    </div>

  </div>

</div>
<div className="mt-10 rounded-2xl border border-red-500/20 bg-gradient-to-b from-black to-zinc-950 p-6 shadow-2xl">

  <div className="mb-6 flex items-center justify-between">

    <h2 className="text-2xl font-black tracking-widest text-red-400">
      💬 MAFIA CHANNEL
    </h2>

    <span className="rounded-full bg-red-900 px-3 py-1 text-xs font-bold text-red-300">
      🔴 LIVE
    </span>

  </div>

  {mafiaMessages.length === 0 ? (

    <p className="text-zinc-500">
      No mafia messages...
    </p>

  ) : (

    <div className="space-y-3">

      {mafiaMessages.map((msg) => (

        <div
          key={msg.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >

          <p className="font-bold text-red-400">
            {msg.senderName}
          </p>

          <p className="mt-2 text-zinc-200">
            {msg.message}
          </p>

        </div>

      ))}

    </div>

 )}

</div> {/* Mafia Channel */}


</main>
);
}