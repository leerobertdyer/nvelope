import { IoIosMenu } from "react-icons/io";
import { Link } from "react-router-dom";
import ShowAndHide from "./ShowAndHide";

interface NavMenuProps {
    showMenu: boolean;
    setShowMenu: (show: boolean) => void;
    links: { label: string, href: string }[];
}

export default function NavMenu({ showMenu, setShowMenu, links }: NavMenuProps) {
    return (<>
        <div 
            className={`absolute z-9999 top-0 w-full h-fit flex flex-col items-center justify-center py-2 gap-2 text-2xl bg-my-white-base border-b-2 border-my-white-dark text-my-white-light
                transition-transform duration-300 ease-in-out
                ${showMenu ? "translate-y-0" : "-translate-y-full"}`}
        >
            {links.map((link) => (
                <Link  to={link.href} key={link.label} 
                    className="w-full py-2 text-center hover:bg-my-white-light hover:text-my-black-base cursor-pointer 
                        text-my-white-dark bg-my-black-base">
                   {link.label}</Link>
            ))}
            <ShowAndHide onClick={() => setShowMenu(false)} iconSize={55} colorScheme="text-my-black-dark"/>
        </div>
        
        {!showMenu && (
            <IoIosMenu 
                className="text-my-white-base bg-my-black-base rounded-md p-2 cursor-pointer text-3xl border-my-black-dark" 
                onClick={() => setShowMenu(true)} 
            />
        )}
    </>)
}
