import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function checkWinner(gameId: string) {
  const snapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  const players = snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((p: any) => p.alive);

  // تمام مافیاهای زنده (گادفادر + مافیای ساده)
  const mafiaAlive = players.filter(
    (p: any) =>
      p.role === "godfather" ||
      p.role === "mafia"
  );

  // تمام شهروندهای زنده
  const citizensAlive = players.filter(
    (p: any) =>
      p.role !== "godfather" &&
      p.role !== "mafia"
  );

  // فقط وقتی هیچ مافیایی زنده نباشد شهروندها برنده‌اند
  if (mafiaAlive.length === 0) {
    await updateDoc(doc(db, "games", gameId), {
      status: "finished",
      winner: "citizens",
    });

    return "citizens";
  }

  // اگر تعداد مافیاها برابر یا بیشتر از شهروندها شد، مافیا برنده است
  if (mafiaAlive.length >= citizensAlive.length) {
    await updateDoc(doc(db, "games", gameId), {
      status: "finished",
      winner: "mafia",
    });

    return "mafia";
  }

  // بازی ادامه دارد
  return null;
}