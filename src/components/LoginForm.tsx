import { useState } from "react";
import { createUserEmailPass, loginWithEmailAndPassword } from "../firebase/emailAndPassword";
import Button from "./Button";
import { useAuth } from "../Context/AuthContext/useAuth";

interface LoginError {
    code: string;
    message: string;
}

export default function LoginForm() {
    const {setUser, user} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showError, setShowError] = useState(false);
        
    async function loginOrSignup() {
        setShowError(false);
        try {
          console.log('Attempting Login first for email:', email);
          const loggedInUser = await loginWithEmailAndPassword(email, password);
          if (loggedInUser) {
            console.log('Logged in successfully:', loggedInUser);
            setUser(loggedInUser);
          }
        } catch (error: unknown) {
          console.error('Error logging in:', error);
          if ((error as LoginError).code === "auth/user-not-found") {
            try {
              console.log('Attempting Signup for email:', email);
              const newUser = await createUserEmailPass(email, password);
              if (newUser) {
                console.log('Signed up successfully:', newUser);
                setUser(newUser);
              }
            } catch (signupError: LoginError | unknown) {
              console.error('Error signing up:', signupError);
            }
          } 
        }
        if (!user) {
            setShowError(true);
        }
      }
  return (
    <form className="w-full h-full flex flex-col justify-center items-center gap-6">
        <input 
            type="text" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <Button
            onClick={loginOrSignup}
            color={'red'}
        >
            Login/Sign Up
        </Button>
        {showError && <p className="text-my-red-dark">Please try again</p>}
    </form>
  )
}