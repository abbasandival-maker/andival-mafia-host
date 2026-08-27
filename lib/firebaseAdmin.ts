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

  if (
    !projectId ||
    !clientEmail ||
    !rawPrivateKey
  ) {
    throw new Error(
      "Firebase Admin environment variables are missing"
    );
  }

  const privateKey = rawPrivateKey
    .replace(/\\n/g, "\n")
    .trim();

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const adminApp = getFirebaseAdminApp();

export const adminDb = getFirestore(adminApp);