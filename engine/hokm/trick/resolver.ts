import type {
  HokmCard,
  HokmSuit,
} from "@/engine/hokm/dealer/deck";

import {
  getWinningCard,
  TrickCard,
} from "@/engine/hokm/trick/rules";

export function resolveTrick(
  trick: TrickCard[],
  leadSuit: HokmSuit,
  trumpSuit: HokmSuit
) {
  if (trick.length !== 4) {
    throw new Error("TRICK_NOT_COMPLETE");
  }

  const winner = getWinningCard(
    trick,
    leadSuit,
    trumpSuit
  );

  return {
    winnerPlayerId: winner.playerId,
    winningCard: winner.card,
  };
}