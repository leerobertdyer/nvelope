import FullScreen from "./FullScreen";
import Nvelope from "./Nvelope";

export default function Loading({ text }: { text: string }) {
  return (
    <FullScreen theme="DARK">
      <div className="flex flex-col gap-2 justify-center items-center w-full h-screen text-my-black-dark">
        <Nvelope
          envelope={{
            id: "1",
            name: "Loading...",
            total: 0,
            spent: 0,
          }}
          kind="dash"
        />
        <p className="text-my-white-dark animate-pulse">{text}</p>
      </div>
    </FullScreen>
  );
}
