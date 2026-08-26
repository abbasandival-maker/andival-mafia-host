import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { HokmCard } from "@/engine/hokm/dealer/deck";

type Player = {
  id: string;
  name: string;
  seat: "top" | "right" | "bottom" | "left";
  team: "A" | "B" | null;
};

/*
 * =========================================
 * ترتیب ثابت بازی ANDIVAL HOKM
 * =========================================
 *
 * LEFT → BOTTOM → RIGHT → TOP
 *
 * اگر حاکم BOTTOM باشد:
 *
 * LEFT اولین بازیکن Trick اول است.
 *
 * همین ترتیب برای تقسیم کارت نیز استفاده می‌شود.
 */

const DEAL_ORDER = [
  "left",
  "bottom",
  "right",
  "top",
] as const;

export async function dealRemainingCards(
  gameId: string
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
  // STATE
  // =========================================

  if (
    game.state !==
    "DEALING_REMAINING"
  ) {
    throw new Error(
      "DEALING_NOT_ALLOWED"
    );
  }

  // =========================================
  // TRUMP
  // =========================================

  if (!game.trumpSuit) {
    throw new Error(
      "TRUMP_NOT_SELECTED"
    );
  }

  // =========================================
  // HAKEM
  // =========================================

  if (!game.hakemPlayerId) {
    throw new Error(
      "HAKEM_NOT_FOUND"
    );
  }

  // =========================================
  // PLAYERS
  // =========================================

  const playersSnapshot =
    await getDocs(
      collection(
        db,
        "hokm_games",
        gameId,
        "players"
      )
    );

  const players =
    playersSnapshot.docs.map(
      (snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      })
    ) as Player[];

  if (players.length !== 4) {
    throw new Error(
      "FOUR_PLAYERS_REQUIRED"
    );
  }

  // =========================================
  // ORDER PLAYERS
  // =========================================

  const orderedPlayers =
    DEAL_ORDER.map(
      (seat) => {
        const player =
          players.find(
            (item) =>
              item.seat === seat
          );

        if (!player) {
          throw new Error(
            `PLAYER_NOT_FOUND_${seat.toUpperCase()}`
          );
        }

        return player;
      }
    );

  // =========================================
  // DECK
  // =========================================

  const deckRef = doc(
    db,
    "hokm_games",
    gameId,
    "state",
    "deck"
  );

  const deckSnapshot =
    await getDoc(deckRef);

  if (!deckSnapshot.exists()) {
    throw new Error(
      "DECK_NOT_FOUND"
    );
  }

  const deckData =
    deckSnapshot.data();

  const deck =
    Array.isArray(
      deckData.cards
    )
      ? (deckData.cards as HokmCard[])
      : [];

  if (deck.length !== 52) {
    throw new Error(
      "INVALID_DECK"
    );
  }

  // =========================================
  // FIRST DEAL VERIFICATION
  // =========================================

  /*
   * dealFirstFive:
   *
   * LEFT    = 5
   * BOTTOM  = 5
   * RIGHT   = 5
   * TOP     = 5
   *
   * مجموع = 20
   */

  const dealtCount =
    typeof deckData.dealtCount ===
    "number"
      ? deckData.dealtCount
      : 20;

  if (dealtCount !== 20) {
    throw new Error(
      "INVALID_FIRST_DEAL_COUNT"
    );
  }

  // =========================================
  // REMAINING 32 CARDS
  // =========================================

  /*
   * بسیار مهم:
   *
   * کارت‌های 0 تا 19 قبلاً پخش شده‌اند.
   *
   * بنابراین:
   *
   * slice(20)
   *
   * نه slice(5)
   */

  const remainingDeck =
    deck.slice(20);

  if (
    remainingDeck.length !== 32
  ) {
    throw new Error(
      "INVALID_REMAINING_DECK"
    );
  }

  // =========================================
  // CURSOR
  // =========================================

  let cursor = 0;

  // =========================================
  // SECOND DEAL
  // =========================================

  /*
   * هر نفر 4 کارت
   *
   * LEFT    +4
   * BOTTOM  +4
   * RIGHT   +4
   * TOP     +4
   *
   * بعد از این مرحله:
   *
   * هر نفر = 9 کارت
   */

  for (
    const player of orderedPlayers
  ) {
    const cards =
      remainingDeck.slice(
        cursor,
        cursor + 4
      );

    if (cards.length !== 4) {
      throw new Error(
        "INVALID_SECOND_DEAL"
      );
    }

    cursor += 4;

    await appendCardsToPlayer(
      gameId,
      player.id,
      cards,
      5,
      9
    );
  }

  // =========================================
  // THIRD DEAL
  // =========================================

  /*
   * هر نفر دوباره 4 کارت
   *
   * بعد از این مرحله:
   *
   * 9 + 4 = 13
   */

  for (
    const player of orderedPlayers
  ) {
    const cards =
      remainingDeck.slice(
        cursor,
        cursor + 4
      );

    if (cards.length !== 4) {
      throw new Error(
        "INVALID_THIRD_DEAL"
      );
    }

    cursor += 4;

    await appendCardsToPlayer(
      gameId,
      player.id,
      cards,
      9,
      13
    );
  }

  // =========================================
  // VERIFY 32 CARDS
  // =========================================

  if (cursor !== 32) {
    throw new Error(
      "DEAL_COUNT_MISMATCH"
    );
  }

  // =========================================
  // VERIFY ALL PLAYERS HAVE 13
  // =========================================

  for (
    const player of orderedPlayers
  ) {
    const handRef = doc(
      db,
      "hokm_games",
      gameId,
      "players",
      player.id,
      "private",
      "hand"
    );

    const handSnapshot =
      await getDoc(handRef);

    if (!handSnapshot.exists()) {
      throw new Error(
        `HAND_NOT_FOUND_${player.id}`
      );
    }

    const handData =
      handSnapshot.data();

    const cards =
      Array.isArray(
        handData.cards
      )
        ? handData.cards
        : [];

    if (cards.length !== 13) {
      throw new Error(
        `INVALID_FINAL_HAND_${player.seat.toUpperCase()}`
      );
    }
  }

  // =========================================
  // DECK COMPLETE
  // =========================================

  await updateDoc(deckRef, {
    dealtCount: 52,
    remainingCards: [],
    remainingCount: 0,
    completed: true,
    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // FIRST PLAYER
  // =========================================

  /*
   * حاکم = BOTTOM
   *
   * ترتیب:
   *
   * LEFT → BOTTOM → RIGHT → TOP
   *
   * بنابراین:
   *
   * LEFT شروع‌کننده Trick اول است.
   */

  const firstPlayer =
    orderedPlayers.find(
      (player) =>
        player.seat === "left"
    );

  if (!firstPlayer) {
    throw new Error(
      "FIRST_PLAYER_NOT_FOUND"
    );
  }

  // =========================================
  // INITIAL CURRENT TRICK
  // =========================================

  const trickRef = doc(
    db,
    "hokm_games",
    gameId,
    "state",
    "currentTrick"
  );

  await setDoc(trickRef, {
    cards: [],
    leadSuit: null,
    winnerPlayerId: null,
    winnerTeam: null,
    winningCard: null,
    completed: false,
    trickNumber: 1,
    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // START PLAYING
  // =========================================

  await updateDoc(gameRef, {
    state: "PLAYING",
    phase: "PLAYING",

    currentTurnPlayerId:
      firstPlayer.id,

    trickNumber: 1,

    trumpSuit:
      game.trumpSuit,

    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // RESULT
  // =========================================

  return {
    trumpSuit:
      game.trumpSuit,

    cardsDealt: 32,

    totalCardsDealt: 52,

    cardsPerPlayer: 13,

    firstPlayerId:
      firstPlayer.id,

    firstPlayerSeat:
      firstPlayer.seat,

    state: "PLAYING",
  };
}

// =========================================
// APPEND CARDS TO PLAYER
// =========================================

async function appendCardsToPlayer(
  gameId: string,
  playerId: string,
  newCards: HokmCard[],
  expectedBefore: number,
  expectedAfter: number
) {
  const handRef = doc(
    db,
    "hokm_games",
    gameId,
    "players",
    playerId,
    "private",
    "hand"
  );

  const handSnapshot =
    await getDoc(handRef);

  if (!handSnapshot.exists()) {
    throw new Error(
      `HAND_NOT_FOUND_${playerId}`
    );
  }

  const handData =
    handSnapshot.data();

  const existingCards =
    Array.isArray(
      handData.cards
    )
      ? (handData.cards as HokmCard[])
      : [];

  // =========================================
  // VERIFY CURRENT COUNT
  // =========================================

  if (
    existingCards.length !==
    expectedBefore
  ) {
    throw new Error(
      `INVALID_HAND_COUNT_${playerId}`
    );
  }

  // =========================================
  // APPEND
  // =========================================

  const updatedCards = [
    ...existingCards,
    ...newCards,
  ];

  // =========================================
  // VERIFY NEW COUNT
  // =========================================

  if (
    updatedCards.length !==
    expectedAfter
  ) {
    throw new Error(
      `INVALID_UPDATED_HAND_COUNT_${playerId}`
    );
  }

  await setDoc(handRef, {
    cards: updatedCards,
    count: updatedCards.length,
    updatedAt:
      serverTimestamp(),
  });
}