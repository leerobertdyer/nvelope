import { useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useToast } from "../Context/ToastContext/useToast";
import Header from "../components/Nav/Header";
import type { Payment } from "../types";
import { editPayments, editSnowball } from "../firebase/editData";
import { getBillIntervalLabel, getBillMonthlyAmount, removeVirtualIdPortion } from "../util";
import BigPayment from "../Views/BigPayment";
import { Timestamp } from "firebase/firestore";
import { startOfDay } from "date-fns";
import Summary from "../components/Payments/Summary";
import ShowAndHide from "../components/Buttons/ShowAndHide";
import FullScreen from "../Views/FullScreen";
import MoneyInput from "../components/MoneyInput";

export default function Bills() {
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const { showToast } = useToast();
  const { payments, setPayments, snowball, setSnowball } = useDatabase();

  const [editingBill, setEditingBill] = useState<Payment | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showEditSnowball, setShowEditSnowball] = useState(false);

  const bills = (payments ?? []).filter((p) => p.type === "BILL");

  async function handleUpdateBudget() {
    // No-op on Bills page; budget changes are from MainView
  }

  async function handleUpdatePaid(payment: Payment) {
    const originalId = removeVirtualIdPortion(payment);
    const updatedPayments = (payments ?? []).map((p) => {
      if (p.id !== originalId) return p;
      const occurrenceTime = startOfDay(payment.dueDate.toDate()).getTime();
      const paidDates = p.paidDates ?? [];
      const alreadyPaid = paidDates.some(
        (pd) => startOfDay(pd.toDate()).getTime() === occurrenceTime
      );
      if (alreadyPaid) {
        const newPaidDates = paidDates.filter(
          (pd) => startOfDay(pd.toDate()).getTime() !== occurrenceTime
        );
        return { ...p, paidDates: newPaidDates, paid: newPaidDates.length > 0 };
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
    const updated = updatedPayments.find((p) => p.id === originalId);
    setEditingBill((prev) =>
      prev?.id === originalId ? updated ?? null : prev
    );
    return updated;
  }

  async function handleDeleteBill(p: Payment) {
    const originalId = removeVirtualIdPortion(p);
    const updatedPayments = (payments ?? []).filter(
      (pay) => removeVirtualIdPortion(pay) !== originalId
    );
    setPayments(updatedPayments);
    await editPayments(updatedPayments, activeBudgetId!);
    setEditingBill(null);
    showToast("Bill deleted");
  }

  async function handleEditSnowball() {
    await editSnowball(activeBudgetId!, snowball);
  }

  if (showEditSnowball) {
    return (
      <FullScreen
        theme="DARK"
        onClose={() => setShowEditSnowball(false)}
        onSave={handleEditSnowball}
        showButtons={true}
        saveButtonColor="gold"
        saveButtonText="Save"
        closeButtonText="Back"
      >
        <div className="flex justify-center items-center text-center w-full">
          <MoneyInput
            id="newSnowballAmount"
            label="New Snowball Amount"
            value={snowball}
            onChange={setSnowball}
            placeholder={`$${snowball.toFixed(2)}`}
          />
        </div>
      </FullScreen>
    );
  }

  if (editingBill && user) {
    return (
      <BigPayment
        handleUpdatePaid={handleUpdatePaid}
        resetState={() => setEditingBill(null)}
        handleBack={() => setEditingBill(null)}
        paymentToEdit={editingBill}
        handleUpdateBudget={handleUpdateBudget}
        handleDeleteBill={handleDeleteBill}
        onPaymentUpdated={setEditingBill}
      />
    );
  }

  const defaultLinks = [
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Debt", href: "/debt" },
    { label: "Feedback", href: "/feedback" },
  ];

  return (
    <div className="flex flex-col items-center justify-start py-[5rem] w-full min-h-screen bg-my-blue-dark text-my-white-dark">
      <Header links={defaultLinks} />
      <h1 className="text-3xl mb-4">Bills</h1>
      <div className="w-full max-w-[40rem] rounded-md border-2 border-my-white-light overflow-hidden mb-4">
        {showSummary ? (
          <Summary
            payments={payments ?? []}
            setShowPaymentsMenu={setShowSummary}
            setShowEditSnowball={setShowEditSnowball}
          />
        ) : (
          <ShowAndHide
            onClick={() => setShowSummary(true)}
            label="Show Summary"
            colorScheme="bg-my-black-dark w-full p-0 text-my-white-dark"
            up={false}
            border={false}
            iconSize={25}
          />
        )}
      </div>
      <p className="text-my-white-light text-sm mb-2">Click a bill to edit</p>
      <div className="bg-my-black-base p-4 rounded-md w-[20rem] md:w-[30rem]">
        <div className="grid grid-cols-12 gap-2 text-xs md:text-sm text-my-white-dark mb-2 font-medium">
          <span className="col-span-5 text-left">Name</span>
          <span className="col-span-3 text-left">Schedule</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-2 text-right">/mo</span>
        </div>
        {bills.length === 0 ? (
          <p className="text-my-white-light text-sm">No bills yet.</p>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditingBill(bill)}
              onKeyDown={(e) => e.key === "Enter" && setEditingBill(bill)}
              className="grid grid-cols-12 gap-2 py-2 px-1 -mx-1 rounded cursor-pointer hover:bg-my-black-light text-my-white-light text-xs md:text-sm"
            >
              <span className="col-span-5 text-left truncate">{bill.name}</span>
              <span className="col-span-3 text-left text-my-white-base">
                {getBillIntervalLabel(bill)}
              </span>
              <span className="col-span-2 text-right">
                ${bill.amount.toFixed(2)}
              </span>
              <span className="col-span-2 text-right text-my-green-dark">
                ${getBillMonthlyAmount(bill).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
