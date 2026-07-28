import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type MafiaMessage = {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt?: any;
};

export function listenMafiaChat(
  gameId: string,
  callback: (messages: MafiaMessage[]) => void
) {
  const q = query(
    collection(db, "games", gameId, "mafiaChat"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MafiaMessage, "id">),
      }))
    );
  });
}