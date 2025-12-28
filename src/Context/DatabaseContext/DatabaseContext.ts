import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';
import type { Payment, Envelope, Interval, OneTimeAmount, Backup } from "../../types";


interface IDatabaseContext {
    isLoadingDb: boolean,
    setIsLoadingDb: (b: boolean) => void;
    snowball: number,
    setSnowball: (n: number) => void;
    payDate: Timestamp | null
    setPayDate: (payDate: Timestamp | null) => void
    payPeriodInterval: Interval
    setPayPeriodInterval: (i: Interval) => void
    envelopes: Envelope[]
    setEnvelopes: (envelopes: Envelope[]) => void
    payments: Payment[]
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>
    income: number
    setIncome: (income: number) => void
    oneTimeCash: OneTimeAmount[] | null
    setOneTimeCash: (oneTimeCash: OneTimeAmount[] | null) => void
    isNewUser: boolean
    setIsNewUser: (isNewUser: boolean) => void
    totalSpendingBudget: number
    setTotalSpendingBudget: (totalSpendingBudget: number) => void
    resetBudgetTimestamp: Timestamp | null
    setResetBudgetTimestamp: (resetBudgetTimestamp: Timestamp | null) => void
    oneTimeExpenses: OneTimeAmount[] | null
    setOneTimeExpenses: (oneTimeExpenses: OneTimeAmount[] | null) => void
    backups: Backup | null;
    dbError: string | null;
    documentExists: boolean | null;
    setDocumentExists: (exists: boolean | null) => void;
}
export const DatabaseContext = createContext<IDatabaseContext | null>(null)
