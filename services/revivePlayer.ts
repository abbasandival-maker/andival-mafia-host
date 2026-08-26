import {
  collection,
  doc,
  getDocs,
  runTransaction,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function revivePlayer(
  gameId: string,
  playerId: string
) {
  const gameRef = doc(
    db,
    "games",
    gameId
  );

  const playerRef = doc(
    db,
    "games",
    gameId,
    "players",
    playerId
  );

  const playersSnapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  const allPlayers = playersSnapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  await runTransaction(
    db,
    async (transaction) => {
      const playerSnapshot =
        await transaction.get(playerRef);

      if (!playerSnapshot.exists()) {
        throw new Error(
          "PLAYER_NOT_FOUND"
        );
      }

      const player =
        playerSnapshot.data();

      if (player.alive === true) {
        throw new Error(
          "PLAYER_ALREADY_ALIVE"
        );
      }

      const gameSnapshot =
        await transaction.get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error(
          "GAME_NOT_FOUND"
        );
      }

      const game =
        gameSnapshot.data();

      // ============================================
      // تشخیص نقش اصلی بازیکن
      // ============================================

      const originalRole =
        player.originalRole ?? player.role;

      // ============================================
      // اگر بازیکن پدرخوانده اصلی است،
      // پدرخوانده موقت را دوباره مافیا می‌کنیم
      // ============================================

      if (originalRole === "godfather") {
        allPlayers.forEach((otherPlayer) => {
          if (
            otherPlayer.id !== playerId &&
            otherPlayer.role === "godfather"
          ) {
            transaction.update(
              doc(
                db,
                "games",
                gameId,
                "players",
                otherPlayer.id
              ),
              {
                role:
                  otherPlayer.originalRole ??
                  "mafia",
              }
            );
          }
        });
      }

      // ============================================
      // برگرداندن بازیکن
      // ============================================

      transaction.update(
        playerRef,
        {
          alive: true,
          eliminated: false,

          // بازگرداندن نقش اصلی
          role: originalRole,

          // بازیکن دوباره رأی بدهد
          canVote: true,

          // توانایی نقش دوباره فعال شود
          canUseAbility: true,

          // رأی قبلی پاک شود
          vote: null,

          revivedAt: Date.now(),
        }
      );

      // ============================================
      // افزایش تعداد بازیکنان زنده
      // ============================================

      transaction.update(
        gameRef,
        {
          alivePlayers:
            (game.alivePlayers ?? 0) + 1,
        }
      );
    }
  );

  return true;
}