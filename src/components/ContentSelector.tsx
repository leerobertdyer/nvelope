import type { ViewContent } from "../types";

interface IContentSelector {
  content: ViewContent;
  setContent: React.Dispatch<React.SetStateAction<ViewContent>>;
}

export default function ContentSelector({
  content,
  setContent,
}: IContentSelector) {
  return (
    <div className="flex justify-around bg-my-white-base h-[3rem] m-auto w-[90%] max-w-[30rem] rounded-t-xl">
      <button
        type="button"
        className={`justify-center px-2 w-1/2 cursor-pointer ${content === "NVELOPES" && "rounded-tl-xl bg-my-white-dark"}`}
        onClick={() => setContent("NVELOPES")}
      >
        Nvelopes
      </button>
      <button
        type="button"
        className={`justify-center px-2 w-1/2 cursor-pointer ${content === "PAYMENTS" && "rounded-tr-xl bg-my-white-dark"}`}
        onClick={() => setContent("PAYMENTS")}
      >
        Payments
      </button>
    </div>
  );
}
