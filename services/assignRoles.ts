import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateRoles } from "./roleService";

type Player = { id: string };

export async function assignRoles(gameId: string) {
  const snapshot = await getDocs(collection(db, "games", gameId, "players"));
  const players: Player[] = snapshot.docs.map((docSnap) => ({ id: docSnap.id }));

  if (players.length < 6) throw new Error("Minimum 6 players required.");

  const stablePlayers = [...players].sort((a, b) => a.id.localeCompare(b.id, "en"));
  const roles = generateRoles(stablePlayers.length);
  const batch = writeBatch(db);

  stablePlayers.forEach((player, index) => {
    batch.update(doc(db, "games", gameId, "players", player.id), {
      role: roles[index],
      alive: true,
      eliminated: false,
      canVote: true,
      canUseAbility: true,
      hasInvestigated: false,
      investigatedPlayer: "",
      investigationResult: "",
      hasSelfSaved: false,
      vestActive: roles[index] === "detective",
      slaughterUses: roles[index] === "godfather" ? 2 : 0,
      purchaseUsed: roles[index] === "savval_goodman" ? false : true,
    });
  });

  await batch.commit();
  return true;
}
