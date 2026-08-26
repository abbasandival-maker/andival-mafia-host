"use client";

import { use, useEffect, useMemo, useState } from "react";

import { doc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { useHokmGame } from "@/hooks/hokm/useHokmGame";
import { useHokmPlayers } from "@/hooks/hokm/useHokmPlayers";

import { startHokmGame } from "@/services/hokm/startGame";

interface Props {
  params: Promise<{
    gameId: string;
  }>;
}

type TrickCard = {
  playerId: string;
  card: {
    id: string;
    suit: string;
    rank?: string;
    value?: string | number;
  };
};

export default function HokmHostPage({
  params,
}: Props) {
  const { gameId } = use(params);

  const game = useHokmGame(gameId);
  const players = useHokmPlayers(gameId);

  const [startingGame, setStartingGame] =
    useState(false);

  const [currentTrick, setCurrentTrick] =
    useState<TrickCard[]>([]);

  const [leadSuit, setLeadSuit] =
    useState<string | null>(null);

  const [trickWinner, setTrickWinner] =
    useState<string | null>(null);

  // =========================================
  // CURRENT TRICK LISTENER
  // =========================================

  useEffect(() => {
    if (!gameId) return;

    const trickRef = doc(
      db,
      "hokm_games",
      gameId,
      "state",
      "currentTrick"
    );

    const unsubscribe =
      onSnapshot(
        trickRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setCurrentTrick([]);
            setLeadSuit(null);
            setTrickWinner(null);
            return;
          }

          const data =
            snapshot.data();

          setCurrentTrick(
            Array.isArray(data.cards)
              ? data.cards
              : []
          );

          setLeadSuit(
            data.leadSuit ?? null
          );

          setTrickWinner(
            data.winnerPlayerId ??
              null
          );
        }
      );

    return () => unsubscribe();
  }, [gameId]);

  // =========================================
  // SEATS
  // =========================================

  const seats = useMemo(() => {
    return {
      top: players.find(
        (player: any) =>
          player.seat === "top"
      ),

      right: players.find(
        (player: any) =>
          player.seat === "right"
      ),

      bottom: players.find(
        (player: any) =>
          player.seat === "bottom"
      ),

      left: players.find(
        (player: any) =>
          player.seat === "left"
      ),
    };
  }, [players]);

  // =========================================
  // READY
  // =========================================

  const allPlayersReady =
    players.length === 4 &&
    players.every(
      (player: any) =>
        !!player.seat
    );

  const gameStarted =
    game &&
    game.state !== "WAITING" &&
    game.state !== "LOBBY" &&
    game.state !== "CREATED";

  // =========================================
  // START GAME
  // =========================================

  async function handleStartGame() {
    if (startingGame) return;

    try {
      setStartingGame(true);

      console.log(
        "STARTING HOKM:",
        gameId
      );

      const result =
        await startHokmGame(
          gameId
        );

      console.log(
        "HOKM GAME STARTED:",
        result
      );

    } catch (error: any) {
      console.error(
        "HOKM START ERROR:",
        error
      );

      const message =
        error?.message ??
        "UNKNOWN_ERROR";

      alert(
        `خطا در شروع بازی:\n${message}`
      );
    } finally {
      setStartingGame(false);
    }
  }

  // =========================================
  // CARD SYMBOL
  // =========================================

  function getSuitSymbol(
    suit: string
  ) {
    switch (suit) {
      case "hearts":
        return "♥";

      case "diamonds":
        return "♦";

      case "clubs":
        return "♣";

      case "spades":
        return "♠";

      default:
        return "?";
    }
  }

  function isRedSuit(
    suit: string
  ) {
    return (
      suit === "hearts" ||
      suit === "diamonds"
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Loading...
      </main>
    );
  }

  // =========================================
  // HOST TABLE
  // =========================================

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="flex min-h-screen">

        {/* ================================= */}
        {/* GAME TABLE */}
        {/* ================================= */}

        <section className="flex flex-1 items-center justify-center p-8">

          <div className="relative aspect-square w-full max-w-[800px] overflow-hidden rounded-[40px] border-4 border-neutral-800 bg-[#00ff00]">

            {/* TABLE */}

            <div className="absolute inset-[8%] rounded-[32px] border-4 border-green-700 bg-green-900/40 shadow-2xl">

              {/* CENTER */}

              <div className="absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-green-700 bg-green-950">

                <p className="text-xs text-green-400">
                  TRUMP
                </p>

                <p className="mt-1 text-3xl font-black">
                  {game.trumpSuit
                    ? getSuitSymbol(
                        game.trumpSuit
                      )
                    : "—"}
                </p>

                <p className="mt-2 text-xs text-neutral-500">
                  Trick{" "}
                  {game.trickNumber ??
                    0}
                </p>

              </div>

              {/* ================================= */}
              {/* TOP */}
              {/* ================================= */}

              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">

                <div className="rounded-xl bg-black/70 px-5 py-3">

                  <p className="text-xs text-neutral-500">
                    TOP
                  </p>

                  <p className="font-bold">
                    {seats.top?.name ??
                      "Empty"}
                  </p>

                  {game.currentTurnPlayerId ===
                    seats.top?.id && (
                    <p className="mt-1 text-xs font-bold text-yellow-400">
                      ● TURN
                    </p>
                  )}

                </div>

              </div>

              {/* ================================= */}
              {/* LEFT */}
              {/* ================================= */}

              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-center">

                <div className="rounded-xl bg-black/70 px-5 py-3">

                  <p className="text-xs text-neutral-500">
                    LEFT
                  </p>

                  <p className="font-bold">
                    {seats.left?.name ??
                      "Empty"}
                  </p>

                  {game.currentTurnPlayerId ===
                    seats.left?.id && (
                    <p className="mt-1 text-xs font-bold text-yellow-400">
                      ● TURN
                    </p>
                  )}

                </div>

              </div>

              {/* ================================= */}
              {/* RIGHT */}
              {/* ================================= */}

              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-center">

                <div className="rounded-xl bg-black/70 px-5 py-3">

                  <p className="text-xs text-neutral-500">
                    RIGHT
                  </p>

                  <p className="font-bold">
                    {seats.right?.name ??
                      "Empty"}
                  </p>

                  {game.currentTurnPlayerId ===
                    seats.right?.id && (
                    <p className="mt-1 text-xs font-bold text-yellow-400">
                      ● TURN
                    </p>
                  )}

                </div>

              </div>

              {/* ================================= */}
              {/* BOTTOM */}
              {/* ================================= */}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">

                <div className="rounded-xl bg-black/70 px-5 py-3">

                  <p className="text-xs text-neutral-500">
                    BOTTOM
                  </p>

                  <p className="font-bold">
                    {seats.bottom?.name ??
                      "Empty"}
                  </p>

                  {game.currentTurnPlayerId ===
                    seats.bottom?.id && (
                    <p className="mt-1 text-xs font-bold text-yellow-400">
                      ● TURN
                    </p>
                  )}

                </div>

              </div>

              {/* ================================= */}
              {/* PLAYED CARDS */}
              {/* ================================= */}

              {currentTrick.map(
                (trickCard, index) => {

                  const suit =
                    trickCard.card
                      ?.suit ?? "";

                  const rank =
                    trickCard.card
                      ?.rank ??
                    trickCard.card
                      ?.value ??
                    "";

                  const player =
                    players.find(
                      (item: any) =>
                        item.id ===
                        trickCard.playerId
                    );

                  const positions = [
                    "left-1/2 top-[25%] -translate-x-1/2",
                    "left-[28%] top-1/2 -translate-y-1/2",
                    "right-[28%] top-1/2 -translate-y-1/2",
                    "left-1/2 bottom-[25%] -translate-x-1/2",
                  ];

                  return (
                    <div
                      key={`${trickCard.playerId}-${index}`}
                      className={`absolute ${positions[index]} z-20`}
                    >

                      <div className="h-24 w-16 rounded-xl border-2 border-white bg-white text-black shadow-2xl">

                        <div
                          className={`p-2 text-sm font-black ${
                            isRedSuit(
                              suit
                            )
                              ? "text-red-600"
                              : "text-black"
                          }`}
                        >
                          {rank}
                          <br />
                          {getSuitSymbol(
                            suit
                          )}
                        </div>

                        <div
                          className={`flex items-center justify-center text-3xl ${
                            isRedSuit(
                              suit
                            )
                              ? "text-red-600"
                              : "text-black"
                          }`}
                        >
                          {getSuitSymbol(
                            suit
                          )}
                        </div>

                      </div>

                      <p className="mt-1 text-center text-[10px] font-bold text-white">
                        {player?.name ??
                          "Player"}
                      </p>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* ================================= */}
        {/* CONTROL PANEL */}
        {/* ================================= */}

        <aside className="w-[400px] border-l border-neutral-800 bg-neutral-950 p-8">

          <h1 className="text-3xl font-black">
            ANDIVAL HOKM
          </h1>

          <p className="mt-2 text-neutral-500">
            Host Control
          </p>

          {/* ROOM */}

          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

            <p className="text-xs text-neutral-500">
              ROOM CODE
            </p>

            <p className="mt-2 text-5xl font-black tracking-[8px]">
              {game.roomCode}
            </p>

          </div>

          {/* PLAYERS */}

          <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

            <div className="flex items-center justify-between">

              <h2 className="font-bold">
                PLAYERS
              </h2>

              <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm">
                {players.length}/4
              </span>

            </div>

            <div className="mt-4 space-y-2">

              {players.map(
                (player: any) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-800 p-3"
                  >

                    <div>
                      <p className="font-bold">
                        {player.name}
                      </p>

                      <p className="text-xs text-neutral-500">
                        {player.seat
                          ? player.seat.toUpperCase()
                          : "NO SEAT"}
                      </p>
                    </div>

                    <div
                      className={`h-3 w-3 rounded-full ${
                        player.connected
                          ? "bg-green-500"
                          : "bg-neutral-600"
                      }`}
                    />

                  </div>
                )
              )}

            </div>

          </div>

          {/* SCORE */}

          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-2xl border-2 border-blue-500/40 bg-blue-500/10 p-4 text-center">

              <p className="text-xs font-bold text-blue-400">
                TEAM A
              </p>

              <p className="mt-1 text-4xl font-black text-blue-400">
                {game.score?.teamA ??
                  0}
              </p>

            </div>

            <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-4 text-center">

              <p className="text-xs font-bold text-red-400">
                TEAM B
              </p>

              <p className="mt-1 text-4xl font-black text-red-400">
                {game.score?.teamB ??
                  0}
              </p>

            </div>

          </div>

          {/* STATUS */}

          <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

            <p className="text-xs text-neutral-500">
              GAME STATUS
            </p>

            <p className="mt-2 font-bold text-cyan-400">
              {game.state}
            </p>

            {game.currentTurnPlayerId && (
              <p className="mt-3 text-sm text-neutral-400">
                Turn:{" "}
                <span className="font-bold text-white">
                  {
                    players.find(
                      (player: any) =>
                        player.id ===
                        game.currentTurnPlayerId
                    )?.name ??
                      "Unknown"
                  }
                </span>
              </p>
            )}

          </div>

          {/* START */}

          {!gameStarted && (
            <button
              type="button"
              onClick={
                handleStartGame
              }
              disabled={startingGame}
              className="
                mt-5
                w-full
                rounded-xl
                bg-red-600
                py-4
                text-lg
                font-black
                transition
                hover:bg-red-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {startingGame
                ? "STARTING..."
                : "START GAME"}
            </button>
          )}

          {/* PLAYING */}

          {gameStarted && (
            <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">

              <p className="font-bold text-green-400">
                GAME IN PROGRESS
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {game.state}
              </p>

            </div>
          )}

        </aside>

      </div>

    </main>
  );
}