import { doc, updateDoc, Timestamp, getDoc, setDoc, collection, query, getDocs, deleteDoc, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { MONTHLY, BUDGET_DATA_DOC_ID } from "../constants";
import type { Interval } from "../types";

function budgetRef(budgetId: string) {
  return doc(db, "budgets", budgetId);
}

export function budgetDataRef(budgetId: string) {
  return doc(db, "budgets", budgetId, "data", BUDGET_DATA_DOC_ID);
}

const BUDGET_INVITES_COLLECTION = "budgetInvites";

/**
 * Creates the first budget for a user (Demo onboarding). Writes budget meta, data doc, and users/{uid}/budgets/{budgetId}.
 * Returns the new budgetId or null on failure.
 */
export async function createFirstBudget(user: User, name: string = "My Budget"): Promise<string | null> {
  if (!user) {
    console.error("createFirstBudget: No user provided");
    return null;
  }
  try {
    const newBudgetRef = doc(collection(db, "budgets"));
    const budgetId = newBudgetRef.id;
    const dataRef = budgetDataRef(budgetId);
    const userBudgetRef = doc(db, "users", user.uid, "budgets", budgetId);

    const budgetMeta = {
      name,
      ownerId: user.uid,
      memberIds: [user.uid],
      createdAt: Timestamp.now(),
    };
    const initialData = {
      envelopes: [],
      payDate: null,
      payPeriodInterval: "MONTHLY",
      payments: [],
      income: 0,
      totalSpendingBudget: 0,
      oneTimeCash: null,
      resetBudgetTimestamp: null,
      snowball: 0,
      snowballTargetPaymentId: null,
      isNewUser: true,
      backups: null,
    };
    const userBudgetDoc = { name, budgetId };

    await setDoc(newBudgetRef, budgetMeta);
    await setDoc(dataRef, initialData);
    await setDoc(userBudgetRef, userBudgetDoc);
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
  name: string = "My Budget",
  payDate: Date,
  payPeriodInterval: Interval
): Promise<string | null> {
  if (!user) return null;
  try {
    const newBudgetRef = doc(collection(db, "budgets"));
    const budgetId = newBudgetRef.id;
    const dataRef = budgetDataRef(budgetId);
    const userBudgetRef = doc(db, "users", user.uid, "budgets", budgetId);
    const budgetMeta = {
      name,
      ownerId: user.uid,
      memberIds: [user.uid],
      createdAt: Timestamp.now(),
    };
    const initialData = {
      envelopes: [],
      payDate: Timestamp.fromDate(payDate),
      payPeriodInterval: payPeriodInterval ?? MONTHLY,
      payments: [],
      income: 0,
      totalSpendingBudget: 0,
      oneTimeCash: null,
      resetBudgetTimestamp: null,
      snowball: 0,
      snowballTargetPaymentId: null,
      isNewUser: false,
      backups: null,
    };
    const userBudgetDoc = { name, budgetId };
    await setDoc(newBudgetRef, budgetMeta);
    await setDoc(dataRef, initialData);
    await setDoc(userBudgetRef, userBudgetDoc);
    return budgetId;
  } catch (error) {
    console.error("createBudget failed:", error);
    return null;
  }
}

/** Get budget metadata (ownerId, memberIds, name). */
export async function getBudgetMeta(budgetId: string) {
  const snap = await getDoc(budgetRef(budgetId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    name: d.name ?? "Budget",
    ownerId: d.ownerId as string,
    memberIds: (d.memberIds as string[]) ?? [],
    createdAt: d.createdAt,
  };
}

/** Owner: delete budget, its data doc, and all users' budget refs. Member: leave (remove self from memberIds, delete own ref). */
export async function deleteBudgetAsOwner(ownerId: string, budgetId: string): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId !== ownerId) return false;
    const dataRef = budgetDataRef(budgetId);
    for (const uid of meta.memberIds) {
      const userBudgetRef = doc(db, "users", uid, "budgets", budgetId);
      await deleteDoc(userBudgetRef);
    }
    await deleteDoc(dataRef);
    await deleteDoc(budgetRef(budgetId));
    return true;
  } catch (error) {
    console.error("deleteBudgetAsOwner failed:", error);
    return false;
  }
}

/** Member leaves budget: remove self from memberIds, delete own users/{uid}/budgets/{budgetId}. */
export async function leaveBudget(userId: string, budgetId: string): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId === userId) return false;
    await updateDoc(budgetRef(budgetId), { memberIds: arrayRemove(userId) });
    const userBudgetRef = doc(db, "users", userId, "budgets", budgetId);
    await deleteDoc(userBudgetRef);
    return true;
  } catch (error) {
    console.error("leaveBudget failed:", error);
    return false;
  }
}

/** Owner removes a member from the budget. */
export async function removeMemberFromBudget(ownerId: string, budgetId: string, memberId: string): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId !== ownerId || memberId === ownerId) return false;
    await updateDoc(budgetRef(budgetId), { memberIds: arrayRemove(memberId) });
    const userBudgetRef = doc(db, "users", memberId, "budgets", budgetId);
    await deleteDoc(userBudgetRef);
    return true;
  } catch (error) {
    console.error("removeMemberFromBudget failed:", error);
    return false;
  }
}

/** Owner invites by email. Writes a single doc to budgetInvites (doc ID = budgetId_email for rule lookup). */
export async function addInviteToBudget(budgetId: string, email: string, ownerId: string): Promise<boolean> {
  try {
    const meta = await getBudgetMeta(budgetId);
    if (!meta || meta.ownerId !== ownerId) return false;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return false;
    const invitePayload = {
      budgetId,
      email: normalizedEmail,
      invitedBy: ownerId,
      createdAt: Timestamp.now(),
    };
    const inviteRef = doc(db, BUDGET_INVITES_COLLECTION, budgetId + "_" + normalizedEmail);
    await setDoc(inviteRef, invitePayload);
    return true;
  } catch (error) {
    console.error("addInviteToBudget failed:", error);
    return false;
  }
}

/**
 * Call on app load: for current user's email, consume any invites (add user to budget, delete invite). Returns count processed.
 * Firestore rule allows update on budgets/{id} when budgetInvites/{budgetId_email} exists.
 */
export async function processInvitesForUser(user: User): Promise<number> {
  const email = user?.email?.trim()?.toLowerCase();
  if (!email) return 0;
  try {
    const q = query(
      collection(db, BUDGET_INVITES_COLLECTION),
      where("email", "==", email)
    );
    const snap = await getDocs(q);
    let count = 0;
    const metaCache: Record<string, { name: string }> = {};
    for (const inviteDoc of snap.docs) {
      const data = inviteDoc.data();
      const bid = data.budgetId as string;
      if (!bid) continue;
      let name = metaCache[bid]?.name;
      if (name === undefined) {
        const m = await getBudgetMeta(bid);
        name = m?.name ?? "Budget";
        metaCache[bid] = { name };
      }
      const budgetSnap = await getDoc(budgetRef(bid));
      if (!budgetSnap.exists()) {
        await deleteDoc(inviteDoc.ref);
        continue;
      }
      const budgetData = budgetSnap.data();
      const memberIds = (budgetData.memberIds as string[]) ?? [];
      if (memberIds.includes(user.uid)) {
        await deleteDoc(inviteDoc.ref);
        continue;
      }
      await updateDoc(budgetRef(bid), { memberIds: arrayUnion(user.uid) });
      await setDoc(doc(db, "users", user.uid, "budgets", bid), { name, budgetId: bid });
      await deleteDoc(inviteDoc.ref);
      count++;
    }
    return count;
  } catch (error) {
    console.error("processInvitesForUser failed:", error);
    return 0;
  }
}

/** @deprecated Use createFirstBudget. Kept for migration script / reference. */
export async function createUserDocument(user: User) {
  const budgetId = await createFirstBudget(user, "My Budget");
  return budgetId != null;
}

/**
 * Skip demo: create first budget with defaults so MainView can render.
 */
export async function completeDemoWithDefaults(user: User): Promise<boolean> {
  if (!user) return false;
  try {
    const now = new Date();
    const defaultPayDate = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const budgetId = await createFirstBudget(user, "My Budget");
    if (!budgetId) return false;
    const dataRef = budgetDataRef(budgetId);
    await updateDoc(dataRef, { isNewUser: false, payDate: defaultPayDate });
    return true;
  } catch (error) {
    console.error("completeDemoWithDefaults failed:", error);
    return false;
  }
}
