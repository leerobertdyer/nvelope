import type { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";

export interface Envelope {
    id: string,
    name: string,
    total: number,
    spent: number,
    resetTotal?: number,
    saving?: boolean
    order?: number
}

export interface Bill {
    name: string,
    amount: number,
    paid: boolean,
    isInInterval?: boolean
    interval: Interval
    originalDate: Timestamp
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

export type Interval = "yearly" | "monthly" | "weekly" | "biweekly" | "first" | "second" | "third" | "fourth" | "last" | "fixed" | null;

export type ChangeValue = boolean | string | null | Value | number | Bill[]

export type IntervalDates = {
    start: Date;
    end: Date;
}