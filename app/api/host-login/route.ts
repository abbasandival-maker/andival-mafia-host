import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    const hostPassword =
      process.env.HOST_PASSWORD;

    if (!hostPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Host password is not configured",
        },
        { status: 500 }
      );
    }

    const inputBuffer =
      Buffer.from(password);

    const passwordBuffer =
      Buffer.from(hostPassword);

    const passwordMatches =
      inputBuffer.length === passwordBuffer.length &&
      timingSafeEqual(
        inputBuffer,
        passwordBuffer
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "Wrong password",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      COOKIE_NAME,
      createSessionToken(),
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 12,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "HOST LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
      },
      { status: 500 }
    );
  }
}