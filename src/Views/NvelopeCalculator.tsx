import { useState } from "react";
import Button from "../components/Buttons/Button";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import type { Envelope } from "../types";
import TextInput from "../components/TextInput";

interface NvelopeCalculatorProps {
    handleEnterAmount: (amount: number, envelope: Envelope) => void;
    handleBack: (() => void) | undefined;
    selectEnvelope?: boolean;
    envelope?: Envelope;
}
export default function NvelopeCalculator({ handleEnterAmount, handleBack, selectEnvelope, envelope }: NvelopeCalculatorProps) {
    const { envelopes } = useDatabase();

    const [amount, setAmount] = useState('');
    const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | undefined>(undefined);


    function handleSetAmount(amount: string) {
        if (!amount || Number(amount) <= 0) return;
        if (selectedEnvelope) {
            const envelope = envelopes.find(e => e.id === selectedEnvelope.id);
            if (envelope && Number(amount) > 0 && Number(amount) <= envelope.total) {
                setAmount(amount);
            } else {
                setAmount('');
                return
            }
        } else {
            if (envelope && Number(amount) > 0 && Number(amount) <= envelope.total) {
                setAmount(amount);
            } else {
                setAmount('');
                return
            }
        }
    }

    function handleSetEnvelope(id: string) {
        const envelope = envelopes.find(e => e.id === id);
        setSelectedEnvelope(envelope || undefined);
    }

    return (
        <div className="absolute inset-0 bg-my-black-base text-my-white-light flex items-center justify-center flex-col gap-5">
            <div className="max-w-[20rem] flex flex-col justify-center align-center gap-2">
                {envelope && <p className="w-full">
                    <span className="text-my-white-dark">"{envelope.name}"</span> balance:
                    <span className="text-my-green-light ml-2">
                        ${Number(envelope?.total) - Number(envelope?.spent) - Number(amount)}
                    </span>
                </p>}
                <TextInput
                    id="newAmountForEnvelope"
                    label="Amount To Spend"
                    numeric
                    onChange={(e) => handleSetAmount(e.target.value)}
                    value={amount}
                    placeholder={`$5 from ${envelope?.name ?? ""}`} />
                {selectEnvelope && (
                    <select onChange={(e) => handleSetEnvelope(e.target.value)}
                        className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
                        value={selectedEnvelope?.id || ""}>
                        <option disabled value="">Select an envelope</option>
                        {envelopes.map(envelope => (<option key={envelope.id} value={envelope.id}>{envelope.name}</option>))}
                    </select>
                )}
            </div>
            <Button
                onClick={() => {
                    handleEnterAmount(Number(amount), selectedEnvelope || envelope!)
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