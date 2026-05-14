interface ITextInput {
    id: string
    placeholder: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    value: string
    label: string
    numeric?: boolean // Shows numeric keyboard on mobile
    maxLength?: number
}

export default function TextInput({ id, placeholder, onChange, value, label, numeric, maxLength }: ITextInput) {
    return <div className="w-[90%] flex flex-col gap-2 items-center justify-center">
        <label className="p-2 w-full text-center" htmlFor={id}>{label}</label>
        <input
            id={id}
            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark box-border"
            placeholder={placeholder}
            type="text"
            inputMode={numeric ? "decimal" : undefined}
            onChange={onChange}
            value={value}
            maxLength={maxLength}
        />
    </div>
}