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
}

export interface OneTimeCash {
    id: string,
    name: string,
    amount: number
}

export type Interval = "monthly" | "weekly" | "biweekly" | null;

export type ChangeValue = boolean | string | null | Value | number | Bill[]