import Nvelope from "./Nvelope";

import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import {  IoPencil, IoStar } from "react-icons/io5";
import type { Envelope } from "../types";
import { IoIosTrash } from "react-icons/io";
import { GiMoneyStack } from "react-icons/gi";
import { editEnvelopes, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useState } from "react";
import GiveAndTake from "../Views/GiveAndTake";

interface NvelopeProps {
    handleEditCash: () => void;
    handleAddCash: () => void;
    resetState: () => void;
    handleSetupNewEnvelope: () => void;
    handleSetupEdit: (envelope: Envelope) => void;
    editEnvelope: (envelope: Envelope) => Promise<void>;
    handleSetShowSpendingPage: (envelope: Envelope) => void;
    handleDeleteEnvelope: (id?: string) => void;
}

export default function Nvelopes({handleEditCash, handleAddCash, resetState, handleSetupNewEnvelope, handleSetupEdit, editEnvelope, handleSetShowSpendingPage, handleDeleteEnvelope }: NvelopeProps) {
    const { totalSpendingBudget, setTotalSpendingBudget, envelopes, setEnvelopes } = useGetDatabase();
    const { user } =  useAuth();
    const [showGiveAndTake, setShowGiveAndTake] = useState(false);
    const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);

    const emptyEnvelope = { id: '', name: '', total: 0, spent: 0, recurring: false }

    function handleBack() {
        setShowGiveAndTake(false);
        setEnvelopeToEdit(null);
        resetState();
    }

    async function takeBalanceFromEnvelope(amount?: number) {
        if (!envelopeToEdit) return;
        let remainingBalancePlusTotal;
        if (amount) {
            console.log("using amount in takeBalanceFromEnvelope", amount)
            envelopeToEdit.total -= amount;
            remainingBalancePlusTotal = totalSpendingBudget + amount
        } else {
            console.log("not using amount in takeBalanceFromEnvelope taking entire remainder")
            remainingBalancePlusTotal = totalSpendingBudget + (envelopeToEdit.total - envelopeToEdit.spent);
            envelopeToEdit.total = envelopeToEdit.spent;
        }
        await editEnvelope(envelopeToEdit);
        await editTotalSpendingBudget(remainingBalancePlusTotal, user?.uid || '');
        setTotalSpendingBudget(remainingBalancePlusTotal);
        handleBack();
    }

    async function takeAndGive(envelope: Envelope, amount: number) {
        if (!envelope || !envelopeToEdit) return;
        console.log('takeandgive')
        envelope.total += amount;
        envelopeToEdit.total -= amount;
        const newEnvelopes = [...envelopes];
        const envelopeIndex = newEnvelopes.findIndex(e => e.id === envelope.id);
        newEnvelopes[envelopeIndex] = envelope;
        const envelopeToEditIndex = newEnvelopes.findIndex(e => e.id === envelopeToEdit.id);
        newEnvelopes[envelopeToEditIndex] = envelopeToEdit;
        await editEnvelopes(newEnvelopes, user?.uid || '');
        setEnvelopes(newEnvelopes);
        handleBack();
    }

    function setUpShowGiveAndTake(envelope: Envelope) {
        setShowGiveAndTake(true);
        setEnvelopeToEdit(envelope);
    }
    
    if (showGiveAndTake && envelopeToEdit) {
        return (
            <GiveAndTake
                envelope={envelopeToEdit}
                handleBack={handleBack}
                takeAndGive={takeAndGive}
                takeFromEnvelope={takeBalanceFromEnvelope}
            />
        );
    }

    return (
        <div className="z-12 w-full text-center flex flex-col items-center h-screen overflow-y-auto py-[2rem]">
            <h3 className={`border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative`}>
                <IoPencil 
                    onClick={handleEditCash}
                    className="top-1/2 -translate-y-1/2 left-[-3rem] cursor-pointer absolute z-200 border-2 rounded-md bg-my-white-dark border-my-red-dark text-my-red-dark animate-glow shadow-lg shadow-my-red-light w-[2rem] h-[2rem]"  />
                Available Budget: ${totalSpendingBudget.toFixed(2)}
                <GiMoneyStack 
                    onClick={handleAddCash}
                    className="top-1/2 -translate-y-1/2 right-[-3rem] cursor-pointer absolute z-200 border-2 rounded-md bg-my-white-dark border-my-green-dark animate-glow shadow-lg shadow-my-green-light w-[2rem] h-[2rem]"  />
            </h3>
            <div className="flex justify-center items-center gap-4 w-[80%] max-w-[15rem] p-2 border-2 rounded-md bg-my-white-dark border-my-green-dark">
                <IoStar className="w-[2rem] h-[2rem]"  />
                <p className="text-sm"> Recurring Envelope</p>
            </div>
            <Nvelope kind="dash" envelope={{...emptyEnvelope, name: 'Nvelope'}} onClick={handleSetupNewEnvelope} handleBack={resetState} />
            <div className="flex flex-wrap justify-around items-center gap-4 mt-8 pb-[20rem]">

            {envelopes.map(envelope => (
                <div className="relative cursor-pointer hover:scale-105" key={envelope.id} >
                    <div 
                        onClick={() => handleSetShowSpendingPage(envelope)}>
                        <Nvelope 
                            kind="envelope" 
                            envelope={envelope} 
                            handleBack={resetState}
                            editEnvelope={editEnvelope}
                            />
                        <div className="absolute bottom-3 z-9999 flex justify-center items-center gap-2 w-full">
                            <GiMoneyStack
                                onClick={(e) => {e.stopPropagation(); setUpShowGiveAndTake(envelope)}}
                                className="p-[2px] cursor-pointer border-2 rounded-md bg-my-green-dark text-white border-my-black-dark"  size={20}/>
                            <IoPencil 
                                onClick={(e) => {e.stopPropagation(); handleSetupEdit(envelope)}}
                                className="p-[2px] cursor-pointer border-2 rounded-md bg-my-white-dark text-black border-my-black-dark"  size={20}/>
                            <IoIosTrash 
                                onClick={(e) => {e.stopPropagation(); handleDeleteEnvelope?.(envelope.id)}}
                                className="p-[2px] cursor-pointer border-2 rounded-md bg-my-red-dark text-white border-my-black-dark"  size={20}/>
                        </div>
                    </div>
                </div>
            ))}

            </div>
        </div>
    )
}