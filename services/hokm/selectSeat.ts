import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type SeatType =
  | "top"
  | "right"
  | "bottom"
  | "left";

function getTeamBySeat(seat: SeatType) {
  switch (seat) {
    case "top":
    case "bottom":
      return "A";

    case "left":
    case "right":
      return "B";
  }
}

export async function selectSeat(
  gameId: string,
  playerId: string,
  seat: SeatType
) {
  const playersSnapshot = await getDocs(
    collection(db, "hokm_games", gameId, "players")
  );

  const players = playersSnapshot.docs.map((doc) => doc.data());

  const seatTaken = players.find(
    (player: any) =>
      player.seat === seat &&
      player.id !== playerId
  );

  if (seatTaken) {
    throw new Error("SEAT_ALREADY_TAKEN");
  }

  await updateDoc(
    doc(db, "hokm_games", gameId, "players", playerId),
    {
      seat,
      team: getTeamBySeat(seat),
    }
  );
}