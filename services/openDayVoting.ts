import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function openDayVoting(gameId: string) {
  const gameRef = doc(db, "games", gameId);

  await updateDoc(gameRef, {
    phase: "day",
  });
}