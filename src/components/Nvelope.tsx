import { useEffect, useState } from "react";
import {
  BsEnvelopePaper,
  BsEnvelopePaperFill,
  BsEnvelopeX,
} from "react-icons/bs";
import Button from "./Button";
import type { Envelope } from "../types";
import { IoIosTrash } from "react-icons/io";
import { IoStar } from "react-icons/io5";
import NvelopeCalculator from "./NvelopeCalculator";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";

interface NvelopeProps {
  kind:
    | "envelope"
    | "deleteEnvelope"
    | "addEnvelope"
    | "sub"
    | "dash"
    | "heart"
    | "editEnvelope"
    | "spendingEnvelope";
  envelope: Envelope;
  onClick?: () => void;
  handleBack?: () => void;
  handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
  editEnvelope?: (envelope: Envelope) => Promise<void>;
  handleDeleteEnvelope?: () => void;
}
export default function Nvelope({
  kind,
  envelope,
  onClick,
  handleBack,
  handleSaveEnvelope,
  editEnvelope,
  handleDeleteEnvelope,
}: NvelopeProps) {
  const { envelopes } = useGetDatabase();

  const [newEnvelopeName, setNewEnvelopeName] = useState<string>("");
  const [newEnvelopeTotal, setNewEnvelopeTotal] = useState<string>("");
  const [newEnvelopeSpent, setNewEnvelopeSpent] = useState<string>("");
  const [newEnvelopeRecurring, setNewEnvelopeRecurring] = useState<boolean>(true);

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

  function handleEnterAmountAndId(amount: number) {
    console.log('handleEnterAmountAndId', amount, envelope.id);
    const envelopeToEdit = envelopes.find(e => e.id === envelope.id);
    if (!envelopeToEdit) return;
    envelopeToEdit.spent = Number(envelopeToEdit.spent) + amount;
    editEnvelope?.(envelopeToEdit);
    handleBack?.();
  }

  switch (kind) {
    case "envelope":
      return (
        <div className="w-[14rem] h-[14rem] relative group">
          <div className="z-333 absolute top-[-10%] left-[-2.5%] w-[105%] h-[105%] cursor-pointer group-hover:flex hidden bg-[#0d916744] text-my-green-dark rounded-lg justify-center items-center">
            <p className="z-333 flex justify-center items-center p-2 bg-white rounded-md">
              Spend
            </p>
          </div>
          <div className="z-12 flex flex-col gap-[.5rem] absolute w-full h-full items-center pt-3">
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
              <p className="w-fit px-2 bg-white rounded-md text-center text-[.65rem]">
                ${envelope.spent}
              </p>
              <hr className="w-[40%] h-[2px] bg-black my-[3px]" />
              <p className="w-fit px-2 bg-white rounded-md text-center text-[.65rem]">
                ${envelope.total}
              </p>
            </div>
          </div>
          <BsEnvelopePaper
            className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute z-10"
            strokeWidth={0.4}
          />
          <BsEnvelopePaperFill
            className={`w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute ${
              envelope.total && (envelope.spent || envelope.spent === 0)
                ? envelope.total - envelope.spent <= 0
                  ? "text-my-red-dark"
                  : envelope.total - envelope.spent < envelope.total / 2
                  ? "text-my-white-dark"
                  : "text-my-green-dark"
                : "text-my-green-dark"
            }`}
          />
          {envelope.recurring && (
            <IoStar
              className="bottom-[4rem] left-1/2 -translate-x-1/2 absolute z-10 text-my-white-dark animate-pulse"
              size={20}
            />
          )}
        </div>
      );
    case "deleteEnvelope":
      return (
        <div className="absolute inset-0 w-screen h-screen z-100 select-none">
          <div className="flex flex-col bg-my-red-dark w-screen h-screen justify-center items-center ">
            <p className="p-4 rounded-md text-my-white-dark w-full text-center">
              Are you sure you want to delete {envelope.name}?
            </p>
            <p className="text-xs w-[85%] text-center text-white">This will return all your money to your available budget.</p>
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
        <NvelopeCalculator envelope={envelope} selectEnvelope={envelope.id === ''} handleEnterAmount={handleEnterAmountAndId} handleBack={handleBack} />
      )
    case "editEnvelope":
      return (
        <div className=" min-h-screen w-full absolute inset-0 bg-my-blue-dark text-white">
            <div className="flex flex-col items-center justify-center gap-2 max-w-[40rem] mx-auto my-20">
              <h2 className="text-2xl">Edit Envelope</h2>
              <label htmlFor="newEnvelopeName">Envelope Name</label>
              <input
                type="text"
                maxLength={16}
                className="w-[85%] border p-2 rounded-l"
                value={newEnvelopeName}
                onChange={(e) =>
                  setNewEnvelopeName(e.target.value.trim().toLowerCase())
                }
                placeholder="Envelope name"
              />
              <label htmlFor="newEnvelopeTotal">Total Budget for {newEnvelopeName}</label>
              <input
                type="number"
                className="w-[85%] border p-2 rounded-md"
                value={newEnvelopeTotal}
                onChange={(e) => setNewEnvelopeTotal(e.target.value)}
                placeholder="Enter new envelope total"
              />
              <label htmlFor="newEnvelopeSpent">Amount Spent</label>
              <input
                type="number"
                className="w-[85%] border p-2 rounded-md mb-8"
                value={newEnvelopeSpent}
                onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                placeholder="Enter amount spent"
              />
              <div className="w-[85%] flex justify-center items-center gap-2 p-2 rounded-md ">
                <IoStar className="text-my-white-dark" size={20} />
                <label htmlFor="newRecurring">Recurring</label>
                <input
                  type="checkbox"
                  id="newRecurring"
                  checked={newEnvelopeRecurring}
                  onChange={(e) => setNewEnvelopeRecurring(e.target.checked)}
                />
              </div>
              <Button
                onClick={() => {
                  console.log(
                    "new envelope",
                    newEnvelopeName,
                    newEnvelopeTotal,
                    newEnvelopeSpent
                  );
                  editEnvelope?.({
                    id: envelope.id,
                    name: newEnvelopeName || "",
                    total: Number(newEnvelopeTotal || 0),
                    spent: Number(newEnvelopeSpent || 0),
                    recurring: newEnvelopeRecurring,
                  });
                }}
                color="green"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setNewEnvelopeName("");
                  setNewEnvelopeTotal("");
                  setNewEnvelopeSpent("");
                  handleBack?.();
                }}
                color="red"
              >
                Cancel
              </Button>
              <IoIosTrash
                className="mt-8 text-my-white-light bg-my-red-dark cursor-pointer p-1 border rounded-lg hover:bg-my-white-light hover:text-my-red-dark"
                size={40}
                onClick={() => handleDeleteEnvelope?.()}
              />
            </div>
        </div>
      );
    case "addEnvelope":
      return (
        <div className=" min-h-screen w-full absolute inset-0 bg-my-blue-dark text-white">
          <div className="flex flex-col items-center justify-center gap-2 max-w-[40rem] mx-auto my-20">
            <h2 className="text-2xl">Add New Envelope</h2>
            <input
              type="text"
              maxLength={16}
              className="w-[85%] border p-2 rounded-l"
              value={newEnvelopeName ?? ""}
              onChange={(e) =>
                setNewEnvelopeName(e.target.value.toLowerCase())
              }
              placeholder="Envelope name"
            />
            <label className="text-[.75rem] sm:text-[1rem]" htmlFor="newTotal">
              Envelope total
            </label>
            <input
              id="newTotal"
              type="number"
              className="w-[85%] border p-2 rounded-md"
              value={newEnvelopeTotal}
              onChange={(e) => setNewEnvelopeTotal(e.target.value)}
              placeholder="Envelope total"
            />
            <input
              type="number"
              className="w-[85%] border p-2 rounded-md"
              value={newEnvelopeSpent}
              onChange={(e) => setNewEnvelopeSpent(e.target.value)}
              placeholder="Envelope spent"
            />
            <div className="flex items-center gap-2 justify-between">
              <input
                type="checkbox"
                checked
                id="newRecurring"
                value={newEnvelopeRecurring ? "true" : "false"}
                onChange={(e) =>
                  setNewEnvelopeRecurring(e.target.value === "true")
                }
              />
              <label htmlFor="newRecurring">Recurring?</label>
            </div>
            <Button
              onClick={() => {
                handleSaveEnvelope?.({
                  id: crypto.randomUUID(),
                  name: newEnvelopeName || "",
                  total: Number(newEnvelopeTotal || 0),
                  spent: Number(newEnvelopeSpent || 0),
                  recurring: newEnvelopeRecurring,
                });
              }}
              color="green"
            >
              Save
            </Button>
            <Button
              onClick={() => {
                handleBack?.();
                setNewEnvelopeName("");
                setNewEnvelopeTotal("");
                setNewEnvelopeSpent("");
              }}
              color="red"
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    case "dash":
      return (
        <div
          className="w-fit relative mb-4 cursor-pointer bg-white border hover:bg-my-green-light rounded-sm mt-8"
          onClick={() => onClick?.()}
        >
          <p className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            {envelope.name}+
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
