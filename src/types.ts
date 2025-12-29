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
    type: "DEBT" | "BILL" | "FUND" | undefined
    isInInterval?: boolean
    total?: number
    interestRate?: number
    recurring?: boolean // For SPLIT: true = monthly recurring (like rent), false = Fund (planned expense to save toward)
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
    income: string;
    nvelopes: Envelope[];
    payDate: Timestamp;
    payPeriodInterval: Interval;
    payments: Payment[];
    shouldReset: Timestamp;
    snowball: number;
    totalSpendingBudget: number;
}

export type Backup = {
    backupTimeStamp: Timestamp;
    data: BackupData[]
}