import LoginForm from "./LoginForm";
import LoginProvider from "./LoginProvider";

export default function LoginOptions() {
  return (
    <div className="w-full h-[20rem] flex flex-col justify-center items-center gap-6">
      <LoginProvider src="/images/googleIcon.png" text="Sign in with Google" />
      <LoginForm />
    </div>
  )
}