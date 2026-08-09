import { useEffect, useMemo, useState } from "react";
import Header from "../components/Nav/Header";
import Nvelopes from "../components/Nvelopes/NvelopesContainer";
import { type Envelope, type Interval, type Payment, type ViewContent } from "../types";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import {
  editDatabaseWithTransaction,
  editEnvelopes,
  editIsNewUser,
  editPayments,
  editSnowballTargetPaymentId,
  editTotalSpendingBudget,
} from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useToast } from "../Context/ToastContext/useToast";
import Button from "../components/Buttons/Button";
import Nvelope from "../components/Nvelopes/Nvelope";
import { Timestamp } from "firebase/firestore";
import {
  createTransactionId,
  deriveIsPaid,
  getVirtualPaymentsForCurrentPeriod,
  recalculateBudget,
  removeVirtualIdPortion,
  resetAllNvelopes,
  updateBudgetStateAndDBB,
} from "../util";
import {
  applyAmountToTotal,
  computeUpdatedPayment,
  getOriginalIdFromVirtualId,
  togglePaidDates,
} from "../util/paymentUtils";
import ActionButtons from "../components/Buttons/ActionButtons";
import ContentSelector from "../components/ContentSelector";
import Loading from "../components/Loading";
import { startOfDay, addMonths } from "date-fns";
import PaymentMap from "../components/Payments/PaymentMap";
import BigPayment from "../Views/BigPayment";
import PaymentForm from "../components/Forms/PaymentForm";
import AddIncomeForm from "../components/Forms/AddIncomeForm";
import AddCashToEnvelopeForm from "../Views/AddCashToEnvelopeForm";
import FundPaymentDueModal from "../components/Payments/SplitPaymentDueModal";
import CongratsPaidOffModal from "../components/Payments/CongratsPaidOffModal";
import PageTour from "../components/PageTour";

export default function MainEnvelopesView() {
  const { user } = useAuth();
  const { activeBudgetId, budgets } = useBudget();
  const activeBudgetName =
    budgets.find((b) => b.id === activeBudgetId)?.name ?? "Budget";
  const { showToast } = useToast();
  const {
    totalSpendingBudget,
    setTotalSpendingBudget,
    envelopes,
    setEnvelopes,
    isNewUser,
    setIsNewUser,
    payDate,
    payPeriodInterval,
    snowballTargetPaymentId,
    setSnowballTargetPaymentId,
    payments,
    setPayments,
  } = useDatabase();

  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [showPaymentInputs, setShowPaymentInputs] = useState(false);
  const [showDeletePayment, setShowDeletePayment] = useState(false);

  const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | undefined>();
  const [isEditingEnvelope, setIsEditingEnvelope] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCash, setIsAddingCash] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [cashName, setCashName] = useState("");
  const [cashAmount, setCashAmount] = useState(0);
  const [showSpendPage, setShowSpendPage] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [isAddingCashToEnvelope, setIsAddingCashToEnvelope] = useState(false);
  const [showClearEnvelopes, setShowClearNvelopes] = useState(false);
  const [dueFundPayment, setDueFundPayment] = useState<Payment | null>(null);
  const [dismissedDuePayments, setDismissedDuePayments] = useState<Set<string>>(
    new Set(),
  );
  const [paidOffDebtName, setPaidOffDebtName] = useState<string | null>(null);
  const [content, setContent] = useState<ViewContent>("NVELOPES");

  // Only ever show current pay period's payments (derived, never full list)
  const paymentsThisPeriod = useMemo(() => {
    if (!payDate || !payments?.length || !payPeriodInterval) return [];
    const virtual = getVirtualPaymentsForCurrentPeriod(
      payments,
      payPeriodInterval,
      payDate,
    );
    // Hide paid-off debts from main payment view (they appear on Debt page)
    return virtual.filter(
      (p) => !(p.type === "DEBT" && p.total != null && p.total <= 0),
    );
  }, [payments, payDate, payPeriodInterval]);

  // Check for due Fund (planned expense) payments
  useEffect(() => {
    if (!payments) return;
    const today = startOfDay(new Date());

    // Find Fund payments that are due (dueDate <= today) and not fully paid
    const duePayment = payments.find((p) => {
      if (p.type !== "FUND") return false;
      if (dismissedDuePayments.has(p.id)) return false;
      const dueDate = startOfDay(p.dueDate.toDate());
      return dueDate <= today && !deriveIsPaid(p);
    });

    if (duePayment && !dueFundPayment) {
      setDueFundPayment(duePayment);
    }
  }, [payments, dismissedDuePayments, dueFundPayment]);

  async function handleEditPayment(p: Payment) {
    setPaymentToEdit(p);
    setShowPaymentInputs(true);
  }

  // Web-only: unlike mobile, web decrements available budget when a new bill/debt/fund is added.
  async function handleUpdateBudget(diffAmount: number) {
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, activeBudgetId!);
    setTotalSpendingBudget(nextBudget);
  }

  // Handler for marking a Fund (planned expense) payment as fully paid
  async function handleMarkFundPaid(payment: Payment) {
    if (!user) return;
    const updatedPayments = payments.map((p) =>
      p.id === payment.id ? { ...p, paid: true } : p,
    );
    setPayments(updatedPayments);
    await editPayments(updatedPayments, activeBudgetId!);
    setDueFundPayment(null);
    showToast(`${payment.name} marked as paid!`);
  }

  // Handler for extending a Fund payment's target date
  async function handleExtendFundDate(payment: Payment) {
    if (!user) return;
    // Extend by 1 month by default
    const newDueDate = addMonths(payment.dueDate.toDate(), 1);
    const updatedPayments = payments.map((p) =>
      p.id === payment.id
        ? { ...p, dueDate: Timestamp.fromDate(newDueDate) }
        : p,
    );
    setPayments(updatedPayments);
    await editPayments(updatedPayments, activeBudgetId!);
    setDueFundPayment(null);
    showToast(`${payment.name} extended by 1 month`);
  }

  // Handler for dismissing the Fund due modal (remind later)
  function handleDismissFundModal() {
    if (dueFundPayment) {
      setDismissedDuePayments((prev) => new Set(prev).add(dueFundPayment.id));
    }
    setDueFundPayment(null);
  }

  function handleDeleteBill(p: Payment) {
    setPaymentToEdit(p);
    setShowDeletePayment(true);
  }

  async function deleteBill() {
    if (!user || !paymentToEdit) return;
    const originalPaymentToEditId = removeVirtualIdPortion(paymentToEdit);
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
        nvelopeOrPaymentId: originalPaymentToEditId,
        description: `Deleted payment: "${paymentToEdit?.name}"`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editPayments(updatedPayments, activeBudgetId!),
    });
    resetPaymentState();
    showToast("Payment deleted");
  }

  function handleAddPayment() {
    setPaymentToEdit(null);
    setShowPaymentInputs(true);
  }

  function resetPaymentState() {
    setShowPaymentInputs(false);
    setPaymentToEdit(null);
  }

  async function applySnowballToTarget(virtualPayment: Payment) {
    if (!snowballTargetPaymentId || !activeBudgetId || !user) return;

    const snowballPayment = payments.find((p) => p.id === "SNOWBALL");
    const targetDebt = payments.find((p) => p.id === snowballTargetPaymentId);
    if (!snowballPayment || !targetDebt) return;

    const occurrenceDate = virtualPayment.dueDate.toDate();
    const occurrenceKey = startOfDay(occurrenceDate).getTime().toString();

    const updatedSnowball = togglePaidDates(snowballPayment, occurrenceDate);
    const updatedTarget = applyAmountToTotal(
      targetDebt,
      virtualPayment.amount,
      occurrenceKey,
    );

    let updatedPayments: Payment[] = payments.map((p) => {
      if (p.id === "SNOWBALL") return updatedSnowball;
      if (p.id === snowballTargetPaymentId) return updatedTarget;
      return p;
    });

    if (updatedTarget.total! <= 0) {
      const remainder = virtualPayment.amount - (targetDebt.total ?? 0);
      updatedPayments = await handleDebtPayoff(
        targetDebt,
        updatedPayments,
        remainder,
      );
    }
    setPayments(updatedPayments);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "SNOWBALL",
        createdAt: Timestamp.now(),
        nvelopeOrPaymentId: virtualPayment.id,
        description: `Applied snowball to  "${targetDebt?.name}"`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editPayments(updatedPayments, activeBudgetId!),
    });
  }

  async function handleDebtPayoff(
    paidOffPayment: Payment,
    updatedPayments: Payment[],
    remainder: number = 0,
  ): Promise<Payment[]> {
    if (!user) return [];
    setPaidOffDebtName(paidOffPayment.name);

    const remainingDebts = updatedPayments.filter(
      (p) =>
        p.type === "DEBT" &&
        p.id !== "SNOWBALL" &&
        p.id !== paidOffPayment.id &&
        p.total != null &&
        p.total > 0,
    );
    const nextDebt =
      remainingDebts.sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0] ?? null;

    setSnowballTargetPaymentId(nextDebt?.id ?? null);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "PAID_OFF",
        createdAt: Timestamp.now(),
        nvelopeOrPaymentId: paidOffPayment.id,
        description: `Snowball paid off "${paidOffPayment?.name}" Rolling into "${nextDebt?.name}"`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () =>
        editSnowballTargetPaymentId(activeBudgetId!, nextDebt?.id ?? null),
    });

    const snowballPayment = updatedPayments.find((p) => p.id === "SNOWBALL");
    const newSnowballAmount =
      (snowballPayment?.amount ?? 0) + paidOffPayment.amount;

    let finalPayments: Payment[];
    if (snowballPayment) {
      finalPayments = updatedPayments.map((p) =>
        p.id === "SNOWBALL" ? { ...p, amount: newSnowballAmount } : p,
      );
    } else {
      finalPayments = [
        ...updatedPayments,
        {
          id: "SNOWBALL",
          name: "❄️Snowball❄️",
          amount: newSnowballAmount,
          dueDate: payDate!,
          interval: "SPLIT" as Interval,
          recurring: true,
          paidDates: [],
          paidAmounts: {},
          type: "DEBT",
        } as Payment,
      ];
    }

    if (remainder > 0) {
      const newBudget = totalSpendingBudget + remainder;
      setTotalSpendingBudget(newBudget);
      await editDatabaseWithTransaction({
        t: {
          id: createTransactionId(user),
          type: "SNOWBALL",
          createdAt: Timestamp.now(),
          nvelopeOrPaymentId: paidOffPayment.id,
          description: `Snowball exeeded final payment. Applied $${remainder} to available budget`,
          createdBy: user.email ?? user.uid,
        },
        budgetId: activeBudgetId!,
        func: () => editTotalSpendingBudget(newBudget, activeBudgetId!),
      });
    }

    showToast(
      remainder > 0
        ? `${paidOffPayment.name} paid off! $${remainder.toFixed(2)} returned to budget`
        : `${paidOffPayment.name} paid off!`,
    );

    return finalPayments;
  }

  async function handleUpdatePaid(virtualPayment: Payment) {
    if (!user) return;
    const originalId = getOriginalIdFromVirtualId(virtualPayment.id);

    // Snowball payment routes to its own handler
    if (originalId === "SNOWBALL") {
      await applySnowballToTarget(virtualPayment);
      return;
    }

    const originalPayment = payments.find((p) => p.id === originalId);
    if (!originalPayment) return;

    const updatedPayment = computeUpdatedPayment(
      originalPayment,
      virtualPayment,
    );
    let updatedPayments: Payment[] = payments.map((p) =>
      p.id === originalId ? updatedPayment : p,
    );

    // Is Debt Paid Off?
    const paidOffPayment = updatedPayments.find(
      (p) =>
        p.id === originalId &&
        p.type === "DEBT" &&
        p.total != null &&
        p.total <= 0,
    );
    if (paidOffPayment) {
      updatedPayments = await handleDebtPayoff(paidOffPayment, updatedPayments);
    }
    setPayments(updatedPayments);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "PAID",
        createdAt: Timestamp.now(),
        description: `Toggled "${updatedPayment?.name}" Paid/Unpaid `,
        nvelopeOrPaymentId: updatedPayment.id,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editPayments(updatedPayments, activeBudgetId!),
    });

    return updatedPayment;
  }

  const emptyEnvelope = {
    id: "",
    name: "",
    total: 0,
    spent: 0,
    oneTime: false,
  };

  async function saveNewEnvelope(e: Envelope) {
    if (!e.name.trim() || !user) return;
    setLoadingText("Adding New Envelope...");
    setShowLoading(true);
    const newEnvelopes = [...envelopes];
    newEnvelopes.push({
      id: e.id,
      name: e.name,
      total: e.total,
      spent: e.spent || 0,
      order: e.order || 0,
    });
    setEnvelopes(newEnvelopes);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "NEW",
        createdAt: Timestamp.now(),
        nvelopeOrPaymentId: e.id,
        amount: e.total,
        description: `Added new envelope ${e.name} with $${e.total}`,
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editEnvelopes(newEnvelopes, activeBudgetId!),
    });
    await updateBudgetStateAndDBB(
      Number(e.total) * -1,
      activeBudgetId!,
      totalSpendingBudget,
      setTotalSpendingBudget,
    );
    resetState();
    showToast("Envelope created");
  }

  async function handleSetShowSpendingPage(e: Envelope) {
    setEnvelopeToEdit(e);
    setShowSpendPage(true);
  }

  async function deleteEnvelope() {
    if (!user || !envelopeToEdit) return;
    try {
      setLoadingText("Deleting Envelope...");
      setShowLoading(true);
      const newEnvelopes = [...envelopes].filter(
        (e) => e.id !== envelopeToEdit?.id,
      );
      setEnvelopes(newEnvelopes);
      await editDatabaseWithTransaction({
        t: {
          id: createTransactionId(user),
          type: "DELETE",
          description: `Deleted envelope ${envelopeToEdit.name}`,
          createdAt: Timestamp.now(),
          createdBy: user.email ?? user.uid,
        },
        budgetId: activeBudgetId!,
        func: () => editEnvelopes(newEnvelopes, activeBudgetId!),
      });
      resetState();
      showToast("Envelope deleted");
    } catch (error) {
      console.error("Error deleting envelope:", error);
      setShowLoading(false);
      showToast("Failed to delete envelope", "error");
    }
  }

  // Edit Envelopes AND budget
  async function editEnvelopeAndBudget(n: Envelope) {
    if (!user) return;
    try {
      const originalEnvelope = envelopes.find((e) => e.id === n.id);
      if (!originalEnvelope) return;
      setLoadingText("Editing Envelope...");
      setShowLoading(true);
      if (originalEnvelope.total > n.total) {
        await updateBudgetStateAndDBB(
          Number(originalEnvelope.total - n.total),
          activeBudgetId!,
          totalSpendingBudget,
          setTotalSpendingBudget,
        );
      } else if (originalEnvelope.total < n.total) {
        await updateBudgetStateAndDBB(
          Number(n.total - originalEnvelope.total) * -1,
          activeBudgetId!,
          totalSpendingBudget,
          setTotalSpendingBudget,
        );
      }
      const newEnvelopes = [...envelopes].map((e) => (e.id === n.id ? n : e));
      setEnvelopes(newEnvelopes);
      await editDatabaseWithTransaction({
        t: {
          id: createTransactionId(user),
          type: "EDIT",
          description: `Manually Edited "${n.name}"`,
          nvelopeOrPaymentId: n.id,
          createdAt: Timestamp.now(),
          createdBy: user.email ?? user.uid,
        },
        budgetId: activeBudgetId!,
        func: () => editEnvelopes(newEnvelopes, activeBudgetId!),
      });
      resetState();
      showToast("Envelope updated");
    } catch (error) {
      console.error("Error editing envelope:", error);
      setShowLoading(false);
      showToast("Failed to update envelope", "error");
    }
  }

  // Edit just the envelopes without affecting budget
  async function editEnvelope(
    n: Envelope,
    isSpending?: boolean,
    spendDesc?: string,
    amount?: number,
  ) {
    if (!user) return;
    const originalEnvelope = envelopes.find((e) => e.id === n.id);
    if (!originalEnvelope) return;
    setLoadingText("Editing Envelope...");
    setShowLoading(true);
    const newEnvelopes = [...envelopes].map((e) => (e.id === n.id ? n : e));
    setEnvelopes(newEnvelopes);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: isSpending ? "SPEND" : "EDIT",
        description: spendDesc || `Manually edited ${n.name}.`,
        nvelopeOrPaymentId: n.id,
        ...(amount !== undefined && { amount }),
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editEnvelopes(newEnvelopes, activeBudgetId!),
    });
    resetState();
  }

  function handleSetupEdit(n: Envelope) {
    setIsDeleting(false);
    setEnvelopeToEdit(n);
    setIsEditingEnvelope(true);
  }

  function handleSetupNewEnvelope() {
    setEnvelopeToEdit(undefined);
    setIsAdding(true);
  }

  function resetState() {
    setIsAdding(false);
    setIsEditingEnvelope(false);
    setIsDeleting(false);
    setEnvelopeToEdit(undefined);
    setCashAmount(0);
    setCashName("");
    setIsAddingCash(false);
    setShowSpendPage(false);
    setShowBudgetWarning(false);
    setShowLoading(false);
    setLoadingText("");
    setIsAddingCashToEnvelope(false);
  }

  function handleSetupDelete(id?: string) {
    if (id) {
      setEnvelopeToEdit(envelopes.find((e) => e.id === id));
    }
    setIsEditingEnvelope(false);
    setIsAdding(false);
    setIsDeleting(true);
  }

  function handleAddCash() {
    setIsAddingCash(true);
  }

  async function handleResetEnvelopesAndPaid() {
    if (!activeBudgetId || !user) return;
    const paymentsMarkedPaid = payments.map((p) => {
      return { ...p, paidDates: [], paidAmounts: {} };
    });
    setPayments(paymentsMarkedPaid);
    setShowClearNvelopes(false);
    await resetAllNvelopes(envelopes, setEnvelopes, activeBudgetId);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "RESET",
        description: "Reset Nvelopes & Marked Payments as UNPAID",
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editPayments(paymentsMarkedPaid, activeBudgetId!),
    });
    showToast("Envelopes and Payments reset");
  }

  async function addCashToDb() {
    if (cashAmount <= 0 || !cashName || !user) return;
    setLoadingText("Adding Cash...");
    setShowLoading(true);
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "CASH",
        amount: cashAmount,
        description: `Added Cash: ${cashName}`,
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () =>
        updateBudgetStateAndDBB(
          cashAmount,
          activeBudgetId!,
          totalSpendingBudget,
          setTotalSpendingBudget,
        ),
    });
    resetState();
    showToast("Cash added to budget");
  }

  function handleAddCashToEnvelope(envelope: Envelope) {
    setIsAddingCashToEnvelope(true);
    setEnvelopeToEdit(envelope);
  }

  async function addCashToEnvelope() {
    const n = envelopes.find((e) => e.id === envelopeToEdit?.id);
    if (!n || cashAmount <= 0 || !user) return;
    setLoadingText("Filling Nvelope...");
    setShowLoading(true);
    const newEnvelopes = [...envelopes].map((e) =>
      e.id === n.id ? { ...n, total: n.total + cashAmount } : e,
    );
    await updateBudgetStateAndDBB(
      cashAmount * -1,
      activeBudgetId!,
      totalSpendingBudget,
      setTotalSpendingBudget,
    );
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "FILL",
        description: `Added $${cashAmount} to ${n.name}`,
        nvelopeOrPaymentId: n.id,
        amount: cashAmount,
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editEnvelopes(newEnvelopes, activeBudgetId!),
    });
    setEnvelopes(newEnvelopes);
    showToast(`${cashAmount} added to ${n.name}`);
    resetState();
  }

  if (showClearEnvelopes)
    return (
      <div className="flex flex-col items-center justify-center bg-my-blue-dark h-screen w-full m-auto p-6">
        <div className="items-center w-fit mx-auto bg-my-black-dark/60 p-4 rounded-md text-center">
          <p className="text-my-white-light text-xl m-2">
            Reset <span className="text-my-blue-light">Nvelope</span> amounts
            to <span className="text-my-green-base">$0.00</span>
          </p>
          <p className="text-my-white-light text-xl m-2">
            Mark <span className="text-my-red-light">ALL Payments</span>
            <span className="text-gray-400"> unpaid</span>.
          </p>
          <p className="text-my-white-light text-sm mt-2">
            (Your budget total will be unaffected)
          </p>
        </div>
        <div className="w-full max-w-[16rem] mt-8 flex flex-col gap-4">
          <Button color="gold" onClick={handleResetEnvelopesAndPaid}>
            Clear
          </Button>
          <Button color="red" onClick={() => setShowClearNvelopes(false)}>
            Back
          </Button>
        </div>
      </div>
    );

  if (showDeletePayment && payDate && paymentToEdit) {
    return (
      <div className="absolute inset-0 w-screen h-screen z-100 select-none">
        <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
          <p className="p-4 rounded-md text-my-white-dark w-full text-center">
            Are you sure you want to delete "{paymentToEdit.name}"?
          </p>
          <p className="text-xs text-my-white-light text-center mb-4">
            Removing this payment will not change your available budget.
          </p>
          <div className="flex gap-2 items-center justify-center w-[95%]">
            <Button
              color="red"
              onClick={() => {
                setShowDeletePayment(false);
                resetPaymentState();
              }}
            >
              No
            </Button>
            <Button
              color="green"
              onClick={() => {
                deleteBill();
                setShowDeletePayment(false);
                resetPaymentState();
              }}
            >
              Yes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show modal for due Fund (planned expense) payments
  if (dueFundPayment) {
    return (
      <FundPaymentDueModal
        payment={dueFundPayment}
        onMarkPaid={handleMarkFundPaid}
        onExtendDate={handleExtendFundDate}
        onDismiss={handleDismissFundModal}
      />
    );
  }

  if (showPaymentInputs) {
    if (paymentToEdit) {
      return (
        <>
          <BigPayment
            handleUpdatePaid={handleUpdatePaid}
            resetState={resetPaymentState}
            handleBack={resetPaymentState}
            paymentToEdit={paymentToEdit}
            handleUpdateBudget={handleUpdateBudget}
            handleDeleteBill={handleDeleteBill}
            onPaymentUpdated={setPaymentToEdit}
          />
          {paidOffDebtName && (
            <CongratsPaidOffModal
              debtName={paidOffDebtName}
              onClose={() => setPaidOffDebtName(null)}
            />
          )}
        </>
      );
    } else if (user)
      return (
        <PaymentForm
          paymentToEdit={null}
          user={user}
          handleBack={resetPaymentState}
          handleUpdateBudget={handleUpdateBudget}
        />
      );
  }

  if (showSpendPage && envelopes.length > 0) {
    const envelopeSent = envelopeToEdit || emptyEnvelope;
    return (
      <>
        {showLoading && <Loading text={loadingText} />}
        <Nvelope
          kind="spendingEnvelope"
          envelope={envelopeSent}
          editEnvelope={editEnvelope}
          handleBack={resetState}
        />
      </>
    );
  }

  if (isEditingEnvelope && envelopeToEdit) {
    return (
      <>
        {showLoading && <Loading text={loadingText} />}
        <Nvelope
          kind="editEnvelope"
          envelope={envelopeToEdit}
          editEnvelope={editEnvelope}
          handleBack={resetState}
          handleDeleteEnvelope={() => handleSetupDelete()}
        />
      </>
    );
  }

  if (isDeleting && envelopeToEdit) {
    return (
      <>
        {showLoading && <Loading text={loadingText} />}
        <Nvelope
          kind="deleteEnvelope"
          envelope={envelopeToEdit}
          handleBack={resetState}
          handleDeleteEnvelope={() => deleteEnvelope()}
        />
      </>
    );
  }

  if (isAdding) {
    return (
      <>
        {showLoading && <Loading text={loadingText} />}
        <Nvelope
          kind="addEnvelope"
          envelope={emptyEnvelope}
          handleSaveEnvelope={saveNewEnvelope}
          handleBack={resetState}
        />
      </>
    );
  }

  if (showBudgetWarning) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p>You have nothing left in your budget!</p>
        <p>Try moving some money from another envelope</p>
        <Button onClick={() => setShowBudgetWarning(false)} color="green">
          Go Back
        </Button>
      </div>
    );
  }

  if (isAddingCash) {
    return (
      <AddIncomeForm
        showLoading={showLoading}
        loadingText={loadingText}
        setIsAddingCash={setIsAddingCash}
        addCashToDb={addCashToDb}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        cashName={cashName}
        setCashName={setCashName}
      />
    );
  }

  if (isAddingCashToEnvelope) {
    return (
      <AddCashToEnvelopeForm
        showLoading={showLoading}
        loadingText={loadingText}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        addCashToEnvelope={addCashToEnvelope}
        envelopeToEdit={envelopeToEdit}
        setIsAddingCashToEnvelope={setIsAddingCashToEnvelope}
      />
    );
  }

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
        <div className="flex flex-col items-start gap-2">
          <p>This is your current budget.</p>
          <p>
            Click <span className="text-my-red-light">Payment</span> for
            bills/debts.
          </p>
          <p>
            <span className="text-my-green-light">Cash</span> when money comes
            in.
          </p>
          <p>
            <span className="text-my-blue-light">Nvelope</span> to create
            nvelopes for spending categories.
          </p>
          <p>
            <span className="text-my-white-dark">Reset</span> to clear all
            envelopes.
          </p>
          Useful when starting a new period.
          <div>
            See your days left in current interval, and your balance in top
            menu. Tap the balance to edit it. You can also adjust your pay date
            and budget interval in{" "}
            <a href="/settings" className="text-my-blue-light underline inline">
              Settings
            </a>
          </div>
        </div>
      </PageTour>
      <div className="w-full text-center flex flex-col items-center min-h-screen bg-my-white-light overflow-y-auto pb-[8rem]">
        {showLoading && <Loading text={loadingText} />}

        <Header
          links={[
            { label: "Settings", href: "/settings" },
            { label: "Debt", href: "/debt" },
            { label: "Feedback", href: "/feedback" },
          ]}
        />

        <main className="flex flex-col items-center pt-[4rem] w-full">
          <h2 className="text-lg font-semibold text-my-black-dark mb-2 py-2">
            {activeBudgetName}
          </h2>
          {!payDate && (
            <p className="text-sm text-my-black-light mb-2">
              <a href="/settings" className="text-my-green-dark underline">
                Set your pay date in Settings
              </a>{" "}
              to see your pay period in the header.
            </p>
          )}

          <div className="w-full max-w-[56rem]">
            {content === "NVELOPES" ? (
              <Nvelopes
                resetState={resetState}
                handleSetupEdit={handleSetupEdit}
                editEnvelope={editEnvelopeAndBudget}
                handleSetShowSpendingPage={handleSetShowSpendingPage}
                handleDeleteEnvelope={handleSetupDelete}
                handleAddCashToEnvelope={handleAddCashToEnvelope}
              />
            ) : (
              <PaymentMap
                paymentsThisPeriod={paymentsThisPeriod}
                handleUpdatePaid={handleUpdatePaid}
                handleEditBill={handleEditPayment}
              />
            )}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 w-full flex flex-col items-center gap-3 pt-3 pb-4 bg-my-white-light">
          <ActionButtons
            onPaymentClick={handleAddPayment}
            onCashClick={handleAddCash}
            onEnvelopeClick={handleSetupNewEnvelope}
            onClearClick={() => setShowClearNvelopes(true)}
          />
          <ContentSelector content={content} setContent={setContent} />
        </div>
      </div>
      {paidOffDebtName && (
        <CongratsPaidOffModal
          debtName={paidOffDebtName}
          onClose={() => setPaidOffDebtName(null)}
        />
      )}
    </>
  );
}
