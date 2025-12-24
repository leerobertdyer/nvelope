import { useEffect, useState } from "react";
import Header from "../components/Header";
import Nvelopes from "../components/Nvelopes";
import { type Envelope, type Payment } from "../types";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import {
  backupUserData,
  editEnvelopes,
  editOneTimeCashAndBudget,
  editPayments,
  editRent,
  editSnowball,
  editTotalSpendingBudget,
  shouldBackupUserData,
} from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import Button from "../components/Buttons/Button";
import Nvelope from "../components/Nvelope";
import { Timestamp } from "firebase/firestore";
import {
  getVirtualPaymentsForPeriod,
  isDateInCurrentPayPeriod,
  recalculateBudget,
  removeVirtualIdPortion,
  resetAllNvelopes,
  updateBudgetStateAndDBB,
} from "../util";
import { GiEnvelope, GiMoneyStack } from "react-icons/gi";
import Loading from "../components/Loading";
import FullScreen from "../components/Views/FullScreen";
import TextInput from "../components/TextInput";
import type { User } from "firebase/auth";
import { startOfDay } from "date-fns";
import PaymentMap from "../components/PaymentMap";
import ShowAndHide from "../components/Buttons/ShowAndHide";
import Summary from "../components/Summary";
import BigPayment from "../components/Views/BigPayment";
import PaymentForm from "../components/Forms/PaymentForm";

export default function MainEnvelopesView() {
  const { user } = useAuth();
  const {
    totalSpendingBudget,
    setTotalSpendingBudget,
    envelopes,
    setEnvelopes,
    rent,
    setRent,
    payDate,
    payPeriodInterval,
    snowball,
    setSnowball,
    payments,
    setPayments,
  } = useDatabase();

  const [showSummary, setShowSummary] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [showPaymentInputs, setShowPaymentInputs] = useState(false);
  const [showDeletePayment, setShowDeletePayment] = useState(false);
  const [showEditSnowball, setShowEditSnowball] = useState(false);

  const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
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

  const [paymentsThisPeriod, setPaymentsThisPeriod] = useState(payments);

  // On load check to make backup
  useEffect(() => {
    if (!user) return;
    async function backupUser(user: User) {
      const shouldBackup = await shouldBackupUserData(user);
      if (shouldBackup) {
        console.log(`Backup initiated... `);
        await backupUserData(user);
      }
    }
    backupUser(user);
  }, [user]);

  useEffect(() => {
    if (!payDate || !payments || !payPeriodInterval) return;
    setPaymentsThisPeriod(
      getVirtualPaymentsForPeriod(payments, payPeriodInterval, payDate)
    );
  }, [payments, payDate, payPeriodInterval]);

  async function handleEditPayment(p: Payment) {
    setPaymentToEdit(p);
    setShowPaymentInputs(true);
  }

  async function handleUpdateBudget(diffAmount: number) {
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, user!.uid);
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
    await editPayments(updatedPayments, user.uid);
    resetPaymentState();
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
    setPayments((prev) => {
      const originalId = payment.id.includes("-WEEKLY-")
        ? payment.id.split("-WEEKLY-")[0]
        : payment.id.includes("-BIWEEKLY-")
          ? payment.id.split("-BIWEEKLY-")[0]
          : payment.id;

      const updatedPayments = prev.map((p) => {
        if (p.id !== originalId) return p;

        // For weekly/biweekly, toggle the specific occurrence in paidDates
        if (p.interval === "WEEKLY" || p.interval === "BIWEEKLY") {
          const occurrenceTime = startOfDay(payment.dueDate.toDate()).getTime();
          const paidDates = p.paidDates || [];

          // Check if this date is already paid
          const alreadyPaid = paidDates.some(
            (pd) => startOfDay(pd.toDate()).getTime() === occurrenceTime
          );

          if (alreadyPaid) {
            // REMOVE the date (mark unpaid)
            return {
              ...p,
              paidDates: paidDates.filter(
                (pd) => startOfDay(pd.toDate()).getTime() !== occurrenceTime
              ),
            };
          } else {
            // ADD the date (mark paid)
            return {
              ...p,
              paidDates: [
                ...paidDates,
                Timestamp.fromDate(startOfDay(payment.dueDate.toDate())),
              ],
            };
          }
        }

        // For monthly/yearly, toggle simple paid boolean
        return { ...p, paid: !p.paid };
      });

      editPayments(updatedPayments, user!.uid);
      return updatedPayments;
    });
  }

  const emptyEnvelope = {
    id: "",
    name: "",
    total: 0,
    spent: 0,
    oneTime: false,
  };

  async function handleEditRent(newRentAmount: number) {
    if (!rent) return;
    setLoadingText("Editing Rent...");
    setShowLoading(true);
    await editRent(newRentAmount, user!.uid);
    setRent(newRentAmount);
    resetState();
  }

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
    await editEnvelopes(newEnvelopes, user!.uid);
    await updateBudgetStateAndDBB(
      Number(e.total) * -1,
      user!,
      totalSpendingBudget,
      setTotalSpendingBudget
    );
    resetState();
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
      await editEnvelopes(newEnvelopes, user!.uid);
      resetState();
    } catch (error) {
      console.error("Error deleting envelope:", error);
      setShowLoading(false);
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
          user!,
          totalSpendingBudget,
          setTotalSpendingBudget
        );
      } else if (originalEnvelope.total < n.total) {
        await updateBudgetStateAndDBB(
          Number(n.total - originalEnvelope.total) * -1,
          user!,
          totalSpendingBudget,
          setTotalSpendingBudget
        );
      }
      const newEnvelopes = [...envelopes].map((e) => (e.id === n.id ? n : e));
      setEnvelopes(newEnvelopes);
      await editEnvelopes(newEnvelopes, user!.uid);
      resetState();
    } catch (error) {
      console.error("Error editing envelope:", error);
      setShowLoading(false);
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
    await editEnvelopes(newEnvelopes, user!.uid);
    resetState();
  }

  function handleSetupEdit(n: Envelope) {
    setIsDeleting(false);
    setEnvelopeToEdit(n);
    setIsEditingEnvelope(true);
  }

  function handleSetupNewEnvelope() {
    setEnvelopeToEdit(null);
    setIsAdding(true);
  }

  function resetState() {
    setIsAdding(false);
    setIsEditingEnvelope(false);
    setIsDeleting(false);
    setEnvelopeToEdit(null);
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
      setEnvelopeToEdit(envelopes.find((e) => e.id === id) || null);
    }
    setIsEditingEnvelope(false);
    setIsAdding(false);
    setIsDeleting(true);
  }

  function handleAddCash() {
    setIsAddingCash(true);
  }

  async function handleResetNvelopes() {
    if (!user) return;
    await resetAllNvelopes(envelopes, setEnvelopes, user.uid);
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
      user.uid,
      totalSpendingBudget
    );
    setTotalSpendingBudget(totalSpendingBudget + Number(cashAmount));
    resetState();
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
      user,
      totalSpendingBudget,
      setTotalSpendingBudget
    );
    await editEnvelopes(newEnvelopes, user.uid);
    setEnvelopes(newEnvelopes);
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
         
            <p className="text-my-white-light text-center">
              Removing this bill will not change your available budget.
            </p>
          
          <p className="p-4 rounded-md text-my-white-dark w-full text-center">
            Are you sure you want to delete "{paymentToEdit.name}"?
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

  if (!payDate) return;

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
    await editSnowball(user!, snowball);
  }

  if (showEditSnowball)
    return (
      <FullScreen
        onClose={() => setShowEditSnowball(false)}
        onSave={handleEditSnowball}
        showButtons={true}
      >
        <TextInput
          id="newSnowballAmount"
          placeholder={`$${snowball}`}
          value={snowball.toString()}
          label="New Snowball Amount"
          onChange={(e) => setSnowball(Number(e.target.value))}
        />
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
          editRent={handleEditRent}
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
    return (
      <>
        {showLoading && <Loading text={loadingText} />}
        <FullScreen
          showButtons
          onClose={() => setIsAddingCash(false)}
          onSave={addCashToDb}
        >
          <div className="w-full max-w-[20rem] m-auto h-fit flex flex-col items-center justify-center">
            <h3 className="p-2 text-white text-lg mb-4">Add Cash</h3>
            <TextInput
              label="Amount To Add"
              id="newCashAmount"
              textOrNumber="number"
              placeholder="Amount"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />
            <TextInput
              id="newCashName"
              label="Name"
              value={cashName}
              onChange={(e) => setCashName(e.target.value)}
              placeholder="Name"
            />
          </div>
        </FullScreen>
      </>
    );
  }

  if (isAddingCashToEnvelope) {
    return (
      <>
        {showLoading && <Loading text={loadingText} />}
        <div className="absolute inset-0 bg-my-white-dark text-mywhite-dark w-full h-screen flex flex-col items-center justify-center">
          <h3 className="p-2 text-my-green-dark mb-4">
            Add Cash to {envelopeToEdit?.name}
          </h3>
          <input
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            type="number"
            placeholder="Amount"
            className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative"
          />
          <div className="flex flex-col w-full items-center gap-2">
            <Button onClick={addCashToEnvelope} color="green">
              Add
            </Button>
            <Button
              onClick={() => setIsAddingCashToEnvelope(false)}
              color="red"
            >
              Go Back
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full text-center flex flex-col items-center min-h-screen bg-my-blue-dark overflow-y-auto pb-[4rem]">
      {showLoading && <Loading text={loadingText} />}

      <Header links={[{ label: "Settings", href: "/settings" }]} />

      <main className="flex flex-col items-center pt-[1rem] w-full">
        <div className="flex w-full justify-center gap-4 items-center">
          <div
            className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark  text-my-red-dark shadow-my-red-light"
            onClick={handleAddPayment}
          >
            <GiMoneyStack className="cursor-pointer border-2 rounded-md  w-[2rem] h-[2rem] p-[2px] bg-my-white-base" />
            <p className="text-xs">Payment</p>
          </div>
          <div
            className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-green-dark  text-my-green-dark shadow-my-green-light"
            onClick={handleAddCash}
          >
            <GiMoneyStack className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-base " />
            <p className="text-xs">Add Cash</p>
          </div>
          <div
            className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark shadow-my-black-dark"
            onClick={handleSetupNewEnvelope}
          >
            <GiEnvelope className="cursor-pointer border-2 rounded-md  w-[2rem] h-[2rem] p-[2px] bg-my-white-base" />
            <p className="text-xs">Nvelope+</p>
          </div>
          <div
            className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark  text-my-red-dark shadow-my-red-light"
            onClick={() => setShowClearNvelopes(true)}
          >
            <GiEnvelope className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-base " />
            <p className="text-xs">Clear</p>
          </div>
        </div>

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
            handleEditRent={handleEditRent}
            handleAddCashToEnvelope={handleAddCashToEnvelope}
          />
          <PaymentMap
            paymentsThisPeriod={paymentsThisPeriod}
            handleUpdatePaid={handleUpdatePaid}
            handleEditBill={handleEditPayment}
          />
        </div>
        {/* <Expenses expenses={expenses} /> */}
      </main>
    </div>
  );
}
