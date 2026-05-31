import { useState } from "react";
import {
  createUserEmailPass,
  loginWithEmailAndPassword,
  sendPasswordResetEmailToUser,
} from "../../firebase/emailAndPassword";
import { View } from "react-native";
import Input from "../Input";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { useAuth } from "../../context/AuthContext/useAuth";
import Btn from "../Buttons/Btn";

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
    <View className="w-full h-fit p-4 flex flex-col justify-center items-center gap-6 bg-my-green-dark rounded-md">
      <View
        style={{ display: showForgotPassword ? "flex" : "none" }}
        className="flex flex-col justify-center items-center gap-6 w-full"
      >
        <Input
          id="forgot-email"
          placeholder="Email for reset link"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e)}
        />
        <View className="flex flex-col items-center gap-2 w-full">
          <Btn
            color="red"
            text={isSendingReset ? "Sending…" : "Send reset link"}
            onPress={() => {
              if (showForgotPassword) handleForgotPassword();
              else loginOrSignup();
            }}
            disabled={isSendingReset || !forgotEmail.trim()}
          />
          <View className="text-sm text-my-white-dark underline w-full">
            <Btn
              text="Back to login"
              color="green"
              onPress={() => {
                setShowForgotPassword(false);
                setForgotEmail("");
              }}
            />
          </View>
        </View>
      </View>

      <View
        style={{ display: !showForgotPassword ? "flex" : "none" }}
        className="flex flex-col justify-center items-center gap-4 w-full"
      >
        <Input
          id="login-email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e)}
        />
        <Input
          id="login-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e)}
        />
        <Btn
          color="gold"
          onPress={loginOrSignup}
          disabled={isLoading}
          text={isLoading ? "Signing in…" : "Login / Sign up"}
        />

        <View className="text-sm text-my-white-dark underline w-full">
          <Btn
            color="red"
            text="Forgot password?"
            onPress={() => {
              setShowForgotPassword(true);
              setForgotEmail(email);
            }}
          />
        </View>
      </View>
    </View>
  );
}
