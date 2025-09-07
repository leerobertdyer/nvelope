// Page to display all bills and debts that are recurring
import Button from "../components/Button";
import { paymentsTotal, recalculateBudget, isDateInCurrentPayPeriod } from "../util";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { type BillOrDebt, type Interval, type Payment } from "../types";
import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import { editPayments, editTotalSpendingBudget } from "../firebase/editData";
import Popup from "../components/Popup";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/src/shared/types.js";
import Header from "../components/Header";
import { Timestamp } from "firebase/firestore";
import { BILL, BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../constants";
import { format } from "date-fns";
import PaymentMap from "../components/PaymentMap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const generateFreshPayment = () => { return { id: crypto.randomUUID(), name: "", type: BILL, amount: 0, paid: false, interval: MONTHLY, dueDate: Timestamp.fromDate(new Date) } as Payment }

export default function Payments() {
    const { payments, setPayments, payDate, payPeriodInterval, setTotalSpendingBudget, totalSpendingBudget } = useDatabase();
    const { user } = useAuth();

    const [showPaymentsMenu, setShowPaymentsMenu] = useState(true);
    const [newPayment, setNewPayment] = useState<Payment>(generateFreshPayment());
    const [paymentToEdit, setPaymentToEdit] = useState<Payment>();
    const [showPaymentInputs, setShowPaymentInputs] = useState<boolean>(false);
    const [showDeletePayment, setShowDeletePayment] = useState<boolean>(false);
    const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
    const [showPaymentAdded, setShowPaymentAdded] = useState<boolean>(false);
    const [showPaymentError, setShowPaymentError] = useState<boolean>(false);
    const [newPaymentDate, setNewPaymentDate] = useState<Value | null>(null);
    const [newPaymentInterval, setNewPaymentInterval] = useState<Interval | null>();
    const [showButtons, setShowButtons] = useState(false);

    // Reset payment form and hide popups after 2.5s
    useEffect(() => {
        if (showPaymentAdded) setNewPayment(generateFreshPayment())
        setTimeout(() => {
            setShowPaymentAdded(false)
            setShowPaymentError(false)
        }, 2500)
    }, [showPaymentAdded, showPaymentError])

    async function handleEditPayment(p: Payment) {
        setShowPaymentInputs(true);
        setPaymentToEdit(p);
        setNewPayment(p);
        setNewPaymentDate(p.dueDate.toDate())
        setNewPaymentInterval(p.interval)
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
        resetPaymentState()
    }

    async function handleUpdateBudget(diffAmount: number) {
        const nextBudget = recalculateBudget({ currentAvailableBudget: totalSpendingBudget, diffAmount })
        await editTotalSpendingBudget(nextBudget, user!.uid);
        setTotalSpendingBudget(nextBudget)
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
        resetPaymentState()
    }

    function handleAddPayment() {
        setNewPayment(generateFreshPayment());
        setPaymentToEdit(undefined);
        setShowPaymentInputs(true);
        setIsAddingPayment(true);
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
        resetPaymentState()
    }

    function resetPaymentState() {
        setShowPaymentInputs(false);
        setPaymentToEdit(undefined);
        setNewPayment(generateFreshPayment());
        setIsAddingPayment(false);
        setShowPaymentAdded(false);
        setShowPaymentError(false);
        setNewPaymentDate(null);
        setNewPaymentInterval(null);
        setShowButtons(false);
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

    async function handleUpdatePaid(payment: Payment) {
        const updatedPayments = payments.map(p => p.id === payment.id ? { ...p, paid: !p.paid } : p);
        setPayments(updatedPayments);
        await editPayments(updatedPayments, user!.uid);
    }


    if (showDeletePayment) {
        console.log('paymentToEdit', paymentToEdit)
        return <div className="absolute inset-0 w-screen h-screen z-100 select-none">
            <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
                {!paymentToEdit?.paid && paymentToEdit?.isInInterval
                    ? <p className="text-my-white-light text-center">
                        Removing this bill will add
                        <span className="text-my-green-base px-[3px]">
                            ${paymentToEdit.amount.toFixed(2)}
                        </span>
                        to your available budget
                    </p>
                    : <p className="text-my-white-light text-center px-2">
                        Removing this bill will not change your available balance of
                        <span className="text-my-green-base px-[3px]">
                            ${totalSpendingBudget.toFixed(2)}
                        </span>
                        because it's either paid already, or not in the current interval.
                    </p>}
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
    }

    function handleSetNewInterval(i: Interval) {
        setNewPaymentInterval(i)
        setNewPayment({
            ...newPayment,
            interval: i
        }) 
    }

    function handleSelectType(e: string) {
        setNewPayment({
            ...newPayment,
            type: e.toUpperCase() as BillOrDebt
        })
        setShowButtons(true)
    }

if (showPaymentInputs) {
    return <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-dark overflow-y-auto">
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
                        value={newPayment?.name.toLowerCase() || ''}
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
                        <hr className="border-2 border border-my-white-base w-[80%] mt-2"/>
                        <div className="w-full flex flex-col justify-center items-center gap-2 mt-2">
                            <label className="text-my-white-light" htmlFor="paid">Debt Or Bill?</label>
                            <select
                                onChange={(e) => handleSelectType(e.target.value)}
                                className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark">
                                <option id="xxx" className="text-center">--Select Payment Type--</option>
                                <option id="xxx" value="BILL" className="text-center">Bill</option>
                                <option id="xxx" value="DEBT" className="text-center">Debt</option>
                            </select>
                        </div>
                    </div>
                    </div>}
                {showButtons ?
                <div className="text-my-white-base pb-8">
                    <p className="text-center mb-2">
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
                    </p>
                    <div className="flex gap-4 items-center justify-center w-full">
                        <Button
                            color="red"
                            onClick={() => resetPaymentState()}
                            >
                            back
                        </Button>
                        <Button
                            color="green"
                            onClick={isAddingPayment ? () => addPayment() : () => editPayment()}
                            >
                            Save
                        </Button>
                    </div>
                </div>
                : <Button
                    color="red"
                    onClick={() => resetPaymentState()}
                    >
                    back
                  </Button>
                }
            </div>
        </div>
        </div>
}


return <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-base overflow-y-auto">
    <Header links={[
        { label: "Home", href: "/" },
        { label: "Settings", href: "/settings" },
    ]} />
    <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll overflow-x-hidden gap-2">
        {showPaymentsMenu ?
        (<div className="flex flex-col gap-2 mb-2 items-center justify-center w-full border-b-2 border-my-white-light pb-2">
            <p className="pt-2 rounded-md text-my-white-dark w-full text-center text-xl md:text-2xl">
                Payments
            </p>
            <p className="text-lg md:text-xl w-full text-center text-my-white-light">
                Current bills =
                <span className="text-my-red-base ml-2">
                    ${paymentsTotal(payments).totalBills.toFixed(2)}
                </span>
            </p>
            <p className="text-lg md:text-xl w-full text-center text-my-white-light">
                Current debt =
                <span className="text-my-red-base ml-2">
                    ${paymentsTotal(payments).totalDebts.toFixed(2)}
                </span>
            </p>
            <button
                className="h-[2.5rem] w-[8rem] bg-my-red-dark text-my-white-light hover:bg-my-black-light  rounded-md p-2 border-2 border-my-white-light cursor-pointer"
                onClick={() => handleAddPayment()}
            >
                New Payment+
            </button>
            <p className="bg-my-white-dark text-my-black-dark px-[2px] border border-my-white-light rounded-md" onClick={() => setShowPaymentsMenu(false)}><IoIosArrowUp size={15}/></p>
        </div>) 
        : <p className="mt-4 bg-my-green-base text-my-white-light px-[2px] border rounded-md" onClick={() => setShowPaymentsMenu(true)}><IoIosArrowDown size={15} /></p>
}
        {payments.length === 0 && <p className="text-my-white-light text-center text-xl md:text-2xl mb-4">No payments due this pay period</p>}
        {payments.length > 0
            && <PaymentMap
                    payments={payments}
                    handleUpdatePaid={handleUpdatePaid}
                    handleEditBill={handleEditPayment}
                    handleDeleteBill={handleDeleteBill} />}
        <div className="fixed bottom-0 flex flex-wrap gap-2 items-center justify-center w-screen mt-6 text-my-white-light bg-my-black-dark p-4 border-t-2 border-my-white-light">
            <div className="flex items-center justify-start gap-2">
                <p>Past Due</p>
                <div className="rounded-sm w-[1rem] h-[1rem] bg-my-red-light border-2 border-my-white-dark mr-4"></div>
            </div>
            <div className="flex items-center justify-start gap-2">
                <p>Paid</p>
                <div className="rounded-sm w-[1rem] h-[1rem] bg-my-green-dark border-2 border-my-white-dark mr-4"></div>
            </div>
        </div>
    </div>
</div>
}