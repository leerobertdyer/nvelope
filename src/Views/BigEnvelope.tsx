import type { Envelope } from "../types";
import SpendBtn from "../components/Buttons/SpendBtn";
import Button from "../components/Buttons/Button";
import NvelopeActionBtns from "../components/Buttons/NvelopeActionBtns";

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
                <div className="flex flex-col justify-center items-center gap-4">
                    <SpendBtn onClick={() => handleSetShowSpendingPage(envelope)} />
                    <NvelopeActionBtns
                        n={envelope}
                        onTake={() => setUpShowGiveAndTake(envelope)}
                        onAdd={() => handleAddCashToEnvelope(envelope)}
                        onEdit={() => handleSetupEdit(envelope)}
                        onDelete={() => handleDeleteEnvelope(envelope.id)}
                    />
                    <div className="h-8" />
                </div>
            </div>
        </div>
    )
}
