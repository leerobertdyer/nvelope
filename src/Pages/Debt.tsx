import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import {
  applyPayoffSurplusToTarget,
  calculatePayoffDate,
  calculateSnowballPayoffDate,
  createTransactionId,
  getRemainingDebtsForSnowball,
  paymentsTotal,
  removeVirtualIdPortion,
  rollSnowballOnPayoff,
  setSnowballAmount,
  type SurplusDisposition,
} from "../util";
import {
  getSnowballAmount,
  getSnowballName,
  isSnowballPayment,
} from "../util/paymentUtils";
import Loading from "../components/Loading";
import type { Payment } from "../types";
import Header from "../components/Nav/Header";
import {
  addTransaction,
  editDatabaseWithTransaction,
  editIsNewUser,
  editPayments,
  editSnowballTargetPaymentId,
  editTotalSpendingBudget,
} from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useToast } from "../Context/ToastContext/useToast";
import { format, parse } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { IoChevronDown, IoChevronUp, IoWarning } from "react-icons/io5";
import PaymentForm from "../components/Forms/PaymentForm";
import FullScreen from "../Views/FullScreen";
import MoneyInput from "../components/MoneyInput";
import Button from "../components/Buttons/Button";
import CongratsPaidOffModal from "../components/Payments/CongratsPaidOffModal";
import PageTour from "../components/PageTour";

export default function Debt() {
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const { showToast } = useToast();
  const {
    payments,
    setPayments,
    payPeriodInterval,
    payDate,
    snowballTargetPaymentId,
    setSnowballTargetPaymentId,
    isNewUser,
    setIsNewUser,
    totalSpendingBudget,
    setTotalSpendingBudget,
  } = useDatabase();
  const { remainingDebt } = paymentsTotal(
    payments,
    payPeriodInterval,
    payDate ?? null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [debtsMissingInfo, setDebtsMissingInfo] = useState<Payment[]>([]);
  const [debts, setDebts] = useState<Payment[]>([]);
  const [paidOffDebts, setPaidOffDebts] = useState<Payment[]>([]);
  const [showMissingInfoDebts, setShowMissingInfoDebts] = useState(false);
  const [interestRate, setInterestRate] = useState<number>();
  const [editingDebt, setEditingDebt] = useState<Payment | null>(null);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [showEditSnowball, setShowEditSnowball] = useState(false);
  const [showSnowballTarget, setShowSnowballTarget] = useState(false);
  const [debtMenuOpen, setDebtMenuOpen] = useState<Payment | null>(null);
  const [payoffWarningDebtId, setPayoffWarningDebtId] = useState<
    string | null
  >(null);
  const [additionalPaymentDebt, setAdditionalPaymentDebt] =
    useState<Payment | null>(null);
  const [additionalPaymentAmount, setAdditionalPaymentAmount] = useState(0);
  const [pendingPayoff, setPendingPayoff] = useState<{
    paidOffPayment: Payment;
    paymentsAtPayoff: Payment[];
    /** Amount the payment exceeded the debt's remaining balance by, still awaiting a disposition. */
    remainder: number;
  } | null>(null);
  const [newSnowballAmount, setNewSnowballAmount] = useState(
    getSnowballAmount(payments),
  );

  // Keep the edit form's default in sync once payments load/change (e.g. after a roll).
  useEffect(() => {
    setNewSnowballAmount(getSnowballAmount(payments));
  }, [payments]);

  function debtHasAllValues(d: Payment) {
    return (
      typeof d.total === "number" &&
      typeof d.amount === "number" &&
      typeof d.interestRate === "number"
    );
  }

  const updatedPayOffDates = useRef(false);
  const previousEditingDebtRef = useRef<Payment | null>(null);

  const updateAllPayOffDatesIfNeeded = useCallback(async () => {
    if (!payments?.length || !user?.uid) return;

    let changed = false;

    const nextPayments = payments.map((p) => {
      if (p.type !== "DEBT") return p;

      const resp = calculatePayoffDate(p);
      if (!resp) return p;
      const { payOffDate, paymentsLeft } = resp;

      const next = payOffDate ? format(payOffDate, "MMM do, yyyy") : undefined;

      if (next !== p.payOffDate) changed = true;
      if (paymentsLeft !== p.paymentsLeft) changed = true;
      return { ...p, payOffDate: next, paymentsLeft };
    });

    if (!changed) return;
    setPayments(nextPayments);
    await editPayments(nextPayments, activeBudgetId!);
  }, [payments, user?.uid, setPayments]);

  useEffect(() => {
    if (updatedPayOffDates.current) return;
    if (!payments?.length || !user?.uid) return;

    updatedPayOffDates.current = true;
    updateAllPayOffDatesIfNeeded();
  }, [payments, user?.uid, updateAllPayOffDatesIfNeeded]);

  // When returning from edit form, recalc payoff dates so UI shows latest
  useEffect(() => {
    if (
      previousEditingDebtRef.current !== null &&
      editingDebt === null &&
      payments?.length &&
      user?.uid
    ) {
      updatedPayOffDates.current = false;
      updateAllPayOffDatesIfNeeded();
      updatedPayOffDates.current = true;
    }
    previousEditingDebtRef.current = editingDebt;
  }, [editingDebt, payments?.length, user?.uid, updateAllPayOffDatesIfNeeded]);

  useEffect(() => {
    const nextMissingInfo: Payment[] = [];
    const nextDebts: Payment[] = [];
    const nextPaidOff: Payment[] = [];

    for (const p of payments) {
      if (p.type === "DEBT") {
        if (isSnowballPayment(p)) continue;
        if (p.total != null && p.total <= 0 && p.originalTotal) {
          nextPaidOff.push(p);
          continue;
        }
        if (!debtHasAllValues(p)) {
          nextMissingInfo.push(p);
          continue;
        }

        nextDebts.push(p);
      }
    }

    setDebtsMissingInfo(nextMissingInfo);
    setDebts(nextDebts);
    setPaidOffDebts(nextPaidOff);
    setIsLoading(false);
  }, [payments]);

  async function saveDebtInformation(d: Payment) {
    const nextPayments = payments.map((p) => {
      if (p.id === d.id) return { ...d, interestRate: interestRate };
      return p;
    });
    await editPayments(nextPayments, activeBudgetId!);
    setInterestRate(undefined);
    showToast("Debt updated");
  }

  const effectiveSnowballTargetId =
    snowballTargetPaymentId &&
    debts.some((d) => d.id === snowballTargetPaymentId)
      ? snowballTargetPaymentId
      : debts.length > 0
        ? ([...debts].sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0]?.id ??
          null)
        : null;

  async function handleSnowballTargetChange(debtId: string) {
    if (!user) return;
    try {
      setSnowballTargetPaymentId(debtId);
      const debt = payments.find((p) => p.id === debtId);
      await editDatabaseWithTransaction({
        t: {
          id: createTransactionId(user),
          type: "SNOWBALL",
          createdAt: Timestamp.now(),
          nvelopeOrPaymentId: debt?.id,
          description: `Snowball target changed to ${debt?.name}`,
          createdBy: user.email ?? user.uid,
        },
        budgetId: activeBudgetId!,
        func: () => editSnowballTargetPaymentId(activeBudgetId!, debtId),
      });
      showToast("Snowball target updated");
      setShowSnowballTarget(false);
    } catch (error) {
      console.error(`There was an issue changing snowball targets: ${error}`);
      showToast(
        `There was an issue changing snowball targets: ${error}`,
        "error",
      );
    }
  }

  async function handleUpdateSnowball(n: number) {
    if (!user || !activeBudgetId) return;
    const newPayments = setSnowballAmount(payments, n, payDate);
    setPayments(newPayments);
    setNewSnowballAmount(n);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "SNOWBALL",
        createdAt: Timestamp.now(),
        amount: n,
        description: `Manually set snowball to $${n}`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId,
      func: () => editPayments(newPayments, activeBudgetId),
    });
    setShowEditSnowball(false);
    showToast("Snowball updated");
  }

  async function handleApplyAdditionalPayment() {
    const debt = additionalPaymentDebt;
    if (!debt || !activeBudgetId || !user) return;
    const amount = additionalPaymentAmount;
    if (amount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const currentTotal = debt.total ?? 0;
    const newTotal = Math.max(0, currentTotal - amount);
    const updatedPayments = (payments ?? []).map((p) =>
      p.id === debt.id ? { ...p, total: newTotal } : p,
    );
    setPayments(updatedPayments);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "EXTRA",
        createdAt: Timestamp.now(),
        nvelopeOrPaymentId: debt.id,
        description: `Extra payment of $${additionalPaymentAmount} applied to ${debt?.name}`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId,
      func: () => editPayments(updatedPayments, activeBudgetId),
    });
    setAdditionalPaymentDebt(null);
    setAdditionalPaymentAmount(0);
    if (newTotal <= 0 && debt.amount != null) {
      const paidOffPayment = updatedPayments.find((p) => p.id === debt.id)!;
      await addTransaction(
        {
          id: createTransactionId(user),
          type: "PAID_OFF",
          createdAt: Timestamp.now(),
          nvelopeOrPaymentId: debt.id,
          description: `Extra payment of $${amount} paid off "${debt.name}"`,
          createdBy: user.email ?? user.uid,
        },
        activeBudgetId,
      );
      setPendingPayoff({ paidOffPayment, paymentsAtPayoff: updatedPayments, remainder: 0 });
    }
    showToast("Payment applied");
  }

  const payoffCandidates = pendingPayoff
    ? getRemainingDebtsForSnowball(
        pendingPayoff.paymentsAtPayoff,
        pendingPayoff.paidOffPayment.id,
      )
    : [];

  async function handleConfirmPayoff(choice: {
    roll: boolean;
    targetId: string | null;
    surplus: SurplusDisposition;
  }) {
    if (!pendingPayoff || !user || !activeBudgetId) return;
    const { paidOffPayment, paymentsAtPayoff, remainder } = pendingPayoff;
    const { roll, targetId, surplus } = choice;

    let workingPayments = paymentsAtPayoff;

    if (roll && targetId) {
      workingPayments = rollSnowballOnPayoff(
        workingPayments,
        paidOffPayment,
        payDate,
      );
      const nextTarget = workingPayments.find((p) => p.id === targetId);
      setSnowballTargetPaymentId(targetId);
      await addTransaction(
        {
          id: createTransactionId(user),
          type: "SNOWBALL",
          createdAt: Timestamp.now(),
          nvelopeOrPaymentId: paidOffPayment.id,
          description: `Rolled "${paidOffPayment.name}"'s payment into the snowball, targeting "${nextTarget?.name}"`,
          createdBy: user.email ?? user.uid,
        },
        activeBudgetId,
      );
      await editSnowballTargetPaymentId(activeBudgetId, targetId);
    }

    let cascadePayoff: typeof pendingPayoff | null = null;

    if (remainder > 0 && surplus === "availableBudget") {
      const newBudget = totalSpendingBudget + remainder;
      setTotalSpendingBudget(newBudget);
      await addTransaction(
        {
          id: createTransactionId(user),
          type: "SNOWBALL",
          createdAt: Timestamp.now(),
          nvelopeOrPaymentId: paidOffPayment.id,
          description: `Snowball exceeded final payment. Applied $${remainder.toFixed(2)} to available budget`,
          createdBy: user.email ?? user.uid,
        },
        activeBudgetId,
      );
      await editTotalSpendingBudget(newBudget, activeBudgetId);
      showToast(`$${remainder.toFixed(2)} returned to budget`);
    } else if (remainder > 0 && surplus === "nextTarget" && targetId) {
      const result = applyPayoffSurplusToTarget(
        workingPayments,
        targetId,
        remainder,
      );
      workingPayments = result.payments;
      await addTransaction(
        {
          id: createTransactionId(user),
          type: "EXTRA",
          createdAt: Timestamp.now(),
          nvelopeOrPaymentId: targetId,
          description: `Applied $${result.applied.toFixed(2)} snowball surplus to "${paymentsAtPayoff.find((p) => p.id === targetId)?.name}"`,
          createdBy: user.email ?? user.uid,
        },
        activeBudgetId,
      );
      showToast(`$${result.applied.toFixed(2)} applied to next target`);
      if (result.paidOff) {
        await addTransaction(
          {
            id: createTransactionId(user),
            type: "PAID_OFF",
            createdAt: Timestamp.now(),
            nvelopeOrPaymentId: result.paidOff.id,
            description: `Paid off "${result.paidOff.name}"`,
            createdBy: user.email ?? user.uid,
          },
          activeBudgetId,
        );
        cascadePayoff = {
          paidOffPayment: result.paidOff,
          paymentsAtPayoff: workingPayments,
          remainder: result.leftover,
        };
      }
    }

    setPayments(workingPayments);
    await editPayments(workingPayments, activeBudgetId);
    setPendingPayoff(cascadePayoff);
  }

  function handleDeclinePayoffRoll() {
    setPendingPayoff(null);
  }

  async function deleteBill() {
    if (!user || !debtMenuOpen) return;
    const originalPaymentToEditId = removeVirtualIdPortion(debtMenuOpen);
    const updatedPayments = payments.filter((p) => {
      const originalPId = removeVirtualIdPortion(p);
      return originalPId !== originalPaymentToEditId;
    });
    setPayments(updatedPayments);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "DELETE",
        createdAt: Timestamp.now(),
        description: `Deleted debt ${debtMenuOpen.name}`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editPayments(updatedPayments, activeBudgetId!),
    });
    setDebtMenuOpen(null);
    showToast("Payment deleted");
  }

  if (isLoading) return <Loading text="Crunching Numbers" />;

  if (showEditSnowball) {
    return (
      <FullScreen
        theme="DARK"
        onClose={() => setShowEditSnowball(false)}
        onSave={() => handleUpdateSnowball(newSnowballAmount)}
        showButtons={true}
        saveButtonColor="gold"
        saveButtonText="Save"
        closeButtonText="Back"
      >
        <div className="flex justify-center items-center text-center w-full">
          <MoneyInput
            id="newSnowballAmount"
            label="Snowball amount (extra toward target each period)"
            value={newSnowballAmount}
            onChange={setNewSnowballAmount}
            placeholder={`$${getSnowballAmount(payments).toFixed(2)}`}
          />
        </div>
      </FullScreen>
    );
  }

  if (additionalPaymentDebt) {
    const debt = additionalPaymentDebt;
    const maxPay = debt.total ?? 0;
    return (
      <FullScreen
        theme="DARK"
        onClose={() => {
          setAdditionalPaymentDebt(null);
          setAdditionalPaymentAmount(0);
        }}
        onSave={handleApplyAdditionalPayment}
        showButtons={true}
        saveButtonColor="green"
        saveButtonText="Apply"
        closeButtonText="Cancel"
      >
        <div className="flex flex-col items-center justify-center text-center w-full">
          <p className="text-my-white-light mb-2">Additional payment</p>
          <p className="text-my-white-dark text-sm mb-4">{debt.name}</p>
          <p className="text-my-white-dark text-xs mb-2">
            Remaining: ${maxPay.toFixed(2)}
          </p>
          <MoneyInput
            id="additional-payment-amount"
            label="Amount"
            value={additionalPaymentAmount}
            onChange={setAdditionalPaymentAmount}
            placeholder="$0"
          />
        </div>
      </FullScreen>
    );
  }

  if (debtMenuOpen) {
    const d = debtMenuOpen;
    return (
      <FullScreen
        theme="DARK"
        onClose={() => setDebtMenuOpen(null)}
        showButtons={false}
      >
        <div className="flex flex-col items-center justify-center text-center w-full gap-4">
          <p className="text-my-white-light font-medium">{d.name}</p>
          <p className="text-my-white-dark text-sm">
            What would you like to do?
          </p>
          <div className="flex flex-col gap-2 w-full max-w-[16rem] items-center">
            <Button
              color="green"
              onClick={() => {
                setAdditionalPaymentDebt(d);
                setDebtMenuOpen(null);
              }}
            >
              Make additional payment
            </Button>
            <Button
              color="gold"
              onClick={() => {
                setEditingDebt(d);
                setDebtMenuOpen(null);
              }}
            >
              Edit debt
            </Button>
            <Button color="red" onClick={deleteBill}>
              Delete debt
            </Button>
            <Button color="gold" onClick={() => setDebtMenuOpen(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </FullScreen>
    );
  }

  if (editingDebt && user) {
    return (
      <PaymentForm
        paymentToEdit={editingDebt}
        user={user}
        handleBack={() => setEditingDebt(null)}
        handleUpdateBudget={async () => {}}
      />
    );
  }

  interface iDebtGrid {
    name: string;
    interest: string;
    owed: string;
    color?: string;
    paymentsLeft?: string;
    payOffDate?: string;
  }

  function DebtGrid({
    name,
    interest,
    owed,
    color,
    paymentsLeft,
    payOffDate,
  }: iDebtGrid) {
    return (
      <div className={`flex w-full items-center text-xs text-${color}`}>
        <p className="flex-[3] text-left">{name}</p>
        <p className="flex-1 text-center">{interest}</p>
        <p className="flex-1 text-right">{owed}</p>
        {paymentsLeft && (
          <p className="flex-[2] text-right">{paymentsLeft}</p>
        )}
        {payOffDate && <p className="flex-[2] text-right">{payOffDate}</p>}
      </div>
    );
  }

  // Final payoff date = when the last debt is paid off (max of per-debt payoff dates)
  const payoffDatesParsed = debts
    .map((d) =>
      d.payOffDate ? parse(d.payOffDate, "MMM do, yyyy", new Date()) : null,
    )
    .filter((d): d is Date => d !== null);
  const finalPaymentDate =
    payoffDatesParsed.length > 0
      ? new Date(Math.max(...payoffDatesParsed.map((d) => d.getTime())))
      : new Date();
  const finalPaymentDateStr = format(finalPaymentDate, "MMM yyyy");

  const snowballAmount = getSnowballAmount(payments);
  const snowballPayoffDate = calculateSnowballPayoffDate(
    debts,
    snowballAmount,
    effectiveSnowballTargetId,
    new Date(),
    extraMonthly || undefined,
  );
  const snowballPayoffDateStr = snowballPayoffDate
    ? format(snowballPayoffDate, "MMM yyyy")
    : null;

  return (
    <>
      <PageTour
        visible={isNewUser}
        onDismiss={async () => {
          if (activeBudgetId) {
            await editIsNewUser(false, activeBudgetId);
            setIsNewUser(false);
          }
        }}
      >
        <p>
          Track your <span className="text-my-red-light">debts</span> and payoff
          dates here. Set a <span className="text-my-blue-light">snowball</span>{" "}
          amount to add extra toward one target debt each period. Tap a debt to
          edit or make an additional payment.
        </p>
      </PageTour>
      <div className="flex flex-col items-center justify-start py-[5rem] w-full h-fit bg-my-blue-dark text-my-white-light">
        <Header
          links={[
            { label: "Home", href: "/" },
            { label: "Settings", href: "/settings" },
            { label: "Feedback", href: "/feedback" },
          ]}
        />

        <div className="bg-my-black-base/40 p-2 rounded-md mb-[1rem] w-[90%] max-w-[24rem] flex flex-col items-center gap-2">
          <p className="text-my-white-dark">TOTAL DEBT</p>
          <p className="text-my-red-dark mb-[.75rem] bg-my-white-dark px-2 rounded-md">
            ${remainingDebt.toFixed(2)}
          </p>
          <p className="text-my-blue-base">
            <span className="text-my-white-light">Payoff Date:</span>{" "}
            {finalPaymentDateStr}
          </p>
          {snowballPayoffDateStr && (
            <p
              className={`text-my-green-light ${extraMonthly ? "border-2 border-white p-2 rounded-sm" : ""}`}
            >
              <span className="text-my-white-light">With snowball:</span>{" "}
              {snowballPayoffDateStr}
            </p>
          )}
          {debts.length > 0 && (
            <div className="bg-my-black-base/40 p-2 rounded-md mb-[1rem] w-full">
              <p className="text-my-white-dark text-sm font-medium mb-2 text-center">
                What if you pay extra each month?
              </p>
              <div className="flex flex-col items-center gap-2 mb-2">
                <MoneyInput
                  id="extra-monthly"
                  label=""
                  placeholder="e.g. 400"
                  value={extraMonthly}
                  onChange={setExtraMonthly}
                />
              </div>
            </div>
          )}
        </div>

        {debtsMissingInfo.length > 0 && (
          <div className="flex flex-col items-center bg-my-black-base/40 p-2 rounded-md w-[90%] max-w-[24rem] mb-[1rem]">
            <p className="text-my-red-dark bg-my-white-dark px-2 rounded-md">
              Missing Information on {debtsMissingInfo.length} debts:
            </p>
            {showMissingInfoDebts ? (
              <div className="w-full mt-4">
                <DebtGrid
                  name="Name"
                  interest="Interest"
                  owed="Owed"
                  color="my-white-dark"
                />
                {debtsMissingInfo.map((d: Payment) => (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setEditingDebt(d)}
                    className="w-full flex items-center gap-2 cursor-pointer hover:bg-my-white-dark/10 rounded px-1 -mx-1 border-b-2 border-my-white-dark py-2"
                  >
                    <p className="flex-[2] text-left text-my-white-light">
                      {d.name}
                    </p>
                    {d.interestRate ? (
                      <p className="flex-1 text-center text-my-white-light">
                        {d.interestRate}
                      </p>
                    ) : (
                      <input
                        className="flex-1 text-center bg-my-white-light border-2 border-my-white-dark rounded-md w-[2.5rem] mx-auto text-my-black-dark text-xs"
                        onChange={(e) =>
                          setInterestRate(Number(e.target.value))
                        }
                        onBlur={() => saveDebtInformation(d)}
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                      />
                    )}
                    <p className="flex-1 text-right text-my-white-light">
                      ${d.total}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => setShowMissingInfoDebts(false)}
                  className="w-full flex items-center justify-center mt-4 text-my-blue-light cursor-pointer"
                >
                  <IoChevronUp size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMissingInfoDebts(true)}
                className="w-full flex items-center justify-center mt-2 text-my-blue-light cursor-pointer"
              >
                <IoChevronDown size={20} />
              </button>
            )}
          </div>
        )}

        <div className="bg-my-black-base/40 p-2 rounded-md w-[90%] max-w-[24rem] mb-[1rem] flex flex-col items-center gap-2 px-3 py-6">
          <p className="text-my-white-light">❄️ Snowball ❄️</p>
          <div className="flex items-center justify-between w-[85%] gap-4">
            <p className="text-my-white-light">
              {getSnowballName(payments, snowballTargetPaymentId ?? "")}
            </p>
            <button
              onClick={() => setShowSnowballTarget((s) => !s)}
              className="text-my-blue-light underline text-sm cursor-pointer"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center justify-between w-[85%] gap-4">
            <p className="text-my-white-dark">${snowballAmount.toFixed(2)}</p>
            <button
              onClick={() => setShowEditSnowball(true)}
              className="text-my-blue-light text-sm underline cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>

        {debts.length > 0 &&
          (() => {
            const debtsByLowestOwed = [...debts]
              .filter((d) => (d.total ?? 0) > 0)
              .sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
            return (
              <div className="bg-my-black-base/40 p-4 rounded-md w-[90%] max-w-[30rem] mb-[1rem]">
                <div className="gap-2 mb-4 flex flex-col items-center">
                  <p className="text-my-white-light mb-2">Debts</p>
                  {debtsByLowestOwed.length > 1 && showSnowballTarget ? (
                    <select
                      id="snowball-target"
                      value={effectiveSnowballTargetId ?? ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) handleSnowballTargetChange(id);
                      }}
                      className="w-[80%] border-2 p-2 rounded-md border-my-black-light bg-my-white-light text-my-black-dark text-sm"
                    >
                      {debtsByLowestOwed.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} - ${d.total?.toFixed(0) ?? "0"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    debtsByLowestOwed.length === 1 && (
                      <p className="text-my-white-dark text-center">
                        "{debtsByLowestOwed[0].name}"
                      </p>
                    )
                  )}
                </div>
                <div className="w-full flex justify-between">
                  <p className="w-[40%] text-my-white-dark text-xs">Name</p>
                  <p className="w-[30%] text-my-white-dark text-xs text-right pr-4">
                    Interest
                  </p>
                  <p className="w-[30%] text-my-white-dark text-xs text-right">
                    Remainder
                  </p>
                </div>
                {debtsByLowestOwed.map((d: Payment) => {
                  const cannotPayOff =
                    d.paymentsLeft == null || d.payOffDate == null;
                  return (
                    <div key={d.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setDebtMenuOpen(d)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setDebtMenuOpen(d)
                        }
                        className="border-y-2 border-my-white-dark my-2 w-full py-2 cursor-pointer hover:bg-my-white-dark/10"
                      >
                        <div className="w-full flex justify-center gap-6">
                          <p
                            className={`text-center w-[40%] text-sm flex items-center justify-center gap-1 ${d.id === effectiveSnowballTargetId ? "text-my-blue-light" : "text-my-white-light"}`}
                          >
                            {d.id === effectiveSnowballTargetId
                              ? `❄️ ${d.name} ❄️`
                              : d.name}
                            {cannotPayOff && (
                              <IoWarning
                                size={14}
                                className="text-my-red-light shrink-0 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPayoffWarningDebtId(d.id);
                                }}
                              />
                            )}
                          </p>
                          <p className="text-center text-my-white-light w-[20%]">
                            {d.interestRate != null
                              ? d.interestRate.toString() + " %"
                              : "—"}
                          </p>
                          <p className="text-center text-my-white-light w-[20%]">
                            ${d.total?.toFixed(0) ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        {payoffWarningDebtId &&
          (() => {
            const warningDebt = debts.find(
              (d) => d.id === payoffWarningDebtId,
            );
            if (!warningDebt) return null;
            return (
              <div
                className="fixed inset-0 z-[10200] bg-my-black-dark/80 flex items-center justify-center p-4"
                onClick={() => setPayoffWarningDebtId(null)}
              >
                <div
                  className="bg-my-black-base border-2 border-my-red-light rounded-md p-4 max-w-[24rem] flex flex-col items-center gap-2 text-center text-my-white-light"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IoWarning size={28} className="text-my-red-light" />
                  <p className="text-sm">
                    Payoff cannot be calculated for "{warningDebt.name}". Your
                    minimum payment may be too low to cover interest – try
                    increasing the payment amount.
                  </p>
                  <button
                    onClick={() => setPayoffWarningDebtId(null)}
                    className="text-my-blue-light underline text-sm cursor-pointer mt-2"
                  >
                    Got it
                  </button>
                </div>
              </div>
            );
          })()}

        {paidOffDebts.length > 0 && (
          <div className="bg-my-black-base/40 p-4 rounded-md w-[90%] max-w-[30rem] mb-[1rem]">
            <p className="text-my-white-dark text-sm text-center">Paid Off</p>
            <p className="text-my-green-base w-full text-center text-sm mb-4">
              Total: $
              {paidOffDebts.reduce((acc, d) => (d.originalTotal ?? 0) + acc, 0)}
            </p>
            <ul className="list-none">
              {paidOffDebts.map((d) => (
                <li
                  key={d.id}
                  className="flex justify-center gap-4 text-my-white-light"
                >
                  <span>{d.name}</span>
                  <span>${d.originalTotal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {pendingPayoff && (
        <CongratsPaidOffModal
          // Remount on each payoff (including cascades) so the roll/target/surplus
          // choices don't carry stale state from the previous debt.
          key={pendingPayoff.paidOffPayment.id}
          debtName={pendingPayoff.paidOffPayment.name}
          freedUpAmount={pendingPayoff.paidOffPayment.amount ?? 0}
          remainder={pendingPayoff.remainder}
          candidates={payoffCandidates}
          defaultTargetId={payoffCandidates[0]?.id ?? null}
          onConfirm={handleConfirmPayoff}
          onDecline={handleDeclinePayoffRoll}
        />
      )}
    </>
  );
}
