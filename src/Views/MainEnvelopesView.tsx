import { useEffect, useState } from "react";
import Header from "../components/Header";
import Nvelopes from "../components/Nvelopes";
import type { Envelope } from "../types";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import { checkAndResetBudget, editEnvelopes, editOneTimeCashAndBudget, editRent, editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import Button from "../components/Button";
import Nvelope from "../components/Nvelope";
import { Timestamp } from "firebase/firestore";
import { addOrSubtractFromBudget } from "../util";
import { useLocation, useNavigate } from "react-router-dom";

export default function MainEnvelopesView() {
    const {user} = useAuth();
    const { totalSpendingBudget, setTotalSpendingBudget, envelopes, setEnvelopes, income, payDate, setPayDate, interval, bills, oneTimeCash, rent, setRent } = useGetDatabase();
    
    const { search } = useLocation();
    const navigate = useNavigate();

    const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
    const [isEditingEnvelope, setIsEditingEnvelope] = useState(false);
    const [isEditingCash, setIsEditingCash] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingCash, setIsAddingCash] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showBudgetWarning, setShowBudgetWarning] = useState(false);
    const [cashName, setCashName] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [showSpendPage, setShowSpendPage] = useState(true);

    const emptyEnvelope = { id: '', name: '', total: 0, spent: 0, recurring: false }

    // This useEffect checks if we need to reset the budget based on interval and date
    useEffect(() => {
        if (!payDate || !interval || !user) return;
        checkAndResetBudget(payDate, interval, envelopes, user, setPayDate, setEnvelopes, setTotalSpendingBudget, income, totalSpendingBudget, bills, oneTimeCash);
    }, [payDate, interval, income, user, envelopes, setPayDate, setEnvelopes, setTotalSpendingBudget, totalSpendingBudget, bills, oneTimeCash]);

    useEffect(() => {
        if (showSpendPage) return;
        navigate('/nvelopes', { replace: true });
    }, [showSpendPage, navigate])


    useEffect(() => {
        const showSpendPage = new URLSearchParams(search).get('showSpendingPage') === 'true';
        console.log('showSpendPage', showSpendPage)
        setShowSpendPage(showSpendPage);
    }, [search]);


    async function handleEditRent(amount: number) {
        console.log("AMOUNT", amount)
        if (!rent) return;
        await editRent(amount, user!.uid);
        setRent({ id: 'rent', name: 'rent', total: rent.total, spent: Number(rent.spent) + amount, recurring: true });
    }

    async function saveNewEnvelope(envelope: Envelope) {
        console.log('saving new envelope')
        if (!envelope.name.trim()) return;
        const newEnvelopes = [...envelopes];
        newEnvelopes.push({
            id: envelope.id,
            name: envelope.name,
            total: Number(envelope.total),
            spent: Number(envelope.spent),
            recurring: envelope.recurring
        });

        await addOrSubtractFromBudget(Number(envelope.total), "sub", user!, totalSpendingBudget, setTotalSpendingBudget); 
        await editEnvelopes(newEnvelopes, user!.uid);
        setEnvelopes(newEnvelopes);
        resetState();
    }
    
    async function handleSetShowSpendingPage(envelope: Envelope) {
        console.log('handleSetShowSpendingPage', envelope)
        setEnvelopeToEdit(envelope);
        setShowSpendPage(true);
    }
        
    async function deleteEnvelope() {
        console.log('deleting envelope')
        try {
            const newEnvelopes = [...envelopes].filter(e => e.id !== envelopeToEdit?.id);
            setEnvelopes(newEnvelopes);
            await addOrSubtractFromBudget(Number(envelopeToEdit?.total || 0), "add", user!, totalSpendingBudget, setTotalSpendingBudget);
            await editEnvelopes(newEnvelopes, user!.uid);
            resetState();
        } catch (error) {
            console.error('Error deleting envelope:', error);
        }
    }

    async function editEnvelope(envelope: Envelope) {
        console.log('editing envelope:', envelope)
        try {
            const originalEnvelope = envelopes.find(e => e.id === envelope.id);
            if (!originalEnvelope) return;
            if (originalEnvelope.total > envelope.total) {
                await addOrSubtractFromBudget(Number(originalEnvelope.total - envelope.total), "add", user!, totalSpendingBudget, setTotalSpendingBudget);
            } else if (originalEnvelope.total < envelope.total) {
                await addOrSubtractFromBudget(Number(envelope.total - originalEnvelope.total), "sub", user!, totalSpendingBudget, setTotalSpendingBudget);
            }
            const newEnvelopes = [...envelopes].map(e => e.id === envelope.id ? envelope : e);
            setEnvelopes(newEnvelopes);
            await editEnvelopes(newEnvelopes, user!.uid);
            resetState();
        } catch (error) {
            console.error('Error editing envelope:', error);
        }
    }
    
    function handleSetupEdit(envelope: Envelope) {
        console.log('handleSetupEdit', envelope)
        setIsDeleting(false)
        setEnvelopeToEdit(envelope);
        setIsEditingEnvelope(true);
    }

    function handleSetupNewEnvelope() {
        setEnvelopeToEdit(null);    
        setIsAdding(true);
    }

    function resetState() {
        setIsAdding(false);
        setIsEditingEnvelope(false);
        setIsDeleting(false);
        setEnvelopeToEdit(null);
        setCashAmount('');
        setCashName('');
        setIsAddingCash(false);
        setIsEditingCash(false);
        setShowSpendPage(false);
    }

    function handleSetupDelete(id?: string) {
        if (id) {
            setEnvelopeToEdit(envelopes.find(envelope => envelope.id === id) || null);
        }
        setIsEditingEnvelope(false)
        setIsAdding(false);
        setIsDeleting(true);
    }

    function handleAddCash() {
        console.log('handleAddCash')
        setIsAddingCash(true);
    }

    async function addCashToDb() {
        if (!cashAmount || !cashName || !user) return;
        const randomId = crypto.randomUUID();
        //newCashEntry: OneTimeCash, userId: string, currentBudget: number, date: Date
        const date = Timestamp.fromDate(new Date());
        const newOneTimeCash = {
            id: randomId,
            name: cashName,
            amount: Number(cashAmount),
            date
        }
        await editOneTimeCashAndBudget(newOneTimeCash, user.uid, totalSpendingBudget);
        setTotalSpendingBudget(totalSpendingBudget + Number(cashAmount));
        resetState();
    }

    function handleEditCash() {
        console.log('handleEditCash')
        setIsEditingCash(true);
    }

    async function manuallySetBudgetInDB() {
        if (!cashAmount || !user) return;
        await editTotalSpendingBudget(Number(cashAmount), user.uid);
        setTotalSpendingBudget(Number(cashAmount));
        resetState();
    }

   if (showSpendPage && envelopes.length > 0) { 
    const envelopeSent = envelopeToEdit || emptyEnvelope;
    return <Nvelope kind="spendingEnvelope" 
        envelope={envelopeSent} 
        editEnvelope={editEnvelope} 
        handleBack={resetState} 
        editRent={handleEditRent}
        />
   }

   if (isEditingEnvelope && envelopeToEdit) {
    return <Nvelope kind="editEnvelope" 
        envelope={envelopeToEdit} 
        editEnvelope={editEnvelope} 
        handleBack={resetState} 
        handleDeleteEnvelope={() => handleSetupDelete()} />;
   } 
   
   if (isDeleting && envelopeToEdit) {
    return <Nvelope kind="deleteEnvelope" 
        envelope={envelopeToEdit} 
        handleBack={resetState} 
        handleDeleteEnvelope={() => deleteEnvelope()} />;
   }
   
   if (isAdding) {
    return <Nvelope kind="addEnvelope" 
        envelope={emptyEnvelope} 
        handleSaveEnvelope={saveNewEnvelope} handleBack={resetState} />;
   }

   if (showBudgetWarning) {
    return <div className="flex flex-col items-center gap-2">
        <p>You have nothing left in your budget!</p>
        <p>Try moving some money from another envelope</p>
        <Button 
            onClick={() => setShowBudgetWarning(false)}
            color="green"
        >
            Go Back
        </Button>
    </div>;
   }

   if (isAddingCash) {
    return (
        <div className="absolute inset-0 bg-my-white-dark text-mywhite-dark w-full h-screen flex flex-col items-center justify-center">
            <h3 className="p-2 text-my-green-dark mb-4">
                Add Cash
            </h3>
            <input 
                value={cashName}
                onChange={(e) => setCashName(e.target.value)}
                type="text" 
                placeholder="Name" 
                className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative" />
            <input 
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                type="number" 
                placeholder="Amount" 
                className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative" />
           <div className="flex flex-col w-full items-center gap-2">
                <Button 
                    onClick={addCashToDb}
                    color="green"
                >
                    Add
                </Button>
                <Button 
                    onClick={() => setIsAddingCash(false)}
                    color="red"
                >
                    Go Back
                </Button>
            </div>
        </div>
    );
   }

   if (isEditingCash) {
    return (
        <div className="absolute inset-0 bg-my-white-dark text-mywhite-dark w-full h-screen flex flex-col items-center justify-center">
            <p className="text-lg mb-4 text-my-red-dark">Manually Adjusts Your Remaining Budget</p>
            <input 
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                type="number" 
                placeholder="Amount" 
                className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative" />
           
           <div className="flex flex-col w-full gap-2 justify-center items-center">
                <Button 
                    onClick={manuallySetBudgetInDB}
                    color="green"
                >
                    Save    
                </Button>
                <Button
                    onClick={resetState}
                    color="red"
                >
                    Back    
                </Button>
            </div>
        </div>
        )
   }

    return (
        <>
            <Header />
            <Nvelopes 
                handleEditCash={handleEditCash}
                handleAddCash={handleAddCash}
                resetState={resetState}
                handleSetupNewEnvelope={handleSetupNewEnvelope}
                handleSetupEdit={handleSetupEdit}
                editEnvelope={editEnvelope}
                handleSetShowSpendingPage={handleSetShowSpendingPage}
                handleDeleteEnvelope={handleSetupDelete}
                handleEditRent={handleEditRent}
            />
        </>
    )
}