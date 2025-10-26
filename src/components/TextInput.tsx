interface ITextInput {
    id: string
    textOrNumber?: "text" | "number"
    placeholder: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    value: string
    label: string;
}

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault(); // ✅ stop scroll changing number
    (e.target as HTMLInputElement).blur(); // optional: remove focus so wheel can scroll the page again
  };

export default function TextInput({ id, textOrNumber="text", placeholder, onChange, value, label }: ITextInput) {
    return <div className="w-full flex flex-col gap-2 items-center justify-center">
        <label className="p-2 w-full" htmlFor={id}>{label}</label>
        <input
            id={id}
            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark"
            placeholder={placeholder}
            type={textOrNumber}
            onWheel={textOrNumber === "number" ? handleWheel : undefined}
            onChange={onChange}
            value={value}
        />
    </div>
}