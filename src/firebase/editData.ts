import type {
  Payment,
  Envelope,
  Interval,
  OneTimeAmount,
} from "../types";
import { doc, updateDoc, Timestamp, getDoc, collection, query, orderBy, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { MONTHLY } from "../constants";
import { cleanPaymentsForFirebase } from "../util";
import { budgetDataRef } from "./budgets";

export async function editResetBudgetTimestamp(
  resetBudgetTimestamp: Timestamp,
  budgetId: string
) {
  try {
    await updateDoc(budgetDataRef(budgetId), { resetBudgetTimestamp });
  } catch (error) {
    console.error("Firebase, editResetBudgetTimestamp Failed", error);
  }
}

export async function editEnvelopes(envelopes: Envelope[], budgetId: string) {
  const toFixedEnvelopes = envelopes.map((e: Envelope) => ({
    ...e,
    total: Number(e.total.toFixed(2)),
  }));
  try {
    await updateDoc(budgetDataRef(budgetId), { envelopes: toFixedEnvelopes });
  } catch (error) {
    console.error("Firebase, editEnvelopes Failed", error);
  }
}

export async function editPayments(p: Payment[], budgetId: string) {
  const sortedPayments = p.sort(
    (a, b) => a.dueDate!.seconds! - b.dueDate!.seconds!
  );
  const cleanedPayments = cleanPaymentsForFirebase(sortedPayments);
  try {
    await updateDoc(budgetDataRef(budgetId), { payments: cleanedPayments });
  } catch (error) {
    console.error("Firebase, editBills Failed", error);
  }
}

export async function editIncome(income: number, budgetId: string) {
  try {
    await updateDoc(budgetDataRef(budgetId), { income });
  } catch (error) {
    console.error("Firebase, editIncome Failed", error);
  }
}

export async function editPayPeriodInterval(i: Interval, budgetId: string) {
  try {
    await updateDoc(budgetDataRef(budgetId), { payPeriodInterval: i });
  } catch (error) {
    console.error("Firebase, editInterval Failed", error);
  }
}

export async function editIsNewUser(isNewUser: boolean, budgetId: string) {
  try {
    await updateDoc(budgetDataRef(budgetId), { isNewUser });
  } catch (error) {
    console.error("Firebase, editIsNewUser Failed", error);
  }
}

export async function editPayDate(payDate: Date, budgetId: string) {
  const date = Timestamp.fromDate(payDate);
  try {
    await updateDoc(budgetDataRef(budgetId), { payDate: date });
  } catch (error) {
    console.error("Firebase, editPayDate Failed", error);
  }
}

export async function editOneTimeCashAndBudget(
  newCashEntry: OneTimeAmount | null,
  budgetId: string,
  currentBudget: number
) {
  try {
    const dataRef = budgetDataRef(budgetId);
    const docSnap = await getDoc(dataRef);
    if (!newCashEntry) {
      await updateDoc(dataRef, { oneTimeCash: [], totalSpendingBudget: currentBudget });
      return;
    }
    if (docSnap.exists()) {
      const data = docSnap.data();
      const oneTimeCash = data.oneTimeCash ?? [];
      await updateDoc(dataRef, {
        oneTimeCash: [...oneTimeCash, newCashEntry],
        totalSpendingBudget: currentBudget + newCashEntry.amount,
      });
    } else {
      console.error("Firebase, editOneTimeCashAndBudget Failed: Document does not exist");
    }
  } catch (error) {
    console.error("Firebase, editOneTimeCashAndBudget Failed", error);
  }
}

export async function editTotalSpendingBudget(newTotal: number, budgetId: string) {
  try {
    await updateDoc(budgetDataRef(budgetId), { totalSpendingBudget: newTotal });
  } catch (error) {
    console.error("Firebase, editTotalSpendingBudget Failed", error);
  }
}

/**
 * FUTURE FEATURE: Analytics & Period Tracking
 * 
 * The previous snapshot-based approach (previousIntervalDetails, resetBudget, 
 * isResetToday, storePreviousIntervalDetails) was removed as it had limited value.
 * 
 * For meaningful analytics ("last month you spent X on groceries"), consider:
 * 
 * 1. Event-based tracking: Log each spend/income event with timestamp, 
 *    category, amount, envelope
 * 2. Aggregation queries: Sum events by time period and category
 * 3. Separate analytics collection: /userAnalytics/{userId}/events/{eventId}
 * 
 * This would enable pie charts, spending trends, and period comparisons.
 */

export async function setDefaultPaymentInterval(budgetId: string) {
  try {
    const dataRef = budgetDataRef(budgetId);
    const docSnap = await getDoc(dataRef);
    if (!docSnap.exists()) return;
    const payments = docSnap.data().payments || [];
    const newPayments = payments.map((p: Payment) => ({
      ...p,
      interval: p.interval ?? MONTHLY,
    }));
    await updateDoc(dataRef, { payments: newPayments });
  } catch (error) {
    console.error("Firebase, error in setDefaultPaymentInterval:", error);
  }
}

export async function importAndTransformLegacyBills(budgetId: string) {
  const dataRef = budgetDataRef(budgetId);
  const docSnap = await getDoc(dataRef);
  if (!docSnap.exists()) return [];
  const data = docSnap.data();
  const bills = data.bills || [];
  const existingPayments = data.payments || [];
  const newPayments = transformBillsToPayments(bills).filter((p) =>
    existingPayments.every((e: Payment) => e.name !== p.name)
  );
  await updateDoc(dataRef, { payments: [...existingPayments, ...newPayments] });
}

type Bill = {
  amount: number;
  interval: string;
  name: string;
  originalDate: Timestamp;
  paid: boolean;
};

function transformBillsToPayments(bills: Bill[]): Payment[] {
  const paymentsMap: Payment[] = [];
  bills.forEach((b) => {
    const i = validIntervals.includes(b.interval.toUpperCase() as Interval)
      ? (b.interval.toUpperCase() as Interval)
      : "MONTHLY";
    paymentsMap.push({
      id: crypto.randomUUID(),
      interval: i,
      paid: b.paid,
      dueDate: b.originalDate,
      name: b.name,
      amount: b.amount,
      type: "BILL",
    });
  });
  return paymentsMap;
}

export const validIntervals: Interval[] = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "YEARLY",
  "SPLIT",
];

export async function editSnowball(budgetId: string, amount: number) {
  await updateDoc(budgetDataRef(budgetId), { snowball: amount });
}

export async function editSnowballTargetPaymentId(budgetId: string, paymentId: string | null) {
  await updateDoc(budgetDataRef(budgetId), { snowballTargetPaymentId: paymentId });
}

const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const MAX_BACKUPS = 30;

/**
 * SAFE BACKUP SYSTEM - Stores backups in a SEPARATE collection from user data
 * This prevents backups from being lost if the user document gets corrupted/overwritten
 * 
 * Structure: /userBackups/{userId}/backups/{backupId}
 * 
 * Backup strategy:
 * - If < 30 backups exist: backup frequently (every 10 min) to quickly build up safety net
 * - If >= 30 backups exist: only backup if > 4 hours since last backup
 *   This ensures we maintain at least 5 days of backup history (30 × 4 hours = 120 hours)
 */
/** Backups for a budget: filter by budgetId or missing (migrated). */
function backupsForBudget(docs: { id: string; data: () => Record<string, unknown> }[], budgetId: string) {
  return docs.filter((d) => {
    const data = d.data();
    const bid = data.budgetId;
    return bid === budgetId || bid === undefined;
  });
}

export async function shouldBackupUserDataSafe(user: User, budgetId: string) {
  if (!user) return false;
  try {
    const now = Timestamp.fromDate(new Date());
    const backupsCollectionRef = collection(db, "userBackups", user.uid, "backups");
    const q = query(backupsCollectionRef, orderBy("backupTimeStamp", "desc"));
    const snapshot = await getDocs(q);
    const forBudget = backupsForBudget(snapshot.docs, budgetId);
    const backupCount = forBudget.length;
    if (backupCount === 0) return true;
    const mostRecent = forBudget[0].data();
    const backupTimeStamp = mostRecent.backupTimeStamp as Timestamp;
    const timeSinceLastBackup = now.toMillis() - backupTimeStamp.toMillis();
    if (backupCount < MAX_BACKUPS) return timeSinceLastBackup > TEN_MINUTES_MS;
    return timeSinceLastBackup > FOUR_HOURS_MS;
  } catch (error) {
    console.error("Error in shouldBackupUserDataSafe:", error);
    return false;
  }
}

/**
 * Creates a backup in userBackups/{userId}/backups with budgetId. Reads from budget data doc.
 */
export async function backupUserDataSafe(user: User, budgetId: string) {
  if (!user) return;
  try {
    const dataRef = budgetDataRef(budgetId);
    const docSnap = await getDoc(dataRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const hasEnvelopes = Array.isArray(data.envelopes) && data.envelopes.length > 0;
    const hasPayments = Array.isArray(data.payments) && data.payments.length > 0;
    const hasIncome = typeof data.income === "number" && data.income > 0;
    if (!hasEnvelopes && !hasPayments && !hasIncome) return;
    const newTime = Timestamp.fromDate(new Date());
    const backupData = {
      backupTimeStamp: newTime,
      budgetId,
      nvelopes: data.envelopes ?? [],
      payments: data.payments ?? [],
      cash: data.oneTimeCash ?? [],
      payDate: data.payDate ?? null,
      payPeriodInterval: data.payPeriodInterval ?? "MONTHLY",
      income: data.income ?? 0,
      shouldReset: data.shouldReset ?? false,
      snowball: data.snowball ?? 0,
      snowballTargetPaymentId: data.snowballTargetPaymentId ?? null,
      totalSpendingBudget: data.totalSpendingBudget ?? 0,
    };
    const backupsCollectionRef = collection(db, "userBackups", user.uid, "backups");
    await addDoc(backupsCollectionRef, backupData);
    await pruneOldBackups(user.uid, 30);
  } catch (error) {
    console.error("Error in backupUserDataSafe:", error);
  }
}

/** Get safe backups for the given budget (includes migrated backups with no budgetId). */
export async function getSafeBackups(user: User, budgetId: string) {
  if (!user) return [];
  try {
    const backupsCollectionRef = collection(db, "userBackups", user.uid, "backups");
    const q = query(backupsCollectionRef, orderBy("backupTimeStamp", "desc"));
    const snapshot = await getDocs(q);
    const forBudget = backupsForBudget(snapshot.docs, budgetId);
    return forBudget.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting safe backups:", error);
    return [];
  }
}

export async function restoreFromSafeBackup(backupId: string, user: User, budgetId: string) {
  if (!user || !backupId) return null;
  try {
    const dataRef = budgetDataRef(budgetId);
    const currentDataSnap = await getDoc(dataRef);
    if (currentDataSnap.exists()) {
      const currentData = currentDataSnap.data();
      saveToLocalStorageBackup({
        envelopes: currentData.envelopes ?? [],
        payments: currentData.payments ?? [],
        income: currentData.income ?? 0,
        totalSpendingBudget: currentData.totalSpendingBudget ?? 0,
        payDate: currentData.payDate ?? null,
        payPeriodInterval: currentData.payPeriodInterval ?? "MONTHLY",
      });
    }
    const backupDocRef = doc(db, "userBackups", user.uid, "backups", backupId);
    const backupSnap = await getDoc(backupDocRef);
    if (!backupSnap.exists()) return null;
    const b = backupSnap.data();
    await editTotalSpendingBudget(Number(b.totalSpendingBudget), budgetId);
    await editIncome(Number(b.income), budgetId);
    await editEnvelopes(b.nvelopes ?? [], budgetId);
    await editPayments(b.payments ?? [], budgetId);
    return b;
  } catch (error) {
    console.error("Error restoring from safe backup:", error);
    return null;
  }
}

/**
 * Prune old backups, keeping only the most recent N
 */
async function pruneOldBackups(userId: string, keepCount: number) {
  try {
    const backupsCollectionRef = collection(db, "userBackups", userId, "backups");
    const q = query(backupsCollectionRef, orderBy("backupTimeStamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.size <= keepCount) return;
    
    // Delete backups beyond keepCount
    const docsToDelete = querySnapshot.docs.slice(keepCount);
    for (const docToDelete of docsToDelete) {
      await deleteDoc(doc(db, "userBackups", userId, "backups", docToDelete.id));
    }
  } catch (error) {
    console.error("Error pruning old backups:", error);
  }
}

/**
 * LOCAL STORAGE BACKUP SYSTEM
 * 
 * Saves the current user data to localStorage before a restore operation.
 * This provides an "undo last restore" feature without consuming Firestore backups.
 * Only the most recent pre-restore state is kept (auto-overwrites).
 */
const LOCALSTORAGE_BACKUP_KEY = 'nvelope_pre_restore_backup';

export interface LocalStorageBackup {
  data: {
    envelopes: Envelope[];
    payments: Payment[];
    income: number;
    totalSpendingBudget: number;
    payDate: unknown;
    payPeriodInterval: string;
  };
  timestamp: string;
  reason: string;
}

/**
 * Save current user data to localStorage before restore
 */
export function saveToLocalStorageBackup(userData: {
  envelopes: Envelope[];
  payments: Payment[];
  income: number;
  totalSpendingBudget: number;
  payDate: unknown;
  payPeriodInterval: string;
}): void {
  try {
    const backup: LocalStorageBackup = {
      data: userData,
      timestamp: new Date().toISOString(),
      reason: 'pre-restore-backup'
    };
    // Overwrite any existing backup (only keep most recent)
    localStorage.setItem(LOCALSTORAGE_BACKUP_KEY, JSON.stringify(backup));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Get the localStorage backup if it exists
 */
export function getLocalStorageBackup(): LocalStorageBackup | null {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_BACKUP_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LocalStorageBackup;
  } catch (error) {
    console.error("Error reading localStorage backup:", error);
    return null;
  }
}

/**
 * Clear the localStorage backup after successful undo
 */
export function clearLocalStorageBackup(): void {
  try {
    localStorage.removeItem(LOCALSTORAGE_BACKUP_KEY);
    console.log("🗑️ Cleared localStorage backup");
  } catch (error) {
    console.error("Error clearing localStorage backup:", error);
  }
}

/**
 * Convert a plain object with seconds/nanoseconds to a Firestore Timestamp.
 * This is needed because JSON serialization loses the Timestamp class.
 */
function toTimestamp(obj: unknown): Timestamp | null {
  if (!obj) return null;
  if (obj instanceof Timestamp) return obj;
  if (typeof obj === 'object' && obj !== null && 'seconds' in obj) {
    const tsObj = obj as { seconds: number; nanoseconds?: number };
    return new Timestamp(tsObj.seconds, tsObj.nanoseconds ?? 0);
  }
  return null;
}

/**
 * Restore from localStorage backup (undo last restore) into the given budget.
 */
export async function restoreFromLocalStorageBackup(user: User, budgetId: string): Promise<boolean> {
  if (!user) return false;
  const backup = getLocalStorageBackup();
  if (!backup) return false;
  try {
    const { data } = backup;
    const restoredPayments = (data.payments ?? []).map((p: Payment & { dueDate?: unknown; paidDates?: unknown[] }) => ({
      ...p,
      dueDate: toTimestamp(p.dueDate) ?? Timestamp.now(),
      paidDates: (p.paidDates ?? []).map((pd) => toTimestamp(pd)).filter((t): t is Timestamp => t !== null) ?? [],
    }));
    await editTotalSpendingBudget(Number(data.totalSpendingBudget), budgetId);
    await editIncome(Number(data.income), budgetId);
    await editEnvelopes(data.envelopes ?? [], budgetId);
    await editPayments(restoredPayments, budgetId);
    clearLocalStorageBackup();
    return true;
  } catch (error) {
    console.error("Error restoring from localStorage backup:", error);
    return false;
  }
}