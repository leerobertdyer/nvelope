import { useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useToast } from "../Context/ToastContext/useToast";
import Header from "../components/Nav/Header";
import type { Payment } from "../../../web/src/types";
import { editIsNewUser, editPayments } from "../firebase/editData";
import { getBillIntervalLabel, paymentsTotal, removeVirtualIdPortion } from "../../../web/src/util";
import BigPayment from "../Views/BigPayment";
import { Timestamp } from "firebase/firestore";
import { format, startOfDay } from "date-fns";
import PageTour from "../components/PageTour";

export default function Bills() {
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const { showToast } = useToast();
  const { payments, setPayments, payPeriodInterval, payDate, isNewUser, setIsNewUser } = useDatabase();

  const [editingBill, setEditingBill] = useState<Payment | null>(null);

  const bills = (payments ?? []).filter((p) => p.type === "BILL");
  bills.sort((a, b) => a.dueDate.toDate().getDate() - b.dueDate.toDate().getDate());

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
          Your recurring <span className="text-my-red-light">bills</span> appear here. Tap a bill to mark it paid for a given due date or to edit it. Add new bills from Home using the Payment button.
        </p>
      </PageTour>
      <Header links={defaultLinks} />
      <h1 className="text-3xl mb-4">Bills</h1>
      {payDate && payPeriodInterval && (
        <div className="flex gap-2 justify-center w-fit max-w-[20rem] text-my-white-light rounded-md border-2 border-my-white-light bg-my-black-dark border-my-black-light p-3 mb-4">
            Due monthly
            <span className="text-my-red-base">
              ${Math.ceil(paymentsTotal(payments ?? [], payPeriodInterval, payDate).totalMonthlyPayments)}
            </span>
        </div>
      )}
      <div className="bg-my-black-base p-4 rounded-md w-[20rem] md:w-[30rem]">
        <div className="grid grid-cols-12 gap-2 text-xs md:text-sm text-my-white-dark mb-2 font-medium">
          <span className="col-span-5 text-left">Name</span>
          <span className="col-span-3 text-left">Schedule</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-2 text-right">Day</span>
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
              className="grid grid-cols-12 gap-2 py-2 px-1 -mx-1 rounded text-my-white-light text-xs md:text-sm"
            >
              <span className="col-span-5 text-left truncate">{bill.name}</span>
              <span className="col-span-3 text-left text-my-white-base">
                {getBillIntervalLabel(bill)}
              </span>
              <span className="col-span-2 text-right text-my-red-light">
                ${bill.amount.toFixed(2)}
              </span>
              <span className="col-span-2 text-right text-my-green-light">
                {format(bill.dueDate.toDate(), "do")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
