import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function joinGame(
  gameId: string,
  playerId: string,
  nickname: string
) {
  await setDoc(
    doc(db, "games", gameId, "players", playerId),
    {
      nickname,
      status: "ALIVE",
      role: null,

      joinedAt: serverTimestamp(),

      canVote: true,
      canUseAbility: true,

      connected: true,
    }
  );
}