import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type VoteResult = {
  playerId: string;
  votes: number;
  voters: string[];
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

  const playersRef = collection(
    db,
    "games",
    gameId,
    "players"
  );

  const [votesSnap, playersSnap] =
    await Promise.all([
      getDocs(votesRef),
      getDocs(playersRef),
    ]);

  const playerNames: Record<string, string> = {};

  playersSnap.forEach((doc) => {
    const data = doc.data();

    playerNames[doc.id] =
      data.nickname ?? doc.id;
  });

  const counter: Record<
    string,
    VoteResult
  > = {};

  votesSnap.forEach((doc) => {

    const data = doc.data();

    if (!data.targetId) return;

    if (!counter[data.targetId]) {

      counter[data.targetId] = {
        playerId: data.targetId,
        votes: 0,
        voters: [],
      };

    }

    counter[data.targetId].votes++;

    counter[data.targetId].voters.push(
      playerNames[data.playerId] ??
      data.playerId
    );

  });

  return Object.values(counter).sort(
    (a, b) => b.votes - a.votes
  );

}