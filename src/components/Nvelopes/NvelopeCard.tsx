import type { Envelope } from "../../types";

interface INvelopeCard {
  envelope: Envelope;
}

export default function NvelopeCard({ envelope }: INvelopeCard) {
  const isSpent = envelope.spent >= envelope.total;

  const borderClass = isSpent ? "border-my-red-dark" : "border-my-green-dark";
  const bgClass = isSpent
    ? "bg-my-red-dark text-my-white-light"
    : "bg-my-green-dark text-my-white-light";

  return (
    <div
      className={`bg-white border-2 rounded-md ${borderClass} w-[7rem] flex flex-col items-center justify-center`}
    >
      <div className="flex items-center justify-between w-full p-2">
        <div className="flex flex-col items-center w-full">
          <p className="text-my-black-dark text-sm font-medium border-b-2 w-full text-center">
            ${(envelope.total - envelope.spent).toFixed(2)}
          </p>
          <p className="text-my-black-dark text-sm font-medium">
            ${envelope.total.toFixed(2)}
          </p>
        </div>
      </div>
      <p
        className={`w-full text-center p-[2px] text-xs truncate ${bgClass}`}
      >
        {envelope.name}
      </p>
    </div>
  );
}
