export default function Divider({
  label1,
  label2,
  c = "my-white-dark",
  c2 = "my-blue-base",
}: {
  label1: string;
  label2: string;
  c?: string;
  c2?: string;
}) {
  return (
    <div className="flex items-center w-full py-4">
      <div className={`flex-grow border-t-[3px] border-my-white-dark`}></div>
      {label1 && (
        <>
          <span className={`px-2 text-${c} text-sm underline`}>{label1} </span>
          {label2 && <span className={`text-${c2} mr-2`}>{label2}</span>}
        </>
      )}
      <div className={`flex-grow border-t-[3px] border-my-white-dark`}></div>
    </div>
  );
}
