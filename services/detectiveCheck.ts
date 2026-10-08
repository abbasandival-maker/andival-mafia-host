import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const isMafiaRole = (role: string) =>
  role === "godfather" || role === "savval_goodman" || role === "mafia";

export async function detectiveCheck(gameId: string, detectiveId: string, targetId: string) {
  const detectiveRef = doc(db, "games", gameId, "players", detectiveId);
  const detectiveSnap = await getDoc(detectiveRef);
  if (!detectiveSnap.exists()) throw new Error("Detective not found");
  const detective = detectiveSnap.data();
  if (detective.role !== "detective") throw new Error("NOT_DETECTIVE");
  if (detective.hasInvestigated) throw new Error("You have already used your investigation.");
  if (detective.alive === false) throw new Error("DEAD_PLAYER");

  const targetRef = doc(db, "games", gameId, "players", targetId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) throw new Error("Target not found");
  const target = targetSnap.data();
  if (target.alive === false) throw new Error("INVALID_TARGET");

  const result = isMafiaRole(target.role) ? "MAFIA" : "NOT MAFIA";

  await setDoc(doc(db, "games", gameId, "detectiveActions", detectiveId), {
    detectiveId,
    targetId,
    createdAt: Date.now(),
  });

  await updateDoc(detectiveRef, {
    canUseAbility: false,
    hasInvestigated: true,
    investigatedPlayer: target.nickname,
    investigationResult: result,
  });

  return result;
}
