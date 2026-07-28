export type GameStatus =
  | "LOBBY"
  | "ROLE_DISTRIBUTION"
  | "NIGHT"
  | "MORNING"
  | "DISCUSSION"
  | "VOTE_1"
  | "DEFENSE"
  | "VOTE_2"
  | "EXECUTION"
  | "FINISHED";

export type PlayerStatus =
  | "ALIVE"
  | "DEAD"
  | "KICKED";

export type Role =
  | "CITIZEN"
  | "MAFIA"
  | "GODFATHER"
  | "DOCTOR"
  | "SNIPER";

export interface Player {

  id: string;

  nickname: string;

  role?: Role;

  status: PlayerStatus;

  joinedAt: number;

  canVote: boolean;

  canUseAbility: boolean;

  isConnected: boolean;

}

export interface GameSettings {

  mafiaCount: number;

  doctor: boolean;

  sniper: boolean;

  discussionTime: number;

  defenseTime: number;

  votingTime: number;

}

export interface Game {

  gameId: string;

  roomName: string;

  status: GameStatus;

  createdAt: unknown;

  maxPlayers: number;

  players: number;

  settings: GameSettings;

}