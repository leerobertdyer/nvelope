import type { Timestamp } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useState } from "react";
import type { Bill, Folder, Interval } from "../../types";
import loadUserData from "../../firebase/loadUserData";
import { useAuth } from "../AuthContext/useAuth";

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [payDate, setPayDate] = useState<Timestamp | null>(null);
    const [interval, setInterval] = useState<Interval>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [income, setIncome] = useState<number>(0);
    const [isNewUser, setIsNewUser] = useState<boolean>(true);
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);
    
    useEffect(() => {
        if (user) {
            loadUserData(user).then((data) => {
                setFolders(data.folders || []);
                setPayDate(data.payDate);
                setInterval(data.interval || null);
                setBills(data.bills || []);
                setIncome(data.income || 0);
                setIsNewUser(data.isNewUser);
                const total = data.bills ? data.bills.reduce((acc: number, bill: Bill) => acc + bill.amount, 0) : 0;
                let budget = 0;
                switch (data.interval) {
                    case 'monthly':
                        budget = income - total;
                        break;
                    case 'weekly':
                        budget = income - (total / 4);
                        break;
                    case 'biweekly':
                        budget = income - (total / 2);
                        break;
                    default:
                        budget = 0;
                        break;
                }
                setTotalSpendingBudget(budget);
                // console.log(`payDate: ${payDate}, isNewUser: ${isNewUser}, interval: ${interval}, income: ${income}, total: ${total}, budget: ${budget}`);
            });
        } 
    }, [user, income, interval, isNewUser, payDate]);
    
    const value = {
        payDate,
        setPayDate,
        interval,
        setInterval,
        folders,
        setFolders,
        bills,
        setBills,
        income,
        setIncome,
        isNewUser,
        setIsNewUser,
        totalSpendingBudget,
        setTotalSpendingBudget
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}