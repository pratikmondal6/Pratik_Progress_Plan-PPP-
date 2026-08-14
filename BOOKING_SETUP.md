# PPP shared booking setup

The booking dashboard uses Google Apps Script, Google Sheets, and Google Calendar. No separate database server is required.

1. Create a standalone Apps Script project at `script.google.com`, or open **Extensions → Apps Script** from an existing Google Sheet.
2. Replace the editor contents with [`code.gs`](code.gs).
3. A standalone project will automatically create a **PPP Booking Requests** spreadsheet during setup. An attached project uses its existing spreadsheet.
4. Run `setupPPPBooking()` once and approve the requested Google permissions, including permission to send booking-notification emails.
5. Open **Execution log** and copy the generated `ADMIN KEY`.
6. Check the logged `NOTIFICATION EMAIL`. If it is missing or incorrect, run `setPPPBookingNotificationEmail("your@email.com")` once.
7. Choose **Deploy → New deployment → Web app**.
8. Set **Execute as** to yourself and **Who has access** to anyone.
9. Deploy and copy the URL ending in `/exec`.
10. In PPP, open **Settings → Shared booking connection** and enter the URL and admin key.
11. Press **Test**, then open **Bookings** and copy the public link.

After changing an already-deployed Apps Script, use **Deploy → Manage deployments → Edit**, select **New version**, and deploy it. Submit one test booking and check the notification inbox (including Spam). The booking is still saved if Google temporarily fails to send the email; the failure appears in **Apps Script → Executions**.

Visitors only see the public request form. Accepting a request from PPP creates the Google Calendar event and adds the appointment to My Day. Private feedback remains in the browser and is included in PPP backups.
