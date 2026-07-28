import {
  collection,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { generateRoles } from "./roleService";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export async function startGame(gameId: string) {
  // دریافت بازیکنان
  const snapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  const players = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (players.length < 6) {
    throw new Error("Minimum 6 players required.");
  }

  // ساخت نقش‌ها
  const roles = shuffle(generateRoles(players.length));

  // تصادفی کردن ترتیب بازیکنان
  const shuffledPlayers = shuffle(players);

  // ذخیره نقش‌ها
  const batch = writeBatch(db);

  shuffledPlayers.forEach((player, index) => {
    batch.update(
      doc(db, "games", gameId, "players", player.id),
      {
        role: roles[index],

        alive: true,
        eliminated: false,

        vote: null,

        canVote: true,
        canUseAbility: true,

        // وضعیت قابلیت‌ها
        hasInvestigated: false, // کارآگاه فقط یک بار در کل بازی
        investigatedPlayer: "",
        investigationResult: "",

        sniperTarget: null,
        sniperResult: "",
      }
    );
  });

  await batch.commit();

  // شروع بازی
  await updateDoc(
    doc(db, "games", gameId),
    {
      status: "playing",
      phase: "night",
      currentDay: 1,
      startedAt: serverTimestamp(),
    }
  );

  console.log("Game Started:", gameId);
}