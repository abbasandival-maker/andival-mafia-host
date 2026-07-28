import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { checkWinner } from "@/services/checkWinner";

export async function finishDay(
  gameId: string,
  eliminatedPlayerId: string | null
) {

  const playersRef = collection(
    db,
    "games",
    gameId,
    "players"
  );

  const votesRef = collection(
    db,
    "games",
    gameId,
    "dayVotes"
  );

  const playersSnap = await getDocs(playersRef);
  const votesSnap = await getDocs(votesRef);

  const batch = writeBatch(db);

  playersSnap.forEach((playerDoc) => {

    const updates: any = {
      canVote: true,
      canUseAbility: true,
      vote: null,
    };

    if (
      eliminatedPlayerId &&
      playerDoc.id === eliminatedPlayerId
    ) {
      updates.alive = false;
      updates.status = "ELIMINATED";
    }

    batch.update(playerDoc.ref, updates);

  });

  votesSnap.forEach((voteDoc) => {
    batch.delete(voteDoc.ref);
  });

  batch.update(
    doc(db, "games", gameId),
    {
      phase: "night",
    }
  );

  await batch.commit();

  await checkWinner(gameId);
}