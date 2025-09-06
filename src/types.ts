import type { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";

export interface Envelope {
    id: string
    name: string
    total: number
    spent: number
    resetTotal?: number
    saving?: boolean
    order?: number
}

export interface Payment {
    id: string
    name: string
    amount: number
    dueDate: Timestamp
    interval: Interval
    paid: boolean
    type: "DEBT" | "BILL"
    isInInterval?: boolean
    total?: number
    interestRate?: number
}

export type BillOrDebt = "BILL" | "DEBT"

export interface OneTimeCash {
    id: string
    name: string
    amount: number
    date: Timestamp
}

export interface OneTimeExpense {
    id: string
    name: string
    amount: number
    date: Timestamp
}

export interface PreviousIntervalDetails {
    payDate: Timestamp
    interval: Interval
    envelopes: Envelope[]
    bills: Payment[]
    income: number
    totalSpendingBudget: number
    oneTimeCash: OneTimeCash[] | null
}

export type Interval = "WEEKLY" | "BIWEEKLY" |"MONTHLY" | "YEARLY";

export type ChangeValue = boolean | string | null | Value | number | Payment[]

export type IntervalDates = {
    start: Date;
    end: Date;
}