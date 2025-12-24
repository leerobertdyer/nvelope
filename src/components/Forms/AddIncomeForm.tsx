import Button from "../Buttons/Button";
import Loading from "../Loading";
import TextInput from "../TextInput";
import FullScreen from "../../Views/FullScreen";

interface IAddIncomeForm {
    showLoading: boolean;
    loadingText: string;
    setIsAddingCash: (b: boolean) => void;
    addCashToDb: () => Promise<void>;
    cashAmount: string;
    setCashAmount: (s: string) => void;
    cashName: string;
    setCashName: (s: string) => void;
}
export default function AddIncomeForm({ showLoading, loadingText, setIsAddingCash, addCashToDb, cashAmount, setCashAmount, cashName, setCashName, }: IAddIncomeForm) {
    async function handleSave() {
        await addCashToDb()
        setCashName("")
        setCashAmount("0")
        setIsAddingCash(false)
    }

    function handleBack() {
        setCashName("")
        setCashAmount("0")
        setIsAddingCash(false)
    }

    return (
        <>
            {showLoading && <Loading text={loadingText} />}
            <FullScreen>
                <div className="bg-my-white-base rounded-md text-my-black-dark w-[30rem] m-auto p-4 pb-6 flex flex-col gap-4 items-center">
                    <div className="w-full max-w-[20rem] m-auto h-fit flex flex-col items-center justify-center">
                        <h3 className="p-2 text-lg mb-4">Add Income</h3>
                        <TextInput
                            label="Amount To Add"
                            id="newCashAmount"
                            textOrNumber="number"
                            placeholder="Amount"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                        />
                        <TextInput
                            id="newCashName"
                            label="Income Source"
                            value={cashName}
                            onChange={(e) => setCashName(e.target.value)}
                            placeholder="Income Source"
                        />
                    </div>
                    {Number(cashAmount) > 0 && cashName.length > 0 && <Button onClick={handleSave} color="green">Save</Button>}
                    <Button onClick={handleBack} color="red">Back</Button>
                </div>
            </FullScreen>
        </>
    )
}