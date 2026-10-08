import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function mafiaVote(
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

  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  const player = playerSnap.data();

  if (
    !["godfather", "savval_goodman", "mafia"].includes(
      player.role
    )
  ) {
    throw new Error("NOT_MAFIA");
  }

  if (player.alive === false) {
    throw new Error("DEAD_PLAYER");
  }

  // مافیا فقط یک شلیک عادی در هر شب دارد.
  // این قابلیت نباید با Slaughter مشترک باشد.
  const mafiaVoteRef = doc(
    db,
    "games",
    gameId,
    "mafiaVotes",
    playerId
  );

  const existingVote = await getDoc(mafiaVoteRef);

  if (existingVote.exists()) {
    throw new Error("MAFIA_VOTE_ALREADY_USED");
  }

  await setDoc(mafiaVoteRef, {
    godfatherId: playerId,
    targetId,
    createdAt: Date.now(),
  });
}