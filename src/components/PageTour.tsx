import { useEffect, useState } from "react";

const STORAGE_PREFIX = "nvelope_tour_";

export type PageTourId = "main" | "debt" | "bills" | "settings";

function hasSeenTour(tourId: PageTourId): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_PREFIX + tourId) === "1";
}

function markTourSeen(tourId: PageTourId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + tourId, "1");
}

interface PageTourProps {
  tourId: PageTourId;
  children: React.ReactNode;
}

/**
 * Shows a one-time dismissible popup per page. Once the user clicks "Got it", the tour is not shown again for that page (persisted in localStorage).
 */
export default function PageTour({ tourId, children }: PageTourProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!hasSeenTour(tourId));
  }, [tourId]);

  function handleDismiss() {
    markTourSeen(tourId);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9700] flex items-center justify-center bg-my-black-dark/80 p-4"
      role="dialog"
      aria-label="Page tour"
    >
      <div className="bg-my-black-base border border-my-white-dark/20 rounded-lg shadow-lg max-w-md w-full p-5 flex flex-col gap-4 text-my-white-light">
        <div className="text-sm sm:text-base [&_span]:font-semibold [&_.text-my-green-light]:text-my-green-light [&_.text-my-red-light]:text-my-red-light [&_.text-my-blue-light]:text-my-blue-light">
          {children}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-md bg-my-green-dark text-my-white-light hover:bg-my-green-base font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
