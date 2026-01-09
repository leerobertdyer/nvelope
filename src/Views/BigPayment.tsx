import { GiMoneyStack } from "react-icons/gi";
import { IoPencil, IoTrash } from "react-icons/io5";
import type { Payment } from "../types";
import Button from "../components/Buttons/Button";
import { useState } from "react";
import PaymentForm from "../components/Forms/PaymentForm";
import { useAuth } from "../Context/AuthContext/useAuth";
import { format } from "date-fns";

interface IProps {
    handleBack: () => void
    paymentToEdit: Payment | null
    resetState: () => void
    handleUpdateBudget: (n: number) => Promise<void>
    handleUpdatePaid:(payment: Payment) => Promise<void>
    handleDeleteBill: (p: Payment) => void
}

export default function BigPayment({ handleBack, paymentToEdit, handleUpdateBudget, handleUpdatePaid, handleDeleteBill }: IProps) {
    const [showForm, setShowForm] = useState(false);
    const [p, setP] = useState<Payment | null>(paymentToEdit);
    const { user } = useAuth();
    function updatePaid() {
        if (!p) return;
        setP(prev => prev && { ...prev, paid: !prev.paid });
        handleUpdatePaid(p)
    }

    if (showForm && user) return <PaymentForm paymentToEdit={p} user={user} handleBack={handleBack} handleUpdateBudget={handleUpdateBudget}/>
    if (!p) return <p>Error: Missing Payment To Edit</p>;
    return (
        <div className="absolute inset-0 pt-[3rem] bg-my-white-light w-full overflow-y-auto z-999 h-screen">
            <div className="w-full flex flex-col items-center justify-start">
                <div className="flex flex-col justify-center items-start p-2 w-[17rem] text-my-black-light rounded-md mb-4">
                    <h1 className="text-lg text-my-white-dark mb-4 bg-my-black-light text-center rounded-md w-full">{p.name}</h1>
                    <p className="w-full flex justify-between">Type: <span className={`${p.type === "BILL" ? 'text-my-red-dark' : p.type === "FUND" ? 'text-my-green-dark' : 'text-my-blue-dark'}`}>{p.type}</span></p>
                    <p className="w-full flex justify-between">{p.type === "FUND" ? "Per Period:" : "Amount:"} <span className="text-my-green-dark">${Number(p.amount).toFixed(2)}</span></p>
                    <p className="w-full flex justify-between">{p.type === "FUND" ? "Target Date:" : "Due:"} <span className="text-my-green-dark">{format(p.dueDate.toDate(), p.type === "FUND" ? "MMM do, yyyy" : "do")}</span></p>
                    {p.type === "DEBT" && <p className="w-full flex justify-between">Remaining Due: <span className="text-my-green-dark">${Number(p.total).toFixed(2)}</span></p>}
                    {p.type === "FUND" && <p className="w-full flex justify-between">Target Amount: <span className="text-my-green-dark">${Number(p.total).toFixed(2)}</span></p>}
                </div>
                <br />
                <div className="flex flex-col justify-center items-center gap-2 ">
                    <div className={`cursor-pointer hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px] ${p.paid && "bg-my-green-dark text-my-white-dark"}` }
                        onClick={() => { updatePaid() }}>
                        <GiMoneyStack
                            className={`p-[2px] ${!p.paid && "border-2"} rounded-md bg-my-green-dark text-white border-my-black-dark`} size={27} />
                        <p className="text-xs">Mark As {!p.paid ? "Paid" : "Not Paid"}</p>
                    </div>
                    <div className="cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
                        onClick={() => { setShowForm(true) }}>
                        <IoPencil
                            className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark" size={27} />
                        <p className="text-xs">Manually Edit Payment</p>
                    </div>
                    <div className="cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full mb-8 border-2 rounded-md p-[5px]"
                        onClick={() => { handleDeleteBill(p) }}>
                        <IoTrash
                            className="p-[2px] border-2 rounded-md bg-my-red-dark text-white border-my-black-dark" size={27} />
                        <p className="text-xs">Delete Payment</p>
                    </div>
                    <Button onClick={handleBack} color="red">
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}