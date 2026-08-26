"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useHokmGame } from "@/hooks/hokm/useHokmGame";
import { useHokmPlayers } from "@/hooks/hokm/useHokmPlayers";
import { useHokmPrivateHand } from "@/hooks/hokm/useHokmPrivateHand";

import {
  selectHokmTrump,
  TrumpSuit,
} from "@/services/hokm/selectTrump";

import SeatMap from "@/components/hokm/table/SeatMap";

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

export default function PlayerPage({ params }: Props) {
  const { gameId } = use(params);

  const searchParams = useSearchParams();
  const playerId = searchParams.get("playerId");

  const game = useHokmGame(gameId);
  const players = useHokmPlayers(gameId);

  const {
    cards: privateCards,
    loading: handLoading,
  } = useHokmPrivateHand(gameId, playerId);

  const [selectingTrump, setSelectingTrump] = useState(false);

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            ANDIVAL HOKM
          </h1>

          <p className="mt-3 text-neutral-500">
            Loading game...
          </p>
        </div>
      </main>
    );
  }

  const isHakem =
    !!playerId &&
    game.hakemPlayerId === playerId;

  const canChooseTrump =
    isHakem &&
    game.state === "CHOOSING_TRUMP";

  async function handleTrumpSelect(
    trumpSuit: TrumpSuit
  ) {
    if (!playerId) {
      alert("Player ID not found.");
      return;
    }

    if (!isHakem) {
      alert("فقط حاکم می‌تواند حکم را انتخاب کند.");
      return;
    }

    if (!canChooseTrump) {
      alert("الان زمان انتخاب حکم نیست.");
      return;
    }

    if (selectingTrump) return;

    try {
      setSelectingTrump(true);

      await selectHokmTrump(
        gameId,
        playerId,
        trumpSuit
      );
    } catch (error: any) {
      console.error(
        "TRUMP SELECTION ERROR:",
        error
      );

      switch (error.message) {
        case "GAME_NOT_FOUND":
          alert("بازی پیدا نشد.");
          break;

        case "ONLY_HAKEM_CAN_SELECT_TRUMP":
          alert("فقط حاکم می‌تواند حکم را انتخاب کند.");
          break;

        case "TRUMP_SELECTION_NOT_ALLOWED":
          alert("الان زمان انتخاب حکم نیست.");
          break;

        default:
          alert("خطا در انتخاب حکم.");
      }
    } finally {
      setSelectingTrump(false);
    }
  }

  function getSuitSymbol(suit: string) {
    switch (suit) {
      case "spades":
        return "♠";

      case "hearts":
        return "♥";

      case "diamonds":
        return "♦";

      case "clubs":
        return "♣";

      default:
        return "";
    }
  }

  function getSuitColor(suit: string) {
    if (
      suit === "hearts" ||
      suit === "diamonds"
    ) {
      return "text-red-500";
    }

    return "text-black";
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">

      <div className="mx-auto w-full max-w-5xl px-5 py-8">

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}

        <div className="text-center">

          <h1 className="text-4xl font-bold">
            ANDIVAL HOKM
          </h1>

          <p className="mt-2 text-neutral-500">
            Player Table
          </p>

        </div>

        {/* ============================= */}
        {/* GAME INFO */}
        {/* ============================= */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

            <p className="text-xs text-neutral-500">
              ROOM
            </p>

            <p className="mt-2 text-2xl font-bold tracking-widest">
              {game.roomCode}
            </p>

          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

            <p className="text-xs text-neutral-500">
              GAME STATUS
            </p>

            <p className="mt-2 font-bold">
              {game.state}
            </p>

          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

            <p className="text-xs text-neutral-500">
              YOUR ROLE
            </p>

            <p className="mt-2 font-bold">
              {isHakem ? "HAKEM 👑" : "PLAYER"}
            </p>

          </div>

        </div>

        {/* ============================= */}
        {/* TABLE */}
        {/* ============================= */}

        <section className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">

          <h2 className="mb-6 text-xl font-bold">
            Game Table
          </h2>

          <SeatMap
            players={players}
            currentPlayerId={playerId}
            disabled
          />

        </section>

        {/* ============================= */}
        {/* HAKEM SECTION */}
        {/* ============================= */}

        {isHakem && (
          <section className="mt-8 rounded-3xl border border-yellow-700/40 bg-neutral-900 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  👑 HAKEM
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Your first five cards
                </p>
              </div>

              <div className="rounded-full bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-400">
                  {game.state === "CHOOSING_TRUMP"
    ? `${privateCards.length}/5`
    : `${privateCards.length}/13`}
              </div>

            </div>

            {/* ============================= */}
            {/* CARDS */}
            {/* ============================= */}

            {game.state === "CHOOSING_TRUMP" && (
              <div className="mt-6">

                {handLoading ? (
                  <div className="rounded-2xl bg-neutral-800 p-8 text-center text-neutral-400">
                    Loading your cards...
                  </div>
                ) : privateCards.length === 0 ? (
                  <div className="rounded-2xl bg-neutral-800 p-8 text-center text-red-400">
                    Your cards could not be loaded.
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-3">

                    {privateCards.map(
                      (card: any) => (
                        <div
                          key={card.id}
                          className="
                            flex
                            h-36
                            w-24
                            items-center
                            justify-center
                            rounded-2xl
                            bg-white
                            text-black
                            shadow-xl
                          "
                        >

                          <div className="text-center">

                            <div className="text-2xl font-bold">
                              {card.rank}
                            </div>

                            <div
                              className={`mt-2 text-3xl ${getSuitColor(
                                card.suit
                              )}`}
                            >
                              {getSuitSymbol(
                                card.suit
                              )}
                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

            {/* ============================= */}
            {/* CHOOSE TRUMP */}
            {/* ============================= */}

            {canChooseTrump && (
              <div className="mt-8">

                <h3 className="text-center text-lg font-bold">
                  انتخاب خال حکم
                </h3>

                <p className="mt-2 text-center text-sm text-neutral-500">
                  یکی از چهار خال را انتخاب کنید
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">

                  <button
                    type="button"
                    disabled={selectingTrump}
                    onClick={() =>
                      handleTrumpSelect(
                        "spades"
                      )
                    }
                    className="
                      rounded-2xl
                      border
                      border-neutral-700
                      bg-neutral-800
                      p-6
                      text-4xl
                      transition
                      hover:scale-105
                      hover:bg-neutral-700
                      disabled:opacity-50
                    "
                  >
                    ♠
                    <span className="mt-2 block text-sm">
                      Spades
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={selectingTrump}
                    onClick={() =>
                      handleTrumpSelect(
                        "hearts"
                      )
                    }
                    className="
                      rounded-2xl
                      border
                      border-red-900
                      bg-neutral-800
                      p-6
                      text-4xl
                      text-red-500
                      transition
                      hover:scale-105
                      hover:bg-neutral-700
                      disabled:opacity-50
                    "
                  >
                    ♥
                    <span className="mt-2 block text-sm text-red-400">
                      Hearts
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={selectingTrump}
                    onClick={() =>
                      handleTrumpSelect(
                        "diamonds"
                      )
                    }
                    className="
                      rounded-2xl
                      border
                      border-red-900
                      bg-neutral-800
                      p-6
                      text-4xl
                      text-red-500
                      transition
                      hover:scale-105
                      hover:bg-neutral-700
                      disabled:opacity-50
                    "
                  >
                    ♦
                    <span className="mt-2 block text-sm text-red-400">
                      Diamonds
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={selectingTrump}
                    onClick={() =>
                      handleTrumpSelect(
                        "clubs"
                      )
                    }
                    className="
                      rounded-2xl
                      border
                      border-neutral-700
                      bg-neutral-800
                      p-6
                      text-4xl
                      transition
                      hover:scale-105
                      hover:bg-neutral-700
                      disabled:opacity-50
                    "
                  >
                    ♣
                    <span className="mt-2 block text-sm">
                      Clubs
                    </span>
                  </button>

                </div>

              </div>
            )}

            {/* ============================= */}
            {/* AFTER TRUMP */}
            {/* ============================= */}

            {isHakem &&
              game.state !== "CHOOSING_TRUMP" && (
                <div className="mt-6 rounded-2xl bg-neutral-800 p-5 text-center">

                  <p className="text-neutral-400">
                    Trump has been selected.
                  </p>

                  {game.trumpSuit && (
                    <p className="mt-3 text-5xl">
                      {getSuitSymbol(
                        game.trumpSuit
                      )}
                    </p>
                  )}

                </div>
              )}

          </section>
        )}

        {/* ============================= */}
        {/* NON-HAKEM WAITING */}
        {/* ============================= */}

        {!isHakem &&
          game.state === "CHOOSING_TRUMP" && (
            <section className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center">

              <div className="text-4xl">
                👑
              </div>

              <h2 className="mt-4 text-xl font-bold">
                Waiting for Hakem
              </h2>

              <p className="mt-2 text-neutral-500">
                حاکم در حال انتخاب خال حکم است...
              </p>

            </section>
          )}

        {/* ============================= */}
        {/* PLAYER ID */}
        {/* ============================= */}

        <p className="mt-8 text-center text-xs text-neutral-700">
          Player ID: {playerId}
        </p>

      </div>

    </main>
  );
}