import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';
import type { Payment, Envelope, Interval, OneTimeAmount, Backup } from "../../types";


interface IDatabaseContext {
    isLoadingDb: boolean,
    setIsLoadingDb: (b: boolean) => void;
    snowball: number,
    setSnowball: (n: number) => void;
    snowballTargetPaymentId: string | null;
    setSnowballTargetPaymentId: (id: string | null) => void;
    payDate: Timestamp | null | undefined
    setPayDate: (payDate: Timestamp | null | undefined) => void
    payPeriodInterval: Interval
    setPayPeriodInterval: (i: Interval) => void
    envelopes: Envelope[]
    setEnvelopes: (envelopes: Envelope[]) => void
    payments: Payment[]
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>
    oneTimeCash: OneTimeAmount[] | null
    setOneTimeCash: (oneTimeCash: OneTimeAmount[] | null) => void
    isNewUser: boolean
    setIsNewUser: (isNewUser: boolean) => void
    totalSpendingBudget: number
    setTotalSpendingBudget: (totalSpendingBudget: number) => void
    resetBudgetTimestamp: Timestamp | null
    setResetBudgetTimestamp: (resetBudgetTimestamp: Timestamp | null) => void
    backups: Backup | null;
    dbError: string | null;
    documentExists: boolean | null;
    setDocumentExists: (exists: boolean | null) => void;
}
export const DatabaseContext = createContext<IDatabaseContext | null>(null)
