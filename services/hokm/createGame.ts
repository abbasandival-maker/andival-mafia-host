import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";

import { db } from "@/lib/firebase";

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createHokmGame() {
  const gameId = nanoid(12);

  const roomCode = generateRoomCode();

  await setDoc(doc(db, "hokm_games", gameId), {
    id: gameId,
    roomCode,
    gameType: "hokm",
    state: "WAITING_FOR_PLAYERS",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    gameId,
    roomCode,
  };
}