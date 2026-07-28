import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export function listenGame(
  gameId: string,
  callback: (game: any) => void
) {
  return onSnapshot(
    doc(db, "games", gameId),
    (snapshot) => {
      callback(snapshot.data());
    }
  );
}