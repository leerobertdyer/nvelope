import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import MainView from "./MainView";
import Loading from "../components/Loading";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import Demo from "./Demo";

export default function Home() {
  const { user, isLoadingUser } = useAuth();
  const { isNewUser, isLoadingDb, dbError, documentExists } = useDatabase();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoadingUser && !isLoadingDb) {
      setIsLoading(false);
    }
  }, [isLoadingUser, isLoadingDb]);

  if (isLoading)
    return (
          <Loading text="Welcome to Nvelopes..." />
    );

  if (!user) {
    return (
      <div className="flex justify-center items-center w-full h-screen">
        <LoginOptions />
      </div>
    );
  }

  // Display critical database errors that could indicate data corruption risk
  if (dbError) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-screen bg-my-black-dark text-my-white-dark p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl text-my-red-light mb-4">⚠️ Database Error</h1>
          <p className="mb-4 text-my-white-light">{dbError}</p>
          <p className="text-sm text-my-white-base mb-6">
            This error occurred to protect your data. Please do not continue until this is resolved.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-my-blue-base text-my-white-dark px-6 py-2 rounded-md hover:bg-my-blue-light"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // No document exists = new user (or returning user who never completed setup)
  // Show Demo which will create their document through intentional user action
  if (documentExists === false) {
    return <Demo />;
  }
  
  // Document exists but user still in onboarding flow
  if (isNewUser) {
    return <Demo />;
  }
  
  // Document exists and user has completed onboarding
  return <MainView />;
}
