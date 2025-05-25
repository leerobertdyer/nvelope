export default function Spend({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-full border-4 border-double border-my-red-light w-[10rem] h-[10rem] shadow-lg animate-glow shadow-my-green-dark flex items-center justify-center bg-my-green-dark cursor-pointer hover:bg-my-red-dark"
    >
      <p className="text-my-white-light underline animate-pulse">Spend</p>
    </div>
  );
}
