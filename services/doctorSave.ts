import {
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function doctorSave(
  gameId: string,
  playerId: string,
  targetId: string
) {
  // ثبت اکشن دکتر
  await setDoc(
    doc(db, "games", gameId, "doctorActions", playerId),
    {
      doctorId: playerId,
      targetId: targetId,
      createdAt: Date.now(),
    }
  );

  // قفل شدن قابلیت تا پایان شب
  await updateDoc(
    doc(db, "games", gameId, "players", playerId),
    {
      canUseAbility: false,
    }
  );
}