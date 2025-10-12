// Page to display all bills and debts that are recurring
import Button from "../components/Button";
import { paymentsTotal, recalculateBudget } from "../util";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { type Payment } from "../types";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import {
  editPayments,
  editSnowball,
  editTotalSpendingBudget,
} from "../firebase/editData";
import Header from "../components/Header";
import PaymentMap from "../components/PaymentMap";
import PaymentForm from "../components/forms/PaymentForm";
import ShowAndHide from "../components/ShowAndHide";
import FullScreen from "../components/FullScreen";
import TextInput from "../components/TextInput";
import { startOfDay } from "date-fns";
import { Timestamp } from "firebase/firestore";

export default function Payments() {
  const {
    payments,
    setPayments,
    payDate,
    payPeriodInterval,
    setTotalSpendingBudget,
    totalSpendingBudget,
    snowball,
    setSnowball,
  } = useDatabase();
  const { user } = useAuth();

  const [showPaymentsMenu, setShowPaymentsMenu] = useState(true);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [showPaymentInputs, setShowPaymentInputs] = useState(false);
  const [showDeletePayment, setShowDeletePayment] = useState(false);
  const [showEditSnowball, setShowEditSnowball] = useState(false);

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
    const updatedPayments = payments.filter((p) => p.id !== paymentToEdit.id);
    setPayments(updatedPayments);
    await editPayments(updatedPayments, user.uid);
    // Update the budget in DB only if the bill was unpaid and in interval
    if (paymentToEdit.isInInterval && !paymentToEdit.paid) {
      await handleUpdateBudget(paymentToEdit.amount);
    }
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
          
          console.log("HEre", occurrenceTime, p.paidDates, alreadyPaid)
          if (alreadyPaid) {
            // REMOVE the date (mark unpaid)
            return {
              ...p,
              paidDates: paidDates.filter(
                (pd) => startOfDay(pd.toDate()).getTime() !== occurrenceTime
              )
            };
          } else {
            // ADD the date (mark paid)
            return {
              ...p,
              paidDates: [...paidDates, Timestamp.fromDate(startOfDay(payment.dueDate.toDate()))]
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

  if (showDeletePayment) {
    return (
      <div className="absolute inset-0 w-screen h-screen z-100 select-none">
        <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
          {!paymentToEdit?.paid && paymentToEdit?.isInInterval ? (
            <p className="text-my-white-light text-center">
              Removing this bill will add
              <span className="text-my-green-base px-[3px]">
                ${paymentToEdit.amount.toFixed(2)}
              </span>
              to your available budget
            </p>
          ) : (
            <p className="text-my-white-light text-center px-2">
              Removing this bill will not change your available balance of
              <span className="text-my-green-base px-[3px]">
                ${totalSpendingBudget.toFixed(2)}
              </span>
              because it's either paid already, or not in the current interval.
            </p>
          )}
          <p className="p-4 rounded-md text-my-white-dark w-full text-center">
            Are you sure you want to delete {paymentToEdit?.name}?
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

  if (showPaymentInputs && user)
    return (
      <PaymentForm
        handleBack={resetPaymentState}
        paymentToEdit={paymentToEdit}
        user={user}
        handleUpdateBudget={handleUpdateBudget}
      />
    );

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

  return (
    <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-base overflow-y-auto">
      <Header
        links={[
          { label: "Settings", href: "/settings" },
          { label: "Home", href: "/" },
        ]}
      />
      <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll overflow-x-hidden gap-2">
        {showPaymentsMenu ? (
          <div className="flex flex-col gap-2 mb-2 items-center justify-center w-full border-b-2 border-my-white-light pb-2">
            <h3 className="pt-2 rounded-md text-my-white-dark w-full text-center text-xl md:text-2xl">
              Payments
            </h3>
            <div className="bg-my-black-dark border-my-black-light border-2 rounded-md p-2">
              <div className="text-lg md:text-xl w-full flex justify-between text-my-white-light">
                Due Monthly
                <span className="text-my-red-base ml-2">
                  $
                  {Math.ceil(
                    paymentsTotal(payments, payPeriodInterval, payDate)
                      .totalMonthlyPayments
                  )}
                </span>
              </div>
              <div className="text-lg md:text-xl w-full flex justify-between text-my-white-light">
                Remaining Debt
                <span className="text-my-blue-dark ml-2">
                  $
                  {Math.ceil(
                    paymentsTotal(payments, payPeriodInterval, payDate)
                      .remainingDebt
                  )}
                </span>
              </div>
              <div
                className="text-lg md:text-xl w-full flex justify-between text-my-white-light"
                onClick={() => setShowEditSnowball(true)}
              >
                Snowball ❄️
                <span className="text-my-blue-light ml-2">${snowball}</span>
              </div>
            </div>
            <ShowAndHide
              onClick={() => setShowPaymentsMenu(false)}
              label="Hide Summary"
              up={true}
              border={false}
              iconSize={25}
            />
          </div>
        ) : (
          <ShowAndHide
            onClick={() => setShowPaymentsMenu(true)}
            label="Show Summary"
            up={false}
            border={false}
            iconSize={25}
          />
        )}
        <button
          className="h-[2.5rem] w-[8rem] bg-my-red-dark text-my-white-light hover:bg-my-black-light  rounded-md p-2 border-2 border-my-white-light cursor-pointer"
          onClick={() => handleAddPayment()}
        >
          New Payment+
        </button>
        {payments.length === 0 && (
          <p className="text-my-white-light text-center text-xl md:text-2xl mb-4">
            No payments due this pay period
          </p>
        )}
        {payments.length > 0 && (
          <PaymentMap
            handleUpdatePaid={handleUpdatePaid}
            handleEditBill={handleEditPayment}
            handleDeleteBill={handleDeleteBill}
          />
        )}
        <div className="fixed bottom-[-.05rem] flex flex-wrap gap-2 items-center justify-center w-screen mt-4 text-my-white-light bg-my-black-dark p-2 border-t-2 border-my-white-light">
          <div className="flex items-center justify-start gap-2">
            <p>Bill</p>
            <div className="rounded-sm w-[1rem] h-[1rem] bg-my-red-light border-2 border-my-white-dark mr-4"></div>
          </div>
          <div className="flex items-center justify-start gap-2">
            <p>Debt</p>
            <div className="rounded-sm w-[1rem] h-[1rem] bg-my-blue-light border-2 border-my-white-dark mr-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
