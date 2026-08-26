"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { joinHokmGame } from "@/services/hokm/joinGame";

export default function HokmJoinPage() {
  const router = useRouter();

  const [roomCode, setRoomCode] =
    useState("");

  const [playerName, setPlayerName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleJoin() {
    if (loading) return;

    const cleanRoomCode =
      roomCode.trim().toUpperCase();

    const cleanPlayerName =
      playerName.trim();

    if (!cleanRoomCode) {
      alert("Room Code را وارد کنید.");
      return;
    }

    if (cleanRoomCode.length !== 6) {
      alert(
        "Room Code باید 6 کاراکتر باشد."
      );
      return;
    }

    if (!cleanPlayerName) {
      alert("نام خود را وارد کنید.");
      return;
    }

    if (cleanPlayerName.length > 20) {
      alert(
        "نام نمی‌تواند بیشتر از 20 کاراکتر باشد."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await joinHokmGame(
          cleanRoomCode,
          cleanPlayerName
        );

      router.push(
        `/hokm/player/${result.gameId}?playerId=${result.playerId}`
      );
    } catch (error: any) {
      console.error(
        "JOIN HOKM ERROR:",
        error
      );

      if (
        error?.message ===
        "GAME_NOT_FOUND"
      ) {
        alert("بازی پیدا نشد.");
      } else if (
        error?.message ===
        "GAME_ALREADY_STARTED"
      ) {
        alert(
          "این بازی قبلاً شروع شده است."
        );
      } else if (
        error?.message ===
        "GAME_FULL"
      ) {
        alert(
          "این بازی ظرفیت 4 بازیکن را تکمیل کرده است."
        );
      } else {
        alert(
          "خطا در ورود به بازی."
        );
      }

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-3xl border border-neutral-700 bg-neutral-900 p-8 shadow-2xl">

        {/* HEADER */}

        <h1 className="text-center text-4xl font-black">
          ANDIVAL HOKM
        </h1>

        <p className="mt-3 text-center text-neutral-400">
          Join Live Game
        </p>

        {/* ROOM CODE */}

        <div className="mt-10">

          <label className="mb-2 block text-sm font-medium text-neutral-400">
            Room Code
          </label>

          <input
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9]/g,
                    ""
                  )
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                handleJoin();
              }
            }}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-4 text-center text-2xl font-bold tracking-[6px] outline-none transition focus:border-red-500"
            placeholder="ABC123"
            maxLength={6}
            autoComplete="off"
          />

        </div>

        {/* PLAYER NAME */}

        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-neutral-400">
            Player Name
          </label>

          <input
            value={playerName}
            onChange={(e) =>
              setPlayerName(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                handleJoin();
              }
            }}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-4 outline-none transition focus:border-red-500"
            placeholder="Your Name"
            maxLength={20}
            autoComplete="off"
          />

        </div>

        {/* JOIN */}

        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-red-600 py-4 text-lg font-bold transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Joining..."
            : "JOIN GAME"}
        </button>

        {/* INFO */}

        <p className="mt-5 text-center text-xs text-neutral-500">
          Enter the 6-character room
          code provided by the host.
        </p>

      </div>

    </main>
  );
}