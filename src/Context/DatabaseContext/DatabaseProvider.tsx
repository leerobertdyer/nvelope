import type { Timestamp } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useState } from "react";
import type { Bill, Envelope, Interval, OneTimeCash } from "../../types";
import loadUserData from "../../firebase/loadUserData";
import { useAuth } from "../AuthContext/useAuth";

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [payDate, setPayDate] = useState<Timestamp | null>(null);
    const [interval, setInterval] = useState<Interval>(null);
    const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [income, setIncome] = useState<number>(0);
    const [isNewUser, setIsNewUser] = useState<boolean>(true);
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);
    const [oneTimeCash, setOneTimeCash] = useState<OneTimeCash[] | null>(null);
    
    useEffect(() => {
        if (user) {
            loadUserData(user).then((data) => {
                setEnvelopes(data.envelopes || []);
                setPayDate(data.payDate);
                setInterval(data.interval || null);
                setBills(data.bills || []);
                setIncome(data.income || 0);
                setIsNewUser(data.isNewUser);
                setTotalSpendingBudget(data.totalSpendingBudget || 0);
                setOneTimeCash(data.oneTimeCash || null);
            });
        } 
    }, [user]);
    
    const value = {
        payDate,
        setPayDate,
        interval,
        setInterval,
        envelopes,
        setEnvelopes,
        bills,
        setBills,
        income,
        setIncome,
        isNewUser,
        setIsNewUser,
        totalSpendingBudget,
        setTotalSpendingBudget,
        oneTimeCash,
        setOneTimeCash
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}