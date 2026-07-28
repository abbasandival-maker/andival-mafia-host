"use client";

import { use } from "react";

type Props = {
  params: Promise<{
    gameId: string;
  }>;
};

export default function PlayerPage({ params }: Props) {
  const { gameId } = use(params);

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Player Page</h1>

      <p className="mt-4 text-yellow-400">
        Room: {gameId}
      </p>
    </main>
  );
}