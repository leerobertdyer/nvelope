import { useEffect, useState } from "react";
import Button from "../components/Button";
import Header from "../components/Header";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import type { Interval } from "../types";
import { editIncome, editPayPeriodInterval, editPayDate, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import signout from "../firebase/signOut";
import {  getIncomeByInterval, recalculateBudget } from "../util";
import { IoPencil } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import Calendar from "react-calendar";
import { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../constants";
import EditSpendingBudget from "../components/EditSpendingBudget";
// import CreateLoginWithEmail from "../components/CreateLoginWithEmail";

export default function Settings() {
    const {user} = useAuth();
    const { payPeriodInterval, setIncome, setTotalSpendingBudget, setPayPeriodInterval, totalSpendingBudget, income, payDate, setPayDate } = useDatabase();

    const [showIntervalSettings, setShowIntervalSettings] = useState<boolean>(false);
    const [newIncome, setNewIncome] = useState<string>('');
    const [newInterval, setNewInterval] = useState<Interval | null>(null);
    const [isEditingCash, setIsEditingCash] = useState(false);
    const [showEditIncome, setShowEditIncome] = useState(false);

    useEffect(() => {
        if (income) setNewIncome(income.toString());
    }, [income]);

    function resetState() {
        setShowIntervalSettings(false)
        setNewIncome('');
        setNewInterval(null);
        setIsEditingCash(false);
        setShowEditIncome(false);
    }

    function handleIntervalChange(interval: Interval) {
        setShowIntervalSettings(true);
        setNewInterval(interval);
    }
    
    async function handleUpdateInterval() {
        if (!newIncome || !newInterval) return;
        const diffAmount = getIncomeByInterval(payPeriodInterval, newInterval, Number(newIncome));
        setIncome(Number(newIncome));
        setPayPeriodInterval(newInterval);
        await editPayPeriodInterval(newInterval, user!.uid);
        const nextBudget = recalculateBudget({ currentAvailableBudget: totalSpendingBudget, diffAmount })
        await editTotalSpendingBudget(nextBudget, user!.uid)
        setTotalSpendingBudget(nextBudget)
        setShowIntervalSettings(false);
    }

    function handleEditCash() {
        setIsEditingCash(true);
    }

    async function updateIncome() {
        if (!newIncome || !income) return;
        const diffAmount = Number(newIncome) - Number(income);
        const newBal = recalculateBudget({ currentAvailableBudget: totalSpendingBudget, diffAmount })
        await editTotalSpendingBudget(newBal, user!.uid)
        await editIncome(Number(newIncome), user!.uid)
        setTotalSpendingBudget(newBal)
        setIncome(Number(newIncome))
        setShowEditIncome(false);
    }

    async function handlePayDateChange(value: Value) {
        if (value instanceof Date) {
            setPayDate(Timestamp.fromDate(value));
            await editPayDate(value, user!.uid);
            // TODO: recalculate budget based on paydate change
            // This involves checking which bills in the current interval are paid
            // If not paid, and no longer in interval add the amount to budget
            // If paid and no longer in interval - not sure lol
        }
    }
    
       if (isEditingCash) {
        return <EditSpendingBudget handleBack={resetState} />
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


    return (
        <div className="w-full h-screen overflow-y-scroll">
            <Header links={[
                { label: "Home", href: "/" },
                { label: "Payments", href: "/payments" },
            ]} />
            <h1 className="text-3xl font-bold mb-4 w-fit m-auto text-my-black-dark text-center p-2 mt-4 rounded-b-md">Settings</h1>   
            <div className="w-full flex justify-center">
                <Button 
                    color="red"
                    onClick={() => signout()}>Log Out</Button>
            </div>
            <div className="overflow-y-scroll overflow-x-hidden flex flex-col items-center justify-start py-4 h-[70vh] bg-my-white-dark mt-[3rem] border-y-4 border-my-black-dark">
                <div className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark animate-glow shadow-lg shadow-my-black-dark mb-4"
                    onClick={handleEditCash}>
                    <IoPencil 
                        className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-dark text-my-black-dark p-[2px] border-my-black-dark"  />
                    <p className="text-sm">Manually Edit Balance</p>
                </div>
                <div className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark animate-glow shadow-lg shadow-my-black-dark mb-4"
                    onClick={() => setShowEditIncome(true)}>
                    <GiMoneyStack
                        className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-green-dark text-my-white-light p-[2px] border-my-black-dark"  />
                    <p className="text-sm">Edit Recurring Income</p>
                </div>
                    {showEditIncome && <div className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center gap-4 bg-my-white-light">
                        <label htmlFor="newIncome">Paycheck Amount</label>
                        <input className="w-[80%] rounded-md border-none p-2 bg-my-white-dark"
                            id="newIncome" value={newIncome} onChange={(e) => setNewIncome(e.target.value)} type="number" placeholder="Enter new income" />
                        <div className="flex w-full justify-between gap-2">
                            <Button onClick={() => setShowEditIncome(false)} color="red">Cancel</Button>
                            <Button onClick={updateIncome} color="green">Save</Button>
                        </div>
                    </div>}
                <div className="bg-my-black-base w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center">
                    <p className="text-my-white-dark text-center w-full">
                        Change Budget Interval
                    </p>
                    <select 
                        value={payPeriodInterval ?? ''}
                        onChange={(e) => handleIntervalChange(e.target.value.toUpperCase() as Interval)}
                        className="w-[80%] max-w-[20rem] border-2 bg-my-white-light p-2 rounded-md my-4">
                        <option value="" disabled>Select Interval</option>
                        <option value={WEEKLY}>Weekly</option>
                        <option value={BIWEEKLY}>Biweekly</option>
                        <option value={MONTHLY}>Monthly</option>
                        <option value={YEARLY}>Yearly</option>
                    </select>
                </div>

                <div className="bg-my-black-base text-my-black-light w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center">
                    <p className="text-my-white-dark text-center w-full pb-2">
                        Change Pay Date
                    </p>
                    <Calendar
                        onChange={handlePayDateChange}
                        value={payDate?.toDate() || new Date()}
                        calendarType='gregory'
                        selectRange={false} 
                        className="cursor-pointer-calendar"/>
                </div>
               
                {/* <CreateLoginWithEmail /> */}

            </div>
        </div>
    )
}