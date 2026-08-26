"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Shield,
  Lock,
} from "lucide-react";

export default function CreateGamePage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [roomName, setRoomName] = useState("");
  const [players, setPlayers] = useState(10);

  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] =
    useState(false);

  async function handleLogin() {
    if (!password.trim()) {
      alert("Please enter the host password");
      return;
    }

    setCheckingPassword(true);

    try {
      const response = await fetch(
        "/api/host-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.error ||
            "Wrong password"
        );
        return;
      }

      setPassword("");
      setAuthorized(true);
    } catch (error) {
      console.error(
        "HOST LOGIN ERROR:",
        error
      );

      alert(
        "Could not verify password. Please try again."
      );
    } finally {
      setCheckingPassword(false);
    }
  }

  async function handleCreateGame() {
    if (!roomName.trim()) {
      alert("Please enter room name");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/create-game",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: roomName.trim(),
            maxPlayers: players,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setAuthorized(false);

          alert(
            "Your host session has expired. Please enter the password again."
          );

          return;
        }

        throw new Error(
          data.error ||
            "Failed to create game"
        );
      }

      const gameId = data.gameId;

      alert(
        "Game Created!\n\nRoom ID: " +
          gameId
      );

      router.push(`/host/${gameId}`);
    } catch (error) {
      console.error(
        "CREATE GAME ERROR:",
        error
      );

      alert(
        "ERROR:\n\n" +
          (
            error instanceof Error
              ? error.message
              : String(error)
          )
      );
    } finally {
      setLoading(false);
    }
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#0B0B0F] text-white p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-yellow-400 mb-8"
          >
            <ArrowLeft size={20} />
            Back
          </Link>

          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <Lock
                  size={30}
                  className="text-yellow-400"
                />
              </div>
            </div>

            <h1 className="text-3xl font-black text-center">
              Host Access
            </h1>

            <p className="mt-3 mb-6 text-center text-gray-400">
              Enter the host password to create a new Mafia room.
            </p>

            <div>
              <label className="block mb-2">
                Host Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleLogin();
                  }
                }}
                placeholder="Enter password"
                autoFocus
                disabled={checkingPassword}
                className="w-full rounded-xl bg-[#0B0B0F] border border-zinc-700 p-4 outline-none focus:border-yellow-400 disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={checkingPassword}
              className="mt-6 w-full rounded-xl bg-yellow-500 py-4 text-lg font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              {checkingPassword
                ? "Checking..."
                : "Unlock Create Room"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-6">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400 mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        <h1 className="text-3xl font-black">
          Create Game
        </h1>

        <p className="text-gray-400 mt-2 mb-8">
          Create a new Mafia Room
        </p>

        <div className="space-y-6">
          <div>
            <label className="block mb-2">
              Room Name
            </label>

            <input
              value={roomName}
              onChange={(e) =>
                setRoomName(e.target.value)
              }
              placeholder="Example: TikTok Live"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-4 outline-none focus:border-yellow-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block mb-2">
              Max Players
            </label>

            <div className="flex items-center gap-3">
              <Users />

              <input
                type="range"
                min={5}
                max={20}
                value={players}
                onChange={(e) =>
                  setPlayers(
                    Number(e.target.value)
                  )
                }
                disabled={loading}
                className="w-full"
              />

              <span className="min-w-8 text-right">
                {players}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4">
            <div className="flex items-center gap-2">
              <Shield className="text-yellow-400" />

              <span>
                Classic Mafia
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateGame}
            disabled={loading}
            className="w-full rounded-xl bg-yellow-500 py-4 text-lg font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "CREATE ROOM"}
          </button>
        </div>
      </div>
    </main>
  );
}