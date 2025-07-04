import Nvelope from "./Nvelope";

import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import type { Envelope } from "../types";
import { editEnvelopes, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useEffect, useState } from "react";
import GiveAndTake from "../Views/GiveAndTake";
import ListEnvelope from "./ListEnvelope";
import BigEnvelope from "./BigEnvelope";

interface NvelopeProps {
    resetState: () => void;
    handleSetupNewEnvelope: () => void;
    handleSetupEdit: (envelope: Envelope) => void;
    editEnvelope: (envelope: Envelope) => Promise<void>;
    handleSetShowSpendingPage: (envelope: Envelope) => void;
    handleDeleteEnvelope: (id?: string) => void;
    handleEditRent: (amount: number) => Promise<void>;
    handleAddCashToEnvelope: (envelope: Envelope) => void;
}

export default function Nvelopes({resetState, handleSetupNewEnvelope, handleSetupEdit, editEnvelope, handleSetShowSpendingPage, handleDeleteEnvelope, handleAddCashToEnvelope }: NvelopeProps) {
    const { totalSpendingBudget, setTotalSpendingBudget, envelopes, setEnvelopes } = useGetDatabase();
    const { user } =  useAuth();
    const [showGiveAndTake, setShowGiveAndTake] = useState(false);
    const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
    const [isEnvelopeSelected, setIsEnvelopeSelected] = useState(false);
    const [sortedEnvelopes, setSortedEnvelopes] = useState<Envelope[]>([]);

    useEffect(() => {
        const stupidLargeNumber = 1000;
        const sorted = [...envelopes].sort((a, b) => (a.order || stupidLargeNumber) - (b.order || stupidLargeNumber));
        setSortedEnvelopes(sorted);
    }, [envelopes]);

    const emptyEnvelope = { id: '', name: '', total: 0, spent: 0, oneTime: false }

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
            envelopeToEdit.total -= amount;
            remainingBalancePlusTotal = totalSpendingBudget + amount
        } else {
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
      return <BigEnvelope handleAddCashToEnvelope={handleAddCashToEnvelope} handleBack={() => setIsEnvelopeSelected(false)}  envelope={envelopeToEdit!} resetState={resetState} editEnvelope={editEnvelope} handleSetShowSpendingPage={handleSetShowSpendingPage} handleSetupEdit={handleSetupEdit} setUpShowGiveAndTake={setUpShowGiveAndTake} handleDeleteEnvelope={handleDeleteEnvelope}/>
    }

    function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
        event.dataTransfer.setData('text/plain', event.currentTarget.id);
    }

    function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
    }

    async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        const draggedEnvelope = envelopes.find(e => e.id === id);
        if (!draggedEnvelope) return;
        console.log(`Dragging ${draggedEnvelope.name}`);
        const newEnvelopes = [...envelopes];
        const draggedEnvelopeIndex = newEnvelopes.findIndex(e => e.id === id);
        newEnvelopes.splice(draggedEnvelopeIndex, 1); // removes the dragged envelope
        const targetEnvelopeIndex = newEnvelopes.findIndex(e => e.id === event.currentTarget.id);
        console.log(`Dropping ${draggedEnvelope.name} into ${newEnvelopes[targetEnvelopeIndex].name}`);
        newEnvelopes.splice(targetEnvelopeIndex, 0, draggedEnvelope); // places the dragged envelope in the new position
        // set the new order by looping over the newEnvelopes
        for (let i = 0; i < newEnvelopes.length; i++) {
            newEnvelopes[i].order = i + 1;
        }
        setEnvelopes(newEnvelopes);
        await editEnvelopes(newEnvelopes, user!.uid);
    }

    function handleDragEnd(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
    }


    return (
        <div className="w-full text-center flex flex-col items-center h-screen">
            <div className="w-full flex justify-center items-center ">
                <Nvelope kind="dash" envelope={{...emptyEnvelope, name: 'New Envelope'}} onClick={handleSetupNewEnvelope} handleBack={resetState} />
            </div>
            <div className="flex flex-col justify-center items-center gap-2 mt-4 pb-[20rem]">
                {/* Grid Header Row */}
                <div className="w-screen max-w-[40rem]  h-[2rem] grid grid-cols-7 divide-x-2 divide-my-black-dark border-2 border-my-black-dark bg-my-black-dark text-my-white-light font-bold">
                    <div className="col-span-3 flex justify-center items-center">
                        <p className="text-sm">Nvelope</p>
                    </div>
                    <div className="flex justify-center items-center col-span-2">
                        <p className="text-sm">Remaining</p>
                    </div>
                    <div className="flex justify-center items-center col-span-2">
                        <p className="text-sm">Total</p>
                    </div>
                </div>
                {sortedEnvelopes.map(e => (
                    <div key={e.id}>
                        <ListEnvelope envelope={e} onClick={() => handleSelectListEnvelope(e)}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}/>
                    </div>
                ))}
            </div>
        </div>
    )
}