export type Role =
  | "godfather"
  | "mafia"
  | "citizen"
  | "doctor"
  | "detective"
  | "sniper";

export function generateRoles(playerCount: number): Role[] {
  if (playerCount < 6) {
    throw new Error("Minimum 6 players required.");
  }

  let roles: Role[] = [];

  switch (playerCount) {
    case 6:
      roles = [
        "godfather",
        "mafia",
        "doctor",
        "detective",
        "citizen",
        "citizen",
      ];
      break;

    case 7:
      roles = [
        "godfather",
        "mafia",
        "doctor",
        "detective",
        "citizen",
        "citizen",
        "citizen",
      ];
      break;

    case 8:
      roles = [
        "godfather",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
      ];
      break;

    case 9:
      roles = [
        "godfather",
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
      ];
      break;

    default:
      roles = [
        "godfather",
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
        "citizen",
      ];
      break;
  }

  return shuffle(roles);
}

function shuffle<T>(array: T[]): T[] {
  const items = [...array];

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}