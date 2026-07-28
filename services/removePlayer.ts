import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function removePlayer(
  gameId: string,
  playerId: string
) {
  await deleteDoc(doc(db, "games", gameId, "players", playerId));
}