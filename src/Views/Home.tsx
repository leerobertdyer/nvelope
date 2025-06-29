import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import MainEnvelopesView from "./MainEnvelopesView";
import Loading from "../components/Loading";

export default function Home() {
  const { user } = useAuth();
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
          ? <Loading text="Loading Budget..." />
          : user 
            ? <MainEnvelopesView />
            : <div className="flex justify-center items-center w-full h-screen">
                  <LoginOptions />
              </div>}
      </div>
    </>
  );
}
