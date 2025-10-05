import Modal from "./Modal";
import Nvelope from "./Nvelope";

export default function Loading({ text }: { text: string }) {
  return (
    <Modal>
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
    </Modal>
  );
}
