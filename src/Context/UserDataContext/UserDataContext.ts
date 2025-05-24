import { createContext } from "react";
import type { Timestamp } from 'firebase/firestore';


interface UserDataContextType {
    startDate: Timestamp | null
    setStartDate: (startDate: Timestamp | null) => void
    interval: string
    setInterval: (interval: string) => void
}

export const UserDataContext = createContext<UserDataContextType>({
    startDate: null,
    interval: "",
    setStartDate: () => {},
    setInterval: () => {}
});