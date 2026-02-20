import { useState } from "react";
import Button from "../components/Buttons/Button";
import MoneyInput from "../components/MoneyInput";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import type { Envelope } from "../types";

interface NvelopeCalculatorProps {
  handleEnterAmount: (amount: number, envelope: Envelope) => void;
  handleBack: (() => void) | undefined;
  selectEnvelope?: boolean;
  envelope?: Envelope;
}
export default function NvelopeCalculator({
  handleEnterAmount,
  handleBack,
  selectEnvelope,
  envelope,
}: NvelopeCalculatorProps) {
  const { envelopes } = useDatabase();

  const [amount, setAmount] = useState(0);
  const [selectedEnvelope, setSelectedEnvelope] = useState<
    Envelope | undefined
  >(undefined);

  function handleSetAmount(dollars: number) {
    const env = selectedEnvelope || envelope;
    if (env && dollars > env.total) return;
    setAmount(dollars);
  }

  function handleSetEnvelope(id: string) {
    const env = envelopes.find((e) => e.id === id);
    setSelectedEnvelope(env || undefined);
  }

  function spendAll() {
    handleEnterAmount(Number(envelope?.total) - Number(envelope?.spent), selectedEnvelope || envelope!);
  }

  return (
    <div className="absolute inset-0 bg-my-black-base text-my-white-dark flex items-center justify-center flex-col gap-5">
      <div className="w-full max-w-[20rem] flex flex-col justify-center items-center gap-2">
        {envelope && (
          <p className="w-full text-center text-my-white-light">
            <span className="text-my-white-dark">"{envelope.name}"</span>{" "}
            balance:
            <span className="text-my-green-light ml-2">
              $
              {(Number(envelope?.total) -
                Number(envelope?.spent) -
                amount).toFixed(2)}
            </span>
          </p>
        )}

        <div className="w-full flex flex-col justify-center items-center gap-4">
          <Button onClick={spendAll} color="gold">
            Spend All
          </Button>
          <MoneyInput
            id="newAmountForEnvelope"
            label="Amount To Spend"
            value={amount}
            onChange={handleSetAmount}
            placeholder={`$5 from ${envelope?.name ?? ""}`}
          />
        </div>
        {selectEnvelope && (
          <select
            onChange={(e) => handleSetEnvelope(e.target.value)}
            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
            value={selectedEnvelope?.id || ""}
          >
            <option disabled value="">
              Select an envelope
            </option>
            {envelopes.map((envelope) => (
              <option key={envelope.id} value={envelope.id}>
                {envelope.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <Button
        onClick={() => {
          handleEnterAmount(amount, selectedEnvelope || envelope!);
        }}
        color="green"
      >
        Save
      </Button>
      <Button onClick={() => handleBack?.()} color="red">
        {selectEnvelope ? "View Nvelopes" : "Cancel"}
      </Button>
    </div>
  );
}
