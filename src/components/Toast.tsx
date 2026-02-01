import type { Toast } from "../Context/ToastContext/ToastContext";

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10200] flex flex-col gap-2 max-w-[90vw]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-md shadow-lg border-2 cursor-pointer
            animate-fade-in min-w-[200px] max-w-[300px]
            ${toast.type === "success" 
              ? "bg-my-green-dark text-my-white-light border-my-green-base" 
              : toast.type === "error"
              ? "bg-my-red-dark text-my-white-light border-my-red-base"
              : "bg-my-blue-dark text-my-white-light border-my-blue-base"
            }
          `}
          onClick={() => onRemove(toast.id)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </span>
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

