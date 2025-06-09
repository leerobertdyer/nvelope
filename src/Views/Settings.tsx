import { useState } from "react";
import Button from "../components/Button";
import Header from "../components/Header";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import type { Interval } from "../types";
import { editInterval, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import signout from "../firebase/signOut";
import {  calculateBudgetByInterval } from "../util";
import { useNavigate } from "react-router-dom";


export default function Settings() {
    const {user} = useAuth();
    const { interval, setInterval, setIncome, bills, envelopes, oneTimeCash, setTotalSpendingBudget } = useGetDatabase();
    const navigate = useNavigate();

    const [showIntervalSettings, setShowIntervalSettings] = useState<boolean>(false);
    const [newIncome, setNewIncome] = useState<string>('');
    const [newInterval, setNewInterval] = useState<Interval | null>(null);

    function handleIntervalChange(interval: Interval) {
        setShowIntervalSettings(true);
        setNewInterval(interval);
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
        <>
            <Header />
            <h1 className="text-3xl font-bold mb-4 w-fit m-auto text-my-black-dark text-center p-2 mt-4 rounded-b-md">Settings</h1>   
            <div className="overflow-y-scroll overflow-x-hidden flex flex-col items-center justify-center pb-4 h-[22rem] bg-my-white-dark mt-[3rem] border-y-4 border-my-black-dark">
                <Button 
                    color="green"
                    onClick={() => navigate("/bills")}>Edit Bills</Button>
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