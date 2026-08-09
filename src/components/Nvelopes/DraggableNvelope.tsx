import { useState } from "react";
import type { Envelope } from "../../types";
import NvelopeCard from "./NvelopeCard";

export default function DraggableNvelope({
  envelopes,
  onReorder,
  onPress,
}: {
  envelopes: Envelope[];
  onReorder: (newOrder: Envelope[]) => void;
  onPress: (n: Envelope) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleSwap(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const newList = [...envelopes];
    const draggedIndex = newList.findIndex((e) => e.id === draggedId);
    const targetIndex = newList.findIndex((e) => e.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    [newList[draggedIndex], newList[targetIndex]] = [
      newList[targetIndex],
      newList[draggedIndex],
    ];
    onReorder(newList);
  }

  return (
    <div className="flex flex-wrap bg-my-white-light justify-center gap-3 p-3">
      {envelopes.map((envelope) => (
        <div
          key={envelope.id}
          draggable
          onClick={() => onPress(envelope)}
          onDragStart={(e) => {
            setDraggingId(envelope.id);
            e.dataTransfer.setData("text/plain", envelope.id);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDragOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverId !== envelope.id) setDragOverId(envelope.id);
          }}
          onDragLeave={() => {
            setDragOverId((prev) => (prev === envelope.id ? null : prev));
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            handleSwap(draggedId, envelope.id);
            setDraggingId(null);
            setDragOverId(null);
          }}
          className={`cursor-pointer transition-transform ${draggingId === envelope.id ? "opacity-50" : ""} ${dragOverId === envelope.id && draggingId !== envelope.id ? "scale-105" : ""}`}
        >
          <NvelopeCard envelope={envelope} />
        </div>
      ))}
    </div>
  );
}
