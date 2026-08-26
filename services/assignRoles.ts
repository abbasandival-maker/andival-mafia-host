import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Player = {
  id: string;
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [arr[i], arr[j]] = [
      arr[j],
      arr[i],
    ];
  }

  return arr;
}

function buildRoles(
  playerCount: number
): string[] {
  switch (playerCount) {
    // =================================
    // 6 PLAYERS
    // =================================
    case 6:
      return [
        "godfather",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
      ];

    // =================================
    // 7 PLAYERS
    // =================================
    case 7:
      return [
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "citizen",
        "citizen",
        "citizen",
      ];

    // =================================
    // 8 PLAYERS
    // =================================
    case 8:
      return [
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
      ];

    // =================================
    // 9 PLAYERS
    // =================================
    case 9:
      return [
        "mafia",
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
        "citizen",
        "citizen",
        "citizen",
      ];

    // =================================
    // 10 PLAYERS
    // =================================
    case 10:
      return [
        "mafia",
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

    // =================================
    // 11+ PLAYERS
    // =================================
    default: {
      const roles = [
        "mafia",
        "mafia",
        "mafia",
        "doctor",
        "detective",
        "sniper",
      ];

      while (roles.length < playerCount) {
        roles.push("citizen");
      }

      return roles;
    }
  }
}

export async function assignRoles(
  gameId: string
) {
  // =================================
  // GET PLAYERS
  // =================================

  const snapshot = await getDocs(
    collection(
      db,
      "games",
      gameId,
      "players"
    )
  );

  const players: Player[] =
    snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
    }));

  // =================================
  // MINIMUM PLAYERS
  // =================================

  if (players.length < 6) {
    throw new Error(
      "Minimum 6 players required."
    );
  }

  // =================================
  // FIX PLAYER ORDER
  //
  // نام بازیکن و ترتیب Join هیچ نقشی
  // در این مرحله ندارند.
  // فقط playerId ثابت استفاده می‌شود.
  // =================================

  const stablePlayers = [...players].sort(
    (a, b) =>
      a.id.localeCompare(
        b.id,
        "en"
      )
  );

  // =================================
  // BUILD ROLES
  // =================================

  const roles = buildRoles(
    stablePlayers.length
  );

  if (
    roles.length !== stablePlayers.length
  ) {
    throw new Error(
      `ROLE_COUNT_MISMATCH: Expected ${stablePlayers.length} roles but got ${roles.length}.`
    );
  }

  // =================================
  // RANDOMIZE ROLES ONLY
  //
  // نقش‌ها با الگوریتم Fisher-Yates
  // کاملاً تصادفی می‌شوند.
  // سپس به playerIdهای ثابت اختصاص
  // داده می‌شوند.
  // =================================

  const shuffledRoles =
    shuffle(roles);

  // =================================
  // ASSIGN ROLES
  // =================================

  const batch = writeBatch(db);

  stablePlayers.forEach(
    (player, index) => {
      batch.update(
        doc(
          db,
          "games",
          gameId,
          "players",
          player.id
        ),
        {
          role: shuffledRoles[index],
          alive: true,
          eliminated: false,
          canVote: true,
          canUseAbility: true,
        }
      );
    }
  );

  await batch.commit();

  return true;
}