import { useEffect } from "react";
import Button from "../components/Buttons/Button";

interface IFullScreen {
  children: React.ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  showButtons?: boolean;
  theme?: "LIGHT" | "DARK";
  saveButtonText?: string;
  saveButtonColor?: "green" | "red";
  closeButtonText?: string;
}

export default function FullScreen({
  children,
  onClose,
  onSave,
  showButtons,
  theme = "LIGHT",
  saveButtonText = "Save",
  saveButtonColor = "green",
  closeButtonText = "Back",
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
        z-[10100] 
        w-full h-full 
        flex 
        justify-center align-center 
        ${theme === "LIGHT" ? "bg-my-blue-dark text-my-white-dark" : "bg-my-black-base text-my-white-light"} 
        `}
    >
      <div
        className="overflow-y-auto w-full py-[5rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {showButtons && (
          <div className="flex flex-col gap-4 items-center justify-center w-[95%] m-auto mt-4">
            {onSave && (
              <Button onClick={handleSave} color={saveButtonColor}>
                {saveButtonText}
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} color="red">
                {closeButtonText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
