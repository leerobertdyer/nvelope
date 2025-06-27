import Nvelope from "./Nvelope";

export default function Loading({text}: {text: string}) {
    return (
        <div className="absolute top-0 left-0 w-screen h-screen flex flex-col justify-center items-center z-9999 bg-my-white-base">
            <Nvelope envelope={{id: "1", name: "Loading...", total: 0, spent: 0, oneTime: false}} kind="dash"/>
            <p className="text-my-green-dark animate-pulse">{text}</p>
        </div>
    );
}