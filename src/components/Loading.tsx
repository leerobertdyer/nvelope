import FullScreen from "./FullScreen";
import Nvelope from "./Nvelope";

export default function Loading({ text }: { text: string }) {
  return (
    <FullScreen>
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
    </FullScreen>
  );
}
