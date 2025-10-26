import { IoIosAdd, IoIosRemove } from "react-icons/io";

export default function ShowHideButton({
  onClick,
  isShown,
}: {
  onClick: () => void;
  isShown: boolean;
}) {
  return (
    <div className="absolute z-100 w-[2rem] h-full flex justify-center items-center">
      <button
        onClick={onClick}
        className="text-xs bg-my-black-dark cursor-pointer text-my-white-dark p-[4px] rounded-sm border-[1px] border-my-white-light"
      >
        {isShown ? <IoIosRemove className="font-bold" size={20}/> : <IoIosAdd className="font-bold" size={20}/>}
      </button>
    </div>
  );
}
