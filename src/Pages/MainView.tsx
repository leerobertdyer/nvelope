import { useEffect, useState } from "react";
import Header from "../components/Nav/Header";
import Nvelopes from "../components/Nvelopes/NvelopesContainer";
import { type Envelope, type Payment } from "../types";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import {
  editEnvelopes,
  editOneTimeCashAndBudget,
  editPayments,
  editSnowball,
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
  getVirtualPaymentsForCurrentPeriod,
  recalculateBudget,
  removeVirtualIdPortion,
  resetAllNvelopes,
  updateBudgetStateAndDBB,
} from "../util";
import ActionButtons from "../components/Buttons/ActionButtons";
import Loading from "../components/Loading";
import FullScreen from "../Views/FullScreen";
import TextInput from "../components/TextInput";
import { startOfDay, addMonths } from "date-fns";
import PaymentMap from "../components/Payments/PaymentMap";
import ShowAndHide from "../components/Buttons/ShowAndHide";
import Summary from "../components/Payments/Summary";
import BigPayment from "../Views/BigPayment";
import PaymentForm from "../components/Forms/PaymentForm";
import AddIncomeForm from "../components/Forms/AddIncomeForm";
import AddCashToEnvelopeForm from "../Views/AddCashToEnvelopeForm";
import FundPaymentDueModal from "../components/Payments/SplitPaymentDueModal";

export default function MainEnvelopesView() {
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const { showToast } = useToast();
  const {
    totalSpendingBudget,
    setTotalSpendingBudget,
    envelopes,
    setEnvelopes,
    payDate,
    payPeriodInterval,
    snowball,
    setSnowball,
    snowballTargetPaymentId,
    setSnowballTargetPaymentId,
    payments,
    setPayments,
  } = useDatabase();

  const [showSummary, setShowSummary] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [showPaymentInputs, setShowPaymentInputs] = useState(false);
  const [showDeletePayment, setShowDeletePayment] = useState(false);
  const [showEditSnowball, setShowEditSnowball] = useState(false);

  const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | undefined>();
  const [isEditingEnvelope, setIsEditingEnvelope] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCash, setIsAddingCash] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [cashName, setCashName] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [showSpendPage, setShowSpendPage] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [isAddingCashToEnvelope, setIsAddingCashToEnvelope] = useState(false);
  const [showClearEnvelopes, setShowClearNvelopes] = useState(false);
  const [dueFundPayment, setDueFundPayment] = useState<Payment | null>(null);
  const [dismissedDuePayments, setDismissedDuePayments] = useState<Set<string>>(new Set());

  const [paymentsThisPeriod, setPaymentsThisPeriod] = useState(payments);

  // Check for due Fund (planned expense) payments
  useEffect(() => {
    if (!payments) return;
    const today = startOfDay(new Date());
    
    // Find Fund payments that are due (dueDate <= today) and not fully paid
    const duePayment = payments.find((p) => {
      if (p.type !== "FUND") return false;
      if (dismissedDuePayments.has(p.id)) return false;
      const dueDate = startOfDay(p.dueDate.toDate());
      return dueDate <= today && !p.paid;
    });
    
    if (duePayment && !dueFundPayment) {
      setDueFundPayment(duePayment);
    }
  }, [payments, dismissedDuePayments, dueFundPayment]);

  useEffect(() => {
    if (!payDate || !payments || !payPeriodInterval) return;
    setPaymentsThisPeriod(() => {
      const virtual = getVirtualPaymentsForCurrentPeriod(payments, payPeriodInterval, payDate);
      // Hide paid-off debts from main payment view (they appear on Debt page)
      return virtual.filter(
        (p) => !(p.type === "DEBT" && p.total != null && p.total <= 0)
      );
    });
}, [payments, payDate, payPeriodInterval]);


  async function handleEditPayment(p: Payment) {
    setPaymentToEdit(p);
    setShowPaymentInputs(true);
  }

  // Handler for marking a Fund (planned expense) payment as fully paid
  async function handleMarkFundPaid(payment: Payment) {
    if (!user) return;
    const updatedPayments = payments.map((p) =>
      p.id === payment.id ? { ...p, paid: true } : p
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
        : p
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

  async function handleUpdateBudget(diffAmount: number) {
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, activeBudgetId!);
    setTotalSpendingBudget(nextBudget);
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
    await editPayments(updatedPayments, activeBudgetId!);
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

  async function handleUpdatePaid(payment: Payment) {
    const originalId = payment.id.includes("-WEEKLY-")
      ? payment.id.split("-WEEKLY-")[0]
      : payment.id.includes("-BIWEEKLY-")
        ? payment.id.split("-BIWEEKLY-")[0]
        : payment.id.includes("-SPLIT-")
          ? payment.id.split("-SPLIT-")[0]
          : payment.id;

    const updatedPayments = payments.map((p) => {
      if (p.id !== originalId) return p;

      // DEBT: mark paid subtracts from total; mark unpaid adds it back (store amount in paidAmounts)
      if (p.type === "DEBT") {
        const occurrenceKey =
          p.interval === "WEEKLY" || p.interval === "BIWEEKLY" || p.interval === "SPLIT"
            ? startOfDay(payment.dueDate.toDate()).getTime().toString()
            : "monthly";
        const paidDates = p.paidDates || [];
        const paidAmounts = { ...(p.paidAmounts || {}) };
        const occurrenceTime =
          occurrenceKey === "monthly"
            ? null
            : startOfDay(payment.dueDate.toDate()).getTime();
        const alreadyPaid =
          occurrenceKey === "monthly"
            ? p.paid
            : paidDates.some((pd) => startOfDay(pd.toDate()).getTime() === occurrenceTime);

        if (alreadyPaid) {
          const amountToAddBack = paidAmounts[occurrenceKey] ?? 0;
          delete paidAmounts[occurrenceKey];
          const newTotal = Math.max(0, (p.total ?? 0) + amountToAddBack);
          if (occurrenceKey === "monthly") {
            const monthlyOccurrenceTime = startOfDay(payment.dueDate.toDate()).getTime();
            return {
              ...p,
              total: newTotal,
              paid: false,
              paidAmounts,
              paidDates: paidDates.filter(
                (pd) => startOfDay(pd.toDate()).getTime() !== monthlyOccurrenceTime
              ),
            };
          }
          return {
            ...p,
            total: newTotal,
            paidDates: paidDates.filter(
              (pd) => startOfDay(pd.toDate()).getTime() !== occurrenceTime
            ),
            paidAmounts,
          };
        }

        const periodPayment =
          p.amount + (p.id === snowballTargetPaymentId ? snowball : 0);
        const amountToApply = Math.min(periodPayment, p.total ?? 0);
        const newTotal = Math.max(0, (p.total ?? 0) - amountToApply);
        paidAmounts[occurrenceKey] = amountToApply;

        if (occurrenceKey === "monthly") {
          return {
            ...p,
            total: newTotal,
            paid: true,
            paidAmounts,
            paidDates: [
              ...paidDates,
              Timestamp.fromDate(startOfDay(payment.dueDate.toDate())),
            ],
          };
        }
        return {
          ...p,
          total: newTotal,
          paidDates: [
            ...paidDates,
            Timestamp.fromDate(startOfDay(payment.dueDate.toDate())),
          ],
          paidAmounts,
        };
      }

      // Non-DEBT: toggle paid/paidDates
      const occurrenceTime = startOfDay(payment.dueDate.toDate()).getTime();
      const paidDates = p.paidDates || [];
      const alreadyPaid = paidDates.some(
        (pd) => startOfDay(pd.toDate()).getTime() === occurrenceTime
      );
      if (alreadyPaid) {
        const newPaidDates = paidDates.filter(
          (pd) => startOfDay(pd.toDate()).getTime() !== occurrenceTime
        );
        return {
          ...p,
          paidDates: newPaidDates,
          paid: newPaidDates.length > 0,
        };
      }
      return {
        ...p,
        paidDates: [
          ...paidDates,
          Timestamp.fromDate(startOfDay(payment.dueDate.toDate())),
        ],
        paid: true,
      };
    });

    setPayments(updatedPayments);
    await editPayments(updatedPayments, activeBudgetId!);

    // Roll snowball when a debt is paid off (total hit 0)
    const paidOffPayment = updatedPayments.find(
      (p) => p.id === originalId && p.type === "DEBT" && p.total != null && p.total <= 0
    );
    if (paidOffPayment && paidOffPayment.amount != null) {
      showToast(`${paidOffPayment.name} paid off!`);
      const newSnowball = snowball + paidOffPayment.amount;
      setSnowball(newSnowball);
      await editSnowball(activeBudgetId!, newSnowball);
      const remainingDebts = updatedPayments.filter(
        (p) => p.type === "DEBT" && p.total != null && p.total > 0
      );
      const nextTarget =
        remainingDebts.length > 0
          ? remainingDebts.sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0]
          : null;
      const nextId = nextTarget?.id ?? null;
      setSnowballTargetPaymentId(nextId);
      await editSnowballTargetPaymentId(activeBudgetId!, nextId);
    }
  }

  const emptyEnvelope = {
    id: "",
    name: "",
    total: 0,
    spent: 0,
    oneTime: false,
  };

  async function saveNewEnvelope(e: Envelope) {
    if (!e.name.trim()) return;
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
    await editEnvelopes(newEnvelopes, activeBudgetId!);
    await updateBudgetStateAndDBB(
      Number(e.total) * -1,
      activeBudgetId!,
      totalSpendingBudget,
      setTotalSpendingBudget
    );
    resetState();
    showToast("Envelope created");
  }

  async function handleSetShowSpendingPage(e: Envelope) {
    setEnvelopeToEdit(e);
    setShowSpendPage(true);
  }

  async function deleteEnvelope() {
    try {
      setLoadingText("Deleting Envelope...");
      setShowLoading(true);
      const newEnvelopes = [...envelopes].filter(
        (e) => e.id !== envelopeToEdit?.id
      );
      setEnvelopes(newEnvelopes);
      await editEnvelopes(newEnvelopes, activeBudgetId!);
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
          setTotalSpendingBudget
        );
      } else if (originalEnvelope.total < n.total) {
        await updateBudgetStateAndDBB(
          Number(n.total - originalEnvelope.total) * -1,
          activeBudgetId!,
          totalSpendingBudget,
          setTotalSpendingBudget
        );
      }
      const newEnvelopes = [...envelopes].map((e) => (e.id === n.id ? n : e));
      setEnvelopes(newEnvelopes);
      await editEnvelopes(newEnvelopes, activeBudgetId!);
      resetState();
      showToast("Envelope updated");
    } catch (error) {
      console.error("Error editing envelope:", error);
      setShowLoading(false);
      showToast("Failed to update envelope", "error");
    }
  }

  // Edit just the envelopes without affecting budget
  async function editEnvelope(n: Envelope) {
    const originalEnvelope = envelopes.find((e) => e.id === n.id);
    if (!originalEnvelope) return;
    setLoadingText("Editing Envelope...");
    setShowLoading(true);
    const newEnvelopes = [...envelopes].map((e) => (e.id === n.id ? n : e));
    setEnvelopes(newEnvelopes);
    await editEnvelopes(newEnvelopes, activeBudgetId!);
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
    setCashAmount("");
    setCashName("");
    setIsAddingCash(false);
    setShowSpendPage(false);
    setShowBudgetWarning(false);
    setShowLoading(false);
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

  async function handleResetNvelopes() {
    if (!activeBudgetId) return;
    await resetAllNvelopes(envelopes, setEnvelopes, activeBudgetId);
    showToast("Envelopes cleared");
  }

  async function addCashToDb() {
    if (!cashAmount || !cashName || !user) return;
    setLoadingText("Adding Cash...");
    setShowLoading(true);
    const randomId = crypto.randomUUID();
    const date = Timestamp.fromDate(new Date());
    const newOneTimeCash = {
      id: randomId,
      name: cashName,
      amount: Number(cashAmount),
      date,
    };
    await editOneTimeCashAndBudget(
      newOneTimeCash,
      activeBudgetId!,
      totalSpendingBudget
    );
    setTotalSpendingBudget(totalSpendingBudget + Number(cashAmount));
    resetState();
    showToast("Cash added to budget");
  }

  function handleAddCashToEnvelope(envelope: Envelope) {
    setIsAddingCashToEnvelope(true);
    setEnvelopeToEdit(envelope);
  }

  async function addCashToEnvelope() {
    const n = envelopes.find((e) => e.id === envelopeToEdit?.id);
    if (!n || !cashAmount || !user) return;
    setLoadingText("Filling Nvelope...");
    setShowLoading(true);
    const newEnvelopes = [...envelopes].map((e) =>
      e.id === n.id ? { ...n, total: n.total + Number(cashAmount) } : e
    );
    await updateBudgetStateAndDBB(
      Number(cashAmount) * -1,
      activeBudgetId!,
      totalSpendingBudget,
      setTotalSpendingBudget
    );
    await editEnvelopes(newEnvelopes, activeBudgetId!);
    setEnvelopes(newEnvelopes);
    showToast(`${cashAmount} added to ${n.name}`);
    resetState();
  }

  if (showClearEnvelopes)
    return (
      <FullScreen
        theme="DARK"
        onSave={handleResetNvelopes}
        onClose={() => setShowClearNvelopes(false)}
        showButtons
      >
        <div className="flex flex-col items-center">
          <h1 className="text-xl text-my-red-light">⚠️ Are you sure? ⚠️</h1>
          <p>
            This will set{" "}
            <span className="text-my-blue-light">ALL Nvelopes</span>{" "}
            totals/spent to <span className="text-my-green-base">$0.00</span>,
          </p>
          <p>and set them all to "unpaid" status.</p>
          <p>Your budget total will be unaffected.</p>
        </div>
      </FullScreen>
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

  if (!payDate) {
    return (
      <div className="w-full min-h-screen bg-my-blue-dark flex flex-col items-center justify-center p-6 text-center text-my-white-dark">
        <Header links={[{ label: "Settings", href: "/settings" }, { label: "Debt", href: "/debt" }, { label: "Feedback", href: "/feedback" }]} />
        <p className="text-lg mt-8">Set your pay date in Settings to get started.</p>
        <a href="/settings" className="text-my-green-light underline mt-4">Go to Settings</a>
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
        <BigPayment
          handleUpdatePaid={handleUpdatePaid}
          resetState={resetPaymentState}
          handleBack={resetPaymentState}
          paymentToEdit={paymentToEdit}
          handleUpdateBudget={handleUpdateBudget}
          handleDeleteBill={handleDeleteBill}
          onPaymentUpdated={setPaymentToEdit}
        />
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

  async function handleEditSnowball() {
    await editSnowball(activeBudgetId!, snowball);
  }

  if (showEditSnowball)
    return (
      <FullScreen
        onClose={() => setShowEditSnowball(false)}
        onSave={handleEditSnowball}
        showButtons={true}
      >
        <div className="flex justify-center items-center text-center w-full">
          <TextInput
            id="newSnowballAmount"
            placeholder={`$${snowball}`}
            value={snowball.toString()}
            label="New Snowball Amount"
            onChange={(e) => setSnowball(Number(e.target.value))}
          />
        </div>
      </FullScreen>
    );

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
        ;
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
        ;
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
        ;
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
    return <AddIncomeForm showLoading={showLoading} loadingText={loadingText} setIsAddingCash={setIsAddingCash} addCashToDb={addCashToDb} cashAmount={cashAmount} setCashAmount={setCashAmount} cashName={cashName} setCashName={setCashName} />
  }

  if (isAddingCashToEnvelope) {
    return <AddCashToEnvelopeForm showLoading={showLoading} loadingText={loadingText} cashAmount={cashAmount} setCashAmount={setCashAmount} addCashToEnvelope={addCashToEnvelope} envelopeToEdit={envelopeToEdit} setIsAddingCashToEnvelope={setIsAddingCashToEnvelope} />
  }

  return (
    <div className="w-full text-center flex flex-col items-center min-h-screen bg-my-blue-dark overflow-y-auto pb-[4rem]">
      {showLoading && <Loading text={loadingText} />}

      <Header links={[{ label: "Settings", href: "/settings" }, { label: "Debt", href: "/debt" }, { label: "Feedback", href: "/feedback" }]} />

      <main className="flex flex-col items-center pt-[1rem] w-full">
        <ActionButtons
          onPaymentClick={handleAddPayment}
          onCashClick={handleAddCash}
          onEnvelopeClick={handleSetupNewEnvelope}
          onClearClick={() => setShowClearNvelopes(true)}
        />

        <div className="w-full max-w-[40rem] sm:rounded-md border-2 border-my-white-light mt-[1.5rem] overflow-hidden">
          {showSummary ? (
            <div className="w-full  rounded-md ">
              <Summary
                setShowEditSnowball={setShowEditSnowball}
                setShowPaymentsMenu={setShowSummary}
                payments={paymentsThisPeriod}
              />
            </div>
          ) : (
            <div className="w-full rounded-md">
              <ShowAndHide
                onClick={() => setShowSummary(true)}
                label="Show Summary"
                colorScheme="bg-my-black-dark w-full p-0 text-my-white-dark"
                up={false}
                border={false}
                iconSize={25}
              />
            </div>
          )}
          <Nvelopes
            resetState={resetState}
            handleSetupEdit={handleSetupEdit}
            editEnvelope={editEnvelopeAndBudget}
            handleSetShowSpendingPage={handleSetShowSpendingPage}
            handleDeleteEnvelope={handleSetupDelete}
            handleAddCashToEnvelope={handleAddCashToEnvelope}
          />
          <PaymentMap
            paymentsThisPeriod={paymentsThisPeriod}
            handleUpdatePaid={handleUpdatePaid}
            handleEditBill={handleEditPayment}
          />
        </div>
      </main>
    </div>
  );
}
