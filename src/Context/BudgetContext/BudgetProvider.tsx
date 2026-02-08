import { useCallback, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../AuthContext/useAuth";
import { BudgetContext } from "./BudgetContext";
import type { BudgetListItem } from "./BudgetContext";
import type { PendingInvite } from "../../firebase/budgets";
import { getPendingInvites, acceptInvite as acceptInviteApi, declineInvite as declineInviteApi } from "../../firebase/budgets";

const ACTIVE_BUDGET_KEY = "nvelope_activeBudgetId";

export default function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
  const [activeBudgetId, setActiveBudgetIdState] = useState<string | null>(null);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const loadBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      setActiveBudgetIdState(null);
      setPendingInvites([]);
      setIsLoadingBudgets(false);
      return;
    }
    setIsLoadingBudgets(true);
    try {
      const [invites, budgetSnap] = await Promise.all([
        getPendingInvites(user),
        getDocs(collection(db, "users", user.uid, "budgets")),
      ]);
      setPendingInvites(invites);

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
    } catch (e) {
      console.error("BudgetProvider: failed to load budgets", e);
      setBudgets([]);
      setActiveBudgetIdState(null);
      setPendingInvites([]);
    } finally {
      setIsLoadingBudgets(false);
    }
  }, [user]);

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

  const acceptInvite = useCallback(
    async (budgetId: string) => {
      if (!user) return;
      await acceptInviteApi(user, budgetId);
      setPendingInvites((prev) => prev.filter((i) => i.budgetId !== budgetId));
      setActiveBudgetIdState(budgetId);
      if (typeof window !== "undefined") localStorage.setItem(ACTIVE_BUDGET_KEY, budgetId);
      await loadBudgets();
    },
    [user, loadBudgets]
  );

  const declineInvite = useCallback(async (inviteId: string) => {
    try {
      await declineInviteApi(inviteId);
    } finally {
      setPendingInvites((prev) => prev.filter((i) => i.inviteId !== inviteId));
    }
  }, []);

  const value = {
    budgets,
    activeBudgetId,
    setActiveBudgetId,
    isLoadingBudgets,
    hasBudgets: budgets.length > 0,
    refetchBudgets: loadBudgets,
    pendingInvites,
    acceptInvite,
    declineInvite,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}
