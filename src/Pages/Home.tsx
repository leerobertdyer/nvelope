import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import MainView from "./MainView";
import Loading from "../components/Loading";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import Demo from "./Demo";

export default function Home() {
  const { user, isLoadingUser } = useAuth(); // add loading from context if available
  const { isNewUser, isLoadingDb } = useDatabase(); // also handle its loading state
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

  return isNewUser ? <Demo /> : <MainView />;
}
