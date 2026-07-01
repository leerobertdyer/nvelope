import { useContext } from "react";
import { BudgetContext } from "./BudgetContext";

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
