import { useEffect, useState } from "react";
import SpendBtn from "../components/SpendBtn";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import Header from "../components/Header";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import Demo from "./Demo";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {isNewUser} = useGetDatabase();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [user]);

  if (user && isNewUser) {
    return <Demo />;
  }

  return (
    <>
      {user &&<Header />}
      <div className="flex flex-col items-center justify-center h-full gap-4">
        {isLoading 
          ? <p className="text-center animate-pulse text-my-red-dark">Loading...</p>
          : user 
            ? <SpendBtn onClick={() => navigate("/nvelopes?showSpendingPage=true")} /> 
            : <LoginOptions />}
      </div>
    </>
  );
}
