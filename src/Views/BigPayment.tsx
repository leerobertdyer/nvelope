import { GiMoneyStack } from "react-icons/gi";
import { IoPencil, IoTrash } from "react-icons/io5";
import { IoAddCircle } from "react-icons/io5";
import type { Payment } from "../types";
import Button from "../components/Buttons/Button";
import { useState } from "react";
import PaymentForm from "../components/Forms/PaymentForm";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { editPayments } from "../firebase/editData";
import { removeVirtualIdPortion } from "../util";
import { format } from "date-fns";
import FullScreen from "./FullScreen";
import TextInput from "../components/TextInput";

interface IProps {
  handleBack: () => void;
  paymentToEdit: Payment | null;
  resetState: () => void;
  handleUpdateBudget: (n: number) => Promise<void>;
  handleUpdatePaid: (payment: Payment) => Promise<void>;
  handleDeleteBill: (p: Payment) => void;
  onPaymentUpdated?: (payment: Payment) => void;
}

export default function BigPayment({
  handleBack,
  paymentToEdit,
  handleUpdateBudget,
  handleUpdatePaid,
  handleDeleteBill,
  onPaymentUpdated,
}: IProps) {
  const [showForm, setShowForm] = useState(false);
  const [p, setP] = useState<Payment | null>(paymentToEdit);
  const [showExtraPaymentForm, setShowExtraPaymentForm] = useState(false);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState("");
  const [extraPaymentError, setExtraPaymentError] = useState<string | null>(
    null,
  );
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const { payments, setPayments } = useDatabase();
  function updatePaid() {
    if (!p) return;
    setP((prev) => prev && { ...prev, paid: !prev.paid });
    handleUpdatePaid(p);
  }

  function handlePaymentUpdated(updated: Payment) {
    setP(updated);
    onPaymentUpdated?.(updated);
  }

  function applyExtraToDebt(extra: number) {
    if (!user || !p || p.type !== "DEBT") return;
    const currentTotal = p.total ?? 0;
    if (currentTotal <= 0) return;
    const amount = Math.min(extra, currentTotal);
    const newTotal = Math.max(0, currentTotal - amount);
    const originalId = removeVirtualIdPortion(p);
    const updatedPayment: Payment = { ...p, id: originalId, total: newTotal };
    const updatedPayments = payments.map((pay) =>
      removeVirtualIdPortion(pay) === originalId ? updatedPayment : pay,
    );
    setPayments(updatedPayments);
    if (activeBudgetId) editPayments(updatedPayments, activeBudgetId);
    setP(updatedPayment);
    onPaymentUpdated?.(updatedPayment);
  }

  async function handlePayExtra() {
    if (!p || p.type !== "DEBT") return;
    const currentTotal = p.total ?? 0;
    if (currentTotal <= 0) return;
    const extra = Number(extraPaymentAmount);
    if (Number.isNaN(extra) || extra <= 0) {
      setExtraPaymentError("Enter a positive amount");
      return;
    }
    if (extra > currentTotal) {
      setExtraPaymentError(`Remaining balance is $${currentTotal.toFixed(2)}`);
      return;
    }
    setExtraPaymentError(null);
    applyExtraToDebt(extra);
    setExtraPaymentAmount("");
    setShowExtraPaymentForm(false);
  }

  function handlePayAll() {
    if (!p || p.type !== "DEBT") return;
    const currentTotal = p.total ?? 0;
    if (currentTotal <= 0) return;
    applyExtraToDebt(currentTotal);
    setShowExtraPaymentForm(false);
    setExtraPaymentAmount("");
    setExtraPaymentError(null);
    handleBack();
  }

  if (showForm && user)
    return (
      <PaymentForm
        paymentToEdit={p}
        user={user}
        handleBack={handleBack}
        handleUpdateBudget={handleUpdateBudget}
        onPaymentUpdated={handlePaymentUpdated}
      />
    );
  if (!p) return <p>Error: Missing Payment To Edit</p>;
  return (
    <div className="absolute inset-0 pt-[3rem] bg-my-white-light w-full overflow-y-auto z-999 h-screen">
      <div className="w-full flex flex-col items-center justify-start">
        <div className="flex flex-col justify-center items-start p-2 w-[17rem] text-my-black-light rounded-md mb-4">
          <h1 className="text-lg text-my-white-dark mb-4 bg-my-black-light text-center rounded-md w-full">
            {p.name}
          </h1>
          <p className="w-full flex justify-between">
            Type:{" "}
            <span
              className={`${p.type === "BILL" ? "text-my-red-dark" : p.type === "FUND" ? "text-my-green-dark" : "text-my-blue-dark"}`}
            >
              {p.type}
            </span>
          </p>
          <p className="w-full flex justify-between">
            {p.type === "FUND" ? "Per Period:" : "Amount:"}{" "}
            <span className="text-my-green-dark">
              ${Number(p.amount).toFixed(2)}
            </span>
          </p>
          <p className="w-full flex justify-between">
            {p.type === "FUND" ? "Target Date:" : "Due:"}{" "}
            <span className="text-my-green-dark">
              {format(
                p.dueDate.toDate(),
                p.type === "FUND" ? "MMM do, yyyy" : "do",
              )}
            </span>
          </p>
          {p.type === "DEBT" && (
            <p className="w-full flex justify-between">
              Remaining Due:{" "}
              <span className="text-my-green-dark">
                ${Number(p.total).toFixed(2)}
              </span>
            </p>
          )}
          {p.type === "FUND" && (
            <p className="w-full flex justify-between">
              Target Amount:{" "}
              <span className="text-my-green-dark">
                ${Number(p.total).toFixed(2)}
              </span>
            </p>
          )}
        </div>
        <br />
        <div className="flex flex-col justify-center items-center gap-2 ">
          <div
            className={`cursor-pointer hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px] ${p.paid && "bg-my-green-dark text-my-white-dark"}`}
            onClick={() => {
              updatePaid();
            }}
          >
            <GiMoneyStack
              className={`p-[2px] ${!p.paid && "border-2"} rounded-md bg-my-green-dark text-white border-my-black-dark`}
              size={27}
            />
            <p className="text-xs">Mark As {!p.paid ? "Paid" : "Not Paid"}</p>
          </div>
          <div
            className="cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
            onClick={() => {
              setShowForm(true);
            }}
          >
            <IoPencil
              className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark"
              size={27}
            />
            <p className="text-xs">Manually Edit Payment</p>
          </div>
          {p.type === "DEBT" && (p.total ?? 0) > 0 && (
            <div
              className="cursor-pointer hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
              onClick={() => {
                setShowExtraPaymentForm(true);
                setExtraPaymentError(null);
                setExtraPaymentAmount("");
              }}
            >
              <IoAddCircle
                className="p-[2px] border-2 rounded-md bg-my-green-dark text-white border-my-black-dark"
                size={27}
              />
              <p className="text-xs">Extra Payment</p>
            </div>
          )}
          <div
            className="cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full mb-8 border-2 rounded-md p-[5px]"
            onClick={() => {
              handleDeleteBill(p);
            }}
          >
            <IoTrash
              className="p-[2px] border-2 rounded-md bg-my-red-dark text-white border-my-black-dark"
              size={27}
            />
            <p className="text-xs">Delete Payment</p>
          </div>
          <Button onClick={handleBack} color="red">
            Go Back
          </Button>
        </div>
        {showExtraPaymentForm && p?.type === "DEBT" && (p.total ?? 0) > 0 && (
          <FullScreen theme="DARK">
            <div className="flex flex-col items-center justify-center gap-2 w-full">
              <p className="text-sm font-medium mb-1">Extra Payment</p>
              <p className="text-xs text-my-white-dark mb-2">
                Remaining: ${(p.total ?? 0).toFixed(2)}
              </p>
              <Button color="green" onClick={handlePayAll}>
                Pay All
              </Button>
              <TextInput
                id="extraPaymentAmount"
                label=""
                value={extraPaymentAmount}
                onChange={(e) => {
                  setExtraPaymentAmount(e.target.value);
                  setExtraPaymentError(null);
                }}
                placeholder="Amount"
              />
              <Button color="green" onClick={handlePayExtra}>
                Apply
              </Button>
              {extraPaymentError && (
                <p className="text-xs text-my-red-light mb-2">
                  {extraPaymentError}
                </p>
              )}
              <Button
                color="red"
                onClick={() => {
                  setShowExtraPaymentForm(false);
                  setExtraPaymentAmount("");
                  setExtraPaymentError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </FullScreen>
        )}
      </div>
    </div>
  );
}
