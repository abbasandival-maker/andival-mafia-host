"use client";

import { use, useEffect, useState } from "react";

import { listenPlayer } from "@/services/listenPlayer";
import { listenGamePlayers } from "@/services/listenGamePlayers";
import { listenGame } from "@/services/listenGame";

import { mafiaVote } from "@/services/mafiaVote";
import { doctorSave } from "@/services/doctorSave";
import { detectiveCheck } from "@/services/detectiveCheck";
import { sniperShoot } from "@/services/sniperShoot";
import { dayVote } from "@/services/dayVote";
import { sendMafiaMessage } from "@/services/sendMafiaMessage";
import { listenMafiaChat } from "@/services/listenMafiaChat";
  
type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

type Player = {
  id: string;
  nickname: string;
  role: string;
  status: string;

  alive: boolean;

  canVote: boolean;
  canUseAbility: boolean;

  sniperResult?: string;
  sniperTarget?: string | null;

  investigationResult?: string;
  investigatedPlayer?: string;
};

export default function PlayPage({ params }: Props) {
  const { gameId } = use(params);

  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const [phase, setPhase] = useState<"night" | "day">("night");
  const [gameStatus, setGameStatus] = useState("");
  const [winner, setWinner] = useState("");

  const [selectedTarget, setSelectedTarget] =
    useState<string | null>(null);

  const [selectedDoctorTarget, setSelectedDoctorTarget] =
    useState<string | null>(null);

  const [selectedDetectiveTarget, setSelectedDetectiveTarget] =
    useState<string | null>(null);

  const [selectedSniperTarget, setSelectedSniperTarget] =
    useState<string | null>(null);

  const [selectedVoteTarget, setSelectedVoteTarget] =
    useState<string | null>(null);
const [chatMessages, setChatMessages] = useState<any[]>([]);
const [chatInput, setChatInput] = useState("");
  // اطلاعات بازیکن
  useEffect(() => {
    const playerId = localStorage.getItem("playerId");
    if (!playerId) return;

    const unsubscribe = listenPlayer(gameId, playerId, (data: Player) => {
      setPlayer(data);
    });

    return () => unsubscribe();
  }, [gameId]);

  // همه بازیکنان
  useEffect(() => {
    const unsubscribe = listenGamePlayers(gameId, (data: Player[]) => {
      setPlayers(data);
    });

    return () => unsubscribe();
  }, [gameId]);

  // وضعیت بازی
  useEffect(() => {
    const unsubscribe = listenGame(gameId, (game) => {
      if (!game) return;

      setPhase(game.phase);
      setGameStatus(game.status ?? "");
      setWinner(game.winner ?? "");
    });

    return () => unsubscribe();
  }, [gameId]);
useEffect(() => {
  if (
    player?.role !== "mafia" &&
    player?.role !== "godfather"
  )
    return;

  const unsubscribe = listenMafiaChat(
    gameId,
    setChatMessages
  );

  return () => unsubscribe();
}, [gameId, player]);async function handleSendMessage() {
  const playerId = localStorage.getItem("playerId");

  if (!playerId || !player) return;

  await sendMafiaMessage(
    gameId,
    playerId,
    player.nickname,
    chatInput
  );

  setChatInput("");
}
useEffect(() => {
  if (
    player?.role !== "mafia" &&
    player?.role !== "godfather"
  ) {
    return;
  }

  const unsubscribe = listenMafiaChat(
    gameId,
    setChatMessages
  );

  return () => unsubscribe();
}, [gameId, player]);
  // -----------------------
  // Mafia
  // -----------------------

  async function handleMafiaVote(targetId: string) {
    const playerId = localStorage.getItem("playerId");

    if (!playerId) return;

    setLoading(true);

    try {
      await mafiaVote(gameId, playerId, targetId);
      alert("Victim Selected");
    } catch (error) {
      console.error(error);
      alert("Failed");
    }

    setLoading(false);
  }

  // -----------------------
  // Doctor
  // -----------------------

  async function handleDoctorSave(targetId: string) {
    const playerId = localStorage.getItem("playerId");

    if (!playerId) return;

    setLoading(true);

    try {
      await doctorSave(gameId, playerId, targetId);
      alert("Player Saved");
    } catch (error) {
      console.error(error);
      alert("Failed");
    }

    setLoading(false);
  }

 // -----------------------
// Detective
// -----------------------

async function handleDetectiveCheck(targetId: string) {
  const playerId = localStorage.getItem("playerId");

  if (!playerId) return;

  setLoading(true);

  try {
    const result = await detectiveCheck(
      gameId,
      playerId,
      targetId
    );

    alert("Investigation Result : " + result);

  } catch (error) {
    console.error(error);
    alert("Failed");
  }

  setLoading(false);
}

// -----------------------
// Sniper
// -----------------------

async function handleSniper(targetId: string | null) {
  const playerId = localStorage.getItem("playerId");

  if (!playerId) return;

  setLoading(true);

  try {
    const result = await sniperShoot(
      gameId,
      playerId,
      targetId
    );

    if (result === "SKIP") {
      alert("You skipped tonight.");
    } else if (result === "HIT") {
      alert("Target Selected.");
    } else {
      alert("Target Selected.");
    }

  } catch (error) {
    console.error(error);
    alert("Failed");
  }

  setLoading(false);
}

// -----------------------
// Day Vote
// -----------------------

async function handleDayVote(targetId: string) {
  const playerId = localStorage.getItem("playerId");

  if (!playerId) return;

  setLoading(true);

  try {
    await dayVote(
      gameId,
      playerId,
      targetId
    );

    alert("Vote Submitted");

  } catch (error) {
    console.error(error);
    alert("Failed");
  }

  setLoading(false);
}

if (gameStatus === "finished") {
  return (
    <main className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-5xl font-black text-yellow-400">
          Game Over
        </h1>

        <p className="mt-8 text-3xl">
          {winner === "mafia"
            ? "☠ Mafia Wins"
            : "🏆 Citizens Win"}
        </p>
      </div>
    </main>
  );
}
if (!player) {
  return (
    <main className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">
      Loading...
    </main>
  );
}

return (
  <main className="min-h-screen bg-[#0B0B0F] text-white flex items-center justify-center p-6">

    <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-8">

      <p className="text-gray-400">
        Room
      </p>

      <h1 className="text-3xl font-black text-yellow-400">
        {gameId}
      </h1>

      <div className="mt-8">

        <p className="text-gray-400">
          Player
        </p>

        <h2 className="text-2xl font-bold">
          {player.nickname}
        </h2>

      </div>

      <div className="mt-8 rounded-xl bg-black border border-yellow-500 p-6">

        <p className="text-gray-400">
          Your Role
        </p>

        <h2 className="mt-3 text-4xl font-black text-yellow-400">
          {player.role.toUpperCase()}
        </h2>

      </div>
      
        {/* ========================= */}
        {/* MAFIA */}
        {/* ========================= */}
{phase === "night" &&
  player.alive &&
  (player.role === "godfather" || player.role === "mafia") &&
  player.canUseAbility && (
    <div className="mt-8 rounded-xl bg-red-950 border border-red-700 p-6">
      <h3 className="text-2xl font-bold text-red-400">
        ☠ Mafia
      </h3>

      {/* Mafia Team */}
      <div className="mt-4 rounded-lg bg-black/30 p-4">
        <p className="mb-2 font-bold text-red-300">
          Mafia Team
        </p>

        {players
          .filter(
            (p) =>
              (p.role === "mafia" ||
                p.role === "godfather") &&
              p.id !== player.id &&
              p.alive
          )
          .map((m) => (
            <p
              key={m.id}
              className="text-gray-300"
            >
              • {m.nickname}
            </p>
          ))}
      </div>

      {/* Mafia Chat */}
      <div className="mt-6 rounded-xl bg-black/40 p-4">
        <h3 className="mb-3 font-bold text-red-400">
          💬 Mafia Chat
        </h3>

        <div className="h-48 overflow-y-auto rounded-lg bg-zinc-900 p-3 space-y-2">
          {chatMessages.map((msg) => (
            <div key={msg.id}>
              <span className="font-bold text-red-400">
                {msg.senderName}
              </span>

              <span className="ml-2 text-gray-300">
                {msg.message}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) =>
              setChatInput(e.target.value)
            }
            placeholder="Message..."
            className="flex-1 rounded-lg bg-zinc-800 p-3"
          />

          <button
            onClick={handleSendMessage}
            className="rounded-lg bg-red-600 px-5"
          >
            Send
          </button>
        </div>
      </div>

      {/* Godfather Only */}
      {player.role === "godfather" && (
        <>
          <h3 className="mt-6 mb-4 text-xl font-bold text-red-400">
            🎯 Select Victim
          </h3>

          <div className="space-y-3">
            {players
              .filter(
                (p) =>
                  p.id !== player.id &&
                  p.role !== "mafia" &&
                  p.role !== "godfather" &&
                  p.alive
              )
              .map((target) => (
                <button
                  key={target.id}
                  onClick={() =>
                    setSelectedTarget(target.id)
                  }
                  disabled={loading}
                  className={`w-full rounded-xl p-4 text-left transition ${
                    selectedTarget === target.id
                      ? "border-2 border-red-400 bg-red-700"
                      : "bg-zinc-800 hover:bg-red-700"
                  }`}
                >
                  {target.nickname}
                </button>
              ))}
          </div>

          <button
            disabled={
              !selectedTarget || loading
            }
            onClick={() =>
              handleMafiaVote(selectedTarget!)
            }
            className="mt-6 w-full rounded-xl bg-red-600 py-4 text-lg font-bold hover:bg-red-500 disabled:opacity-40"
          >
            🔴 Confirm Kill
          </button>
        </>
      )}
    </div>
)}

{phase === "night" &&
  player.alive &&
  player.role === "godfather" &&
  !player.canUseAbility && (
    <div className="mt-8 rounded-xl border border-green-700 bg-zinc-800 p-6">
      <h3 className="text-3xl font-black text-red-400">
        ☠ MAFIA
      </h3>

      <div className="mt-6 rounded-xl border border-green-700 bg-green-900 p-5">
        <h3 className="text-xl font-bold">
          ✅ Kill Submitted
        </h3>

        <p className="mt-2 text-gray-300">
          Waiting for the night to end...
        </p>
      </div>
    </div>
)}
        {/* ========================= */}
        {/* DOCTOR */}
        {/* ========================= */}

       {phase === "night" &&
 player.role === "doctor" &&
 player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-blue-950 border border-blue-700 p-6">

    <h3 className="text-2xl font-bold text-blue-400 mb-5">
      🩺 Choose Someone To Save
    </h3>

    <div className="space-y-3">

      {players
        .filter((p) => p.alive)
        .map((target) => (

          <button
            key={target.id}
            onClick={() => setSelectedDoctorTarget(target.id)}
            disabled={loading}
            className={`w-full rounded-xl transition p-4 text-left ${
              selectedDoctorTarget === target.id
                ? "bg-blue-700 border-2 border-blue-400"
                : "bg-zinc-800 hover:bg-blue-700"
            }`}
          >
            {target.nickname}
          </button>

        ))}

    </div>

    <button
      disabled={!selectedDoctorTarget || loading}
      onClick={() => handleDoctorSave(selectedDoctorTarget!)}
      className="w-full mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-4 font-bold text-lg"
    >
      🩺 Confirm Save
    </button>

  </div>

)}

{phase === "night" &&
 player.role === "doctor" &&
 !player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-blue-950 border border-blue-700 p-6">

    <h3 className="text-3xl font-black text-blue-400">
      🩺 DOCTOR
    </h3>

    <div className="mt-6 rounded-xl bg-green-900 border border-green-700 p-5">

      <h3 className="text-xl font-bold">
        ✅ Protection Submitted
      </h3>

      <p className="mt-2 text-gray-300">
        Waiting for the end of the night...
      </p>

    </div>

  </div>

)}

        {/* ========================= */}
        {/* DETECTIVE */}
        {/* ========================= */}

      {phase === "night" &&
 player.role === "detective" &&
 player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-indigo-950 border border-indigo-700 p-6">

    <h3 className="text-2xl font-bold text-indigo-400 mb-5">
      🔎 Investigate Player
    </h3>

    <div className="space-y-3">

      {players
        .filter(
          (p) =>
            p.id !== player.id &&
            p.alive
        )
        .map((target) => (

          <button
            key={target.id}
            onClick={() => setSelectedDetectiveTarget(target.id)}
            disabled={loading}
            className={`w-full rounded-xl transition p-4 text-left ${
              selectedDetectiveTarget === target.id
                ? "bg-indigo-700 border-2 border-indigo-400"
                : "bg-zinc-800 hover:bg-indigo-700"
            }`}
          >
            {target.nickname}
          </button>

        ))}

    </div>

    <button
      disabled={!selectedDetectiveTarget || loading}
      onClick={() => handleDetectiveCheck(selectedDetectiveTarget!)}
      className="w-full mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 py-4 font-bold text-lg"
    >
      🔎 Confirm Check
    </button>

  </div>

)}

{phase === "night" &&
 player.role === "detective" &&
 !player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-indigo-950 border border-indigo-700 p-6">

    <h3 className="text-3xl font-black text-indigo-400">
      🔎 DETECTIVE
    </h3>

    <div className="mt-6 rounded-xl bg-green-900 border border-green-700 p-5">

      <h3 className="text-xl font-bold">
        ✅ Investigation Submitted
      </h3>

      <p className="mt-4 text-3xl font-black text-yellow-400">
        {player.investigationResult}
      </p>

      <p className="mt-3 text-gray-300">
        Waiting for the end of the night...
      </p>

    </div>

  </div>

)}
{/* ========================= */}
{/* SNIPER */}
{/* ========================= */}

{phase === "night" &&
 player.role === "sniper" &&
 player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-orange-950 border border-orange-700 p-6">

    <h3 className="text-2xl font-bold text-orange-400 mb-5">
      🎯 Choose Target
    </h3>

    <div className="space-y-3">

      {players
        .filter(
          (p) =>
            p.id !== player.id &&
            p.alive
        )
        .map((target) => (

          <button
            key={target.id}
            onClick={() => setSelectedSniperTarget(target.id)}
            disabled={loading}
            className={`w-full rounded-xl transition p-4 text-left ${
              selectedSniperTarget === target.id
                ? "bg-orange-700 border-2 border-orange-400"
                : "bg-zinc-800 hover:bg-orange-700"
            }`}
          >
            {target.nickname}
          </button>

        ))}

      <button
        disabled={!selectedSniperTarget || loading}
        onClick={() => handleSniper(selectedSniperTarget!)}
        className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 transition p-4 mt-4 font-bold"
      >
        🎯 Confirm Shoot
      </button>

      <button
        onClick={() => handleSniper(null)}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-700 hover:bg-zinc-600 transition p-4 mt-2 font-bold"
      >
        ⏭ Skip Tonight
      </button>

    </div>

  </div>

)}

{phase === "night" &&
 player.role === "sniper" &&
 !player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-orange-950 border border-orange-700 p-6">

    <h3 className="text-3xl font-black text-orange-400">
      🎯 SNIPER
    </h3>

    <div className="mt-6 rounded-xl bg-green-900 border border-green-700 p-5">

      <h3 className="text-xl font-bold">
        ✅ Action Submitted
      </h3>

      <p className="mt-2 text-gray-300">
        Waiting for the end of the night...
      </p>

    </div>

  </div>

)}
        {/* ========================= */}
        {/* OTHER ROLES */}
        {/* ========================= */}
{phase === "night" &&
player.role !== "mafia" &&
player.role !== "godfather" &&
player.role !== "doctor" &&
player.role !== "detective" &&
player.role !== "sniper" && (

  <div className="mt-8 rounded-xl bg-zinc-800 p-5">

    <h3 className="font-bold">
      🌙 Night Phase
    </h3>

    <p className="mt-2 text-gray-400">
      Waiting for your turn...
    </p>

  </div>

)}

{phase === "day" &&
 player.alive &&
 player.canVote && (

  <div className="mt-8 rounded-xl bg-zinc-800 p-5">

    <h3 className="font-bold text-xl mb-4">
      ☀️ Day Voting
    </h3>

    <div className="space-y-3">

      {players
        .filter(
          (p) =>
            p.id !== player.id &&
            p.alive
        )
        .map((target) => (

          <button
            key={target.id}
            disabled={loading}
            onClick={() =>
              setSelectedVoteTarget(target.id)
            }
            className={`w-full rounded-lg py-3 font-bold transition ${
              selectedVoteTarget === target.id
                ? "bg-red-700 border-2 border-red-400"
                : "bg-zinc-700 hover:bg-red-600"
            }`}
          >
            {target.nickname}
          </button>

        ))}

    </div>

    <button
      disabled={!selectedVoteTarget || loading}
      onClick={() =>
        handleDayVote(selectedVoteTarget!)
      }
      className="w-full mt-6 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 py-4 font-bold"
    >
      🗳 Confirm Vote
    </button>

  </div>

)}

{phase === "day" &&
  player.alive &&
  !player.canVote && (
    <div className="mt-8 rounded-xl border border-green-700 bg-zinc-800 p-6">
      <h3 className="text-3xl font-black text-yellow-400">
        ☀️ DAY
      </h3>

      <div className="mt-6 rounded-xl border border-green-700 bg-green-900 p-5">
        <h3 className="text-xl font-bold">
          ✅ Vote Submitted
        </h3>

        <p className="mt-2 text-gray-300">
          Waiting for other players...
        </p>
      </div>
    </div>
    
)}