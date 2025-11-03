import LoginForm from "./Forms/LoginForm";
import LoginProvider from "./LoginProvider";

export default function LoginOptions() {
  return (
    <div className="w-[20rem] h-[20rem] p-8 rounded-md bg-my-black-base border-2 border-my-white-dark flex flex-col justify-center items-center gap-6">
      <LoginProvider src="/images/googleIcon.png" text="Sign in with Google" />
      <LoginForm />
    </div>
  )
}