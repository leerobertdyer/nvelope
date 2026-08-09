import LoginForm from "../Forms/LoginForm";
import LoginProvider from "./LoginProvider";
import googleIcon from "../../assets/googleIcon.png";

export default function LoginOptions() {
  return (
    <div className="w-[28rem] h-fit p-8 rounded-md bg-my-black-base border-2 border-my-white-dark flex flex-col justify-center items-center gap-6">
      <LoginProvider src={googleIcon} text="Sign in with Google" />
      <LoginForm />
    </div>
  )
}