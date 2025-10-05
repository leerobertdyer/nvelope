import Modal from "./Modal";
import Nvelope from "./Nvelope";

export default function Loading({ text }: { text: string }) {
  return (
    <Modal>
      <div className="absolute inset w-screen h-screen flex flex-col justify-center items-center z-9999 bg-my-white-base">
        <Nvelope
          envelope={{
            id: "1",
            name: "Loading...",
            total: 0,
            spent: 0,
            saving: false,
          }}
          kind="dash"
        />
        <p className="text-my-green-dark animate-pulse">{text}</p>
      </div>
    </Modal>
  );
}
