# Nvelope

A personal finance management app built with React, TypeScript, and Firebase.

## Features

- User authentication with Google
- Folder management
- Envelope management

## Tech Stack

- React
- TypeScript
- Firebase
- Tailwind CSS


# TODO

1. Dates handling. Currently using a number for day of bill up to 28
    - Allow for specific dates
    - Allow for specific intervals (Every Friday/Last or First day of month/etc..)
        -ENUMS: WEEKLY | FIRST | SECOND | THIRD | FOURTH | LAST | MONTHLY | YEARLY
    - Choose date from a calendar, then if it is <= 28 allow selection of number/interval
        - if interval show number input for amount of days of interval
    - These dates are stored as timestamps which is utc. When dealing with any dates in our system will first need to translate them back to local time for consistency and accuracy.
    

2. There's no current method to add a bill by weekday (ie every thursday)

3. No way to set a bill to "last friday of month" etc...

4. weekly/biweekly/monthly bill option would be nice same as above. For example: ACORNS doesn't fit my model atm.



# Nice To Have
- Make money flip like it's an actual counter like at a baseball game
- Finish 3d button and give it time before it moves to next page...
- Report page
- Tie in bank account with Plaid and import transactions...
- Turn into a full app available on app store


Phase 2 (Automatic adjustments)

1. Make sure the user can change days of their payment.
2. Add ability to temporarily change days. 
3. Confirm with user before updating.


Phase 3 (TELLER - bank monitoring and notifications)
1. Use Teller to get live read on bank account
2. Prompt spending that doesn't match envelopes
3. Auto-apply certain transactions to specific envelopes
4. Auto-apply income


Phase 4 (Baas Banking Envelopes) ** Dream app || Very Challenging **
1. Add Moov or Unit for real envelopes + money movement
2. Card Issuing with Real-Time Authorization Hooks
3. in-App NFC Payments (not Apple Pay) (android app)
4. UX Timing & Transaction Matching (IE "what envelope?")
5. $$ ACTUALLY comes out of envelope