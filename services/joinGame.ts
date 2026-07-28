import {
  addDoc,
  collection,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function joinGame(
  gameId: string,
  nickname: string
) {
  const docRef = await addDoc(
    collection(db, "games", gameId, "players"),
    {
      nickname,
      status: "connected",
      alive: true,
      eliminated: false,
      role: "",
      vote: null,
      canVote: true,
      canUseAbility: true,
    }
  );

  return docRef.id;
}