import { useEffect, useState } from "react";
import {
  BsEnvelope,
  BsEnvelopeArrowDownFill,
  BsEnvelopeArrowUpFill,
  BsEnvelopeDash,
  BsEnvelopeFill,
  BsEnvelopeOpen,
  BsEnvelopeOpenFill,
  BsEnvelopeOpenHeart,
  BsEnvelopePaper,
  BsEnvelopePaperFill,
  BsEnvelopePlus,
  BsEnvelopeX,
} from "react-icons/bs";
import Button from "./Button";
import type { Envelope, Folder } from "../types";
import { IoIosTrash } from "react-icons/io";
import { generateId } from "../utility";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";

interface NvelopeProps {
  kind: "folder" | "envelope" | "del" | "addFolder" | "addEnvelope" | "sub" | "dash" | "heart" | "all" | "edit";
  id: string;
  name: string;
  total?: number;
  spent?: number;
  children?: React.ReactNode;
  onClick?: () => void;
  handleBack?: () => void;
  handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
  handleSaveFolder?: (folder: Folder) => Promise<void>;
  handleEditEnvelope?: (envelope: Envelope) => void;
  handleDeleteEnvelope?: () => void;
}
export default function Nvelope({ kind, id, name, total, spent, children, onClick, handleBack, handleSaveEnvelope, handleSaveFolder, handleEditEnvelope, handleDeleteEnvelope }: NvelopeProps) {
  const {totalSpendingBudget} = useDatabase()
  const [isOpen, setIsOpen] = useState(false);
  const [newEnvelopeName, setNewEnvelopeName] = useState('');
  const [newEnvelopeTotal, setNewEnvelopeTotal] = useState('');
  const [newEnvelopeSpent, setNewEnvelopeSpent] = useState('');

  // When props change (e.g., when editing a different envelope), update state:
  useEffect(() => {
    setNewEnvelopeName(name || '');
    setNewEnvelopeTotal(total?.toString() || '');
    setNewEnvelopeSpent(spent?.toString() || '');
  }, [name, total, spent]);

  const icons = {
    add: <BsEnvelopePlus className="w-full h-full" />,
    sub: <BsEnvelopeDash className="w-full h-full" />,
    heart: <BsEnvelopeOpenHeart className="w-full h-full" />,
    all: (
      <>
        <BsEnvelope className="w-full h-full" />
        <BsEnvelopeOpen className="w-full h-full" />
        <BsEnvelopePaper className="w-full h-full" />
        <BsEnvelopeOpenHeart className="w-full h-full" />
        <BsEnvelopeDash className="w-full h-full" />
        <BsEnvelopePlus className="w-full h-full" />
        <BsEnvelopeX className="w-full h-full" />
        <BsEnvelopeArrowDownFill className="w-full h-full" />
        <BsEnvelopeArrowUpFill className="w-full h-full" />
      </>
    ),
  };

  function handleOnclick() {
    setIsOpen(!isOpen);
    onClick?.();
  }

  const dottedWidth = 150;
  const dottedHeight = 80;
  const dottedStrokeWidth = 8;
  switch (kind) {
    case "folder":
      return (
        <div
          onClick={handleOnclick}
          className="group w-[10rem] h-[10rem] relative cursor-pointer rounded-md py-[1rem] px-[3.5rem]"
        >
          <p className="w-fit z-12 text-center text-[.6rem] absolute top-[27%] left-1/2 -translate-x-1/2 font-bold">
            {name}
          </p>
          <p className="w-fit px-2 border rounded-md text-center text-[.85rem] text-my-green-dark absolute top-[62%] left-1/2 -translate-x-1/2 z-10">
            {typeof total === "number" && typeof spent === "number"
              ? (total - spent).toFixed(2)
              : "0"}
          </p>
          {isOpen ? <>
            <BsEnvelopeOpenFill className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute " fill="white" />
            <BsEnvelopeOpen className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute " fill="black" />
          </>
          : (
            <>
            <BsEnvelopeOpenFill className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute hidden group-hover:block " fill="white" />
            <BsEnvelopeOpen className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute hidden group-hover:block " fill="black" />
            <BsEnvelopeFill className="w-[92%] h-[92%] block group-hover:hidden absolute top-0 left-[4%]" fill="white" />
            <BsEnvelope className="w-[92%] h-[92%] block group-hover:hidden absolute top-0 left-[4%]" fill="black" />
            </>
          )}
          {children}
        </div>
      );
    case "envelope":
      return (
        <div className="w-[12rem] h-[12rem] relative group">
          <div className="z-12 absolute top-[-2.5%] left-[-2.5%] w-[105%] h-[105%] cursor-pointer group-hover:flex hidden bg-[#0d916744] text-my-green-dark rounded-lg justify-center items-center">
           <p className='z-12 flex justify-center items-center p-2 bg-white rounded-md'>Edit</p>
          </div>
          <div className="z-12 flex flex-col absolute w-full h-full items-center pt-3">
            <p className="w-fit text-center text-[.6rem] text-white">{name}</p>
            <p className="w-fit px-2 bg-white rounded-md text-center text-[.65rem]">${spent}</p>
            <hr className="w-[40%] h-[2px] bg-black my-[3px]" />
            <p className="w-fit px-2 bg-white rounded-md text-center text-[.65rem]">${total}</p>
          </div>
          <BsEnvelopePaper className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute z-10" strokeWidth={.4}  />
          <BsEnvelopePaperFill className="w-[80%] h-[80%] top-0 left-1/2 -translate-x-1/2 absolute text-my-green-dark" />
          {children}
        </div>
      );
    case "del":
      return (
        <div className="absolute inset-0 w-screen h-screen z-100 select-none">
          <div className="flex flex-col bg-my-red-dark w-screen h-screen justify-center items-center ">
              <p className="p-4 rounded-md text-my-white-dark w-full text-center">Are you sure you want to delete this envelope?</p>
              <div className="w-[30rem] h-[50rem] rounded-md py-[1rem] px-[3.5rem] flex justify-center items-center flex-col gap-8">
                  <BsEnvelopeX className="w-[12rem] h-[12rem] text-my-white-light"  />
                  <Button
                      onClick={() => handleBack?.()}
                      color="green"
                  >Cancel</Button>
                  <Button
                      onClick={() => handleDeleteEnvelope?.()}
                      color="red"
                  >Delete</Button>
              </div>
          </div>
        </div>
      );
    case "edit":
      return (
        <div className=" min-h-screen w-full absolute inset-0 bg-my-blue-dark text-white">
            <div className="flex flex-col items-center justify-center gap-2 max-w-[40rem] mx-auto my-20">
              <h2 className="text-2xl">Edit Envelope</h2>
              <input
                  type="text"
                  className="w-[85%] border p-2 rounded-l"
                  value={newEnvelopeName}
                  onChange={(e) => setNewEnvelopeName(e.target.value)}
                  placeholder="Envelope name"
              />
              <input
                  type="number"
                  className="w-[85%] border p-2 rounded-r"
                  value={newEnvelopeTotal}
                  onChange={(e) => setNewEnvelopeTotal(e.target.value)}
                  placeholder="Envelope total"
              /> 
              <input
                  type="number"
                  className="w-[85%] border p-2 rounded-r mb-8"
                  value={newEnvelopeSpent}
                  onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                  placeholder="Envelope spent"
              />
              <Button
                  onClick={() => 
                    {
                      console.log('new envelope', newEnvelopeName, newEnvelopeTotal, newEnvelopeSpent)
                      handleEditEnvelope?.({
                        id,
                        name: newEnvelopeName,
                        total: Number(newEnvelopeTotal),
                        spent: Number(newEnvelopeSpent)
                      })
                    }
                  }
                  color="green"
              >Save</Button>
              <Button
                  onClick={() => {
                    setNewEnvelopeName('');
                    setNewEnvelopeTotal('');
                    setNewEnvelopeSpent('');
                    handleBack?.();
                  }}
                  color="red"
              >Cancel</Button>
              <IoIosTrash
                className="mt-8 text-my-white-light bg-my-red-dark cursor-pointer p-1 border rounded-lg hover:bg-my-white-light hover:text-my-red-dark" 
                size={40} 
                onClick={() => handleDeleteEnvelope?.()} />
            </div>
        </div>
      );
    case "addFolder":
    case "addEnvelope":
      return (
        <div className=" min-h-screen w-full absolute inset-0 bg-my-blue-dark text-white">
            <div className="flex flex-col items-center justify-center gap-2 max-w-[40rem] mx-auto my-20">
              <h2 className="text-2xl">Add New {kind === "addFolder" ? "Folder" : "Envelope"}</h2>
              <input
                  type="text"
                  className="w-[85%] border p-2 rounded-l"
                  value={newEnvelopeName}
                  onChange={(e) => setNewEnvelopeName(e.target.value)}
                  placeholder={kind === "addFolder" ? "Folder name" : "Envelope name"}
              />
              <label 
                className="text-[.75rem] sm:text-[1rem]"
                htmlFor="newTotal">{kind === "addFolder" ? `How much of your remaining budget $${totalSpendingBudget.toFixed(2)} goes into this folder?` : "Envelope total"}</label>
              <input
                  id="newTotal"
                  type="number"
                  className="w-[85%] border p-2 rounded-r"
                  value={newEnvelopeTotal}
                  onChange={(e) => setNewEnvelopeTotal(e.target.value)}
                  placeholder={kind === "addFolder" ? "Folder total" : "Envelope total"}
              /> 
              {kind === "addEnvelope" && (
                <input
                    type="number"
                    className="w-[85%] border p-2 rounded-r"
                    value={newEnvelopeSpent}
                    onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                    placeholder="Envelope spent"
                />
              )}
              <Button
                  onClick={() => {
                    if (name === 'envelope') {
                        handleSaveEnvelope?.({
                        id,
                        name: newEnvelopeName,
                        total: Number(newEnvelopeTotal),
                        spent: Number(newEnvelopeSpent)
                      })
                    } else {
                      const newId = generateId();
                      handleSaveFolder?.({
                        id,
                        name: newEnvelopeName,
                        envelopes: [{
                          id: newId,
                          name: newEnvelopeName,
                          total: Number(newEnvelopeTotal),
                          spent: Number(newEnvelopeSpent)
                        }]
                      })
                    }
                  }}
                  color="green"
              >Save</Button>
              <Button
                  onClick={() => {
                      handleBack?.();
                      setNewEnvelopeName('');
                      setNewEnvelopeTotal('');
                      setNewEnvelopeSpent('');
                  }}
                  color="red"
              >Cancel</Button>
            </div>
        </div>
      );
    case "dash":
      return (
        <div className="w-fit relative mb-4 cursor-pointer bg-white border hover:bg-my-green-light rounded-sm" onClick={() => onClick?.()}>
          <p className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2">{name}+</p>
          <svg width={dottedWidth} height={dottedHeight}>
              {/* Bottom Line */}
            <line 
                  className="animate-march"
                  x1="0" y1={dottedHeight} 
                  x2={dottedWidth} y2={dottedHeight} 
                  stroke="green" 
                  stroke-dasharray="6, 4, 5, 3" 
                  strokeWidth={dottedStrokeWidth} />
              {/* Top Line */}
            <line 
                  className="animate-march"
                  x1="0" y1="0" 
                  x2={dottedWidth} y2="0" 
                  stroke="green" 
                  stroke-dasharray="6, 4, 5, 3" 
                  strokeWidth={dottedStrokeWidth} />
              {/* Left Line */}
            <line 
                  className="animate-march"
                  x1="0" y1={dottedHeight} 
                  x2="0" y2={0} 
                  stroke="green" 
                  stroke-dasharray="6, 4, 5, 3" 
                  strokeWidth={dottedStrokeWidth} />
              {/* Right Line */}
            <line 
                  className="animate-march"
                  x1={dottedWidth} y1={dottedHeight} 
                  x2={dottedWidth} y2={0} 
                  stroke="green" 
                  stroke-dasharray="6, 4, 5, 3" 
                  strokeWidth={dottedStrokeWidth} />
              {/* Left Diagnal */}
            <line 
                  className="animate-march"
                  x1="0" y1="0" 
                  x2={dottedWidth * .5} y2={dottedHeight * .35} 
                  stroke="green" 
                  stroke-dasharray="8, 2" 
                  strokeWidth={dottedStrokeWidth * .35} />
              {/* Right Diagnal */}
            <line 
                  className="animate-march"
                  x1={dottedWidth} y1="0" 
                  x2={dottedWidth * .5} y2={dottedHeight * .35} 
                  stroke="green" 
                  stroke-dasharray="8, 2" 
                  strokeWidth={dottedStrokeWidth * .35} />
          </svg>
      </div>);
    case "sub":
      return icons.sub;
    case "heart":
      return icons.heart;
    default:
      return (
        <div className="w-[35vw] h-[35vw] relative">
          <p className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-2 text-[.6rem]">
            {name}
          </p>
          <p className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-10 text-[.65rem]">
            ${spent}
          </p>
          <hr className="absolute w-full h-[2px] bg-black top-12" />
          <p className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-14 text-[.65rem]">
            ${total}
          </p>
          {icons[kind]}
        </div>
      );
  }
}
