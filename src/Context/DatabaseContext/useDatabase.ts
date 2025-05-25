import { useContext } from "react";
import { DatabaseContext } from "./DatabaseContext";

export const useDatabase = () => useContext(DatabaseContext)