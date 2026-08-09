import { createContext } from "react";
import type { NvelopesTransaction } from "../../types";

export interface TransactionContextValue {
  transactions: NvelopesTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<NvelopesTransaction[]>>;
  isLoadingTransactions: boolean;
}

export const TransactionContext = createContext<TransactionContextValue | null>(
  null
);
