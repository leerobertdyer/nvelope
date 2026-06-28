import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import LoginOptions from "../components/Auth/LoginOptions";
import MainView from "./MainView";
import Loading from "../components/Loading";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import FirstTimeSetup from "../../../mobile/src/components/FirstTimeSetup";
import { shouldBackupUserDataSafe, backupUserDataSafe } from "../firebase/editData";

export default function Home() {
  const { user, isLoadingUser } = useAuth();
  const { isLoadingBudgets, activeBudgetId, hasBudgets } = useBudget();
  const { isLoadingDb, dbError, documentExists, payDate } = useDatabase();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoadingUser && !isLoadingBudgets && !isLoadingDb) {
      setIsLoading(false);
    }
  }, [isLoadingUser, isLoadingBudgets, isLoadingDb]);
  
  // Run backup check for authenticated users with active budget
  useEffect(() => {
    if (!user || !activeBudgetId || documentExists !== true) return;
    async function checkAndBackup() {
      const shouldBackup = await shouldBackupUserDataSafe(user!, activeBudgetId!);
      if (shouldBackup) await backupUserDataSafe(user!, activeBudgetId!);
    }
    checkAndBackup();
  }, [user, activeBudgetId, documentExists]);

  if (isLoading)
    return (
          <Loading text="Welcome to Nvelopes..." />
    );

  if (!user) {
    return (
      <div className="gap-4 justify-center items-center w-full h-screen">
        <h1 className="text-2xl text-my-white-dark">Welcome to Nvelopes</h1>
        <p className="text-sm text-my-white-light">Old School Budgeting for the Digital Age</p>
        <LoginOptions />
      </div>
    );
  }

  // Display critical database errors that could indicate data corruption risk
  if (dbError) {
    return (
      <div className="justify-center items-center w-full h-screen bg-my-black-dark text-my-white-dark p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl text-my-red-light mb-4">⚠️ Database Error</h1>
          <p className="mb-4 text-my-white-light">{dbError}</p>
          <p className="text-sm text-my-white-base mb-6">
            This error occurred to protect your data. Please do not continue until this is resolved.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-my-red-base text-my-white-dark px-6 py-2 rounded-md hover:bg-my-blue-light"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Still resolving doc for this budget (e.g. budgets just loaded, snapshot pending).
  if (user && documentExists === null && hasBudgets) {
    return <Loading text="Welcome to Nvelopes..." />;
  }

  // No document exists = new user. Show first-time setup only when we've determined that:
  // - we have a budget but its data doc doesn't exist (documentExists === false), or
  // - we've finished loading and the user has no budgets (documentExists === null, !hasBudgets).
  const isNewUser =
    documentExists === false ||
    (documentExists === null && !hasBudgets && !isLoadingBudgets);
  if (isNewUser) {
    return <FirstTimeSetup />;
  }

  // Only show MainView once we've received the budget doc snapshot (payDate is set or explicitly null).
  if (documentExists === true && payDate === undefined) {
    return <Loading text="Welcome to Nvelopes..." />;
  }

  return <MainView />;
}
