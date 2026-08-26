export type HokmSuit =
  | "spades"
  | "hearts"
  | "diamonds"
  | "clubs";

export type HokmRank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface HokmCard {
  id: string;
  suit: HokmSuit;
  rank: HokmRank;
  value: number;
}

const suits: HokmSuit[] = [
  "spades",
  "hearts",
  "diamonds",
  "clubs",
];

const ranks: HokmRank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const rankValues: Record<HokmRank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function createHokmDeck(): HokmCard[] {
  const deck: HokmCard[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: rankValues[rank],
      });
    }
  }

  return deck;
}

export function shuffleHokmDeck(
  cards: HokmCard[]
): HokmCard[] {
  const deck = [...cards];

  for (let i = deck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1)
    );

    [deck[i], deck[randomIndex]] = [
      deck[randomIndex],
      deck[i],
    ];
  }

  return deck;
}

export function createShuffledHokmDeck(): HokmCard[] {
  return shuffleHokmDeck(createHokmDeck());
}