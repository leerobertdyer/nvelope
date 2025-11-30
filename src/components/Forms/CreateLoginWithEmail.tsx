import { useState } from "react";
import Button from "../Buttons/Button";
import { createLoginForExistingUser } from "../../firebase/createLoginForExistingUser";

export default function CreateLoginWithEmail({onDone}: {onDone: () => void}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSignUp() {
        createLoginForExistingUser(email, password);
        onDone();
    }
    
    return (
        <div className="bg-white py-8 rounded-md w-full max-w-[30rem] m-auto flex flex-col items-center mb-4">
            <h2 className="text-lg mb-4 text-my-red-dark">Add Email & Password Login</h2>
             <form className="w-full h-full flex flex-col justify-center items-center gap-6">
                    <input 
                        type="text" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-[80%] max-w-[20rem] p-2 border rounded-lg bg-my-white-dark"
                    />
                    <Button
                        onClick={() => handleSignUp()}
                        color={'red'}
                    >
                        Login/Sign Up
                    </Button>
                </form>
        </div>
    )
}