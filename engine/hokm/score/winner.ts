import type { Team } from "./score";

export interface TrickWinnerInput {
  winnerTeam: Team;
  currentScore: {
    teamA: number;
    teamB: number;
  };
}

export function resolveScore(
  input: TrickWinnerInput
) {
  const {
    winnerTeam,
    currentScore,
  } = input;

  const newScore = {
    teamA: currentScore.teamA,
    teamB: currentScore.teamB,
  };

  if (winnerTeam === "A") {
    newScore.teamA++;
  } else {
    newScore.teamB++;
  }

  const winner =
    newScore.teamA >= 7
      ? "A"
      : newScore.teamB >= 7
      ? "B"
      : null;

  return {
    score: newScore,
    winner,
  };
}