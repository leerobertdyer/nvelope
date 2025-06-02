import Button from "../components/Button";
import ClosingX from "../components/ClosingX";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import { editBills, editIncome, editInterval, editIsNewUser, editPayDate, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useEffect, useState } from "react";
import Calendar from 'react-calendar';
import Header from "../components/Header";
import 'react-calendar/dist/Calendar.css';
import DemoStep from "../components/DemoStep";
import type { Bill, Interval } from "../types";
import { IoIosSad } from "react-icons/io";
import Popup from "../components/Popup";
import { Timestamp } from "firebase/firestore";
import SpendBtn from "../components/SpendBtn";
import { calculateBudgetByInterval } from "../util";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Demo() {
    const {isNewUser, setIsNewUser, payDate, setPayDate, income, setIncome, interval, setInterval, bills, setBills, setTotalSpendingBudget} = useGetDatabase();
    const {user} = useAuth();

    const [step, setStep] = useState(0);
    const [newPayDate, setNewPayDate] = useState<Value | null>(null);
    const [newIncome, setNewIncome] = useState<number | null>(null);
    const [newInterval, setNewInterval] = useState<string | null>(null);
    const [newBills, setNewBills] = useState<Bill[]>([]);
    const [newBillName, setNewBillName] = useState('');
    const [newBillAmount, setNewBillAmount] = useState<number | null>(null);
    const [newBillDayOfMonth, setNewBillDayOfMonth] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [period, setPeriod] = useState<string>('')
    const [showBillAdded, setShowBillAdded] = useState<boolean>(false)
    const [showBillError, setShowBillError] = useState<boolean>(false)

    useEffect(() => {
        setTimeout(() => {
            setShowBillAdded(false)
            setShowBillError(false)
        }, 2500)
    }, [showBillAdded, showBillError])

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
            let p = ''
            if (newInterval === 'weekly') p = 'week'
            if (newInterval === 'biweekly') p = '2 weeks'
            if (newInterval === 'monthly') p = 'month'
            setPeriod(p)
        }
    }, [newInterval])

    async function handleAddNewBill() {
        console.log('handleAddNewBill')
        if (!newBillName || !newBillAmount || !newBillDayOfMonth) return;
        // check to see if name is already used
        if (newBills.some(bill => bill.name === newBillName)) {
            setShowBillError(true)
            return
        }
        await editBills([...newBills, { name: newBillName, amount: newBillAmount, dayOfMonth: Number(newBillDayOfMonth) }], user?.uid || '')
        const nextBudget = calculateBudgetByInterval({ income, interval, bills: newBills, envelopes: [], oneTimeCash: [] })
        await editTotalSpendingBudget(nextBudget, user?.uid || '')
        setTotalSpendingBudget(nextBudget)
        setNewBills([...newBills, { name: newBillName, amount: newBillAmount, dayOfMonth: Number(newBillDayOfMonth) }])
        setBills([...newBills, { name: newBillName, amount: newBillAmount, dayOfMonth: Number(newBillDayOfMonth) }])
        setNewBillName('')
        setNewBillAmount(0)
        setShowBillAdded(true)
    }

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
        await editPayDate(newPayDate, user!.uid)
        if (newPayDate instanceof Date) {
            setPayDate(Timestamp.fromDate(newPayDate))
        }
        setStep(3)
    }

    async function handleThirdStep() {
        console.log('handleThirdStep')
        if (!newInterval && !interval) return;
        await editInterval(newInterval as Interval, user!.uid)
        const nextBudget = calculateBudgetByInterval({ income, interval: newInterval as Interval, bills, envelopes: [], oneTimeCash: [] })
        await editTotalSpendingBudget(nextBudget, user!.uid)
        setTotalSpendingBudget(nextBudget)
        setInterval(newInterval as Interval)
        setStep(4)
    }

    function handleFourthStep() {
        if (income) {
            setStep(6)
        } else {
            if (newIncome) {
                setIncome(newIncome)
            }
            setStep(5)
        }
    }

    async function handleFifthStep() {
        console.log('handleFifthStep')
        if (!newIncome) return;
        await editIncome(newIncome, user!.uid)
        const nextBudget = calculateBudgetByInterval({ income: newIncome, interval, bills, envelopes: [], oneTimeCash: [] })
        await editTotalSpendingBudget(nextBudget, user!.uid)
        setTotalSpendingBudget(nextBudget)
        setIncome(newIncome)
        setStep(6)
    }

    function handleSixthStep() {
        console.log('handleSixthStep')
        if (bills && bills.length > 0) {
            setStep(8)
        } else {
            if (newBills) {
                setBills(newBills)
            }
            setStep(7)
        }
    }

    async function handleSeventhStep() {
        console.log('handleSeventhStep')
        if (!newBills) return;
        await editBills(newBills, user!.uid)
        const nextBudget = calculateBudgetByInterval({ income, interval, bills: newBills, envelopes: [], oneTimeCash: [] })
        await editTotalSpendingBudget(nextBudget, user!.uid)
        setTotalSpendingBudget(nextBudget)
        setBills(newBills)
        setStep(8)
    }

    function handleEighthStep() {
        console.log('handleEighthStep')
        setStep(9)
    }

    async function handleNinthStep() {
        console.log('handleNinthStep')
        await editIsNewUser(false, user!.uid)
        setIsNewUser(false)
        setStep(10)
    }

    function handleSetDayOfMonth(dayOfMonth: string) {
        let day = Number(dayOfMonth)
        if (day > 28) day = 28
        setNewBillDayOfMonth(day.toString())
    }


    if (isLoading) {
        return <div className="w-full h-full flex items-center justify-center text-center animate-pulse text-my-red-dark">Loading...</div>
    }

    return (
        <>
        {user && <Header step={step}/>}
        {showBillAdded && <Popup type="success">Bill added!</Popup>}
        {showBillError && <Popup type="error">Bill name already exists</Popup>}
        <div className="text-center flex flex-col items-center justify-around h-full">

            {isNewUser && step === 0
                ? <SpendBtn onClick={() => setStep(1)} />
                : step == 1
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
                        <h3 className='text-sm sm:text-lg p-2'>And how often are you <span className="text-my-green-base">paid?</span></h3>
                        <p className='text-sm'>(Or how often do you want to <span className="text-my-red-light">budget?</span>)</p>
                        <p className='text-sm'>Note: If you are paid bi-weekly but want to budget weekly, no problem!</p>
                        <select 
                            className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                            onChange={(e) => setNewInterval(e.target.value as Interval)} 
                            value={newInterval || ''}
                        >
                            <option disabled value="">Select</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </DemoStep>
                    : step === 4
                    ? <DemoStep onClick={handleFourthStep} text="Next" changeValue={true}>
                            <h3 className='text-sm sm:text-lg p-2'>This is your budget until your next <span className="text-my-green-light">paycheck</span></h3>
                            <p className='text-sm sm:text-lg'>It includes <span className='text-my-green-light'>$$$</span> from all your <span className="text-my-red-light">Nvelopes</span>, and any unspent cash as well.</p>
                        </DemoStep>
                    : step === 5
                    ? <DemoStep onClick={handleFifthStep} text="Save Income" changeValue={newIncome}>
                        <h3 className='text-sm sm:text-lg p-2'>Now, how much do you make every {period}?</h3>
                        <p className='text-sm sm:text-lg italic'>Include all household income <span className="text-my-red-light">before expenses.</span></p>
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
                            <p className='text-sm sm:text-lg'>Let's add your <span className='text-my-red-light'>bills <IoIosSad className="inline" size={30} /></span></p>
                        </DemoStep>
                    : step === 7
                    ? <DemoStep onClick={handleSeventhStep} text="Save Bills" changeValue={newBills}>
                            <p className='text-sm sm:text-lg'>Add your fixed <span className='text-my-green-base underline'>monthly</span> expenses.</p>
                            <p className='text-sm sm:text-lg'>Think <span className='text-my-red-light'>rent</span>, <span className='text-my-white-base'>utilities</span>, <span className='text-my-white-dark'>loans</span>, etc.</p>
                            <p className='text-sm sm:text-lg'>For groceries, entertainment, etc... we will use <span className='text-my-red-light'>Nvelopes</span></p>
                            <form className="flex flex-col gap-2 w-full items-center" onSubmit={handleAddNewBill}>
                                <input
                                    className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                                    type="text"
                                    placeholder="Bill Name"
                                    value={newBillName}
                                    onChange={(e) => setNewBillName(e.target.value.toLowerCase())}
                                />
                                <input
                                    className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                                    type="number"
                                    placeholder="Monthly Amount"
                                    value={newBillAmount || ''}
                                    onChange={(e) => setNewBillAmount(Number(e.target.value))}
                                />
                                <input
                                    className='bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center'
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="Day of Month"
                                    value={newBillDayOfMonth || ''}
                                    onChange={(e) => handleSetDayOfMonth(e.target.value)}
                                />
                                <Button 
                                    onClick={handleAddNewBill}
                                    color="green"
                                    children="Add Bill"
                                />
                            </form>
                        </DemoStep>
                    : step === 8
                    ? <DemoStep onClick={handleEighthStep} text="Next" changeValue={true}>
                            <h3 className='text-sm sm:text-lg p-2'>Note the balance changed according to your bills</h3>
                            <p className='text-sm sm:text-lg'>This is the amount you have left until your next <span className="text-my-green-light">paycheck</span></p>
                            <p className='text-sm sm:text-lg'>And takes into account the <span className="text-my-white-dark">pay period</span> you selected earlier.</p>
                        </DemoStep>
                    : step === 9
                    && <DemoStep onClick={handleNinthStep} text="Let's Go!" changeValue={true}>
                            <h3 className='text-sm sm:text-lg p-2'>We're all set up!</h3>
                            <p className='text-sm sm:text-lg'>If you need to make changes later, you can always come back here to <span className="text-my-green-base">settings</span>.</p>
                            <p className='text-sm sm:text-lg'>For now, let's stuff some <span className='text-my-red-light'>Nvelopes</span>!</p>
                       </DemoStep>
                }
        </div>
    </>
    );
}