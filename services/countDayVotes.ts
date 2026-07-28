import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type VoteResult = {
  playerId: string;
  votes: number;
};

export async function countDayVotes(
  gameId: string
): Promise<VoteResult[]> {

  const votesRef = collection(
    db,
    "games",
    gameId,
    "dayVotes"
  );

  const snapshot = await getDocs(votesRef);

  const counter: Record<string, number> = {};

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (!data.targetId) return;

    counter[data.targetId] =
      (counter[data.targetId] || 0) + 1;
  });

  return Object.entries(counter)
    .map(([playerId, votes]) => ({
      playerId,
      votes,
    }))
    .sort((a, b) => b.votes - a.votes);
}