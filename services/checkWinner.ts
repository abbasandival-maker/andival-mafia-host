import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function checkWinner(gameId: string) {
  const snapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  const players = snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((p: any) => p.alive);

  const mafiaAlive = players.filter(
    (p: any) => p.role === "mafia"
  ).length;

  const citizensAlive = players.filter(
    (p: any) => p.role !== "mafia"
  ).length;

  if (mafiaAlive === 0) {
    await updateDoc(
      doc(db, "games", gameId),
      {
        status: "finished",
        winner: "citizens",
      }
    );

    return "citizens";
  }

  if (mafiaAlive >= citizensAlive) {
    await updateDoc(
      doc(db, "games", gameId),
      {
        status: "finished",
        winner: "mafia",
      }
    );

    return "mafia";
  }

  return null;
}