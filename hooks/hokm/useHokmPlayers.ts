"use client";

import { useEffect, useState } from "react";

import { listenHokmPlayers } from "@/services/hokm/listenPlayers";

export function useHokmPlayers(gameId: string) {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = listenHokmPlayers(
      gameId,
      setPlayers
    );

    return unsubscribe;
  }, [gameId]);

  return players;
}