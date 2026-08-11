import { useState } from "react";
import FullScreen from "../../Views/FullScreen";
import type { Payment } from "../../types";

interface IProps {
  debtName: string;
  /** The minimum payment freed up by paying off this debt. */
  freedUpAmount: number;
  /** Remaining debts eligible to become the next snowball target, lowest balance first. */
  candidates: Payment[];
  defaultTargetId: string | null;
  /** Roll the freed-up amount into the snowball, targeting the chosen debt. */
  onRoll: (targetId: string) => void;
  /** Don't touch the snowball for this payoff. */
  onDecline: () => void;
}

export default function CongratsPaidOffModal({
  debtName,
  freedUpAmount,
  candidates,
  defaultTargetId,
  onRoll,
  onDecline,
}: IProps) {
  const [targetId, setTargetId] = useState<string | null>(
    defaultTargetId ?? candidates[0]?.id ?? null,
  );
  const hasCandidates = candidates.length > 0;

  return (
    <FullScreen
      theme="DARK"
      onClose={onDecline}
      onSave={hasCandidates ? () => targetId && onRoll(targetId) : undefined}
      showButtons={true}
      saveButtonColor="green"
      saveButtonText="Roll it into the snowball"
      saveButtonDisabled={!targetId}
      closeButtonText={hasCandidates ? "Not now" : "Close"}
      closeOnSave={false}
    >
      <div className="flex flex-col items-center justify-center text-center w-full px-4 py-8">
        <p className="text-2xl md:text-3xl text-my-green-light mb-2">
          🎉 Congrats! 🎉
        </p>
        <p className="text-lg text-my-white-light mb-4">
          You paid off <strong>{debtName}</strong>.
        </p>

        {hasCandidates ? (
          <>
            <p className="text-my-white-light mb-2">
              Roll its ${freedUpAmount.toFixed(2)}/mo into your snowball?
            </p>
            {candidates.length > 1 ? (
              <select
                value={targetId ?? ""}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-[80%] border-2 p-2 rounded-md border-my-black-light bg-my-white-light text-my-black-dark text-sm mb-2"
              >
                {candidates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - ${d.total?.toFixed(0) ?? "0"}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-400 mb-2">
                Next up: "{candidates[0].name}"
              </p>
            )}
          </>
        ) : (
          <p className="text-my-green-base">
            That was your last debt — nothing left to roll the snowball into!
          </p>
        )}
      </div>
    </FullScreen>
  );
}
