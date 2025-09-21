import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';
import type { Payment, Envelope, Interval, OneTimeCash, OneTimeExpense } from "../../types";


interface IDatabaseContext {
    payDate: Timestamp
    setPayDate: (payDate: Timestamp) => void
    payPeriodInterval: Interval
    setPayPeriodInterval: (i: Interval) => void
    envelopes: Envelope[]
    setEnvelopes: (envelopes: Envelope[]) => void
    payments: Payment[]
    setPayments: (payments: Payment[]) => void
    income: number
    setIncome: (income: number) => void
    oneTimeCash: OneTimeCash[] | null
    setOneTimeCash: (oneTimeCash: OneTimeCash[] | null) => void
    isNewUser: boolean
    setIsNewUser: (isNewUser: boolean) => void
    totalSpendingBudget: number
    setTotalSpendingBudget: (totalSpendingBudget: number) => void
    rent: number
    setRent: (rent: number) => void
    shouldReset: Timestamp | null
    setShouldReset: (shouldReset: Timestamp | null) => void
    oneTimeExpenses: OneTimeExpense[] | null
    setOneTimeExpenses: (oneTimeExpenses: OneTimeExpense[] | null) => void
}
export const DatabaseContext = createContext<IDatabaseContext | null>(null)
