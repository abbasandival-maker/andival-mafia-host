import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { nanoid } from "nanoid";

import { db } from "@/lib/firebase";

export async function joinHokmGame(
  roomCode: string,
  playerName: string
) {
  // پیدا کردن بازی با Room Code
  const gameQuery = query(
    collection(db, "hokm_games"),
    where("roomCode", "==", roomCode)
  );

  const gameSnapshot = await getDocs(gameQuery);

  if (gameSnapshot.empty) {
    throw new Error("GAME_NOT_FOUND");
  }

  const gameDoc = gameSnapshot.docs[0];

  const gameId = gameDoc.id;

  const playerId = nanoid(12);

  await setDoc(
    doc(db, "hokm_games", gameId, "players", playerId),
    {
      id: playerId,
      name: playerName.trim(),

      seat: null,
      team: null,

      isHost: false,
      isReady: false,

      connected: true,

      joinedAt: serverTimestamp(),
    }
  );

  return {
    gameId,
    playerId,
  };
}