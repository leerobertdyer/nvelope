export default function SpendBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[16rem] h-[16rem] bg-my-white-dark flex items-center justify-center rounded-md animate-glow">
      <div
        onClickCapture={() => {
          onClick();
        }}
        className="rounded-full relative
        w-[10rem] h-[10rem]  
        flex items-center justify-center bg-my-green-dark cursor-pointer"
        >
        <span className="absolute bg-my-green-light w-[10rem] h-[10rem] rounded-full -translate-y-[10px] active:translate-y-[-2px] active:bg-my-red-dark active:text-my-white-light hover:translate-y-[-6px] flex justify-center items-center text-my-black-dark text-[2rem]">SPEND</span>
      </div>
    </div>
  );
}
