import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function sendMafiaMessage(
  gameId: string,
  senderId: string,
  senderName: string,
  message: string
) {
  const text = message.trim();

  if (!text) return;

  await addDoc(
    collection(db, "games", gameId, "mafiaChat"),
    {
      senderId,
      senderName,
      message: text,
      createdAt: serverTimestamp(),
    }
  );
}