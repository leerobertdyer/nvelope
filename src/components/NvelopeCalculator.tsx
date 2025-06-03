import { useState } from "react";
import Button from "./Button";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import Popup from "./Popup";
import type { Envelope } from "../types";
import { IoIosSad } from "react-icons/io";

interface NvelopeCalculatorProps {
    handleEnterAmount: (amount: number, envelopeId?: string) => void;
    handleBack: (() => void) | undefined;
    selectEnvelope?: boolean;
    envelope?: Envelope;
}
export default function NvelopeCalculator({ handleEnterAmount, handleBack, selectEnvelope, envelope }: NvelopeCalculatorProps) {
    const [amount, setAmount] = useState('');
    const [showError, setShowError] = useState(false);
    const [selectedEnvelope, setSelectedEnvelope] = useState<string | undefined>(undefined);  
    const {envelopes, totalSpendingBudget} = useGetDatabase();

    function handleSetAmount(amount: string) {
        if (!amount || Number(amount) <= 0) return;
        console.log(amount)
        if (selectedEnvelope) {
            const envelope = envelopes.find(e => e.id === selectedEnvelope);
            if (envelope && Number(amount) > 0 && Number(amount) <= envelope.total) {
                setAmount(amount);
            } else {
                setShowError(true);
                setAmount('');
                return
            }
        } else {
            if (envelope && Number(amount) > 0 && Number(amount) <= envelope.total) {
                setAmount(amount);
            } else {
                setShowError(true);
                setAmount('');
                return
            }
        }
        setShowError(false);
    }

    return (
        <div className="absolute inset-0 bg-my-black-base text-my-white-dark flex items-center justify-center flex-col gap-5">
            {showError && <Popup type="error" >Amount must be less than your remaining {totalSpendingBudget}, and less than your {envelope?.name} balance ${envelope?.total}<IoIosSad className="text-my-white-dark w-[2rem] h-[2rem]" /></Popup>}
            <h2 className="text-2xl">Enter Amount{envelope?.name ? ` for ${envelope.name}` : ''}</h2>
            <input 
                className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
                type="number" onChange={(e) => handleSetAmount(e.target.value)}
                value={amount}
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
                    const nextAmount = Number(amount)
                    let envelopeTotal = 0;
                    if (envelope) {
                        envelopeTotal = envelope.total - envelope.spent
                    }
                    console.log('total spending and amount and enveelpe', totalSpendingBudget, nextAmount, envelopeTotal)
                    if (totalSpendingBudget - nextAmount < 0) {
                        setShowError(true)
                    } else if (envelope && envelopeTotal > 0 && nextAmount > envelopeTotal) {
                        setShowError(true)
                    } else {
                        handleEnterAmount(Number(amount), selectedEnvelope)
                    }
                }}
                color="green"
            >
                Save
            </Button>
            <Button
                onClick={() => handleBack?.()}
                color="red"
            >
                {selectEnvelope ? 'View Nvelopes' : 'Cancel'}
            </Button>
        </div>
    )
}