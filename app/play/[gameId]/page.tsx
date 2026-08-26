"use client";

import { use, useEffect, useState } from "react";

import { listenPlayer } from "@/services/listenPlayer";
import { listenGamePlayers } from "@/services/listenGamePlayers";
import { listenGame } from "@/services/listenGame";

import { mafiaVote } from "@/services/mafiaVote";
import { doctorSave } from "@/services/doctorSave";
import { detectiveCheck } from "@/services/detectiveCheck";
import { sniperShoot } from "@/services/sniperShoot";
import { dayVote, secondVote, type SecondVoteChoice } from "@/services/dayVote";
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

  secondVoteChoice?: SecondVoteChoice | null;
};

export default function PlayPage({ params }: Props) {
  const { gameId } = use(params);

  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const [phase, setPhase] = useState<"night" | "day" | "second_vote">("night");
  const [gameStatus, setGameStatus] = useState("");
  const [winner, setWinner] = useState("");
const [dayVotingOpen, setDayVotingOpen] = useState(false);
  const [secondVoteTargetId, setSecondVoteTargetId] = useState<string | null>(null);
  const [secondVoteSubmitted, setSecondVoteSubmitted] = useState(false);
  const [selectedSecondVote, setSelectedSecondVote] =
    useState<SecondVoteChoice | null>(null);

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
setDayVotingOpen(game.dayVotingOpen ?? false);
      setSecondVoteTargetId(game.secondVoteTargetId ?? null);

      if (game.phase !== "second_vote") {
        setSecondVoteSubmitted(false);
        setSelectedSecondVote(null);
      }
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

async function handleSecondVote(choice: SecondVoteChoice) {
  const playerId = localStorage.getItem("playerId");

  if (!playerId || !player) return;
  if (!player.alive) { alert("Dead players cannot vote."); return; }
  if (secondVoteSubmitted || loading) return;

  setLoading(true);
  try {
    await secondVote(gameId, playerId, choice);
    setSelectedSecondVote(choice);
    setSecondVoteSubmitted(true);
    alert(choice === "YES" ? "YES vote submitted" : "NO vote submitted");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    if (message === "SECOND_VOTE_ALREADY_USED") {
      setSecondVoteSubmitted(true);
      alert("You have already voted.");
    } else if (message === "DEAD_PLAYER_CANNOT_VOTE") {
      alert("Dead players cannot vote.");
    } else if (message === "SECOND_VOTE_NOT_OPEN") {
      alert("Second vote is not open.");
    } else {
      alert("Failed to submit vote.");
    }
  } finally {
    setLoading(false);
  }
}

const secondVoteTarget =
  players.find((p) => p.id === secondVoteTargetId) ?? null;

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
const isNight = phase === "night";
return (
  <main
  className={`min-h-screen flex items-center justify-center p-6 transition-all duration-700

${
isNight
? "bg-gradient-to-b from-black via-zinc-900 to-slate-950 text-white"
: "bg-gradient-to-b from-sky-100 via-white to-yellow-50 text-zinc-900"
}

`}
>

    <div
className={`w-full max-w-lg rounded-2xl p-8 border transition-all duration-700

${
isNight
? "bg-zinc-900 border-zinc-700"
: "bg-white border-slate-300 shadow-2xl"
}

`}
>

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

  onKeyDown={async (e) => {

    if (e.key !== "Enter") return;

    e.preventDefault();

    if (!chatInput.trim()) return;

    await handleSendMessage();

  }}

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
                  className={`group w-full rounded-xl p-4 text-left transition-all duration-200 transform

${
selectedTarget === target.id
? "border-2 border-red-400 bg-red-700 scale-105 shadow-lg shadow-red-600/50"
: "bg-zinc-800 hover:bg-red-700 hover:scale-105 hover:shadow-lg hover:shadow-red-600/40"
}
`}
                >
                  <div className="flex items-center justify-between">

  <span>

    {(selectedTarget === target.id) && "🔫 "}

    {target.nickname}

  </span>

  {selectedTarget === target.id && (

    <span className="text-2xl">
      ✅
    </span>

  )}

</div>
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
            className={`group w-full rounded-xl transition-all duration-200 transform p-4 text-left

${
selectedDoctorTarget === target.id
? "bg-blue-700 border-2 border-blue-400 scale-105 shadow-lg shadow-blue-500/50"
: "bg-zinc-800 hover:bg-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/40"
}
`}
          >
            <div className="flex items-center justify-between">

  <span>

    {selectedDoctorTarget === target.id && "🩺 "}

    {target.nickname}

  </span>

  {selectedDoctorTarget === target.id && (

    <span className="text-2xl">
      ✅
    </span>

  )}

</div>
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
            className={`group w-full rounded-xl transition-all duration-200 transform p-4 text-left

${
selectedDetectiveTarget === target.id
? "bg-indigo-700 border-2 border-indigo-400 scale-105 shadow-lg shadow-indigo-500/50"
: "bg-zinc-800 hover:bg-indigo-700 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/40"
}
`}
          >
            <div className="flex items-center justify-between">

  <span>

    {selectedDetectiveTarget === target.id && "🔎 "}

    {target.nickname}

  </span>

  {selectedDetectiveTarget === target.id && (

    <span className="text-2xl">
      ✅
    </span>

  )}

</div>
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
            className={`group w-full rounded-xl transition-all duration-200 transform p-4 text-left

${
selectedSniperTarget === target.id
? "bg-orange-700 border-2 border-orange-400 scale-105 shadow-lg shadow-orange-500/50"
: "bg-zinc-800 hover:bg-orange-700 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40"
}
`}
          >
            <div className="flex items-center justify-between">

  <span>

    {selectedSniperTarget === target.id && "🎯 "}

    {target.nickname}

  </span>

  {selectedSniperTarget === target.id && (

    <span className="text-2xl">
      ✅
    </span>

  )}

</div>
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

{/* ========================= */}
{/* SECOND VOTE - YES / NO */}
{/* ========================= */}
{phase === "second_vote" && player.alive && secondVoteTarget && (
  <div className="mt-8 rounded-2xl border border-yellow-500 bg-zinc-950 p-6 shadow-2xl">
    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">Second Vote</p>
      <h3 className="mt-3 text-2xl font-black">Final vote for</h3>
      <p className="mt-2 text-4xl font-black text-yellow-400">{secondVoteTarget.nickname}</p>
      <p className="mt-4 text-zinc-400">Do you vote to eliminate this player?</p>
    </div>
    {!secondVoteSubmitted ? (
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button disabled={loading} onClick={() => handleSecondVote("YES")} className="rounded-2xl border-2 border-green-700 bg-green-950 p-6 text-2xl font-black text-green-300 transition-all hover:scale-[1.02] hover:bg-green-900 disabled:opacity-40">YES<span className="mt-2 block text-sm font-medium">Eliminate</span></button>
        <button disabled={loading} onClick={() => handleSecondVote("NO")} className="rounded-2xl border-2 border-red-700 bg-red-950 p-6 text-2xl font-black text-red-300 transition-all hover:scale-[1.02] hover:bg-red-900 disabled:opacity-40">NO<span className="mt-2 block text-sm font-medium">Keep in game</span></button>
      </div>
    ) : (
      <div className="mt-8 rounded-xl border border-green-700 bg-green-950/60 p-5 text-center">
        <h4 className="text-xl font-black text-green-300">✓ Vote Submitted</h4>
        <p className="mt-2 text-zinc-300">Your vote: <span className="font-black text-white">{selectedSecondVote ?? "SUBMITTED"}</span></p>
        <p className="mt-2 text-sm text-zinc-400">Waiting for the host's final decision...</p>
      </div>
    )}
  </div>
)}

{phase === "second_vote" && !player.alive && (
  <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center">
    <h3 className="text-xl font-bold">You are eliminated</h3>
    <p className="mt-2 text-zinc-400">Dead players cannot participate in the second vote.</p>
  </div>
)}

{phase === "day" &&
 dayVotingOpen &&
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
            className={`group w-full rounded-xl p-4 text-left transition-all duration-200 transform

${
selectedVoteTarget === target.id
? "bg-red-700 border-2 border-red-400 scale-105 shadow-lg shadow-red-500/50"
: "bg-zinc-700 hover:bg-red-600 hover:scale-105 hover:shadow-lg hover:shadow-red-500/40"
}
`}
          >
            <div className="flex items-center justify-between">

  <span>

    {selectedVoteTarget === target.id && "🗳️ "}

    {target.nickname}

  </span>

  {selectedVoteTarget === target.id && (

    <span className="text-2xl">
      ✅
    </span>

  )}

</div>
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
 dayVotingOpen &&
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
      </div>
    </main>
  );
}