import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';
import type { Bill, Folder, Interval } from "../../types";


interface IDatabaseContext {
    payDate: Timestamp | null
    setPayDate: (payDate: Timestamp | null) => void
    interval: Interval
    setInterval: (interval: Interval) => void
    folders: Folder[]
    setFolders: (folders: Folder[]) => void
    bills: Bill[]
    setBills: (bills: Bill[]) => void
    income: number
    setIncome: (income: number) => void
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
    folders: [],
    setFolders: () => {},
    bills: [],
    setBills: () => {},
    income: 0,
    setIncome: () => {},
    isNewUser: true,
    setIsNewUser: () => {},
    totalSpendingBudget: 0,
    setTotalSpendingBudget: () => {}
});