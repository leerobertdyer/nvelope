import type { Timestamp } from "firebase/firestore";
import { UserDataContext } from "./UserDataContext";
import { useState } from "react";

export default function UserProvider({ children }: { children: React.ReactNode }) {
    const [startDate, setStartDate] = useState<Timestamp | null>(null);
    const [interval, setInterval] = useState<string>("");
    
    const value = {
        startDate,
        setStartDate,
        interval,
        setInterval
    };

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
}