import { HokmGameState } from "./game-state";

export interface HokmGame {
  id: string;

  state: HokmGameState;

  createdAt: number;

  updatedAt: number;
}