import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const COOKIE_NAME = "andival_host_session";

function createSessionToken() {
  const secret = process.env.HOST_SESSION_SECRET;

  if (!secret) {
    throw new Error("HOST_SESSION_SECRET is missing");
  }

  return createHmac("sha256", secret)
    .update("andival-mafia-host")
    .digest("hex");
}

function isAuthorized(request: NextRequest) {
  const session =
    request.cookies.get(COOKIE_NAME)?.value;

  if (!session) {
    return false;
  }

  const expected =
    createSessionToken();

  const sessionBuffer =
    Buffer.from(session);

  const expectedBuffer =
    Buffer.from(expected);

  return (
    sessionBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      sessionBuffer,
      expectedBuffer
    )
  );
}

function generateNumericRoomCode(): string {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

export async function POST(
  request: NextRequest
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const roomName =
      typeof body?.roomName === "string"
        ? body.roomName.trim()
        : "";

    const maxPlayers =
      Number(body?.maxPlayers);

    if (!roomName) {
      return NextResponse.json(
        {
          success: false,
          error: "Room name is required",
        },
        { status: 400 }
      );
    }

    const safeMaxPlayers =
      Number.isFinite(maxPlayers) &&
      maxPlayers >= 5 &&
      maxPlayers <= 20
        ? Math.floor(maxPlayers)
        : 10;

    let gameId = "";
    let exists = true;

    while (exists) {
      gameId =
        generateNumericRoomCode();

      const gameSnapshot =
        await adminDb
          .collection("games")
          .doc(gameId)
          .get();

      exists = gameSnapshot.exists;
    }

    await adminDb
      .collection("games")
      .doc(gameId)
      .set({
        id: gameId,
        roomName,
        status: "lobby",
        phase: "waiting",
        createdAt: Date.now(),
        currentDay: 1,
        maxPlayers: safeMaxPlayers,
        alivePlayers: 0,
        roomCode: gameId,
      });

    return NextResponse.json({
      success: true,
      gameId,
    });
  } catch (error) {
    console.error(
      "CREATE GAME API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create game",
      },
      { status: 500 }
    );
  }
}