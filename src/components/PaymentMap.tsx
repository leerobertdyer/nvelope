import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline, IoIosClipboard, IoIosTrash } from "react-icons/io";
import type { Payment } from "../types";
import { getPaymentCurrentDueDate, isDateInCurrentPayPeriod } from "../util";
import { useAuth } from "../Context/AuthContext/useAuth";
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
    const { user } = useAuth();
    const { interval } = useDatabase();

    const [currentPayments, setCurrentPayments] = useState<Payment[]>([])
    const [futurePayments, setFuturePayments] = useState<Payment[]>([])

    useEffect(() => {
        const nextCurrentPayments: Payment[] = []
        const nextFuturePayments: Payment[] = []
        payments.forEach(p => {
            if (isDateInCurrentPayPeriod(interval, getPaymentCurrentDueDate(p, user!))) 
                nextCurrentPayments.push(p)
            else nextFuturePayments.push(p)
        })
        setCurrentPayments(nextCurrentPayments);
        setFuturePayments(nextFuturePayments);
    })

    return (<>
        {currentPayments.map((p) => (
            <div key={p.name}
                className={`grid grid-cols-4 w-full py-2 text-my-black-base border-2 border-my-white-light text-center
                    ${p.name.length > 20 && 'w-fit px-2'}`}>
                <p className="flex items-center justify-center">
                    {format(new Date(), "M")}-{getPaymentCurrentDueDate(p, user!).getDate()}</p>
                <p className="flex items-center justify-center">{p.name}</p>
                <p className="flex items-center justify-center">${p.amount.toFixed(2)}</p>
                <div className="flex gap-2 items-center justify-center">
                    <IoIosClipboard
                        className="text-2xl text-my-red-light bg-my-white-dark cursor-pointer hover:text-my-white-dark hover:bg-my-red-light rounded-lg p-[2px] border-2 border-my-black-dark"
                        size={27} onClick={() => handleEditBill(p)} />
                    <IoIosTrash
                        className="text-2xl text-my-white-dark bg-my-red-dark cursor-pointer hover:text-my-red-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
                        size={27} onClick={() => handleDeleteBill(p)} />
                    {p.paid
                        ? <IoIosCheckmarkCircle
                            onClick={() => handleUpdatePaid(p)}
                            className="text-2xl text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" size={27} />
                        : <IoIosCheckmarkCircleOutline
                            onClick={() => handleUpdatePaid(p)}
                            className="text-2xl text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" size={27} />}
                </div>
            </div>
        ))}
    </>
    )
}