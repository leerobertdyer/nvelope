/**
 * NvelopeView – One envelope as a row in the main envelope view.
 * Shows name, remaining (total − spent), and total; color reflects spend level.
 * Used only by NvelopesContainer to render each envelope; supports drag-and-drop for
 * reordering. Child of NvelopesContainer; does not use Nvelope (that’s for detail/edit views).
 */
import { BiEnvelope } from "react-icons/bi";
import type { Envelope } from "../../../../web/src/types";

interface IListEnvelopeProps {
    envelope: Envelope;
    onPress: () => void;
    onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
}
export default function ListEnvelope({ envelope, onPress, onDragStart, onDragOver, onDrop, onDragEnd }: IListEnvelopeProps) {
    return (
        <div draggable={true} id={envelope.id} className={`
            ${envelope.spent >= (envelope.total * 0.75)
                ? 'bg-my-red-dark text-my-white-light'
                : envelope.spent >= (envelope.total * 0.5)
                    ? 'bg-my-white-dark text-my-black-dark'
                    : 'bg-my-green-dark text-my-white-dark'}
            w-screen max-w-[40rem] h-[2rem] grid grid-cols-7 divide-x-2 divide-my-black-dark
            border-2 border-my-black-dark cursor-pointer`}
            onPress={onPress}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}>

            <div className="col-span-3 flex justify-start items-center ml-2 gap-10 relative text-xs">
                <div className="w-[1.85rem] h-[70%] flex justify-start items-center bg-white rounded-sm">
                    <BiEnvelope className="w-[2rem] h-[2rem] text-my-black-dark " />
                </div>
                <p className="absolute left-[3rem]">{envelope.name}</p>
            </div>
            <div className="flex justify-center items-center col-span-2">
                <p className="text-sm">${(envelope.total - envelope.spent).toFixed(2)}</p>
            </div>
            <div className="flex justify-end items-center mr-2 gap-4 col-span-2">
                <p className="text-sm">${envelope.total.toFixed(2)}</p>
            </div>
        </div>
    )
}