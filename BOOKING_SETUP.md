# PPP shared booking setup

The booking dashboard uses Google Apps Script, Google Sheets, and Google Calendar. No separate database server is required.

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with [`code.gs`](code.gs).
4. Run `setupPPPBooking()` once and approve the requested Google permissions.
5. Open **Execution log** and copy the generated `ADMIN KEY`.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to yourself and **Who has access** to anyone.
8. Deploy and copy the URL ending in `/exec`.
9. In PPP, open **Settings → Shared booking connection** and enter the URL and admin key.
10. Press **Test**, then open **Bookings** and copy the public link.

Visitors only see the public request form. Accepting a request from PPP creates the Google Calendar event and adds the appointment to My Day. Private feedback remains in the browser and is included in PPP backups.
