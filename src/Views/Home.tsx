import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import LoginOptions from "../components/LoginOptions";
import Header from "../components/Header";
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
      {user &&<Header links={[
        { label: "Settings", href: "/settings" },
        { label: "Nvelopes", href: "/nvelopes" },
        { label: "Bills", href: "/bills" },
      ]} />}
      <div className="flex flex-col items-center justify-center h-full gap-4">
        {isLoading 
          ? <p className="text-center animate-pulse text-my-red-dark">Loading...</p>
          : user 
            ? <MainEnvelopesView />
            : <LoginOptions />}
      </div>
    </>
  );
}
