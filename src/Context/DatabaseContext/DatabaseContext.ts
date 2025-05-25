import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';


interface IDatabaseContext {
    startDate: Timestamp | null
    setStartDate: (startDate: Timestamp | null) => void
    interval: string
    setInterval: (interval: string) => void
    totalSpendingBudget: number
    setTotalSpendingBudget: (totalSpendingBudget: number) => void
}

export const DatabaseContext = createContext<IDatabaseContext>({
    startDate: null,
    interval: "",
    setStartDate: () => {},
    setInterval: () => {},
    totalSpendingBudget: 0,
    setTotalSpendingBudget: () => {}
});