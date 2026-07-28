import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function detectiveCheck(
  gameId: string,
  detectiveId: string,
  targetId: string
) {
  // اطلاعات کارآگاه
  const detectiveRef = doc(
    db,
    "games",
    gameId,
    "players",
    detectiveId
  );

  const detectiveSnap = await getDoc(detectiveRef);

  if (!detectiveSnap.exists()) {
    throw new Error("Detective not found");
  }

  const detective = detectiveSnap.data();

  // فقط یک بار در کل بازی
  if (detective.hasInvestigated) {
    throw new Error(
      "You have already used your investigation."
    );
  }

  // اطلاعات بازیکن هدف
  const targetRef = doc(
    db,
    "games",
    gameId,
    "players",
    targetId
  );

  const targetSnap = await getDoc(targetRef);

  if (!targetSnap.exists()) {
    throw new Error("Target not found");
  }

  const target = targetSnap.data();

  // نتیجه استعلام
  let result = "NOT MAFIA";

  if (target.role === "mafia") {
    result = "MAFIA";
  }

  // پدرخوانده برای کارآگاه شهروند محسوب می‌شود
  if (target.role === "godfather") {
    result = "NOT MAFIA";
  }

  // ثبت اکشن شب
  await setDoc(
    doc(
      db,
      "games",
      gameId,
      "detectiveActions",
      detectiveId
    ),
    {
      detectiveId,
      targetId,
      createdAt: Date.now(),
    }
  );

  // ذخیره نتیجه و قفل دائمی قابلیت
  await updateDoc(detectiveRef, {
    canUseAbility: false,
    hasInvestigated: true,
    investigatedPlayer: target.nickname,
    investigationResult: result,
  });

  // نمایش نتیجه در Alert
  return result;
}