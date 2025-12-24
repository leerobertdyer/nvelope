import { GiMoneyStack } from "react-icons/gi";
import { IoPencil, IoTrash } from "react-icons/io5";
import { IoIosHand } from "react-icons/io";
import type { Envelope } from "../types";
import SpendBtn from "../components/Buttons/SpendBtn";
import Button from "../components/Buttons/Button";

interface IBigEnvelope {
    handleBack: () => void,
    envelope: Envelope, resetState: () => void,
    handleSetShowSpendingPage: (envelope: Envelope) => void,
    handleSetupEdit: (envelope: Envelope) => void,
    setUpShowGiveAndTake: (envelope: Envelope) => void,
    handleDeleteEnvelope: (id: string) => void,
    handleAddCashToEnvelope: (envelope: Envelope) => void
}

export default function BigEnvelope({ handleBack, envelope, handleSetShowSpendingPage, handleSetupEdit, setUpShowGiveAndTake, handleDeleteEnvelope, handleAddCashToEnvelope }: IBigEnvelope) {
    const envelopeRemainder = (Number(envelope.total) - Number(envelope.spent)).toFixed(2)
    return (
        <div className="absolute top-[2rem] left-0 pt-[2rem] bg-my-white-light w-full overflow-y-auto z-999 h-screen">
            <div className="w-full flex flex-col items-center justify-start">
                <div className="p-2 text-lg text-my-white-dark text-center w-full flex justify-center gap-2 bg-my-black-base">
                    {envelope.name}
                    <span className="text-my-green-base">
                        ${envelopeRemainder}
                    </span>
                </div>
                <hr className="w-full border-[1px] mb-4" />
                <Button onClick={handleBack} color="red">
                    Go Back
                </Button>
                <br />
                <div className="flex flex-col justify-center items-center gap-2 ">
                    <div className="shadow shadow-black cursor-pointer hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
                        onClick={(e) => { e.stopPropagation(); handleAddCashToEnvelope(envelope) }}>
                        <GiMoneyStack
                            className="p-[2px] border-2 rounded-md bg-my-green-dark text-white border-my-black-dark" size={27} />
                        <p className="text-xs">Add Money From Available Budget</p>
                    </div>
                    <div className="shadow shadow-black flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px] cursor-pointer  hover:scale-105"
                        onClick={(e) => { e.stopPropagation(); setUpShowGiveAndTake(envelope) }}>
                        <IoIosHand
                            className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark" size={27} />
                        <p className="text-xs">Take from this envelope</p>
                    </div>
                    <div className="shadow shadow-black cursor-pointer  hover:scale-105 flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
                        onClick={(e) => { e.stopPropagation(); handleSetupEdit(envelope) }}>
                        <IoPencil
                            className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark" size={27} />
                        <p className="text-xs">Manually Edit Envelope</p>
                    </div>
                    <div className="cursor-pointer shadow shadow-black hover:scale-105 flex justify-start gap-2 items-center w-full mb-8 border-2 rounded-md p-[5px]"
                        onClick={(e) => { e.stopPropagation(); handleDeleteEnvelope(envelope.id) }}>
                        <IoTrash
                            className="p-[2px] border-2 rounded-md bg-my-red-dark text-white border-my-black-dark" size={27} />
                        <p className="text-xs">Delete Envelope</p>
                    </div>
                    <SpendBtn onClick={() => handleSetShowSpendingPage(envelope)} />

                </div>
            </div>
        </div>
    )
}