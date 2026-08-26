import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function getHokmPrivateHand(
  gameId: string,
  playerId: string
) {
  const handRef = doc(
    db,
    "hokm_games",
    gameId,
    "players",
    playerId,
    "private",
    "hand"
  );

  const snapshot = await getDoc(handRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.data();

  return Array.isArray(data.cards)
    ? data.cards
    : [];
}