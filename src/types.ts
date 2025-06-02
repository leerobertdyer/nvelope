import type { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";

export interface Envelope {
    id: string,
    name: string,
    total: number,
    spent: number,
    recurring: boolean
}

export interface Bill {
    name: string,
    amount: number,
    dayOfMonth: number
}

export interface OneTimeCash {
    id: string,
    name: string,
    amount: number
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

export type Interval = "monthly" | "weekly" | "biweekly" | null;

export type ChangeValue = boolean | string | null | Value | number | Bill[]