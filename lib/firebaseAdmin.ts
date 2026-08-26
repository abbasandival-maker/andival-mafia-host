import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

import serviceAccount from "../firebase-service-account.json";

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

const adminApp = getFirebaseAdminApp();

export const adminDb =
  getFirestore(adminApp);