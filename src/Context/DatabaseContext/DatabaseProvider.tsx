import type { Timestamp } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useState } from "react";

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const [startDate, setStartDate] = useState<Timestamp | null>(null);
    const [interval, setInterval] = useState<string>("");
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);

    useEffect(() => {
        // Get BudgetData
    }, []);
    
    const value = {
        startDate,
        setStartDate,
        interval,
        setInterval,
        totalSpendingBudget,
        setTotalSpendingBudget
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}