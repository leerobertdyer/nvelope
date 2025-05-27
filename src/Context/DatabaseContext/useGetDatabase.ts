import { useContext } from "react";
import { DatabaseContext } from "./DatabaseContext";

export const useGetDatabase = () => useContext(DatabaseContext)