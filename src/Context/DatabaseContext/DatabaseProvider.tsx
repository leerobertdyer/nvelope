import { Timestamp, doc, onSnapshot } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useState } from "react";
import { type Backup, type Envelope, type Interval, type OneTimeAmount, type Payment } from "../../types";
import { useAuth } from "../AuthContext/useAuth";
import { useBudget } from "../BudgetContext/useBudget";
import { db } from "../../firebase/firebase";

const BUDGET_DATA_DOC_ID = "main";

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { activeBudgetId, hasBudgets, handleRemovedFromBudget } = useBudget();

    const [isLoadingDb, setIsLoadingDb] = useState(true);
    const [snowball, setSnowball] = useState<number>(0);
    const [snowballTargetPaymentId, setSnowballTargetPaymentId] = useState<string | null>(null);
    const [payDate, setPayDate] = useState<Timestamp|null>(null);
    const [payPeriodInterval, setPayPeriodInterval] = useState<Interval>("MONTHLY");
    const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [income, setIncome] = useState<number>(0);
    const [isNewUser, setIsNewUser] = useState<boolean>(false);
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);
    const [resetBudgetTimestamp, setResetBudgetTimestamp] = useState<Timestamp | null>(null);
    const [oneTimeCash, setOneTimeCash] = useState<OneTimeAmount[] | null>(null);
    const [backups, setBackups] = useState<Backup | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);
    const [documentExists, setDocumentExists] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) {
            setDocumentExists(null);
            setIsLoadingDb(false);
            return;
        }
        if (!hasBudgets) {
            setDocumentExists(false);
            setIsLoadingDb(false);
            return;
        }
        if (!activeBudgetId) {
            setIsLoadingDb(false);
            return;
        }

        setIsLoadingDb(true);
        const dataRef = doc(db, "budgets", activeBudgetId, "data", BUDGET_DATA_DOC_ID);

        const unsubscribe = onSnapshot(
            dataRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    setDbError(null);
                    setDocumentExists(true);
                    setIsLoadingDb(false);
                    setSnowball(data.snowball ?? 0);
                    setSnowballTargetPaymentId(data.snowballTargetPaymentId ?? null);
                    setEnvelopes(data.envelopes ?? []);
                    setPayDate(data.payDate ?? null);
                    setPayPeriodInterval(data.payPeriodInterval ?? "MONTHLY");
                    setPayments(data.payments ?? []);
                    setIncome(data.income ?? 0);
                    setIsNewUser(data.isNewUser ?? false);
                    setTotalSpendingBudget(data.totalSpendingBudget ?? 0);
                    setOneTimeCash(data.oneTimeCash ?? null);
                    setResetBudgetTimestamp(data.resetBudgetTimestamp ?? null);
                    setBackups(data.backups ?? null);
                } else {
                    setDocumentExists(false);
                    setIsLoadingDb(false);
                }
            },
            (error) => {
                console.error("❌ Firebase listener error:", error);
                const isPermissionDenied =
                    (error as { code?: string }).code === "permission-denied" ||
                    (error as { code?: string }).code === "permission_denied" ||
                    /permission|insufficient/i.test(String(error?.message ?? ""));
                if (isPermissionDenied && handleRemovedFromBudget) {
                    setDbError(null);
                    setIsNewUser(false);
                    setDocumentExists(true);
                    handleRemovedFromBudget();
                } else {
                    setDbError(`Database error: ${error.message}. Please refresh the page.`);
                }
                setIsLoadingDb(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [user, activeBudgetId, hasBudgets]);

    const value = {
        isLoadingDb,
        setIsLoadingDb,
        snowball,
        setSnowball,
        snowballTargetPaymentId,
        setSnowballTargetPaymentId,
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
        resetBudgetTimestamp,
        setResetBudgetTimestamp,
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
