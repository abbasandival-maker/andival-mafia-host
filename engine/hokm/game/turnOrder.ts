import type { PlayerSeat } from "@/engine/hokm/game/types";

const PLAY_ORDER: PlayerSeat[] = [
  "left",
  "bottom",
  "right",
  "top",
];

export function getNextSeat(
  currentSeat: PlayerSeat
): PlayerSeat {
  const index =
    PLAY_ORDER.indexOf(currentSeat);

  if (index === -1) {
    throw new Error("INVALID_SEAT");
  }

  return PLAY_ORDER[
    (index + 1) % PLAY_ORDER.length
  ];
}

export function getRightOfHakem(
  hakemSeat: PlayerSeat
): PlayerSeat {
  const hakemIndex =
    PLAY_ORDER.indexOf(hakemSeat);

  if (hakemIndex === -1) {
    throw new Error("INVALID_SEAT");
  }

  return PLAY_ORDER[
    (hakemIndex - 1 + PLAY_ORDER.length) %
      PLAY_ORDER.length
  ];
}