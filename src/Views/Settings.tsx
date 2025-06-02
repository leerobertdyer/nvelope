import { useEffect, useState } from "react";
import Button from "../components/Button";
import Header from "../components/Header";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import type { Bill, Envelope, Interval, OneTimeCash } from "../types";
import { editBills, editInterval, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { IoIosClipboard, IoIosTrash } from "react-icons/io";
import Popup from "../components/Popup";
import signout from "../firebase/signOut";
import { billsTotal, calculateBudgetByInterval } from "../util";


export default function Settings() {
    const {user} = useAuth();
    const { interval, setInterval, setIncome, bills, setBills, envelopes, oneTimeCash, income, setTotalSpendingBudget } = useGetDatabase();

    const [showIntervalSettings, setShowIntervalSettings] = useState<boolean>(false);
    const [newIncome, setNewIncome] = useState<string>('');
    const [newInterval, setNewInterval] = useState<Interval | null>(null);
    const [showBillSettings, setShowBillSettings] = useState<boolean>(false);
    const [showBillInputs, setShowBillInputs] = useState<boolean>(false);
    const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
    const [newBill, setNewBill] = useState<Bill | null>(null);
    const [showDeleteBill, setShowDeleteBill] = useState<boolean>(false);
    const [showBillAdded, setShowBillAdded] = useState<boolean>(false);
    const [showBillError, setShowBillError] = useState<boolean>(false);
    const [isAddingBill, setIsAddingBill] = useState<boolean>(false);

    useEffect(() => {
        if (showBillAdded) setNewBill(null)
        setTimeout(() => {
            setShowBillAdded(false)
            setShowBillError(false)
        }, 2500)
    }, [showBillAdded, showBillError])

    async function handleUpdateBudget(income: number, interval: Interval, bills: Bill[], envelopes: Envelope[], oneTimeCash: OneTimeCash[] | null) {
        const nextBudget = calculateBudgetByInterval({ income, interval, bills, envelopes, oneTimeCash: oneTimeCash || [] })
        await editTotalSpendingBudget(nextBudget, user!.uid);
        setTotalSpendingBudget(nextBudget)
    }

    function handleIntervalChange(interval: Interval) {
        setShowIntervalSettings(true);
        setNewInterval(interval);
    }

    async function handleEditBill(bill: Bill) {
        setShowBillInputs(true);
        setBillToEdit(bill);
        setNewBill(bill);
    }

    async function editBill() {
        if (!user || !newBill || !billToEdit) return;
        const updatedBills = bills.map((b) => b.name === billToEdit.name ? newBill : b);
        setBills(updatedBills);
        await editBills(updatedBills, user.uid);
        handleUpdateBudget(income, interval, updatedBills, envelopes, oneTimeCash)
        resetBillState()
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
        handleUpdateBudget(income, interval, updatedBills, envelopes, oneTimeCash)
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
            console.log('NOPE')
            setShowBillError(true);
            return;
        }
        const updatedBills = [...bills, newBill];
        setBills(updatedBills);
        setShowBillAdded(true);
        await editBills(updatedBills, user.uid);
        handleUpdateBudget(income, interval, updatedBills, envelopes, oneTimeCash)
    }

    function resetBillState() {
        setShowBillInputs(false);
        setBillToEdit(null);
        setNewBill({ name: '', amount: 0, dayOfMonth: 0 });
        setIsAddingBill(false);
        setShowBillAdded(false);
        setShowBillError(false);
    }

    if (showDeleteBill) {
        return <div className="absolute inset-0 w-screen h-screen z-100 select-none">
            <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
                <p className="p-4 rounded-md text-my-white-dark w-full text-center">
                    Are you sure you want to delete {billToEdit?.name}?
                </p>
                <div className="flex gap-4 items-center justify-center w-full">
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

    async function handleUpdateInterval() {
        if (!newIncome || !newInterval) return;
        setIncome(Number(newIncome));
        setInterval(newInterval);
        await editInterval(newInterval, user!.uid);
        const nextBudget = calculateBudgetByInterval({ income: Number(newIncome), interval: newInterval, bills, envelopes, oneTimeCash: oneTimeCash || [] })
        await editTotalSpendingBudget(nextBudget, user!.uid)
        setTotalSpendingBudget(nextBudget)
        setShowIntervalSettings(false);
    }

    function handleSetDayOfMonth(dayOfMonth: string) {
        let day = Number(dayOfMonth)
        if (day > 28) day = 28
        setNewBill({ name: newBill?.name || '', amount: newBill?.amount || 0, dayOfMonth: day || 1 })
    }

    if (showIntervalSettings) {
        return <div className="absolute inset-0 w-screen h-screen z-100 select-none">
            <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
                <p className="p-4 rounded-md text-my-white-dark w-full text-center">
                    What will your new {newInterval} total budget be?
                </p>
                <input
                    type="number"
                    className="w-[85%] max-w-[20rem] border p-2 rounded-md my-4 border-my-white-dark bg-my-white-light text-my-black-dark"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                    placeholder="Enter new income"
                />
                <div className="flex flex-col items-center gap-4 w-full">
                    <Button
                        color="red"
                        onClick={() => setShowIntervalSettings(false)}
                        >
                        Cancel
                    </Button>
                    <Button
                        color="green"
                        onClick={() => handleUpdateInterval()}
                        >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    }

    if (showBillInputs) {
        return <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-dark">
            {showBillAdded && <Popup type="success">Bill added!</Popup>}
            {showBillError && <Popup type="error">Bill name already exists</Popup>}
            <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll overflow-x-hidden">
                <div className="flex flex-col gap-2 mb-2 items-center justify-center w-full">
                    <p className="p-2 rounded-md text-my-white-dark w-full text-center text-2xl">{newBill? `${newBill.name}` : "Add Bill"}</p>
                    <div className="flex flex-col items-center w-full my-2">
                        <label className="text-my-white-light" htmlFor="name">Bill Name</label>
                        <input
                            id="name"
                            maxLength={21}
                            type="text"
                            className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                            value={newBill?.name.toLowerCase() || ''}
                            onChange={(e) => setNewBill({ name: e.target.value, amount: newBill?.amount || 0, dayOfMonth: newBill?.dayOfMonth || 1 })}
                            placeholder="Enter new bill name"
                            />
                    </div>
                    <div className="flex flex-col items-center w-full mb-4">
                        <label className="text-my-white-light" htmlFor="amount">Bill Amount</label>
                        <input
                            id="amount"
                            type="number"
                            min={0}
                            className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                            value={newBill?.amount || ''}
                            onChange={(e) => setNewBill({ name: newBill?.name || '', amount: Number(e.target.value), dayOfMonth: newBill?.dayOfMonth || 1 })}
                            placeholder="Enter new bill amount"
                        />
                    </div>
                    <div className="flex flex-col items-center w-full mb-4">
                        <label className="text-my-white-light" htmlFor="dayOfMonth">Day of Month</label>
                        <input
                            id="dayOfMonth"
                            type="number"
                            min={1}
                            max={31}
                            className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                            value={newBill?.dayOfMonth.toString() || ''}
                            onChange={(e) => handleSetDayOfMonth(e.target.value)}
                            placeholder="Enter new bill day of month"
                        />
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

    if (showBillSettings) {
        return <div className="absolute inset-0 w-screen h-screen z-100 select-none bg-my-black-dark">
            <div className="flex flex-col justify-center items-center m-auto overflow-y-scroll overflow-x-hidden">
                <div className="flex flex-col gap-2 mb-2 items-center justify-center w-full">
                    <p className="pt-2 rounded-md text-my-white-dark w-full text-center text-2xl">Edit Bills (current total = ${billsTotal(bills).toFixed(2)})</p>
                    <button
                        className="h-[3rem] w-[6rem] bg-my-red-dark text-my-white-light hover:bg-my-black-light  rounded-md p-2 border-2 border-my-white-light cursor-pointer"
                        onClick={() => handleAddBill()}
                        >
                        New Bill+
                    </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 w-[90%] h-[24rem] p-4 rounded-md overflow-y-scroll overflow-x-hidden border-4 border-my-white-dark bg-my-black-base">
                {bills.map((bill) => (
                        <div key={bill.name}
                            onClick={() => handleEditBill(bill)}
                            className={`flex flex-col justify-center cursor-pointer w-[12rem] items-center gap-2 rounded-md text-my-black-base border-2 border-my-red-dark text-center h-[9rem]
                              ${bill.dayOfMonth < new Date().getDate()+1 
                                ? 'bg-my-green-dark'
                                : bill.dayOfMonth === new Date().getDate()+1
                                ? 'bg-my-red-light'
                                : 'bg-my-white-dark'}
                                `}>
                            <p className="">{bill.name}</p>
                            <p className="text-xs">
                                {new Date().toLocaleDateString('default', { month: 'long' })} {bill.dayOfMonth}</p>
                            <p className="">${bill.amount.toFixed(2)}</p>
                            <div className="flex gap-2 items-center mb-2">
                                <IoIosClipboard 
                                    className="text-2xl text-my-red-light bg-my-white-dark hover:text-my-white-dark hover:bg-my-red-light rounded-lg p-[2px] border-2 border-my-black-dark" 
                                    size={27} onClick={() => handleEditBill(bill)} />
                                <IoIosTrash 
                                    className="text-2xl text-my-white-dark bg-my-red-dark hover:text-my-red-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" 
                                    size={27} onClick={() => handleDeleteBill(bill)} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 items-center justify-center w-[95%] mt-6">
                    <Button
                        color="red"
                        onClick={() => setShowBillSettings(false)}
                        >
                        Cancel
                    </Button>
                    <Button
                        color="green"
                        onClick={() => setShowBillSettings(false)}
                        >
                        Save
                    </Button>
                </div>
                <div className="flex gap-2 items-center justify-center w-[95%] mt-6 text-my-white-light">
                    Already Paid
                    <div className="rounded-sm w-[1rem] h-[1rem] bg-my-green-dark border-2 border-my-white-dark mr-4"></div>
                    Due Today
                    <div className="rounded-sm w-[1rem] h-[1rem] bg-my-red-light border-2 border-my-white-dark mr-4"></div>
                    Upcoming
                    <div className="rounded-sm w-[1rem] h-[1rem] bg-my-white-dark border-2 border-my-red-dark"></div>
                </div>
            </div>
        </div>
    }

    return (
        <>
            <Header />
            <h1 className="text-3xl font-bold mb-4 w-fit m-auto text-my-black-dark text-center p-2 mt-4 rounded-b-md">Settings</h1>   
            <div className="overflow-y-scroll overflow-x-hidden flex flex-col items-center justify-center pb-4 h-[22rem] bg-my-white-dark mt-[3rem] border-y-4 border-my-black-dark">
                <Button 
                    color="green"
                    onClick={() => setShowBillSettings(true)}>Edit Bills</Button>
                <div className="bg-my-black-base w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center">
                    <p className="text-my-white-dark text-center w-full">
                        Change Budget Interval
                    </p>
                    <select 
                        value={interval ?? ''}
                        onChange={(e) => handleIntervalChange(e.target.value as Interval)}
                        className="w-[80%] max-w-[20rem] border-2 bg-my-white-light p-2 rounded-md my-4">
                        <option value="" disabled>Select Interval</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <Button 
                    color="red"
                    onClick={() => signout()}>Log Out</Button>
            </div>
        </>
    )
}