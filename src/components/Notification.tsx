export default function Notification({text}: {text: string}) {

    
    return (
        <div className="bg-white p-4 rounded-md w-full max-w-[40rem] m-auto p-[2rem] flex flex-col items-center">
            <h2 className="text-lg mb-4 text-my-red-dark">{text}</h2>
        </div>
    )
}