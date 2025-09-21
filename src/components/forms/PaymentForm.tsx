import Calendar from "react-calendar";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../../constants";
import type { BillOrDebt, Interval, Payment } from "../../types";
import Button from "../Button";
import Popup from "../Popup";
import type { Value } from "react-calendar/src/shared/types.js";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import type { User } from "firebase/auth";
import { editPayments } from "../../firebase/editData";
import { generateFreshPayment, isDateInCurrentPayPeriod } from "../../util";
import { format } from "date-fns";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";

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

    const [showPaymentAdded, setShowPaymentAdded] = useState(false);
    const [showPaymentError, setShowPaymentError] = useState(false);

    const [newPaymentInterval, setNewPaymentInterval] = useState<Interval | undefined>(paymentToEdit?.interval)
    const [newPaymentDate, setNewPaymentDate] = useState<Value | null>(null)
    const [newPayment, setNewPayment] = useState<Payment>(paymentToEdit ?? generateFreshPayment())
    
    const [isDebt, setIsDebt] = useState(paymentToEdit?.type === "DEBT");
    const [showButtons, setShowButtons] = useState(paymentToEdit ?? false);

    function resetForm() {
        setShowPaymentAdded(false);
        setShowPaymentError(false);
        setNewPaymentInterval(undefined)
        setNewPayment(generateFreshPayment())
        setIsDebt(false);
    }

    function handleSetNewInterval(i: Interval) {
        setNewPaymentInterval(i)
        setNewPayment({
            ...newPayment,
            interval: i
        })
    }

    function handleCalendarChange(value: Value) {
        setNewPaymentDate(value);
        if (value instanceof Date) {
            setNewPayment({
                ...newPayment,
                dueDate: Timestamp.fromDate(value)
            });
        }
    }

    function handleSelectType(e: string) {
        const newType = e.toUpperCase()
        setNewPayment({
            ...newPayment,
            type: newType as BillOrDebt
        })
        setIsDebt(newType === "DEBT")
        setShowButtons(true)
    }

    async function editPayment() {
        if (!user || !newPayment || !paymentToEdit) return;
        // If payment is in the interval and we change the price, we need to update the budget 
        const diffAmount = newPayment.amount - paymentToEdit.amount;
        const updatedPayments = payments.map((b) => b.name === paymentToEdit.name ? newPayment : b);
        setPayments(updatedPayments);
        await editPayments(updatedPayments, user.uid);
        if (paymentToEdit.isInInterval && !paymentToEdit.paid) {
            await handleUpdateBudget(diffAmount);
        }
        resetForm()
    }

    async function addPayment() {
        if (!user || !newPayment) return;
        if (payments.some(p => p.name === newPayment.name)) {
            setShowPaymentError(true);
            return;
        }
        const updatedPayments = [...payments, newPayment];
        setPayments(updatedPayments);
        setShowPaymentAdded(true);
        await editPayments(updatedPayments, user.uid);
        if (payDate && isDateInCurrentPayPeriod(payPeriodInterval, payDate.toDate(), newPayment.dueDate.toDate()) && !newPayment.paid) {
            await handleUpdateBudget(newPayment.amount * -1)
        }
        resetForm()
    }

    async function handleSavePayment() {
        if (paymentToEdit) await editPayment()
        else await addPayment()
    }

    function handleClickBack() {
        resetForm();
        handleBack();
    }

    return (
        <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-dark overflow-y-auto">
            {showPaymentAdded && <Popup type="success">Payment added!</Popup>}
            {showPaymentError && <Popup type="error">Payment name already exists</Popup>}
            <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll overflow-x-hidden max-w-[95vw]">
                <div className="flex flex-col gap-2 mb-2 items-center justify-center w-full">
                    <p className="p-2 rounded-md text-my-white-dark w-full text-center text-2xl">{newPayment ? `${newPayment.name}` : "Add Bill"}</p>
                    <div className="flex flex-col items-center w-full my-2">
                        <label className="text-my-white-light" htmlFor="name">Payment Name</label>
                        <input
                            id="name"
                            maxLength={25}
                            type="text"
                            className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                            value={newPayment?.name.toLowerCase()}
                            placeholder="Enter new payment name"
                            onChange={(e) => setNewPayment({
                                ...newPayment,
                                name: e.target.value.toLowerCase(),
                            })}
                        />
                    </div>
                    {newPayment.name &&
                        <div className="flex flex-col items-center w-full mb-4">
                            <label className="text-my-white-light" htmlFor="amount">Bill Amount</label>
                            <input
                                id="amount"
                                type="number"
                                min={0}
                                className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                                value={newPayment?.amount || ''}
                                onChange={(e) => setNewPayment({
                                    ...newPayment,
                                    amount: Number(e.target.value)
                                })}
                                placeholder="Enter new bill amount"
                            />
                        </div>}
                    {newPayment.amount &&
                        <div className="flex flex-col items-center w-full mb-4">
                            <label className="text-my-white-light" htmlFor="amount">Interval Of Bill</label>
                            <select
                                value={newPayment.interval}
                                onChange={(e) => handleSetNewInterval(e.target.value.toUpperCase() as Interval)}
                                className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark mb-4">
                                <option id="xxx" className="text-center">--Select An Interval--</option>
                                <option id="newMonthly" className="text-center">{MONTHLY}</option>
                                <option id="newWeekly" className="text-center">{WEEKLY}</option>
                                <option id="newBiWeekly" className="text-center">{BIWEEKLY}</option>
                                <option id="newYearly" className="text-center">{YEARLY}</option>
                            </select>
                        </div>}

                    {newPaymentInterval && <div className="flex flex-col items-center w-full text-my-white-light">
                        <label className="text-my-white-light" htmlFor="dayOfMonth">Starting Date</label>
                        <div className='text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2'>
                            <Calendar
                                calendarType='gregory'
                                onChange={handleCalendarChange}
                                value={newPaymentDate || new Date()}
                                selectRange={false}
                                className="cursor-pointer-calendar" />
                        </div>
                        <div className="flex flex-col items-center w-full mb-4">
                            <div className="w-full flex justify-center gap-2 mt-2">
                                <label className="text-my-white-light inline" htmlFor="paid">Already paid?</label>
                                <input
                                    id="paid"
                                    type="checkbox"
                                    value={newPayment.paid.toString() || "false"}
                                    className="cursor-pointer max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                                    checked={newPayment?.paid || false}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        paid: e.target.checked
                                    })}
                                />
                            </div>
                            <hr className="border-2 border border-my-white-base w-[80%] mt-2" />
                            <div className="w-full flex flex-col justify-center items-center gap-2 mt-2">
                                <label className="text-my-white-light" htmlFor="paid">Debt Or Bill?</label>
                                <select
                                    value={newPayment.type}
                                    onChange={(e) => handleSelectType(e.target.value)}
                                    className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark">
                                    <option id="xxx" className="text-center">--Select Payment Type--</option>
                                    <option id="xxx" value="BILL" className="text-center">Bill</option>
                                    <option id="xxx" value="DEBT" className="text-center">Debt</option>
                                </select>
                            </div>
                            {isDebt && <div className="w-full flex flex-col justify-center items-center gap-2 mt-2">
                                <label className="text-my-white-light" htmlFor="total">Total</label>
                                <input
                                    id="total"
                                    type="number"
                                    min={0}
                                    className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                                    value={newPayment?.total || ''}
                                    onChange={(e) => setNewPayment({
                                        ...newPayment,
                                        total: Number(e.target.value)
                                    })}
                                    placeholder="Enter remainder owed on debt"
                                />
                            </div>}
                        </div>
                    </div>}
                    {showButtons ?
                        <div className="text-my-white-base pb-8">
                            <div className="text-center mb-2">
                                <span className="text-my-green-light">{newPayment?.name || paymentToEdit?.name}</span> is a {newPayment.type.toLowerCase()} for <span className="text-my-red-light mr-2">${newPayment?.amount.toFixed(2) || paymentToEdit?.amount.toFixed(2)}</span>
                                {newPayment
                                    ? <div>
                                        due <span className="text-blue-400 mr-2">{newPayment.interval.toLowerCase()}</span>
                                        on the {format(newPayment.dueDate.toDate(), "do")}.
                                    </div>
                                    : paymentToEdit
                                    && <div>
                                        due <span className="text-blue-400 mr-2">{paymentToEdit.interval.toLowerCase()}</span>
                                        on the {format(paymentToEdit.dueDate.toDate(), "do")}.
                                    </div>
                                }
                            </div>
                            <div className="flex gap-4 items-center justify-center w-full">
                                <Button
                                    color="red"
                                    onClick={() => handleClickBack()}
                                >
                                    back
                                </Button>
                                <Button
                                    color="green"
                                    onClick={handleSavePayment}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                        : <Button
                            color="red"
                            onClick={() => handleClickBack()}
                        >
                            back
                        </Button>
                    }
                </div>
            </div>
        </div>
    )
}
