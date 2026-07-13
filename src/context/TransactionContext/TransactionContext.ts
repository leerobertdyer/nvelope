import { createContext } from "react";
import { NvelopesTransaction } from "../../types";

export interface TransactionContextValue {
  transactions: NvelopesTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<NvelopesTransaction[]>>;
}

export const TransactionContext = createContext<TransactionContextValue | null>(
  null,
);
