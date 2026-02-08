import { createContext } from "react";
import type { PendingInvite } from "../../firebase/budgets";

export interface BudgetListItem {
  id: string;
  name: string;
}

export interface BudgetContextValue {
  budgets: BudgetListItem[];
  activeBudgetId: string | null;
  setActiveBudgetId: (id: string | null) => void;
  isLoadingBudgets: boolean;
  hasBudgets: boolean;
  refetchBudgets: () => Promise<void>;
  pendingInvites: PendingInvite[];
  acceptInvite: (budgetId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
}

export const BudgetContext = createContext<BudgetContextValue | null>(null);
