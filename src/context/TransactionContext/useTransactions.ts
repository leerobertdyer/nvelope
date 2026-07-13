import { useContext } from "react";
import { TransactionContext } from "./TransactionContext";

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransaction must be used within TransactionProvider");
  return ctx;
}
