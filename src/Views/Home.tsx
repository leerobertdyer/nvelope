import { useEffect, useState } from "react";
import Spend from "../components/Spend";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import Folders from "../components/Folders";
import Header from "../components/Header";

export default function Home() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showFolders, setShowFolders] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [user]);

  return (
    <>
      {user &&<Header />}
      <div className="flex flex-col items-center justify-center h-full gap-4">
        {isLoading 
          ? <p className="text-center animate-pulse text-my-red-dark">Loading...</p>
          : showFolders 
          ? <>{user && <Folders />}</>
          : <>{user ? <Spend onClick={() => setShowFolders(true)} /> : <LoginOptions />}</>
        }
      </div>
    </>
  );
}
