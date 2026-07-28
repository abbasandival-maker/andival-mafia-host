import {
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function mafiaVote(
  gameId: string,
  playerId: string,
  targetId: string
) {
  // ثبت رأی گادفادر
  await setDoc(
    doc(db, "games", gameId, "mafiaVotes", playerId),
    {
      godfatherId: playerId,
      targetId,
      createdAt: Date.now(),
    }
  );

  // پایان اکشن شب گادفادر
  await updateDoc(
    doc(db, "games", gameId, "players", playerId),
    {
      canUseAbility: false,
    }
  );
}