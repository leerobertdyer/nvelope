import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import loadUserData from "../firebase/loadUserData";
import type { Envelope, Folder } from "../types";
import editFolders from "../firebase/editFolder";
import Nvelope from "./Nvelope";
import { IoIosTrash } from "react-icons/io";
import { IoPencil } from "react-icons/io5";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import Button from "./Button";

export default function Folders() {
    const { user } = useAuth();
    const {totalSpendingBudget} = useDatabase()
    const [folders, setFolders] = useState<Folder[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [showBudgetWarning, setShowBudgetWarning] = useState(false);

    // UI state for editing envelopes
    const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);

    function getFolderBalance(folder: Folder) {
        const balance = folder.envelopes.reduce((acc, envelope) => acc + envelope.total - envelope.spent, 0);
        console.log('balance', balance);
        return balance;
    }

    useEffect(() => {
        if (user) {
            loadUserData(user.uid).then((data) => {
                setFolders(data.folders || []);
            });
        }
    }, [user]);

    function handleShowEnvelopes(folderName: string) {
        if (expandedFolders.includes(folderName)) {
            setExpandedFolders(expandedFolders.filter(name => name !== folderName));
        } else {
            setExpandedFolders([...expandedFolders, folderName]);
        }
    }
    
    async function saveNewEnvelope(envelope: Envelope) {
        console.log('saving new envelope')
        if (!envelope.name.trim() || !currentFolder) return;
        
        // Create a copy of the folders array
        const newFolders = [...folders];
        
        // Find the folder to add the envelope to
        const folderIndex = newFolders.findIndex(f => f.name === currentFolder.name);
        console.log('folderIndex', folderIndex);
        if (folderIndex === -1) return;
        
        // Add the new envelope to the folder
        newFolders[folderIndex].envelopes.push({
            id: envelope.id,
            name: envelope.name,
            total: Number(envelope.total),
            spent: Number(envelope.spent)
        });
        
        // Update state
        setFolders(newFolders);
        resetState();
        
        // Save to database
        await editFolders(newFolders, user?.uid || '');
    }
    
    async function saveNewFolder(folder: Folder) {
        console.log('saving new folder')
        if (!folder.name.trim()) return;
        
        // Create a copy of the folders array
        const newFolders = [...folders];
        
        // Add the new folder to the array
        newFolders.push({
            id: folder.id,
            name: folder.name,
            envelopes: []
        });
        
        // Update state
        setFolders(newFolders);
        resetState();
        
        // Save to database
        await editFolders(newFolders, user?.uid || '');
    }
    
    async function deleteEnvelope() {
        console.log('deleting envelope')
        try {
            const newFolders = [...folders];
            const folderIndex = newFolders.findIndex(f => f.id === currentFolder?.id);
            if (folderIndex === -1) return;
    
            newFolders[folderIndex].envelopes = newFolders[folderIndex].envelopes.filter(e => e.name !== envelopeToEdit?.name);
            setFolders(newFolders);
            await editFolders(newFolders, user?.uid || '');
            resetState();
        } catch (error) {
            console.error('Error deleting envelope:', error);
        }
    }

    // async function deleteFolder(folder: Folder) {
    //     console.log('deleting folder')
    //     try {
    //         const newFolders = [...folders];
    //         const folderIndex = newFolders.findIndex(f => f.id === folder.id);
    //         if (folderIndex === -1) return;
    
    //         newFolders.splice(folderIndex, 1);
    //         setFolders(newFolders);
    //         await editFolders(newFolders, user?.uid || '');
    //         resetState();
    //     } catch (error) {
    //         console.error('Error deleting folder:', error);
    //     }
    // }

    // async function editFolder(folder: Folder) {
    //     console.log('editing folder')
    //     try {
    //         const newFolders = [...folders];
    //         const folderIndex = newFolders.findIndex(f => f.id === folder.id);
    //         if (folderIndex === -1) return;
    
    //         newFolders[folderIndex] = folder;
    //         setFolders(newFolders);
    //         await editFolders(newFolders, user?.uid || '');
    //         resetState();
    //     } catch (error) {
    //         console.error('Error editing folder:', error);
    //     }
    // }

    async function handleEditEnvelope(envelope: Envelope) {
        console.log('editing envelope')
        try {
            const newFolders = [...folders];
            const folderIndex = newFolders.findIndex(f => f.id === currentFolder?.id);
            console.log('folderIndex', folderIndex);
            if (folderIndex === -1) return;
            newFolders[folderIndex].envelopes = newFolders[folderIndex]
                .envelopes.map(e => e.id === envelope.id ? envelope : e);
            setFolders(newFolders);
            await editFolders(newFolders, user?.uid || '');
            resetState();
        } catch (error) {
            console.error('Error editing envelope:', error);
        }
    }
    
    function handleSetupEdit(envelope: Envelope, folder: Folder) {
        setIsDeleting(false)
        setEnvelopeToEdit(envelope);
        setCurrentFolder(folder);
        setIsEditing(true);
    }

    function handleSetupNewEnvelope(folder: Folder) {
        setEnvelopeToEdit(null);
        setIsAdding(true);
        setCurrentFolder(folder);
    }

    function resetState() {
        setIsAddingFolder(false);
        setIsAdding(false);
        setIsEditing(false);
        setIsDeleting(false);
        setEnvelopeToEdit(null);
        setCurrentFolder(null);
      }

    function handleSetupDelete() {
        setIsEditing(false)
        setIsAdding(false);
        setIsDeleting(true);
    }

    function handleSetupFolderDelete(folder: Folder) {
        setCurrentFolder(folder);
        handleSetupDelete();
    }

    function handleSetupNewFolder() {
        if (totalSpendingBudget <= 0) {
            setShowBudgetWarning(true);
            return;
        }
        setIsAddingFolder(true);
        setCurrentFolder({
            id: '',
            name: '',
            envelopes: []
        });
    }

   if (isEditing && envelopeToEdit) {
    return <Nvelope kind="edit" 
        id={envelopeToEdit.id} 
        name={envelopeToEdit.name} 
        total={envelopeToEdit.total} 
        spent={envelopeToEdit.spent} 
        handleEditEnvelope={handleEditEnvelope} 
        handleBack={resetState} 
        handleDeleteEnvelope={() => handleSetupDelete()} />;
   } 
   
   if (isDeleting && envelopeToEdit) {
    return <Nvelope kind="del" 
        id={envelopeToEdit.id} 
        name={envelopeToEdit.name} 
        total={envelopeToEdit.total} 
        spent={envelopeToEdit.spent} 
        handleBack={resetState} 
        handleDeleteEnvelope={() => deleteEnvelope()} />;
   }
   
   if (isAdding && envelopeToEdit) {
    return <Nvelope kind="addEnvelope" 
        id={''} 
        name={envelopeToEdit.name} 
        total={envelopeToEdit.total} 
        spent={envelopeToEdit.spent} 
        handleSaveEnvelope={saveNewEnvelope} handleBack={resetState} />;
   }

   if (isAddingFolder && currentFolder) {
    return <Nvelope kind="addFolder" 
        id={''} 
        name={currentFolder.name} 
        handleSaveFolder={saveNewFolder} 
        handleBack={resetState} />;
   }

   if (showBudgetWarning) {
    return <div className="flex flex-col items-center gap-2">
        <p>You have nothing left in your budget!</p>
        <Button 
            onClick={() => setShowBudgetWarning(false)}
            color="red"
        >
            Go Back
        </Button>
        <Button
            onClick={() => setShowBudgetWarning(false)}
            color="green"
        >
            Take From Another Envelope
        </Button>
    </div>;
   }
    
    return (
        <div className="w-full text-center flex flex-col items-center h-screen overflow-y-auto py-[2rem]">
            Available Budget: ${totalSpendingBudget.toFixed(2)}
            <div className="w-full flex justify-center items-center mt-8">
                <Nvelope 
                    id={''}
                    kind="dash" 
                    name="Folder"
                    onClick={handleSetupNewFolder}
                    handleBack={resetState}
                />
            </div>
            {folders.map(folder => (
                <div key={folder.id} className="flex justify-center flex-wrap w-full">
                    <div className="flex flex-col items-center">
                        <Nvelope kind="folder" 
                            id={folder.id} 
                            name={folder.name} 
                            total={getFolderBalance(folder)} 
                            spent={0} 
                            onClick={() => handleShowEnvelopes(folder.name)}
                        />
                        <div className="flex gap-2">
                            <IoIosTrash className="cursor-pointer rounded-lg p-2 bg-my-red-dark text-my-white-dark hover:bg-my-white-light hover:text-my-red-dark" 
                                size={30}
                                onClick={() => handleSetupFolderDelete(folder)} />
                            <IoPencil className="cursor-pointer rounded-lg p-2 bg-my-red-dark text-my-white-dark hover:bg-my-white-light hover:text-my-red-dark" 
                                size={30}
                                onClick={() => handleSetupEdit(folder.envelopes[0],folder)} />
                        </div>
                    </div>
                    {expandedFolders.includes(folder.name) && (
                        <div className="w-full flex justify-center items-center gap-2 flex-wrap border-y-2 py-4 bg-my-white-dark">
                            <div className="w-full flex justify-center">
                                <Nvelope 
                                    id={''}
                                    kind="dash" 
                                    name="Envelope" 
                                    onClick={() => handleSetupNewEnvelope(folder)}
                                    handleBack={resetState}
                                />
                            </div>
                            {folder.envelopes.map(envelope => (
                                <div className="relative cursor-pointer hover:scale-105" key={envelope.id} >
                                    <div onClick={() => handleSetupEdit(envelope, folder)}>
                                        <Nvelope 
                                            id={envelope.id} 
                                            kind="envelope" 
                                            name={envelope.name} 
                                            total={envelope.total} 
                                            spent={envelope.spent}
                                            handleBack={resetState}
                                            handleEditEnvelope={handleEditEnvelope}
                                            />
                                        </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}