import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export function listenPlayer(
  gameId: string,
  playerId: string,
  callback: (player: any) => void
) {
  return onSnapshot(
    doc(db, "games", gameId, "players", playerId),
    (snapshot) => {
      if (!snapshot.exists()) return;

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
    }
  );
}