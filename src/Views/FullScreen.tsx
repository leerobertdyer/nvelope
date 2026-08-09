import { useEffect } from "react";
import Button from "../components/Buttons/Button";

interface IFullScreen {
  children: React.ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  showButtons?: boolean;
  theme?: "LIGHT" | "DARK";
  saveButtonText?: string;
  saveButtonColor?: "green" | "red" | "gold";
  closeButtonText?: string;
  /** When true, the save/confirm button is disabled (e.g. to prevent double-submit on delete account). */
  saveButtonDisabled?: boolean;
  /** When false, do not call onClose after onSave (caller closes manually, e.g. after async result). Default true. */
  closeOnSave?: boolean;
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
  saveButtonDisabled = false,
  closeOnSave = true,
}: IFullScreen) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  function handleSave() {
    if (saveButtonDisabled) return;
    onSave?.();
    if (closeOnSave) onClose?.();
  }

  return (
    <div
      className={`
        fixed 
        inset-0 
        z-[10100] 
        w-full h-full 
        flex 
        justify-center items-center 
        ${theme === "LIGHT" ? "bg-my-blue-dark text-my-white-dark" : "bg-my-black-base text-my-white-light"} 
        `}
    >
      <div
        className="overflow-y-auto w-full py-[4rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {showButtons && (
          <div className="flex flex-col gap-4 items-center justify-center w-[95%] m-auto mt-4">
            {onSave && (
              <Button
                onClick={handleSave}
                color={saveButtonColor}
                disabled={saveButtonDisabled}
              >
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
