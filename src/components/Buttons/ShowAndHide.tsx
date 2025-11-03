import { BiChevronsDown, BiChevronsUp } from "react-icons/bi";

export default function ShowAndHide({
  onClick,
  up = true,
  label,
  border = false,
  iconSize = 35,
  colorScheme = "text-my-white-dark",
  additionalDetails,
}: {
  onClick: () => void;
  up?: boolean;
  label?: string;
  border?: boolean;
  iconSize?: number;
  colorScheme?: string;
  additionalDetails?: string;
}) {
  return (
    <div
      className={`w-full m-auto h-fit flex items-center justify-center py-[2px]
        ${border && "border-2 border-my-white-light"}
        ${colorScheme ?? "text-my-white-dark"} cursor-pointer`}
      onClick={onClick}
    >
      {label && (
        <p className="text-my-white-light text-xs">
          {label}{" "}
          {additionalDetails && (
            <span className="text-my-blue-base">{additionalDetails}</span>
          )}
        </p>
      )}
      {up ? (
        <BiChevronsUp size={iconSize} />
      ) : (
        <BiChevronsDown size={iconSize} />
      )}
    </div>
  );
}
