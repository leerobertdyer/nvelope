import { Timestamp, doc, onSnapshot } from "firebase/firestore";
import { DatabaseContext } from "./DatabaseContext";
import { useEffect, useRef, useState } from "react";
import { type Backup, type Envelope, type Interval, type Payment } from "../../types";
import { useAuth } from "../AuthContext/useAuth";
import { useBudget } from "../BudgetContext/useBudget";
import { db } from "../../firebase/firebase";

const BUDGET_DATA_DOC_ID = "main";
/** After a local payments write, ignore snapshot payments for this long so we don't overwrite with stale cache. */
const PAYMENTS_WRITE_GUARD_MS = 2000;

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { activeBudgetId, hasBudgets, handleRemovedFromBudget } = useBudget();
    const lastPaymentsWriteAtRef = useRef(0);

    const [isLoadingDb, setIsLoadingDb] = useState(true);
    const [snowballTargetPaymentId, setSnowballTargetPaymentId] = useState<string | null>(null);
    const [payDate, setPayDate] = useState<Timestamp | null | undefined>(undefined);
    const [payPeriodInterval, setPayPeriodInterval] = useState<Interval>("MONTHLY");
    const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
    const [payments, setPaymentsState] = useState<Payment[]>([]);
    const setPayments = (next: Payment[] | ((prev: Payment[]) => Payment[])) => {
        lastPaymentsWriteAtRef.current = Date.now();
        setPaymentsState(next);
    };
    const [isNewUser, setIsNewUser] = useState<boolean>(false);
    const [totalSpendingBudget, setTotalSpendingBudget] = useState<number>(0);
    const [backups, setBackups] = useState<Backup | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);
    const [documentExists, setDocumentExists] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) {
            setDocumentExists(null);
            setPayDate(undefined);
            setIsLoadingDb(false);
            return;
        }
        if (!hasBudgets) {
            setDocumentExists(null);
            setPayDate(undefined);
            setIsLoadingDb(false);
            return;
        }
        if (!activeBudgetId) {
            setPayDate(undefined);
            setIsLoadingDb(false);
            return;
        }

        setPayDate(undefined);
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
                    setSnowballTargetPaymentId(data.snowballTargetPaymentId ?? null);
                    setEnvelopes(data.envelopes ?? []);
                    setPayDate(data.payDate ?? null);
                    setPayPeriodInterval(data.payPeriodInterval ?? "MONTHLY");
                    const snapshotPayments = data.payments ?? [];
                    if (Date.now() - lastPaymentsWriteAtRef.current >= PAYMENTS_WRITE_GUARD_MS) {
                        setPaymentsState(snapshotPayments);
                    }
                    setIsNewUser(data.isNewUser ?? false);
                    setTotalSpendingBudget(data.totalSpendingBudget ?? 0);
                    setBackups(data.backups ?? null);
                } else {
                    setDocumentExists(false);
                    setPayDate(undefined);
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
        isNewUser,
        setIsNewUser,
        totalSpendingBudget,
        setTotalSpendingBudget,
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
