import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { dealRemainingCards } from "@/services/hokm/dealRemaining";

export type TrumpSuit =
  | "spades"
  | "hearts"
  | "diamonds"
  | "clubs";

const VALID_TRUMP_SUITS: TrumpSuit[] = [
  "spades",
  "hearts",
  "diamonds",
  "clubs",
];

export async function selectHokmTrump(
  gameId: string,
  playerId: string,
  trumpSuit: TrumpSuit
) {
  // =========================================
  // GAME
  // =========================================

  const gameRef = doc(
    db,
    "hokm_games",
    gameId
  );

  const gameSnapshot =
    await getDoc(gameRef);

  if (!gameSnapshot.exists()) {
    throw new Error(
      "GAME_NOT_FOUND"
    );
  }

  const game =
    gameSnapshot.data();

  // =========================================
  // STATE CHECK
  // =========================================

  if (
    game.state !==
    "CHOOSING_TRUMP"
  ) {
    throw new Error(
      "TRUMP_SELECTION_NOT_ALLOWED"
    );
  }

  // =========================================
  // HAKEM CHECK
  // =========================================

  if (!game.hakemPlayerId) {
    throw new Error(
      "HAKEM_NOT_FOUND"
    );
  }

  if (
    game.hakemPlayerId !==
    playerId
  ) {
    throw new Error(
      "ONLY_HAKEM_CAN_SELECT_TRUMP"
    );
  }

  // =========================================
  // TRUMP VALIDATION
  // =========================================

  if (
    !VALID_TRUMP_SUITS.includes(
      trumpSuit
    )
  ) {
    throw new Error(
      "INVALID_TRUMP_SUIT"
    );
  }

  // =========================================
  // SAVE TRUMP
  // =========================================

  await updateDoc(gameRef, {
    trumpSuit,

    state:
      "DEALING_REMAINING",

    phase:
      "DEALING_REMAINING",

    currentTurnPlayerId:
      null,

    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // DEAL REMAINING CARDS
  // =========================================

  const result =
    await dealRemainingCards(
      gameId
    );

  // =========================================
  // RESULT
  // =========================================

  return {
    trumpSuit,

    state:
      result.state,

    cardsDealt:
      result.cardsDealt,

    totalCardsDealt:
      result.totalCardsDealt,

    cardsPerPlayer:
      result.cardsPerPlayer,

    firstPlayerId:
      result.firstPlayerId,

    firstPlayerSeat:
      result.firstPlayerSeat,
  };
}