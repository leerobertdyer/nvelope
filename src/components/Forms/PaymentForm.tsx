import Calendar from "react-calendar";
import { BIWEEKLY, MONTHLY, SPLIT, WEEKLY, YEARLY } from "../../constants";
import type { BillOrDebt, Interval, Payment } from "../../types";
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

const defaultIntervalOption = "--Select An Interval--";
const defaultTypeOption = "--Select Payment Type--";

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

  const [newPaymentInterval, setNewPaymentInterval] = useState<
    Interval | undefined
  >(paymentToEdit?.interval);
  const [newPaymentDate, setNewPaymentDate] = useState<Value | null>(
    paymentToEdit?.dueDate.toDate() ?? new Date()
  );
  const [newPayment, setNewPayment] = useState<Payment>(
    paymentToEdit ?? generateFreshPayment()
  );

  const [isDebt, setIsDebt] = useState(paymentToEdit?.type === "DEBT");
  const [showButtons, setShowButtons] = useState(!!paymentToEdit);
  const [isSplitRecurring, setIsSplitRecurring] = useState(
    paymentToEdit?.recurring ?? true // Default to recurring for backwards compat
  );

  function resetForm() {
    setShowPaymentError(false);
    setNewPaymentInterval(undefined);
    setNewPayment(generateFreshPayment());
    setIsDebt(false);
  }

  function handleSetNewInterval(i: Interval) {
    setNewPaymentInterval(i);
    // For SPLIT, also set the recurring field
    if (i === SPLIT) {
      setNewPayment({
        ...newPayment,
        interval: i,
        recurring: isSplitRecurring,
      });
    } else {
      setNewPayment({
        ...newPayment,
        interval: i,
        recurring: undefined, // Clear recurring for non-SPLIT
      });
    }
  }

  function handleToggleSplitRecurring(recurring: boolean) {
    setIsSplitRecurring(recurring);
    if (!recurring) {
      // Save-up mode is always a DEBT (saving toward a future expense)
      // Set total to the same as amount
      setNewPayment({
        ...newPayment,
        recurring,
        type: "DEBT",
        total: newPayment.amount,
      });
      setIsDebt(true);
      setShowButtons(true);
    } else {
      setNewPayment({
        ...newPayment,
        recurring,
      });
    }
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

  function handleSelectType(e: string) {
    const newType = e.toUpperCase();
    setNewPayment({
      ...newPayment,
      type: newType as BillOrDebt,
    });
    setIsDebt(newType === "DEBT");
    setShowButtons(true);
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

  return (
    <FullScreen>
      {showPaymentError && (
        <Popup type="error">Payment name already exists</Popup>
      )}
      <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll min-h-screen w-full overflow-x-hidden">
        <div className="flex flex-col gap-2 items-center justify-center py-[2rem] text-my-black-dark bg-my-white-base w-full max-w-[35rem] text-center rounded-md">
          <h1 className="text-2xl">
            {paymentToEdit ? "Edit Payment" : "Add Payment"}
          </h1>
          <TextInput
            id="name"
            label=""
            value={newPayment?.name.toLowerCase()}
            placeholder="Enter new payment name"
            onChange={(e) =>
              setNewPayment({
                ...newPayment,
                name: e.target.value.toLowerCase(),
              })
            }
          />
          {newPayment.name && (
            <div className="flex flex-col items-center w-full mb-4">
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
                    ...(newPayment.interval === SPLIT && !isSplitRecurring ? { total: amount } : {}),
                  });
                }}
                onWheel={(e) => e.currentTarget.blur()} // disables scroll change
                placeholder="Enter new payment amount"
              />
            </div>
          )}
          {newPayment.amount > 0 && (
            <div className="flex flex-col items-center w-full mb-4">
              <select
                value={newPayment.interval || defaultIntervalOption}
                onChange={(e) =>
                  handleSetNewInterval(e.target.value.toUpperCase() as Interval)
                }
                className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark mb-4"
              >
                <option id="xxx" className="text-center" disabled>
                  {defaultIntervalOption}
                </option>
                <option id="newMonthly" className="text-center">
                  {MONTHLY}
                </option>
                <option id="newWeekly" className="text-center">
                  {WEEKLY}
                </option>
                <option id="newBiWeekly" className="text-center">
                  {BIWEEKLY}
                </option>
                <option id="newYearly" className="text-center">
                  {YEARLY}
                </option>
                <option id="newSplit" className="text-center">
                  {SPLIT}
                </option>
              </select>
              {newPayment.interval === SPLIT && (
                <div className="flex flex-col items-center gap-2 max-w-[20rem]">
                  <div className="flex gap-4 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSplitRecurring(true)}
                      className={`px-3 py-1 rounded-md border-2 text-sm ${
                        isSplitRecurring
                          ? "bg-my-green-dark text-my-white-light border-my-green-dark"
                          : "bg-my-white-light text-my-black-dark border-my-white-dark"
                      }`}
                    >
                      Monthly Recurring
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSplitRecurring(false)}
                      className={`px-3 py-1 rounded-md border-2 text-sm ${
                        !isSplitRecurring
                          ? "bg-my-blue-dark text-my-white-light border-my-blue-dark"
                          : "bg-my-white-light text-my-black-dark border-my-white-dark"
                      }`}
                    >
                      Save-Up Goal
                    </button>
                  </div>
                  <p className="text-xs text-my-blue-dark mb-2">
                    {isSplitRecurring
                      ? "Monthly amount split across your pay periods (e.g., rent, mortgage)"
                      : "Target amount split across pay periods until your goal date"}
                  </p>
                </div>
              )}
            </div>
          )}

          {newPaymentInterval && (
            <div className="flex flex-col items-center w-full ">
              <label htmlFor="dayOfMonth">
                {newPayment.interval === SPLIT && !isSplitRecurring
                  ? "Target Date (Goal)"
                  : "Starting Date"}
              </label>
              <div className="text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2">
                <Calendar
                  calendarType="gregory"
                  onChange={handleCalendarChange}
                  value={newPaymentDate || new Date()}
                  selectRange={false}
                  className="cursor-pointer-calendar"
                  minDate={
                    newPayment.interval === SPLIT && !isSplitRecurring
                      ? addDays(new Date(), 1) // Save-up mode: only future dates
                      : undefined
                  }
                />
              </div>
              <div className="flex flex-col items-center w-full mb-4">
                <hr className="border-2 border-my-white-base w-[80%] mt-2" />
                {/* Save-up SPLIT is always DEBT, so skip the selector */}
                {newPayment.interval === SPLIT && !isSplitRecurring ? (
                  <p className="text-xs text-my-blue-dark mt-2">
                    Save-up goals are automatically tracked as debts
                  </p>
                ) : (
                  <div className="w-full flex flex-col justify-center items-center gap-2 mt-2">
                    <label htmlFor="paid">Debt Or Bill?</label>
                    <select
                      value={newPayment.type || defaultTypeOption}
                      onChange={(e) => handleSelectType(e.target.value)}
                      className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                    >
                      <option id="xxx" className="text-center" disabled>
                        {defaultTypeOption}
                      </option>
                      <option id="xxx" value="BILL" className="text-center">
                        Bill
                      </option>
                      <option id="xxx" value="DEBT" className="text-center">
                        Debt
                      </option>
                    </select>
                  </div>
                )}
                {isDebt && !(newPayment.interval === SPLIT && !isSplitRecurring) && (
                  <div className="w-full flex flex-col justify-center items-center gap-2 mt-2">
                    <label htmlFor="total">Total</label>
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
                      placeholder="Enter remainder owed on debt"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {showButtons ? (
            <div className="text-my-black-base pb-8 w-full">
              <div className="text-center mb-2">
                <span className="text-my-green-dark">
                  {newPayment?.name || paymentToEdit?.name}
                </span>{" "}
                is a {newPayment.type?.toLowerCase()} for{" "}
                <span className="text-my-red-dark mr-2">
                  $
                  {newPayment?.amount.toFixed(2) ||
                    paymentToEdit?.amount.toFixed(2)}
                </span>
                {newPayment ? (
                  <div>
                    {newPayment.interval === SPLIT ? (
                      isSplitRecurring ? (
                        <>split monthly across your pay periods</>
                      ) : (
                        <>
                          split across pay periods until{" "}
                          <span className="text-my-blue-dark">
                            {format(newPayment.dueDate.toDate(), "MMM do, yyyy")}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        due{" "}
                        <span className="text-my-blue-dark mr-2">
                          {newPayment.interval?.toLowerCase()}
                        </span>
                        on the {format(newPayment.dueDate.toDate(), "do")}
                      </>
                    )}
                  </div>
                ) : (
                  paymentToEdit && (
                    <div>
                      due{" "}
                      <span className="text-blue-400 mr-2">
                        {paymentToEdit.interval?.toLowerCase()}
                      </span>
                      on the {format(paymentToEdit.dueDate.toDate(), "do")}.
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-4 items-center justify-center w-[95%] m-auto">
                <Button color="red" onClick={() => handleClickBack()}>
                  back
                </Button>
                <Button color="green" onClick={handleSavePayment}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <Button color="red" onClick={() => handleClickBack()}>
              back
            </Button>
          )}
        </div>
      </div>
    </FullScreen>
  );
}
