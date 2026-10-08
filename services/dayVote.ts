import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";


// ============================================
// DAY VOTE
// رأی اول روز برای انتخاب بازیکن دفاعیه
// ============================================

export async function dayVote(
  gameId: string,
  playerId: string,
  targetId: string
) {
  const playerRef = doc(
    db,
    "games",
    gameId,
    "players",
    playerId
  );

  const playerSnapshot = await getDoc(playerRef);

  if (!playerSnapshot.exists()) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  const player = playerSnapshot.data();

  if (!player.alive) {
    throw new Error("DEAD_PLAYER_CANNOT_VOTE");
  }

  if (player.canVote === false) {
    throw new Error("VOTE_ALREADY_USED");
  }

  // ثبت رأی روز
  await setDoc(
    doc(
      db,
      "games",
      gameId,
      "dayVotes",
      playerId
    ),
    {
      playerId,
      targetId,
      createdAt: Date.now(),
    }
  );

  // قفل شدن رأی اول این روز
  await updateDoc(
    playerRef,
    {
      canVote: false,
      vote: targetId,
    }
  );
}


// ============================================
// SECOND VOTE
// رأی دوم دفاعیه
//
// YES = موافق خروج بازیکن
// NO  = مخالف خروج بازیکن
//
// تصمیم نهایی با HOST است.
// ============================================

export type SecondVoteChoice =
  | "YES"
  | "NO";

export async function secondVote(
  gameId: string,
  playerId: string,
  choice: SecondVoteChoice
) {
  const gameRef = doc(
    db,
    "games",
    gameId
  );

  const gameSnapshot = await getDoc(gameRef);

  if (!gameSnapshot.exists()) {
    throw new Error("GAME_NOT_FOUND");
  }

  const game = gameSnapshot.data();

  // رأی دوم فقط وقتی باز است
  if (game.phase !== "second_vote") {
    throw new Error(
      "SECOND_VOTE_NOT_OPEN"
    );
  }

  const targetId =
    game.secondVoteTargetId;
  const secondVoteId = game.secondVoteId;

  if (!secondVoteId) {
    throw new Error("SECOND_VOTE_ID_NOT_FOUND");
  }

  if (!targetId) {
    throw new Error(
      "SECOND_VOTE_TARGET_NOT_FOUND"
    );
  }

  const playerRef = doc(
    db,
    "games",
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

  // بازیکن مرده نمی‌تواند رأی بدهد
  if (!player.alive) {
    throw new Error(
      "DEAD_PLAYER_CANNOT_VOTE"
    );
  }

  // رأی‌دهنده فقط یک بار رأی می‌دهد
  const secondVoteRef = doc(
    db,
    "games",
    gameId,
    "secondVotes",
    `${secondVoteId}_${playerId}`
  );

  const existingVote =
    await getDoc(secondVoteRef);

  if (existingVote.exists()) {
    throw new Error(
      "SECOND_VOTE_ALREADY_USED"
    );
  }

  // ثبت رأی YES یا NO
  await setDoc(secondVoteRef, {
    playerId,
    targetId,
    choice,
    secondVoteId,
    createdAt: Date.now(),
  });

  return {
    success: true,
    choice,
    targetId,
  };
}