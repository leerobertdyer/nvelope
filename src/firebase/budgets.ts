import firestore from "@react-native-firebase/firestore";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { MONTHLY, BUDGET_DATA_DOC_ID } from "../constants";
import type { Interval, NvelopesTransaction } from "../types";

type User = FirebaseAuthTypes.User;

function budgetRef(budgetId: string) {
  return firestore().doc(`budgets/${budgetId}`);
}

export function budgetDataRef(budgetId: string) {
  return firestore().doc(`budgets/${budgetId}/data/${BUDGET_DATA_DOC_ID}`);
}

const BUDGET_INVITES_COLLECTION = "budgetInvites";

const defaultBudgetName = (user: User) =>
  user?.email ? `${user.email}'s Budget` : "My Budget";

/**
 * Creates the first budget for a user (first-time setup). Writes budget meta, data doc, and users/{uid}/budgets/{budgetId}.
 * Returns the new budgetId or null on failure.
 */
export async function createFirstBudget(
  user: User,
  name?: string,
): Promise<string | null> {
  if (!user) {
    console.error("createFirstBudget: No user provided");
    return null;
  }
  const budgetName = name ?? defaultBudgetName(user);
  try {
    const newBudgetRef = firestore().collection("budgets").doc();
    const budgetId = newBudgetRef.id;
    const dataRef = budgetDataRef(budgetId);
    const userBudgetRef = firestore().doc(
      `users/${user.uid}/budgets/${budgetId}`,
    );

    const budgetMeta = {
      name: budgetName,
      ownerId: user.uid,
      memberIds: [user.uid],
      memberEmails: { [user.uid]: (user.email ?? "").trim().toLowerCase() },
      createdAt: firestore.Timestamp.now(),
    };
    const initialData = {
      envelopes: [],
      payDate: null,
      payPeriodInterval: "MONTHLY",
      payments: [],
      totalSpendingBudget: 0,
      oneTimeCash: null,
      snowball: 0,
      snowballTargetPaymentId: null,
      isNewUser: true,
      backups: null,
    };
    const userBudgetDoc = { name: budgetName, budgetId };

    await newBudgetRef.set(budgetMeta);
    await dataRef.set(initialData);
    await userBudgetRef.set(userBudgetDoc);
    return budgetId;
  } catch (error) {
    console.error("createFirstBudget failed:", error);
    return null;
  }
}

/**
 * Create a new budget (from Settings). Requires payDate and payPeriodInterval so the budget is ready to use.
 * Same as createFirstBudget but isNewUser: false and accepts initial pay date/interval.
 */
export async function createBudget(
  user: User,
  name: string | undefined,
  payDate: Date,
  payPeriodInterval: Interval,
): Promise<string | null> {
  if (!user) return null;
  const budgetName = name?.trim() || defaultBudgetName(user);
  try {
    const newBudgetRef = firestore().collection("budgets").doc();
    const budgetId = newBudgetRef.id;
    const dataRef = budgetDataRef(budgetId);
    const userBudgetRef = firestore().doc(
      `users/${user.uid}/budgets/${budgetId}`,
    );
    const budgetMeta = {
      name: budgetName,
      ownerId: user.uid,
      memberIds: [user.uid],
      memberEmails: { [user.uid]: (user.email ?? "").trim().toLowerCase() },
      createdAt: firestore.Timestamp.now(),
    };
    const initialData = {
      envelopes: [],
      payDate: firestore.Timestamp.fromDate(payDate),
      payPeriodInterval: payPeriodInterval ?? MONTHLY,
      payments: [],
      totalSpendingBudget: 0,
      oneTimeCash: null,
      snowball: 0,
      snowballTargetPaymentId: null,
      isNewUser: false,
      backups: null,
    };
    const userBudgetDoc = { name: budgetName, budgetId };
    await newBudgetRef.set(budgetMeta);
    await dataRef.set(initialData);
    await userBudgetRef.set(userBudgetDoc);
    return budgetId;
  } catch (error) {
    console.error("createBudget failed:", error);
    return null;
  }
}

/** Get budget metadata (ownerId, memberIds, name, memberEmails). */
export async function getBudgetMeta(budgetId: string) {
  const snap = await budgetRef(budgetId).get();
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d) return;
  return {
    name: d.name ?? "Budget",
    ownerId: d.ownerId as string,
    memberIds: (d.memberIds as string[]) ?? [],
    memberEmails: (d.memberEmails as Record<string, string>) ?? undefined,
    createdAt: d.createdAt,
  };
}

/** Owner: delete budget, its data doc, and all users' budget refs. Member: leave (remove self from memberIds, delete own ref). */
export async function deleteBudgetAsOwner(
  ownerId: string,
  budgetId: string,
): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    console.log("[nvelope invite] meta:", meta, "ownerId:", ownerId);
    if (!meta || meta.ownerId !== ownerId) return false;
    const dataRef = budgetDataRef(budgetId);
    for (const uid of meta.memberIds) {
      const userBudgetRef = firestore().doc(`users/${uid}/budgets/${budgetId}`);
      await userBudgetRef.delete();
    }
    await dataRef.delete();
    await budgetRef(budgetId).delete();
    return true;
  } catch (error) {
    console.error("deleteBudgetAsOwner failed:", error);
    return false;
  }
}

/** Member leaves budget: remove self from memberIds, delete own users/{uid}/budgets/{budgetId}. */
export async function leaveBudget(
  userId: string,
  budgetId: string,
): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId === userId) return false;
    await budgetRef(budgetId).update({
      memberIds: firestore.FieldValue.arrayRemove(userId),
    });
    const userBudgetRef = firestore().doc(
      `users/${userId}/budgets/${budgetId}`,
    );
    await userBudgetRef.delete();
    return true;
  } catch (error) {
    console.error("leaveBudget failed:", error);
    return false;
  }
}

/** Owner removes a member from the budget. */
export async function removeMemberFromBudget(
  ownerId: string,
  budgetId: string,
  memberId: string,
): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId !== ownerId || memberId === ownerId) return false;
    await budgetRef(budgetId).update({
      memberIds: firestore.FieldValue.arrayRemove(memberId),
    });
    const userBudgetRef = firestore().doc(
      `users/${memberId}/budgets/${budgetId}`,
    );
    await userBudgetRef.delete();
    return true;
  } catch (error) {
    console.error("removeMemberFromBudget failed:", error);
    return false;
  }
}

/** Update budget name and sync to all members' user budget refs. Caller must be owner or member. */
export async function updateBudgetName(
  budgetId: string,
  _userId: string,
  newName: string,
): Promise<boolean> {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta) return false;
    await budgetRef(budgetId).update({ name: trimmed });
    for (const uid of meta.memberIds) {
      const userBudgetRef = firestore().doc(`users/${uid}/budgets/${budgetId}`);
      await userBudgetRef.update({ name: trimmed });
    }
    return true;
  } catch (error) {
    console.error("updateBudgetName failed:", error);
    return false;
  }
}

const INVITE_DEBUG = true; // set false to reduce console noise

/** Owner invites by email. Writes a single doc to budgetInvites (doc ID = budgetId_email for rule lookup). */
export async function addInviteToBudget(
  budgetId: string,
  email: string,
  ownerId: string,
  ownerEmail: string,
): Promise<boolean> {
  try {
    if (INVITE_DEBUG) {
      console.log("[nvelope invite] addInviteToBudget called:", {
        budgetId,
        email,
        ownerId,
      });
    }
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId !== ownerId) {
      if (INVITE_DEBUG)
        console.log(
          "[nvelope invite] addInviteToBudget: not owner or no meta, skipping",
        );
      return false;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      if (INVITE_DEBUG)
        console.log(
          "[nvelope invite] addInviteToBudget: empty email after normalize",
        );
      return false;
    }
    const inviteDocId = budgetId + "_" + normalizedEmail;
    console.log("WHAT THE HELL: ", {
      budgetId,
      inviteDocId,
      normalizedEmail,
      ownerId,
    });
    const inviterEmail = (ownerEmail ?? "").trim().toLowerCase();
    const invitePayload = {
      budgetId,
      email: normalizedEmail,
      invitedBy: ownerId,
      inviterEmail: inviterEmail || undefined,
      createdAt: firestore.Timestamp.now(),
    };
    if (INVITE_DEBUG) {
      console.log("[nvelope invite] addInviteToBudget: persisting", {
        toEmail: normalizedEmail,
        inviteDocId,
        path: `${BUDGET_INVITES_COLLECTION}/${inviteDocId}`,
        payload: invitePayload,
      });
    }
    const inviteRef = firestore().doc(
      `${BUDGET_INVITES_COLLECTION}/${inviteDocId}`,
    );
    await inviteRef.set(invitePayload);
    if (INVITE_DEBUG) {
      console.log(
        "[nvelope invite] addInviteToBudget: persisted OK at",
        inviteRef.path,
      );
    }
    return true;
  } catch (error) {
    console.error("[nvelope invite] addInviteToBudget failed:", error);
    return false;
  }
}

/**
 * Decode ID token payload (client-side, for debugging). Does not verify signature.
 * Returns the payload object or null if decode fails.
 */
function decodeIdTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface PendingInvite {
  inviteId: string;
  budgetId: string;
  budgetName: string;
  inviterEmail: string;
}

/**
 * Returns pending invites for the current user (by email). Does not accept or delete; for modal UX.
 */
export async function getPendingInvites(user: User): Promise<PendingInvite[]> {
  let tokenEmail: string | null = null;
  try {
    const token = await user.getIdToken(false);

    const payload = decodeIdTokenPayload(token);
    tokenEmail =
      payload?.email != null
        ? String(payload.email).trim().toLowerCase()
        : null;
  } catch {
    return [];
  }
  if (!tokenEmail) return [];

  try {
    const snap = await firestore()
      .collection(BUDGET_INVITES_COLLECTION)
      .where("email", "==", tokenEmail)
      .get();

    const result: PendingInvite[] = [];
    for (const inviteDoc of snap.docs) {
      const data = inviteDoc.data();
      const bid = data.budgetId as string;
      if (!bid) continue;
      const budgetSnap = await budgetRef(bid).get();
      if (!budgetSnap.exists) continue; // property not method
      const budgetData = budgetSnap.data();
      if (!budgetData) continue;
      const memberIds = (budgetData.memberIds as string[]) ?? [];
      if (memberIds.includes(user.uid)) continue;
      const name = (budgetData.name as string) ?? "Budget";
      const inviterEmail = (data.inviterEmail as string)?.trim() || "Someone";
      result.push({
        inviteId: inviteDoc.id,
        budgetId: bid,
        budgetName: name,
        inviterEmail,
      });
    }
    return result;
  } catch (error) {
    console.error("[nvelope invite] getPendingInvites failed:", error);
    return [];
  }
}

/**
 * Accept one invite: add user to budget (memberIds + memberEmails), create user budget ref, delete invite.
 */
export async function acceptInvite(
  user: User,
  budgetId: string,
): Promise<void> {
  let tokenEmail: string | null = null;
  try {
    const token = await user.getIdToken(false);
    const payload = decodeIdTokenPayload(token);
    tokenEmail =
      payload?.email != null
        ? String(payload.email).trim().toLowerCase()
        : null;
  } catch (e) {
    throw new Error(`Could not get email from token: ${e}`);
  }
  if (!tokenEmail) throw new Error("No email in token");

  const budgetSnap = await budgetRef(budgetId).get();
  if (!budgetSnap.exists) throw new Error("Budget not found");
  const budgetData = budgetSnap.data();
  if (!budgetData) return;
  const name = (budgetData.name as string) ?? "Budget";
  const memberIds = (budgetData.memberIds as string[]) ?? [];
  if (memberIds.includes(user.uid)) {
    // Already member; just delete invite if exists
    const inviteId = budgetId + "_" + tokenEmail;
    const inviteRef = firestore().doc(
      `${BUDGET_INVITES_COLLECTION}/${inviteId}`,
    );
    await inviteRef.delete();
    return;
  }

  await budgetRef(budgetId).update({
    memberIds: firestore.FieldValue.arrayUnion(user.uid),
    [`memberEmails.${user.uid}`]: tokenEmail,
  });

  await firestore()
    .doc(`users/${user.uid}/budgets/${budgetId}`)
    .set({ name, budgetId });

  const inviteId = budgetId + "_" + tokenEmail;
  const inviteRef = firestore().doc(`${BUDGET_INVITES_COLLECTION}/${inviteId}`);
  await inviteRef.delete();
}

/**
 * Decline one invite: delete the invite doc so it is not shown again.
 */
export async function declineInvite(inviteId: string): Promise<void> {
  const inviteRef = firestore().doc(`${BUDGET_INVITES_COLLECTION}/${inviteId}`);
  await inviteRef.delete();
}

/**
 * Call on app load: for current user's email, consume any invites (add user to budget, delete invite). Returns count processed.
 * Firestore rule allows update on budgets/{id} when budgetInvites/{budgetId_email} exists.
 * @deprecated Use getPendingInvites + acceptInvite/declineInvite for modal UX instead.
 */
export async function processInvitesForUser(user: User): Promise<number> {
  const email = user?.email?.trim()?.toLowerCase();
  if (INVITE_DEBUG) {
    console.log("[nvelope invite] processInvitesForUser:", {
      uid: user?.uid,
      emailRaw: user?.email ?? "(none)",
      emailNormalized: email ?? "(none)",
    });
  }
  if (!email) return 0;

  // Firestore rule allows read only when resource.data.email == request.auth.token.email.
  // If the ID token has no email claim, the query would get permission-denied. Skip the query in that case.
  let tokenEmail: string | null = null;
  try {
    const token = await user.getIdToken(false);
    const payload = decodeIdTokenPayload(token);
    tokenEmail =
      payload?.email != null
        ? String(payload.email).trim().toLowerCase()
        : null;
    if (INVITE_DEBUG) {
      console.log(
        "[nvelope invite] processInvitesForUser: ID token email claim:",
        tokenEmail ?? "(missing)",
      );
    }
  } catch (e) {
    if (INVITE_DEBUG)
      console.warn(
        "[nvelope invite] processInvitesForUser: could not get/decode ID token",
        e,
      );
  }
  if (tokenEmail == null || tokenEmail === "") {
    if (INVITE_DEBUG) {
      console.log(
        "[nvelope invite] processInvitesForUser: skipping invite query (no email in ID token; rule would deny). Sign in with a provider that includes email (e.g. Google).",
      );
    }
    return 0;
  }

  try {
    const snap = await firestore()
      .collection(BUDGET_INVITES_COLLECTION)
      .where("email", "==", tokenEmail)
      .get();
    if (INVITE_DEBUG) {
      console.log(
        "[nvelope invite] processInvitesForUser: running query where email ==",
        tokenEmail,
      );
    }
    if (INVITE_DEBUG) {
      console.log(
        "[nvelope invite] processInvitesForUser: query returned",
        snap.docs.length,
        "invite(s)",
      );
    }
    let count = 0;
    const metaCache: Record<string, { name: string }> = {};
    for (const inviteDoc of snap.docs) {
      const data = inviteDoc.data();
      const bid = data.budgetId as string;
      if (INVITE_DEBUG) {
        console.log(
          "[nvelope invite] processInvitesForUser: processing invite",
          {
            inviteDocId: inviteDoc.id,
            budgetId: bid,
            inviteEmail: data.email,
            ruleCheckPath: `budgetInvites/${bid}_${tokenEmail}`,
          },
        );
      }
      if (!bid) continue;
      let name = metaCache[bid]?.name;
      if (name === undefined) {
        const m = await getBudgetMeta(bid);
        name = m?.name ?? "Budget";
        metaCache[bid] = { name };
      }
      const budgetSnap = await budgetRef(bid).get();
      if (!budgetSnap.exists()) {
        if (INVITE_DEBUG)
          console.log(
            "[nvelope invite] processInvitesForUser: budget missing, deleting stale invite",
          );
        await inviteDoc.ref.delete();
        continue;
      }
      const budgetData = budgetSnap.data();
      if (!budgetData) continue;
      const memberIds = (budgetData.memberIds as string[]) ?? [];
      if (INVITE_DEBUG) {
        console.log("[nvelope invite] processInvitesForUser: budget meta", {
          budgetId: bid,
          ownerId: budgetData?.ownerId,
          memberIds,
          currentUserInMembers: memberIds.includes(user.uid),
        });
      }
      if (memberIds.includes(user.uid)) {
        if (INVITE_DEBUG)
          console.log(
            "[nvelope invite] processInvitesForUser: already member, deleting invite",
          );
        await inviteDoc.ref.delete();
        continue;
      }
      if (INVITE_DEBUG) {
        console.log(
          "[nvelope invite] processInvitesForUser: about to update budget",
          bid,
          "memberIds (arrayUnion)",
          user.uid,
          "- rule will check exists(budgetInvites/" +
            bid +
            "_" +
            tokenEmail +
            ")",
        );
      }
      await budgetRef(bid).update({
        memberIds: firestore.FieldValue.arrayUnion(user.uid),
        [`memberEmails.${user.uid}`]: tokenEmail,
      });
      await firestore().doc(`users/${user.uid}/budgets/${bid}`).update({
        name,
        budgetId: bid,
      });
      await inviteDoc.ref.delete();
      count++;
    }
    return count;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("[nvelope invite] processInvitesForUser failed:", {
      message: err?.message,
      code: err?.code,
      fullError: error,
    });
    return 0;
  }
}

/** @deprecated Use createFirstBudget. Kept for migration script / reference. */
export async function createUserDocument(user: User) {
  const budgetId = await createFirstBudget(user);
  return budgetId != null;
}

/**
 * Create first budget with defaults so MainView can render (e.g. when user skips first-time setup).
 */
export async function completeDemoWithDefaults(user: User): Promise<boolean> {
  if (!user) return false;
  try {
    const now = new Date();
    const defaultPayDate = firestore.Timestamp.fromDate(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
    const budgetId = await createFirstBudget(user);
    if (!budgetId) return false;
    const dataRef = budgetDataRef(budgetId);
    await dataRef.update({ isNewUser: false, payDate: defaultPayDate });
    return true;
  } catch (error) {
    console.error("completeDemoWithDefaults failed:", error);
    return false;
  }
}

export async function getTransactions(
  budgetId: string,
): Promise<NvelopesTransaction[]> {
  try {
    const snapshot = await firestore()
      .collection(`budgets/${budgetId}/transactions`)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data() as NvelopesTransaction);
  } catch (error) {
    console.error("getTransaction error: ", error);
  }
  return [];
}
