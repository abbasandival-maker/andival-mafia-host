import {
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function dayVote(
  gameId: string,
  playerId: string,
  targetId: string
) {
  // ثبت رأی روز
  await setDoc(
    doc(
      db,
      "games",
      gameId,
      "dayVotes",
      playerId
    ),
    {
      playerId,
      targetId,
      createdAt: Date.now(),
    }
  );

  // قفل شدن رأی این روز
  await updateDoc(
    doc(
      db,
      "games",
      gameId,
      "players",
      playerId
    ),
    {
      canVote: false,
      vote: targetId,
    }
  );
}