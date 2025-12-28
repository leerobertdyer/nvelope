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
export default function AddIncomeForm({
  showLoading,
  loadingText,
  setIsAddingCash,
  addCashToDb,
  cashAmount,
  setCashAmount,
  cashName,
  setCashName,
}: IAddIncomeForm) {
  async function handleSave() {
    await addCashToDb();
    setCashName("");
    setCashAmount("");
    setIsAddingCash(false);
  }

  function handleBack() {
    setCashName("");
    setCashAmount("");
    setIsAddingCash(false);
  }

  return (
    <>
      {showLoading && <Loading text={loadingText} />}
      <FullScreen>
        <h3 className="text-center w-full text-my-white-light p-2 text-3xl mb-4">Add Income</h3>
        <div className="bg-my-green-dark rounded-md text-my-white-light w-[90vw] md:w-[30rem] m-auto p-4 pb-6 flex flex-col gap-4 items-center">
          <div className="w-full max-w-[20rem] m-auto h-fit flex flex-col items-center justify-center">
            <TextInput
              label="Amount To Add"
              id="newCashAmount"
              numeric
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
          {Number(cashAmount) > 0 && cashName.length > 0 && (
            <Button onClick={handleSave} color="green">
              Save
            </Button>
          )}
          <Button onClick={handleBack} color="red">
            Back
          </Button>
        </div>
      </FullScreen>
    </>
  );
}
