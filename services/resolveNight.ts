import {
  collection,
  getDocs,
  doc,
  writeBatch,
  increment,
} from "firebase/firestore";

import { db } from "@/lib/firebase";


export async function resolveNight(gameId: string) {
  const playersSnapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  const players = playersSnapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as any[];

  const mafiaVotesSnapshot = await getDocs(
    collection(db, "games", gameId, "mafiaVotes")
  );

  const doctorSnapshot = await getDocs(
    collection(db, "games", gameId, "doctorActions")
  );

  const sniperSnapshot = await getDocs(
    collection(db, "games", gameId, "sniperActions")
  );

  const detectiveSnapshot = await getDocs(
    collection(db, "games", gameId, "detectiveActions")
  );

  const batch = writeBatch(db);

  //------------------------------------------------
  // Godfather Target
  //------------------------------------------------

  let mafiaTarget: string | null = null;

  mafiaVotesSnapshot.forEach((voteDoc) => {
    const data = voteDoc.data();

    // فقط رأی پدرخوانده
    mafiaTarget = data.targetId;
  });

  //------------------------------------------------
  // Doctor
  //------------------------------------------------

  let doctorSave: string | null = null;

  doctorSnapshot.forEach((d) => {
    doctorSave = d.data().targetId;
  });

  //------------------------------------------------
  // Sniper
  //------------------------------------------------

  let sniperTarget: string | null = null;
  let sniperId: string | null = null;

  sniperSnapshot.forEach((d) => {
    sniperId = d.data().sniperId;
    sniperTarget = d.data().targetId;
  });

  //------------------------------------------------
// Detective
//------------------------------------------------

detectiveSnapshot.forEach((d) => {
  const detectiveId = d.data().detectiveId;
  const targetId = d.data().targetId;

  const target = players.find((p) => p.id === targetId);

  let result = "NOT MAFIA";

  if (target) {
    if (target.role === "godfather") {
      result = "NOT MAFIA";
    } else if (target.role === "mafia") {
      result = "MAFIA";
    }
  }

  batch.update(
    doc(db, "games", gameId, "players", detectiveId),
    {
      investigatedPlayer: target?.nickname ?? "",
      investigationResult: result,
      canUseAbility: false,
    }
  );
});

  //------------------------------------------------
  // Night Result
  //------------------------------------------------

  const deadPlayers = new Set<string>();
    //------------------------------------------------
  // 5 Mafia Kill
  //------------------------------------------------

  let mafiaKilledPlayer = "";

  if (mafiaTarget && mafiaTarget !== doctorSave) {
    const target = players.find((p) => p.id === mafiaTarget);

    if (target?.alive && !deadPlayers.has(mafiaTarget)) {
      deadPlayers.add(mafiaTarget);
      mafiaKilledPlayer = target.nickname ?? "";

      batch.update(
        doc(db, "games", gameId, "players", mafiaTarget),
        {
          alive: false,
          eliminated: true,
        }
      );

      batch.update(doc(db, "games", gameId), {
        alivePlayers: increment(-1),
      });
    }
  }

  //------------------------------------------------
  // 6 Sniper
  //------------------------------------------------

  let sniperKilledPlayer = "";
  let sniperDied = false;

  if (sniperTarget && sniperTarget !== "SKIP") {
    const target = players.find((p) => p.id === sniperTarget);

    if (target) {
      const isMafia =
        target.role === "mafia" ||
        target.role === "godfather";

      if (isMafia) {
        if (
          target.alive &&
          !deadPlayers.has(target.id)
        ) {
          deadPlayers.add(target.id);

          sniperKilledPlayer =
            target.nickname ?? "";

          batch.update(
            doc(
              db,
              "games",
              gameId,
              "players",
              target.id
            ),
            {
              alive: false,
              eliminated: true,
            }
          );

          batch.update(
            doc(db, "games", gameId),
            {
              alivePlayers: increment(-1),
            }
          );
        }
      } else if (sniperId) {
  const sniper = players.find(
    (p) => p.id === sniperId
  );

  // اگر دکتر اسنایپر را نجات داده باشد، اسنایپر نمی‌میرد
  if (doctorSave === sniperId) {
    sniperDied = false;
  } else if (
    sniper?.alive &&
    !deadPlayers.has(sniperId)
  ) {
    deadPlayers.add(sniperId);

    sniperDied = true;

    batch.update(
      doc(
        db,
        "games",
        gameId,
        "players",
        sniperId
      ),
      {
        alive: false,
        eliminated: true,
      }
    );

    batch.update(
      doc(db, "games", gameId),
      {
        alivePlayers: increment(-1),
      }
    );
  }
}
    }
  }

  //------------------------------------------------
  // Promote New Godfather
  //------------------------------------------------

  const godfatherAlive = players.some(
    (p) =>
      p.role === "godfather" &&
      p.alive &&
      !deadPlayers.has(p.id)
  );

  if (!godfatherAlive) {
    const newGodfather = players.find(
      (p) =>
        p.role === "mafia" &&
        p.alive &&
        !deadPlayers.has(p.id)
    );

    if (newGodfather) {
      batch.update(
        doc(
          db,
          "games",
          gameId,
          "players",
          newGodfather.id
        ),
        {
          role: "godfather",
        }
      );
    }
  }

  //------------------------------------------------
  // Save Night Result
  //------------------------------------------------

  batch.update(doc(db, "games", gameId), {
    lastNightResult: {
      mafiaTarget,
      doctorSave,
      mafiaKilledPlayer,
      sniperKilledPlayer,
      sniperDied,
      deadPlayers: Array.from(deadPlayers),
      resolvedAt: Date.now(),
    },
  });

  //------------------------------------------------
  // Reset Players
  //------------------------------------------------

 players.forEach((player) => {
  if (!deadPlayers.has(player.id) && player.alive) {
    batch.update(
      doc(
        db,
        "games",
        gameId,
        "players",
        player.id
      ),
      {
        canUseAbility: true,
        canVote: true,
        vote: null,
      }
    );
  }
});

  //------------------------------------------------
  // Clear Night Actions
  //------------------------------------------------

  mafiaVotesSnapshot.forEach((d) => {
    batch.delete(d.ref);
  });

  doctorSnapshot.forEach((d) => {
    batch.delete(d.ref);
  });

  detectiveSnapshot.forEach((d) => {
    batch.delete(d.ref);
  });

  sniperSnapshot.forEach((d) => {
    batch.delete(d.ref);
  });

  //------------------------------------------------
  // Next Day
  //------------------------------------------------

  batch.update(doc(db, "games", gameId), {
    phase: "day",
    currentDay: increment(1),
  });

  await batch.commit();

// Host decides when the game ends.
// No automatic winner detection.
}