import { IoIosCheckmarkCircle, IoIosCheckmarkCircleOutline, IoIosClipboard, IoIosTrash } from "react-icons/io";
import type { Bill } from "../types";

interface BillMapProps {
    bills: Bill[];
    handleUpdatePaid: (bill: Bill) => void;
    handleEditBill: (bill: Bill) => void;
    handleDeleteBill: (bill: Bill) => void;
    isFutureBills?: boolean
}
export default function BillMap({bills, handleUpdatePaid, handleEditBill, handleDeleteBill, isFutureBills}: BillMapProps) {
    
    return (<>
        {bills.map((bill) => (
            <div key={bill.name}
                className={`grid grid-cols-4 w-full py-2 text-my-black-base border-2 border-my-white-light text-center
                    ${isFutureBills
                    ? 'bg-my-black-light text-my-white-light'
                    : bill.paid
                        ? 'bg-my-green-dark'
                        : 'bg-my-red-light text-my-black-dark'}
            ${bill.name.length > 20 && 'w-fit px-2'}`}>
        <p className="flex items-center justify-center">
            {new Date().toLocaleDateString('default', { month: 'long' })} {bill.originalDate.toDate().getDate()}</p>
        <p className="flex items-center justify-center">{bill.name}</p>
        <p className="flex items-center justify-center">${bill.amount.toFixed(2)}</p>
        <div className="flex gap-2 items-center justify-center">
            <IoIosClipboard 
                className="text-2xl text-my-red-light bg-my-white-dark cursor-pointer hover:text-my-white-dark hover:bg-my-red-light rounded-lg p-[2px] border-2 border-my-black-dark" 
                size={27} onClick={() => handleEditBill(bill)} />
            <IoIosTrash 
                className="text-2xl text-my-white-dark bg-my-red-dark cursor-pointer hover:text-my-red-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" 
                size={27} onClick={() => handleDeleteBill(bill)} />
            {bill.paid 
                ? <IoIosCheckmarkCircle 
                    onClick={() => handleUpdatePaid(bill)}
                    className="text-2xl text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" size={27} /> 
                : <IoIosCheckmarkCircleOutline 
                    onClick={() => handleUpdatePaid(bill)}
                    className="text-2xl text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark" size={27} />}
        </div>
    </div>
    ))}
    </>
    )
}