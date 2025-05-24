import { useContext } from "react";
import { UserDataContext } from "../UserDataContext/UserDataContext";

export const useUserData = () => useContext(UserDataContext)