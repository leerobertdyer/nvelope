import type {
  Payment,
  Envelope,
  Interval,
  OneTimeAmount,
} from "../types";
import { doc, updateDoc, Timestamp, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, getCountFromServer } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { MONTHLY } from "../constants";

/**
 * Creates the initial user document in Firestore.
 * This is called ONLY through intentional user action (Demo onboarding flow).
 * The document is NEVER auto-created to prevent accidental data overwrites.
 */
export async function createUserDocument(user: User) {
  if (!user) {
    console.error("createUserDocument: No user provided");
    return false;
  }
  
  try {
    const userDocRef = doc(db, "users", user.uid);
    
    // Double-check document doesn't already exist (safety check)
    const existingDoc = await getDoc(userDocRef);
    if (existingDoc.exists()) {
      console.warn("createUserDocument: Document already exists, not overwriting");
      return true; // Document exists, that's fine
    }
    
    const initialUserData = {
      id: user.uid,
      email: user.email,
      isNewUser: true,
      envelopes: [],
      payDate: null,
      payPeriodInterval: "MONTHLY",
      payments: [],
      income: 0,
      totalSpendingBudget: 0,
      oneTimeCash: null,
      rent: 0,
      resetBudgetTimestamp: null,
      oneTimeExpenses: null,
      backups: null,
      createdAt: Timestamp.now(),
    };
    
    await setDoc(userDocRef, initialUserData);
    console.log("✅ User document created successfully");
    return true;
  } catch (error) {
    console.error("createUserDocument failed:", error);
    return false;
  }
}

export async function editResetBudgetTimestamp(
  resetBudgetTimestamp: Timestamp,
  userId: string
) {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { resetBudgetTimestamp });
  } catch (error) {
    console.error("Firebase, editResetBudgetTimestamp Failed", error);
  }
  return;
}

export async function editEnvelopes(envelopes: Envelope[], userId: string) {
  const toFixedEnvelopes = envelopes.map((e: Envelope) => ({
    ...e,
    total: Number(e.total.toFixed(2)),
  }));
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { envelopes: toFixedEnvelopes });
  } catch (error) {
    console.error("Firebase, editEnvelopes Failed", error);
  }
  return;
}

export async function editPayments(p: Payment[], userId: string) {
  const sortedPayments = p.sort(
    (a, b) => a.dueDate!.seconds! - b.dueDate!.seconds!
  );
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { payments: sortedPayments });
  } catch (error) {
    console.error("Firebase, editBills Failed", error);
  }
  return;
}

export async function editRent(newRentAmount: number, userId: string) {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { rent: newRentAmount });
  } catch (error) {
    console.error("Firebase, editRent Failed", error);
  }
  return;
}

export async function editIncome(income: number, userId: string) {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { income });
  } catch (error) {
    console.error("Firebase, editIncome Failed", error);
  }
  return;
}

export async function editPayPeriodInterval(i: Interval, userId: string) {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { payPeriodInterval: i });
  } catch (error) {
    console.error("Firebase, editInterval Failed", error);
  }
  return;
}

export async function editIsNewUser(isNewUser: boolean, userId: string) {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { isNewUser });
  } catch (error) {
    console.error("Firebase, editIsNewUser Failed", error);
  }
  return;
}

export async function editPayDate(payDate: Date, userId: string) {
  const date = Timestamp.fromDate(payDate);
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { payDate: date });
  } catch (error) {
    console.error("Firebase, editPayDate Failed", error);
  }
  return;
}

export async function editOneTimeExpense(
  newExpense: OneTimeAmount | null,
  userId: string
) {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const { oneTimeExpense } = docSnap.data() || [];
      const nextOneTimeExpense = [...(oneTimeExpense || []), newExpense];
      await updateDoc(userDocRef, { oneTimeExpense: nextOneTimeExpense });
    } else {
      console.error(
        "Firebase, editOneTimeExpense Failed: Document does not exist"
      );
    }
  } catch (error) {
    console.error("Firebase, editOneTimeExpense Failed", error);
  }
  return;
}

export async function editOneTimeCashAndBudget(
  newCashEntry: OneTimeAmount | null,
  userId: string,
  currentBudget: number
) {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (!newCashEntry) {
      await updateDoc(userDocRef, {
        oneTimeCash: [],
        totalSpendingBudget: currentBudget,
      });
      return;
    }
    if (docSnap.exists()) {
      const { oneTimeCash } = docSnap.data() || [];
      const nextOneTimeCash = [...(oneTimeCash || []), newCashEntry];
      await updateDoc(userDocRef, {
        oneTimeCash: nextOneTimeCash,
        totalSpendingBudget: currentBudget + newCashEntry.amount,
      });
    } else {
      console.error(
        "Firebase, editOneTimeCashAndBudget Failed: Document does not exist"
      );
    }
  } catch (error) {
    console.error("Firebase, editOneTimeCashAndBudget Failed", error);
  }
  return;
}

export async function editTotalSpendingBudget(
  newTotal: number,
  userId: string
) {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { totalSpendingBudget: newTotal });
  } catch (error) {
    console.error("Firebase, editTotalSpendingBudget Failed", error);
  }
  return;
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

export async function setDefaultPaymentInterval(userId: string) {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) return;

    const payments = docSnap.data().payments || [];
    const newPayments = payments.map((p: Payment) => ({
      ...p,
      interval: p.interval ?? MONTHLY,
    }));

    await updateDoc(userDocRef, { payments: newPayments });
  } catch (error) {
    console.error("Firebase, error in setDefaultPaymentInterval:", error);
  }
}

export async function importAndTransformLegacyBills(userId: string) {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) return [];
  const bills = docSnap.data().bills || [];
  const existingPayments = docSnap.data().payments || [];
  const newPayments = transformBillsToPayments(bills).filter((p) =>
    existingPayments.every((e: Payment) => e.name !== p.name)
  );

  await updateDoc(userDocRef, {
    payments: [...existingPayments, ...newPayments],
  });
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
];

export async function editSnowball(user: User, amount: number) {
  if (!user) return;
  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, { snowball: amount });
  try {
    console.log("attempting to updateDoc for snowball");
  } catch (e) {
    console.error("There was an error in editSnowball when updating db: ", e);
  }
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
export async function shouldBackupUserDataSafe(user: User) {
  if (!user) return false;
  try {
    const now = Timestamp.fromDate(new Date());
    const backupsCollectionRef = collection(db, "userBackups", user.uid, "backups");
    
    // Get count using server-side aggregation (doesn't download documents)
    const countSnapshot = await getCountFromServer(backupsCollectionRef);
    const backupCount = countSnapshot.data().count;
    
    // No backups exist yet - definitely backup
    if (backupCount === 0) return true;
    
    // Get most recent backup (only fetches 1 document)
    const recentQuery = query(backupsCollectionRef, orderBy("backupTimeStamp", "desc"), limit(1));
    const recentSnapshot = await getDocs(recentQuery);
    
    const mostRecentBackup = recentSnapshot.docs[0].data();
    const backupTimeStamp = mostRecentBackup.backupTimeStamp;
    const timeSinceLastBackup = now.toMillis() - backupTimeStamp.toMillis();
    
    // If we have fewer than MAX_BACKUPS, backup frequently to build up safety net
    if (backupCount < MAX_BACKUPS) {
      return timeSinceLastBackup > TEN_MINUTES_MS;
    }
    
    // If we have MAX_BACKUPS or more, only backup if > 4 hours since last
    // This spaces out backups to maintain historical coverage
    return timeSinceLastBackup > FOUR_HOURS_MS;
  } catch (error) {
    console.error("Error in shouldBackupUserDataSafe:", error);
    return false; // Don't backup if we can't check - safer than potentially losing data
  }
}

/**
 * Creates a backup in a SEPARATE collection that survives user document corruption
 * Keeps up to 30 backups per user, automatically pruning old ones
 */
export async function backupUserDataSafe(user: User) {
  if (!user) return;
  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    
    if (!docSnap.exists()) {
      console.warn("User document doesn't exist, cannot backup");
      return;
    }
    
    const data = docSnap.data();
    
    // Don't backup if data looks empty/corrupted (safety check)
    const hasEnvelopes = Array.isArray(data.envelopes) && data.envelopes.length > 0;
    const hasPayments = Array.isArray(data.payments) && data.payments.length > 0;
    const hasIncome = typeof data.income === 'number' && data.income > 0;
    
    if (!hasEnvelopes && !hasPayments && !hasIncome) {
      console.warn("⚠️ Skipping backup - user data appears empty or corrupted");
      return;
    }
    
    const newTime = Timestamp.fromDate(new Date());
    const backupData = {
      backupTimeStamp: newTime,
      nvelopes: data.envelopes ?? [],
      payments: data.payments ?? [],
      expenses: data.oneTimeExpense ?? [],
      cash: data.oneTimeCash ?? [],
      payDate: data.payDate ?? null,
      payPeriodInterval: data.payPeriodInterval ?? "MONTHLY",
      income: data.income ?? 0,
      shouldReset: data.shouldReset ?? false,
      snowball: data.snowball ?? 0,
      totalSpendingBudget: data.totalSpendingBudget ?? 0,
      rent: data.rent ?? 0,
    };
    
    // Store in separate collection: /userBackups/{userId}/backups/{auto-id}
    const backupsCollectionRef = collection(db, "userBackups", user.uid, "backups");
    await addDoc(backupsCollectionRef, backupData);
    
    console.log("✅ Safe backup created at", newTime.toDate());
    
    // Prune old backups in separate collection (keep last 30)
    await pruneOldBackups(user.uid, 30);
    
  } catch (error) {
    console.error("Error in backupUserDataSafe:", error);
  }
}

/**
 * Get all safe backups for a user (from separate collection)
 */
export async function getSafeBackups(user: User) {
  if (!user) return [];
  try {
    const backupsCollectionRef = collection(db, "userBackups", user.uid, "backups");
    const q = query(backupsCollectionRef, orderBy("backupTimeStamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting safe backups:", error);
    return [];
  }
}

/**
 * Restore from a safe backup (from separate collection)
 * Saves current state to localStorage before restoring (for undo capability)
 */
export async function restoreFromSafeBackup(backupId: string, user: User) {
  if (!user || !backupId) return null;
  try {
    // First, fetch current user data to save to localStorage before restore
    const userDocRef = doc(db, "users", user.uid);
    const currentDataSnap = await getDoc(userDocRef);
    
    if (currentDataSnap.exists()) {
      const currentData = currentDataSnap.data();
      // Save current state to localStorage for undo capability
      saveToLocalStorageBackup({
        envelopes: currentData.envelopes ?? [],
        payments: currentData.payments ?? [],
        income: currentData.income ?? 0,
        totalSpendingBudget: currentData.totalSpendingBudget ?? 0,
        rent: currentData.rent ?? 0,
        payDate: currentData.payDate ?? null,
        payPeriodInterval: currentData.payPeriodInterval ?? "MONTHLY",
      });
    }
    
    const backupDocRef = doc(db, "userBackups", user.uid, "backups", backupId);
    const backupSnap = await getDoc(backupDocRef);
    
    if (!backupSnap.exists()) {
      console.error("Safe backup not found:", backupId);
      return null;
    }
    
    const b = backupSnap.data();
    
    console.log(`⚠️ Restoring from SAFE backup ${b.backupTimeStamp?.toDate()}!`);
    console.log(`  - ${b.payments?.length ?? 0} payments`);
    console.log(`  - ${b.nvelopes?.length ?? 0} envelopes`);
    console.log(`  - Income: ${b.income}`);
    console.log(`  - Budget: ${b.totalSpendingBudget}`);
    
    await editTotalSpendingBudget(Number(b.totalSpendingBudget), user.uid);
    await editIncome(Number(b.income), user.uid);
    await editEnvelopes(b.nvelopes ?? [], user.uid);
    await editPayments(b.payments ?? [], user.uid);
    if (b.rent) await editRent(b.rent, user.uid);
    
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
    
    console.log(`🗑️ Pruned ${docsToDelete.length} old backups`);
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
    rent: number;
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
  rent: number;
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
    console.log("💾 Saved current state to localStorage before restore");
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
 * Restore from localStorage backup (undo last restore)
 */
export async function restoreFromLocalStorageBackup(user: User): Promise<boolean> {
  if (!user) return false;
  
  const backup = getLocalStorageBackup();
  if (!backup) {
    console.error("No localStorage backup found");
    return false;
  }
  
  try {
    const { data } = backup;
    
    console.log(`⏪ Undoing restore - reverting to state from ${backup.timestamp}`);
    console.log(`  - ${data.payments?.length ?? 0} payments`);
    console.log(`  - ${data.envelopes?.length ?? 0} envelopes`);
    console.log(`  - Income: ${data.income}`);
    console.log(`  - Budget: ${data.totalSpendingBudget}`);
    
    await editTotalSpendingBudget(Number(data.totalSpendingBudget), user.uid);
    await editIncome(Number(data.income), user.uid);
    await editEnvelopes(data.envelopes ?? [], user.uid);
    await editPayments(data.payments ?? [], user.uid);
    if (data.rent) await editRent(data.rent, user.uid);
    
    // Clear the localStorage backup after successful restore
    clearLocalStorageBackup();
    
    return true;
  } catch (error) {
    console.error("Error restoring from localStorage backup:", error);
    return false;
  }
}