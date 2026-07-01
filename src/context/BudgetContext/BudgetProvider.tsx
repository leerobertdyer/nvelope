import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext/useAuth";
import { BudgetContext } from "./BudgetContext";
import type { BudgetListItem } from "./BudgetContext";
import type { PendingInvite } from "../../firebase/budgets";
import {
  getPendingInvites,
  acceptInvite as acceptInviteApi,
  declineInvite as declineInviteApi,
  createFirstBudget,
} from "../../firebase/budgets";
import { editIsNewUser } from "../../firebase/editData";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_BUDGET_KEY = "nvelope_activeBudgetId";

export default function BudgetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
  const [activeBudgetId, setActiveBudgetIdState] = useState<string | null>(
    null,
  );
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const loadBudgets = useCallback(async (): Promise<BudgetListItem[]> => {
    if (!user) {
      setBudgets([]);
      setActiveBudgetIdState(null);
      setPendingInvites([]);
      setIsLoadingBudgets(false);
      return [];
    }
    setIsLoadingBudgets(true);
    try {
      const [invites, budgetSnap] = await Promise.all([
        getPendingInvites(user),
        firestore().collection(`users/${user.uid}/budgets`).get(),
      ]);
      setPendingInvites(invites);

      const list: BudgetListItem[] = budgetSnap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name?: string }).name ?? "Budget",
      }));
      setBudgets(list);

      const stored = await AsyncStorage.getItem(ACTIVE_BUDGET_KEY);
      const validStored = list.some((b) => b.id === stored);
      if (list.length > 0) {
        const nextActive = validStored && stored ? stored : list[0].id;
        setActiveBudgetIdState(nextActive);
        if (nextActive !== stored) {
          await AsyncStorage.setItem(ACTIVE_BUDGET_KEY, nextActive);
        }
      } else {
        setActiveBudgetIdState(null);
        await AsyncStorage.removeItem(ACTIVE_BUDGET_KEY);
      }
      return list;
    } catch (e) {
      console.error("BudgetProvider: failed to load budgets", e);
      setBudgets([]);
      setActiveBudgetIdState(null);
      setPendingInvites([]);
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
        await AsyncStorage.setItem(ACTIVE_BUDGET_KEY, newId);
        await loadBudgets();
      }
    }
  }, [user, loadBudgets]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const setActiveBudgetId = useCallback(async (id: string | null) => {
    setActiveBudgetIdState(id);
    if (id) await AsyncStorage.setItem(ACTIVE_BUDGET_KEY, id);
    else await AsyncStorage.removeItem(ACTIVE_BUDGET_KEY);
  }, []);

  const acceptInvite = useCallback(
    async (budgetId: string) => {
      if (!user) return;
      await acceptInviteApi(user, budgetId);
      setPendingInvites((prev) => prev.filter((i) => i.budgetId !== budgetId));
      setActiveBudgetIdState(budgetId);
        await AsyncStorage.setItem(ACTIVE_BUDGET_KEY, budgetId);
      await loadBudgets();
    },
    [user, loadBudgets],
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
    refetchBudgets: () => loadBudgets().then(() => {}),
    pendingInvites,
    acceptInvite,
    declineInvite,
    handleRemovedFromBudget,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}
