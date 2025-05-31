import { useState } from "react";
import Button from "../components/Button";
import type { Envelope } from "../types";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";

interface GiveAndTakeProps {
    envelope: Envelope;
    handleBack: () => void;
    takeAndGive: (envelope: Envelope, amount: number) => Promise<void>;
    takeFromEnvelope: (amount?: number) => Promise<void>;
}

export default function GiveAndTake({ envelope, handleBack, takeAndGive, takeFromEnvelope }: GiveAndTakeProps) {
    const [amount, setAmount] = useState('');
    const [isGiving, setIsGiving] = useState(false);
    const [envelopeToGiveTo, setEnvelopeToGiveTo] = useState<Envelope | null>(null);
    const { envelopes } = useGetDatabase();

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-my-black-base text-my-white-dark">
            <h3 className="text-2xl font-bold mb-4">Give and Take</h3>
            <div className="flex flex-col items-center gap-2">
                <label htmlFor="amount">Enter amount to <span className="text-my-red-light">take</span> from {envelope.name}</label>
                <input 
                    className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
                    id="amount" 
                    max={envelope.total - envelope.spent} 
                    type="number" 
                    placeholder="Enter amount" 
                    onChange={(e) => setAmount(e.target.value)} 
                    value={amount} 
                />
                <label htmlFor="giveOrTake">Do you want to give to another envelope?</label>
                <div className="flex justify-center w-full gap-2 items-center">
                    <input type="radio" id="give" name="giveOrTake" value="yes" onChange={() => setIsGiving(true)} />
                    <label htmlFor="give">Yes</label>
                    <input type="radio" id="take" name="giveOrTake" value="no" onChange={() => setIsGiving(false)} />
                    <label htmlFor="take">No</label>
                </div>
                {isGiving && (
                    <>
                        <label htmlFor="giveTo">Enter envelope to give to</label>
                        <select 
                            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
                            onChange={(e) => setEnvelopeToGiveTo(envelopes.find(envelope => envelope.id === e.target.value) || null)}
                            value={envelopeToGiveTo?.id || ''}
                        >
                            <option disabled value="">Select an envelope</option>
                            {envelopes.map(e => (
                               e.id !== envelope.id && <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </>
                )}
                {isGiving && envelopeToGiveTo !== null ? <Button
                    onClick={() => takeAndGive(envelopeToGiveTo, Number(amount))}
                    color="green"
                >
                    Give
                </Button>
                : !isGiving &&<Button
                    onClick={() => (amount === '' || amount === '0') ? takeFromEnvelope() : takeFromEnvelope(Number(amount))}
                    color="gold"
                >
                    Take
                </Button>
                }  
                <Button
                    onClick={handleBack}
                    color="red"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}