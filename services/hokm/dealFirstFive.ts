import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  createShuffledHokmDeck,
  HokmCard,
} from "@/engine/hokm/dealer/deck";

type Player = {
  id: string;
  name: string;
  seat: "top" | "right" | "bottom" | "left";
  team: "A" | "B" | null;
};

/*
 * جهت ثابت بازی ANDIVAL HOKM
 *
 * اگر حاکم BOTTOM باشد:
 *
 * LEFT → BOTTOM → RIGHT → TOP
 *
 * این ترتیب برای تقسیم کارت استفاده می‌شود.
 */
const DEAL_ORDER = [
  "left",
  "bottom",
  "right",
  "top",
] as const;

export async function dealFirstFive(
  gameId: string
) {
  const gameRef = doc(
    db,
    "hokm_games",
    gameId
  );

  // --------------------------------
  // گرفتن اطلاعات بازی
  // --------------------------------

  const gameSnapshot = await getDoc(
    gameRef
  );

  if (!gameSnapshot.exists()) {
    throw new Error("GAME_NOT_FOUND");
  }

  const game = gameSnapshot.data();

  // --------------------------------
  // گرفتن بازیکنان
  // --------------------------------

  const playersSnapshot = await getDocs(
    collection(
      db,
      "hokm_games",
      gameId,
      "players"
    )
  );

  const players = playersSnapshot.docs.map(
    (snapshot) => ({
      id: snapshot.id,
      ...snapshot.data(),
    })
  ) as Player[];

  if (players.length !== 4) {
    throw new Error(
      "FOUR_PLAYERS_REQUIRED"
    );
  }

  // --------------------------------
  // پیدا کردن حاکم
  // --------------------------------

  if (!game.hakemPlayerId) {
    throw new Error("HAKEM_NOT_FOUND");
  }

  const hakem = players.find(
    (player) =>
      player.id === game.hakemPlayerId
  );

  if (!hakem) {
    throw new Error("HAKEM_NOT_FOUND");
  }

  // --------------------------------
  // بررسی صندلی‌ها
  // --------------------------------

  const orderedPlayers =
    DEAL_ORDER.map((seat) => {
      const player = players.find(
        (item) => item.seat === seat
      );

      if (!player) {
        throw new Error(
          `PLAYER_NOT_FOUND_${seat.toUpperCase()}`
        );
      }

      return player;
    });

  // --------------------------------
  // ساخت و Shuffle Deck
  // --------------------------------

  const deck = createShuffledHokmDeck();

  if (deck.length !== 52) {
    throw new Error("INVALID_DECK");
  }

  // --------------------------------
  // دست اول
  //
  // هر بازیکن 5 کارت
  //
  // LEFT    5
  // BOTTOM  5
  // RIGHT   5
  // TOP     5
  //
  // مجموع = 20
  // --------------------------------

  let cursor = 0;

  for (const player of orderedPlayers) {
    const cards: HokmCard[] =
      deck.slice(
        cursor,
        cursor + 5
      );

    if (cards.length !== 5) {
      throw new Error(
        "INVALID_FIRST_DEAL"
      );
    }

    cursor += 5;

    // عمداً setDoc استفاده می‌کنیم
    // تا اگر بازی دوباره Start شد،
    // کارت‌های قبلی به کارت‌های جدید
    // اضافه نشوند.
    await setDoc(
      doc(
        db,
        "hokm_games",
        gameId,
        "players",
        player.id,
        "private",
        "hand"
      ),
      {
        cards,
        count: cards.length,
        updatedAt: serverTimestamp(),
      }
    );
  }

  // --------------------------------
  // باید دقیقاً 20 کارت مصرف شده باشد
  // --------------------------------

  if (cursor !== 20) {
    throw new Error(
      "FIRST_DEAL_COUNT_MISMATCH"
    );
  }

  // --------------------------------
  // ذخیره Deck
  //
  // کل Deck حفظ می‌شود تا بعداً
  // dealRemaining از کارت 20 به بعد
  // استفاده کند.
  // --------------------------------

  await setDoc(
    doc(
      db,
      "hokm_games",
      gameId,
      "state",
      "deck"
    ),
    {
      cards: deck,

      // 20 کارت قبلاً پخش شده
      dealtCount: 20,

      // 32 کارت باقی مانده
      remainingCount: 32,

      completed: false,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    }
  );

  // --------------------------------
  // بازی منتظر انتخاب حکم
  // --------------------------------

  await updateDoc(gameRef, {
    state: "CHOOSING_TRUMP",
    phase: "CHOOSING_TRUMP",

    hakemPlayerId: hakem.id,
    hakemSeat: hakem.seat,

    trumpSuit: null,

    currentTurnPlayerId: null,

    trickNumber: 0,

    updatedAt: serverTimestamp(),
  });

  return {
    hakemPlayerId: hakem.id,

    hakemSeat: hakem.seat,

    cardsDealt: 20,

    remainingCards: 32,

    state: "CHOOSING_TRUMP",
  };
}