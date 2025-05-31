export default function SpendBtn({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-full border-8 border-double border-my-white-dark w-[10rem] h-[10rem] animate-glow shadow-my-white-dark shadow-xl  flex items-center justify-center bg-my-green-dark cursor-pointer hover:bg-my-red-dark hover:border-my-white-dark"
    >
      <p className="text-my-white-light underline animate-pulse">Spend</p>
    </div>
  );
}
