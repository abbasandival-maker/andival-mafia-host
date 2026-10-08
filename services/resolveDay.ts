import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";


export async function resolveDay(gameId: string) {
  const playersRef = collection(db, "games", gameId, "players");
  const votesRef = collection(db, "games", gameId, "dayVotes");

  const playersSnap = await getDocs(playersRef);
  const votesSnap = await getDocs(votesRef);

  const players = playersSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  const batch = writeBatch(db);

  const voteCount: Record<string, number> = {};

  // Count Votes
  votesSnap.forEach((voteDoc) => {
    const data = voteDoc.data();

    if (!data.targetId) return;

    voteCount[data.targetId] =
      (voteCount[data.targetId] || 0) + 1;
  });

  let eliminatedPlayer: string | null = null;
  let maxVotes = 0;
  let tie = false;

  Object.entries(voteCount).forEach(([playerId, votes]) => {
    if (votes > maxVotes) {
      eliminatedPlayer = playerId;
      maxVotes = votes;
      tie = false;
    } else if (votes === maxVotes) {
      tie = true;
    }
  });

  // Update Players
  playersSnap.forEach((playerDoc) => {
    const data = playerDoc.data();

    const updates: any = {
      vote: null,
    };

    if (
      !tie &&
      eliminatedPlayer &&
      playerDoc.id === eliminatedPlayer
    ) {
      updates.alive = false;
      updates.status = "ELIMINATED";
      updates.canVote = false;
      updates.canUseAbility = false;
    } else if (data.alive) {
      updates.canVote = true;
      updates.canUseAbility = true;
    } else {
      updates.canVote = false;
      updates.canUseAbility = false;
    }

    batch.update(playerDoc.ref, updates);
  });

  //------------------------------------------------
  // Promote New Godfather
  //------------------------------------------------

  const godfatherAlive = players.some(
    (p) =>
      p.role === "godfather" &&
      p.alive &&
      p.id !== eliminatedPlayer
  );

  if (!godfatherAlive) {
    const newGodfather = players.find(
      (p) =>
        (p.role === "mafia" || p.role === "savval_goodman") &&
        p.alive &&
        p.id !== eliminatedPlayer
    );

    if (newGodfather) {
      batch.update(
        doc(
          db,
          "games",
          gameId,
          "players",
          newGodfather.id
        ),
        {
          role: "godfather",
        }
      );
    }
  }

  // Delete Votes
  votesSnap.forEach((voteDoc) => {
    batch.delete(voteDoc.ref);
  });

  // Start Night
  batch.update(doc(db, "games", gameId), {
  // ورود به شب
  phase: "night",

  // بستن رأی‌گیری روز
  dayVotingOpen: false,
});

  await batch.commit();

// Host decides when the game ends.
// No automatic winner detection.
}