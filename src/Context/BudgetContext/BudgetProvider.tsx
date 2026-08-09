import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../AuthContext/useAuth";
import { BudgetContext } from "./BudgetContext";
import type { BudgetListItem } from "./BudgetContext";
import { createFirstBudget } from "../../firebase/budgets";
import { editIsNewUser } from "../../firebase/editData";

const ACTIVE_BUDGET_KEY = "nvelope_activeBudgetId";

export default function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
  const [activeBudgetId, setActiveBudgetIdState] = useState<string | null>(null);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);

  const loadBudgets = useCallback(async (): Promise<BudgetListItem[]> => {
    if (!user) {
      setBudgets([]);
      setActiveBudgetIdState(null);
      setIsLoadingBudgets(false);
      return [];
    }
    setIsLoadingBudgets(true);
    try {
      const budgetSnap = await getDocs(
        query(collection(db, "budgets"), where("memberIds", "array-contains", user.uid))
      );

      const list: BudgetListItem[] = budgetSnap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name?: string }).name ?? "Budget",
      }));
      setBudgets(list);

      const stored = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_BUDGET_KEY) : null;
      const validStored = list.some((b) => b.id === stored);
      if (list.length > 0) {
        const nextActive = validStored && stored ? stored : list[0].id;
        setActiveBudgetIdState(nextActive);
        if (typeof window !== "undefined" && nextActive !== stored) {
          localStorage.setItem(ACTIVE_BUDGET_KEY, nextActive);
        }
      } else {
        setActiveBudgetIdState(null);
        if (typeof window !== "undefined") localStorage.removeItem(ACTIVE_BUDGET_KEY);
      }
      return list;
    } catch (e) {
      console.error("BudgetProvider: failed to load budgets", e);
      setBudgets([]);
      setActiveBudgetIdState(null);
      return [];
    } finally {
      setIsLoadingBudgets(false);
    }
  }, [user]);

  /** Call when user was removed from the current budget: refetch list and switch to another budget, or create one if none left. */
  const handleRemovedFromBudget = useCallback(async () => {
    if (!user) return;
    const list = await loadBudgets();
    if (list.length === 0) {
      const newId = await createFirstBudget(user);
      if (newId) {
        await editIsNewUser(false, newId);
        setActiveBudgetIdState(newId);
        if (typeof window !== "undefined") localStorage.setItem(ACTIVE_BUDGET_KEY, newId);
        await loadBudgets();
      }
    }
  }, [user, loadBudgets]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const setActiveBudgetId = useCallback((id: string | null) => {
    setActiveBudgetIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(ACTIVE_BUDGET_KEY, id);
      else localStorage.removeItem(ACTIVE_BUDGET_KEY);
    }
  }, []);

  const value = {
    budgets,
    activeBudgetId,
    setActiveBudgetId,
    isLoadingBudgets,
    hasBudgets: budgets.length > 0,
    refetchBudgets: () => loadBudgets().then(() => {}),
    handleRemovedFromBudget,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}
