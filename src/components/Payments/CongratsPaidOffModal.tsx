import FullScreen from "../../Views/FullScreen";

interface IProps {
  debtName: string;
  onClose: () => void;
}

export default function CongratsPaidOffModal({ debtName, onClose }: IProps) {
  return (
    <FullScreen
      theme="DARK"
      onClose={onClose}
      showButtons={true}
      closeButtonText="Yay!"
    >
      <div className="flex flex-col items-center justify-center text-center w-full px-4 py-8">
        <p className="text-2xl md:text-3xl text-my-green-light mb-2">
          🎉 Congrats! 🎉
        </p>
        <p className="text-lg text-my-white-light">
          You paid off <strong>{debtName}</strong>.
        </p>
      </div>
    </FullScreen>
  );
}
