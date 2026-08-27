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
    process.env.FIREBASE_ADMIN_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin environment variables are missing"
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