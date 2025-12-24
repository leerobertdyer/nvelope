import { useEffect, useState } from "react";
import {
  BsEnvelope,
  BsEnvelopeFill,
  BsEnvelopePaper,
  BsEnvelopePaperFill,
  BsEnvelopeX,
} from "react-icons/bs";
import Button from "./Buttons/Button";
import type { Envelope } from "../types";
import { IoIosRepeat } from "react-icons/io";
import { IoAddCircle } from "react-icons/io5";
import NvelopeCalculator from "../Views/NvelopeCalculator";
import EnvelopeForm from "./Forms/EnvelopeForm";

interface NvelopeProps {
  kind:
    | "envelope"
    | "deleteEnvelope"
    | "addEnvelope"
    | "sub"
    | "dash"
    | "replenish"
    | "heart"
    | "editEnvelope"
    | "spendingEnvelope";
  envelope: Envelope;
  onClick?: () => void;
  handleBack?: () => void;
  handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
  editEnvelope?: (envelope: Envelope) => Promise<void>;
  handleDeleteEnvelope?: () => void;
  editRent?: (amount: number) => Promise<void>;
}
export default function Nvelope({
  kind,
  envelope,
  onClick,
  handleBack,
  handleSaveEnvelope,
  editEnvelope,
  handleDeleteEnvelope,
  editRent,
}: NvelopeProps) {
  const [newEnvelopeName, setNewEnvelopeName] = useState<string>(
    envelope.name || ""
  );
  const [newEnvelopeTotal, setNewEnvelopeTotal] = useState<string>(
    envelope.total.toString() || ""
  );
  const [newEnvelopeSpent, setNewEnvelopeSpent] = useState<string>(
    envelope.spent.toString() || ""
  );

  useEffect(() => {
    setNewEnvelopeName(envelope.name || "");
    setNewEnvelopeTotal(
      (envelope.total !== 0 && envelope.total?.toString()) || ""
    );
    setNewEnvelopeSpent(
      (envelope.spent !== 0 && envelope.spent?.toString()) || ""
    );
  }, [envelope]);

  const dottedWidth = 150;
  const dottedHeight = 80;
  const dottedStrokeWidth = 8;

  function handleEnterAmount(amount: number, n: Envelope) {
    if (amount <= 0) return;
    if (n.name === "rent") {
      editRent?.(amount);
      handleBack?.();
      return;
    }
    n.spent = Number(n.spent) + amount;
    editEnvelope?.(n);
    handleBack?.();
  }

  switch (kind) {
    case "envelope":
      return (
        <div
          className="w-[10rem] h-[10rem] relative group flex justify-center items-center"
          onClick={() => onClick?.()}
        >
          <div className="z-12 flex flex-col gap-[.15rem] absolute w-full h-full items-center pt-6">
            <p
              className={`w-fit text-center text-[.8rem] ${
                envelope.total && (envelope.spent || envelope.spent === 0)
                  ? envelope.total - envelope.spent <= 0
                    ? "text-my-white-dark"
                    : envelope.total - envelope.spent < envelope.total / 2
                    ? "text-my-black-dark"
                    : "text-my-white-light"
                  : "text-my-black-dark"
              }`}
            >
              {envelope.name}
            </p>
            <div className="flex flex-col items-center w-full gap-[.15rem]">
              <p className="w-fit px-[.15rem] bg-white rounded-md text-center text-[.6rem]">
                ${envelope.spent}
              </p>
              <hr className="w-[40%] h-[2px] bg-black my-[3px]" />
              <p className="w-fit px-[.15rem] bg-white rounded-md text-center text-[.6rem]">
                ${envelope.total}
              </p>
            </div>
          </div>
          <BsEnvelopePaper
            className="w-[100%] h-[100%] top-0 left-1/2 -translate-x-1/2 absolute z-10"
            strokeWidth={0.4}
          />
          <BsEnvelopePaperFill
            className={`w-[100%] h-[100%] top-0 left-1/2 -translate-x-1/2 absolute ${
              envelope.total && (envelope.spent || envelope.spent === 0)
                ? envelope.total - envelope.spent <= 0
                  ? "text-my-red-dark"
                  : envelope.total - envelope.spent < envelope.total / 2
                  ? "text-my-white-dark"
                  : "text-my-green-dark"
                : "text-my-green-dark"
            }`}
          />
        </div>
      );
    case "replenish":
      return (
        <div
          className="relative w-[8rem] h-[8rem] flex items-center justify-center cursor-pointer"
          onClick={() => onClick?.()}
        >
          <div className="w-fit h-fit p-6 rounded-full bg-my-black-dark border-2 border-my-white-light top-10 left-1/2 -translate-x-1/2 absolute z-200">
            <IoIosRepeat className="w-[100%] h-[100%] text-my-white-dark absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
          </div>
          <BsEnvelope
            className="w-[100%] h-[100%] top-0 left-1/2 -translate-x-1/2 absolute z-10"
            strokeWidth={0.4}
          />
          <BsEnvelopeFill
            className={`w-[100%] h-[100%] top-0 left-1/2 -translate-x-1/2 absolute ${
              envelope.total && (envelope.spent || envelope.spent === 0)
                ? envelope.total - envelope.spent <= 0
                  ? "text-my-green-dark"
                  : envelope.total - envelope.spent < envelope.total / 2
                  ? "text-my-white-dark"
                  : "text-my-green-dark"
                : "text-my-green-dark"
            }`}
          />
        </div>
      );
    case "deleteEnvelope":
      return (
        <div className="absolute inset-0 w-screen h-screen z-100 select-none">
          <div className="flex flex-col bg-my-red-dark w-screen h-screen justify-center items-center ">
            <p className="p-4 rounded-md text-my-white-dark w-full text-center">
              Are you sure you want to delete {envelope.name}?
            </p>
            <p className="text-xs w-[85%] text-center text-white">
              This will not affect your available budget.
            </p>
            <div className="w-[30rem] h-[50rem] rounded-md py-[1rem] px-[3.5rem] flex justify-center items-center flex-col gap-8">
              <BsEnvelopeX className="w-[12rem] h-[12rem] text-my-white-light" />
              <Button onClick={() => handleDeleteEnvelope?.()} color="gold">
                Delete
              </Button>
              <Button onClick={() => handleBack?.()} color="green">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      );
    case "spendingEnvelope":
      return (
        <NvelopeCalculator
          envelope={envelope}
          selectEnvelope={envelope.id === ""}
          handleEnterAmount={handleEnterAmount}
          handleBack={handleBack}
        />
      );
    case "editEnvelope":
      return (
        <EnvelopeForm
          isEditing={true}
          handleBack={handleBack}
          editEnvelope={editEnvelope}
          newEnvelopeSpent={newEnvelopeSpent}
          setNewEnvelopeSpent={setNewEnvelopeSpent}
          envelope={envelope}
          newEnvelopeName={newEnvelopeName}
          newEnvelopeTotal={newEnvelopeTotal}
          setNewEnvelopeName={setNewEnvelopeName}
          setNewEnvelopeTotal={setNewEnvelopeTotal}
        />
      );
    case "addEnvelope":
      return (
        <EnvelopeForm
          isEditing={false}
          handleBack={handleBack}
          handleSaveEnvelope={handleSaveEnvelope}
          newEnvelopeName={newEnvelopeName}
          newEnvelopeTotal={newEnvelopeTotal}
          setNewEnvelopeName={setNewEnvelopeName}
          setNewEnvelopeTotal={setNewEnvelopeTotal}
        />
      );
    case "dash":
      return (
        <div
          className={`w-fit relative  cursor-pointer bg-white border hover:bg-my-white-dark hover:text-my-green-dark rounded-sm `}
          onClick={() => onClick?.()}
        >
          <p className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center text-sm">
            {envelope.name}
            {envelope.name !== "Loading..." && (
              <IoAddCircle className="inline ml-[2px]" />
            )}
          </p>
          <svg width={dottedWidth} height={dottedHeight}>
            {/* Bottom Line */}
            <line
              className="animate-march"
              x1="0"
              y1={dottedHeight}
              x2={dottedWidth}
              y2={dottedHeight}
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Top Line */}
            <line
              className="animate-march"
              x1="0"
              y1="0"
              x2={dottedWidth}
              y2="0"
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Left Line */}
            <line
              className="animate-march"
              x1="0"
              y1={dottedHeight}
              x2="0"
              y2={0}
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Right Line */}
            <line
              className="animate-march"
              x1={dottedWidth}
              y1={dottedHeight}
              x2={dottedWidth}
              y2={0}
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Left Diagnal */}
            <line
              className="animate-march"
              x1="0"
              y1="0"
              x2={dottedWidth * 0.5}
              y2={dottedHeight * 0.35}
              stroke="green"
              strokeDasharray="8, 2"
              strokeWidth={dottedStrokeWidth * 0.35}
            />
            {/* Right Diagnal */}
            <line
              className="animate-march"
              x1={dottedWidth}
              y1="0"
              x2={dottedWidth * 0.5}
              y2={dottedHeight * 0.35}
              stroke="green"
              strokeDasharray="8, 2"
              strokeWidth={dottedStrokeWidth * 0.35}
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-[35vw] h-[35vw] relative">
          <p className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-2 text-[.6rem]">
            {envelope.name}
          </p>
          <p className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-10 text-[.65rem]">
            ${envelope.spent}
          </p>
          <hr className="absolute w-full h-[2px] bg-black top-12" />
          <p className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-14 text-[.65rem]">
            ${envelope.total}
          </p>
          <BsEnvelopePaper className="w-full h-full" />
        </div>
      );
  }
}
