import type { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";

export interface Envelope {
    id: string
    name: string
    total: number
    spent: number
    order?: number
}

export interface Payment {
    id: string
    name: string
    amount: number
    dueDate: Timestamp
    interval: Interval
    paid: boolean
    paidDates?: Timestamp[] // for tracking payments that span multiple intervals (ie WEEKLY | BIWEEKLY | SPLIT)
    paidAmounts?: Record<string, number> // for DEBT: key = occurrence timestamp string, value = amount applied (so we can reverse on unmark)
    type: "DEBT" | "BILL" | "FUND" | undefined
    isInInterval?: boolean
    total?: number
    interestRate?: number
    recurring?: boolean // For SPLIT: true = monthly recurring (like rent), false = Fund (planned expense to save toward)
    paymentsLeft?: number
    payOffDate?: string
}

export type PaymentType = "BILL" | "DEBT" | "FUND"

export interface OneTimeAmount {
    id: string
    name: string
    amount: number
    date: Timestamp
}

// PreviousIntervalDetails removed - see FUTURE FEATURE comment in editData.ts

export type Interval = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY" | "SPLIT" | undefined;

export type ChangeValue = boolean | string | null | Value | number | Payment[]

export type IntervalDates = {
    start: Date;
    end: Date;
}

export type BackupData = {
    backupTimeStamp: Timestamp;
    cash?: OneTimeAmount[];
    expenses?: OneTimeAmount[];
    nvelopes: Envelope[];
    payDate: Timestamp;
    payPeriodInterval: Interval;
    payments: Payment[];
    shouldReset: Timestamp;
    snowball: number;
    snowballTargetPaymentId?: string | null;
    totalSpendingBudget: number;
}

export type Backup = {
    backupTimeStamp: Timestamp;
    data: BackupData[]
}

// Multi-budget: budget metadata (budgets/{budgetId})
export interface Budget {
    name: string;
    ownerId: string;
    memberIds: string[];
    /** uid -> email for display; set on create and when user accepts invite */
    memberEmails?: Record<string, string>;
    createdAt?: Timestamp;
}

// User's reference to a budget (users/{userId}/budgets/{budgetId})
export interface UserBudgetRef {
    name: string;
    budgetId: string;
}

// Single doc under budgets/{budgetId}/data/main - same shape as old user doc
export type BudgetDataDoc = {
    envelopes: Envelope[];
    payments: Payment[];
    payDate: Timestamp | null;
    payPeriodInterval: Interval;
    totalSpendingBudget: number;
    oneTimeCash: OneTimeAmount[] | null;
    resetBudgetTimestamp: Timestamp | null;
    snowball: number;
    snowballTargetPaymentId: string | null;
    isNewUser: boolean;
    backups: Backup | null;
};