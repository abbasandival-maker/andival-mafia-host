import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

function generateNumericRoomCode(): string {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

export async function createGame(roomName: string) {
  console.log("GAME SERVICE 1");

  let gameId = "";
  let exists = true;

  // ساخت کد ۶ رقمی عددی و جلوگیری از تکراری بودن
  while (exists) {
    gameId = generateNumericRoomCode();

    const gameSnapshot = await getDoc(
      doc(db, "games", gameId)
    );

    exists = gameSnapshot.exists();
  }

  console.log("GAME SERVICE 2", gameId);

  try {
    await setDoc(
      doc(db, "games", gameId),
      {
        id: gameId,

        roomName,

        status: "lobby",

        phase: "waiting",

        createdAt: serverTimestamp(),

        currentDay: 1,

        maxPlayers: 20,

        alivePlayers: 0,

        roomCode: gameId,
      }
    );

    console.log("GAME SERVICE 3");

    return gameId;
  } catch (error) {
    console.error("FIRESTORE ERROR:", error);

    throw error;
  }
}