import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Invite } from "../types";

export async function getInviteToken(token: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, "invites", token));
  console.log("projectId:", db.app.options.projectId);
  console.log("token param:", JSON.stringify(token));

  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    budgetId: d.budgetId,
    budgetName: d.budgetName,
    invitedByUid: d.invitedByUid,
    invitedByName: d.invitedByName,
    invitedEmail: d.invitedEmail,
    status: d.status,
    expiresAt: d.expiresAt,
    consumedByUid: d.consumedByUid,
    consumedAt: d.consumedAt,
    createdAt: d.createdAt,
  };
}
