import { useEffect, useState } from "react";
import Header from "../components/Header";
import Nvelopes from "../components/Nvelopes";
import type { Envelope } from "../types";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { checkToResetBudget, editEnvelopes, editOneTimeCashAndBudget, editOneTimeExpense, editRent, resetBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import Button from "../components/Button";
import Nvelope from "../components/Nvelope";
import { Timestamp } from "firebase/firestore";
import { addSubFromBudgetStateAndDB,  } from "../util";
import { GiMoneyStack } from "react-icons/gi";
import Loading from "../components/Loading";

export default function MainEnvelopesView() {
    const {user} = useAuth();
    const { totalSpendingBudget, setTotalSpendingBudget, envelopes, setEnvelopes, rent, setRent, oneTimeCash, setOneTimeCash, income, payments, payDate, payPeriodInterval, oneTimeExpenses, resetBudgetTimestamp, setResetBudgetTimestamp } = useDatabase();

    const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
    const [isEditingEnvelope, setIsEditingEnvelope] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingCash, setIsAddingCash] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showBudgetWarning, setShowBudgetWarning] = useState(false);
    const [cashName, setCashName] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [showSpendPage, setShowSpendPage] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [showLoading, setShowLoading] = useState(false);
    const [isAddingOneTimeBill, setIsAddingOneTimeBill] = useState(false);
    const [isAddingCashToEnvelope, setIsAddingCashToEnvelope] = useState(false);


    const emptyEnvelope = { id: '', name: '', total: 0, spent: 0, oneTime: false }

    // This useEffect checks if we need to reset the budget based on interval and date
    useEffect(() => {
        if (!payDate || !payPeriodInterval || !user) return;
        const checkResetShowLoader = async () => {
            setLoadingText("Checking Dates...")
            setShowLoading(true);
            if (await checkToResetBudget(resetBudgetTimestamp, payDate, payPeriodInterval))
            await resetBudget({payDate, payPeriodInterval, envelopes, user, setEnvelopes, setTotalSpendingBudget, setOneTimeCash, income, totalSpendingBudget, payments, oneTimeCash, oneTimeExpenses, setResetBudgetTimestamp});
            resetState();
        }
        checkResetShowLoader();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payDate, payPeriodInterval, user]);



    async function handleEditRent(newRentAmount: number) {
        if (!rent) return;
        setLoadingText("Editing Rent...")
        setShowLoading(true);
        await editRent(newRentAmount, user!.uid);
        setRent(newRentAmount);
        resetState();
    }

    async function saveNewEnvelope(e: Envelope) {
        if (!e.name.trim()) return;
        setLoadingText("Adding New Envelope...")
        setShowLoading(true);
        const newEnvelopes = [...envelopes];
        newEnvelopes.push({
            id: e.id,
            name: e.name,
            total: e.total,
            resetTotal: e.resetTotal || e.total || 0,
            spent: e.spent || 0,
            saving: e.saving,
            order: e.order || 0
        });
        setEnvelopes(newEnvelopes);
        await editEnvelopes(newEnvelopes, user!.uid);
        await addSubFromBudgetStateAndDB(Number(e.total), "sub", user!, totalSpendingBudget, setTotalSpendingBudget);
        resetState();
    }
    
    async function handleSetShowSpendingPage(e: Envelope) {
        setEnvelopeToEdit(e);
        setShowSpendPage(true);
    }
        
    async function deleteEnvelope() {
        try {
            setLoadingText("Deleting Envelope...")
            setShowLoading(true);
            const newEnvelopes = [...envelopes].filter(e => e.id !== envelopeToEdit?.id);
            setEnvelopes(newEnvelopes);
            await addSubFromBudgetStateAndDB(Number(envelopeToEdit?.total || 0), "add", user!, totalSpendingBudget, setTotalSpendingBudget);
            await editEnvelopes(newEnvelopes, user!.uid);
            resetState();
        } catch (error) {
            console.error('Error deleting envelope:', error);
            setShowLoading(false);
        }
    }

    async function editEnvelope(n: Envelope) {
        try {
            const originalEnvelope = envelopes.find(e => e.id === n.id);
            if (!originalEnvelope) return;
            setLoadingText("Editing Envelope...")
            setShowLoading(true);
            if (originalEnvelope.total > n.total) {
                await addSubFromBudgetStateAndDB(Number(originalEnvelope.total - n.total), "add", user!, totalSpendingBudget, setTotalSpendingBudget);
            } else if (originalEnvelope.total < n.total) {
                await addSubFromBudgetStateAndDB(Number(n.total - originalEnvelope.total), "sub", user!, totalSpendingBudget, setTotalSpendingBudget);
            }
            const newEnvelopes = [...envelopes].map(e => e.id === n.id ? n : e);
            setEnvelopes(newEnvelopes);
            await editEnvelopes(newEnvelopes, user!.uid);
            resetState();
        } catch (error) {
            console.error('Error editing envelope:', error);
            setShowLoading(false);
        }
    }
    
    function handleSetupEdit(n: Envelope) {
        setIsDeleting(false)
        setEnvelopeToEdit(n);
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
        setShowSpendPage(false);
        setShowBudgetWarning(false);
        setIsAddingOneTimeBill(false);
        setShowLoading(false);
        setIsAddingCashToEnvelope(false);
    }

    function handleSetupDelete(id?: string) {
        if (id) {
            setEnvelopeToEdit(envelopes.find(e => e.id === id) || null);
        }
        setIsEditingEnvelope(false)
        setIsAdding(false);
        setIsDeleting(true);
    }

    function handleAddCash() {
        setIsAddingCash(true);
    }

    async function addCashToDb() {
        if (!cashAmount || !cashName || !user) return;
        setLoadingText("Adding Cash...")
        setShowLoading(true);
        const randomId = crypto.randomUUID();
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

    async function addOneTimeExpenseToDb() {
        if (!cashAmount || !cashName || !user) return;
        setLoadingText("Adding One Time Expense...")
        setShowLoading(true);
        const randomId = crypto.randomUUID(); 
        const date = Timestamp.fromDate(new Date());
        const newOneTimeExpense = {
            id: randomId,
            name: cashName,
            amount: Number(cashAmount),
            date 
        }
        await editOneTimeExpense(newOneTimeExpense, user.uid)
        await addSubFromBudgetStateAndDB(Number(cashAmount), "sub", user, totalSpendingBudget, setTotalSpendingBudget);
        resetState();
    }


    function handleAddOneTimeBill() {
        setIsAddingOneTimeBill(true);
    }

    function handleAddCashToEnvelope(envelope: Envelope) {
        setIsAddingCashToEnvelope(true);
        setEnvelopeToEdit(envelope);
    }

    async function addCashToEnvelope() {
        const n = envelopes.find(e => e.id === envelopeToEdit?.id);
        if (!n || !cashAmount || !user) return;
        setLoadingText("Filling Nvelope...")
        setShowLoading(true);
        const newEnvelopes = [...envelopes].map(e => e.id === n.id ? {...n, total: n.total + Number(cashAmount)} : e);
        await addSubFromBudgetStateAndDB(Number(cashAmount), "sub", user, totalSpendingBudget, setTotalSpendingBudget);
        await editEnvelopes(newEnvelopes, user.uid);
        setEnvelopes(newEnvelopes);
        resetState();
    }

   if (showSpendPage && envelopes.length > 0) { 
    const envelopeSent = envelopeToEdit || emptyEnvelope;
    return <>
    {showLoading && <Loading text={loadingText} />}
    <Nvelope kind="spendingEnvelope" 
        envelope={envelopeSent} 
        editEnvelope={editEnvelope} 
        handleBack={resetState} 
        editRent={handleEditRent}
        />
    </>
   }

   if (isEditingEnvelope && envelopeToEdit) {
    return <>
    {showLoading && <Loading text={loadingText} />}
    <Nvelope kind="editEnvelope" 
        envelope={envelopeToEdit} 
        editEnvelope={editEnvelope} 
        handleBack={resetState} 
        handleDeleteEnvelope={() => handleSetupDelete()} />;
        </>
   } 
   
   if (isDeleting && envelopeToEdit) {
    return <>
        {showLoading && <Loading text={loadingText} />}
    <Nvelope kind="deleteEnvelope" 
        envelope={envelopeToEdit} 
        handleBack={resetState} 
        handleDeleteEnvelope={() => deleteEnvelope()} />;
        </>
   }
   
   if (isAdding) {
    return <>
    {showLoading && <Loading text={loadingText} />}
    <Nvelope kind="addEnvelope" 
        envelope={emptyEnvelope} 
        handleSaveEnvelope={saveNewEnvelope} handleBack={resetState} />;
        </>
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

    if (isAddingOneTimeBill) {
        return (
            <>
        {showLoading && <Loading text={loadingText} />}
            <div className="absolute inset-0 bg-my-white-dark text-mywhite-dark w-full h-screen flex flex-col items-center justify-center">
                <h3 className="p-2 text-my-green-dark mb-4">
                    Add One Time Expense
                </h3>
                <input 
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    type="number" 
                    placeholder="Amount" 
                    className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative" />
                <input 
                    value={cashName}
                    onChange={(e) => setCashName(e.target.value)}
                    type="text" 
                    placeholder="Name" 
                    className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative" />
                <div className="flex flex-col w-full items-center gap-2">
                    <Button 
                        onClick={addOneTimeExpenseToDb}
                        color="green"
                        >
                        Add
                    </Button>
                    <Button 
                        onClick={() => resetState()}
                        color="red"
                        >
                        Go Back
                    </Button>
                </div>
            </div>
            </>
        );
    }
    
   if (isAddingCash) {
    return (<>
        {showLoading && <Loading text={loadingText} />}
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
                    </>
    );
   }

   if (isAddingCashToEnvelope) {
    return (<>
        {showLoading && <Loading text={loadingText} />}
        <div className="absolute inset-0 bg-my-white-dark text-mywhite-dark w-full h-screen flex flex-col items-center justify-center">
            <h3 className="p-2 text-my-green-dark mb-4">
                Add Cash to {envelopeToEdit?.name}
            </h3>
            <input 
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                type="number" 
                placeholder="Amount" 
                className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative" />
           <div className="flex flex-col w-full items-center gap-2">
                <Button 
                    onClick={addCashToEnvelope}
                    color="green"
                    >
                    Add
                </Button>
                <Button 
                    onClick={() => setIsAddingCashToEnvelope(false)}
                    color="red"
                    >
                    Go Back
                </Button>
            </div>
        </div>
                    </>
    );
   }

    return (
        <>
        {showLoading && <Loading text={loadingText} />}

            <Header links={[
                { label: "Payments", href: "/payments" },
                { label: "Settings", href: "/settings" },
            ]} />

            <div className="flex flex-col items-center gap-[3rem] overflow-y-auto overflow-x-hidden bg-my-black-base">

                <div className="flex w-full justify-center gap-4 items-center mt-[2rem]">
                    <div className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[4rem] w-[4rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark animate-glow shadow-lg text-my-red-dark shadow-my-red-light"
                        onClick={handleAddOneTimeBill}>
                        <GiMoneyStack 
                            className="cursor-pointer border-2 rounded-md  w-[2rem] h-[2rem] p-[2px] bg-my-white-base"  />
                        <p className="text-sm">Expense</p>
                    </div>
                    <div className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[4rem] w-[4rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-green-dark animate-glow shadow-lg text-my-green-dark shadow-my-green-light"
                        onClick={handleAddCash}>
                        <GiMoneyStack 
                            className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-base "  />
                        <p className="text-sm">Add Cash</p>
                    </div>
                </div>

                <Nvelopes 
                    resetState={resetState}
                    handleSetupNewEnvelope={handleSetupNewEnvelope}
                    handleSetupEdit={handleSetupEdit}
                    editEnvelope={editEnvelope}
                    handleSetShowSpendingPage={handleSetShowSpendingPage}
                    handleDeleteEnvelope={handleSetupDelete}
                    handleEditRent={handleEditRent}
                    handleAddCashToEnvelope={handleAddCashToEnvelope}
                />
            </div>

        </>
    )
}