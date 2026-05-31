export default function SpendBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-[12rem] h-[12rem] bg-my-white-dark flex items-center justify-center rounded-3xl animate-glow">
      <div
        onClickCapture={() => {
          onClick();
        }}
        className="rounded-full relative
        w-[8rem] h-[8rem]  
        flex items-center justify-center bg-my-green-dark cursor-pointer"
      >
        <span className="absolute bg-gradient-to-tl from-my-green-light to-my-green-dark w-[8rem] h-[8rem] rounded-full -translate-y-[10px] active:translate-y-[-2px] active:bg-my-red-dark active:text-my-white-light hover:translate-y-[-6px] flex justify-center items-center text-my-white-light text-[2rem]">
          SPEND
        </span>
      </div>
    </div>
  );
}
