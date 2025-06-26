import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import MainEnvelopesView from "./MainEnvelopesView";

export default function Home() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="">
        {isLoading 
          ? <p className="text-center animate-pulse text-my-red-dark">Loading...</p>
          : user 
            ? <MainEnvelopesView />
            : <LoginOptions />}
      </div>
    </>
  );
}
