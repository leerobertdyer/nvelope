import type { ChangeValue } from "../types";

export default function ClosingX({ onClick, text, changeValue }: { onClick: () => void, text?: string, changeValue?: ChangeValue}) {
    return <p 
        onClick={onClick}
        className={`
            ${changeValue && 'animate-bounce'}
            text-3xl p-2 cursor-pointer border rounded-lg bg-my-white-light text-my-black-dark hover:bg-my-black-dark hover:text-my-white-light`}>{text || 'X'}</p>
}