import { useEffect } from "react";
import Button from "./Button";

interface IFullScreen {
  children: React.ReactNode;
  onClose?: () => void;
  onSave?: () => void;
  showButtons?: boolean;
}

export default function FullScreen({ children, onClose, onSave, showButtons }: IFullScreen) {
  useEffect(() => {
    // Lock scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow; // restore scroll
    };
  }, []);

  function handleSave() {
    onSave?.()
    onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-my-black-dark w-full"
    >
      <div
      className="w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {children}
        {showButtons &&
          <div className="flex flex-col gap-4 items-center justify-center w-full mt-4">
            {onSave && <Button onClick={handleSave} color="green">Save</Button>}
            {onClose && <Button onClick={onClose} color="red">Back</Button>}
          </div>}
      </div>
    </div>
  );
}
