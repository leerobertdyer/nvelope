import { BiEnvelope } from "react-icons/bi";
import type { Envelope } from "../types";

export default function ListEnvelope({ envelope, onClick}: {envelope: Envelope, onClick: () => void}) {
    return (
        <div className={`
            ${envelope.spent >= (envelope.total * 0.75)
                ? 'bg-my-red-dark text-my-white-light'
                : envelope.spent >= (envelope.total * 0.5) 
                    ? 'bg-my-white-dark text-my-black-dark' 
                    : 'bg-my-green-dark text-my-white-dark'}
            w-screen max-w-[40rem] h-[2rem] grid grid-cols-7 divide-x-2 divide-my-black-dark
            border-2 border-my-black-dark cursor-pointer`}
            onClick={onClick}>

                <div className="col-span-3 flex justify-start items-center ml-2 gap-10 relative text-xs">
                    <div className="w-fit h-[85%] flex justify-start items-center bg-white rounded-lg">
                        <BiEnvelope className="w-[2rem] h-[2rem] text-my-black-dark" />
                    </div>
                    <p className="absolute left-1/2 -translate-x-1/2">{envelope.name}</p>
                </div>
                <div className="flex justify-center items-center col-span-2">
                    <p className="text-sm">${envelope.spent.toFixed(2)}</p>
                </div>
                <div className="flex justify-end items-center mr-2 gap-4 col-span-2">
                    <p className="text-sm">${envelope.total.toFixed(2)}</p>
                </div>
        </div>
    )
}