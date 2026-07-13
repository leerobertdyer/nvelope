import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext/useAuth";
import { useBudget } from "../BudgetContext/useBudget";
import { TransactionContext } from "./TransactionContext";
import firestore from "@react-native-firebase/firestore";
import { NvelopesTransaction } from "../../types";

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
    const txRef = firestore()
      .collection(`budgets/${activeBudgetId}/transactions`)
      .orderBy("createdAt", "desc");

    const unsubscribe = txRef.onSnapshot(
      (snapshot) => {
        const next = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as NvelopesTransaction,
        );
        setTransactions(next);
        setIsLoadingTransactions(false);
      },
      (error) => {
        console.error("❌ Transactions listener error:", error);
        setIsLoadingTransactions(false);
      },
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