# Nvelope

A personal finance management app built with React, TypeScript, Firebase.

Live at [https://www.nvelopes.app](https://www.nvelopes.app)

## Tech Stack

- React
- TypeScript
- Firebase
- Tailwind CSS

Firestore rules are in `firestore.rules`; deploy via Firebase Console.

## Google sign-in on Safari / iOS (cookies / third-party storage)

Safari and Chrome on iOS block third-party storage, which breaks redirect sign-in when the auth helper runs on `*.firebaseapp.com` and the app is on a custom domain. To fix it we proxy the auth helper under the app domain (Firebase Option 3).

**1. Vercel proxy** – `vercel.json` rewrites `/__/auth/*` and `/__/firebase/*` to `https://<project>.firebaseapp.com`. If your Firebase project ID is not `nvelope-3e93b`, edit those URLs in `vercel.json`.

**2. Auth domain** – In Vercel (production), set `VITE_AUTH_DOMAIN` to the domain that serves the app, e.g. `nvelopes.app` or `www.nvelopes.app`. That way the SDK uses your domain for auth (same-origin).

**3. OAuth redirect URIs** – In Google Cloud Console → Credentials → your Web OAuth client, add these **Authorized redirect URIs**:
- `https://nvelopes.app/__/auth/handler`
- `https://www.nvelopes.app/__/auth/handler`

**4. Firebase Authorized domains** – In Firebase Console → Authentication → Authorized domains, keep `nvelopes.app` and `www.nvelopes.app` (you already have these).

## Multi-budget & sharing

- **Create budget**: Settings → Budgets → New budget name + "Create budget".
- **Switch budget**: Settings → Budgets → Current budget dropdown.
- **Share by email**: Owner can invite by email (Settings → Share). Invites are stored in `budgetInvites`. When the invited user signs in, the app tries to add them to the budget; **Firestore rules only allow budget writes by owner/members**, so the invited user cannot add themselves from the client. To make "accept invite" work for new users, either deploy a **callable Cloud Function** that uses the Admin SDK to add the user to the budget and delete the invite, or add a Firestore rule that allows the invited user to update the budget when an invite doc exists for their email.
- **Delete budget**: Owner can delete (removes budget and data; all members lose access). Member can "Leave budget" (removes only their access).
- **Remove member**: Owner can remove a member from the budget (Settings → Members → Remove).

# Nice To Haves
- Make money flip like it's an actual counter like at a baseball game
- Tie in bank account with Plaid and import transactions...
- Turn into a full app available on app store

Features Wishlist (TELLER - bank monitoring and notifications)
1. Use Teller to get live read on bank account
2. Prompt spending that doesn't match envelopes
3. Auto-apply certain transactions to specific envelopes
4. Auto-apply income

Dream Wishlist || High Effort **
1. Add Moov or Unit for real envelopes + money movement
2. Card Issuing with Real-Time Authorization Hooks
3. in-App NFC Payments (not Apple Pay) (android app)
4. UX Timing & Transaction Matching (IE "what envelope?")
5. $$ ACTUALLY comes out of envelope