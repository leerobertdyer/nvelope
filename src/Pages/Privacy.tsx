import Header from "../components/Nav/Header";

const SUPPORT_EMAIL = "lee.dyer.dev@gmail.com";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-my-blue-dark text-my-white-dark">
      <Header
        links={[
          { label: "Home", href: "/" },
          { label: "Support", href: "/support" },
        ]}
      />
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 pt-16">
        <h1 className="text-2xl text-my-white-light mb-2">Privacy Policy</h1>
        <p className="text-center text-my-white-light max-w-md mb-8 text-sm">
          Last updated: August 9, 2026
        </p>

        <div className="w-full max-w-md flex flex-col gap-4 mb-10 font-[times-new-roman] text-left">
          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">Overview</h2>
            <p className="text-sm text-my-white-light">
              Nvelopes ("we", "the app") is a personal budgeting app. This policy
              explains what data we collect, how we use it, and your choices. We
              do not sell your personal information.
            </p>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">
              Information we collect
            </h2>
            <p className="text-sm text-my-white-light mb-2">
              Depending on how you sign in and use the app, we may store:
            </p>
            <ul className="list-disc pl-5 text-sm text-my-white-light space-y-1">
              <li>
                Account identifiers from your sign-in provider (email address,
                and a provider user ID from Google, Apple, or email/password)
              </li>
              <li>
                Budget data you create (nvelopes, payments, pay dates, backups,
                shared-budget membership)
              </li>
              <li>
                Invite details when you invite someone to a shared budget (email
                address of the invitee)
              </li>
              <li>
                Optional feedback you submit (email, message, and rating)
              </li>
            </ul>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">How we use it</h2>
            <p className="text-sm text-my-white-light">
              We use this information to provide and sync your budgets across
              devices, authenticate you, support shared budgets and invites, and
              respond to support or feedback. We do not use your budget contents
              for advertising.
            </p>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">
              Third-party services
            </h2>
            <p className="text-sm text-my-white-light">
              Authentication and data storage are provided by Firebase (Google).
              Sign-in may also involve Google Sign-In or Sign in with Apple. Those
              providers process data under their own privacy policies.
            </p>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">
              Sharing and retention
            </h2>
            <p className="text-sm text-my-white-light">
              If you join a shared budget, other members of that budget can see
              the budget data. We retain your account and budget data until you
              delete your account (or until a budget you own is deleted). You can
              delete your account from Settings in the app or on the website.
            </p>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">Your choices</h2>
            <p className="text-sm text-my-white-light">
              You can update or delete budget data in the app, leave shared
              budgets, and permanently delete your account and associated data
              from Settings. For questions about this policy or your data, email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-my-green-base hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">Children</h2>
            <p className="text-sm text-my-white-light">
              Nvelopes is not directed at children under 13, and we do not
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="bg-my-black-base/40 rounded-md p-4">
            <h2 className="text-my-white-dark text-lg mb-2">Changes</h2>
            <p className="text-sm text-my-white-light">
              We may update this policy from time to time. The "Last updated"
              date at the top will change when we do. Continued use of Nvelopes
              after an update means you accept the revised policy.
            </p>
          </section>
        </div>

        <footer className="mt-4 text-center text-sm text-my-white-light">
          <a
            href="/support"
            className="text-my-green-base hover:underline"
          >
            Support
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
