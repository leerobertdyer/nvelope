import { useState } from "react";
import FullScreen from "../../Views/FullScreen";
import type { Payment } from "../../types";
import type { SurplusDisposition } from "../../util";

interface IProps {
  debtName: string;
  /** The minimum payment freed up by paying off this debt. */
  freedUpAmount: number;
  /** Amount the payment exceeded the debt's remaining balance by, if any. */
  remainder: number;
  /** Remaining debts eligible to become the next snowball target, lowest balance first. */
  candidates: Payment[];
  defaultTargetId: string | null;
  /** Apply the chosen roll + surplus disposition. */
  onConfirm: (choice: {
    roll: boolean;
    targetId: string | null;
    surplus: SurplusDisposition;
  }) => void;
  /** Don't touch the snowball or the surplus for this payoff. */
  onDecline: () => void;
}

export default function CongratsPaidOffModal({
  debtName,
  freedUpAmount,
  remainder,
  candidates,
  defaultTargetId,
  onConfirm,
  onDecline,
}: IProps) {
  const hasCandidates = candidates.length > 0;
  const hasRemainder = remainder > 0;
  const [roll, setRoll] = useState(hasCandidates);
  const [targetId, setTargetId] = useState<string | null>(
    defaultTargetId ?? candidates[0]?.id ?? null,
  );
  const [surplus, setSurplus] = useState<SurplusDisposition>(
    hasRemainder ? "availableBudget" : "none",
  );

  if (!hasCandidates && !hasRemainder) {
    return (
      <FullScreen
        theme="DARK"
        onClose={onDecline}
        showButtons={true}
        closeButtonText="Close"
      >
        <div className="flex flex-col items-center justify-center text-center w-full px-4 py-8">
          <p className="text-2xl md:text-3xl text-my-green-light mb-2">
            🎉 Congrats! 🎉
          </p>
          <p className="text-lg text-my-white-light mb-4">
            You paid off <strong>{debtName}</strong>.
          </p>
          <p className="text-my-green-base">
            That was your last debt — nothing left to roll the snowball into!
          </p>
        </div>
      </FullScreen>
    );
  }

  const needsTargetPicker = roll || surplus === "nextTarget";
  const canConfirm = !needsTargetPicker || !!targetId;

  return (
    <FullScreen
      theme="DARK"
      onClose={onDecline}
      onSave={() =>
        onConfirm({
          roll,
          targetId: needsTargetPicker ? targetId : null,
          surplus,
        })
      }
      showButtons={true}
      saveButtonColor="green"
      saveButtonText="Confirm"
      saveButtonDisabled={!canConfirm}
      closeButtonText="Not now"
      closeOnSave={false}
    >
      <div className="flex flex-col items-center justify-center text-center w-full px-4 py-8 gap-4">
        <div>
          <p className="text-2xl md:text-3xl text-my-green-light mb-2">
            🎉 Congrats! 🎉
          </p>
          <p className="text-lg text-my-white-light">
            You paid off <strong>{debtName}</strong>.
          </p>
        </div>

        {hasCandidates && (
          <div className="flex flex-col items-center gap-2 w-full">
            <label className="flex items-center gap-2 text-my-white-light cursor-pointer">
              <input
                type="checkbox"
                checked={roll}
                onChange={(e) => setRoll(e.target.checked)}
              />
              Roll its ${freedUpAmount.toFixed(2)}/mo into your snowball
            </label>
          </div>
        )}

        {needsTargetPicker &&
          (candidates.length > 1 ? (
            <select
              value={targetId ?? ""}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-[80%] border-2 p-2 rounded-md border-my-black-light bg-my-white-light text-my-black-dark text-sm"
            >
              {candidates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} - ${d.total?.toFixed(0) ?? "0"}
                </option>
              ))}
            </select>
          ) : (
            candidates.length === 1 && (
              <p className="text-gray-400">
                Next up: "{candidates[0].name}"
              </p>
            )
          ))}

        {hasRemainder && (
          <div className="flex flex-col items-center gap-2 w-full border-t-2 border-my-white-dark/20 pt-4">
            <p className="text-my-white-light">
              Your payment had ${remainder.toFixed(2)} left over after paying
              off "{debtName}". What should we do with it?
            </p>
            <div className="flex flex-col items-start gap-2">
              <label className="flex items-center gap-2 text-my-white-light cursor-pointer">
                <input
                  type="radio"
                  name="surplus"
                  checked={surplus === "availableBudget"}
                  onChange={() => setSurplus("availableBudget")}
                />
                Add to available budget
              </label>
              <label
                className={`flex items-center gap-2 cursor-pointer ${hasCandidates ? "text-my-white-light" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  name="surplus"
                  checked={surplus === "nextTarget"}
                  disabled={!hasCandidates}
                  onChange={() => setSurplus("nextTarget")}
                />
                Apply to next target now
              </label>
              <label className="flex items-center gap-2 text-my-white-light cursor-pointer">
                <input
                  type="radio"
                  name="surplus"
                  checked={surplus === "none"}
                  onChange={() => setSurplus("none")}
                />
                Do nothing with it
              </label>
            </div>
          </div>
        )}
      </div>
    </FullScreen>
  );
}
