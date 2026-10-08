import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function buyCitizen(gameId: string, savvalId: string, targetId: string) {
  const actorRef = doc(db, "games", gameId, "players", savvalId);
  const targetRef = doc(db, "games", gameId, "players", targetId);
  const [actorSnap, targetSnap] = await Promise.all([getDoc(actorRef), getDoc(targetRef)]);

  if (!actorSnap.exists()) throw new Error("SAVVAL_NOT_FOUND");
  if (!targetSnap.exists()) throw new Error("TARGET_NOT_FOUND");

  const actor = actorSnap.data();
  const target = targetSnap.data();

  if (actor.role !== "savval_goodman") throw new Error("NOT_SAVVAL_GOODMAN");
  if (actor.alive === false) throw new Error("DEAD_PLAYER");
  if (actor.purchaseUsed === true) throw new Error("PURCHASE_ALREADY_USED");
  if (targetId === savvalId || target.alive === false) throw new Error("INVALID_PURCHASE_TARGET");

  const success = target.role === "citizen";
  const createdAt = Date.now();

  await setDoc(doc(db, "games", gameId, "purchaseActions", savvalId), {
    savvalId,
    targetId,
    success,
    createdAt,
  });

  await updateDoc(actorRef, {
    purchaseUsed: true,
    canUseAbility: false,
  });

  // A successful purchase is immediate: the selected simple citizen
  // becomes Mafia during the same night, so their own live client updates
  // immediately and they can see their Mafia teammates. They do not get a
  // second Mafia shot in the same night.
  if (success) {
    await updateDoc(targetRef, {
      role: "mafia",
      purchasedThisNight: true,
      purchasedBy: savvalId,
      purchasedAt: createdAt,
      canUseAbility: false,
    });
  }

  return { success };
}
