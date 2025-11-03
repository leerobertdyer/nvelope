export default function SpendBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[8rem] h-[8rem] bg-my-white-dark flex items-center justify-center rounded-md animate-glow">
      <div
        onClickCapture={() => {
          onClick();
        }}
        className="rounded-full relative
        w-[6rem] h-[6rem]  
        flex items-center justify-center bg-my-green-dark cursor-pointer"
        >
        <span className="absolute bg-my-green-light w-[6rem] h-[6rem] rounded-full -translate-y-[10px] active:translate-y-[-2px] active:bg-my-red-dark active:text-my-white-light hover:translate-y-[-6px] flex justify-center items-center text-my-black-dark text-[1.5rem]">SPEND</span>
      </div>
    </div>
  );
}
