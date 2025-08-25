import Button from "../components/Button";
import { billsTotal, recalculateBudget, isDateInInterval } from "../util";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import type { Bill, Interval } from "../types";
import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import { editBills, editTotalSpendingBudget } from "../firebase/editData";
import Popup from "../components/Popup";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/src/shared/types.js";
import Header from "../components/Header";
import BillMap from "../components/BillMap";
import { Timestamp } from "firebase/firestore";

export default function Bills() {
    const {bills, setBills, interval, setTotalSpendingBudget, totalSpendingBudget, payDate} = useGetDatabase();
    const {user} = useAuth();
    const today = new Date();
    const todayTimestamp = Timestamp.fromDate(today)


    const [newBill, setNewBill] = useState<Bill | null>(null);
    const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
    const [showBillInputs, setShowBillInputs] = useState<boolean>(false);
    const [showDeleteBill, setShowDeleteBill] = useState<boolean>(false);
    const [isAddingBill, setIsAddingBill] = useState<boolean>(false);
    const [showBillAdded, setShowBillAdded] = useState<boolean>(false);
    const [showBillError, setShowBillError] = useState<boolean>(false);
    const [newBillDate, setNewBillDate] = useState<Value | null>(null);
    const [newBillInterval, setNewBillInterval] = useState<Interval | null>(null);
    const [currentBills, setCurrentBills] = useState<Bill[]>([]);
    const [futureBills, setFutureBills] = useState<Bill[]>([]);

    // UseEffect to sort bills by date and paid/unpaid
    useEffect(() => {
        const billsWithIntervals = [...bills].map(b => ({...b, isInInterval: isDateInInterval(interval, b.originalDate.toDate())}));
        setCurrentBills(billsWithIntervals.filter(b => b.isInInterval).sort((a, b) => a.originalDate.seconds - b.originalDate.seconds))
        setFutureBills(billsWithIntervals.filter(b => !b.isInInterval).sort((a, b) => a.originalDate.seconds - b.originalDate.seconds))
    }, [bills, interval, payDate])

    useEffect(() => {
        if (showBillAdded) setNewBill(null)
        setTimeout(() => {
            setShowBillAdded(false)
            setShowBillError(false)
        }, 2500)
    }, [showBillAdded, showBillError])

    async function handleEditBill(bill: Bill) {
        setShowBillInputs(true);
        setBillToEdit(bill);
        setNewBill(bill);
    }
    async function editBill() {
        if (!user || !newBill || !billToEdit) return;
        // if the bill is in the interval and we change the price, we need to update the budget 
        // But since we are now using the availableBudget on the fly, we need to calculate the diff
        // then use the diff to update the budget
        const diffAmount = newBill.amount - billToEdit.amount;
        const updatedBills = bills.map((b) => b.name === billToEdit.name ? newBill : b);
        setBills(updatedBills);
        await editBills(updatedBills, user.uid);
        if (billToEdit.isInInterval && !billToEdit.paid) {
            await handleUpdateBudget(diffAmount);
        }
        resetBillState()
    }

    async function handleUpdateBudget(diffAmount: number) {
        const nextBudget = recalculateBudget({ currentAvailableBudget: totalSpendingBudget, diffAmount })
        await editTotalSpendingBudget(nextBudget, user!.uid);
        setTotalSpendingBudget(nextBudget)
    }

    function handleDeleteBill(bill: Bill) {
        setBillToEdit(bill);
        setShowDeleteBill(true);
    }
    async function deleteBill() {
        if (!user || !billToEdit) return;
        const updatedBills = bills.filter((b) => b.name !== billToEdit.name);
        setBills(updatedBills);
        await editBills(updatedBills, user.uid);
        // Update the budget in DB only if the bill was unpaid and in interval
        if (billToEdit.isInInterval && !billToEdit.paid) {
            await handleUpdateBudget(billToEdit.amount);
        }
        resetBillState()
    }

    function handleAddBill() {
        setNewBill(null);
        setBillToEdit(null);
        setShowBillInputs(true);
        setIsAddingBill(true);
    }
    async function addBill() {
        if (!user || !newBill) return;
        if (bills.some(b => b.name === newBill.name)) {
            setShowBillError(true);
            return;
        }
        const updatedBills = [...bills, newBill];
        setBills(updatedBills);
        setShowBillAdded(true);
        await editBills(updatedBills, user.uid);
        if (isDateInInterval(interval, newBill.originalDate.toDate()) && !newBill.paid) {
            await handleUpdateBudget(newBill.amount * -1)
        }
        resetBillState()
    }

    function resetBillState() {
        setShowBillInputs(false);
        setBillToEdit(null);
        setNewBill({ name: '', amount: 0, paid: false, interval: null, originalDate: Timestamp.fromDate(today)});
        setIsAddingBill(false);
        setShowBillAdded(false);
        setShowBillError(false);
        setNewBillDate(null);
    }

    function handleCalendarChange(value: Value) {
        setNewBillDate(value);
        if (value instanceof Date) {
            setNewBill({ 
                name: newBill?.name || '', 
                amount: newBill?.amount || 0, 
                paid: false,
                interval: newBill?.interval || null,
                originalDate: newBill?.originalDate || todayTimestamp
            });
        }
    }

    async function handleUpdatePaid(bill: Bill) {
        const updatedBills = bills.map(b => b.name === bill.name ? { ...b, paid: !bill.paid } : b);
        setBills(updatedBills);
        await editBills(updatedBills, user!.uid);
    }
    
    if (showDeleteBill) {
        console.log('billToEdit', billToEdit)
        return <div className="absolute inset-0 w-screen h-screen z-100 select-none">
            <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
                {!billToEdit?.paid && billToEdit?.isInInterval 
                ? <p className="text-my-white-light text-center">
                    Removing this bill will add 
                    <span className="text-my-green-base px-[3px]">
                        ${billToEdit.amount.toFixed(2)}
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
                    Are you sure you want to delete {billToEdit?.name}?
                </p>
                <div className="flex gap-2 items-center justify-center w-[95%]">
                    <Button
                        color="red"
                        onClick={() => {
                            setShowDeleteBill(false);
                            resetBillState();
                        }}
                        >
                        No
                    </Button>
                    <Button
                        color="green"
                        onClick={() => {
                            deleteBill();
                            setShowDeleteBill(false);
                            resetBillState();
                        }}
                        >
                        Yes
                    </Button>
                </div>
            </div>
        </div>
    }

        if (showBillInputs) {
            return <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-dark overflow-y-auto">
                {showBillAdded && <Popup type="success">Bill added!</Popup>}
                {showBillError && <Popup type="error">Bill name already exists</Popup>}
                <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll overflow-x-hidden">
                    <div className="flex flex-col gap-2 mb-2 items-center justify-center w-full">
                        <p className="p-2 rounded-md text-my-white-dark w-full text-center text-2xl">{newBill? `${newBill.name}` : "Add Bill"}</p>
                        <div className="flex flex-col items-center w-full mb-4">
                            <label className="text-my-white-light" htmlFor="amount">Bill Amount</label>
                            <input
                                id="amount"
                                type="number"
                                min={0}
                                className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                                value={newBill?.amount || ''}
                                onChange={(e) => setNewBill({ name: newBill?.name || '', amount: Number(e.target.value), paid: newBill?.paid || false, interval: newBill?.interval || "monthly", originalDate: newBill?.originalDate || todayTimestamp })}
                                placeholder="Enter new bill amount"
                            />
                        </div>
                        <div className="flex flex-col items-center w-full my-2">
                            <label className="text-my-white-light" htmlFor="name">Bill Name</label>
                            <input
                                id="name"
                                maxLength={25}
                                type="text"
                                className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                                value={newBill?.name.toLowerCase() || ''}
                                onChange={(e) => setNewBill({ name: e.target.value, amount: newBill?.amount || 0, paid: newBill?.paid || false, interval: newBill?.interval || "monthly", originalDate: newBill?.originalDate || todayTimestamp })}
                                placeholder="Enter new bill name"
                                />
                        </div>
                        <div className="flex flex-col items-center w-full mb-4">
                            <label className="text-my-white-light" htmlFor="dayOfMonth">Day of Month</label>
                            <div className='text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2'>
                            <Calendar
                                calendarType='gregory'
                                onChange={handleCalendarChange} 
                                value={newBillDate || new Date()} 
                                selectRange={false} 
                                className="cursor-pointer-calendar"/>
                        </div>
                        <div className="flex flex-col items-center w-full mb-4">
                            <label className="text-my-white-light" htmlFor="paid">Paid</label>
                            <input
                                id="paid"
                                type="checkbox"
                                className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                                checked={newBill?.paid || false}
                                onChange={(e) => setNewBill({ name: newBill?.name || '', amount: newBill?.amount || 0, paid: e.target.checked, interval: newBill?.interval || "monthly", originalDate: newBill?.originalDate || todayTimestamp })}
                                />
                        </div>
                        </div>
                        <div className="flex gap-4 items-center justify-center w-full">
                            <Button
                                color="red"
                                onClick={() => setShowBillInputs(false)}
                                >
                                back
                            </Button>
                            <Button
                                color="green"
                                onClick={isAddingBill ? () => addBill() : () => editBill()}
                                >
                                Save
                            </Button>
                        </div>
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
                    <div className="flex flex-col gap-2 mb-2 items-center justify-center w-full">
                        <p className="pt-2 rounded-md text-my-white-dark w-full text-center text-xl md:text-2xl">Edit Bills <br />Current bills = <span className="text-my-red-base">${billsTotal(bills).toFixed(2)}</span></p>
                        <button
                            className="h-[3rem] w-[6rem] bg-my-red-dark text-my-white-light hover:bg-my-black-light  rounded-md p-2 border-2 border-my-white-light cursor-pointer"
                            onClick={() => handleAddBill()}
                            >
                            New Bill+
                        </button>
                    </div>
                    {currentBills.length === 0 && <p className="text-my-white-light text-center text-xl md:text-2xl mb-4">No bills due this pay period</p>}
                    {currentBills.length > 0 && <>
                    <h2 className="text-my-white-light text-center text-xl md:text-2xl">Current Bills</h2>
                        <BillMap bills={currentBills} handleUpdatePaid={handleUpdatePaid} handleEditBill={handleEditBill} handleDeleteBill={handleDeleteBill} />
                    </>
                    }
                    {futureBills.length > 0 && <>
                        <h2 className="text-my-white-light text-center text-xl md:text-2xl">Future Bills</h2>
                        <BillMap bills={futureBills} isFutureBills handleUpdatePaid={handleUpdatePaid} handleEditBill={handleEditBill} handleDeleteBill={handleDeleteBill} />
                    </>
                    }
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