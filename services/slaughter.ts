import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SlaughterRole = "doctor" | "detective" | "sniper";

export async function useSlaughter(
  gameId: string,
  godfatherId: string,
  targetId: string,
  guessedRole: SlaughterRole
) {
  const actorRef = doc(
    db,
    "games",
    gameId,
    "players",
    godfatherId
  );

  const targetRef = doc(
    db,
    "games",
    gameId,
    "players",
    targetId
  );

  const [actorSnap, targetSnap] = await Promise.all([
    getDoc(actorRef),
    getDoc(targetRef),
  ]);

  if (!actorSnap.exists()) {
    throw new Error("GODFATHER_NOT_FOUND");
  }

  if (!targetSnap.exists()) {
    throw new Error("TARGET_NOT_FOUND");
  }

  const actor = actorSnap.data();
  const target = targetSnap.data();

  // فقط Godfather می‌تواند Slaughter استفاده کند
  if (actor.role !== "godfather") {
    throw new Error("NOT_GODFATHER");
  }

  if (actor.alive === false) {
    throw new Error("DEAD_PLAYER");
  }

  // Slaughter فقط یک بار در کل بازی
  if (actor.slaughterUsed === true) {
    throw new Error("SLAUGHTER_ALREADY_USED");
  }

  // Godfather نمی‌تواند خودش را انتخاب کند
  if (targetId === godfatherId) {
    throw new Error("INVALID_SLAUGHTER_TARGET");
  }

  // بازیکن مرده قابل انتخاب نیست
  if (target.alive === false) {
    throw new Error("INVALID_SLAUGHTER_TARGET");
  }

  // نقش انتخاب‌شده باید معتبر باشد
  if (
    !["doctor", "detective", "sniper"].includes(
      guessedRole
    )
  ) {
    throw new Error("INVALID_SLAUGHTER_ROLE");
  }

  // بررسی حدس
  const correct = target.role === guessedRole;

  // ثبت اکشن Slaughter
  await setDoc(
    doc(
      db,
      "games",
      gameId,
      "slaughterActions",
      godfatherId
    ),
    {
      godfatherId,
      targetId,
      guessedRole,
      correct,
      createdAt: Date.now(),
    }
  );

  // مصرف شدن Slaughter
  //
  // مهم:
  // canUseAbility را تغییر نمی‌دهیم.
  // بنابراین Night Kill کاملاً مستقل باقی می‌ماند.
  //
  // حتی اگر حدس اشتباه باشد، slaughterUsed = true می‌شود.
  await updateDoc(actorRef, {
    slaughterUsed: true,
  });

  return {
    correct,
    targetId,
    guessedRole,
  };
}