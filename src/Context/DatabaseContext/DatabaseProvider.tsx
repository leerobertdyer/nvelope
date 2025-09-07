import type { Timestamp } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useState } from "react";
import type { Envelope, Interval, OneTimeCash, OneTimeExpense, Payment } from "../../types";
import loadUserData from "../../firebase/loadUserData";
import { useAuth } from "../AuthContext/useAuth";

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [payDate, setPayDate] = useState<Timestamp | null>(null);
    const [payPeriodInterval, setPayPeriodInterval] = useState<Interval>("MONTHLY");
    const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [income, setIncome] = useState<number>(0);
    const [isNewUser, setIsNewUser] = useState<boolean>(true);
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);
    const [oneTimeCash, setOneTimeCash] = useState<OneTimeCash[] | null>(null);
    const [rent, setRent] = useState<number>(0);
    const [shouldReset, setShouldReset] = useState<Timestamp | null>(null);
    const [oneTimeExpenses, setOneTimeExpenses] = useState<OneTimeExpense[] | null>(null);
    
    useEffect(() => {
        if (user) {
            loadUserData(user).then((data) => {
                setEnvelopes(data.envelopes || []);
                setPayDate(data.payDate);
                setPayPeriodInterval(data.payPeriodInterval || "MONTHLY");
                setPayments(data.payments || []);
                setIncome(data.income || 0);
                setIsNewUser(data.isNewUser);
                setTotalSpendingBudget(data.totalSpendingBudget || 0);
                setOneTimeCash(data.oneTimeCash || null);
                setRent(data.rent || 0);
                setShouldReset(data.shouldReset || null);
                setOneTimeExpenses(data.oneTimeExpenses || null);
            });
        } 
    }, [user]);
    
    const value = {
        payDate,
        setPayDate,
        payPeriodInterval,
        setPayPeriodInterval,
        envelopes,
        setEnvelopes,
        payments,
        setPayments,
        income,
        setIncome,
        isNewUser,
        setIsNewUser,
        totalSpendingBudget,
        setTotalSpendingBudget,
        oneTimeCash,
        setOneTimeCash,
        rent,
        setRent,
        shouldReset,
        setShouldReset,
        oneTimeExpenses,
        setOneTimeExpenses
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}