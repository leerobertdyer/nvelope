import { Timestamp, doc, onSnapshot } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useState } from "react";
import { type Backup, type Envelope, type Interval, type OneTimeAmount, type Payment } from "../../types";
import { useAuth } from "../AuthContext/useAuth";
import { db } from "../../firebase/firebase";

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    const [isLoadingDb, setIsLoadingDb] = useState(true);
    const [snowball, setSnowball] = useState<number>(0)
    const [payDate, setPayDate] = useState<Timestamp|null>(null);
    const [payPeriodInterval, setPayPeriodInterval] = useState<Interval>("MONTHLY");
    const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [income, setIncome] = useState<number>(0);
    const [isNewUser, setIsNewUser] = useState<boolean>(false);
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);
    const [oneTimeExpenses, setOneTimeExpenses] = useState<OneTimeAmount[] | null>(null);
    const [rent, setRent] = useState<number>(0);
    const [resetBudgetTimestamp, setResetBudgetTimestamp] = useState<Timestamp | null>(null);
    const [oneTimeCash, setOneTimeCash] = useState<OneTimeAmount[] | null>(null);
    const [backups, setBackups] = useState<Backup | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);
    
    // Tracks whether a Firestore document exists for this user
    // null = still loading, true = exists, false = no document (new user)
    const [documentExists, setDocumentExists] = useState<boolean | null>(null);
    
    useEffect(() => {
        if (!user) {
            setIsLoadingDb(false);
            return;
        };
        console.log("🔄 Setting up real-time Firebase listener for user:", user.uid);
        const userDocRef = doc(db, "users", user.uid);
        
        /**
         * onSnapshot establishes a REAL-TIME listener to the Firebase document.
         * 
         * How it works:
         * 1. Immediately fetches the current document state (like getDoc)
         * 2. Keeps a persistent connection open to Firebase
         * 3. Firebase pushes updates whenever the document changes
         * 4. This callback fires automatically on every change
         */
        const unsubscribe = onSnapshot(
            userDocRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    setDbError(null);
                    setDocumentExists(true);
                    setIsLoadingDb(false);
                    setSnowball(data.snowball || 0);
                    setEnvelopes(data.envelopes || []);
                    setPayDate(data.payDate ?? null);
                    setPayPeriodInterval(data.payPeriodInterval || "MONTHLY");
                    setPayments(data.payments || []);
                    setIncome(data.income || 0);
                    setIsNewUser(data.isNewUser ?? false);
                    setTotalSpendingBudget(data.totalSpendingBudget || 0);
                    setOneTimeCash(data.oneTimeCash || null);
                    setRent(data.rent || 0);
                    setResetBudgetTimestamp(data.resetBudgetTimestamp || null);
                    setOneTimeExpenses(data.oneTimeExpense || null);
                    setBackups(data.backups || null);
                } else {
                    // Document doesn't exist - this is either a new user OR a network glitch
                    // We do NOT auto-create. The UI will handle this state.
                    // Document creation only happens through intentional user action (Demo flow)
                    console.log("📭 No document found for user - documentExists = false");
                    setDocumentExists(false);
                    setIsLoadingDb(false);
                    // Keep all state at defaults (empty arrays, 0s, nulls)
                    // The UI layer will detect documentExists === false and show appropriate screen
                }
            },
            (error) => {
                console.error("❌ Firebase listener error:", error);
                setDbError(`Database error: ${error.message}. Please refresh the page.`);
                setIsLoadingDb(false);
            }
        );
        /**
         * CRITICAL: Cleanup function DO NOT REMOVE
         * 
         * This unsubscribe function is returned by onSnapshot.
         * React calls this cleanup when:
         * - Component unmounts (user logs out, navigates away)
         * - User changes (different user logs in)
         * - Effect dependencies change (in this case, just 'user')
         */
        return () => {
            console.log("🔌 Unsubscribing from Firebase listener");
            unsubscribe();
        };
    }, [user]);
    
    const value = {
        isLoadingDb,
        setIsLoadingDb,
        snowball,
        setSnowball,
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
        resetBudgetTimestamp,
        setResetBudgetTimestamp,
        oneTimeExpenses,
        setOneTimeExpenses,
        backups,
        setBackups,
        dbError,
        documentExists,
        setDocumentExists
    };

    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
}