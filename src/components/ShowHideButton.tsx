import { IoIosAdd, IoIosRemove } from "react-icons/io";

export default function ShowHideButton({
  onClick,
  isShown,
  theme="DARK"
}: {
  onClick: () => void;
  isShown: boolean;
  theme?: "LIGHT" | "DARK"
}) {
  return (
    <div className="absolute z-100 w-[2rem] h-full flex justify-center items-center">
      <button
        onClick={onClick}
        className={`text-xs 
          ${theme==="DARK" ? "bg-my-black-dark text-my-white-dark" : "bg-my-white-base text-my-black-dark"} 
          cursor-pointer  p-[1px] rounded-sm border-[1px] border-my-white-light`}
      >
        {isShown ? <IoIosRemove className="font-bold" size={18}/> : <IoIosAdd className="font-bold" size={18}/>}
      </button>
    </div>
  );
}
