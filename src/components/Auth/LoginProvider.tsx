import signInWithGoogle from "../../firebase/signInWithGoogle";

export default function LoginProvider({
  src,
  text,
}: {
  src: string;
  text: string;
}) {
  return (
    <button onClick={signInWithGoogle} className="w-[80%] max-w-[20rem] h-fit p-2 cursor-pointer border-2 rounded-lg bg-my-green-base text-black hover:text-my-white-dark hover:bg-my-black-dark hover:border-my-white-light">
      <div className="w-fit h-[3rem] flex justify-center items-center gap-6">
        <img
          src={src}
          alt={text}
          className="w-[3rem] h-[3rem] object-cover rounded-md"
        />
        <p>{text}</p>
      </div>
    </button>
  );
}
