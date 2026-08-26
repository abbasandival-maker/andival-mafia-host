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

import {
  resolveScore,
} from "@/engine/hokm/score/winner";

import type {
  HokmCard,
  HokmSuit,
} from "@/engine/hokm/dealer/deck";

import {
  canPlayCard,
  TrickCard,
} from "@/engine/hokm/trick/rules";

import { resolveTrick } from "@/engine/hokm/trick/resolver";

import {
  getNextSeat,
} from "@/engine/hokm/game/turnOrder";

import type {
  PlayerSeat,
} from "@/engine/hokm/game/types";

export async function playHokmCard(
  gameId: string,
  playerId: string,
  cardId: string
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
  // GAME STATE
  // =========================================

  if (game.state !== "PLAYING") {
    throw new Error(
      "GAME_NOT_PLAYING"
    );
  }

  if (!game.trumpSuit) {
    throw new Error(
      "TRUMP_NOT_SELECTED"
    );
  }

  // =========================================
  // PLAYER
  // =========================================

  const playerRef = doc(
    db,
    "hokm_games",
    gameId,
    "players",
    playerId
  );

  const playerSnapshot =
    await getDoc(playerRef);

  if (!playerSnapshot.exists()) {
    throw new Error(
      "PLAYER_NOT_FOUND"
    );
  }

  const player =
    playerSnapshot.data();

  // =========================================
  // PLAYER SEAT
  // =========================================

  if (!player.seat) {
    throw new Error(
      "PLAYER_SEAT_NOT_FOUND"
    );
  }

  // =========================================
  // TURN CHECK
  // =========================================

  if (
    game.currentTurnPlayerId !==
    playerId
  ) {
    throw new Error(
      "NOT_YOUR_TURN"
    );
  }

  // =========================================
  // PRIVATE HAND
  // =========================================

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
      "HAND_NOT_FOUND"
    );
  }

  const handData =
    handSnapshot.data();

  const hand: HokmCard[] =
    Array.isArray(handData.cards)
      ? handData.cards
      : [];

  // =========================================
  // CARD
  // =========================================

  const card =
    hand.find(
      (item) =>
        item.id === cardId
    );

  if (!card) {
    throw new Error(
      "CARD_NOT_IN_HAND"
    );
  }

  // =========================================
  // CURRENT TRICK
  // =========================================

  const trickRef = doc(
    db,
    "hokm_games",
    gameId,
    "state",
    "currentTrick"
  );

  const trickSnapshot =
    await getDoc(trickRef);

  const trickData =
    trickSnapshot.exists()
      ? trickSnapshot.data()
      : null;

  /*
   * اگر Trick قبلی کامل شده باشد،
   * برای Trick جدید باید از صفر شروع کنیم.
   */

  const storedCards =
    trickData &&
    Array.isArray(
      trickData.cards
    )
      ? trickData.cards
      : [];

  const trickIsCompleted =
    trickData?.completed === true;

  const trick: TrickCard[] =
    trickIsCompleted
      ? []
      : storedCards;

  // =========================================
  // LEAD SUIT
  // =========================================

  const leadSuit: HokmSuit | null =
    trickIsCompleted
      ? null
      : trickData?.leadSuit ?? null;

  // =========================================
  // FOLLOW SUIT RULE
  // =========================================

  if (
    !canPlayCard(
      hand,
      cardId,
      leadSuit
    )
  ) {
    throw new Error(
      "MUST_FOLLOW_SUIT"
    );
  }

  // =========================================
  // ADD CARD
  // =========================================

  const newTrick: TrickCard[] = [
    ...trick,
    {
      playerId,
      card,
    },
  ];

  const newLeadSuit =
    leadSuit ?? card.suit;

  // =========================================
  // REMOVE CARD FROM PRIVATE HAND
  // =========================================

  const newHand =
    hand.filter(
      (item) =>
        item.id !== cardId
    );

  await setDoc(handRef, {
    cards: newHand,
    count: newHand.length,
    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // TRICK NOT COMPLETE
  // =========================================

  if (newTrick.length < 4) {
    await setDoc(trickRef, {
      cards: newTrick,
      leadSuit: newLeadSuit,
      completed: false,
      winnerPlayerId: null,
      winnerTeam: null,
      winningCard: null,
      updatedAt:
        serverTimestamp(),
    });

    // =======================================
    // NEXT PLAYER
    // =======================================

    const nextPlayer =
      await getNextPlayer(
        gameId,
        player.seat as PlayerSeat
      );

    await updateDoc(gameRef, {
      currentTurnPlayerId:
        nextPlayer.id,

      updatedAt:
        serverTimestamp(),
    });

    return {
      status: "CARD_PLAYED",
      trickComplete: false,
      nextPlayerId:
        nextPlayer.id,
      cardsInTrick:
        newTrick.length,
    };
  }

  // =========================================
  // TRICK COMPLETE — 4 CARDS
  // =========================================

  const result =
    resolveTrick(
      newTrick,
      newLeadSuit,
      game.trumpSuit
    );

  // =========================================
  // WINNER PLAYER
  // =========================================

  const winnerPlayerSnapshot =
    await getDoc(
      doc(
        db,
        "hokm_games",
        gameId,
        "players",
        result.winnerPlayerId
      )
    );

  if (
    !winnerPlayerSnapshot.exists()
  ) {
    throw new Error(
      "WINNER_PLAYER_NOT_FOUND"
    );
  }

  const winnerPlayer =
    winnerPlayerSnapshot.data();

  // =========================================
  // WINNER TEAM
  // =========================================

  const winnerTeam =
    winnerPlayer.team;

  if (
    winnerTeam !== "A" &&
    winnerTeam !== "B"
  ) {
    throw new Error(
      "WINNER_TEAM_NOT_FOUND"
    );
  }

  // =========================================
  // CURRENT SCORE
  // =========================================

  const currentScore = {
    teamA:
      typeof game.score?.teamA ===
      "number"
        ? game.score.teamA
        : 0,

    teamB:
      typeof game.score?.teamB ===
      "number"
        ? game.score.teamB
        : 0,
  };

  // =========================================
  // ADD TRICK TO WINNER TEAM
  // =========================================

  const scoreResult =
    resolveScore({
      winnerTeam,
      currentScore,
    });

  // =========================================
  // TRICK NUMBER
  // =========================================

  const currentTrickNumber =
    typeof game.trickNumber ===
    "number"
      ? game.trickNumber
      : 1;

  const completedTrickNumber =
    currentTrickNumber;

  const nextTrickNumber =
    completedTrickNumber + 1;

  // =========================================
  // ROUND WIN
  // =========================================

  const roundWinner =
    scoreResult.winner;

  /*
   * اگر resolveScore قبلاً برنده را مشخص
   * کرده باشد، Round تمام شده است.
   *
   * همچنین اگر به Trick سیزدهم رسیده‌ایم،
   * دست حتماً باید تمام شود.
   */

  const roundComplete =
    roundWinner !== null ||
    completedTrickNumber >= 13;

  // =========================================
  // SAVE COMPLETED TRICK
  // =========================================

  /*
   * Trick کامل را فعلاً نگه می‌داریم
   * تا Host بتواند چهار کارت و برنده
   * Trick را روی Overlay ببیند.
   *
   * وقتی نفر بعدی کارت اول Trick بعدی
   * را بازی کند، این Trick جایگزین
   * خواهد شد.
   */

  await setDoc(trickRef, {
    cards: newTrick,

    leadSuit:
      newLeadSuit,

    winnerPlayerId:
      result.winnerPlayerId,

    winningCard:
      result.winningCard,

    winnerTeam,

    completed: true,

    trickNumber:
      completedTrickNumber,

    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // ROUND COMPLETE
  // =========================================

  if (roundComplete) {
    await updateDoc(gameRef, {
      currentTurnPlayerId:
        result.winnerPlayerId,

      score:
        scoreResult.score,

      state:
        "ROUND_COMPLETE",

      phase:
        "ROUND_COMPLETE",

      winnerTeam:
        roundWinner ??
        winnerTeam,

      trickNumber:
        completedTrickNumber,

      updatedAt:
        serverTimestamp(),
    });

    return {
      status:
        "ROUND_COMPLETE",

      trickComplete:
        true,

      winnerPlayerId:
        result.winnerPlayerId,

      winnerTeam,

      winningCard:
        result.winningCard,

      score:
        scoreResult.score,

      trickNumber:
        completedTrickNumber,

      roundComplete:
        true,

      roundWinner:
        roundWinner ??
        winnerTeam,
    };
  }

  // =========================================
  // NEXT TRICK
  // =========================================

  /*
   * برنده Trick قبلی شروع‌کننده
   * Trick بعدی است.
   */

  await updateDoc(gameRef, {
    currentTurnPlayerId:
      result.winnerPlayerId,

    score:
      scoreResult.score,

    state:
      "PLAYING",

    phase:
      "PLAYING",

    winnerTeam:
      null,

    trickNumber:
      nextTrickNumber,

    updatedAt:
      serverTimestamp(),
  });

  // =========================================
  // RESULT
  // =========================================

  return {
    status:
      "TRICK_COMPLETE",

    trickComplete:
      true,

    winnerPlayerId:
      result.winnerPlayerId,

    winnerTeam,

    winningCard:
      result.winningCard,

    score:
      scoreResult.score,

    completedTrickNumber,

    nextTrickNumber,

    nextPlayerId:
      result.winnerPlayerId,

    roundComplete:
      false,

    roundWinner:
      null,
  };
}

// =========================================
// FIND NEXT PLAYER
// =========================================

async function getNextPlayer(
  gameId: string,
  currentSeat: PlayerSeat
) {
  const nextSeat =
    getNextSeat(
      currentSeat
    );

  const playersSnapshot =
    await getDocs(
      collection(
        db,
        "hokm_games",
        gameId,
        "players"
      )
    );

  const nextPlayer =
    playersSnapshot.docs
      .map((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      }))
      .find(
        (player: any) =>
          player.seat === nextSeat
      );

  if (!nextPlayer) {
    throw new Error(
      "NEXT_PLAYER_NOT_FOUND"
    );
  }

  return nextPlayer;
}