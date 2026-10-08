"use client";

import { use, useEffect, useRef, useState } from "react";

import { listenPlayer } from "@/services/listenPlayer";
import { listenGamePlayers } from "@/services/listenGamePlayers";
import { listenGame } from "@/services/listenGame";

import { mafiaVote } from "@/services/mafiaVote";
import { doctorSave } from "@/services/doctorSave";
import { detectiveCheck } from "@/services/detectiveCheck";
import { sniperShoot } from "@/services/sniperShoot";
import { useSlaughter, type SlaughterRole } from "@/services/slaughter";
import { buyCitizen } from "@/services/savvalGoodman";
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
  hasSelfSaved?: boolean;
  vestActive?: boolean;
  slaughterUsed?: boolean;
  purchaseUsed?: boolean;
  purchasedThisNight?: boolean;
  purchasedBy?: string;
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
 const [secondVoteId, setSecondVoteId] = useState<string | null>(null);
 const [secondVoteSubmitted, setSecondVoteSubmitted] = useState(false);
 const previousSecondVoteId = useRef<string | null>(null);
 const [selectedSecondVote, setSelectedSecondVote] =
   useState<SecondVoteChoice | null>(null);

  const [selectedTarget, setSelectedTarget] =
    useState<string | null>(null);
  const [selectedSlaughterTarget, setSelectedSlaughterTarget] = useState<string | null>(null);
  const [mafiaVoteSubmitted, setMafiaVoteSubmitted] = useState(false);
  const [selectedSlaughterRole, setSelectedSlaughterRole] = useState<SlaughterRole>("doctor");
  const [selectedPurchaseTarget, setSelectedPurchaseTarget] = useState<string | null>(null);

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
const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  // Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø¨Ø§Ø²ÛŒÚ©Ù†
  useEffect(() => {
    const playerId = localStorage.getItem("playerId");
    if (!playerId) return;

    const unsubscribe = listenPlayer(gameId, playerId, (data: Player) => {
      setPlayer(data);
    });

    return () => unsubscribe();
  }, [gameId]);

  // Ù‡Ù…Ù‡ Ø¨Ø§Ø²ÛŒÚ©Ù†Ø§Ù†
  useEffect(() => {
    const unsubscribe = listenGamePlayers(gameId, (data: Player[]) => {
      setPlayers(data);
    });

    return () => unsubscribe();
  }, [gameId]);

  // ÙˆØ¶Ø¹ÛŒØª Ø¨Ø§Ø²ÛŒ
  useEffect(() => {
    const unsubscribe = listenGame(gameId, (game) => {
      if (!game) return;

      setPhase(game.phase);
      if (game.phase !== "night") {
        setMafiaVoteSubmitted(false);
        setSelectedTarget(null);
      }
setGameStatus(game.status ?? "");
setWinner(game.winner ?? "");
setDayVotingOpen(game.dayVotingOpen ?? false);

const newSecondVoteId = game.secondVoteId ?? null;

setSecondVoteTargetId(game.secondVoteTargetId ?? null);
setSecondVoteId(newSecondVoteId);

// Reset YES / NO state when a NEW second-vote round starts.
// Consecutive rounds both use "second_vote", so we use
// secondVoteId to identify the new round.
if (
  newSecondVoteId !== null &&
  newSecondVoteId !== previousSecondVoteId.current
) {
  setSecondVoteSubmitted(false);
  setSelectedSecondVote(null);
}

previousSecondVoteId.current = newSecondVoteId;

// Leaving second vote, or clearing its ID, resets the local state.
if (
  game.phase !== "second_vote" ||
  newSecondVoteId === null
) {
  setSecondVoteSubmitted(false);
  setSelectedSecondVote(null);
}
    });

    return () => unsubscribe();
  }, [gameId]);

async function handleSendMafiaMessage() {
  const playerId = localStorage.getItem("playerId");

  if (!playerId || !player) return;
  if (!chatInput.trim()) return;

  try {
    await sendMafiaMessage(
      gameId,
      playerId,
      player.nickname,
      chatInput
    );

    setChatInput("");
  } catch (error) {
    console.error(error);
    alert("Failed to send message.");
  }
}
useEffect(() => {
  if (
    player?.role !== "mafia" &&
    player?.role !== "savval_goodman" &&
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

useEffect(() => {
  const container = chatMessagesRef.current;
  if (!container) return;

  const distanceFromBottom =
    container.scrollHeight -
    container.scrollTop -
    container.clientHeight;

  const isNearBottom = distanceFromBottom < 80;

  if (isNearBottom) {
    container.scrollTop = container.scrollHeight;
  }
}, [chatMessages]);
  // Mafia
  // -----------------------

       async function handleMafiaVote(targetId: string) {
         const playerId = localStorage.getItem("playerId");

         console.log("=== MAFIA DEBUG ===");
         console.log("gameId:", gameId);
         console.log("localStorage playerId:", playerId);
         console.log("UI player:", player);
         console.log("UI player id:", player?.id);
         console.log("UI player nickname:", player?.nickname);
         console.log("UI player role:", player?.role);
         console.log("targetId:", targetId);

         if (!playerId) {
           console.error("MAFIA ERROR: playerId not found in localStorage");
           alert("Player ID not found.");
           return;
         }

         if (mafiaVoteSubmitted || loading) {
           console.log("MAFIA ACTION BLOCKED:", {
             mafiaVoteSubmitted,
             loading,
           });
           return;
         }

         setLoading(true);

         try {
           await mafiaVote(gameId, playerId, targetId);

           setMafiaVoteSubmitted(true);
           setSelectedTarget(targetId);

           console.log("MAFIA VOTE SUCCESS");

           alert("Victim Selected");
         } catch (error) {
           console.error("MAFIA VOTE ERROR:", error);

           const message =
             error instanceof Error ? error.message : "";

           console.error("MAFIA VOTE ERROR CODE:", message);

           if (message === "MAFIA_VOTE_ALREADY_USED") {
             setMafiaVoteSubmitted(true);
             alert("You have already selected a victim tonight.");
           } else if (message === "NOT_MAFIA") {
             alert("ERROR: Firebase says this player is not Mafia.");
           } else if (message === "DEAD_PLAYER") {
             alert("Dead players cannot select a victim.");
           } else if (message === "PLAYER_NOT_FOUND") {
             alert("Player was not found in this game.");
           } else {
             alert(message || "Failed to select victim.");
           }
         } finally {
           setLoading(false);
         }
       }
  // -----------------------
  // Slaughter / Savval Goodman
  // -----------------------

  async function handleSlaughter() {
  const playerId = localStorage.getItem("playerId");

  console.log("=== SLAUGHTER DEBUG ===");
  console.log("playerId:", playerId);
  console.log("UI player:", player);
  console.log("UI player role:", player?.role);
  console.log("selected target:", selectedSlaughterTarget);
  console.log("selected role:", selectedSlaughterRole);

  if (!playerId || !selectedSlaughterTarget) return;

  setLoading(true);

  try {
    const result = await useSlaughter(
      gameId,
      playerId,
      selectedSlaughterTarget,
      selectedSlaughterRole
    );

    alert(
      result.correct
        ? "Slaughter successful."
        : "Slaughter failed. Wrong role guess."
    );

    setSelectedSlaughterTarget(null);
  } catch (error) {
    console.error(error);
    alert(error instanceof Error ? error.message : "Failed");
  } finally {
    setLoading(false);
  }
}
  async function handleBuyCitizen() {
    const playerId = localStorage.getItem("playerId");

    if (!playerId || !selectedPurchaseTarget || !player) return;

    if (player.role !== "savval_goodman") return;

    if (
      player.purchaseUsed === true ||
      !player.canUseAbility ||
      loading
    ) {
      return;
    }

    setLoading(true);

    try {
      const result = await buyCitizen(
        gameId,
        playerId,
        selectedPurchaseTarget
      );

      setSelectedPurchaseTarget(null);

      alert(
        result.success
          ? "Purchase successful. Target became Mafia. Mafia shot is cancelled tonight."
          : "Purchase failed. Target was not a Citizen. Mafia shot is still cancelled tonight."
      );
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error ? error.message : "";

      if (message === "PURCHASE_ALREADY_USED") {
        alert("You have already used Buy Citizen.");
      } else if (message === "NOT_SAVVAL_GOODMAN") {
        alert("Only Savval Goodman can use this ability.");
      } else if (message === "DEAD_PLAYER") {
        alert("Dead players cannot use this ability.");
      } else if (message === "INVALID_PURCHASE_TARGET") {
        alert("Invalid purchase target.");
      } else {
        alert(message || "Purchase failed.");
      }
    } finally {
      setLoading(false);
    }
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
      const message = error instanceof Error ? error.message : "";
      alert(message === "DOCTOR_SELF_SAVE_ALREADY_USED"
        ? "You can save yourself only once during the whole game."
        : "Failed");
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

const roleBackgrounds: Record<string, string> = {
  godfather: "/role-backgrounds/godfather.jpg",
  savval_goodman: "/role-backgrounds/savval-goodman.jpg",
  mafia: "/role-backgrounds/mafia.jpg",
  doctor: "/role-backgrounds/doctor.jpg",
  detective: "/role-backgrounds/detective.jpg",
  sniper: "/role-backgrounds/sniper.jpg",
  citizen: "/role-backgrounds/citizen.jpg",
};

const roleBackground = roleBackgrounds[player?.role ?? "citizen"] ?? roleBackgrounds.citizen;

if (gameStatus === "finished") {
  return (
    <main className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-5xl font-black text-yellow-400">
          Game Over
        </h1>

        <p className="mt-8 text-3xl">
          {winner === "mafia"
            ? "â˜  Mafia Wins"
            : "ðŸ† Citizens Win"}
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
  className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-all duration-700 bg-cover bg-center bg-fixed text-white"
  style={{
    backgroundImage: `linear-gradient(rgba(0,0,0,0.64), rgba(0,0,0,0.82)), url(${roleBackground})`,
  }}
>

    <div
      className="w-full max-w-lg rounded-2xl p-5 sm:p-8 border border-white/15 bg-black/65 backdrop-blur-xl shadow-2xl transition-all duration-700"
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

      <div
        className="mt-8 overflow-hidden rounded-xl border border-yellow-500/70 bg-black/70 p-6 shadow-2xl"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.58), rgba(0,0,0,0.82)), url(${roleBackground})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >

        <p className="text-gray-400">
          Your Role
        </p>

        <h2 className="mt-3 text-4xl font-black text-yellow-400">
          {player.role.toUpperCase()}
        </h2>

      </div>
      
        {phase === "night" &&
          player.alive &&
          player.role === "mafia" &&
          player.purchasedThisNight && (
            <div className="mt-8 rounded-xl border border-red-500/70 bg-black/75 p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/50 p-4">
                <p className="text-lg font-black text-emerald-300">âœ… Ø®Ø±ÛŒØ¯ Ù…ÙˆÙÙ‚ â€” Ø´Ù…Ø§ Ù…Ø§ÙÛŒØ§ Ø´Ø¯ÛŒØ¯</p>
                <p className="mt-2 text-sm text-zinc-200">Ø§Ø² Ù‡Ù…ÛŒÙ† Ù„Ø­Ø¸Ù‡ Ù‡Ù…â€ŒØªÛŒÙ…ÛŒâ€ŒÙ‡Ø§ÛŒ Ù…Ø§ÙÛŒØ§ Ø±Ø§ Ù…ÛŒâ€ŒØ¨ÛŒÙ†ÛŒØ¯. Ø´Ù„ÛŒÚ© Ù…Ø§ÙÛŒØ§ Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ† Ø´Ø¨ Ù‚Ø¨Ù„Ø§Ù‹ Ù„ØºÙˆ Ø´Ø¯Ù‡ Ø§Ø³Øª.</p>
              </div>
              <div className="mt-5 rounded-lg bg-black/50 p-4">
                <p className="mb-2 font-bold text-red-300">Ù‡Ù…â€ŒØªÛŒÙ…ÛŒâ€ŒÙ‡Ø§ÛŒ Ù…Ø§ÙÛŒØ§</p>
                {players.filter((p) =>
                  p.alive &&
                  p.id !== player.id &&
                  (p.role === "mafia" || p.role === "savval_goodman" || p.role === "godfather")
                ).map((m) => (
                  <p key={m.id} className="text-gray-200">â€¢ {m.nickname}</p>
                ))}
              </div>
            </div>
          )}

        {/* ========================= */}
        {/* MAFIA */}
        {/* ========================= */}
{phase === "night" &&
  player.alive &&
  (player.role === "godfather" || player.role === "savval_goodman" || player.role === "mafia") &&
  (
    <div className="mt-8 rounded-xl bg-red-950 border border-red-700 p-6">
      <h3 className="text-2xl font-bold text-red-400">
        â˜  Mafia
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
                p.role === "savval_goodman" ||
                p.role === "godfather") &&
              p.id !== player.id &&
              p.alive
          )
          .map((m) => (
            <p
              key={m.id}
              className="text-gray-300"
            >
              â€¢ {m.nickname}
            </p>
          ))}
      </div>

      {/* Mafia Chat */}
      <div className="mt-6 rounded-xl bg-black/40 p-4">
        <h3 className="mb-3 font-bold text-red-400">
          ðŸ’¬ Mafia Chat
        </h3>

        <div ref={chatMessagesRef} className="h-48 overflow-y-auto rounded-lg bg-zinc-900 p-3 space-y-2">
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

    await handleSendMafiaMessage();

  }}

  placeholder="Message..."
  className="flex-1 rounded-lg bg-zinc-800 p-3"
/>

          <button
            onClick={handleSendMafiaMessage}
            className="rounded-lg bg-red-600 px-5"
          >
            Send
          </button>
        </div>
      </div>

      {/* Godfather Night Kill */}
      {player.role === "godfather" && !mafiaVoteSubmitted && (
        <>
          <h3 className="mt-6 mb-4 text-xl font-bold text-red-400">
            ðŸŽ¯ Select Victim
          </h3>

          <div className="space-y-3">
            {players
              .filter(
                (p) =>
                  p.id !== player.id &&
                  p.role !== "mafia" &&
                  p.role !== "savval_goodman" &&
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

    {(selectedTarget === target.id) && "ðŸ”« "}

    {target.nickname}

  </span>

  {selectedTarget === target.id && (

    <span className="text-2xl">
      âœ…
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
            ðŸ”´ Confirm Kill
          </button>
        </>
      )}

      {player.role === "godfather" &&
        player.slaughterUsed !== true && (
        <div className="mt-8 rounded-xl border border-purple-700 bg-purple-950/60 p-5">
          <h3 className="text-xl font-bold text-purple-300">ðŸ—¡ï¸ Slaughter</h3>
         <p className="mt-1 text-sm text-gray-300">
           One use per game
         </p>



          <select
            value={selectedSlaughterTarget ?? ""}
            onChange={(e) =>
              setSelectedSlaughterTarget(e.target.value || null)
            }
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-zinc-800 p-3 text-white"
          >
            <option value="">Select target player</option>

            {players
              .filter(
                (p) =>
                  p.id !== player.id &&
                  p.alive !== false
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname}
                </option>
              ))}
          </select>
          <select
            value={selectedSlaughterRole}
            onChange={(e) =>
              setSelectedSlaughterRole(e.target.value as SlaughterRole)
            }
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-zinc-800 p-3 text-white"
          >
            <option value="doctor">Doctor</option>
            <option value="detective">Detective</option>
            <option value="sniper">Sniper</option>
          </select>

          <button
            disabled={!selectedSlaughterTarget || loading}
            onClick={handleSlaughter}
            className="mt-4 w-full rounded-xl bg-purple-700 py-3 font-bold hover:bg-purple-600 disabled:opacity-40"
          >
            ðŸ—¡ï¸ Confirm Slaughter
          </button>
        </div>
      )}

      {player.role === "savval_goodman" && (
        <div className="mt-8 rounded-xl border border-amber-700 bg-amber-950/60 p-5">
          <h3 className="text-xl font-bold text-amber-300">ðŸ’° Buy Citizen</h3>
          <p className="mt-1 text-sm text-gray-300">One use per game. Buying cancels the Mafia shot for this night.</p>

          <select
            value={selectedPurchaseTarget ?? ""}
            onChange={(e) => setSelectedPurchaseTarget(e.target.value || null)}
            disabled={loading || !player.canUseAbility || player.purchaseUsed === true}
            className="mt-4 w-full rounded-lg bg-zinc-800 p-3 text-white"
          >
            <option value="">Select player</option>
            {players.filter((p) => p.id !== player.id && p.alive).map((p) => (
              <option key={p.id} value={p.id}>{p.nickname}</option>
            ))}
          </select>

          <button
            disabled={!selectedPurchaseTarget || loading || !player.canUseAbility || player.purchaseUsed === true}
            onClick={handleBuyCitizen}
            className="mt-4 w-full rounded-xl bg-amber-600 py-3 font-bold hover:bg-amber-500 disabled:opacity-40"
          >
            ðŸ’° Confirm Purchase
          </button>
        </div>
      )}
    </div>
)}

{phase === "night" &&
  player.alive &&
  player.role === "godfather" &&
  mafiaVoteSubmitted && (
    <div className="mt-8 rounded-xl border border-green-700 bg-zinc-800 p-6">
      <h3 className="text-3xl font-black text-red-400">
        â˜  MAFIA
      </h3>

      <div className="mt-6 rounded-xl border border-green-700 bg-green-900 p-5">
        <h3 className="text-xl font-bold">
          âœ… Kill Submitted
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
      ðŸ©º Choose Someone To Save
    </h3>

    <div className="space-y-3">

      {players
        .filter((p) => p.alive && (p.id !== player.id || player.hasSelfSaved !== true))
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

    {selectedDoctorTarget === target.id && "ðŸ©º "}

    {target.nickname}

  </span>

  {selectedDoctorTarget === target.id && (

    <span className="text-2xl">
      âœ…
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
      ðŸ©º Confirm Save
    </button>

  </div>

)}

{phase === "night" &&
 player.role === "doctor" &&
 !player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-blue-950 border border-blue-700 p-6">

    <h3 className="text-3xl font-black text-blue-400">
      ðŸ©º DOCTOR
    </h3>

    <div className="mt-6 rounded-xl bg-green-900 border border-green-700 p-5">

      <h3 className="text-xl font-bold">
        âœ… Protection Submitted
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

    <h3 className="text-2xl font-bold text-indigo-400 mb-2">
      ðŸ”Ž Investigate Player
    </h3>
    <p className="mb-5 text-sm text-gray-300">Vest: {player.vestActive ? "ACTIVE â€” survives one Mafia shot" : "USED"}</p>

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

    {selectedDetectiveTarget === target.id && "ðŸ”Ž "}

    {target.nickname}

  </span>

  {selectedDetectiveTarget === target.id && (

    <span className="text-2xl">
      âœ…
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
      ðŸ”Ž Confirm Check
    </button>

  </div>

)}

{phase === "night" &&
 player.role === "detective" &&
 !player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-indigo-950 border border-indigo-700 p-6">

    <h3 className="text-3xl font-black text-indigo-400">
      ðŸ”Ž DETECTIVE
    </h3>

    <div className="mt-6 rounded-xl bg-green-900 border border-green-700 p-5">

      <h3 className="text-xl font-bold">
        âœ… Investigation Submitted
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
      ðŸŽ¯ Choose Target
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

    {selectedSniperTarget === target.id && "ðŸŽ¯ "}

    {target.nickname}

  </span>

  {selectedSniperTarget === target.id && (

    <span className="text-2xl">
      âœ…
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
        ðŸŽ¯ Confirm Shoot
      </button>

      <button
        onClick={() => handleSniper(null)}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-700 hover:bg-zinc-600 transition p-4 mt-2 font-bold"
      >
        â­ Skip Tonight
      </button>

    </div>

  </div>

)}

{phase === "night" &&
 player.role === "sniper" &&
 !player.canUseAbility && (

  <div className="mt-8 rounded-xl bg-orange-950 border border-orange-700 p-6">

    <h3 className="text-3xl font-black text-orange-400">
      ðŸŽ¯ SNIPER
    </h3>

    <div className="mt-6 rounded-xl bg-green-900 border border-green-700 p-5">

      <h3 className="text-xl font-bold">
        âœ… Action Submitted
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
player.role !== "savval_goodman" &&
player.role !== "godfather" &&
player.role !== "doctor" &&
player.role !== "detective" &&
player.role !== "sniper" && (

  <div className="mt-8 rounded-xl bg-zinc-800 p-5">

    <h3 className="font-bold">
      ðŸŒ™ Night Phase
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
        <h4 className="text-xl font-black text-green-300">âœ“ Vote Submitted</h4>
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
      â˜€ï¸ Day Voting
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

    {selectedVoteTarget === target.id && "ðŸ—³ï¸ "}

    {target.nickname}

  </span>

  {selectedVoteTarget === target.id && (

    <span className="text-2xl">
      âœ…
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
      ðŸ—³ Confirm Vote
    </button>

  </div>

)}

{phase === "day" &&
 dayVotingOpen &&
 player.alive &&
 !player.canVote && (
    <div className="mt-8 rounded-xl border border-green-700 bg-zinc-800 p-6">
      <h3 className="text-3xl font-black text-yellow-400">
        â˜€ï¸ DAY
      </h3>

      <div className="mt-6 rounded-xl border border-green-700 bg-green-900 p-5">
        <h3 className="text-xl font-bold">
          âœ… Vote Submitted
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








