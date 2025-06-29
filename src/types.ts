import type { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";

export interface Envelope {
    id: string,
    name: string,
    total: number,
    spent: number,
    saving?: boolean
    order?: number
}

export interface Bill {
    name: string,
    amount: number,
    dayOfMonth: number,
    paid: boolean,
    isInInterval?: boolean
}

export interface OneTimeCash {
    id: string,
    name: string,
    amount: number
    date: Timestamp
}

export interface OneTimeExpense {
    id: string,
    name: string,
    amount: number,
    date: Timestamp
}

export interface PreviousIntervalDetails {
    payDate: Timestamp,
    interval: Interval,
    envelopes: Envelope[],
    bills: Bill[],
    income: number,
    totalSpendingBudget: number,
    oneTimeCash: OneTimeCash[] | null
}

export type Interval = "monthly" | "weekly" | "biweekly" | "fixed" | null;

export type ChangeValue = boolean | string | null | Value | number | Bill[]