import Header from "../components/Nav/Header";

const SUPPORT_EMAIL = "lee.dyer.dev@gmail.com";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I get help or report a bug?",
    a: (
      <>
        Email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-my-green-base hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        or use the{" "}
        <a href="/feedback" className="text-my-green-base hover:underline">
          feedback form
        </a>{" "}
        on the web app. I read every message and usually reply within a day or
        two.
      </>
    ),
  },
  {
    q: "How does budgeting with Nvelopes work?",
    a: "Like your grampa does: envelope-style budgeting. Split your available budget into nvelopes for different spending categories, and track bills and debt payments alongside them.",
  },
  {
    q: "Does my data sync between the app and the website?",
    a: "Yes. Signing in with the same account on the iOS app and the web app keeps your nvelopes, payments, and budget in sync through the same account.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Open Settings from the menu (in the app or on the web) and tap Delete Account. If you originally logged in with Google or Apple, you may be prompted to re-log in in order to delete your account. This permanently removes your account and budget data and cannot be undone.",
  },
  {
    q: "I was invited to a shared budget. How do I accept it?",
    a: "Open the invite link you were sent — it works whether or not you already have the app installed. If you're signed in, you'll see an Accept Invite button.",
  },
];

export default function Support() {
  return (
    <div className="min-h-screen flex flex-col bg-my-blue-dark text-my-white-dark">
      <Header
        links={[
          { label: "Home", href: "/" },
          { label: "Feedback", href: "/feedback" },
        ]}
      />
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 pt-16 ">
        <div className="flex justify-around items-center gap-4 mb-10">
          <div
            className="w-[30vw] h-[30vw] max-h-[30rem] max-w-[30rem] bg-my-black-base/40 rounded-md p-4"
            style={{
              backgroundImage: `url("/images/icon.png")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl text-my-white-light mb-2">
              Nvelopes Support
            </h1>
            <p className="text-center text-my-white-light max-w-md mb-8">
              Need help with Nvelopes? Find answers below, or reach out directly
              and I'll get back to you as soon as I can.
            </p>
            <div className="bg-my-black-base/40 rounded-md p-4 w-full max-w-md text-center mb-10">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-my-green-base hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md flex flex-col gap-4 mb-10 font-[times-new-roman]">
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              className="bg-my-black-base/40 rounded-md p-4 text-left"
            >
              <p className="text-my-white-dark text-lg mb-1">{q}</p>
              <p className="text-sm text-my-white-light">{a}</p>
            </div>
          ))}
        </div>

        <footer className="mt-4 text-center text-sm text-my-white-light">
          <a
            href="/privacy"
            className="text-my-green-base hover:underline"
          >
            Privacy
          </a>
          <span className="mx-2">·</span>
          <a
            href="https://www.leedyer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-my-green-base hover:underline"
          >
            www.leedyer.com
          </a>
          <span className="mx-2">·</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-my-green-base hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </footer>
      </div>
    </div>
  );
}
