export type Team = "A" | "B";

export interface HokmScore {
  teamA: number;
  teamB: number;
}

export function createInitialScore(): HokmScore {
  return {
    teamA: 0,
    teamB: 0,
  };
}

export function addTrickToTeam(
  score: HokmScore,
  team: Team
): HokmScore {
  if (team === "A") {
    return {
      ...score,
      teamA: score.teamA + 1,
    };
  }

  return {
    ...score,
    teamB: score.teamB + 1,
  };
}