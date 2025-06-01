import { useState } from "react";

export default function Popup({ children, type }: { children: React.ReactNode; type?: string; }) {
  const [show, setShow] = useState(true)
    return (
    <>
      <div className={`z-9998 absolute inset-0 bg-my-black-dark opacity-80 ${show ? "" : "hidden"}`}></div>
      <div
        className={`z-9999 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[4rem] w-[15rem] flex items-end justify-center text-xs text-center
            ${show ? "" : "hidden"}
            ${
              type === "error" ? "bg-my-red-base text-my-white-light" : "bg-my-green-dark text-my-white-light"
            }  p-4 rounded-md border-2 border-my-white-dark`}
      >
        <p className={`${show ? "" : "hidden"} absolute top-2 left-1/2 -translate-x-1/2 cursor-pointer text-3xl text-my-white-dark`} onClick={() => setShow(false)}>X</p>
        {children}
      </div>
    </>
  );
}
