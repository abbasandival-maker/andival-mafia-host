import {
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export function listenPlayers(
  gameId: string,
  callback: (players: any[]) => void
) {
  const q = query(
    collection(db, "games", gameId, "players")
  );

  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(players);
  });
}