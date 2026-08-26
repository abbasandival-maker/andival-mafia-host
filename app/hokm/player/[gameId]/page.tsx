"use client";

import { use, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useHokmGame } from "@/hooks/hokm/useHokmGame";
import { useHokmPlayers } from "@/hooks/hokm/useHokmPlayers";
import { useHokmPrivateHand } from "@/hooks/hokm/useHokmPrivateHand";

import {
  selectSeat,
  SeatType,
} from "@/services/hokm/selectSeat";

import { playHokmCard } from "@/services/hokm/playCard";

interface Props {
  params: Promise<{
    gameId: string;
  }>;
}

export default function HokmPlayerPage({
  params,
}: Props) {
  const { gameId } = use(params);

  const searchParams = useSearchParams();
  const playerId =
    searchParams.get("playerId");

  const game = useHokmGame(gameId);
  const players = useHokmPlayers(gameId);

  const {
    cards,
    loading: handLoading,
    error: handError,
  } = useHokmPrivateHand(
    gameId,
    playerId
  );

  const [loadingSeat, setLoadingSeat] =
    useState(false);

  const [playingCard, setPlayingCard] =
    useState(false);

  const [selectedCardId, setSelectedCardId] =
    useState<string | null>(null);

  const [animatingCardId, setAnimatingCardId] =
    useState<string | null>(null);

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
  // CURRENT PLAYER
  // =========================================

  const currentPlayer =
    players.find(
      (player: any) =>
        player.id === playerId
    );

  // =========================================
  // TURN
  // =========================================

  const isMyTurn =
    !!playerId &&
    game?.currentTurnPlayerId ===
      playerId;

  // =========================================
  // GAME STARTED
  // =========================================

  const isGameStarted =
    game?.state ===
      "DEALING_FIRST_FIVE" ||
    game?.state ===
      "CHOOSING_TRUMP" ||
    game?.state ===
      "DEALING_REMAINING" ||
    game?.state === "PLAYING" ||
    game?.state ===
      "ROUND_COMPLETE";

  // =========================================
  // SEAT SELECTION
  // =========================================

  async function handleSeatClick(
    seat: SeatType
  ) {
    if (!playerId) {
      alert("Player ID not found.");
      return;
    }

    if (loadingSeat) return;

    try {
      setLoadingSeat(true);

      await selectSeat(
        gameId,
        playerId,
        seat
      );
    } catch (error: any) {
      console.error(
        "SEAT SELECTION ERROR:",
        error
      );

      if (
        error?.message ===
        "SEAT_ALREADY_TAKEN"
      ) {
        alert(
          "این صندلی قبلاً انتخاب شده است."
        );
      } else {
        alert(
          "خطا در انتخاب صندلی."
        );
      }
    } finally {
      setLoadingSeat(false);
    }
  }

  // =========================================
  // CARD PLAY
  // =========================================

  async function handleCardClick(
    card: any
  ) {
    if (!playerId) {
      alert("Player ID not found.");
      return;
    }

    if (playingCard) return;

    if (!isMyTurn) {
      alert(
        "الان نوبت شما نیست."
      );
      return;
    }

    const cardId =
      String(card.id);

    // =======================================
    // FIRST CLICK
    // =======================================

    if (
      selectedCardId !== cardId
    ) {
      setSelectedCardId(cardId);
      return;
    }

    // =======================================
    // SECOND CLICK
    // =======================================

    try {
      setPlayingCard(true);

      setAnimatingCardId(cardId);

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 180)
      );

      await playHokmCard(
        gameId,
        playerId,
        cardId
      );

      setSelectedCardId(null);
      setAnimatingCardId(null);
    } catch (error: any) {
      console.error(
        "PLAY CARD ERROR:",
        error
      );

      setAnimatingCardId(null);

      const message =
        error?.message;

      if (
        message ===
        "MUST_FOLLOW_SUIT"
      ) {
        alert(
          "باید خال بازی‌شده را دنبال کنید."
        );
      } else if (
        message === "NOT_YOUR_TURN"
      ) {
        alert(
          "الان نوبت شما نیست."
        );
      } else if (
        message ===
        "CARD_NOT_IN_HAND"
      ) {
        alert(
          "این کارت دیگر در دست شما نیست."
        );
      } else {
        alert(
          `خطا در انداختن کارت: ${
            message ??
            "UNKNOWN_ERROR"
          }`
        );
      }
    } finally {
      setPlayingCard(false);
    }
  }

  // =========================================
  // LOADING
  // =========================================

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">

        <div className="text-center">

          <h1 className="text-2xl font-black">
            ANDIVAL HOKM
          </h1>

          <p className="mt-3 text-neutral-500">
            Loading game...
          </p>

        </div>

      </main>
    );
  }

  // =========================================
  // GAME VIEW
  // =========================================

  if (isGameStarted) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">

        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">

          {/* ================================= */}
          {/* HEADER */}
          {/* ================================= */}

          <header className="flex items-center justify-between">

            <div>

              <h1 className="text-2xl font-black">
                ANDIVAL HOKM
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Room {game.roomCode}
              </p>

            </div>

            <div
              className={`
                rounded-full
                px-5
                py-2
                text-sm
                font-black
                ${
                  isMyTurn
                    ? "bg-green-500/15 text-green-400"
                    : "bg-neutral-800 text-neutral-400"
                }
              `}
            >
              {game.state ===
              "ROUND_COMPLETE"
                ? "ROUND COMPLETE"
                : isMyTurn
                ? "YOUR TURN"
                : "WAITING"}
            </div>

          </header>

          {/* ================================= */}
          {/* MY SEAT */}
          {/* ================================= */}

          <div className="mt-5 text-center">

            <p className="text-xs text-neutral-600">
              YOUR SEAT
            </p>

            <p className="mt-1 text-sm font-bold text-neutral-300">
              {currentPlayer?.seat
                ? currentPlayer.seat.toUpperCase()
                : "—"}
            </p>

          </div>

          {/* ================================= */}
          {/* SCORE */}
          {/* ================================= */}

          <div className="mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-4">

            <div className="flex-1 rounded-2xl border-2 border-blue-500/60 bg-blue-500/10 p-4 text-center">

              <p className="text-sm font-bold text-blue-400">
                TEAM A
              </p>

              <p className="mt-1 text-4xl font-black text-blue-400">
                {game.score?.teamA ??
                  0}
              </p>

            </div>

            <div className="text-xl font-bold text-neutral-700">
              -
            </div>

            <div className="flex-1 rounded-2xl border-2 border-red-500/60 bg-red-500/10 p-4 text-center">

              <p className="text-sm font-bold text-red-400">
                TEAM B
              </p>

              <p className="mt-1 text-4xl font-black text-red-400">
                {game.score?.teamB ??
                  0}
              </p>

            </div>

          </div>

          {/* ================================= */}
          {/* TRUMP */}
          {/* ================================= */}

          <div className="mx-auto mt-5 rounded-2xl border border-neutral-800 bg-neutral-900 px-10 py-4 text-center">

            <p className="text-xs font-bold text-neutral-500">
              TRUMP
            </p>

            <p className="mt-1 text-xl font-black">

              {game.trumpSuit
                ? game.trumpSuit.toUpperCase()
                : game.state ===
                  "CHOOSING_TRUMP"
                ? "CHOOSING..."
                : "—"}

            </p>

          </div>

          {/* ================================= */}
          {/* GAME STATUS */}
          {/* ================================= */}

          <div className="mt-8 text-center">

            <p className="text-xs font-bold text-neutral-600">
              GAME STATUS
            </p>

            <p className="mt-1 text-lg font-black text-cyan-400">
              {game.state}
            </p>

          </div>

          {/* ================================= */}
          {/* CURRENT TURN */}
          {/* ================================= */}

          <div className="mt-4 text-center">

            <p className="text-xs text-neutral-500">
              CURRENT TURN
            </p>

            <p
              className={`
                mt-1
                text-lg
                font-black
                ${
                  isMyTurn
                    ? "text-green-400"
                    : "text-white"
                }
              `}
            >

              {players.find(
                (player: any) =>
                  player.id ===
                  game.currentTurnPlayerId
              )?.name ??
                "Waiting..."}

            </p>

          </div>

          {/* ================================= */}
          {/* PRIVATE HAND */}
          {/* ================================= */}

          <section className="mt-auto pt-10">

            <div className="mb-3 flex items-end justify-between">

              <div>

                <p className="text-xs font-bold text-neutral-500">
                  YOUR HAND
                </p>

                <p className="mt-1 text-lg font-black">
                  {cards.length} / 13
                </p>

              </div>

              {game.state ===
                "CHOOSING_TRUMP" && (
                <p className="text-sm font-bold text-yellow-400">
                  Hakem is choosing trump
                </p>
              )}

              {isMyTurn &&
                game.state ===
                  "PLAYING" && (
                <p className="text-sm font-bold text-green-400">
                  کارت را انتخاب کنید
                </p>
              )}

            </div>

            {/* ================================= */}
            {/* HAND LOADING */}
            {/* ================================= */}

            {handLoading ? (

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
                Loading cards...
              </div>

            ) : handError ? (

              <div className="rounded-2xl border border-red-900 bg-red-950/20 p-8 text-center text-red-400">
                {handError}
              </div>

            ) : cards.length === 0 ? (

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-500">
                هنوز کارتی دریافت نشده است.
              </div>

            ) : (

              <div className="flex min-h-[180px] items-end justify-center overflow-x-auto px-2 pb-6">

                <div className="flex items-end justify-center">

                  {cards.map(
                    (
                      card: any,
                      index: number
                    ) => {

                      const cardId =
                        String(
                          card.id
                        );

                      const selected =
                        selectedCardId ===
                        cardId;

                      const animating =
                        animatingCardId ===
                        cardId;

                      const suit =
                        String(
                          card.suit ??
                            ""
                        );

                      const rank =
                        String(
                          card.rank ??
                            card.value ??
                            ""
                        );

                      const suitSymbol =
                        suit ===
                        "hearts"
                          ? "♥"
                          : suit ===
                            "diamonds"
                          ? "♦"
                          : suit ===
                            "clubs"
                          ? "♣"
                          : suit ===
                            "spades"
                          ? "♠"
                          : "";

                      const isRed =
                        suit ===
                          "hearts" ||
                        suit ===
                          "diamonds";

                      const canSelect =
                        game.state ===
                        "PLAYING" &&
                        isMyTurn;

                      return (
                        <button
                          key={cardId}
                          type="button"
                          disabled={
                            playingCard ||
                            !canSelect
                          }
                          onClick={() =>
                            handleCardClick(
                              card
                            )
                          }
                          style={{
                            zIndex:
                              selected ||
                              animating
                                ? 100
                                : index,

                            marginLeft:
                              index ===
                              0
                                ? 0
                                : -42,
                          }}
                          className={`
                            relative
                            h-36
                            w-24
                            flex-shrink-0
                            rounded-xl
                            border
                            border-neutral-300
                            bg-white
                            text-black
                            shadow-xl
                            transition-all
                            duration-200
                            ease-out
                            ${
                              selected
                                ? "-translate-y-5 scale-[1.04]"
                                : "translate-y-0"
                            }
                            ${
                              animating
                                ? "-translate-y-24 scale-75 opacity-0"
                                : ""
                            }
                            ${
                              !canSelect
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer hover:-translate-y-2"
                            }
                          `}
                        >

                          {/* CARD VALUE */}

                          <div
                            className={`
                              absolute
                              left-2
                              top-2
                              text-left
                              text-sm
                              font-black
                              leading-tight
                              ${
                                isRed
                                  ? "text-red-600"
                                  : "text-black"
                              }
                            `}
                          >

                            <div>
                              {rank}
                            </div>

                            <div>
                              {suitSymbol}
                            </div>

                          </div>

                          {/* CARD SUIT */}

                          <div
                            className={`
                              flex
                              h-full
                              items-center
                              justify-center
                              text-4xl
                              ${
                                isRed
                                  ? "text-red-600"
                                  : "text-black"
                              }
                            `}
                          >
                            {suitSymbol}
                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            )}

          </section>

        </div>

      </main>
    );
  }

  // =========================================
  // LOBBY
  // =========================================

  function SeatButton({
    seat,
    color,
    player,
  }: {
    seat: SeatType;
    color: string;
    player?: any;
  }) {
    const isMine =
      player?.id === playerId;

    const isTaken =
      !!player &&
      !isMine;

    return (
      <button
        type="button"
        onClick={() =>
          handleSeatClick(seat)
        }
        disabled={
          loadingSeat ||
          isTaken
        }
        className={`
          h-28
          rounded-2xl
          border-2
          transition
          hover:scale-105
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${color}
          ${
            isMine
              ? "bg-white/10"
              : "bg-neutral-900"
          }
        `}
      >

        <div className="font-bold uppercase">
          {seat}
        </div>

        <div className="mt-2 text-sm text-neutral-300">
          {player
            ? player.name
            : "Empty"}
        </div>

        {isMine && (
          <div className="mt-1 text-xs font-bold text-green-400">
            You
          </div>
        )}

        {isTaken && (
          <div className="mt-1 text-xs text-red-400">
            Taken
          </div>
        )}

      </button>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">

      <div className="mx-auto max-w-4xl p-8">

        <h1 className="text-center text-4xl font-black">
          ANDIVAL HOKM
        </h1>

        <p className="mt-2 text-center text-neutral-400">
          Choose Your Seat
        </p>

        {/* ROOM */}

        <div className="mt-8 rounded-2xl bg-neutral-900 p-6 text-center">

          <p className="text-sm text-neutral-500">
            ROOM CODE
          </p>

          <h2 className="mt-2 text-5xl font-black tracking-[8px]">
            {game.roomCode}
          </h2>

        </div>

        {/* SEATS */}

        <div className="mt-10 grid grid-cols-3 gap-6">

          <div />

          <SeatButton
            seat="top"
            color="border-blue-500"
            player={seats.top}
          />

          <div />

          <SeatButton
            seat="left"
            color="border-red-500"
            player={seats.left}
          />

          <div className="flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-lg font-black">
            TABLE
          </div>

          <SeatButton
            seat="right"
            color="border-red-500"
            player={seats.right}
          />

          <div />

          <SeatButton
            seat="bottom"
            color="border-blue-500"
            player={seats.bottom}
          />

          <div />

        </div>

        {/* PLAYER LIST */}

        <div className="mt-10 rounded-2xl bg-neutral-900 p-6">

          <div className="flex items-center justify-between">

            <h3 className="text-xl font-bold">
              Players
            </h3>

            <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm">
              {players.length}/4
            </span>

          </div>

          <div className="mt-5 space-y-3">

            {players.map(
              (player: any) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-neutral-800 p-3"
                >

                  <span className="font-medium">
                    {player.name}
                  </span>

                  <span className="text-sm text-neutral-400">
                    {player.seat
                      ? player.seat.toUpperCase()
                      : "NO SEAT"}
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        <p className="mt-8 text-center text-xs text-neutral-700">
          Player ID: {playerId}
        </p>

      </div>

    </main>
  );
}