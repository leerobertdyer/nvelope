import type {
  Payment,
  Envelope,
  Interval,
  OneTimeCash,
  OneTimeExpense,
  PreviousIntervalDetails,
} from "../types";
import { doc, updateDoc, Timestamp, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import {
  getIntervalDateRange,
  isDateInCurrentPayPeriod,
  replenishEnvelopes,
} from "../util";
import { MONTHLY } from "../constants";

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
  const toFixedEnvelopes = envelopes.map((e: Envelope) => ({...e, total: Number(e.total.toFixed(2))}))
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
    (a, b) => a.dueDate.seconds - b.dueDate.seconds
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
  newExpense: OneTimeExpense | null,
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
  newCashEntry: OneTimeCash | null,
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

export function toUTCDateString(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1
    }-${date.getUTCDate()}`;
}

async function isResetToday(
  payDate: Timestamp,
  interval: Interval,
  resetBudgetTimestamp: Timestamp | null
) {
  if (!payDate || !interval) return false;
  const now = new Date();
  const todayUTC = toUTCDateString(now);
  console.log("isResetToday date check:", {
    now,
    todayUTC,
    resetBudgetTimestamp: resetBudgetTimestamp
      ? {
        timestamp: resetBudgetTimestamp,
        date: resetBudgetTimestamp.toDate(),
        utcString: toUTCDateString(resetBudgetTimestamp.toDate()),
      }
      : null,
    isSameDay:
      resetBudgetTimestamp &&
      toUTCDateString(resetBudgetTimestamp.toDate()) === todayUTC,
  });

  // Prevent multiple resets on the same UTC day
  if (
    resetBudgetTimestamp &&
    toUTCDateString(resetBudgetTimestamp.toDate()) === todayUTC
  )
    return false;

  const originalPayDate = payDate.toDate();
  const { start, end } = getIntervalDateRange(interval, originalPayDate);

  // If we're not already in the current pay period, don't reset again
  if (resetBudgetTimestamp) {
    const lastResetDate = resetBudgetTimestamp.toDate();
    console.log("isResetToday interval check:", {
      lastResetDate,
      start,
      end,
      isInCurrentPeriod: lastResetDate >= start && lastResetDate < end,
    });

    if (lastResetDate >= start && lastResetDate < end) {
      console.warn("Already reset during this pay period.");
      return false;
    }
  }
  return true;
}

export async function checkToResetBudget(
  resetBudgetTimestamp: Timestamp | null,
  payDate: Timestamp,
  payPeriodInterval: Interval
): Promise<boolean> {
  const resetToday = await isResetToday(
    payDate,
    payPeriodInterval,
    resetBudgetTimestamp
  );
  console.log("Should reset budget today ===> ", resetToday);
  return resetToday;
}

type ResetBudgetParams = {
  payDate: Timestamp;
  payPeriodInterval: Interval;
  envelopes: Envelope[];
  user: User;
  setEnvelopes: (envelopes: Envelope[]) => void;
  setTotalSpendingBudget: (totalSpendingBudget: number) => void;
  setOneTimeCash: (oneTimeCash: OneTimeCash[] | null) => void;
  income: number;
  totalSpendingBudget: number;
  payments: Payment[];
  oneTimeCash: OneTimeCash[] | null;
  oneTimeExpenses: OneTimeExpense[] | null;
  setResetBudgetTimestamp: (resetBudgetTimestamp: Timestamp) => void;
  shouldReplenish?: boolean;
};

export async function resetBudget({
  payDate,
  payPeriodInterval,
  envelopes,
  user,
  setEnvelopes,
  setTotalSpendingBudget,
  setOneTimeCash,
  income,
  totalSpendingBudget,
  payments,
  oneTimeCash,
  oneTimeExpenses,
  setResetBudgetTimestamp,
  shouldReplenish,
}: ResetBudgetParams) {
  let nextEnvelopes = [...envelopes];

  if (shouldReplenish) nextEnvelopes = replenishEnvelopes(envelopes);
  console.log("nextEnvelopes", nextEnvelopes);

  let totalPaymentsInInterval = 0;
  for (const p of payments) {
    if (
      isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate.toDate(),
        p.dueDate.toDate()
      )
    ) {
      totalPaymentsInInterval += p.amount;
    }
    p.paid = false;
  }

  const totalOneTimeCash = oneTimeCash
    ? oneTimeCash.reduce(
      (acc, cash) =>
        isDateInCurrentPayPeriod(
          payPeriodInterval,
          payDate.toDate(),
          cash.date.toDate()
        )
          ? acc + cash.amount
          : acc,
      0
    )
    : 0;

  const totalOneTimeExpenses = oneTimeExpenses
    ? oneTimeExpenses.reduce(
      (acc, expense) =>
        isDateInCurrentPayPeriod(
          payPeriodInterval,
          payDate.toDate(),
          expense.date.toDate()
        )
          ? acc + expense.amount
          : acc,
      0
    )
    : 0;

  const totalEnvelopes = nextEnvelopes.reduce((acc, n) => {
    if (n.saving) {
      return acc;
    } else {
      return acc + (n.resetTotal || 0);
    }
  }, 0);

  const remainingBudget =
    income -
    totalPaymentsInInterval +
    totalOneTimeCash -
    totalOneTimeExpenses -
    totalEnvelopes;

  const previousIntervalDetails = {
    payDate,
    payPeriodInterval,
    envelopes,
    payments,
    income,
    totalSpendingBudget,
    oneTimeCash,
  };

  await storePreviousIntervalDetails(previousIntervalDetails, user.uid);

  await editOneTimeCashAndBudget(null, user.uid, remainingBudget);
  setTotalSpendingBudget(remainingBudget);
  setOneTimeCash([]);

  if (shouldReplenish) {
    await editEnvelopes(nextEnvelopes, user.uid);
    setEnvelopes(nextEnvelopes);
  }

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
  await updateDoc(userDocRef, { snowball: amount })
  try {
    console.log('attempting to updateDoc for snowball')
  } catch (e) {
    console.error("There was an error in editSnowball when updating db: ", e)
  }
}