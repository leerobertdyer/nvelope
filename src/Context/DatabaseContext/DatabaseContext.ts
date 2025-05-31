import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';
import type { Bill, Envelope, Interval, OneTimeCash } from "../../types";


interface IDatabaseContext {
    payDate: Timestamp | null
    setPayDate: (payDate: Timestamp | null) => void
    interval: Interval
    setInterval: (interval: Interval) => void
    envelopes: Envelope[]
    setEnvelopes: (envelopes: Envelope[]) => void
    bills: Bill[]
    setBills: (bills: Bill[]) => void
    income: number
    setIncome: (income: number) => void
    oneTimeCash: OneTimeCash[] | null
    setOneTimeCash: (oneTimeCash: OneTimeCash[] | null) => void
    isNewUser: boolean
    setIsNewUser: (isNewUser: boolean) => void
    totalSpendingBudget: number
    setTotalSpendingBudget: (totalSpendingBudget: number) => void
}

export const DatabaseContext = createContext<IDatabaseContext>({
    payDate: null,
    interval: null,
    setPayDate: () => {},
    setInterval: () => {},
    envelopes: [],
    setEnvelopes: () => {},
    bills: [],
    setBills: () => {},
    income: 0,
    setIncome: () => {},
    oneTimeCash: null,
    setOneTimeCash: () => {},
    isNewUser: true,
    setIsNewUser: () => {},
    totalSpendingBudget: 0,
    setTotalSpendingBudget: () => {}
});