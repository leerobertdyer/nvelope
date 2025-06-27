import { useState } from "react";
import Button from "./Button";
import { createLoginForExistingUser } from "../firebase/createLoginForExistingUser";

export default function CreateLoginWithEmail() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    return (
        <div>
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
                        onClick={() => createLoginForExistingUser(email, password)}
                        color={'red'}
                    >
                        Login/Sign Up
                    </Button>
                </form>
        </div>
    )
}