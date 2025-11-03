import Calendar from "react-calendar";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../../constants";
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
import { format } from "date-fns";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import FullScreen from "../Views/FullScreen";
import TextInput from "../TextInput";
import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline, IoIosTrash } from "react-icons/io";

const defaultIntervalOption = "--Select An Interval--";
const defaultTypeOption = "--Select Payment Type--";

interface IPaymentForm {
  paymentToEdit: Payment | null;
  user: User;
  handleUpdateBudget: (d: number) => Promise<void>;
  handleBack: () => void;
  handleDeleteBill: (payment: Payment) => void;
  handleUpdatePaid: (payment: Payment) => void;
}

export default function PaymentForm({
  paymentToEdit,
  user,
  handleUpdateBudget,
  handleBack,
  handleDeleteBill,
  handleUpdatePaid,
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

  function resetForm() {
    setShowPaymentError(false);
    setNewPaymentInterval(undefined);
    setNewPayment(generateFreshPayment());
    setIsDebt(false);
  }

  function handleSetNewInterval(i: Interval) {
    setNewPaymentInterval(i);
    setNewPayment({
      ...newPayment,
      interval: i,
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
        <div className="flex flex-col gap-2 items-center justify-center py-[2rem] text-my-black-dark bg-my-white-base w-full max-w-[35rem] text-center">
          <div className="flex  gap-[2px] items-start justify-around w-full ">
            <div className="flex items-center justify-start  gap-2">
              <IoIosTrash
                className="text-my-white-dark bg-my-red-dark cursor-pointer hover:text-my-red-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
                size={30}
                onClick={() => handleDeleteBill(paymentToEdit ?? generateFreshPayment())}
              />
              <p className="text-center  text-my-red-dark">DELETE BILL</p>
            </div>
            <div className="flex items-center justify-start  gap-2">
              {paymentToEdit?.paid ? (
                <IoIosCheckmarkCircle
                  onClick={() => handleUpdatePaid(paymentToEdit)}
                  className="text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
                  size={30}
                />
              ) : (
                <IoIosCheckmarkCircleOutline
                  onClick={() => handleUpdatePaid(paymentToEdit ?? generateFreshPayment())}
                  className="text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
                  size={30}
                />
              )}
              <p className="text-center  text-my-green-dark">{paymentToEdit?.paid ? "PAID" : "NOT PAID"}</p>
            </div>
          </div>
          <h1 className="text-2xl">
            {paymentToEdit ? "Edit Payment Form" : "Add Payment Form"}
          </h1>
          <TextInput
            id="name"
            label="Payment Name"
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
              <label htmlFor="amount">Payment Amount</label>
              <input
                id="amount"
                type="number"
                min={0}
                className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                value={newPayment?.amount || ""}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    amount: Number(e.target.value),
                  })
                }
                onWheel={(e) => e.currentTarget.blur()} // disables scroll change
                placeholder="Enter new payment amount"
              />
            </div>
          )}
          {newPayment.amount > 0 && (
            <div className="flex flex-col items-center w-full mb-4">
              <label htmlFor="amount">Interval Of Payment</label>
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
              </select>
            </div>
          )}

          {newPaymentInterval && (
            <div className="flex flex-col items-center w-full ">
              <label htmlFor="dayOfMonth">Starting Date</label>
              <div className="text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2">
                <Calendar
                  calendarType="gregory"
                  onChange={handleCalendarChange}
                  value={newPaymentDate || new Date()}
                  selectRange={false}
                  className="cursor-pointer-calendar"
                />
              </div>
              <div className="flex flex-col items-center w-full mb-4">
                <div className="w-full flex justify-center gap-2 mt-2">
                  <label className=" inline" htmlFor="paid">
                    Already paid?
                  </label>
                  <input
                    id="paid"
                    type="checkbox"
                    className="cursor-pointer max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                    checked={newPayment?.paid || false}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        paid: e.target.checked,
                      })
                    }
                  />
                </div>
                <hr className="border-2 border-my-white-base w-[80%] mt-2" />
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
                {isDebt && (
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
                    due{" "}
                    <span className="text-my-blue-dark mr-2">
                      {newPayment.interval?.toLowerCase()}
                    </span>
                    on the {format(newPayment.dueDate.toDate(), "do")}.
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
