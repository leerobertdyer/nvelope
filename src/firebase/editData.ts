import type {
  Payment,
  Envelope,
  Interval,
  OneTimeAmount,
  PreviousIntervalDetails,
  Backup,
} from "../types";
import { doc, updateDoc, Timestamp, getDoc, setDoc } from "firebase/firestore";
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

export async function backupUserData(user: User) {
  if (!user) return;
  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const nvelopes = docSnap.data().envelopes ?? [];
      const payments = docSnap.data().payments ?? [];
      const expenses = docSnap.data().oneTimeExpense ?? [];
      const cash = docSnap.data().oneTimeCash ?? [];
      const payDate = docSnap.data().payDate ?? Timestamp.fromDate(new Date());
      const payPeriodInterval = docSnap.data().payPeriodInterval ?? "MONTHLY";
      const income = docSnap.data().income ?? 0;
      const shouldReset = docSnap.data().shouldReset ?? false;
      const snowball = docSnap.data().snowball ?? 0;
      const totalSpendingBudget = docSnap.data().totalSpendingBudget ?? 0;
      const b = docSnap.data().backups;
      const currentBackups = b ? b.data : [];
      const newTime = Timestamp.fromDate(new Date());

      await updateDoc(userDocRef, {
        "backups.backupTimeStamp": newTime,
        "backups.data": [
          {
            backupTimeStamp: newTime,
            nvelopes,
            payments,
            expenses,
            cash,
            payDate,
            payPeriodInterval,
            income,
            shouldReset,
            snowball,
            totalSpendingBudget,
          },
          ...currentBackups,
        ],
      });
    }
  } catch (error) {
    console.error("Error attempting backupUserData in editData: ", error);
  }
}

/*
 ** Restores payments and envelopes from selected backup
 */
export async function restoreDataFromBackup(ts: string, user: User) {
  if (!user) {
    console.error("No user provided to restorePaymentsFromBackup");
    return;
  }
  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      console.error("User document does not exist");
      return;
    }

    const backups: Backup = docSnap.data().backups;

    if (!backups) {
      console.error("No backups found");
      return;
    }

    const b = backups.data.find((b) => b.backupTimeStamp.toString() === ts);

    if (!b) {
      console.error("No specific backup found for timestamp: ", ts);
      return;
    }

    console.log(
      `⚠️ Restoring from ${b.backupTimeStamp?.toDate()} backup! \n
      ⚠️ ${b.payments.length} payments \n 
      ⚠️ ${b.nvelopes.length} envelopes  \n
      ⚠️ Setting income back to ${b.income}\n
      ⚠️ Setting Spending Budget back to ${b.totalSpendingBudget}`
    );

    await editTotalSpendingBudget(Number(b.totalSpendingBudget), user.uid)
    await editIncome(Number(b.income), user.uid);
    await editEnvelopes(b.nvelopes, user.uid);
    await editPayments(b.payments, user.uid);

    return b;
  } catch (error) {
    console.error("Error restoring payments from backup: ", error);
  }
}
