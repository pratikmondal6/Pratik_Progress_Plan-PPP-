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
11. Press **Test Connection**, then press **Send Test Email**. Do not consider email configured until the test message arrives (also check Spam). Then open **Bookings** and copy the public link.

After changing an already-deployed Apps Script, use **Deploy → Manage deployments → Edit**, select **New version**, and deploy it. Apps Script deployments are versioned: saving `code.gs` alone does **not** update the public `/exec` URL. After pasting this version, run `setupPPPBooking()` again so Google can request the Mail permission and log the remaining daily MailApp quota. Then run `testPPPBookingEmail()` from the Apps Script editor once. Finally test from PPP with **Send Test Email**. If a mail fails, check **Apps Script → Executions** for the exact error.

Visitors only see the public request form. When a request is submitted, PPP first saves it to the booking sheet, then sends an owner notification email. If the visitor supplied an email address, PPP also sends them a short “request received” confirmation. This is not final acceptance; accepting the request from PPP creates the Google Calendar event, adds the visitor as a guest, and adds the appointment to My Day. Private feedback remains in the browser and is included in PPP backups.

## Optional Gemini diary analysis

1. Create a Gemini API key in Google AI Studio.
2. In Apps Script, open **Project Settings → Script properties**, add a property named `GEMINI_API_KEY`, and paste the key as its value.
3. Redeploy the Apps Script using **Manage deployments → Edit → New version**.
4. In PPP, open **My Diary → My Progress Review** and choose **Gemini · Day**, **Gemini · Week**, or **Gemini · All**.

The API key is stored in Apps Script Properties and is never sent to the browser. Saving diary entries remains entirely local. Gemini analysis is only requested after you accept the on-screen privacy notice and press a Gemini review button. Diary text is sent in a POST body rather than a URL. Entries marked **Keep this entry out of Gemini reviews** are excluded. Reviews support up to 50,000 characters from the selected period and return goals, achievements, lifestyle observations, positive and negative patterns, problems, possible triggers, habit or addiction patterns, lessons, and supportive next steps. It does not provide a medical diagnosis. Images and automatically calculated Day, Calendar, and sleep metrics are not sent to Gemini. The current default model is `gemini-2.5-flash`. To change it, add a `GEMINI_MODEL` Script property containing another supported model name and redeploy.

When **Analyze this entry with Gemini** is enabled, saving a text diary entry first sends that entry to Gemini. Gemini returns its interpretation plus structured planner actions. PPP then validates those actions against known goal keys, numeric minute limits, valid dates, commitments, notes, and schedule preferences before applying anything. If Gemini fails, the text remains in the editor so it can be retried; it is not silently interpreted with local keyword rules.

## Plan Next Day integration

The standalone **Plan Next Day** page now includes **Book with Pratik** in the creation section. It reads the same public Apps Script URL configured in **Settings → Shared booking connection**. A user can fill a local appointment, choose **Book with Pratik**, and submit once to add the appointment to the private day plan while opening the public booking page with the date, time, title, duration, and note prefilled.

Accepted public booking requests are also synchronized into the standalone Next Day Planner as appointments (in addition to the existing My Day synchronization). To enable the new prefilled public booking fields on an existing deployment, redeploy the updated `code.gs` as a new Apps Script version. The booking page still works without redeploying; it will simply ignore the prefill query parameters until the new version is live.
