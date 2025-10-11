interface ITextInput {
    id: string
    textOrNumber?: "text" | "number"
    placeholder: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    value: string
    label: string;
}

export default function TextInput({ id, textOrNumber="text", placeholder, onChange, value, label }: ITextInput) {
    return <div className="w-full flex flex-col gap-2 items-center justify-center">
        <label className="text-my-white-dark" htmlFor={id}>{label}</label>
        <input
            id={id}
            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
            placeholder={placeholder}
            type={textOrNumber}
            onChange={onChange}
            value={value}
        />
    </div>
}