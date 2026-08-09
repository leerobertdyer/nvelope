import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useAuth } from "../AuthContext/useAuth";
import { useBudget } from "../BudgetContext/useBudget";
import { TransactionContext } from "./TransactionContext";
import { db } from "../../firebase/firebase";
import type { NvelopesTransaction } from "../../types";

export default function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const [transactions, setTransactions] = useState<NvelopesTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    if (!user || !activeBudgetId) {
      setTransactions([]);
      setIsLoadingTransactions(false);
      return;
    }

    setIsLoadingTransactions(true);
    const txRef = query(
      collection(db, "budgets", activeBudgetId, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      txRef,
      (snapshot) => {
        const next = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as NvelopesTransaction
        );
        setTransactions(next);
        setIsLoadingTransactions(false);
      },
      (error) => {
        console.error("❌ Transactions listener error:", error);
        setIsLoadingTransactions(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeBudgetId]);

  const value = {
    transactions,
    setTransactions,
    isLoadingTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
