"use client";

import { useEffect, useState } from "react";

import { listenHokmGame } from "@/services/hokm/listenGame";

export function useHokmGame(gameId: string) {
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = listenHokmGame(gameId, setGame);

    return unsubscribe;
  }, [gameId]);

  return game;
}