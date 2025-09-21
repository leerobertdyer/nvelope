import { useContext } from "react";
import { DatabaseContext } from "./DatabaseContext";

export const useDatabase = () => {
    const ctx = useContext(DatabaseContext)
    if (!ctx) throw new Error("useDatabase must be inside a DatabaseProvider")
    return ctx
}