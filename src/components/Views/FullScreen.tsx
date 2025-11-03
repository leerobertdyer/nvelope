import { useEffect } from "react";
import Button from "../Buttons/Button";

interface IFullScreen {
  children: React.ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  showButtons?: boolean;
  theme?: "LIGHT" | "DARK";
}

export default function FullScreen({
  children,
  onClose,
  onSave,
  showButtons,
  theme = "LIGHT",
}: IFullScreen) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  function handleSave() {
    onSave?.();
    onClose?.();
  }

  return (
    <div
      className={`
        fixed 
        inset-0 
        z-[9999] 
        w-full h-full 
        flex flex-col 
        justify-center align-center 
        ${theme === "LIGHT" ? "bg-my-blue-dark text-my-white-dark" : "bg-my-black-dark text-my-white-light"} 
        `}
    >
      <div
        className="overflow-y-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {showButtons && (
          <div className="flex flex-col gap-4 items-center justify-center w-[95%] m-auto mt-4">
            {onSave && (
              <Button onClick={handleSave} color="green">
                Save
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} color="red">
                Back
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
