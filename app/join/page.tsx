"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Ticket,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { joinGame } from "@/services/joinGame";

export default function JoinPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const cleanNickname = nickname.trim();
    const cleanGameId = gameId.trim();

    if (!cleanNickname) {
      alert("Please enter your nickname.");
      return;
    }

    if (!cleanGameId) {
      alert("Please enter the room code.");
      return;
    }

    if (cleanGameId.length !== 6) {
      alert("Please enter a valid 6-digit room code.");
      return;
    }

    try {
      setLoading(true);

      const playerId = await joinGame(
        cleanGameId,
        cleanNickname
      );

      localStorage.setItem("playerId", playerId);

      router.push(`/play/${cleanGameId}`);
    } catch (error) {
      console.error("JOIN GAME ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to join the game."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/join-background.png')",
        }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/25" />

      {/* DARK GRADIENT FOR FORM READABILITY */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/45" />

      {/* BACK BUTTON */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-30 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-yellow-500/50 hover:text-yellow-400 sm:left-5 sm:top-5 sm:px-4 sm:py-3"
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      {/* ================================
          CENTERED CONTENT
      ================================= */}
      <div className="relative z-20 flex h-full w-full items-center justify-center px-4 pt-8">

        <div className="w-full max-w-[430px]">

          {/* FORM CARD */}
          <div className="
            rounded-[24px]
            border
            border-white/15
            bg-black/70
            p-4
            shadow-2xl
            backdrop-blur-xl

            sm:rounded-[28px]
            sm:p-5

            md:p-6
          ">

            {/* FORM TITLE */}
            <div className="mb-4 text-center sm:mb-5">

              <h1 className="text-xl font-black tracking-wide text-white sm:text-2xl">
                JOIN THE GAME
              </h1>

              <p className="mt-1.5 text-xs text-zinc-400 sm:mt-2 sm:text-sm">
                Enter your details and join the Mafia room
              </p>

            </div>

            {/* NICKNAME */}
            <label className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300 sm:mb-2 sm:text-xs">

              <Users
                size={14}
                className="text-yellow-400"
              />

              Your Nickname

            </label>

            <input
              value={nickname}
              onChange={(e) =>
                setNickname(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  gameId.trim()
                ) {
                  handleJoin();
                }
              }}
              placeholder="Enter your nickname"
              autoComplete="nickname"
              maxLength={30}
              className="
                mb-3
                w-full
                rounded-xl
                border
                border-white/10
                bg-black/60
                px-4
                py-3
                text-sm
                text-white
                outline-none
                transition
                placeholder:text-zinc-600
                focus:border-yellow-500/70
                focus:ring-2
                focus:ring-yellow-500/20

                sm:mb-4
                sm:py-3.5
                sm:text-base
              "
            />

            {/* ROOM CODE */}
            <label className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300 sm:mb-2 sm:text-xs">

              <Ticket
                size={14}
                className="text-yellow-400"
              />

              6-Digit Room Code

            </label>

            <input
              value={gameId}
              onChange={(e) =>
                setGameId(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoin();
                }
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="
                mb-4
                w-full
                rounded-xl
                border
                border-white/10
                bg-black/60
                px-4
                py-3
                text-center
                font-mono
                text-lg
                font-black
                tracking-[0.3em]
                text-yellow-400
                outline-none
                transition
                placeholder:tracking-[0.2em]
                placeholder:text-zinc-700
                focus:border-yellow-500/70
                focus:ring-2
                focus:ring-yellow-500/20

                sm:mb-5
                sm:py-3.5
                sm:text-xl
              "
            />

            {/* JOIN BUTTON */}
            <Button
              onClick={handleJoin}
              disabled={loading}
            >
              {loading
                ? "ENTERING THE ROOM..."
                : "ENTER THE GAME"}
            </Button>

          </div>

          {/* FOOTER */}
          <div className="mt-3 text-center">
            <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/45 sm:text-[10px]">
              ANDIVAL MAFIA HOST
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}