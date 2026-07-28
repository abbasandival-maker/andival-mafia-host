"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Play } from "lucide-react";

import Button from "@/components/ui/Button";
import { listenPlayers } from "@/services/listenPlayers";

type Player = {
  id: string;
  nickname: string;
  status: string;
};

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

export default function HostPage({ params }: Props) {
  const { gameId } = use(params);

  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const unsubscribe = listenPlayers(gameId, (data) => {
      setPlayers(data as Player[]);
    });

    return () => unsubscribe();
  }, [gameId]);

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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="text-4xl font-black">
              Host Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Room Code
            </p>

            <h2 className="text-3xl font-bold text-yellow-400">
              {gameId}
            </h2>

          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-700 px-6 py-4">

            <div className="flex items-center gap-3">

              <Users />

              <div>

                <p className="text-gray-400 text-sm">
                  Players
                </p>

                <p className="text-2xl font-bold">
                  {players.length}
                </p>

              </div>

            </div>

          </div>

        </div>

        <div className="mt-10 rounded-xl border border-zinc-700 bg-zinc-900">

          <div className="border-b border-zinc-700 p-5">

            <h3 className="text-xl font-bold">
              Connected Players
            </h3>

          </div>

          {players.length === 0 && (

            <div className="p-8 text-center text-gray-500">
              Waiting for players...
            </div>

          )}

          {players.map((player) => (

            <div
              key={player.id}
              className="flex items-center justify-between border-b border-zinc-800 p-4 last:border-0"
            >

              <div className="flex items-center gap-3">

                <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black">
                  {player.nickname.charAt(0).toUpperCase()}
                </div>

                <div>

                  <p className="font-semibold">
                    {player.nickname}
                  </p>

                  <p className="text-sm text-gray-400">
                    {player.status}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

        <div className="mt-8">

          <Button
            disabled={players.length < 5}
          >
            <Play size={18} />

            Start Game
          </Button>

          {players.length < 5 && (

            <p className="mt-3 text-sm text-gray-500">
              At least 5 players are required.
            </p>

          )}

        </div>

      </div>

    </main>
  );
}