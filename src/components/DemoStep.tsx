import ClosingX from "./ClosingX";
import type { ChangeValue } from "../types";

export default function DemoStep({ children, onClick, changeValue, text }: { children: React.ReactNode, onClick: () => void, changeValue?: ChangeValue, text?: string}) {
    return (
        <div className="w-[95vw] h-[100vh] absolute flex flex-col gap-4 items-center justify-center text-xs text-my-white-light z-[10000] overflow-y-auto" style={{ pointerEvents: 'auto' }}>
            <div className="w-full p-2 sm:p-4 md:p-8 h-fit flex flex-col justify-center items-center gap-6 bg-my-black-base rounded-md pb-[10rem]">
                {children}
            <ClosingX text={text} onClick={onClick} changeValue={Array.isArray(changeValue) ? changeValue.length > 0: !!changeValue}/>
            </div>
        </div>
    )
}