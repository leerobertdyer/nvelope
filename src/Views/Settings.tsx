import Button from "../components/Button";
import ClosingX from "../components/ClosingX";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import { editBills, editIncome, editInterval, editIsNewUser, editPayDate } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useEffect, useState } from "react";
import Calendar from 'react-calendar';
import Header from "../components/Header";
import 'react-calendar/dist/Calendar.css';
import DemoStep from "../components/DemoStep";
import type { Bill, Interval } from "../types";
import { IoIosSad } from "react-icons/io";


type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Settings() {
    const {isNewUser, setIsNewUser, payDate, setPayDate, income, setIncome, interval, setInterval, bills, setBills} = useGetDatabase();
    const {user} = useAuth();
    const [step, setStep] = useState(4);
    const [newPayDate, setNewPayDate] = useState<Value | null>(null);
    const [newIncome, setNewIncome] = useState<number | null>(null);
    const [newInterval, setNewInterval] = useState<string | null>(null);
    const [newBills, setNewBills] = useState<Bill[] | null>(null);
    const [newBillName, setNewBillName] = useState('');
    const [newBillAmount, setNewBillAmount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [period, setPeriod] = useState<string>('')

    useEffect(() => {
        // Give firebase time to load user data
        // That way if there is already a startDate but user has not finished remaining steps
        // We allow them to start where left off
        setTimeout(() => {
            setIsLoading(false)
        }, 2500)
    }, [])

    useEffect(() => {
        if (newInterval) {
            let temp = ''
            if (newInterval === 'weekly') temp = 'week'
            if (newInterval === 'biweekly') temp = '2 weeks'
            if (newInterval === 'monthly') temp = 'month'
            setPeriod(temp)
        }
    }, [newInterval])

    async function handleFirstStep() {
        console.log('handleFirstStep')
        if (payDate) {
            setNewPayDate(payDate.toDate())
            if (interval) {
                setNewInterval(interval)
                setStep(4)
            } else {
                console.log('Paydate found, No interval found')
                setStep(3)
            }
        } else { 
            console.log('No pay date found')
            setStep(2)
        }
    }

    async function handleSecondStep() {
        console.log('handleSecondStep')
        if (!newPayDate || Array.isArray(newPayDate)) return; 
        await editPayDate(newPayDate, user?.uid || '')
        setStep(3)
    }

    async function handleThirdStep() {
        console.log('handleThirdStep')
        if (!newInterval && !interval) return;
        await editInterval(newInterval as Interval, user?.uid || '')
        setStep(4)
    }

    function handleFourthStep() {
        if (income) {
            setStep(6)
        } else {
            setStep(5)
        }
    }

    async function handleFifthStep() {
        console.log('handleFifthStep')
        if (!newIncome) return;
        await editIncome(newIncome, user?.uid || '')
        setStep(6)
    }

    function handleSixthStep() {
        console.log('handleSixthStep')
        if (bills && bills.length > 0) {
            setStep(8)
        } else {
            setStep(7)
        }
    }

    async function handleSeventhStep() {
        console.log('handleSeventhStep')
        if (!newBills) return;
        await editBills(newBills, user?.uid || '')
        setStep(8)
    }

    async function handleFinalStep() {
        console.log('handleFinalStep')
        // update ALL STATE HERE and set isNewUser false...
    }

    function handleAddNewBill() {
        console.log('handleAddNewBill')
        if (!newBillName || !newBillAmount) return;
        setNewBills([...(newBills || []), { name: newBillName, amount: newBillAmount }])
        setNewBillName('')
        setNewBillAmount(0)
    }


    if (isLoading) {
        return <div className="w-full h-full flex items-center justify-center text-center animate-pulse text-my-red-dark">Loading...</div>
    }

    return (
        <>
        {user && <Header step={step}/>}
        <div className="text-center flex flex-col items-center justify-around h-full">
            <h2>Settings</h2>

            {isNewUser && step === 1
                ? <>
                    <div className="absolute inset-0 bg-my-black-dark opacity-80"></div>
                    <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center text-white">
                        <h3>Let's get you set up first...</h3>
                        <ClosingX text="Start" onClick={handleFirstStep} />
                    </div>
                </>
                : step === 2 
                ? <DemoStep onClick={handleSecondStep} text="Save Pay Date" changeValue={newPayDate}>
                        <h3 className='text-sm sm:text-lg p-2'>Here are days remaining til your next paycheck</h3>
                        <p className='text-sm sm:text-lg'>Speaking of which, when was <span className='text-my-green-base'>your last paycheck?</span></p>
                        <div className='text-black rounded-md overflow-hidden border-2'>
                            <Calendar
                                calendarType='gregory'
                                onChange={setNewPayDate} 
                                value={newPayDate} 
                                selectRange={false} />
                        </div>
                  </DemoStep>
                    : step === 3
                    ? <DemoStep onClick={handleThirdStep} text="Save Schedule" changeValue={newInterval}>
                        <h3 className='text-sm sm:text-lg p-2'>Great! And how often are you paid?</h3>
                        <p className='text-sm'>(Or more importantly, how often do you want to budget?)</p>
                        <select 
                            className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                            onChange={(e) => setNewInterval(e.target.value as Interval)} 
                            value={newInterval || ''}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </DemoStep>
                    : step === 4
                    ? <DemoStep onClick={handleFourthStep} text="Next" changeValue={true}>
                            <h3 className='text-sm sm:text-lg p-2'>This is what you have left until your next paycheck</h3>
                            <p className='text-sm sm:text-lg'>It includes <span className='text-my-green-base'>$$$</span> from all your <span className="text-my-red-light">Nvelopes</span>, and any unspent cash as well.</p>
                        </DemoStep>
                    : step === 5
                    ? <DemoStep onClick={handleFifthStep} text="Save Income" changeValue={newIncome}>
                        <h3 className='text-sm sm:text-lg p-2'>Now, how much do you make every {period}?</h3>
                        <p className='text-sm sm:text-lg italic'>Include all household income <span className="text-my-red-light">before</span> expenses.</p>
                            <input 
                                className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem]'
                                type="number" 
                                placeholder="Estimated Income"
                                value={newIncome?.toString() || ''} 
                            onChange={(e) => setNewIncome(Number(e.target.value))} 
                            />
                        </DemoStep>
                    : step === 6
                    ? <DemoStep onClick={handleSixthStep} text="Next" changeValue={true}>
                            <h3 className='text-sm sm:text-lg p-2'>Time for the final and most exciting step</h3>
                            <p className='text-sm sm:text-lg'>Let's add your <span className='text-my-red-light'>bills <IoIosSad className="inline"/></span></p>
                        </DemoStep>
                    : step === 7
                    ? <DemoStep onClick={handleSeventhStep} text="Save Bills" changeValue={newBills}>
                            <p className='text-sm sm:text-lg'>Only add monthly necessities.</p>
                            <p className='text-sm sm:text-lg'>Think <span className='text-my-red-light'>rent</span>, <span className='text-my-white-base'>utilities</span>, <span className='text-my-white-dark'>loans</span>, etc.</p>
                            <p className='text-sm sm:text-lg'>For things like shopping, entertainment, etc... we will use <span className='text-my-red-light'>Nvelopes</span></p>
                            <form className="flex flex-col gap-2 w-full items-center" onSubmit={handleAddNewBill}>
                                <input
                                    className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                                    type="text"
                                    placeholder="Bill Name"
                                    value={newBillName}
                                    onChange={(e) => setNewBillName(e.target.value)}
                                />
                                <input
                                    className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                                    type="number"
                                    placeholder="Amount"
                                    value={newBillAmount}
                                    onChange={(e) => setNewBillAmount(Number(e.target.value))}
                                />
                                <Button 
                                    onClick={handleAddNewBill}
                                    color="green"
                                    children="Add Bill"
                                />
                            </form>
                        </DemoStep>
                    : step === 8
                    ? <DemoStep onClick={handleFinalStep} text="Save" changeValue={true}>
                            <h3 className='text-sm sm:text-lg p-2'>Final step</h3>
                            <p className='text-sm sm:text-lg'>You're all set!</p>
                        </DemoStep>
                    : null
                }

            <Button
                onClick={() => {}}
                color="green"
                children="Save"
                />
        </div>
    </>
    );
}