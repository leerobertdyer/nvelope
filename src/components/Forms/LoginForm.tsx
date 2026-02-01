import { useState, useRef, useEffect } from "react";
import {
  createUserEmailPass,
  loginWithEmailAndPassword,
  getSignInMethodsForEmail,
  sendPasswordResetEmailToUser,
} from "../../firebase/emailAndPassword";
import Button from "../Buttons/Button";
import { useAuth } from "../../Context/AuthContext/useAuth";

interface LoginError {
  code: string;
  message: string;
}

type ErrorType =
  | "wrong-password"
  | "no-account"
  | "email-in-use"
  | "reset-sent"
  | "reset-failed"
  | "generic";

export default function LoginForm() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
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

  function clearError() {
    setErrorType(null);
  }

  async function loginOrSignup() {
    setErrorType(null);
    if (!email.trim() || !password) {
      setErrorType("generic");
      return;
    }
    setIsLoading(true);
    try {
      const loggedInUser = await loginWithEmailAndPassword(email.trim(), password);
      if (loggedInUser) {
        setUser(loggedInUser);
      }
    } catch (error: unknown) {
      const code = (error as LoginError).code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
        const methods = await getSignInMethodsForEmail(email.trim());
        const hasPassword = methods.includes("password");
        if (hasPassword) {
          setErrorType("wrong-password");
          setIsLoading(false);
          return;
        }
        try {
          const newUser = await createUserEmailPass(email.trim(), password);
          if (newUser) {
            setUser(newUser);
          }
        } catch (signupError: unknown) {
          const signupCode = (signupError as LoginError).code;
          setErrorType(signupCode === "auth/email-already-in-use" ? "email-in-use" : "generic");
        }
      } else {
        setErrorType("generic");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    const emailToUse = showForgotPassword ? forgotEmail.trim() : email.trim();
    if (!emailToUse) {
      setErrorType("generic");
      return;
    }
    setErrorType(null);
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmailToUser(emailToUse);
      setErrorType("reset-sent");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (err: unknown) {
      console.error("Password reset failed:", err);
      setErrorType("reset-failed");
    } finally {
      setIsSendingReset(false);
    }
  }

  function getErrorMessage(): string | null {
    if (!errorType) return null;
    switch (errorType) {
      case "wrong-password":
        return "Wrong password. Check your password or use Forgot password below.";
      case "no-account":
        return "No account found with this email.";
      case "email-in-use":
        return "An account with this email already exists. Sign in with your password or use Forgot password.";
      case "reset-sent":
        return "If an account exists for this email, check your inbox and spam folder for the reset link.";
      case "reset-failed":
        return "Could not send reset email. Check the email address and try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  const message = getErrorMessage();
  const isSuccess = errorType === "reset-sent";

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
      <div
        ref={forgotSectionRef}
        className="flex flex-col justify-center items-center gap-6 w-full"
        hidden={!showForgotPassword}
      >
        <input
          ref={forgotEmailInputRef}
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="Email for reset link"
          value={forgotEmail}
          onChange={(e) => {
            setForgotEmail(e.target.value);
            clearError();
          }}
          className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <div className="flex flex-col items-center gap-2 w-[80%] max-w-[20rem]">
          <Button
            type="submit"
            color="red"
            onClick={() => {}}
            disabled={isSendingReset || !forgotEmail.trim()}
          >
            {isSendingReset ? "Sending…" : "Send reset link"}
          </Button>
          <button
            type="button"
            className="text-sm text-my-white-dark underline hover:no-underline"
            onClick={() => {
              setShowForgotPassword(false);
              setForgotEmail("");
              clearError();
            }}
          >
            Back to login
          </button>
        </div>
      </div>

      {/* Login section – kept in DOM when hidden; inert set via ref */}
      <div
        ref={loginSectionRef}
        className="flex flex-col justify-center items-center gap-6 w-full"
        hidden={showForgotPassword}
      >
        <input
          ref={loginEmailInputRef}
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
        />
        <Button
          type="submit"
          color="red"
          onClick={() => {}}
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Login / Sign up"}
        </Button>
        <button
          type="button"
          className="text-sm text-my-white-dark underline hover:no-underline"
          onClick={() => {
            setShowForgotPassword(true);
            setForgotEmail(email);
            clearError();
          }}
        >
          Forgot password?
        </button>
      </div>

      {message && (
        <p
          className={`text-center text-sm w-[80%] max-w-[20rem] ${
            isSuccess ? "text-green-400" : "text-my-red-dark"
          }`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
