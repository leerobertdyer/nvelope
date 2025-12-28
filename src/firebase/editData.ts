import type {
  Payment,
  Envelope,
  Interval,
  OneTimeAmount,
  PreviousIntervalDetails,
} from "../types";
import { doc, updateDoc, Timestamp, getDoc, setDoc, collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, getCountFromServer } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import {
  getCountOfPaydatesLeftThisMonth,
  getCurrentIntervalDateRange,
  resetAllNvelopes,
} from "../util";
import { MONTHLY } from "../constants";
import { millisecondsInDay } from "date-fns/constants";
import { isSameDay, startOfDay } from "date-fns";

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

export async function isResetToday(
  payDate: Timestamp,
  interval: Interval,
  resetBudgetTimestamp: Timestamp | null // Last Reset Time
) {
  if (!payDate || !interval) return false;
  
  // If no previous reset timestamp, we can't determine if we should reset
  // (new user or first time - they shouldn't reset until next pay period)
  if (!resetBudgetTimestamp) {
    console.log("isResetToday: No previous reset timestamp, skipping reset check");
    return false;
  }

  const today = startOfDay(new Date());
  const lastResetDate = startOfDay(resetBudgetTimestamp.toDate());
  
  // Prevent multiple resets on the same day
  if (isSameDay(today, lastResetDate)) {
    console.log("isResetToday: Already reset today");
    return false;
  }

  // Get the CURRENT pay period range (based on today's date)
  const { start, end } = getCurrentIntervalDateRange(interval, payDate);
  
  // Check if the last reset was in the current pay period
  const lastResetInCurrentPeriod = lastResetDate >= start && lastResetDate <= end;
  
  console.log("isResetToday interval check:", {
    today,
    lastResetDate,
    currentPeriodStart: start,
    currentPeriodEnd: end,
    isInCurrentPeriod: lastResetInCurrentPeriod,
  });

  // If last reset was in the current pay period, don't reset again
  if (lastResetInCurrentPeriod) {
    console.log("Already reset during this pay period.");
    return false;
  }
  
  // We've entered a new pay period since last reset
  console.log("New pay period detected, reset allowed");
  return true;
}

type ResetBudgetParams = {
  payDate: Timestamp;
  payPeriodInterval: Interval;
  envelopes: Envelope[];
  user: User;
  setEnvelopes: (envelopes: Envelope[]) => void;
  setTotalSpendingBudget: (totalSpendingBudget: number) => void;
  setOneTimeCash: (oneTimeCash: OneTimeAmount[] | null) => void;
  setPayments: (payments: Payment[]) => void;
  income: number;
  totalSpendingBudget: number;
  virtualPayments: Payment[]; // Used for calculation only
  payments: Payment[]; // Original payments array - will be reset and saved
  oneTimeCash: OneTimeAmount[] | null;
  setResetBudgetTimestamp: (resetBudgetTimestamp: Timestamp) => void;
  shouldReplenish?: boolean;
  rent: number
};

export async function resetBudget({
  payDate,
  payPeriodInterval,
  envelopes,
  user,
  setEnvelopes,
  setTotalSpendingBudget,
  setOneTimeCash,
  setPayments,
  income,
  totalSpendingBudget,
  virtualPayments, // VIRTUAL PAYMENTS - used for calculation only
  payments, // Original payments array - will be reset and saved
  rent,
  oneTimeCash,
  setResetBudgetTimestamp,
}: ResetBudgetParams) {

  // Reset all envelopes to 0 spent, 0 total, and unpaid
  await resetAllNvelopes(envelopes, setEnvelopes, user.uid);

  // Calculate total payments due this period (using virtualPayments for calculation)
  let totalPaymentsDueThisPeriod = 0;
  for (const p of virtualPayments) {
    totalPaymentsDueThisPeriod += p.amount;
  }
  
  // Reset payments: mark all as unpaid in the original payments array
  // For weekly/biweekly: clear paidDates array (this affects all virtual occurrences)
  // For monthly/yearly: set paid = false
  const resetPayments = payments.map((p: Payment) => {
    if (p.interval === "WEEKLY" || p.interval === "BIWEEKLY") {
      return { ...p, paidDates: [] };
    } else {
      return { ...p, paid: false };
    }
  });
  await editPayments(resetPayments, user.uid);
  setPayments(resetPayments);
  // Note: virtualPayments will automatically regenerate from updated payments via useEffect in MainView
  
  // Calculate rent portion for this period
  const payDatesThisMonth = getCountOfPaydatesLeftThisMonth(payDate, payPeriodInterval);
  const rentPaymentThisPeriod = rent / payDatesThisMonth;
  
  // Calculate remaining budget: income - payments - rent portion
  const remainingBudget = income - totalPaymentsDueThisPeriod - rentPaymentThisPeriod;
  
  const previousIntervalDetails = {
    payDate,
    payPeriodInterval,
    envelopes,
    payments: virtualPayments,
    income,
    totalSpendingBudget,
    oneTimeCash,
  };

  await storePreviousIntervalDetails(previousIntervalDetails, user.uid);

  await editOneTimeCashAndBudget(null, user.uid, remainingBudget);
  setTotalSpendingBudget(remainingBudget);
  setOneTimeCash([]);

  const newResetTime = Timestamp.now();
  await editResetBudgetTimestamp(newResetTime, user.uid);
  setResetBudgetTimestamp(newResetTime);
}

export async function storePreviousIntervalDetails(
  latestIntervalDetails: PreviousIntervalDetails,
  userId: string
) {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      await setDoc(
        userDocRef,
        {
          previousIntervalDetails: [
            ...(Array.isArray(docSnap.data()?.previousIntervalDetails)
              ? docSnap.data()!.previousIntervalDetails
              : []),
            latestIntervalDetails,
          ],
        },
        { merge: true }
      );
    } else {
      console.error(
        "Firebase, storePreviousIntervalDetails Failed: Document does not exist"
      );
    }
  } catch (error) {
    console.error("Firebase, storePreviousIntervalDetails Failed", error);
  }
  return;
}

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

export async function shouldBackupUserData(user: User) {
  if (!user) return;
  try {
    const now = Timestamp.fromDate(new Date());
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      if (!docSnap.data().backups) return true;
      if (!docSnap.data().backups.backupTimeStamp) return true;
      const backupTimeStamp = docSnap.data().backups.backupTimeStamp;
      if (now.toMillis() - backupTimeStamp.toMillis() > millisecondsInDay)
        return true;
      return false;
    }
  } catch (error) {
    console.error("Error running shouldBackupUserData in editData: ", error);
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
    
    // Also update the user doc backup (for backwards compatibility with existing UI)
    const b = data.backups;
    const currentBackups = b ? b.data : [];
    await updateDoc(userDocRef, {
      "backups.backupTimeStamp": newTime,
      "backups.data": [backupData, ...currentBackups].slice(0, 10), // Keep only 10 in user doc
    });
    
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
 */
export async function restoreFromSafeBackup(backupId: string, user: User) {
  if (!user || !backupId) return null;
  try {
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