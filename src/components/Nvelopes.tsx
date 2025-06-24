import Nvelope from "./Nvelope";

import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import {  IoPencil } from "react-icons/io5";
import type { Envelope } from "../types";
import { GiMoneyStack } from "react-icons/gi";
import { editEnvelopes, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useState } from "react";
import GiveAndTake from "../Views/GiveAndTake";
import ListEnvelope from "./ListEnvelope";
import BigEnvelope from "./BigEnvelope";

interface NvelopeProps {
    handleEditCash: () => void;
    handleAddCash: () => void;
    resetState: () => void;
    handleSetupNewEnvelope: () => void;
    handleSetupEdit: (envelope: Envelope) => void;
    editEnvelope: (envelope: Envelope) => Promise<void>;
    handleSetShowSpendingPage: (envelope: Envelope) => void;
    handleDeleteEnvelope: (id?: string) => void;
    handleEditRent: (amount: number) => Promise<void>;
}

export default function Nvelopes({handleEditCash, handleAddCash, resetState, handleSetupNewEnvelope, handleSetupEdit, editEnvelope, handleSetShowSpendingPage, handleDeleteEnvelope }: NvelopeProps) {
    const { totalSpendingBudget, setTotalSpendingBudget, envelopes, setEnvelopes } = useGetDatabase();
    const { user } =  useAuth();
    const [showGiveAndTake, setShowGiveAndTake] = useState(false);
    const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
    const [isEnvelopeSelected, setIsEnvelopeSelected] = useState(false);


    const emptyEnvelope = { id: '', name: '', total: 0, spent: 0, recurring: false }

    function handleBack() {
        setShowGiveAndTake(false);
        setIsEnvelopeSelected(false);
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
        await editTotalSpendingBudget(remainingBalancePlusTotal, user!.uid);
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
        await editEnvelopes(newEnvelopes, user!.uid);
        setEnvelopes(newEnvelopes);
        handleBack();
    }

    function setUpShowGiveAndTake(envelope: Envelope) {
        setShowGiveAndTake(true);
        setEnvelopeToEdit(envelope);
    }

    function handleSelectListEnvelope(envelope: Envelope) {
        setIsEnvelopeSelected(true);
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

    if (isEnvelopeSelected) {
      return <BigEnvelope  envelope={envelopeToEdit!} resetState={resetState} editEnvelope={editEnvelope} handleSetShowSpendingPage={handleSetShowSpendingPage} handleSetupEdit={handleSetupEdit} setUpShowGiveAndTake={setUpShowGiveAndTake} handleDeleteEnvelope={handleDeleteEnvelope}/>
    }

    return (
        <div className="z-12 w-full text-center flex flex-col items-center h-screen overflow-y-auto py-[2rem]">
            <h3 className={`border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative`}>
                <IoPencil 
                    onClick={handleEditCash}
                    className="top-1/2 -translate-y-1/2 left-[-3rem] cursor-pointer absolute border-2 rounded-md bg-my-white-dark border-my-red-dark text-my-red-dark animate-glow shadow-lg shadow-my-red-light w-[2rem] h-[2rem]"  />
                Available Budget: ${totalSpendingBudget.toFixed(2)}
                <GiMoneyStack 
                    onClick={handleAddCash}
                    className="top-1/2 -translate-y-1/2 right-[-3rem] cursor-pointer absolute border-2 rounded-md bg-my-white-dark border-my-green-dark animate-glow shadow-lg shadow-my-green-light w-[2rem] h-[2rem]"  />
            </h3>
            <Nvelope kind="dash" envelope={{...emptyEnvelope, name: 'Nvelope'}} onClick={handleSetupNewEnvelope} handleBack={resetState} />
            <div className="flex flex-col justify-center items-center gap-2 mt-8 pb-[20rem]">
                {/* Grid Header Row */}
                <div className="w-screen max-w-[40rem] h-[2rem] grid grid-cols-5 divide-x-2 divide-my-black-dark border-2 border-my-black-dark bg-my-black-dark text-my-white-light font-bold">
                    <div className="col-span-3 flex justify-center items-center">
                        <p className="text-sm">Nvelope</p>
                    </div>
                    <div className="flex justify-center items-center">
                        <p className="text-sm">Spent</p>
                    </div>
                    <div className="flex justify-center items-center">
                        <p className="text-sm">Total</p>
                    </div>
                </div>
                {envelopes.map(envelope => (
                    <div key={envelope.id}>
                        <ListEnvelope envelope={envelope} onClick={() => handleSelectListEnvelope(envelope)}/>
                    </div>
                ))}
            </div>
        </div>
    )
}