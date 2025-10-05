import { BiChevronsDown, BiChevronsUp } from "react-icons/bi";

export default function ShowAndHide({
  onClick,
  up=true,
  label,
  border=false,
  iconSize=35,
  colorScheme="text-my-white-dark",
  additionalDetails
}: {
  onClick: () => void;
  up?: boolean;
  label?: string;
  border?: boolean
  iconSize?: number
  colorScheme?: string
  additionalDetails?: string
}) {
  return (
    <div
      className={`w-[90%] m-auto h-fit flex flex-col items-center justify-center p-2
        ${border && "border-2 border-my-white-light"}
        ${colorScheme ?? "text-my-white-dark"} cursor-pointer`}
      onClick={onClick}
    >
      {label && <p className="text-my-white-light text-xs">{label}</p>}
      {up ? <BiChevronsUp size={iconSize} /> : <BiChevronsDown size={iconSize} />}
      {additionalDetails && <p className="text-my-blue-base">{additionalDetails}</p>}
    </div>
  );
}
