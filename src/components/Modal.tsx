import { useEffect } from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export default function Modal({ children, onClose }: ModalProps) {
  useEffect(() => {
    // Lock scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow; // restore scroll
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-my-black-dark"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {children}
      </div>
    </div>
  );
}
