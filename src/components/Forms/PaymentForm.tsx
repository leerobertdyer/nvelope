import Calendar from "react-calendar";
import { BIWEEKLY, MONTHLY, SPLIT, WEEKLY, YEARLY } from "../../constants";
import type { Interval, Payment } from "../../types";
import Button from "../Buttons/Button";
import Popup from "../Popup";
import type { Value } from "react-calendar/src/shared/types.js";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import type { User } from "firebase/auth";
import { editPayments } from "../../firebase/editData";
import {
  generateFreshPayment,
  isDateInCurrentPayPeriod,
  removeVirtualIdPortion,
} from "../../util";
import { format, addDays } from "date-fns";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import FullScreen from "../../Views/FullScreen";
import TextInput from "../TextInput";
import PaymentTypeSelector, {
  type PaymentTypeOption,
} from "./PaymentTypeSelector";

interface IPaymentForm {
  paymentToEdit: Payment | null;
  user: User;
  handleUpdateBudget: (d: number) => Promise<void>;
  handleBack: () => void;
}

export default function PaymentForm({
  paymentToEdit,
  user,
  handleUpdateBudget,
  handleBack,
}: IPaymentForm) {
  const { payDate, payPeriodInterval, payments, setPayments } = useDatabase();

  const [showPaymentError, setShowPaymentError] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState<Value | null>(
    paymentToEdit?.dueDate.toDate() ?? null
  );
  const [newPayment, setNewPayment] = useState<Payment>(
    paymentToEdit ?? generateFreshPayment()
  );

  // For new payments, start with type selection
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentTypeOption | null>(
      paymentToEdit ? getPaymentTypeFromPayment(paymentToEdit) : null
    );

  // Helper to determine PaymentTypeOption from existing Payment
  function getPaymentTypeFromPayment(p: Payment): PaymentTypeOption {
    if (p.interval === SPLIT) {
      return p.recurring === false ? "SPLIT_SAVEUP" : "SPLIT_RECURRING";
    }
    return p.type === "DEBT" ? "DEBT" : "BILL";
  }

  // Handle payment type selection
  function handleSelectPaymentType(type: PaymentTypeOption) {
    setSelectedPaymentType(type);

    switch (type) {
      case "BILL":
        setNewPayment({
          ...newPayment,
          type: "BILL",
          interval: undefined, // Let user choose
          recurring: undefined,
        });
        break;
      case "DEBT":
        setNewPayment({
          ...newPayment,
          type: "DEBT",
          interval: undefined, // Let user choose
          recurring: undefined,
        });
        break;
      case "SPLIT_RECURRING":
        setNewPayment({
          ...newPayment,
          type: "BILL",
          interval: SPLIT,
          recurring: true,
        });
        break;
      case "SPLIT_SAVEUP":
        setNewPayment({
          ...newPayment,
          type: "DEBT",
          interval: SPLIT,
          recurring: false,
          total: newPayment.amount,
        });
        break;
    }
  }

  function resetForm() {
    setShowPaymentError(false);
    setNewPayment(generateFreshPayment());
    setSelectedPaymentType(null);
  }

  function handleSetNewInterval(i: Interval) {
    setNewPayment({
      ...newPayment,
      interval: i,
      recurring: undefined, // Clear recurring for non-SPLIT intervals
    });
  }

  function handleCalendarChange(value: Value) {
    setNewPaymentDate(value);
    if (value instanceof Date) {
      setNewPayment({
        ...newPayment,
        dueDate: Timestamp.fromDate(value),
      });
    }
  }

  async function editPayment() {
    if (!user || !newPayment || !paymentToEdit) return;
    // If payment is in the interval and we change the price, we need to update the budget
    const diffAmount = newPayment.amount - paymentToEdit.amount;
    const originalPaymentToEditId = removeVirtualIdPortion(paymentToEdit);
    setPayments((prev) => {
      const updatedPayments = prev.map((p) => {
        const currentPaymentOriginalId = removeVirtualIdPortion(p);
        return currentPaymentOriginalId === originalPaymentToEditId
          ? { ...newPayment, id: originalPaymentToEditId }
          : p;
      });
      editPayments(updatedPayments, user.uid);
      return updatedPayments;
    });
    if (paymentToEdit.isInInterval && !paymentToEdit.paid) {
      await handleUpdateBudget(diffAmount);
    }
    resetForm();
  }

  async function addPayment() {
    if (!user || !newPayment) return;
    if (payments.some((p) => p.id === newPayment.id)) {
      setShowPaymentError(true);
      return;
    }
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    await editPayments(updatedPayments, user.uid);
    if (
      payDate &&
      isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate.toDate(),
        newPayment.dueDate.toDate()
      ) &&
      !newPayment.paid
    ) {
      await handleUpdateBudget(newPayment.amount * -1);
    }
    resetForm();
  }

  async function handleSavePayment() {
    if (paymentToEdit) await editPayment();
    else await addPayment();
    resetForm();
    handleBack();
  }

  function handleClickBack() {
    resetForm();
    handleBack();
  }

  // Get label for payment type
  function getPaymentTypeLabel(): string {
    switch (selectedPaymentType) {
      case "BILL":
        return "Bill";
      case "DEBT":
        return "Debt";
      case "SPLIT_RECURRING":
        return "Split Recurring";
      case "SPLIT_SAVEUP":
        return "Split Save-Up";
      default:
        return "";
    }
  }

  return (
    <FullScreen>
      {showPaymentError && (
        <Popup type="error">Payment name already exists</Popup>
      )}
      <h1 className="text-center w-full text-my-white-light p-2 text-3xl mb-4">
        {paymentToEdit ? "Edit Payment" : "Add Payment"}
      </h1>
      <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll w-full overflow-x-hidden">
        <div className="flex flex-col gap-2 items-center justify-center py-[2rem] text-my-white-dark bg-my-green-dark w-full max-w-[35rem] md:max-w-[60rem]text-center rounded-md">
          {/* Step 1: Payment Type Selection (for new payments only) */}
          {!selectedPaymentType && !paymentToEdit ? (
            <div className="py-4 w-full">
              <PaymentTypeSelector
                onSelect={handleSelectPaymentType}
                onBack={handleClickBack}
              />
            </div>
          ) : (
            <>
              {/* Show current type with option to change */}
              {!paymentToEdit && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-my-white-light">
                    Type:{" "}
                    <span className="font-bold">{getPaymentTypeLabel()}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentType(null)}
                    className="text-xs text-my-blue-base underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Payment Name */}
              <TextInput
                id="name"
                label=""
                value={newPayment?.name.toLowerCase()}
                placeholder="Enter payment name"
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    name: e.target.value.toLowerCase(),
                  })
                }
              />

              {/* Payment Amount */}
              {newPayment.name && (
                <div className="flex flex-col items-center w-full mb-4">
                  <label className="text-sm mb-1">
                    {selectedPaymentType === "SPLIT_SAVEUP"
                      ? "Target Amount"
                      : "Amount"}
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min={0}
                    className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                    value={newPayment?.amount || ""}
                    onChange={(e) => {
                      const amount = Number(e.target.value);
                      setNewPayment({
                        ...newPayment,
                        amount,
                        // Sync total for save-up SPLIT payments
                        ...(selectedPaymentType === "SPLIT_SAVEUP"
                          ? { total: amount }
                          : {}),
                      });
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder={
                      selectedPaymentType === "SPLIT_SAVEUP"
                        ? "Target amount to save"
                        : "Payment amount"
                    }
                  />
                  {selectedPaymentType === "SPLIT_RECURRING" && (
                    <p className="text-xs text-my-green-dark mt-1">
                      This monthly amount will be split across your pay periods
                    </p>
                  )}
                </div>
              )}

              {/* Due/Target Date */}
              {newPayment.name && newPayment.amount > 0 && (
                <div className="flex flex-col items-center w-full">
                  <label htmlFor="dayOfMonth">
                    {selectedPaymentType === "SPLIT_SAVEUP"
                      ? "Target Date (when you need the money)"
                      : "Due Date"}
                  </label>
                  <div className="text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2">
                    <Calendar
                      calendarType="gregory"
                      onChange={handleCalendarChange}
                      value={newPaymentDate}
                      selectRange={false}
                      className="cursor-pointer-calendar"
                      minDate={
                        selectedPaymentType === "SPLIT_SAVEUP"
                          ? addDays(new Date(), 1)
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {/* Total Owed (for DEBT type only) */}
              {selectedPaymentType === "DEBT" &&
                newPayment.name &&
                newPayment.amount > 0 && (
                  <div className="flex flex-col items-center w-full mt-4">
                    <label htmlFor="total">Total Owed</label>
                    <input
                      id="total"
                      type="number"
                      min={0}
                      className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                      value={newPayment?.total || ""}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          total: Number(e.target.value),
                        })
                      }
                      placeholder="Total remaining balance"
                    />
                    <p className="text-xs text-my-blue-dark mt-1">
                      Track how much you still owe
                    </p>
                  </div>
                )}

              {/* Interval selector for BILL/DEBT (not SPLIT) */}
              {(selectedPaymentType === "BILL" ||
                selectedPaymentType === "DEBT") &&
                newPayment.name &&
                newPayment.amount > 0 && (
                  <div className="flex flex-col items-center w-full mt-4">
                    <label>Payment Frequency</label>
                    <select
                      value={newPayment.interval || ""}
                      onChange={(e) =>
                        handleSetNewInterval(
                          e.target.value.toUpperCase() as Interval
                        )
                      }
                      className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                    >
                      <option value="" disabled>
                        -- Select Frequency --
                      </option>
                      <option value={MONTHLY} className="text-center">
                        Monthly
                      </option>
                      <option value={WEEKLY} className="text-center">
                        Weekly
                      </option>
                      <option value={BIWEEKLY} className="text-center">
                        Bi-Weekly
                      </option>
                      <option value={YEARLY} className="text-center">
                        Yearly
                      </option>
                    </select>
                  </div>
                )}
            </>
          )}
          {/* Save/Back buttons - show when we have enough info */}
          {selectedPaymentType &&
          newPayment.name &&
          newPayment.amount > 0 &&
          newPayment.interval &&
          newPaymentDate ? (
            <div className="text-my-black-base pb-8 w-full mt-4">
              <div className="text-center mb-4 p-3 bg-my-white-light rounded-md mx-4">
                <span className="text-my-green-dark font-bold">
                  {newPayment?.name}
                </span>{" "}
                -{" "}
                <span className="text-my-red-dark">
                  ${newPayment?.amount.toFixed(2)}
                </span>
                <div className="text-sm mt-1">
                  {selectedPaymentType === "SPLIT_RECURRING" ? (
                    <>Monthly amount split across your pay periods</>
                  ) : selectedPaymentType === "SPLIT_SAVEUP" ? (
                    <>
                      Save-up goal due{" "}
                      <span className="text-my-blue-dark">
                        {format(newPayment.dueDate.toDate(), "MMM do, yyyy")}
                      </span>
                    </>
                  ) : (
                    <>
                      Due {newPayment.interval?.toLowerCase()} on the{" "}
                      <span className="text-my-blue-dark">
                        {format(newPayment.dueDate.toDate(), "do")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-4 items-center justify-center w-[95%] m-auto">
                <Button color="red" onClick={() => handleClickBack()}>
                  Cancel
                </Button>
                <Button color="green" onClick={handleSavePayment}>
                  Save
                </Button>
              </div>
            </div>
          ) : selectedPaymentType ? (
            <div className="mt-4">
              <Button color="red" onClick={() => handleClickBack()}>
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </FullScreen>
  );
}
