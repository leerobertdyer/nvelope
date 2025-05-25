export default function Button({children, onClick, color}: {children: React.ReactNode, onClick: () => void, color: string}) {
  return (
    <button 
        type="button"
        className={`rounded-lg h-[3.5rem] w-[80%] max-w-[20rem] p-2 cursor-pointer border 
            ${color === 'green' 
            ? 'bg-my-green-base text-black hover:bg-my-red-dark hover:text-my-white-light' 
            : 'bg-my-red-dark text-my-white-dark hover:bg-my-red-dark hover:text-my-white-dark'}`} 
        onClick={onClick}>
      {children}
    </button>
  )
}