export default function Button({onClick, text, color}: {onClick: () => void, text: string, color: string}) {
  return (
    <button 
        className={`rounded-lg ${color === 'green' ? 'bg-lime-600' : 'bg-red-600'} text-white p-2 hover:cursor-pointer w-[80%]`}
        onClick={onClick}>
      {text}
    </button>
  )
}