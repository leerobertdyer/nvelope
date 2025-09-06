import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import MainEnvelopesView from "./MainEnvelopesView";
import Loading from "../components/Loading";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import Demo from "./Demo";

export default function Home() {
  const { user } = useAuth();
  const { isNewUser } = useDatabase();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
    // Manual timeout to give firebase time to load user
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, [user]);


  
  return (
    <>
      <div className="">
        {isLoading 
          ? <Loading text="Welcome to Nvelopes..." />
          : user 
            ? isNewUser 
              ? <Demo />
              : <MainEnvelopesView />
            : <div className="flex justify-center items-center w-full h-screen">
                  <LoginOptions />
              </div>}
      </div>
    </>
  );
}
