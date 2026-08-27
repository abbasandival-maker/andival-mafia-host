import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();

  const rawPrivateKey =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const privateKey = rawPrivateKey
    ? rawPrivateKey.replace(/\\n/g, "\n").trim()
    : "";

  const missing: string[] = [];

  if (!projectId) {
    missing.push("FIREBASE_ADMIN_PROJECT_ID");
  }

  if (!clientEmail) {
    missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  }

  if (!privateKey) {
    missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Firebase Admin missing environment variables: ${missing.join(", ")}`
    );
  }

  if (
    !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "Firebase Admin private key format is invalid"
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminDb() {
  const adminApp = getFirebaseAdminApp();
  return getFirestore(adminApp);
}