import { GiMoneyStack } from "react-icons/gi";
import { IoPencil, IoTrash } from "react-icons/io5";
import { IoIosHand } from "react-icons/io";
import type { Envelope } from "../types";
import SpendBtn from "./SpendBtn";
import Button from "./Button";

export default function BigEnvelope({ handleBack, envelope, handleSetShowSpendingPage, handleSetupEdit, setUpShowGiveAndTake, handleDeleteEnvelope, handleAddCashToEnvelope }: { handleBack: () => void, envelope: Envelope, resetState: () => void, editEnvelope: (envelope: Envelope) => Promise<void>, handleSetShowSpendingPage: (envelope: Envelope) => void, handleSetupEdit: (envelope: Envelope) => void, setUpShowGiveAndTake: (envelope: Envelope) => void, handleDeleteEnvelope: (id: string) => void, handleAddCashToEnvelope: (envelope: Envelope) => void }) {
    return (
        <div className="absolute top-[2rem] pt-[3rem] bg-my-white-light w-full overflow-y-auto z-999 h-screen">
            <div className="w-full flex flex-col items-center justify-start ">
                <SpendBtn onClick={() => handleSetShowSpendingPage(envelope)} />
                <br />
                <div className="flex flex-col justify-center items-center gap-2 ">
                    <div className="cursor-pointer hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
                        onClick={(e) => { e.stopPropagation(); handleAddCashToEnvelope(envelope) }}>
                        <GiMoneyStack
                            className="p-[2px] border-2 rounded-md bg-my-green-dark text-white border-my-black-dark" size={27} />
                        <p className="text-xs">Add Money From Available Budget</p>
                    </div>
                    <div className="flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px] cursor-pointer  hover:scale-105 shadow-2xl"
                        onClick={(e) => { e.stopPropagation(); setUpShowGiveAndTake(envelope) }}>
                        <IoIosHand
                            className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark" size={27} />
                        <p className="text-xs">Take from this envelope</p>
                    </div>
                    <div className="cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
                        onClick={(e) => { e.stopPropagation(); handleSetupEdit(envelope) }}>
                        <IoPencil
                            className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark" size={27} />
                        <p className="text-xs">Manually Edit Envelope</p>
                    </div>
                    <div className="cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full mb-8 border-2 rounded-md p-[5px]"
                        onClick={(e) => { e.stopPropagation(); handleDeleteEnvelope(envelope.id) }}>
                        <IoTrash
                            className="p-[2px] border-2 rounded-md bg-my-red-dark text-white border-my-black-dark" size={27} />
                        <p className="text-xs">Delete Envelope</p>
                    </div>
                    <Button onClick={handleBack} color="red">
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}