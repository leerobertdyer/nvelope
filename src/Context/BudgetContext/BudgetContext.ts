import { createContext } from "react";

export interface BudgetListItem {
  id: string;
  name: string;
}

interface IBudgetContext {
  budgets: BudgetListItem[];
  activeBudgetId: string | null;
  setActiveBudgetId: (id: string | null) => void;
  isLoadingBudgets: boolean;
  hasBudgets: boolean;
  refetchBudgets: () => Promise<void>;
}

export const BudgetContext = createContext<IBudgetContext | null>(null);
