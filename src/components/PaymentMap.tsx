import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline, IoIosClipboard, IoIosTrash } from "react-icons/io";
import type { Payment } from "../types";
import { getPaymentCurrentDueDate, isDateInCurrentPayPeriod } from "../util";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";

interface PaymentMapProps {
    payments: Payment[];
    handleUpdatePaid: (payment: Payment) => void;
    handleEditBill: (payment: Payment) => void;
    handleDeleteBill: (payment: Payment) => void;
}
export default function PaymentMap({ payments, handleUpdatePaid, handleEditBill, handleDeleteBill }: PaymentMapProps) {
    const { payPeriodInterval, payDate } = useDatabase();

    const [currentPayments, setCurrentPayments] = useState<Payment[]>([])
    const [futurePayments, setFuturePayments] = useState<Payment[]>([])

    // Calculate which payments are in current pay period and which are outside of it
    useEffect(() => {
        if (!payDate) return
        const nextCurrentPayments: Payment[] = []
        const nextFuturePayments: Payment[] = []
        payments.forEach(p => {
            if (isDateInCurrentPayPeriod(payPeriodInterval, payDate.toDate(), getPaymentCurrentDueDate(p)))
                nextCurrentPayments.push(p)
            else nextFuturePayments.push(p)
        })
        setCurrentPayments(nextCurrentPayments);
        setFuturePayments(nextFuturePayments);
    }, [payments, payPeriodInterval, payDate])

function RenderPayments({ p }: { p: Payment }) {
        return (
        <>
            <p className="flex items-center justify-center">
                {format(p.dueDate.toDate(), "do")}
            </p>
            <p className="flex items-center justify-center text-xs">{p.name}</p>
            <p className="flex items-center justify-center">${p.amount.toFixed(2)}</p>
            <div className="flex gap-[2px] items-start justify-center mr-2">
                <IoIosClipboard
                    className="text-my-red-light bg-my-white-dark cursor-pointer hover:text-my-white-dark hover:bg-my-red-light rounded-lg p-[2px] border-2 border-my-black-dark"
                    size={20} onClick={() => handleEditBill(p)} />
                <IoIosTrash
                    className="text-my-white-dark bg-my-red-dark cursor-pointer hover:text-my-red-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
                    size={20} onClick={() => handleDeleteBill(p)} />
                {p.paid
                    ? <IoIosCheckmarkCircle
                    onClick={() => handleUpdatePaid(p)}
                    className="text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" size={20} />
                    : <IoIosCheckmarkCircleOutline
                    onClick={() => handleUpdatePaid(p)}
                    className="text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" size={20} />}
            </div>
        </> )
    }

    return (<div className="h-fit max-w-[95vw] border-2 border-my-white-light rounded-md mb-[5rem] overflow-auto">
    {
        currentPayments.length > 0 && 
        <div className="bg-my-white-dark p-2 flex flex-col justify-center align-center md:w-[40rem] max-w-[95vw]">
            <h2 className="text-my-black-dark w-full text-center mb-2">Current Payments</h2>
            {currentPayments.map((p) => (
                <div key={p.id} className='grid grid-cols-4 py-2 bg-my-black-base text-my-white-base text-center border-2 border-my-white-light text-center'>
                    <RenderPayments p={p}/>
                </div>
            ))}
        </div>
    }

    {
        futurePayments.length > 0 && 
        <div className="bg-my-black-light p-2 flex flex-col justify-center align-center md:w-[40rem] max-w-[95vw]">
            <h2 className="text-my-white-light w-full text-center mb-2">Outside Pay Period</h2>
            {futurePayments.map((p) => (
                <div key={p.id} className='grid grid-cols-4 py-2 bg-my-black-base text-my-white-base border-2 border-my-white-light text-center'>
                    <RenderPayments p={p}/>
                </div>
            ))}
        </div>
    }
    </div>
    )
}