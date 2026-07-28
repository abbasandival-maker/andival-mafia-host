import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export function listenGamePlayers(
  gameId: string,
  callback: (players: any[]) => void
) {
  return onSnapshot(
    collection(db, "games", gameId, "players"),
    (snapshot) => {
      callback(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    }
  );
}