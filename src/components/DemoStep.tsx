import ClosingX from "./Buttons/ClosingX";
import type { ChangeValue } from "../types";

export default function DemoStep({
  children,
  onClick,
  changeValue,
  text,
}: {
  children: React.ReactNode;
  onClick: () => void;
  changeValue?: ChangeValue;
  text?: string;
}) {
  return (
    <div
      className="w-[95vw] absolute top-[4rem] flex flex-col gap-4 items-center justify-start text-xs text-my-white-light z-[10000] overflow-y-auto overflow-x-hidden max-h-[calc(100vh-4rem)] max-w-[40rem]"
      style={{ pointerEvents: "auto" }}
    >
      <div className="w-full p-2 sm:p-4 md:p-4 h-fit flex flex-col justify-center items-center gap-6 bg-my-black-base rounded-md pb-[1rem]">
        {children}
      </div>
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full flex justify-center">
          <ClosingX
            text={text}
            onClick={onClick}
            changeValue={
              Array.isArray(changeValue)
                ? changeValue.length > 0
                : !!changeValue
            }
          />
        </div>
    </div>
  );
}
