import { useState } from "react";
import Button from "./Button";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import Popup from "./Popup";
import type { Envelope } from "../types";

interface NvelopeCalculatorProps {
    handleEnterAmount: (amount: number, envelopeId?: string) => void;
    handleBack: (() => void) | undefined;
    selectEnvelope?: boolean;
    envelope?: Envelope;
}
export default function NvelopeCalculator({ handleEnterAmount, handleBack, selectEnvelope, envelope }: NvelopeCalculatorProps) {
    const [amount, setAmount] = useState(0);
    const [showError, setShowError] = useState(false);
    const [selectedEnvelope, setSelectedEnvelope] = useState<string | undefined>(undefined);  
    const {envelopes, totalSpendingBudget} = useGetDatabase();

    return (
        <div className="absolute inset-0 bg-my-black-base text-my-white-dark flex items-center justify-center flex-col gap-5">
            {showError && <Popup type="error" >Must enter a valid amount: More than zero, less than envelope balance ;)</Popup>}
            <h2 className="text-2xl">Enter Amount{envelope?.name ? ` for ${envelope.name}` : ''}</h2>
            <input 
                className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
                type="number" onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="$5 from groceries..." />
            {selectEnvelope && (
                <select onChange={(e) => setSelectedEnvelope(e.target.value)}
                    className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark" 
                    value={selectedEnvelope || ""}>
                    <option disabled value="">Select an envelope</option>
                    {envelopes.map(envelope => (<option key={envelope.id} value={envelope.id}>{envelope.name}</option>))}
                </select>
            )}
            <Button
                onClick={() => {
                    if (!amount || amount > totalSpendingBudget) {
                        setShowError(true);
                        return;
                    }
                    handleEnterAmount(amount, selectedEnvelope)
                }}
                color="green"
            >
                Save
            </Button>
            <Button
                onClick={() => handleBack?.()}
                color="red"
            >
                Cancel
            </Button>
        </div>
    )
}