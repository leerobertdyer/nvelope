import Button from "../components/Buttons/Button";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import {
  editPayments,
  editIncome,
  editPayPeriodInterval,
  editIsNewUser,
  editPayDate,
  editTotalSpendingBudget,
} from "../firebase/editData";
import { createFirstBudget, completeDemoWithDefaults } from "../firebase/budgets";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useEffect, useState, useRef } from "react";
import Calendar from "react-calendar";
import Header from "../components/Nav/Header";
import "react-calendar/dist/Calendar.css";
import DemoStep from "../components/Demo/DemoStep";
import type { Payment, Interval } from "../types";
import { IoIosSad } from "react-icons/io";
import ActionButtons from "../components/Buttons/ActionButtons";
import SpotlightOverlay from "../components/Demo/SpotlightOverlay";
import { Timestamp } from "firebase/firestore";
import SpendBtn from "../components/Buttons/SpendBtn";
import {
  getIncomeByInterval,
  isDateInCurrentPayPeriod,
  recalculateBudget,
  transformIntervalMidSentence,
} from "../util";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { BIWEEKLY, MONTHLY, SPLIT, WEEKLY, YEARLY } from "../constants";
import IntervalSelector from "../components/Forms/IntervalSelector";
import PayDateCalendar from "../components/Forms/PayDateCalendar";
import PaymentTypeSelector, {
  type PaymentTypeOption,
} from "../components/Forms/PaymentTypeSelector";
import { useToast } from "../Context/ToastContext/useToast";
import DemoTooltip from "../components/Demo/DemoTooltip";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Demo() {
  const {
    isNewUser,
    setIsNewUser,
    payDate,
    setPayDate,
    income,
    setIncome,
    payPeriodInterval,
    setPayPeriodInterval,
    payments,
    setPayments,
    setEnvelopes,
    setTotalSpendingBudget,
    totalSpendingBudget,
    documentExists,
    setDocumentExists,
  } = useDatabase();
  const { user } = useAuth();
  const { activeBudgetId, setActiveBudgetId, refetchBudgets } = useBudget();
  const [createdBudgetId, setCreatedBudgetId] = useState<string | null>(null);
  const budgetId = createdBudgetId ?? activeBudgetId;

  const [step, setStep] = useState(0);
  const [newPayDate, setNewPayDate] = useState<Value | null>(null);
  const [newIncome, setNewIncome] = useState<number | null>(null);
  const [newInterval, setNewInterval] = useState<string | null>(null);
  const [newPayments, setNewPayments] = useState<Payment[]>([]);
  const [newPaymentName, setNewPaymentName] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | null>(null);
  const [newPaymentDueDate, setNewPaymentDueDate] = useState<Date | null>(null);
  const [newPaymentTotal, setNewPaymentTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment type selection for step 7
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentTypeOption | null>(null);
  const [newPaymentInterval, setNewPaymentInterval] =
    useState<Interval>(MONTHLY);
  const [splitBillAcrossPayPeriods, setSplitBillAcrossPayPeriods] =
    useState(false);

  // Refs for steps 10-14 button spotlight
  const paymentBtnRef = useRef<HTMLDivElement>(null);
  const envelopeBtnRef = useRef<HTMLDivElement>(null);
  const cashBtnRef = useRef<HTMLDivElement>(null);
  const clearBtnRef = useRef<HTMLDivElement>(null);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const { showToast } = useToast();

  // Update spotlight when step changes (for steps 10-13)
  useEffect(() => {
    if (step < 10 || step > 13) {
      setSpotlightRect(null);
      return;
    }

    const updateRect = () => {
      const ref =
        step === 10
          ? paymentBtnRef
          : step === 11
            ? cashBtnRef
            : step === 12
              ? envelopeBtnRef
              : clearBtnRef;
      if (ref.current) {
        setSpotlightRect(ref.current.getBoundingClientRect());
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(updateRect, 100);
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [step]);
  const navigate = useNavigate();

  useEffect(() => {
    // Give firebase time to load user data
    // That way if there is already a startDate but user has not finished remaining steps
    // We allow them to start where left off
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  }, []);

  function handlePaymentCalendarChange(value: Value) {
    if (value instanceof Date) {
      setNewPaymentDueDate(value);
    }
  }

  async function handleAddNewPayment() {
    if (!newPaymentName || !newPaymentAmount || !selectedPaymentType) {
      showToast("Please fill out all fields", "error");
      return;
    }

    // Check if name is already used
    if (newPayments.some((p) => p.name === newPaymentName)) {
      showToast("Payment name already exists", "error");
      return;
    }

    // For FUND, due date is required (target date)
    if (selectedPaymentType === "FUND" && !newPaymentDueDate) {
      showToast("Please select a target date", "error");
      return;
    }

    const dueDate = newPaymentDueDate || new Date();
    if (!payDate) return;

    // Determine interval based on type and split toggle
    const interval: Interval =
      selectedPaymentType === "FUND"
        ? SPLIT
        : selectedPaymentType === "BILL" && splitBillAcrossPayPeriods
          ? SPLIT
          : newPaymentInterval;

    // Build payment with common base, type-specific additions via ternary
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      name: newPaymentName,
      amount: newPaymentAmount,
      dueDate: Timestamp.fromDate(dueDate),
      paid: false,
      interval,
      type: selectedPaymentType,
      // Type-specific fields
      ...(selectedPaymentType === "DEBT" && {
        total: newPaymentTotal || newPaymentAmount,
      }),
      ...(selectedPaymentType === "FUND" && {
        total: newPaymentAmount,
        recurring: false,
      }),
      ...(selectedPaymentType === "BILL" &&
        splitBillAcrossPayPeriods && { recurring: true }),
    };

    const updatedPayments = [...newPayments, newPayment];
    if (!budgetId) return;
    await editPayments(updatedPayments, budgetId);

    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount: isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate?.toDate(),
        dueDate,
      )
        ? newPaymentAmount
        : 0,
    });
    await editTotalSpendingBudget(nextBudget, budgetId);
    setTotalSpendingBudget(nextBudget);
    setNewPayments(updatedPayments);
    setPayments(updatedPayments);

    // Reset form
    setNewPaymentName("");
    setNewPaymentAmount(0);
    setNewPaymentTotal(null);
    setNewPaymentDueDate(null);
    showToast("Payment added!", "success");
  }

  async function handleClickAddPayment() {
    handleAddNewPayment();
  }

  function resetPaymentForm() {
    setNewPaymentName("");
    setNewPaymentAmount(null);
    setNewPaymentTotal(null);
    setNewPaymentDueDate(null);
    setSelectedPaymentType(null);
    setNewPaymentInterval(MONTHLY);
    setSplitBillAcrossPayPeriods(false);
  }

  async function handleSkipPayments() {
    // Just move to the next step without adding any payments
    setStep(8);
  }

  /** Skip the entire demo and land on main view with safe defaults (no blank screen). */
  async function handleSkipDemo() {
    if (!user) return;
    const ok = await completeDemoWithDefaults(user);
    if (!ok) {
      showToast("Could not skip. Please try again.", "error");
      return;
    }
    // Sync context so MainView has payDate, interval, etc. (avoids blank blue screen)
    const now = new Date();
    const defaultPayDate = new Date(now.getFullYear(), now.getMonth(), 1);
    setPayDate(Timestamp.fromDate(defaultPayDate));
    setPayPeriodInterval(MONTHLY);
    setIncome(0);
    setTotalSpendingBudget(0);
    setPayments([]);
    setEnvelopes([]);
    setIsNewUser(false);
    setDocumentExists(true);
    navigate("/");
  }

  async function handleStep1() {
    if (documentExists === false && user) {
      const newBudgetId = await createFirstBudget(user);
      if (newBudgetId) {
        setCreatedBudgetId(newBudgetId);
        setActiveBudgetId(newBudgetId);
        refetchBudgets();
        setDocumentExists(true);
      } else {
        console.error("[DEMO] Failed to create budget");
        showToast("Could not create account. Please try again.", "error");
        return;
      }
    }

    if (payDate) {
      setNewPayDate(payDate.toDate());
      if (payPeriodInterval) {
        setNewInterval(payPeriodInterval);
        setStep(4);
      } else {
        setStep(3);
      }
    } else {
      setStep(2);
    }
  }

  async function handleStep2() {
    if (!newPayDate || Array.isArray(newPayDate) || !budgetId) return;
    await editPayDate(newPayDate, budgetId);
    if (newPayDate instanceof Date) {
      setPayDate(Timestamp.fromDate(newPayDate));
    }
    setStep(3);
  }

  async function handleStep3() {
    if ((!newInterval && !payPeriodInterval) || !budgetId) return;
    const newIncomeAmount = getIncomeByInterval(
      payPeriodInterval,
      newInterval as Interval,
      income,
    );
    await editPayPeriodInterval(newInterval as Interval, budgetId);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: newIncomeAmount,
      diffAmount: 0,
    });
    await editTotalSpendingBudget(nextBudget, budgetId);
    setTotalSpendingBudget(nextBudget);
    // TODO: FIX THIS
    // setInterval(newInterval as Interval)
    setStep(4);
  }

  function handleStep4() {
    if (income) {
      setStep(6);
    } else {
      if (newIncome) {
        setIncome(newIncome);
      }
      setStep(5);
    }
  }

  async function handleStep5() {
    if (!newIncome || !budgetId) return;
    const diffAmount = newIncome - income;
    await editIncome(newIncome, budgetId);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, budgetId);
    setTotalSpendingBudget(nextBudget);
    setIncome(newIncome);
    setStep(6);
  }

  function handleStep6() {
    if (payments && payments.length > 0) {
      setStep(8);
    } else {
      if (newPayments) {
        setPayments(newPayments);
      }
      setStep(7);
    }
  }

  async function handleStep7() {
    if (!newPayments || !budgetId) return;
    const diffAmount = newPayments.reduce((acc, p) => acc + p.amount, 0) * -1;
    await editPayments(newPayments, budgetId);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, budgetId);
    setTotalSpendingBudget(nextBudget);
    setPayments(newPayments);
    setStep(8);
  }

  function handleStep8() {
    setStep(9);
  }

  function handleStep9() {
    // Don't set isNewUser to false yet - continue the demo walkthrough
    setStep(10);
  }

  function handleStep10() {
    setStep(11);
  }

  function handleStep11() {
    setStep(12);
  }

  function handleStep12() {
    setStep(13);
  }

  function handleStep13() {
    setStep(14);
  }

  async function handleStep14() {
    if (!budgetId) return;
    await editIsNewUser(false, budgetId);
    setIsNewUser(false);
    navigate("/");
  }

  if (isLoading) {
    return <Loading text="Loading Demo..." />;
  }

  return (
    <div className="absolute inset-0 z-9990">
      {user && <Header links={[]} step={step} />}
      {step >= 2 && step <= 9 && (
        <button
          type="button"
          onClick={handleSkipDemo}
          className="fixed bottom-6 left-0 right-0 z-[9999] text-sm text-my-white-dark hover:text-my-white-light underline"
        >
          Skip demo
        </button>
      )}
      <div
        className={`absolute z-9999 left-0 right-0 bottom-0 
            ${step > 1 ? "top-[4rem] h-[90vh]" : "top-0 h-screen"}
            bg-my-black-dark text-center 
            flex flex-col items-center justify-around`}
      >
        {/* Show start button for new users (no document) or users still in onboarding */}
        {(documentExists === false || isNewUser) && step === 0 ? (
          <div className="flex flex-col items-center gap-6">
            <SpendBtn onClick={() => setStep(1)} />
            <button
              type="button"
              onClick={handleSkipDemo}
              className="text-sm text-my-white-dark hover:text-my-white-light underline"
            >
              Skip demo
            </button>
          </div>
        ) : step == 1 ? (
          <>
            <div className="absolute inset-0 bg-my-black-dark opacity-80"></div>
            <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center text-white">
              <h3>Let's get you set up first...</h3>
              <Button
                color="green"
                onClick={handleStep1}
                children="New Account"
              />
              <button
                type="button"
                onClick={handleSkipDemo}
                className="text-sm text-my-white-dark hover:text-my-white-light underline mt-2"
              >
                Skip demo
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <DemoStep
            onClick={handleStep2}
            text="Save Pay Date"
            changeValue={newPayDate}
          >
            <h3 className="text-sm sm:text-lg p-2">
              Here are days remaining til your next paycheck
            </h3>
            <p className="text-sm sm:text-lg">
              Speaking of which, when was{" "}
              <span className="text-my-green-base">your last paycheck?</span>
            </p>
            <PayDateCalendar
              value={newPayDate instanceof Date ? newPayDate : null}
              onChange={setNewPayDate}
              label=""
              maxDate={new Date()}
            />
          </DemoStep>
        ) : step === 3 ? (
          <DemoStep
            onClick={handleStep3}
            text="Save Schedule"
            changeValue={newInterval}
          >
            <h3 className="text-sm sm:text-lg p-2">
              And how often are you{" "}
              <span className="text-my-green-base">paid?</span>
            </h3>
            <p className="text-sm">
              (Or how often do you want to{" "}
              <span className="text-my-blue-light">budget?</span>)
            </p>
            <p className="text-sm">
              Note: If you are paid bi-weekly but want to budget weekly, no
              problem!
            </p>
            <IntervalSelector
              value={newInterval as Interval}
              onChange={(interval) => setNewInterval(interval ?? null)}
              label=""
            />
          </DemoStep>
        ) : step === 4 ? (
          <DemoStep onClick={handleStep4} text="Next" changeValue={true}>
            <h3 className="text-sm sm:text-lg p-2">
              This is your budget until your next{" "}
              <span className="text-my-green-light">paycheck</span>
            </h3>
            <p className="text-sm sm:text-lg">
              It shows <span className="text-my-green-light">$$$</span>{" "}
              available for{" "}
              <span className="text-my-green-light">Nvelopes</span> or{" "}
              <span className="text-my-red-light">Payments</span>.
            </p>
            <p className="text-sm sm:text-lg">
              You can click on it to manually edit the budget.
            </p>
          </DemoStep>
        ) : step === 5 ? (
          <DemoStep
            onClick={handleStep5}
            text="Save Income"
            changeValue={newIncome}
          >
            <h3 className="text-sm sm:text-lg p-2">
              Now, how much do you make every{" "}
              {transformIntervalMidSentence(newInterval as Interval)}?
            </h3>
            <p className="text-sm sm:text-lg italic">
              Include all household income {" "}
              <span className="text-my-red-light">before expenses.</span>
            </p>
            <p className="text-sm sm:text-lg">
              You will have the ability to add more income later. This is best for recurring income.
            </p>
            <p className="text-sm sm:text-lg">If your income changes week to week, estimate as best you can.</p>
            <input
              className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem]"
              type="number"
              placeholder="Estimated Income"
              value={newIncome?.toString() || ""}
              onChange={(e) => setNewIncome(Number(e.target.value))}
            />
          </DemoStep>
        ) : step === 6 ? (
          <DemoStep onClick={handleStep6} text="Next" changeValue={true}>
            <h3 className="text-sm sm:text-lg p-2">
              Time for the final and most exciting step
            </h3>
            <p className="text-sm sm:text-lg">
              Let's add your{" "}
              <span className="text-my-red-light">
                payments <IoIosSad className="inline" size={30} />
              </span>
            </p>
          </DemoStep>
        ) : step === 7 ? (
          <DemoStep
            onClick={handleStep7}
            text="Save Payments"
            changeValue={newPayments}
          >
            {/* Payment Type Selection */}
            {!selectedPaymentType ? (
              <PaymentTypeSelector
                onSelect={setSelectedPaymentType}
                onSkip={handleSkipPayments}
              />
            ) : (
              /* Payment Form based on type */
              <form className="flex flex-col gap-2 w-full items-center">
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="text-xs text-my-white-dark underline mb-2"
                >
                  ← Change payment type
                </button>

                <p className="text-sm text-my-green-light mb-2">
                  Adding: {selectedPaymentType}
                </p>

                <input
                  className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center"
                  type="text"
                  placeholder="Payment Name"
                  value={newPaymentName}
                  onChange={(e) =>
                    setNewPaymentName(e.target.value.toLowerCase())
                  }
                />
                <input
                  className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center"
                  type="number"
                  placeholder={
                    selectedPaymentType === "FUND" ? "Target Amount" : "Amount"
                  }
                  value={newPaymentAmount || ""}
                  onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                />

                {/* Show total field for DEBT type */}
                {selectedPaymentType === "DEBT" && (
                  <input
                    className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center"
                    type="number"
                    placeholder="Total Balance Owed"
                    value={newPaymentTotal || ""}
                    onChange={(e) => setNewPaymentTotal(Number(e.target.value))}
                  />
                )}

                {/* Interval selector for BILL and DEBT (not FUND) */}
                {(selectedPaymentType === "BILL" ||
                  selectedPaymentType === "DEBT") &&
                  !splitBillAcrossPayPeriods && (
                    <div className="flex flex-col items-center w-full">
                      <p className="text-my-white-dark text-sm mb-1">
                        Payment Frequency
                      </p>
                      <select
                        value={newPaymentInterval || ""}
                        onChange={(e) =>
                          setNewPaymentInterval(e.target.value as Interval)
                        }
                        className="w-[80%] max-w-[30rem] border-2 p-2 rounded-md bg-white text-black text-center"
                      >
                        <option value={MONTHLY}>Monthly</option>
                        <option value={WEEKLY}>Weekly</option>
                        <option value={BIWEEKLY}>Bi-Weekly</option>
                        <option value={YEARLY}>Yearly</option>
                      </select>
                    </div>
                  )}

                {/* Split toggle for BILL type only */}
                {selectedPaymentType === "BILL" && (
                  <div className="flex items-center gap-3 my-2">
                    <label
                      htmlFor="splitToggle"
                      className="text-sm text-my-white-dark cursor-pointer"
                    >
                      Split across pay periods (rent, mortgage)
                    </label>
                    <input
                      id="splitToggle"
                      type="checkbox"
                      checked={splitBillAcrossPayPeriods}
                      onChange={(e) =>
                        setSplitBillAcrossPayPeriods(e.target.checked)
                      }
                      className="w-5 h-5 cursor-pointer accent-my-green-light"
                    />
                  </div>
                )}

                {/* Show calendar for due date (required for FUND) */}
                <div className="text-black">
                  <p className="text-my-white-dark text-sm mb-1">
                    {selectedPaymentType === "FUND"
                      ? "Target Date (when you need the money)"
                      : "Due Date (day of month)"}
                  </p>
                  <Calendar
                    calendarType="gregory"
                    onChange={handlePaymentCalendarChange}
                    value={newPaymentDueDate || new Date()}
                    selectRange={false}
                    className="cursor-pointer-calendar"
                    minDate={
                      selectedPaymentType === "FUND" ? new Date() : undefined
                    }
                  />
                </div>

                <Button
                  onClick={handleClickAddPayment}
                  color="green"
                  children="Add Payment"
                />
              </form>
            )}

            {/* List of added payments */}
            {newPayments.length > 0 && (
              <div className="flex flex-col gap-2 mt-4 w-full max-w-[30rem]">
                <p className="text-sm text-my-white-dark">Added payments:</p>
                {newPayments.map((p, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-my-black-base p-2 rounded"
                  >
                    <span>{p.name}</span>
                    <span className="text-my-green-light">${p.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </DemoStep>
        ) : step === 8 ? (
          <DemoStep onClick={handleStep8} text="Next" changeValue={true}>
            <h3 className="text-xs sm:text-lg">
              Note the balance will change according to your <span className="text-my-red-light">payments</span>
            </h3>
            <p className="text-xs sm:text-lg">
              This is the amount you have left until your next{" "}
              <span className="text-my-green-light">paycheck</span>
            </p>
            <p className="text-xs sm:text-lg">
              And takes into account the{" "}
              <span className="text-my-white-dark">pay period</span> you
              selected earlier.
            </p>
          </DemoStep>
        ) : step === 9 ? (
          <DemoStep
            onClick={handleStep9}
            text="Continue Tour"
            changeValue={true}
          >
            <p className="text-sm sm:text-lg">
              Let's quickly see how the main buttons work...
            </p>
          </DemoStep>
        ) : step >= 10 && step <= 14 ? (
          /* Steps 10-14: Main button walkthrough */
          <div className="absolute inset-0 bg-my-white-dark/90 flex flex-col items-center z-[9900]">
            {spotlightRect && <SpotlightOverlay targetRect={spotlightRect} />}

            {/* Action buttons bar */}
            <ActionButtons
              paymentRef={paymentBtnRef}
              cashRef={cashBtnRef}
              envelopeRef={envelopeBtnRef}
              clearRef={clearBtnRef}
              highlightPayment={step === 10}
              highlightCash={step === 11}
              highlightEnvelope={step === 12}
              highlightClear={step === 13}
              disableHover
              className="py-6"
            />

            {/* Tooltip content - centered below buttons */}
            <div className="flex-1 flex items-start justify-center pt-8">
              {step === 10 && (
                <DemoTooltip onNext={handleStep10}>
                  <h3 className="text-lg font-bold text-my-red-light">
                    Payment Button
                  </h3>
                  <p className="text-sm text-my-white-light">
                    Add recurring{" "}
                    <span className="text-my-red-light">bills</span>,{" "}
                    <span className="text-my-blue-light">debts</span>, or{" "}
                    <span className="text-my-green-light">split payments</span>
                  </p>
                  <p className="text-xs text-my-white-dark">
                    Fixed expenses that come out of each paycheck.
                  </p>
                </DemoTooltip>
              )}
              {step === 11 && (
                <DemoTooltip onNext={handleStep11}>
                  <h3 className="text-lg font-bold text-my-green-light">
                    Get Paid
                  </h3>
                  <p className="text-sm text-my-white-light">
                    Add <span className="text-my-green-light">income</span> when
                    you receive money
                  </p>
                  <p className="text-xs text-my-white-dark">
                    Increases your available budget for the current period.
                  </p>
                </DemoTooltip>
              )}
              {step === 12 && (
                <DemoTooltip onNext={handleStep12}>
                  <h3 className="text-lg font-bold text-my-green-light">
                    New Envelope
                  </h3>
                  <p className="text-sm text-my-white-light">
                    Create{" "}
                    <span className="text-my-green-light">
                      spending envelopes
                    </span>{" "}
                    for flexible categories
                  </p>
                  <p className="text-xs text-my-white-dark">
                    Groceries, gas, entertainment - allocate money from your
                    budget.
                  </p>
                </DemoTooltip>
              )}
              {step === 13 && (
                <DemoTooltip onNext={handleStep13}>
                  <h3 className="text-lg font-bold text-my-red-light">
                    Clear Envelopes
                  </h3>
                  <p className="text-sm text-my-white-light">
                    <span className="text-my-red-light">Reset</span> all
                    envelope balances to zero
                  </p>
                  <p className="text-xs text-my-white-dark">
                    Use at the start of a new budget period.
                  </p>
                </DemoTooltip>
              )}
              {step === 14 && (
                <DemoTooltip
                  onNext={handleStep14}
                  buttonText="Start Using Nvelopes!"
                >
                  <h3 className="text-lg font-bold text-my-green-light">
                    You're ready! 🎉
                  </h3>
                  <p className="text-sm text-my-white-light">
                    You know everything to start budgeting with{" "}
                    <span className="text-my-red-light">Nvelopes</span>
                  </p>
                  <p className="text-xs text-my-white-dark">
                    Create envelopes, track spending, take control!
                  </p>
                </DemoTooltip>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
