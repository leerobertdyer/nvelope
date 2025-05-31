import ClosingX from "./ClosingX";
import type { ChangeValue } from "../types";

export default function DemoStep({ children, onClick, changeValue, text }: { children: React.ReactNode, onClick: () => void, changeValue?: ChangeValue, text?: string}) {
    return (
        <div className="w-[98%] absolute flex flex-col gap-4 items-center justify-center text-my-white-light z-102">
            <div className="w-fit p-2 sm:p-4 md:p-8 h-fit flex flex-col justify-center items-center gap-6 bg-my-black-base rounded-md border-white border-2">
                {children}
            </div>
            <div className="w-full h-[2rem]"></div> {/* Spacer */}
            <ClosingX text={text} onClick={onClick} changeValue={Array.isArray(changeValue) ? changeValue.length > 0: !!changeValue}/>
        </div>
    )
}