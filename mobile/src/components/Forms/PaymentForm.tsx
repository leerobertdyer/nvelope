import { Calendar } from 'react-native-calendars';
import { BIWEEKLY, MONTHLY, SPLIT, WEEKLY, YEARLY } from "../../constants";
import type { Interval, Payment } from "../../types";
import Button from "../../../../mobile/src/components/Buttons/Btn";
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
import { useBudget } from "../../Context/BudgetContext/useBudget";
import { useToast } from "../../Context/ToastContext/useToast";
import MoneyInput from "../MoneyInput";
import TextInput from "../Input";
import PaymentTypeSelector, {
  type PaymentTypeOption,
} from "./PaymentTypeSelector";
import { Text, View } from 'react-native';

interface IPaymentForm {
  paymentToEdit: Payment | null;
  user: User;
  handleUpdateBudget: (d: number) => Promise<void>;
  handleBack: () => void;
  /** Called when a payment is updated in place (e.g. Pay extra on a debt). Optional. */
  onPaymentUpdated?: (payment: Payment) => void;
}

export default function PaymentForm({
  paymentToEdit,
  user,
  handleUpdateBudget,
  handleBack,
}: IPaymentForm) {
  const { activeBudgetId } = useBudget();
  const { payDate, payPeriodInterval, payments, setPayments } = useDatabase();
  const { showToast } = useToast();

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

  // Track if user wants to split bill across pay periods (for BILL type only)
  const [splitBillAcrossPayPeriods, setSplitBillAcrossPayPeriods] = useState(
    paymentToEdit?.interval === SPLIT && paymentToEdit?.recurring === true
  );

  // Helper to determine PaymentTypeOption from existing Payment
  function getPaymentTypeFromPayment(p: Payment): PaymentTypeOption {
    if (p.type === "FUND") return "FUND";
    if (p.type === "DEBT") return "DEBT";
    // For BILL with SPLIT interval, it's still a Bill (just split across pay periods)
    return "BILL";
  }

  // Handle payment type selection
  function handleSelectPaymentType(type: PaymentTypeOption) {
    setSelectedPaymentType(type);
    setSplitBillAcrossPayPeriods(false); // Reset split toggle

    switch (type) {
      case "BILL":
        setNewPayment({
          ...newPayment,
          type: "BILL",
          interval: undefined, // Let user choose
          recurring: undefined,
          total: undefined,
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
      case "FUND":
        // Fund is a planned expense to save toward - uses SPLIT interval
        setNewPayment({
          ...newPayment,
          type: "FUND",
          interval: SPLIT,
          recurring: false,
          total: newPayment.amount,
        });
        break;
    }
  }

  // Handle toggling split for BILL type
  function handleToggleSplitBill(enabled: boolean) {
    setSplitBillAcrossPayPeriods(enabled);
    if (enabled) {
      setNewPayment({
        ...newPayment,
        interval: SPLIT,
        recurring: true,
      });
    } else {
      setNewPayment({
        ...newPayment,
        interval: undefined,
        recurring: undefined,
      });
    }
  }

  function resetForm() {
    setNewPayment(generateFreshPayment());
    setSelectedPaymentType(null);
    setSplitBillAcrossPayPeriods(false);
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
      if (activeBudgetId) editPayments(updatedPayments, activeBudgetId);
      return updatedPayments;
    });
    if (paymentToEdit.isInInterval && !paymentToEdit.paid) {
      await handleUpdateBudget(diffAmount);
    }
    resetForm();
    showToast("Payment updated");
  }

  async function addPayment() {
    if (!user || !newPayment) return;
    if (payments.some((p) => p.id === newPayment.id)) {
      showToast("Payment name already exists", "error");
      return;
    }
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    if (!activeBudgetId) return;
    await editPayments(updatedPayments, activeBudgetId);
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
    showToast("Payment added");
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
        return splitBillAcrossPayPeriods ? "Bill (Split)" : "Bill";
      case "DEBT":
        return "Debt";
      case "FUND":
        return "Fund";
      default:
        return "";
    }
  }

  // Check if form is complete enough to save
  const canSave =
    selectedPaymentType &&
    newPayment.name &&
    newPayment.amount > 0 &&
    newPayment.interval &&
    newPaymentDate;

  return (
    <div className="h-screen absolute inset-0 z-9999 flex flex-col justify-center items-center m-auto overflow-y-scroll w-full overflow-x-hidden">
      <div className="flex flex-col gap-2 items-center md:h-[100vh] overflow-y-auto text-my-white-dark bg-my-green-dark w-full text-center rounded-md p-2 pb-8">
        <h1 className="text-center w-full text-my-white-light p-2 text-3xl">
          {paymentToEdit ? "Edit Payment" : "Add Payment"}
        </h1>
        {/* Step 1: Payment Type Selection (for new payments only) */}
        {!selectedPaymentType && !paymentToEdit ? (
          <div className="w-full flex-1 min-h-0 flex flex-col justify-center px-2">
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
                <MoneyInput
                  id="amount"
                  label={selectedPaymentType === "FUND" ? "Target Amount" : "Amount"}
                  value={newPayment?.amount ?? 0}
                  onChange={(amount) => {
                    setNewPayment({
                      ...newPayment,
                      amount,
                      ...(selectedPaymentType === "FUND" ? { total: amount } : {}),
                    });
                  }}
                  placeholder={
                    selectedPaymentType === "FUND"
                      ? "Target amount to save"
                      : "Payment amount"
                  }
                />
                {selectedPaymentType === "FUND" && (
                  <p className="text-xs text-my-white-light mt-1">
                    This amount will be split across your pay periods until the
                    target date
                  </p>
                )}
                {splitBillAcrossPayPeriods && (
                  <p className="text-xs text-my-white-light mt-1">
                    This monthly amount will be split across your pay periods
                  </p>
                )}
              </div>
            )}

            {/* Split toggle for BILL type only */}
            {selectedPaymentType === "BILL" &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <label
                    htmlFor="splitToggle"
                    className="text-sm cursor-pointer"
                  >
                    Split across pay periods (for rent, mortgage, etc.)
                  </label>
                  <input
                    id="splitToggle"
                    type="checkbox"
                    checked={splitBillAcrossPayPeriods}
                    onChange={(e) => handleToggleSplitBill(e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-my-green-light"
                  />
                </div>
              )}

            {/* Due/Target Date */}
            {newPayment.name && newPayment.amount > 0 && (
              <View className="flex flex-col items-center w-full">
                <Text>
                  {selectedPaymentType === "FUND"
                    ? "Target Date (when you need the money)"
                    : "Due Date"}
                </Text>
                <View className="text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2">
                  <Calendar
                    calendarType="gregory"
                    onChange={handleCalendarChange}
                    value={newPaymentDate}
                    selectRange={false}
                    className="cursor-pointer-calendar"
                    minDate={
                      selectedPaymentType === "FUND"
                        ? addDays(new Date(), 1)
                        : undefined
                    }
                  />
                </View>
              </View>
            )}

            {/* Total Owed (for DEBT type only) */}
            {selectedPaymentType === "DEBT" &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <div className="flex flex-col items-center w-full mt-4">
                  <MoneyInput
                    id="total"
                    label="Total Owed"
                    value={newPayment?.total ?? 0}
                    onChange={(total) =>
                      setNewPayment({
                        ...newPayment,
                        total,
                      })
                    }
                    placeholder="Total remaining balance"
                  />
                  <p className="text-xs text-my-blue-dark mt-1">
                    Track how much you still owe
                  </p>
                </div>
              )}

            {/* Interest rate (optional, for DEBT type only) */}
            {selectedPaymentType === "DEBT" &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <div className="flex flex-col items-center w-full mt-4">
                  <label htmlFor="interestRate">Interest rate (%) – optional</label>
                  <input
                    id="interestRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                    value={newPayment?.interestRate ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPayment({
                        ...newPayment,
                        interestRate: val === "" ? undefined : Number(val),
                      });
                    }}
                    placeholder="e.g. 5.5"
                  />
                </div>
              )}

            {/* Interval selector for BILL (non-split) and DEBT */}
            {((selectedPaymentType === "BILL" && !splitBillAcrossPayPeriods) ||
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
        {canSave ? (
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
                {splitBillAcrossPayPeriods ? (
                  <>Monthly amount split across your pay periods</>
                ) : selectedPaymentType === "FUND" ? (
                  <>
                    Planned expense due{" "}
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
            <div className="flex flex-col gap-4 items-center justify-center w-full">
              <Button color="gold" onClick={handleSavePayment}>
                Save
              </Button>
              <Button color="red" onClick={() => handleClickBack()}>
                Cancel
              </Button>
            </div>
          </div>
        ) : selectedPaymentType ? (
          <div className="mt-4 w-full flex justify-center items-center">
            <Button color="red" onClick={() => handleClickBack()}>
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
