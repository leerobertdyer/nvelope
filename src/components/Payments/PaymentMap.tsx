import { format, getMonth } from "date-fns";
import { useEffect, useState } from "react";
import type { Payment } from "../../types";
import {
  deriveIsPaid,
  getEffectivePaymentAmount,
} from "../../util";
import {
  IoIosCheckmarkCircle,
  IoIosCheckmarkCircleOutline,
} from "react-icons/io";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import { useTransactions } from "../../Context/TransactionContext/useTransactions";
import TinyTransaction from "../Transactions/TinyTransaction";

interface PaymentMapProps {
  handleUpdatePaid: (payment: Payment) => void;
  handleEditBill: (payment: Payment) => void;
  paymentsThisPeriod: Payment[];
}
export default function PaymentMap({
  handleEditBill,
  handleUpdatePaid,
  paymentsThisPeriod,
}: PaymentMapProps) {
  const { payments } = useDatabase();
  const { transactions } = useTransactions();
  const [view, setView] = useState<"CURRENT" | "ALL" | "TRANSACTIONS">(
    "CURRENT"
  );
  const [allMonthlyPayments, setAllMonthlyPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const currentMonth = getMonth(new Date());

    const filtered = payments.filter((p) => {
      if (p.type === "DEBT" && typeof p.total === "number" && p.total <= 0) {
        return false;
      }
      if (p.type === "FUND") {
        return false;
      }
      if (
        p.interval === "YEARLY" &&
        p.dueDate.toDate().getMonth() !== currentMonth
      ) {
        return false;
      }
      return true;
    });

    setAllMonthlyPayments(filtered);
  }, [payments]);

  function RenderPayment({
    p,
    hidePayments,
  }: {
    p: Payment;
    hidePayments?: boolean;
  }) {
    const isSplitPayment = p.id.includes("-SPLIT-");
    const isPaid = deriveIsPaid(p);
    const typeColor =
      p.type === "BILL"
        ? "bg-my-red-dark text-my-white-light"
        : p.type === "DEBT"
          ? "bg-my-blue-dark text-my-white-light"
          : "bg-my-green-dark text-my-white-light";

    return (
      <div
        key={p.id}
        onClick={() => handleEditBill(p)}
        className={`flex py-2 justify-center items-center w-full border-b-2 border-my-black-dark cursor-pointer
          ${isPaid && !hidePayments ? "bg-my-white-dark/20" : "bg-my-white-dark/50"} ${hidePayments ? "rounded-md" : ""}`}
      >
        <div className="justify-center items-center w-full flex rounded-sm gap-2">
          {!hidePayments && (
            <button
              type="button"
              className="flex items-center justify-center flex-1 h-12 p-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdatePaid(p);
              }}
              aria-label={isPaid ? "Mark as not paid" : "Mark as paid"}
            >
              {isPaid ? (
                <IoIosCheckmarkCircle color="#076346" size={18} />
              ) : (
                <IoIosCheckmarkCircleOutline color="#076346" size={18} />
              )}
            </button>
          )}

          <div className="w-10 h-10 mr-2 rounded-md bg-my-white-light border border-my-black-light overflow-hidden shrink-0">
            <div className="h-2 bg-my-red-base" />
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-bold">
                {format(p.dueDate.toDate(), "do")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-start text-xs flex-[5] gap-4 px-2">
            <span
              className={`text-[10px] px-2 rounded w-[3rem] text-center ${isSplitPayment ? "bg-my-green-dark text-my-white-light" : typeColor}`}
            >
              {isSplitPayment ? "SPLIT" : p.type?.toUpperCase()}
            </span>
            <p
              className={`text-sm truncate ${isPaid && "text-my-black-light"}`}
            >
              {p.name}
            </p>
          </div>

          {p.total != null ? (
            <div className="flex items-center justify-end gap-[2px] w-16 mr-[1rem]">
              <p className={`w-fit text-sm ${isPaid && "text-my-black-light"}`}>
                ${Math.ceil(getEffectivePaymentAmount(p))}
              </p>
              <p>/</p>
              <p className={`w-fit text-sm ${isPaid && "text-my-black-light"}`}>
                {Math.ceil(p.total)}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-[2px] w-16 mr-[1rem]">
              <p className={`w-fit text-sm ${isPaid && "text-my-black-light"}`}>
                ${getEffectivePaymentAmount(p).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPaymentsTotal = `$${paymentsThisPeriod
    .reduce(
      (acc, p) => (deriveIsPaid(p) ? acc : getEffectivePaymentAmount(p) + acc),
      0
    )
    .toFixed(2)}`;

  const monthlyPaymentsMinusFunds = `$${allMonthlyPayments
    .reduce((acc, p) => {
      if (p.type === "FUND") return acc;
      return p.amount + acc;
    }, 0)
    .toFixed(2)}`;

  return (
    <div className="h-fit w-full mb-8">
      <div className="w-full flex items-center justify-between border-y-2 bg-my-white-base">
        <button
          type="button"
          onClick={() => setView("CURRENT")}
          className={`border-r-2 text-center px-4 py-2 cursor-pointer ${view === "CURRENT" ? "bg-my-white-dark" : "underline"}`}
        >
          Current Payments
        </button>
        <button
          type="button"
          onClick={() => setView("ALL")}
          className={`border-r-2 px-8 py-2 cursor-pointer ${view === "ALL" ? "bg-my-white-dark" : "underline"}`}
        >
          All Payments
        </button>
        <button
          type="button"
          onClick={() => setView("TRANSACTIONS")}
          className={`py-2 px-4 cursor-pointer ${view === "TRANSACTIONS" ? "bg-my-white-dark" : "underline"}`}
        >
          Transactions
        </button>
      </div>
      <div className="h-fit w-full mb-8 overflow-y-auto">
        {view === "CURRENT" && (
          <div className="p-4 w-full">
            <div className="w-full bg-my-green-dark/40 p-2 text-my-black-dark flex items-center justify-center gap-4 rounded-t-md">
              <p>Remainder Due This Period:</p>
              <p>{currentPaymentsTotal}</p>
            </div>
            {paymentsThisPeriod.map((p) => (
              <RenderPayment key={p.id} p={p} />
            ))}
          </div>
        )}
        {view === "ALL" && (
          <div className="p-4 w-full">
            <div className="w-full bg-my-green-dark/40 p-2 text-my-black-dark flex items-center justify-center gap-4 rounded-t-md">
              <p>Total Due Monthly:</p>
              <p>{monthlyPaymentsMinusFunds}</p>
            </div>
            {[...allMonthlyPayments]
              .sort(
                (a, b) =>
                  a.dueDate.toDate().getDate() - b.dueDate.toDate().getDate()
              )
              .map((p) => (
                <RenderPayment key={p.id} p={p} hidePayments />
              ))}
          </div>
        )}
        {view === "TRANSACTIONS" && transactions.length > 0 && (
          <div className="p-4 w-full">
            <div className="w-full bg-my-green-dark/40 p-2 text-my-black-dark flex items-center justify-center gap-4 rounded-t-md">
              <p>Transaction Log For Current Pay Period</p>
            </div>
            {transactions.map((t) => (
              <TinyTransaction key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
