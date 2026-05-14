export default function Button({
  children,
  onClick,
  color,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  color: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-lg h-[3.5rem] w-[80%] max-w-[20rem] p-2 cursor-pointer border-2
          disabled:opacity-60 disabled:cursor-not-allowed
          ${color === "green"
            ? "bg-my-green-base text-black hover:text-my-white-dark hover:bg-my-black-dark hover:border-my-white-light"
            : color === "gold"
              ? "bg-my-white-dark text-my-red-dark hover:bg-my-black-dark hover:text-my-white-light hover:border-my-white-light"
              : "bg-my-red-dark text-my-white-dark border-black hover:bg-my-black-dark hover:text-my-white-light hover:border-my-white-light"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}