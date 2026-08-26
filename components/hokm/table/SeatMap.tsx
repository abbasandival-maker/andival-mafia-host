"use client";

import { SeatType } from "@/services/hokm/selectSeat";

interface Player {
  id: string;
  name: string;
  seat: SeatType | null;
  team: "A" | "B" | null;
}

interface SeatMapProps {
  players: Player[];
  currentPlayerId?: string | null;
  onSeatClick?: (seat: SeatType) => void;
  disabled?: boolean;
}

const seatConfig: Record<
  SeatType,
  {
    label: string;
    team: "A" | "B";
    border: string;
  }
> = {
  top: {
    label: "TOP",
    team: "A",
    border: "border-blue-500",
  },

  right: {
    label: "RIGHT",
    team: "B",
    border: "border-red-500",
  },

  bottom: {
    label: "BOTTOM",
    team: "A",
    border: "border-blue-500",
  },

  left: {
    label: "LEFT",
    team: "B",
    border: "border-red-500",
  },
};

const seats: SeatType[] = [
  "top",
  "left",
  "right",
  "bottom",
];

export default function SeatMap({
  players,
  currentPlayerId,
  onSeatClick,
  disabled = false,
}: SeatMapProps) {
  function getPlayer(seat: SeatType) {
    return players.find((player) => player.seat === seat);
  }

  function renderSeat(seat: SeatType) {
    const config = seatConfig[seat];
    const player = getPlayer(seat);

    const isCurrentPlayer =
      player?.id === currentPlayerId;

    return (
      <button
        key={seat}
        type="button"
        disabled={disabled || !!player}
        onClick={() => onSeatClick?.(seat)}
        className={`
          relative h-28 rounded-2xl border-2
          ${config.border}
          bg-neutral-900
          transition-all duration-200
          ${
            !player && !disabled
              ? "hover:scale-105 hover:bg-neutral-800"
              : ""
          }
          ${isCurrentPlayer ? "ring-2 ring-white" : ""}
          ${player ? "cursor-default" : ""}
          disabled:opacity-100
        `}
      >
        <div className="text-xs text-neutral-500">
          TEAM {config.team}
        </div>

        <div className="mt-1 font-bold">
          {player ? player.name : "EMPTY"}
        </div>

        <div className="mt-1 text-xs text-neutral-500">
          {config.label}
        </div>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">

      <div />

      {renderSeat("top")}

      <div />

      {renderSeat("left")}

      <div className="flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-lg font-bold">
        TABLE
      </div>

      {renderSeat("right")}

      <div />

      {renderSeat("bottom")}

      <div />

    </div>
  );
}