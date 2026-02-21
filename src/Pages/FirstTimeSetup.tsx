import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { createFirstBudget, completeDemoWithDefaults } from "../firebase/budgets";
import { editPayDate, editPayPeriodInterval, editIsNewUser } from "../firebase/editData";
import { useNavigate } from "react-router-dom";
import { useToast } from "../Context/ToastContext/useToast";
import Header from "../components/Nav/Header";
import Button from "../components/Buttons/Button";
import PayDateCalendar from "../components/Forms/PayDateCalendar";
import IntervalSelector from "../components/Forms/IntervalSelector";
import type { Interval } from "../types";
import { MONTHLY } from "../constants";

export default function FirstTimeSetup() {
  const { user } = useAuth();
  const { setActiveBudgetId, refetchBudgets } = useBudget();
  const {
    setPayDate,
    setPayPeriodInterval,
    setIsNewUser,
    setDocumentExists,
  } = useDatabase();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [payDateValue, setPayDateValue] = useState<Value>(null);
  const [interval, setInterval] = useState<Interval | null>(MONTHLY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSkip() {
    if (!user) return;
    setIsSubmitting(true);
    const ok = await completeDemoWithDefaults(user);
    if (!ok) {
      showToast("Could not continue. Please try again.", "error");
      setIsSubmitting(false);
      return;
    }
    const now = new Date();
    const defaultPayDate = new Date(now.getFullYear(), now.getMonth(), 1);
    setPayDate(Timestamp.fromDate(defaultPayDate));
    setPayPeriodInterval(MONTHLY);
    setIsNewUser(false);
    setDocumentExists(true);
    await refetchBudgets();
    setIsSubmitting(false);
    navigate("/");
  }

  async function handleSubmit() {
    if (!user) return;
    const date = Array.isArray(payDateValue) ? payDateValue[0] : payDateValue;
    if (!date || !(date instanceof Date) || !interval) {
      showToast("Please select your last pay date and how often you're paid.", "error");
      return;
    }
    setIsSubmitting(true);
    const budgetId = await createFirstBudget(user);
    if (!budgetId) {
      showToast("Could not create account. Please try again.", "error");
      setIsSubmitting(false);
      return;
    }
    try {
      await editPayDate(date, budgetId);
      await editPayPeriodInterval(interval, budgetId);
      await editIsNewUser(false, budgetId);
    } catch (e) {
      console.error("FirstTimeSetup save failed:", e);
      showToast("Something went wrong. Please try again.", "error");
      setIsSubmitting(false);
      return;
    }
    setActiveBudgetId(budgetId);
    setPayDate(Timestamp.fromDate(date));
    setPayPeriodInterval(interval);
    setIsNewUser(false);
    setDocumentExists(true);
    refetchBudgets();
    setIsSubmitting(false);
    navigate("/");
  }

  return (
    <div className="absolute inset-0 z-9990 flex flex-col bg-my-black-dark text-my-white-light">
      {user && <Header links={[]} />}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-center text-lg sm:text-xl">
          When was your last pay date?
        </h2>
        <p className="text-center text-sm text-my-white-dark">
          (Or when do you want to start budgeting from?)
        </p>
        <PayDateCalendar
          value={payDateValue instanceof Date ? payDateValue : null}
          onChange={setPayDateValue}
          label=""
          maxDate={new Date()}
        />
        <h3 className="text-center text-base sm:text-lg">
          How often are you paid?
        </h3>
        <p className="text-center text-sm text-my-white-dark">
          (Or how often do you want to budget?)
        </p>
        <IntervalSelector
          value={interval}
          onChange={(v) => setInterval(v)}
          label=""
        />
        <div className="flex flex-col gap-3 pt-4">
          <Button
            color="green"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting up…" : "Continue"}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-sm text-my-white-dark hover:text-my-white-light underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
