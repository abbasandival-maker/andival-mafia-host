import { collection, getDocs, doc, writeBatch, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const isMafiaRole = (role: string) =>
  role === "godfather" || role === "savval_goodman" || role === "mafia";

export async function resolveNight(gameId: string) {
  const playersSnapshot = await getDocs(collection(db, "games", gameId, "players"));
  const players = playersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

  const [mafiaVotesSnapshot, doctorSnapshot, sniperSnapshot, detectiveSnapshot, slaughterSnapshot, purchaseSnapshot] =
    await Promise.all([
      getDocs(collection(db, "games", gameId, "mafiaVotes")),
      getDocs(collection(db, "games", gameId, "doctorActions")),
      getDocs(collection(db, "games", gameId, "sniperActions")),
      getDocs(collection(db, "games", gameId, "detectiveActions")),
      getDocs(collection(db, "games", gameId, "slaughterActions")),
      getDocs(collection(db, "games", gameId, "purchaseActions")),
    ]);

  const batch = writeBatch(db);

  let mafiaTarget: string | null = null;
  let mafiaTargetName = "";
  let godfatherId: string | null = null;
  let godfatherName = "";

  mafiaVotesSnapshot.forEach((voteDoc) => {
    const data = voteDoc.data();
    mafiaTarget = data.targetId ?? null;
    const voterId = data.godfatherId ?? data.playerId ?? voteDoc.id;
    const voter = players.find((p) => p.id === voterId);
    if (voter?.role === "godfather") {
      godfatherId = voter.id;
      godfatherName = voter.nickname ?? voter.name ?? "";
    }
  });

  if (mafiaTarget) {
    const target = players.find((p) => p.id === mafiaTarget);
    mafiaTargetName = target?.nickname ?? target?.name ?? "";
  }

  if (!godfatherId) {
    const godfather = players.find((p) => p.role === "godfather" && p.alive);
    if (godfather) {
      godfatherId = godfather.id;
      godfatherName = godfather.nickname ?? godfather.name ?? "";
    }
  }

  let doctorSave: string | null = null;
  let doctorId: string | null = null;
  let doctorName = "";
  let doctorSaveName = "";

  doctorSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();
    doctorId = data.doctorId ?? actionDoc.id;
    doctorSave = data.targetId ?? null;
    const doctor = players.find((p) => p.id === doctorId);
    const target = players.find((p) => p.id === doctorSave);
    doctorName = doctor?.nickname ?? doctor?.name ?? "";
    doctorSaveName = target?.nickname ?? target?.name ?? "";
  });

  let sniperTarget: string | null = null;
  let sniperTargetName = "";
  let sniperId: string | null = null;
  let sniperName = "";

  sniperSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();
    sniperId = data.sniperId ?? actionDoc.id;
    sniperTarget = data.targetId ?? null;
    const sniper = players.find((p) => p.id === sniperId);
    const target = players.find((p) => p.id === sniperTarget);
    sniperName = sniper?.nickname ?? sniper?.name ?? "";
    sniperTargetName = target?.nickname ?? target?.name ?? "";
  });

  let detectiveId: string | null = null;
  let detectiveName = "";
  let detectiveTargetId: string | null = null;
  let detectiveTargetName = "";
  let detectiveResult = "";

  detectiveSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();
    detectiveId = data.detectiveId ?? actionDoc.id;
    detectiveTargetId = data.targetId ?? null;
    const detective = players.find((p) => p.id === detectiveId);
    const target = players.find((p) => p.id === detectiveTargetId);
    detectiveName = detective?.nickname ?? detective?.name ?? "";
    detectiveTargetName = target?.nickname ?? target?.name ?? "";
    detectiveResult = target && isMafiaRole(target.role) ? "MAFIA" : "NOT_MAFIA";

    if (detectiveId) {
      batch.update(doc(db, "games", gameId, "players", detectiveId), {
        investigatedPlayer: detectiveTargetName,
        investigationResult: detectiveResult,
        canUseAbility: false,
      });
    }
  });

  const deadPlayers = new Set<string>();

  // -------------------------------
  // SLAUGHTER — resolves first and cannot be saved by Doctor
  // -------------------------------
  let slaughterTarget = "";
  let slaughterTargetName = "";
  let slaughterGuessedRole = "";
  let slaughterCorrect = false;
  let slaughterKilledPlayer = "";

  slaughterSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();
    slaughterTarget = data.targetId ?? "";
    slaughterGuessedRole = data.guessedRole ?? "";
    slaughterCorrect = data.correct === true;
  });

  if (slaughterTarget && slaughterCorrect) {
    const target = players.find((p) => p.id === slaughterTarget);
    if (target?.alive) {
      deadPlayers.add(slaughterTarget);
      slaughterTargetName = target.nickname ?? target.name ?? "";
      slaughterKilledPlayer = slaughterTargetName;
      batch.update(doc(db, "games", gameId, "players", slaughterTarget), {
        alive: false,
        eliminated: true,
      });
      batch.update(doc(db, "games", gameId), { alivePlayers: increment(-1) });
    }
  } else if (slaughterTarget) {
    const target = players.find((p) => p.id === slaughterTarget);
    slaughterTargetName = target?.nickname ?? target?.name ?? "";
  }

  // -------------------------------
  // SAVVAL GOODMAN PURCHASE
  // Any purchase attempt cancels the normal mafia shot for this night.
  // -------------------------------
  let purchaseUsed = purchaseSnapshot.size > 0;
  let purchaseTarget = "";
  let purchaseTargetName = "";
  let purchaseSuccess = false;

  purchaseSnapshot.forEach((actionDoc) => {
    const data = actionDoc.data();
    purchaseTarget = data.targetId ?? "";
    purchaseSuccess = data.success === true;
  });

  if (purchaseTarget) {
    const target = players.find((p) => p.id === purchaseTarget);
    purchaseTargetName = target?.nickname ?? target?.name ?? "";

    // Successful purchase is applied immediately by savvalGoodman.ts.
    // Here we only preserve the result in the night log; the role must not
    // be converted a second time during night resolution.
    if (purchaseSuccess && target?.alive && target.role === "mafia") {
      // No-op intentionally: the target is already Mafia.
    }
  }

  // -------------------------------
  // MAFIA KILL
  // -------------------------------
  let mafiaKilledPlayer = "";
  let mafiaBlockedByPurchase = purchaseUsed;
  let detectiveVestTriggered = false;

  if (mafiaTarget && !mafiaBlockedByPurchase) {
    const target = players.find((p) => p.id === mafiaTarget);

    // Detective's one-shot vest absorbs the first mafia shot.
    if (target?.role === "detective" && target.vestActive && target.alive) {
      detectiveVestTriggered = true;
      batch.update(doc(db, "games", gameId, "players", target.id), {
        vestActive: false,
      });
    } else if (target?.alive && !deadPlayers.has(mafiaTarget)) {
      if (mafiaTarget !== doctorSave) {
        deadPlayers.add(mafiaTarget);
        mafiaKilledPlayer = target.nickname ?? target.name ?? "";
        batch.update(doc(db, "games", gameId, "players", mafiaTarget), {
          alive: false,
          eliminated: true,
        });
        batch.update(doc(db, "games", gameId), { alivePlayers: increment(-1) });
      }
    }
  }

  // -------------------------------
  // SNIPER
  // -------------------------------
  let sniperKilledPlayer = "";
  let sniperDied = false;
  let sniperWasSaved = false;

  if (sniperTarget && sniperTarget !== "SKIP") {
    const target = players.find((p) => p.id === sniperTarget);
    if (target) {
      if (isMafiaRole(target.role)) {
        if (target.alive && !deadPlayers.has(target.id)) {
          deadPlayers.add(target.id);
          sniperKilledPlayer = target.nickname ?? target.name ?? "";
          batch.update(doc(db, "games", gameId, "players", target.id), {
            alive: false,
            eliminated: true,
          });
          batch.update(doc(db, "games", gameId), { alivePlayers: increment(-1) });
        }
      } else if (sniperId) {
        const sniper = players.find((p) => p.id === sniperId);
        if (doctorSave === sniperId) {
          sniperWasSaved = true;
        } else if (sniper?.alive && !deadPlayers.has(sniperId)) {
          deadPlayers.add(sniperId);
          sniperDied = true;
          batch.update(doc(db, "games", gameId, "players", sniperId), {
            alive: false,
            eliminated: true,
          });
          batch.update(doc(db, "games", gameId), { alivePlayers: increment(-1) });
        }
      }
    }
  }

  // -------------------------------
  // PROMOTE NEW GODFATHER
  // -------------------------------
  const godfatherAlive = players.some(
    (player) => player.role === "godfather" && player.alive && !deadPlayers.has(player.id),
  );
  let promotedGodfatherId: string | null = null;
  let promotedGodfatherName = "";

  if (!godfatherAlive) {
    const newGodfather = players.find(
      (player) =>
        (player.role === "savval_goodman" || player.role === "mafia") &&
        player.alive &&
        !deadPlayers.has(player.id),
    );
    if (newGodfather) {
      promotedGodfatherId = newGodfather.id;
      promotedGodfatherName = newGodfather.nickname ?? newGodfather.name ?? "";
      batch.update(doc(db, "games", gameId, "players", newGodfather.id), {
        role: "godfather",
      });
    }
  }

  const nightLog = {
    resolvedAt: Date.now(),
    mafia: {
      actorId: godfatherId,
      actorName: godfatherName,
      targetId: mafiaTarget,
      targetName: mafiaTargetName,
      killedPlayer: mafiaKilledPlayer,
      blockedByDoctor: !!mafiaTarget && mafiaTarget === doctorSave,
      blockedByPurchase: mafiaBlockedByPurchase,
      detectiveVestTriggered,
    },
    slaughter: {
      targetId: slaughterTarget || null,
      targetName: slaughterTargetName,
      guessedRole: slaughterGuessedRole,
      correct: slaughterCorrect,
      killedPlayer: slaughterKilledPlayer,
    },
    purchase: {
      targetId: purchaseTarget || null,
      targetName: purchaseTargetName,
      success: purchaseSuccess,
      used: purchaseUsed,
    },
    doctor: {
      actorId: doctorId,
      actorName: doctorName,
      targetId: doctorSave,
      targetName: doctorSaveName,
      savedMafiaTarget: !!mafiaTarget && mafiaTarget === doctorSave,
      savedSniper: sniperWasSaved,
    },
    detective: {
      actorId: detectiveId,
      actorName: detectiveName,
      targetId: detectiveTargetId,
      targetName: detectiveTargetName,
      result: detectiveResult,
      vestTriggered: detectiveVestTriggered,
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

  batch.update(doc(db, "games", gameId), {
    lastNightResult: {
      mafiaTarget,
      doctorSave,
      mafiaKilledPlayer,
      sniperKilledPlayer,
      sniperDied,
      sniperWasSaved,
      slaughterTarget: slaughterTarget || null,
      slaughterCorrect,
      slaughterKilledPlayer,
      purchaseTarget: purchaseTarget || null,
      purchaseSuccess,
      mafiaBlockedByPurchase,
      detectiveVestTriggered,
      deadPlayers: Array.from(deadPlayers),
      resolvedAt: Date.now(),
    },
    lastNightLog: nightLog,
  });

  players.forEach((player) => {
    if (!deadPlayers.has(player.id) && player.alive) {
      batch.update(doc(db, "games", gameId, "players", player.id), {
        canUseAbility: true,
        canVote: true,
        vote: null,
        purchasedThisNight: false,
      });
    }
  });

  for (const snapshot of [mafiaVotesSnapshot, doctorSnapshot, detectiveSnapshot, sniperSnapshot, slaughterSnapshot, purchaseSnapshot]) {
    snapshot.forEach((actionDoc) => batch.delete(actionDoc.ref));
  }

  batch.update(doc(db, "games", gameId), {
    phase: "day",
    dayVotingOpen: false,
    currentDay: increment(1),
  });

  await batch.commit();
  return nightLog;
}
