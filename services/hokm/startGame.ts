import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { dealFirstFive } from "@/services/hokm/dealFirstFive";

type HokmPlayer = {
  id: string;
  name: string;
  seat: "top" | "right" | "bottom" | "left";
  team: "A" | "B" | null;
};

export async function startHokmGame(
  gameId: string
) {
  const gameRef = doc(
    db,
    "hokm_games",
    gameId
  );

  // =========================================
  // PLAYERS
  // =========================================

  const playersSnapshot = await getDocs(
    collection(
      db,
      "hokm_games",
      gameId,
      "players"
    )
  );

  const players: HokmPlayer[] =
    playersSnapshot.docs.map(
      (snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      })
    ) as HokmPlayer[];

  // =========================================
  // 1. دقیقاً 4 بازیکن
  // =========================================

  if (players.length !== 4) {
    throw new Error(
      "FOUR_PLAYERS_REQUIRED"
    );
  }

  // =========================================
  // 2. همه بازیکنان باید صندلی داشته باشند
  // =========================================

  const playersWithoutSeat =
    players.filter(
      (player) => !player.seat
    );

  if (playersWithoutSeat.length > 0) {
    throw new Error(
      "ALL_PLAYERS_NEED_SEATS"
    );
  }

  // =========================================
  // 3. صندلی‌ها باید یکتا باشند
  // =========================================

  const seats = players.map(
    (player) => player.seat
  );

  if (new Set(seats).size !== 4) {
    throw new Error("INVALID_SEATS");
  }

  // =========================================
  // 4. حاکم اولیه
  // =========================================

  const hakem = players.find(
    (player) =>
      player.seat === "bottom"
  );

  if (!hakem) {
    throw new Error("HAKEM_NOT_FOUND");
  }

  // =========================================
  // 5. قفل شروع بازی
  // =========================================

  await updateDoc(gameRef, {
    state: "DEALING_FIRST_FIVE",
    phase: "DEALING_FIRST_FIVE",

    hakemPlayerId: hakem.id,
    hakemSeat: hakem.seat,

    trumpSuit: null,

    currentTurnPlayerId: null,

    trickNumber: 0,

    score: {
      teamA: 0,
      teamB: 0,
    },

    winnerTeam: null,

    updatedAt: serverTimestamp(),
  });

  // =========================================
  // 6. تقسیم 5 کارت اول
  //
  // LEFT    → 5
  // BOTTOM  → 5
  // RIGHT   → 5
  // TOP     → 5
  //
  // مجموع = 20
  // =========================================

  const dealResult =
    await dealFirstFive(gameId);

  console.log(
    "FIRST FIVE DEALT:",
    dealResult
  );

  // =========================================
  // RESULT
  // =========================================

  return {
    hakemPlayerId: hakem.id,
    hakemSeat: hakem.seat,

    cardsDealt:
      dealResult.cardsDealt,

    remainingCards:
      dealResult.remainingCards,

    state:
      dealResult.state,
  };
}