export type PaymentTypeOption = "BILL" | "DEBT" | "FUND";

interface IPaymentTypeSelector {
  onSelect: (type: PaymentTypeOption) => void;
  onSkip?: () => void;
  onBack?: () => void;
  skipText?: string;
}

export default function PaymentTypeSelector({
  onSelect,
  onSkip,
  onBack,
  skipText = "Skip - I'll add payments later",
}: IPaymentTypeSelector) {
  return (
    <div
      className={`
    flex 
    flex-col 
    justify-center
    items-center 
    gap-4 
    w-full`}
    >
      <button
        type="button"
        onClick={() => onSelect("BILL")}
        className="w-[80%] max-w-[20rem] p-3 rounded-md bg-my-white-light text-my-black-dark border-2 border-my-red-dark hover:bg-my-red-light transition-colors"
      >
        <span className="font-bold text-my-red-dark">BILL</span>
        <p className="text-xs">Utilities, Subscriptions, Rent...</p>
      </button>

      <button
        type="button"
        onClick={() => onSelect("DEBT")}
        className="w-[80%] max-w-[20rem] p-3 rounded-md bg-my-white-light text-my-black-dark border-2 border-my-blue-dark hover:bg-my-blue-light transition-colors"
      >
        <span className="font-bold text-my-blue-dark">DEBT</span>
        <p className="text-xs">Loans, Credit Cards, etc.</p>
      </button>

      <button
        type="button"
        onClick={() => onSelect("FUND")}
        className="w-[80%] max-w-[20rem] p-3 rounded-md bg-my-white-light text-my-black-dark border-2 border-my-green-dark hover:bg-my-green-light transition-colors"
      >
        <span className="font-bold text-my-green-dark">FUND</span>
        <p className="text-xs">
          Planned expense to save for
          <br />
          (doctor visit, vacation, etc.)
        </p>
      </button>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="w-[80%] max-w-[20rem] p-2 rounded-md text-my-white-dark border border-my-white-dark hover:text-my-white-light mt-4 transition-colors"
        >
          {skipText}
        </button>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-[80%] max-w-[20rem] p-2 rounded-md cursor-pointer hover:bg-my-black-dark hover:text-my-white-dark border border-my-red-dark bg-my-red-dark text-my-white-light mt-4 transition-colors"
        >
          Back
        </button>
      )}
    </div>
  );
}
