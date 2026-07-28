import {
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function sniperShoot(
  gameId: string,
  sniperId: string,
  targetId: string | null
) {
  // ثبت اکشن اسنایپر
  await setDoc(
    doc(db, "games", gameId, "sniperActions", sniperId),
    {
      sniperId,
      targetId: targetId ?? "SKIP",
      createdAt: Date.now(),
    }
  );

  // قفل شدن قابلیت تا پایان شب
  await updateDoc(
    doc(db, "games", gameId, "players", sniperId),
    {
      canUseAbility: false,
    }
  );

  return targetId === null ? "SKIP" : "HIT";
}