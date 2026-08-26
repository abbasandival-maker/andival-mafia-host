"use client";

import { useEffect, useState } from "react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export function useHokmPrivateHand(
  gameId: string,
  playerId: string | null
) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !playerId) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handRef = doc(
      db,
      "hokm_games",
      gameId,
      "players",
      playerId,
      "private",
      "hand"
    );

    const unsubscribe = onSnapshot(
      handRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setCards([]);
          setLoading(false);
          return;
        }

        const data =
          snapshot.data();

        const newCards =
          Array.isArray(data.cards)
            ? data.cards
            : [];

        setCards(newCards);
        setLoading(false);
      },
      (snapshotError) => {
        console.error(
          "PRIVATE HAND LISTENER ERROR:",
          snapshotError
        );

        setError(
          "Unable to load private hand."
        );

        setCards([]);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId, playerId]);

  return {
    cards,
    loading,
    error,
  };
}