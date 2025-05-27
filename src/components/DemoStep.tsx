import type { Value } from "react-calendar/src/shared/types.js";
import ClosingX from "./ClosingX";

export default function DemoStep({ children, onClick, changeValue, text }: { children: React.ReactNode, onClick: () => void, changeValue?: boolean | string | null | Value | number, text?: string}) {
    return (
        <div className="w-[95%] absolute flex flex-col gap-4 items-center justify-center text-white z-102">
            {children}
            <ClosingX text={text} onClick={onClick} changeValue={changeValue}/>
        </div>
    )
}