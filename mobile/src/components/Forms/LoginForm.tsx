import { useState, useRef, useEffect } from "react";
import {
  createUserEmailPass,
  loginWithEmailAndPassword,
  sendPasswordResetEmailToUser,
} from "../../firebase/emailAndPassword";
import Button from "../../../../mobile/src/components/Buttons/Btn";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { useAuth } from "../../context/AuthContext/useAuth";
import Btn from "../../../../mobile/src/components/Buttons/Btn";
import { View } from "react-native";
import Input from "../Input";
// import { useToast } from "../../Context/ToastContext/useToast";

interface LoginError {
  code: string;
  message: string;
}

export default function LoginForm() {
  const { isNewUser } = useDatabase();
  const { setUser } = useAuth();
  // const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const forgotEmailInputRef = useRef<HTMLInputElement>(null);
  const loginEmailInputRef = useRef<HTMLInputElement>(null);
  const loginSectionRef = useRef<HTMLDivElement>(null);
  const forgotSectionRef = useRef<HTMLDivElement>(null);

  // Move focus when switching views so the focused element is never inside a hidden section
  useEffect(() => {
    if (showForgotPassword) {
      forgotEmailInputRef.current?.focus();
    } else {
      loginEmailInputRef.current?.focus();
    }
  }, [showForgotPassword]);

  // Set inert on hidden section (prevents focus, avoids aria-hidden-on-focused-element warning)
  useEffect(() => {
    const loginEl = loginSectionRef.current;
    const forgotEl = forgotSectionRef.current;
    if (loginEl) {
      if (showForgotPassword) loginEl.setAttribute("inert", "");
      else loginEl.removeAttribute("inert");
    }
    if (forgotEl) {
      if (!showForgotPassword) forgotEl.setAttribute("inert", "");
      else forgotEl.removeAttribute("inert");
    }
  }, [showForgotPassword]);

  async function loginOrSignup() {
    if (!email.trim() || !password) {
      // showToast("Please enter email and password", "error");
      console.warn("TODO: Notifications");
      return;
    }
    setIsLoading(true);
    try {
      const loggedInUser = await loginWithEmailAndPassword(
        email.trim(),
        password,
      );
      if (loggedInUser) {
        setUser(loggedInUser);
        if (!isNewUser) {
          // showToast("Welcome back");
          console.warn("TODO: Notifications");
        }
      }
    } catch (error: unknown) {
      const code = (error as LoginError).code;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found"
      ) {
        try {
          const newUser = await createUserEmailPass(email.trim(), password);
          if (newUser) {
            setUser(newUser);
            // showToast("Welcome back");
            console.warn("TODO: Notifications");
          }
        } catch (signupError: unknown) {
          const signupCode = (signupError as LoginError).code;
          // showToast(
          //   signupCode === "auth/email-already-in-use"
          //     ? "An account with this email already exists. Sign in with your password or use Forgot password."
          //     : "Something went wrong. Please try again.",
          //   "error",
          // );
          console.warn("TODO: Notifications");
        }
      } else {
        // showToast("Something went wrong. Please try again.", "error");
        console.warn("TODO: Notifications");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    const emailToUse = showForgotPassword ? forgotEmail.trim() : email.trim();
    if (!emailToUse) {
      // showToast("Please enter an email address", "error");
      console.warn("TODO: Notifications");

      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmailToUser(emailToUse);
      // showToast(
      //   "If an account exists for this email, check your inbox and spam folder for the reset link.",
      // );
      console.warn("TODO: Notifications");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (err: unknown) {
      console.error("Password reset failed:", err);
      // showToast(
      //   "Could not send reset email. Check the email address and try again.",
      //   "error",
      // );
      console.warn("TODO: Notifications");
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <form
      className="w-full h-full flex flex-col justify-center items-center gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (showForgotPassword) handleForgotPassword();
        else loginOrSignup();
      }}
    >
      {/* Forgot password section – kept in DOM when hidden; inert set via ref */}
      <View
        // ref={forgotSectionRef}
        className="flex flex-col justify-center items-center gap-6 w-full"
        // hidden={!showForgotPassword}
      >
        <Input
          // ref={forgotEmailInputRef}
          id="forgot-email"
          placeholder="Email for reset link"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e)}
          // className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <View className="flex flex-col items-center gap-2 w-[80%] max-w-[20rem]">
          <Btn
            type="submit"
            color="red"
            onPress={() => {
              console.error("You haven't set it up yet dum dum");
            }}
            disabled={isSendingReset || !forgotEmail.trim()}
          >
            {isSendingReset ? "Sending…" : "Send reset link"}
          </Btn>
          <View className="text-sm text-my-white-dark underline hover:no-underline">
            <Btn
              color="green"
              onPress={() => {
                setShowForgotPassword(false);
                setForgotEmail("");
              }}
            >
              Back to login
            </Btn>
          </View>
        </View>
      </View>

      {/* Login section – kept in DOM when hidden; inert set via ref */}
      <View
        // ref={loginSectionRef}
        className="flex flex-col justify-center items-center gap-6 w-full"
        // hidden={showForgotPassword}
      >
        <Input
          // ref={loginEmailInputRef}
          id="login-email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e)}
          // className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <Input
          id="login-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e)}
          // className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <Button
          type="submit"
          color="red"
          onPress={loginOrSignup}
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Login / Sign up"}
        </Button>
        <View className="text-sm text-my-white-dark underline hover:no-underline">
          <Btn
            color="red"
            onPress={() => {
              setShowForgotPassword(true);
              setForgotEmail(email);
            }}
          >
            Forgot password?
          </Btn>
        </View>
      </View>
    </form>
  );
}
