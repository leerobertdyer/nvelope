import signout from "../firebase/signOut";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";

export default function Header() {
    const {totalSpendingBudget} = useDatabase()

    return (
        <div className="fixed flex items-center justify-evenly gap-8 w-full py-4 h-[2rem] bg-my-white-base border-b-2 select-none">
            <p className={`text-xl rounded-md ${totalSpendingBudget <= 0 ? 'bg-my-red-dark' : 'bg-my-green-dark'} text-my-white-light p-3 font-bold border-2 border-my-white-light`}>${totalSpendingBudget.toFixed(2)}</p>
            <p className="text-xl rounded-md bg-my-white-light cursor-pointer p-3 font-bold border">Settings</p>
            <p className="text-xl rounded-md bg-my-white-light cursor-pointer p-3 font-bold border"
                onClick={() => signout()}
            >Logout</p>
        </div>
    )
}