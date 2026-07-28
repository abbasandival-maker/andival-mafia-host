import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nanoid } from "nanoid";

export async function createGame(roomName: string) {

  console.log("GAME SERVICE 1");

  const gameId = nanoid(6).toUpperCase();

  console.log("GAME SERVICE 2", gameId);

  try {

    await setDoc(doc(db, "games", gameId), {

      id: gameId,

      roomName,

      status: "lobby",

      phase: "waiting",

      createdAt: serverTimestamp(),

      currentDay: 1,

      maxPlayers: 20,

      alivePlayers: 0,

    });

    console.log("GAME SERVICE 3");

    return gameId;

  } catch (error) {

    console.error("FIRESTORE ERROR:", error);

    throw error;

  }

}