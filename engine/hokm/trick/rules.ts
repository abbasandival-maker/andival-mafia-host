import type {
  HokmCard,
  HokmSuit,
} from "@/engine/hokm/dealer/deck";

export interface TrickCard {
  playerId: string;
  card: HokmCard;
}

export function canPlayCard(
  hand: HokmCard[],
  cardId: string,
  leadSuit: HokmSuit | null
): boolean {
  const card = hand.find(
    (item) => item.id === cardId
  );

  if (!card) {
    return false;
  }

  // هنوز اولین کارت دست بازی نشده
  if (!leadSuit) {
    return true;
  }

  // آیا بازیکن خال شروع را در دست دارد؟
  const hasLeadSuit = hand.some(
    (item) => item.suit === leadSuit
  );

  // اگر ندارد، هر خالی مجاز است
  if (!hasLeadSuit) {
    return true;
  }

  // اگر دارد، مجبور است همان خال را بازی کند
  return card.suit === leadSuit;
}

export function getWinningCard(
  trick: TrickCard[],
  leadSuit: HokmSuit,
  trumpSuit: HokmSuit
): TrickCard {
  if (trick.length === 0) {
    throw new Error("EMPTY_TRICK");
  }

  let winner = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];

    if (
      isCardStronger(
        current.card,
        winner.card,
        leadSuit,
        trumpSuit
      )
    ) {
      winner = current;
    }
  }

  return winner;
}

function isCardStronger(
  current: HokmCard,
  currentWinner: HokmCard,
  leadSuit: HokmSuit,
  trumpSuit: HokmSuit
): boolean {
  // Trump همیشه از Lead Suit قوی‌تر است
  if (
    current.suit === trumpSuit &&
    currentWinner.suit !== trumpSuit
  ) {
    return true;
  }

  if (
    current.suit !== trumpSuit &&
    currentWinner.suit === trumpSuit
  ) {
    return false;
  }

  // اگر هر دو Trump هستند
  if (
    current.suit === trumpSuit &&
    currentWinner.suit === trumpSuit
  ) {
    return current.value > currentWinner.value;
  }

  // اگر هیچ‌کدام Trump نیستند،
  // فقط Lead Suit می‌تواند برنده شود.
  if (
    current.suit === leadSuit &&
    currentWinner.suit !== leadSuit
  ) {
    return true;
  }

  if (
    current.suit !== leadSuit &&
    currentWinner.suit === leadSuit
  ) {
    return false;
  }

  // اگر هر دو Lead Suit هستند
  if (
    current.suit === leadSuit &&
    currentWinner.suit === leadSuit
  ) {
    return current.value > currentWinner.value;
  }

  // دو خال بی‌ربط
  return false;
}