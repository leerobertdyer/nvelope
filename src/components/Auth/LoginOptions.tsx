import LoginForm from "../Forms/LoginForm";
import LoginProvider from "./LoginProvider";
import googleIcon from "../../assets/googleIcon.png";
import { View } from "react-native";

export default function LoginOptions() {
  return (
    <View className="w-full p-8 bg-my-black-base justify-center items-center gap-6">
      <LoginProvider src={googleIcon} text="Sign in with Google" />
      <LoginForm />
    </View>
  );
}
