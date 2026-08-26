import { doc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";

export function listenHokmGame(
  gameId: string,
  callback: (game: any) => void
) {
  return onSnapshot(
    doc(db, "hokm_games", gameId),
    (snapshot) => {
      if (!snapshot.exists()) return;

      callback(snapshot.data());
    }
  );
}