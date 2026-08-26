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

  // ================================================
  // MAFIA / GODFATHER ACTION
  // ================================================

  let mafiaTarget: string | null = null;
  let mafiaTargetName = "";
  let godfatherId: string | null = null;
  let godfatherName = "";

  mafiaVotesSnapshot.forEach((voteDoc) => {
    const data = voteDoc.data();

    mafiaTarget = data.targetId ?? null;

    const voterId =
      data.godfatherId ??
      data.playerId ??
      voteDoc.id;

    const voter = players.find(
      (player) => player.id === voterId
    );

    if (voter?.role === "godfather") {
      godfatherId = voter.id;
      godfatherName =
        voter.nickname ??
        voter.name ??
        "";
    }
  });

  if (mafiaTarget) {
    const target = players.find(
      (player) => player.id === mafiaTarget
    );

    mafiaTargetName =
      target?.nickname ??
      target?.name ??
      "";
  }

  // اگر در سند رأی ID پدرخوانده نبود،
  // خود پدرخوانده زنده را پیدا کن.
  if (!godfatherId) {
    const godfather = players.find(
      (player) =>
        player.role === "godfather" &&
        player.alive
    );

    if (godfather) {
      godfatherId = godfather.id;
      godfatherName =
        godfather.nickname ??
        godfather.name ??
        "";
    }
  }

  // ================================================
  // DOCTOR ACTION
  // ================================================

  let doctorSave: string | null = null;
  let doctorId: string | null = null;
  let doctorName = "";
  let doctorSaveName = "";

  doctorSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();

    doctorId =
      data.doctorId ??
      actionDoc.id;

    doctorSave =
      data.targetId ?? null;

    const doctor = players.find(
      (player) => player.id === doctorId
    );

    const target = players.find(
      (player) => player.id === doctorSave
    );

    doctorName =
      doctor?.nickname ??
      doctor?.name ??
      "";

    doctorSaveName =
      target?.nickname ??
      target?.name ??
      "";
  });

  // ================================================
  // SNIPER ACTION
  // ================================================

  let sniperTarget: string | null = null;
  let sniperTargetName = "";
  let sniperId: string | null = null;
  let sniperName = "";

  sniperSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();

    sniperId =
      data.sniperId ??
      actionDoc.id;

    sniperTarget =
      data.targetId ?? null;

    const sniper = players.find(
      (player) => player.id === sniperId
    );

    const target = players.find(
      (player) => player.id === sniperTarget
    );

    sniperName =
      sniper?.nickname ??
      sniper?.name ??
      "";

    sniperTargetName =
      target?.nickname ??
      target?.name ??
      "";
  });

  // ================================================
  // DETECTIVE ACTION
  // ================================================

  let detectiveId: string | null = null;
  let detectiveName = "";
  let detectiveTargetId: string | null = null;
  let detectiveTargetName = "";
  let detectiveResult = "";

  detectiveSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();

    detectiveId =
      data.detectiveId ??
      actionDoc.id;

    detectiveTargetId =
      data.targetId ?? null;

    const detective = players.find(
      (player) => player.id === detectiveId
    );

    const target = players.find(
      (player) =>
        player.id === detectiveTargetId
    );

    detectiveName =
      detective?.nickname ??
      detective?.name ??
      "";

    detectiveTargetName =
      target?.nickname ??
      target?.name ??
      "";

    let result = "NOT_MAFIA";

    if (target?.role === "mafia") {
      result = "MAFIA";
    }

    // طبق قانون فعلی:
    // پدرخوانده برای کارآگاه مافیا دیده نمی‌شود.
    if (target?.role === "godfather") {
      result = "NOT_MAFIA";
    }

    detectiveResult = result;

    if (detectiveId) {
      batch.update(
        doc(
          db,
          "games",
          gameId,
          "players",
          detectiveId
        ),
        {
          investigatedPlayer:
            detectiveTargetName,
          investigationResult:
            detectiveResult,
          canUseAbility: false,
        }
      );
    }
  });

  // ================================================
  // NIGHT RESULT
  // ================================================

  const deadPlayers = new Set<string>();

  // --------------------------------
  // MAFIA KILL
  // --------------------------------

  let mafiaKilledPlayer = "";

  if (
    mafiaTarget &&
    mafiaTarget !== doctorSave
  ) {
    const target = players.find(
      (player) => player.id === mafiaTarget
    );

    if (
      target?.alive &&
      !deadPlayers.has(mafiaTarget)
    ) {
      deadPlayers.add(mafiaTarget);

      mafiaKilledPlayer =
        target.nickname ??
        target.name ??
        "";

      batch.update(
        doc(
          db,
          "games",
          gameId,
          "players",
          mafiaTarget
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

  // --------------------------------
  // SNIPER
  // --------------------------------

  let sniperKilledPlayer = "";
  let sniperDied = false;
  let sniperWasSaved = false;

  if (
    sniperTarget &&
    sniperTarget !== "SKIP"
  ) {
    const target = players.find(
      (player) =>
        player.id === sniperTarget
    );

    if (target) {
      const isMafia =
        target.role === "mafia" ||
        target.role === "godfather";

      // اسنایپر مافیا را زده
      if (isMafia) {
        if (
          target.alive &&
          !deadPlayers.has(target.id)
        ) {
          deadPlayers.add(target.id);

          sniperKilledPlayer =
            target.nickname ??
            target.name ??
            "";

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
      }

      // اسنایپر شهروند را زده
      else if (sniperId) {
        const sniper = players.find(
          (player) =>
            player.id === sniperId
        );

        // دکتر اسنایپر را نجات داده
        if (doctorSave === sniperId) {
          sniperWasSaved = true;
          sniperDied = false;
        }

        // اسنایپر می‌میرد
        else if (
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

  // ================================================
  // PROMOTE NEW GODFATHER
  // ================================================

  const godfatherAlive = players.some(
    (player) =>
      player.role === "godfather" &&
      player.alive &&
      !deadPlayers.has(player.id)
  );

  let promotedGodfatherId: string | null =
    null;

  let promotedGodfatherName = "";

  if (!godfatherAlive) {
    const newGodfather = players.find(
      (player) =>
        player.role === "mafia" &&
        player.alive &&
        !deadPlayers.has(player.id)
    );

    if (newGodfather) {
      promotedGodfatherId =
        newGodfather.id;

      promotedGodfatherName =
        newGodfather.nickname ??
        newGodfather.name ??
        "";

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

  // ================================================
  // SAVE COMPLETE NIGHT LOG
  // این قسمت برای پنل جدید هاست است
  // ================================================

  const nightLog = {
    resolvedAt: Date.now(),

    mafia: {
      actorId: godfatherId,
      actorName: godfatherName,
      targetId: mafiaTarget,
      targetName: mafiaTargetName,
      killedPlayer: mafiaKilledPlayer,
      blockedByDoctor:
        !!mafiaTarget &&
        mafiaTarget === doctorSave,
    },

    doctor: {
      actorId: doctorId,
      actorName: doctorName,
      targetId: doctorSave,
      targetName: doctorSaveName,
      savedMafiaTarget:
        !!mafiaTarget &&
        mafiaTarget === doctorSave,
      savedSniper:
        sniperWasSaved,
    },

    detective: {
      actorId: detectiveId,
      actorName: detectiveName,
      targetId: detectiveTargetId,
      targetName: detectiveTargetName,
      result: detectiveResult,
    },

    sniper: {
      actorId: sniperId,
      actorName: sniperName,
      targetId: sniperTarget,
      targetName: sniperTargetName,
      killedPlayer: sniperKilledPlayer,
      sniperDied,
      sniperWasSaved,
    },

    promotedGodfather: {
      playerId: promotedGodfatherId,
      playerName: promotedGodfatherName,
    },

    deadPlayers: Array.from(deadPlayers),
  };

  // ================================================
  // SAVE NIGHT RESULT
  // ================================================

  batch.update(
    doc(db, "games", gameId),
    {
      lastNightResult: {
        mafiaTarget,
        doctorSave,
        mafiaKilledPlayer,
        sniperKilledPlayer,
        sniperDied,
        sniperWasSaved,
        deadPlayers: Array.from(deadPlayers),
        resolvedAt: Date.now(),
      },

      // لاگ کامل برای پنل هاست
      lastNightLog: nightLog,
    }
  );

  // ================================================
  // RESET PLAYERS
  // ================================================

  players.forEach((player) => {
    if (
      !deadPlayers.has(player.id) &&
      player.alive
    ) {
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

  // ================================================
  // CLEAR NIGHT ACTIONS
  // ================================================

  mafiaVotesSnapshot.forEach((actionDoc) => {
    batch.delete(actionDoc.ref);
  });

  doctorSnapshot.forEach((actionDoc) => {
    batch.delete(actionDoc.ref);
  });

  detectiveSnapshot.forEach((actionDoc) => {
    batch.delete(actionDoc.ref);
  });

  sniperSnapshot.forEach((actionDoc) => {
    batch.delete(actionDoc.ref);
  });

  // ================================================
  // NEXT DAY
  // ================================================

  batch.update(
    doc(db, "games", gameId),
    {
      phase: "day",
      dayVotingOpen: false,
      currentDay: increment(1),
    }
  );

  await batch.commit();

  return nightLog;

  // Host decides when the game ends.
  // No automatic winner detection.
}