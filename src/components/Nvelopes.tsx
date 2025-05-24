import { useEffect, useState } from "react";
import { useAuth } from "../Context/AuthContext/useAuth";
import loadUserData from "../firebase/loadUserData";
import type { Envelope, Folder } from "../types";
import editFolders from "../firebase/editFolder";


export default function Nvelopes() {
    const { user } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

    // UI state for adding new envelopes
    const [newEnvelopeName, setNewEnvelopeName] = useState<string>('');
    const [addingToFolder, setAddingToFolder] = useState<string | null>(null);
    const [newEnvelopeTotal, setNewEnvelopeTotal] = useState<string>('');
    const [newEnvelopeSpent, setNewEnvelopeSpent] = useState<string>('');

    // UI state for editing envelopes
    const [showEnvelopeEdit, setShowEnvelopeEdit] = useState<Envelope | null>(null);

    function getFolderBalance(folder: Folder) {
        return folder.envelopes.reduce((acc, envelope) => acc + envelope.total - envelope.spent, 0);
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
    
    function handleAddEnvelope(folderName: string) {
        setAddingToFolder(folderName);
    }
    
    async function handleSaveNewEnvelope(folderName: string) {
        if (!newEnvelopeName.trim()) return;
        
        // Create a copy of the folders array
        const newFolders = [...folders];
        
        // Find the folder to add the envelope to
        const folderIndex = newFolders.findIndex(f => f.name === folderName);
        if (folderIndex === -1) return;
        
        // Add the new envelope to the folder
        newFolders[folderIndex].envelopes.push({
            name: newEnvelopeName,
            total: Number(newEnvelopeTotal),
            spent: Number(newEnvelopeSpent)
        });
        
        // Update state
        setFolders(newFolders);
        setNewEnvelopeName('');
        setAddingToFolder(null);
        
        // Save to database
        await editFolders(newFolders, user?.uid || '');
    }

    async function handleClickEnvelope(envelope: Envelope) {
        setShowEnvelopeEdit(envelope);
    }
    
    return (
        <div className="w-full text-center">
            Available Budget: ${folders.reduce((acc, folder) => acc + folder.envelopes.reduce((acc2, envelope) => acc2 + envelope.total - envelope.spent, 0), 0).toFixed(2)}
            {folders.map(folder => (
                <div key={folder.name} className="border p-2 rounded-md select-none flex flex-col gap-2 items-center w-[95%] m-auto">
                    <div 
                        onClick={() => handleShowEnvelopes(folder.name)}
                        className="cursor-pointer px-2 flex justify-around items-center"
                    >
                        {folder.name} 
                        <span className="text-lime-500 ml-2">
                            {getFolderBalance(folder)}
                        </span>
                    </div>
                    {expandedFolders.includes(folder.name) && (
                        <div className="w-full flex flex-col gap-2">
                            {folder.envelopes.map(envelope => envelope.name !== showEnvelopeEdit?.name ? (
                                <div 
                                    onClick={() => handleClickEnvelope(envelope)}
                                    key={envelope.name} className={`flex justify-between items-center w-full ${envelope.spent >= envelope.total ? 'bg-red-300' : 'bg-lime-400'} p-4 rounded`}>
                                    <p>{envelope.name}</p>
                                    <p>${envelope.spent.toFixed(2)}/${envelope.total.toFixed(2)}</p>
                                </div>
                            ) : (
                                <div >
                                    Edit
                                </div>
                            ))}
                            {addingToFolder === folder.name ? (
                                <div className="flex flex-col gap-2  w-full mt-2">
                                    <input
                                        type="text"
                                        className="flex-grow border p-2 rounded-l"
                                        value={newEnvelopeName}
                                        onChange={(e) => setNewEnvelopeName(e.target.value)}
                                        placeholder="Envelope name"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveNewEnvelope(folder.name)}
                                    />
                                    <input
                                        type="number"
                                        className="border p-2 rounded-r"
                                        value={newEnvelopeTotal}
                                        onChange={(e) => setNewEnvelopeTotal(e.target.value)}
                                        placeholder="Envelope total"
                                    /> 
                                    <input
                                        type="number"
                                        className="border p-2 rounded-r"
                                        value={newEnvelopeSpent}
                                        onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                                        placeholder="Envelope spent"
                                    />
                                    <button
                                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4"
                                        onClick={() => handleSaveNewEnvelope(folder.name)}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-r"
                                        onClick={() => {
                                            setAddingToFolder(null);
                                            setNewEnvelopeName('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mt-2"
                                    onClick={() => handleAddEnvelope(folder.name)}
                                >
                                    + Add Envelope
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}