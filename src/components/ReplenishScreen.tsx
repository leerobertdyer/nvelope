import { useEffect, useState } from "react";
import type { Envelope } from "../types";
import { recalculateBudget, replenishEnvelopes } from "../util";
import Button from "./Button";
import { editEnvelopes, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";

export default function ReplenishScreen({handleBack, envelopes}: {handleBack: () => void, envelopes: Envelope[]}) {
    const { user } =  useAuth();
    const {setEnvelopes, totalSpendingBudget, setTotalSpendingBudget} = useGetDatabase();

    const [rolloverRecurring, setRolloverRecurring] = useState<Envelope[]>([]);
    const [nonRolloverRecurring, setNonRolloverRecurring] = useState<Envelope[]>([]);
    useEffect(() => {
        const rollover = envelopes.filter(e => !e.oneTime && e.rollover);
        const nonRollover = envelopes.filter(e => !e.oneTime && !e.rollover);
        setRolloverRecurring(rollover);
        setNonRolloverRecurring(nonRollover);
    }, [envelopes]);
    
    async function handleReplenishEnvelopes() {
        const envelopesToReplenish = [...nonRolloverRecurring, ...rolloverRecurring];
        const nextEnvelopes = replenishEnvelopes(envelopesToReplenish);
        await editEnvelopes(nextEnvelopes, user!.uid);
        setEnvelopes(nextEnvelopes);
        const envelopeTotalSpent = nextEnvelopes.reduce((total, envelope) => total + envelope.total, 0) * -1;
        const nextBudget = recalculateBudget({ currentAvailableBudget: totalSpendingBudget, diffAmount: envelopeTotalSpent });
        await editTotalSpendingBudget(nextBudget, user!.uid);
        setTotalSpendingBudget(nextBudget);
        exit();
    }

    function exit() {
        setRolloverRecurring([]);
        setNonRolloverRecurring([]);
        handleBack();
    }

    function handleRemoveEnvelope(type: 'recurring' | 'non-recurring', id: string) {
        if (type === 'recurring') {
            const nextRollover = rolloverRecurring.filter(e => e.id !== id);
            setRolloverRecurring(nextRollover);
        } else {
            const nextNonRollover = nonRolloverRecurring.filter(e => e.id !== id);
            setNonRolloverRecurring(nextNonRollover);
        }
    }

    return (
        <div className="w-full h-full absolute top-0 left-0 z-9999 bg-my-black-dark text-my-white-dark overflow-y-auto">
            {nonRolloverRecurring.length > 0 && <>
                <p className='w-full text-center my-[2rem]'>This will reset the following envelopes to $0 spent:</p>
                <div className="w-[90%] max-w-[40rem] rounded-md m-auto bg-my-black-base border-2 border-my-white-dark p-4 flex justify-center items-center flex-wrap gap-2 h-fit max-h-[20rem] overflow-y-auto">
                    {nonRolloverRecurring.map(e => (<>
                        <p key={e.id} className="text-sm w-[70%] p-[5px] text-center bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark" onClick={() => handleRemoveEnvelope('non-recurring', e.id)}>{e.name} <span className="text-my-red-dark cursor-pointer">X</span></p>
                    </>
                    ))}
                </div>
            </>}
            {rolloverRecurring.length > 0 && <>
                <p>And the following envelopes will roll their remaining funds into the next month:</p>
                <div className="w-[90%] rounded-md m-auto bg-my-black-base border-2 border-my-white-dark p-4 flex justify-center items-center flex-wrap gap-2 h-fit max-h-[20rem] overflow-y-auto">
                    {rolloverRecurring.map(e => (<>
                        <p key={e.id} className="text-sm p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark">{e.name}</p>
                    </>
                    ))}
                </div>
            </>}
            <p className='w-full text-center my-[2rem]'>Are you sure you want to continue?</p>
            <div className="w-[90%] m-auto flex justify-center items-center gap-2">
                <Button onClick={handleBack} color="red">No</Button>
                <Button onClick={handleReplenishEnvelopes} color="green">Yes</Button>
            </div>
        </div>
    );
}