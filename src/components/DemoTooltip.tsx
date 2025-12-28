import Button from "./Buttons/Button";

interface IDemoTooltip {
  children: React.ReactNode;
  onNext: () => void;
  buttonText?: string;
}

export default function DemoTooltip({ children, onNext, buttonText = "Next" }: IDemoTooltip) {
  return (
    <div className="bg-my-black-base rounded-lg p-4 max-w-[20rem] shadow-lg border border-my-white-dark/20 z-[10000]">
      <div className="flex flex-col gap-3 items-center text-center">
        {children}
        <Button color="green" onClick={onNext}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

