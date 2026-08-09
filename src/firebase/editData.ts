import type {
  Payment,
  Envelope,
  Interval,
  NvelopesTransaction,
} from "../types";
import { doc, updateDoc, setDoc, Timestamp, getDoc, collection, query, orderBy, getDocs, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { cleanPaymentsForFirebase } from "../util";
import { budgetDataRef } from "./budgets";

export async function addTransaction(t: NvelopesTransaction, budgetId: string) {
  try {
    await setDoc(doc(db, "budgets", budgetId, "transactions", t.id), t);
  } catch (error) {
    console.error("Error adding transaction: ", error);
  }
}

export async function editDatabaseWithTransaction<T>({
  t,
  budgetId,
  func,
}: {
  t: NvelopesTransaction;
  budgetId: string;
  func: () => Promise<T>;
}): Promise<T> {
  await addTransaction(t, budgetId);
  return await func();
}

export async function createUserProfile(user: {
  uid: string;
  email: string | null;
}) {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email?.toLowerCase() ?? "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error("Failed to create user profile document:", e);
    return false;
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
  const sortedPayments = [...p].sort(
    (a, b) => a.dueDate!.seconds! - b.dueDate!.seconds!
  );
  const cleanedPayments = cleanPaymentsForFirebase(sortedPayments);
  try {
    await updateDoc(budgetDataRef(budgetId), { payments: cleanedPayments });
  } catch (error) {
    console.error("Firebase, editPayments Failed", error);
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
    if (!hasEnvelopes && !hasPayments) return;
    const newTime = Timestamp.fromDate(new Date());
    const backupData = {
      backupTimeStamp: newTime,
      budgetId,
      nvelopes: data.envelopes ?? [],
      payments: data.payments ?? [],
      payDate: data.payDate ?? null,
      payPeriodInterval: data.payPeriodInterval ?? "MONTHLY",
      shouldReset: data.shouldReset ?? false,
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
    await editEnvelopes(data.envelopes ?? [], budgetId);
    await editPayments(restoredPayments, budgetId);
    clearLocalStorageBackup();
    return true;
  } catch (error) {
    console.error("Error restoring from localStorage backup:", error);
    return false;
  }
}