"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Moon } from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import Button from "@/components/ui/Button";
import { db } from "@/lib/firebase";

import { listenPlayers } from "@/services/listenPlayers";
import { startGame } from "@/services/startGame";
import { resolveNight } from "@/services/resolveNight";
import { resolveDay } from "@/services/resolveDay";
import { removePlayer } from "@/services/removePlayer";
import { revivePlayer } from "@/services/revivePlayer";
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

type VoteResult = {
  playerId: string;
  votes: number;
  voters: string[];
};

type SecondVoteChoice = "YES" | "NO";

type SecondVoteData = {
  playerId: string;
  targetId: string;
  choice: SecondVoteChoice;
  secondVoteId?: string;
  createdAt?: number;
};

type DayVoteData = {
  playerId: string;
  targetId: string;
  createdAt?: number;
};

type PlayerRef = {
  playerName?: string;
  playerId?: string;
};

type NightValue = string | PlayerRef | null | undefined;

type NightLog = {
  mafia?: {
    actor?: NightValue;
    actorId?: string | null;
    actorName?: string;
    target?: NightValue;
    targetId?: string | null;
    targetName?: string;
    killedPlayer?: NightValue;
    blockedByDoctor?: boolean;
  };
  doctor?: {
    actor?: NightValue;
    actorId?: string | null;
    actorName?: string;
    target?: NightValue;
    targetId?: string | null;
    targetName?: string;
    savedMafiaTarget?: boolean;
    savedSniper?: boolean;
  };
  detective?: {
    actor?: NightValue;
    actorId?: string | null;
    actorName?: string;
    target?: NightValue;
    targetId?: string | null;
    targetName?: string;
    result?: string;
  };
  sniper?: {
    actor?: NightValue;
    actorId?: string | null;
    actorName?: string;
    target?: NightValue;
    targetId?: string | null;
    targetName?: string;
    killed?: NightValue;
    killedPlayer?: NightValue;
    died?: boolean;
    sniperDied?: boolean;
    savedByDoctor?: boolean;
    sniperWasSaved?: boolean;
  };
  promotedGodfather?: NightValue;
  deadPlayers?: NightValue[];
  resolvedAt?: number;
};

function getNightText(
  value: NightValue,
  fallback = ""
) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (value && typeof value === "object") {
    return (
      value.playerName ||
      value.playerId ||
      fallback
    );
  }

  return fallback;
}

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

export default function HostPage({ params }: Props) {
  const { gameId } = use(params);

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const [gameStatus, setGameStatus] =
    useState("waiting");

  const [phase, setPhase] = useState("");

  const [lastNightLog, setLastNightLog] =
    useState<NightLog | null>(null);

  const [dayVotingOpen, setDayVotingOpen] =
    useState(false);

  const [voteResults, setVoteResults] =
    useState<VoteResult[]>([]);

  const [
    selectedElimination,
    setSelectedElimination,
  ] = useState<string | null>(null);

  const [mafiaMessages, setMafiaMessages] =
    useState<MafiaMessage[]>([]);

  // ============================
  // SECOND VOTE
  // ============================

  const [
    secondVoteOpen,
    setSecondVoteOpen,
  ] = useState(false);

  const [secondVoteId, setSecondVoteId] = useState<string | null>(null);

  const [
    secondVoteTargetId,
    setSecondVoteTargetId,
  ] = useState<string | null>(null);

  const [secondVotes, setSecondVotes] =
    useState<SecondVoteData[]>([]);

  const [dayVotes, setDayVotes] =
    useState<DayVoteData[]>([]);

  // ============================
  // PLAYERS LISTENER
  // ============================

  useEffect(() => {
    const unsubscribe = listenPlayers(
      gameId,
      (data) => {
        setPlayers(data as Player[]);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  // ============================
  // GAME LISTENER
  // ============================

  useEffect(() => {
    const unsubscribe = listenGame(
      gameId,
      (game) => {
        if (!game) return;

        setGameStatus(
          game.status ?? ""
        );

        setPhase(
          game.phase ?? ""
        );

        setDayVotingOpen(
          game.dayVotingOpen ?? false
        );

        setSecondVoteOpen(
          game.secondVoteOpen === true
        );

        setSecondVoteTargetId(
          game.secondVoteTargetId ?? null
        );

        setSecondVoteId(game.secondVoteId ?? null);

        setLastNightLog(
          game.lastNightLog ?? null
        );
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  // ============================
  // MAFIA CHAT
  // ============================

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
  // DAY VOTES LISTENER
  // ============================

  useEffect(() => {
    const dayVotesRef = collection(
      db,
      "games",
      gameId,
      "dayVotes"
    );

    const unsubscribe = onSnapshot(
      dayVotesRef,
      (snapshot) => {
        const data = snapshot.docs.map(
          (voteDoc) => {
            const voteData = voteDoc.data();

            return {
              playerId:
                voteData.playerId ??
                voteDoc.id,
              targetId:
                voteData.targetId ?? "",
              createdAt:
                voteData.createdAt,
            };
          }
        );

        setDayVotes(data);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  // ============================
  // SECOND VOTES LISTENER
  // ============================

  useEffect(() => {
    const secondVotesRef = collection(
      db,
      "games",
      gameId,
      "secondVotes"
    );

    const unsubscribe = onSnapshot(
      secondVotesRef,
      (snapshot) => {
        const data =
          snapshot.docs.map((voteDoc) => {
            const voteData = voteDoc.data();

            return {
              playerId:
                voteData.playerId ??
                voteDoc.id,

              targetId:
                voteData.targetId ?? "",

              choice:
                voteData.choice as
                  SecondVoteChoice,

              secondVoteId:
                voteData.secondVoteId ?? "",

              createdAt:
                voteData.createdAt,
            };
          });

        setSecondVotes(data);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  // ============================
  // START GAME
  // ============================

  async function handleStartGame() {
    if (players.length < 6) {
      alert("Minimum 6 players required.");
      return;
    }

    setLoading(true);

    try {
      await startGame(gameId);

      alert(
        "Game Started Successfully!"
      );

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
  // FINISH NIGHT
  // ============================

  async function handleFinishNight() {
    setLoading(true);

    try {
      await resolveNight(gameId);

      alert(
        "Night Finished Successfully!"
      );

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
  // OPEN DAY VOTING
  // ============================

  async function handleOpenDayVoting() {
    setLoading(true);

    try {
      await openDayVoting(gameId);

      await updateDoc(
        doc(db, "games", gameId),
        {
          phase: "day",

          secondVoteOpen: false,

          secondVoteTargetId: null,
          secondVoteId: null,

          updatedAt:
            serverTimestamp(),
        }
      );

      setSecondVotes([]);
      setDayVotes([]);
      setSecondVoteId(null);
      setVoteResults([]);
      setSelectedElimination(null);

      alert("Day Voting Opened");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Failed to open day voting."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // FINISH FIRST VOTING
  // ============================

  async function handleFinishVoting() {
    setLoading(true);

    try {
      const results =
        await countDayVotes(gameId);

      setVoteResults(results);

      if (results.length > 0) {
        setSelectedElimination(
          results[0].playerId
        );

        alert(
          "Voting results are ready. Select the player for the second vote."
        );
      } else {
        setSelectedElimination(null);

        alert(
          "No votes were submitted."
        );
      }
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Failed to count votes."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // SELECT DEFENDANT
  // ============================

  function handleSelectDefendant(
    playerId: string
  ) {
    const player = players.find(
      (item) => item.id === playerId
    );

    setSelectedElimination(playerId);

    alert(
      `${
        player?.nickname ?? "Player"
      } selected for the second vote.`
    );
  }

  // ============================
  // START SECOND YES / NO VOTE
  // ============================

  async function handleStartSecondVote() {
    if (!selectedElimination) {
      alert(
        "Please select a player first."
      );

      return;
    }

    const target = players.find(
      (player) =>
        player.id === selectedElimination
    );

    if (!target) {
      alert(
        "Selected player not found."
      );

      return;
    }

    if (target.alive === false) {
      alert(
        "This player is already dead."
      );

      return;
    }

    setLoading(true);

    try {
      await updateDoc(
        doc(db, "games", gameId),
        {
          // مهم:
          // سرویس secondVote فقط در این
          // phase اجازه رأی می‌دهد.
          phase: "second_vote",

          secondVoteOpen: true,

          secondVoteTargetId:
            selectedElimination,

          // هر رأی YES/NO یک شناسه مستقل دارد؛
          // بنابراین رأی‌های راندهای قبلی وارد راند جدید نمی‌شوند.
          secondVoteId: `${Date.now()}_${selectedElimination}`,

          dayVotingOpen: false,

          updatedAt:
            serverTimestamp(),
        }
      );

      alert(
        `YES / NO vote started for ${target.nickname}.`
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to start second vote."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // FINISH SECOND VOTE
  // ============================

  async function handleFinishSecondVote() {
    setLoading(true);

    try {
      await updateDoc(
        doc(db, "games", gameId),
        {
          // رأی دوم بسته شد
          secondVoteOpen: false,
          secondVoteId: null,

          // بازگشت به روز
          phase: "day",

          dayVotingOpen: false,

          updatedAt:
            serverTimestamp(),
        }
      );

      alert(
        "Second vote closed. Host can now decide manually."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to close second vote."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // FINISH DAY
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

  // ============================
  // ELIMINATE PLAYER
  // تصمیم فقط با HOST
  // ============================

  async function handleEliminatePlayer() {
    if (!secondVoteTargetId) {
      alert(
        "No player selected."
      );

      return;
    }

    setLoading(true);

    try {
      await finishDay(
        gameId,
        secondVoteTargetId
      );

      await updateDoc(
        doc(db, "games", gameId),
        {
          phase: "day",

          secondVoteOpen: false,

          secondVoteTargetId: null,
          secondVoteId: null,

          updatedAt:
            serverTimestamp(),
        }
      );

      setVoteResults([]);
      setSelectedElimination(null);
      setSecondVotes([]);

      alert("Player eliminated.");
    } catch (error) {
      console.error(error);

      alert("Failed to finish day.");
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // NO ELIMINATION
  // تصمیم فقط با HOST
  // ============================

  async function handleNoElimination() {
    setLoading(true);

    try {
      await finishDay(gameId, null);

      await updateDoc(
        doc(db, "games", gameId),
        {
          phase: "day",

          secondVoteOpen: false,

          secondVoteTargetId: null,
          secondVoteId: null,

          updatedAt:
            serverTimestamp(),
        }
      );

      setVoteResults([]);
      setSelectedElimination(null);
      setSecondVotes([]);

      alert(
        "No player was eliminated."
      );
    } catch (error) {
      console.error(error);

      alert("Failed to finish day.");
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // SECOND VOTE COUNTS
  // فقط رأی‌های مربوط به هدف فعلی
  // ============================

  const currentSecondVotes =
    secondVotes.filter(
      (vote) =>
        vote.targetId === secondVoteTargetId &&
        vote.secondVoteId === secondVoteId
    );

  const yesVotes =
    currentSecondVotes.filter(
      (vote) =>
        vote.choice === "YES"
    ).length;

  const noVotes =
    currentSecondVotes.filter(
      (vote) =>
        vote.choice === "NO"
    ).length;

  const secondVoteTarget =
    players.find(
      (player) =>
        player.id ===
        secondVoteTargetId
    );

  const alivePlayers =
    players.filter(
      (player) => player.alive !== false
    );

  const playersWhoVoted =
    new Set(
      dayVotes.map(
        (vote) => vote.playerId
      )
    );

  const playersWhoDidNotVote =
    alivePlayers.filter(
      (player) =>
        !playersWhoVoted.has(player.id)
    );

  const getPlayerName = (
    playerId: string
  ) => {
    return (
      players.find(
        (player) => player.id === playerId
      )?.nickname ?? playerId
    );
  };



  return (
    <main className="min-h-screen bg-[#0B0B0F] p-6 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20} />
          Home
        </Link>

        <div className="mb-8 mt-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-6 shadow-2xl">
          <h1 className="text-4xl font-black tracking-wider text-cyan-400">
            🎮 ANDIVAL COMMAND CENTER
          </h1>

          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-zinc-500">
                ROOM
              </p>

              <p className="text-2xl font-black text-yellow-400">
                {gameId}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">
                PLAYERS
              </p>

              <p className="text-2xl font-black text-green-400">
                {players.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">
                STATUS
              </p>

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

            {phase === "night" && (
              <div className="rounded-lg bg-indigo-900 px-4 py-2 font-bold text-indigo-300">
                🌙 NIGHT
              </div>
            )}

            {phase === "second_vote" && (
              <div className="rounded-lg bg-purple-900 px-4 py-2 font-bold text-purple-300">
                ⚖️ SECOND VOTE — YES / NO
              </div>
            )}
          </div>
        </div>

        {/* PLAYERS */}

        <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl">
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 font-black text-black shadow-lg shadow-yellow-500/30">
                    {player.nickname
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="text-lg font-semibold">
                      {player.nickname}
                    </p>

                    <div className="mt-1">
                      {player.role ===
                        "godfather" && (
                        <span className="font-bold text-red-500">
                          ☠ Godfather
                        </span>
                      )}

                      {player.role ===
                        "mafia" && (
                        <span className="font-bold text-red-400">
                          ☠ Mafia
                        </span>
                      )}

                      {player.role ===
                        "doctor" && (
                        <span className="font-bold text-blue-400">
                          🩺 Doctor
                        </span>
                      )}

                      {player.role ===
                        "detective" && (
                        <span className="font-bold text-indigo-400">
                          🔎 Detective
                        </span>
                      )}

                      {player.role ===
                        "sniper" && (
                        <span className="font-bold text-orange-400">
                          🎯 Sniper
                        </span>
                      )}

                      {player.role ===
                        "citizen" && (
                        <span className="font-bold text-gray-300">
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

                <div className="flex items-center gap-3">
                  {player.alive === false ? (
                    <span className="rounded-full bg-red-900 px-3 py-1 font-bold text-red-300">
                      💀 DEAD
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-900 px-3 py-1 font-bold text-green-300">
                      🟢 ALIVE
                    </span>
                  )}

                  {gameStatus !== "finished" &&
                    (player.alive === false ? (
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Revive ${player.nickname} and return them to the game?`
                            )
                          ) {
                            return;
                          }

                          try {
                            await revivePlayer(
                              gameId,
                              player.id
                            );
                          } catch (error) {
                            console.error(error);

                            alert(
                              error instanceof Error
                                ? error.message
                                : "Failed to revive player."
                            );
                          }
                        }}
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-4 py-2 font-bold text-white transition-all duration-300 hover:scale-105"
                      >
                        🔄 Revive
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Remove ${player.nickname} from the game?`
                            )
                          ) {
                            return;
                          }

                          try {
                            await removePlayer(
                              gameId,
                              player.id
                            );
                          } catch (error) {
                            console.error(error);

                            alert(
                              "Failed to remove player."
                            );
                          }
                        }}
                        className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-bold text-white transition-all duration-300 hover:scale-105"
                      >
                        🗑 Remove
                      </button>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* GAME CONTROLS */}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Button
            onClick={handleStartGame}
            disabled={
              players.length < 6 ||
              loading
            }
          >
            <Play size={18} />

            {loading
              ? "Starting..."
              : "▶ Start Game"}
          </Button>

          <Button
            onClick={handleFinishNight}
            disabled={loading}
          >
            <Moon size={18} />

            {loading
              ? "Processing..."
              : "🌙 Finish Night"}
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
        </div>

        {players.length < 6 && (
          <p className="mt-4 text-sm text-gray-500">
            At least 6 players are required
            to start the game.
          </p>
        )}

        {/* LIVE DAY VOTE DETAILS */}

        {(dayVotingOpen || dayVotes.length > 0) && (
          <div className="mt-10 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-zinc-950 p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-cyan-300">
                  🗳 LIVE VOTING DETAILS
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  See exactly who voted for whom.
                </p>
              </div>

              <span className="rounded-full bg-cyan-950 px-4 py-2 font-black text-cyan-300">
                {dayVotes.length} / {alivePlayers.length} VOTED
              </span>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-lg font-black text-yellow-300">
                👁 WHO VOTED FOR WHOM
              </h3>

              {dayVotes.length === 0 ? (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-zinc-500">
                  No votes submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayVotes.map((vote) => (
                    <div
                      key={vote.playerId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4"
                    >
                      <div>
                        <p className="text-xs text-zinc-500">
                          VOTER
                        </p>

                        <p className="font-black text-white">
                          {getPlayerName(vote.playerId)}
                        </p>
                      </div>

                      <div className="text-xl font-black text-yellow-400">
                        →
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-zinc-500">
                          VOTED FOR
                        </p>

                        <p className="font-black text-red-300">
                          {getPlayerName(vote.targetId)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-lg font-black text-orange-300">
                ⏳ NOT VOTED YET
              </h3>

              {playersWhoDidNotVote.length === 0 ? (
                <div className="rounded-xl border border-green-500/30 bg-green-950/30 p-4 font-bold text-green-300">
                  ✅ All alive players have voted.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {playersWhoDidNotVote.map(
                    (player) => (
                      <span
                        key={player.id}
                        className="rounded-full border border-orange-500/30 bg-orange-950/30 px-4 py-2 font-bold text-orange-300"
                      >
                        ⏳ {player.nickname}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FIRST VOTE RESULTS */}

        {voteResults.length > 0 && (
          <div className="mt-10 rounded-2xl border border-yellow-500/40 bg-gradient-to-b from-zinc-950 to-zinc-900 p-6 shadow-2xl">
            <h2 className="mb-2 text-2xl font-black text-yellow-400">
              🗳 First Vote Results
            </h2>

            <p className="mb-6 text-sm text-zinc-400">
              Select the player who goes to
              the YES / NO defense vote.
            </p>

            <div className="space-y-3">
              {voteResults.map(
                (result) => {
                  const player =
                    players.find(
                      (item) =>
                        item.id ===
                        result.playerId
                    );

                  const isSelected =
                    selectedElimination ===
                    result.playerId;

                  return (
                    <button
                      key={
                        result.playerId
                      }
                      type="button"
                      onClick={() =>
                        handleSelectDefendant(
                          result.playerId
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-yellow-400 bg-yellow-950"
                          : "border-zinc-700 bg-zinc-800 hover:border-yellow-500"
                      }`}
                    >
                      <div>
                        <p className="font-bold">
                          {player?.nickname ??
                            result.playerId}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          Click to select for
                          defense vote
                        </p>
                      </div>

                      <span className="rounded-lg bg-red-900 px-3 py-2 font-black text-red-300">
                        {result.votes} Votes 👁
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {selectedElimination &&
              !secondVoteOpen && (
                <div className="mt-8 rounded-xl border border-yellow-600 bg-yellow-950 p-5">
                  <p className="text-gray-400">
                    Player selected for defense
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-yellow-400">
                    {
                      players.find(
                        (player) =>
                          player.id ===
                          selectedElimination
                      )?.nickname
                    }
                  </h3>

                  <button
                    onClick={
                      handleStartSecondVote
                    }
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-4 text-lg font-black transition hover:scale-[1.01] disabled:opacity-50"
                  >
                    🗳 START YES / NO VOTE
                  </button>
                </div>
              )}
          </div>
        )}

        {/* SECOND YES / NO VOTE */}

        {(secondVoteOpen ||
          secondVoteTargetId) && (
          <div className="mt-8 rounded-2xl border border-purple-500/50 bg-gradient-to-b from-purple-950/50 to-zinc-950 p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-purple-300">
                  ⚖️ SECOND VOTE — YES / NO
                </h2>

                <p className="mt-2 text-zinc-400">
                  Target:{" "}

                  <span className="font-black text-white">
                    {
                      secondVoteTarget?.nickname ??
                      "Unknown Player"
                    }
                  </span>
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-black ${
                  secondVoteOpen
                    ? "bg-green-900 text-green-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {secondVoteOpen
                  ? "● VOTING LIVE"
                  : "● VOTING CLOSED"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-green-500/30 bg-green-950/40 p-6 text-center">
                <p className="text-sm font-bold text-green-300">
                  YES
                </p>

                <p className="mt-2 text-5xl font-black text-green-400">
                  {yesVotes}
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-6 text-center">
                <p className="text-sm font-bold text-red-300">
                  NO
                </p>

                <p className="mt-2 text-5xl font-black text-red-400">
                  {noVotes}
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Total votes:{" "}
              {yesVotes + noVotes}
            </p>

            {secondVoteOpen && (
              <button
                onClick={
                  handleFinishSecondVote
                }
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-purple-700 py-4 text-lg font-black transition hover:bg-purple-600 disabled:opacity-50"
              >
                🔒 CLOSE YES / NO VOTE
              </button>
            )}

            {!secondVoteOpen &&
              secondVoteTargetId && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <button
                    onClick={
                      handleEliminatePlayer
                    }
                    disabled={loading}
                    className="rounded-xl bg-red-600 py-4 font-black hover:bg-red-700 disabled:opacity-50"
                  >
                    🗑 ELIMINATE PLAYER
                  </button>

                  <button
                    onClick={
                      handleNoElimination
                    }
                    disabled={loading}
                    className="rounded-xl bg-zinc-700 py-4 font-black hover:bg-zinc-600 disabled:opacity-50"
                  >
                    ✋ KEEP IN GAME
                  </button>
                </div>
              )}
          </div>
        )}

        {/* SYSTEM STATUS */}

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-zinc-950 to-black p-6 shadow-2xl">
          <h2 className="text-2xl font-black tracking-widest text-cyan-400">
            ⚡ SYSTEM STATUS
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-zinc-500">
                GAME STATUS
              </p>

              <p className="text-xl font-black text-green-400">
                {gameStatus.toUpperCase()}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">
                PHASE
              </p>

              <p className="text-xl font-black text-yellow-400">
                {phase.toUpperCase()}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">
                PLAYERS
              </p>

              <p className="text-xl font-black text-cyan-400">
                {players.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">
                SERVER
              </p>

              <p className="text-xl font-black text-red-400">
                ● ONLINE
              </p>
            </div>
          </div>
        </div>

        {/* NIGHT REPORT */}

        {lastNightLog && (
          <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-zinc-950 to-black p-6 shadow-2xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-widest text-indigo-300">
                  🌙 NIGHT REPORT
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Private night results for the Host
                </p>
              </div>

              {lastNightLog.resolvedAt && (
                <span className="rounded-full border border-indigo-500/30 bg-indigo-950/50 px-3 py-1 text-xs font-bold text-indigo-200">
                  {new Date(lastNightLog.resolvedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                <h3 className="font-black text-red-300">🔫 MAFIA</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Target: <span className="font-bold text-white">{getNightText(
                    lastNightLog.mafia?.targetName ??
                      lastNightLog.mafia?.target,
                    "No target"
                  )}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {lastNightLog.mafia?.blockedByDoctor
                    ? "🩺 Attack was blocked by Doctor"
                    : "⚠️ Attack was not blocked"}
                </p>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-950/20 p-4">
                <h3 className="font-black text-green-300">🩺 DOCTOR</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Saved: <span className="font-bold text-white">{getNightText(
                    lastNightLog.doctor?.targetName ??
                      lastNightLog.doctor?.target,
                    "No action"
                  )}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {lastNightLog.doctor?.savedMafiaTarget
                    ? "✅ Saved from Mafia"
                    : lastNightLog.doctor?.savedSniper
                    ? "✅ Saved Sniper"
                    : "No successful save"}
                </p>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <h3 className="font-black text-cyan-300">🕵️ DETECTIVE</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Investigated: <span className="font-bold text-white">{getNightText(
                    lastNightLog.detective?.targetName ??
                      lastNightLog.detective?.target,
                    "No action"
                  )}</span>
                </p>
                <p className="mt-1 text-sm font-bold text-cyan-100">
                  Result: {lastNightLog.detective?.result ?? "No result"}
                </p>
              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/20 p-4">
                <h3 className="font-black text-yellow-300">🎯 SNIPER</h3>
                <p className="mt-2 text-sm text-zinc-300">
                  Target: <span className="font-bold text-white">{getNightText(
                    lastNightLog.sniper?.targetName ??
                      lastNightLog.sniper?.target,
                    "No action"
                  )}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {getNightText(
                      lastNightLog.sniper?.killedPlayer ??
                        lastNightLog.sniper?.killed
                    )
                    ? `☠️ Killed: ${getNightText(
                        lastNightLog.sniper?.killedPlayer ??
                          lastNightLog.sniper?.killed
                      )}`
                    : (
                        lastNightLog.sniper?.sniperDied ??
                        lastNightLog.sniper?.died
                      )
                    ? (
                        lastNightLog.sniper?.sniperWasSaved ??
                        lastNightLog.sniper?.savedByDoctor
                      )
                      ? "🩺 Sniper was saved by Doctor"
                      : "☠️ Sniper died after a wrong shot"
                    : "No kill"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-700 bg-black/40 p-4">
              <h3 className="font-black text-white">☠️ DEAD PLAYERS</h3>
              <p className="mt-2 text-zinc-300">
                {lastNightLog.deadPlayers && lastNightLog.deadPlayers.length > 0
                  ? lastNightLog.deadPlayers
                      .map((player) =>
                        getNightText(
                          player,
                          "Unknown Player"
                        )
                      )
                      .join(" • ")
                  : "No one died tonight."}
              </p>

              {getNightText(
                lastNightLog.promotedGodfather
              ) && (
                <p className="mt-3 rounded-lg bg-yellow-950/40 p-3 font-bold text-yellow-300">
                  👑 New Godfather: {getNightText(
                    lastNightLog.promotedGodfather
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* MAFIA CHANNEL */}

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
              {mafiaMessages.map(
                (msg) => (
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
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}