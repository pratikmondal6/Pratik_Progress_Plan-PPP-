PPP ACTIVITY TRACKER — CHROME EXTENSION

PURPOSE
Tracks how long the currently active Chrome tab is used and sends local summaries
to the Digital Activity page inside Personal Progress Planner (PPP).

INSTALL
1. Extract this ZIP/folder.
2. In Chrome open: chrome://extensions
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select this extracted folder—the folder containing manifest.json.
6. Return to the live PPP website and refresh it.
7. Optional: pin PPP Activity Tracker from Chrome's Extensions menu.

HOW IT WORKS
- Tracking starts automatically when Chrome is focused and the computer is active.
- It stops when Chrome loses focus, the device becomes idle/locked, tracking is
  paused, or the active page is a Chrome internal page.
- The PPP website does not need to remain open.
- A one-minute checkpoint prevents long sleep/lock gaps from being counted.
- Only domain names and active seconds are stored.
- Full URLs, page titles, search queries and page content are never stored.

PERMISSIONS
- tabs: needed to identify the active tab's domain automatically.
- idle: needed to stop counting when the device is idle or locked.
- storage: saves local daily totals and settings.
- alarms: creates reliable one-minute checkpoints for the event-based service worker.

DATA LOCATION
chrome.storage.local in the Chrome profile where the extension is installed.
No database and no external network request are used.

UPDATE
When a new extension version is supplied:
1. Replace the files in this folder.
2. Open chrome://extensions.
3. Press Reload on PPP Activity Tracker.

UNINSTALLING
Removing the extension removes its locally stored activity data. Export activity
from the PPP dashboard first when a backup is needed.
