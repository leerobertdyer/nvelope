import Button from "../components/Buttons/Button";
import Loading from "../components/Loading";
import MoneyInput from "../components/MoneyInput";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import type { Envelope } from "../types";

interface iAddCashToEnvelopeForm {
    showLoading: boolean;
    loadingText: string;
    cashAmount: number;
    envelopeToEdit?: Envelope;
    setCashAmount: (n: number) => void;
    addCashToEnvelope: () => Promise<void>
    setIsAddingCashToEnvelope: (b: boolean) => void;
}

export default function AddCashToEnvelopeForm({ showLoading, loadingText, cashAmount, envelopeToEdit, setCashAmount, addCashToEnvelope, setIsAddingCashToEnvelope }: iAddCashToEnvelopeForm) {
    const { totalSpendingBudget } = useDatabase();

    return (
        <>
            {showLoading && <Loading text={loadingText} />}
            <div className="absolute inset-0 bg-my-black-base text-my-white-dark w-full h-screen flex flex-col items-center justify-center">
                <p className="text-my-white-light mb-2">Remaining Budget: ${(totalSpendingBudget - cashAmount).toFixed(2)}</p>
                <h3 className="p-2 text-my-white-light mb-4">
                    Add Cash to "{envelopeToEdit?.name}"
                </h3>
                <MoneyInput
                    id="add-cash-amount"
                    label=""
                    value={cashAmount}
                    onChange={setCashAmount}
                    placeholder="Amount"
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