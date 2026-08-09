import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Invite } from "../types";
import type { User } from "firebase/auth";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "https://api.leedyer.com";

export async function getInviteToken(token: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, "invites", token));

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

export async function acceptToken(
  token: string,
  user: User
): Promise<{ success: boolean; error?: string; budgetId?: string }> {
  const freshToken = await user.getIdToken(true);

  try {
    const resp = await fetch(`${SERVER_URL}/invite/nvelopes/${token}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${freshToken}`,
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.log("REQUEST FAILED:", resp.status, text);
      return { success: false, error: text };
    }
    const { budgetId } = await resp.json();

    return { success: resp.status === 200, budgetId };
  } catch (error) {
    console.error("Error reaching invite server: ", error);
    return { success: false, error: error as string };
  }
}

interface IinviteUserToBudget {
  activeBudgetId: string;
  budgetName: string;
  toEmail: string;
  user: User;
}

/** Mobile token-based invite API: POST /invite/nvelopes/ -> token -> invites/{token}. */
export async function inviteUserToBudget({
  activeBudgetId,
  budgetName,
  toEmail,
  user,
}: IinviteUserToBudget): Promise<string | undefined> {
  if (!activeBudgetId || !toEmail || !user) return;
  const freshToken = await user.getIdToken(true);
  const response = await fetch(`${SERVER_URL}/invite/nvelopes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${freshToken}`,
    },
    body: JSON.stringify({
      budgetId: activeBudgetId,
      budgetName,
      invitedByUid: user.uid,
      invitedEmail: toEmail,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.log("REQUEST FAILED:", response.status, text);
    return;
  }

  const data = await response.json();
  return data.token;
}
