import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Player = {
  id: string;
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function buildRoles(playerCount: number): string[] {
  switch (playerCount) {
    case 6:
      return [
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "citizen",
        "citizen",
      ];

    case 7:
      return [
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "citizen",
        "citizen",
        "citizen",
      ];

    case 8:
      return [
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
      ];

    case 9:
      return [
        "mafia",
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
      ];

    default:
      return [
        "mafia",
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
        "citizen",
      ];
  }
}

export async function assignRoles(gameId: string) {
  const snapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  const players: Player[] = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
  }));

  if (players.length < 6) {
    throw new Error("Minimum 6 players required.");
  }

  const shuffledPlayers = shuffle(players);

  const shuffledRoles = shuffle(
    buildRoles(players.length)
  );

  const batch = writeBatch(db);

  shuffledPlayers.forEach((player, index) => {
    batch.update(
      doc(db, "games", gameId, "players", player.id),
      {
        role: shuffledRoles[index],
        alive: true,
      }
    );
  });

  await batch.commit();

  return true;
}