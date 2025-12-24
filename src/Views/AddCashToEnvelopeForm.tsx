import Button from "../components/Buttons/Button";
import Loading from "../components/Loading";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import type { Envelope } from "../types";

interface iAddCashToEnvelopeForm {
    showLoading: boolean;
    loadingText: string;
    cashAmount: string;
    envelopeToEdit?: Envelope;
    setCashAmount: (s: string) => void;
    addCashToEnvelope: () => Promise<void>
    setIsAddingCashToEnvelope: (b: boolean) => void;
}

export default function AddCashToEnvelopeForm({ showLoading, loadingText, cashAmount, envelopeToEdit, setCashAmount, addCashToEnvelope, setIsAddingCashToEnvelope }: iAddCashToEnvelopeForm) {
    const { totalSpendingBudget } = useDatabase();

    return (
        <>
            {showLoading && <Loading text={loadingText} />}
            <div className="absolute inset-0 bg-my-white-dark text-mywhite-dark w-full h-screen flex flex-col items-center justify-center">
                Remaining Budget: ${totalSpendingBudget - Number(cashAmount)}
                <h3 className="p-2 text-my-green-dark mb-4">
                    Add Cash to "{envelopeToEdit?.name}"
                </h3>
                <input
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Amount"
                    className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative"
                />
                <div className="flex flex-col w-full items-center gap-2">
                    <Button onClick={addCashToEnvelope} color="green">
                        Add
                    </Button>
                    <Button
                        onClick={() => setIsAddingCashToEnvelope(false)}
                        color="red"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </>
    )
}