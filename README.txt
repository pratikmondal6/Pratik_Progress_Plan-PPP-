PRATIK´S PROGRESS PLAN (PPP) — DIGITAL ACTIVITY EDITION

This website now includes a Digital Activity dashboard that connects to the
separate PPP Activity Tracker Chrome extension.

WEBSITE UPDATE
Replace these files in the GitHub Pages repository root:
- index.html
- manifest.json
- sw.js
- icon.svg
- README.txt

Then run:
  git add .
  git commit -m "Add private digital activity dashboard"
  git push

After GitHub Pages deploys, press Ctrl + Shift + R.

IMPORTANT
The website cannot read Chrome tabs by itself. Install the separate extension.
The extension tracks in the background even while the PPP website is closed.
