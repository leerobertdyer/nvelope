import signInWithGoogle from "../firebase/signInWithGoogle";
import Button from "./Button";

export default function LoginProvider({src, text}: {src: string, text: string}) {
  return (
    <Button
        color={'green'}
        onClick={signInWithGoogle}
        >
        <div className="w-fit h-[3rem] flex justify-center items-center gap-6">
            <img src={src} alt={text} className="w-[3rem] h-[3rem] object-cover rounded-md"/>
            <p>{text}</p>
        </div>
    </Button>
  )
}