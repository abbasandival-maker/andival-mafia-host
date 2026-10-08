import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function doctorSave(gameId: string, playerId: string, targetId: string) {
  const playerRef = doc(db, "games", gameId, "players", playerId);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) throw new Error("DOCTOR_NOT_FOUND");

  const player = playerSnap.data();
  if (player.role !== "doctor") throw new Error("NOT_DOCTOR");
  if (player.alive === false) throw new Error("DEAD_PLAYER");
  if (player.canUseAbility === false) throw new Error("ABILITY_ALREADY_USED_TONIGHT");

  if (targetId === playerId && player.hasSelfSaved === true) {
    throw new Error("DOCTOR_SELF_SAVE_ALREADY_USED");
  }

  const targetRef = doc(db, "games", gameId, "players", targetId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists() || targetSnap.data().alive === false) {
    throw new Error("INVALID_SAVE_TARGET");
  }

  await setDoc(doc(db, "games", gameId, "doctorActions", playerId), {
    doctorId: playerId,
    targetId,
    createdAt: Date.now(),
  });

  await updateDoc(playerRef, {
    canUseAbility: false,
    ...(targetId === playerId ? { hasSelfSaved: true } : {}),
  });
}
