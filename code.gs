// PPP_FINAL_V5 - Native Today Task Integration
const PPP_BOOKING_SHEET_NAME = 'Requests';
const PPP_BOOKED_TASKS_SHEET_NAME = 'BookedTasks';
const PPP_BOOKING_HEADERS = ['id','createdAt','name','type','what','date','time','timezone','duration','note','status','calendarEventId'];
const PPP_BOOKED_TASK_HEADERS = ['id','bookingId','title','person','date','time','duration','completed','createdAt'];

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || '').toLowerCase();
  if (!action) return HtmlService.createHtmlOutput(publicBookingPage_()).setTitle('Book with me');

  const callback = safeCallback_(p.callback);
  try {
    requireAdminKey_(p.key);
    let payload;
    if (action === 'list') payload = {ok:true, requests:listRequests_()};
    else if (action === 'accept') payload = {ok:true, request:updateRequestStatus_(p.id, 'accepted')};
    else if (action === 'decline') payload = {ok:true, request:deleteRequest_(p.id)};
    else payload = {ok:false, error:'Unknown action'};
    return jsonOrJsonp_(payload, callback);
  } catch (err) {
    return jsonOrJsonp_({ok:false, error:String(err && err.message || err)}, callback);
  }
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const request = createRequest_(p);
    return HtmlService.createHtmlOutput(successPage_(request)).setTitle('Request sent');
  } catch (err) {
    return HtmlService.createHtmlOutput(errorPage_(String(err && err.message || err))).setTitle('Could not send request');
  }
}

function submitPublicBooking(payload) {
  try {
    const request = createRequest_(payload || {});
    return {ok:true, request:request};
  } catch (err) {
    return {ok:false, error:String(err && err.message || err)};
  }
}

function setupPPPBooking() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', Utilities.getUuid().replace(/-/g, ''));
  ensureSheet_();
  Logger.log('ADMIN KEY: ' + props.getProperty('ADMIN_KEY'));
  Logger.log('After deploying as a Web App, copy the /exec URL into PPP Settings → Shared booking.');
}

function getPPPBookingAdminKey() {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key) throw new Error('Run setupPPPBooking() first.');
  Logger.log(key);
  return key;
}

function createRequest_(p) {
  const name = clean_(p.name, 80);
  const type = clean_(p.type || 'Appointment', 50);
  const what = clean_(p.what, 140);
  const date = clean_(p.date, 10);
  const time = normalizeBookingTime_(p.time);
  const timezone = clean_(p.timezone || 'Europe/Berlin', 80);
  const duration = Math.max(15, Math.min(240, Number(p.duration) || 30));
  const note = clean_(p.note, 500);
  if (!name) throw new Error('Please enter your name.');
  if (!what) throw new Error('Please say what the booking is for.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Please choose a date.');
  if (!time) throw new Error('Please enter a valid time, for example 7:30 PM or 19:30.');

  const id = 'req_' + Utilities.getUuid().slice(0, 8) + '_' + Date.now();
  const row = [id, new Date().toISOString(), name, type, what, date, time, timezone, duration, note, 'pending', ''];
  const sheet = ensureSheet_();
  sheet.appendRow(row);
  return rowToObject_(row);
}


// Permanently remove declined requests from the booking inbox.
function deleteRequest_(id) {
  id = clean_(id, 100);
  if (!id) throw new Error('Missing request id.');
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return {id:id, deleted:true};
    }
  }

  throw new Error('Request not found.');
}

function listRequests_() {
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(rowToObject_).filter(r => r.id).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function updateRequestStatus_(id, status) {
  id = clean_(id, 100);
  if (!id) throw new Error('Missing request id.');
  const sheet = ensureSheet_();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) !== id) continue;
    const row = values[i];
    row[10] = status;
    if (status === 'accepted' && !row[11]) {
      const start = bookingDateTime_(row[5], row[6], row[7]);
      const end = new Date(start.getTime() + (Number(row[8]) || 30) * 60000);
      const title = row[4] || ((row[3] || 'Appointment') + ' with ' + (row[2] || 'Guest'));
      const desc = [
        'Requested by: ' + (row[2] || 'Guest'),
        'Type: ' + (row[3] || 'Request'),
        row[9] ? 'Note: ' + row[9] : '',
        'Original timezone: ' + (row[7] || 'Europe/Berlin'),
        'PPP booking request: ' + row[0]
      ].filter(Boolean).join('\n');
      const event = CalendarApp.getDefaultCalendar().createEvent(title, start, end, {description:desc});
      row[11] = event.getId();
    }
    sheet.getRange(i + 1, 1, 1, PPP_BOOKING_HEADERS.length).setValues([row]);
    return rowToObject_(row);
  }
  throw new Error('Request not found.');
}


function normalizeBookingTime_(raw) {
  let s = String(raw == null ? '' : raw).trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  if (!s) return '';
  let period = '';
  const match = s.match(/(am|pm)$/);
  if (match) { period = match[1]; s = s.slice(0, -period.length); }
  let h, m;
  if (s.indexOf(':') >= 0) {
    const parts = s.split(':');
    if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[0]) || !/^\d{1,2}$/.test(parts[1])) return '';
    h = Number(parts[0]); m = Number(parts[1]);
  } else {
    const digits = s.replace(/\D/g, '');
    if (!digits || digits.length > 4) return '';
    if (digits.length <= 2) { h = Number(digits); m = 0; }
    else if (digits.length === 3) { h = Number(digits.slice(0,1)); m = Number(digits.slice(1)); }
    else { h = Number(digits.slice(0,2)); m = Number(digits.slice(2)); }
  }
  if (!Number.isInteger(h) || !Number.isInteger(m) || m < 0 || m > 59) return '';
  if (period) {
    if (h < 1 || h > 12) return '';
    if (period === 'am') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  }
  if (h < 0 || h > 23) return '';
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

function bookingTime12_(value) {
  const v = normalizeBookingTime_(value);
  if (!v) return '';
  const parts = v.split(':').map(Number), h = parts[0], m = parts[1];
  return (h % 12 || 12) + ':' + String(m).padStart(2,'0') + ' ' + (h >= 12 ? 'PM' : 'AM');
}

function bookingDateTime_(date, time, timezone) {
  const parts = String(date).substring(0,10).split('-').map(Number);

  let normalized = '';

  // Handle Google Sheets / Calendar Date objects safely
  if (time instanceof Date && !isNaN(time.getTime())) {
    normalized =
      String(time.getHours()).padStart(2,'0') +
      ':' +
      String(time.getMinutes()).padStart(2,'0');
  } else {
    normalized = normalizeBookingTime_(String(time || ''));
  }

  if (!normalized) {
    throw new Error('Invalid booking time: ' + time);
  }

  const hm = normalized.split(':').map(Number);

  const local = new Date(
    parts[0],
    parts[1]-1,
    parts[2],
    hm[0],
    hm[1],
    0
  );

  return Utilities.parseDate(
    Utilities.formatDate(
      local,
      timezone || "Europe/Berlin",
      "yyyy-MM-dd HH:mm"
    ),
    timezone || "Europe/Berlin",
    "yyyy-MM-dd HH:mm"
  );
}


/* ===== PPP V4 Today Integration ===== */

function createPPPBookedTask_(row){
  const ss = getPPPSpreadsheetV4_();
  let sheet = ss.getSheetByName(PPP_BOOKED_TASKS_SHEET_NAME);

  if(!sheet){
    sheet = ss.insertSheet(PPP_BOOKED_TASKS_SHEET_NAME);
    sheet.appendRow(PPP_BOOKED_TASK_HEADERS);
  }

  const rows = sheet.getDataRange().getValues();
  if(rows.some(r => String(r[1]) === String(row[0]))) return;

  sheet.appendRow([
    "bt_" + Utilities.getUuid().slice(0,8),
    row[0],
    row[4] || row[3],
    row[2],
    row[5],
    row[6],
    row[8],
    false,
    new Date().toISOString()
  ]);
}

function getPPPBookedTasks(){
  const ss = getPPPSpreadsheetV4_();
  const sheet = ss.getSheetByName(PPP_BOOKED_TASKS_SHEET_NAME);
  if(!sheet || sheet.getLastRow()<2) return [];

  return sheet.getDataRange().getValues().slice(1).map(r=>({
    id:r[0],
    bookingId:r[1],
    title:r[2],
    person:r[3],
    date:r[4],
    time:r[5],
    duration:r[6],
    completed:r[7]
  }));
}

function completePPPBookedTask(id){
  const ss = getPPPSpreadsheetV4_();
  const sheet = ss.getSheetByName(PPP_BOOKED_TASKS_SHEET_NAME);
  if(!sheet) return false;

  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(String(data[i][0])===String(id)){
      sheet.getRange(i+1,8).setValue(true);
      return true;
    }
  }
  return false;
}

function getPPPSpreadsheetV4_(){
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id) throw new Error('Run setupPPPBooking() first.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  let ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) {}
  }
  if (!ss) {
    ss = SpreadsheetApp.create('PPP Booking Requests');
    props.setProperty('SHEET_ID', ss.getId());
  }
  let sheet = ss.getSheetByName(PPP_BOOKING_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(PPP_BOOKING_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(PPP_BOOKING_HEADERS);
  return sheet;
}

function requireAdminKey_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!expected) throw new Error('Booking service is not set up yet. Run setupPPPBooking().');
  if (!key || String(key) !== String(expected)) throw new Error('Invalid admin key.');
}

function rowToObject_(row) {
  const out = {};
  PPP_BOOKING_HEADERS.forEach((h,i) => {
    const value = row[i];
    if (h === 'date') {
      if (value instanceof Date) {
        out.date = `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
        return;
      }
      const text = String(value || '').trim();
      out.date = /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text;
      return;
    }
    if (h === 'time') {
      if (value instanceof Date) {
        out.time = String(value.getHours()).padStart(2, '0') + ':' + String(value.getMinutes()).padStart(2, '0');
        return;
      }
      out.time = String(value || '').trim();
      return;
    }
    if (value instanceof Date) {
      out[h] = value.toISOString();
      return;
    }
    out[h] = value;
  });

  try {
    const start = bookingDateTime_(out.date, out.time, out.timezone || 'Europe/Berlin');
    out.germanTime = Utilities.formatDate(start, 'Europe/Berlin', 'dd.MM.yyyy HH:mm');
    out.displayTime = bookingTime12_(out.time);
  } catch(e) {
    out.germanTime = '';
    out.displayTime = '';
  }

  return out;
}

function clean_(value, max) {
  return String(value == null ? '' : value).replace(/[<>]/g, '').trim().slice(0, max || 500);
}

function safeCallback_(cb) {
  cb = String(cb || '');
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(cb) ? cb : '';
}

function jsonOrJsonp_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function publicBookingPage_() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Book with me</title>
<style>
:root{color-scheme:dark;--bg:#07111f;--card:#0f1d31;--line:#263a55;--text:#f4f7fb;--muted:#9db0c8;--blue:#4f8cff;--purple:#9b6cff;--green:#20c997;--red:#ff6b7a}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;background:
radial-gradient(circle at 14% 0,rgba(79,140,255,.22),transparent 30%),
radial-gradient(circle at 100% 0,rgba(155,108,255,.16),transparent 28%),var(--bg);
color:var(--text);min-height:100vh;display:grid;place-items:center;padding:18px}
.card{width:min(640px,100%);background:rgba(15,29,49,.97);border:1px solid var(--line);border-radius:24px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.38)}
h1{margin:0;font-size:1.7rem}p{color:var(--muted);line-height:1.5;margin:7px 0 18px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
label{display:block;color:var(--muted);font-size:.78rem;font-weight:850}
label.wide{grid-column:1/-1}
input,select,textarea{width:100%;margin-top:6px;padding:12px;border-radius:12px;border:1px solid var(--line);background:#0a1728;color:var(--text);font:inherit;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(79,140,255,.12)}
textarea{min-height:82px;resize:vertical}
.durations{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
.durations button{border:1px solid var(--line);background:#14263f;color:var(--muted);border-radius:999px;padding:8px 11px;font-weight:850;cursor:pointer}
.durations button.on{background:rgba(79,140,255,.22);color:#fff;border-color:#4f8cff}
.smart-wrap{position:relative}
.smart-input{font-variant-numeric:tabular-nums;font-weight:900;text-align:center;letter-spacing:.035em}
.pop{position:absolute;left:0;top:calc(100% + 8px);z-index:40;width:min(410px,calc(100vw - 54px));padding:12px;border-radius:16px;background:#0f1d31;border:1px solid #2a4266;box-shadow:0 22px 60px rgba(0,0,0,.5)}
.pop.hidden{display:none}
.pop-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
.pop-head strong{font-size:.88rem;color:#fff}
.pop-head span{font-size:.62rem;font-weight:950;color:#70f0ff;background:#083e50;border:1px solid #0f708a;border-radius:999px;padding:4px 7px}
.choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.choice{border:1px solid #29436f;background:#14263f;color:#fff;border-radius:13px;padding:11px;text-align:left;cursor:pointer}
.choice.recommended{border-color:#1bb58f;background:linear-gradient(135deg,rgba(32,201,151,.15),rgba(39,214,232,.07))}
.choice b{display:block;font-size:.96rem}
.choice small{display:block;color:#9db0c8;font-size:.69rem;margin-top:3px}
.choice.recommended small{color:#55e3c3}
.pop-foot{border-top:1px solid var(--line);margin-top:10px;padding-top:9px;color:var(--muted);font-size:.69rem;line-height:1.42}
.submit{width:100%;margin-top:16px;border:0;border-radius:13px;padding:14px;background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff;font-weight:950;font-size:1rem;cursor:pointer}
.submit:disabled{opacity:.55;cursor:wait}
.msg{display:none;margin-top:12px;padding:11px 12px;border-radius:12px;font-size:.78rem;line-height:1.45}
.msg.show{display:block}.msg.ok{background:rgba(32,201,151,.10);border:1px solid rgba(32,201,151,.28);color:#8ef0ca}
.msg.bad{background:rgba(255,107,122,.10);border:1px solid rgba(255,107,122,.28);color:#ffb4bd}
.privacy{text-align:center;color:var(--muted);font-size:.69rem;margin-top:12px}
@media(max-width:600px){.grid{grid-template-columns:1fr}label.wide{grid-column:auto}.card{padding:18px}.choice-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<form class="card" id="bookingForm" novalidate>
  <h1>📅 Book with me</h1>
  <p>Send a request. I’ll confirm it before it is added to my calendar.</p>

  <div class="grid">
    <label>Your name
      <input id="name" required maxlength="80" autocomplete="name" placeholder="Your name">
    </label>

    <label>Booking type
      <select id="type">
        <option>German study together</option>
        <option>Machine learning study</option>
        <option>MSc / technical study</option>
      </select>
    </label>

    <label class="wide">Topic / purpose
      <input id="what" required maxlength="140" placeholder="e.g. German speaking, ML study, project discussion">
    </label>

    <label>Date
      <input id="bookingDate" type="date" value="${today}" required>
    </label>

    <label>Time
      <div class="smart-wrap">
        <input id="timeDisplay" class="smart-input" type="text" inputmode="text" autocomplete="off" placeholder="09:30" required>
      <input id="userTimezoneDisplay" class="smart-input" readonly value="Detecting timezone...">
      <div id="timezonePreview"></div>
        <div id="timePopover" class="pop hidden">
          <div class="pop-head"><strong id="popTitle">Quick fill</strong><span>SMART TIME</span></div>
          <div id="choiceGrid" class="choice-grid"></div>
          <div id="popFoot" class="pop-foot"></div>
        </div>
      </div>
    </label>

    <label class="wide">Duration
      <div class="durations">
        <button type="button" data-duration="30">30 min</button>
        <button type="button" class="on" data-duration="60">1 hour</button>
        <button type="button" data-duration="90">90 min</button>
        <button type="button" data-duration="120">2 hours</button>
      </div>
    </label>

    <label class="wide">Optional note
      <textarea id="note" maxlength="500" placeholder="Anything useful to know"></textarea>
    </label>
  </div>

  <button class="submit" id="submitBtn" type="submit">Send request</button>
  <div id="message" class="msg"></div>
  <div class="privacy">Only this booking request is shared. Your PPP dashboard remains private.</div>
</form>

<script>
const form=document.getElementById('bookingForm');
const dateInput=document.getElementById('bookingDate');
const timeInput=document.getElementById('timeDisplay');
const pop=document.getElementById('timePopover');
const grid=document.getElementById('choiceGrid');
const popTitle=document.getElementById('popTitle');
const popFoot=document.getElementById('popFoot');
const msg=document.getElementById('message');
const submitBtn=document.getElementById('submitBtn');
let duration=60;

// Ensure browser-local today is selected, while still allowing the visitor to change it.
(function(){
  const d=new Date(), local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  dateInput.value=local.toISOString().slice(0,10);
})();

function pad(n){return String(n).padStart(2,'0')}
function hhmm(d){return pad(d.getHours())+':'+pad(d.getMinutes())}
function to12(v){
  const p=v.split(':').map(Number),h=p[0],m=p[1];
  return (h%12||12)+':'+pad(m)+' '+(h>=12?'PM':'AM');
}
function next15(){
  const d=new Date();d.setSeconds(0,0);
  const r=d.getMinutes()%15;d.setMinutes(d.getMinutes()+(r===0?15:15-r));
  return hhmm(d);
}
function parseExact(raw){
  let s=String(raw||'').trim().toLowerCase().replace(/\./g,'').replace(/\s+/g,'');
  if(!s)return '';
  let period='';
  const pm=s.match(/(am|pm)$/);
  if(pm){period=pm[1];s=s.slice(0,-period.length)}
  let h,m;
  if(s.includes(':')){
    const a=s.split(':');
    if(a.length!==2||!/^\\d{1,2}$/.test(a[0])||!/^\\d{1,2}$/.test(a[1]))return null;
    h=Number(a[0]);m=Number(a[1]);
  }else{
    if(!/^\\d{1,4}$/.test(s))return null;
    if(s.length<=2){h=Number(s);m=0}
    else if(s.length===3){h=Number(s.slice(0,1));m=Number(s.slice(1))}
    else{h=Number(s.slice(0,2));m=Number(s.slice(2))}
  }
  if(m<0||m>59)return null;
  if(period){
    if(h<1||h>12)return null;
    if(period==='am')h=h===12?0:h;else h=h===12?12:h+12;
    return pad(h)+':'+pad(m);
  }
  if(h<0||h>23)return null;
  return pad(h)+':'+pad(m);
}
function choice(label,value,sub,recommended){
  return '<button type="button" class="choice '+(recommended?'recommended':'')+'" data-value="'+value+'"><b>'+label+'</b><small>'+sub+'</small></button>';
}
function applyTime(v){
  timeInput.value=to12(v);
  timeInput.dataset.value=v;
  pop.classList.add('hidden');
}
function showQuick(){
  const now=hhmm(new Date()),n15=next15();
  popTitle.textContent='Quick fill';
  grid.innerHTML=[
    choice('Now',now,to12(now)+' • '+now,true),
    choice('Next 15 min',n15,to12(n15)+' • '+n15,false),
    choice('9:00 AM','09:00','9:00 AM • 09:00',false),
    choice('7:00 PM','19:00','7:00 PM • 19:00',false)
  ].join('');
  popFoot.innerHTML='Tap once to fill the field, or type a time directly. 730 → 07:30, 1930 → 19:30, 7:30 PM → 19:30.';
  wireChoices();pop.classList.remove('hidden');
}
function wireChoices(){
  grid.querySelectorAll('[data-value]').forEach(b=>{
    b.onpointerdown=e=>e.preventDefault();
    b.onclick=()=>applyTime(b.dataset.value);
  });
}
function resolveTime(){

  // Use already converted internal value first
  if(timeInput.dataset.value){
    return timeInput.dataset.value;
  }

  const raw = timeInput.value.trim();

  if(!raw){
    return null;
  }

  let value = raw.toLowerCase().replace(/\s+/g,'');

  let ampm = "";

  if(value.endsWith("am") || value.endsWith("pm")){
    ampm = value.slice(-2);
    value = value.slice(0,-2);
  }

  let hour, minute;

  if(value.includes(":")){

    const p = value.split(":");

    hour = Number(p[0]);
    minute = Number(p[1]);

  } else {

    if(!/^\d+$/.test(value)){
      return null;
    }

    if(value.length === 3){
      hour = Number(value.substring(0,1));
      minute = Number(value.substring(1));
    }
    else if(value.length === 4){
      hour = Number(value.substring(0,2));
      minute = Number(value.substring(2));
    }
    else{
      hour = Number(value);
      minute = 0;
    }
  }

  if(isNaN(hour) || isNaN(minute) || minute > 59){
    return null;
  }

  if(ampm === "pm" && hour !== 12){
    hour += 12;
  }

  if(ampm === "am" && hour === 12){
    hour = 0;
  }

  if(hour < 0 || hour > 23){
    return null;
  }

  const result =
    String(hour).padStart(2,"0") +
    ":" +
    String(minute).padStart(2,"0");

  timeInput.dataset.value = result;

  return result;
}
timeInput.addEventListener('focus',()=>{if(!timeInput.value.trim())showQuick()});
timeInput.addEventListener('click',()=>{if(!timeInput.value.trim())showQuick()});
timeInput.addEventListener('input',()=>{
  delete timeInput.dataset.value;
  if(timeInput.value.trim())pop.classList.add('hidden');
});
document.addEventListener('click',e=>{if(!e.target.closest('.smart-wrap'))pop.classList.add('hidden')});

document.querySelectorAll('[data-duration]').forEach(b=>b.onclick=()=>{
  duration=Number(b.dataset.duration)||60;
  document.querySelectorAll('[data-duration]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
});

function showMessage(text,ok){
  msg.textContent=text;msg.className='msg show '+(ok?'ok':'bad');
}


const tzBox=document.getElementById('userTimezoneDisplay');
const tzPreview=document.getElementById('timezonePreview');
const detectedTZ=Intl.DateTimeFormat().resolvedOptions().timeZone;
if(tzBox) tzBox.value='🌍 '+detectedTZ;

function updateTZPreview(){
 const raw=timeInput.value.trim();
 const m=raw.match(/^(\d{1,2}):(\d{2})$/);
 if(!m || !tzPreview) return;
 const d=new Date();
 d.setHours(Number(m[1]),Number(m[2]),0,0);
 tzPreview.innerHTML =
 '🇧🇩 Bangladesh: '+d.toLocaleTimeString('en-US',{timeZone:'Asia/Dhaka',hour:'2-digit',minute:'2-digit'})+
 '<br>🇩🇪 Germany: '+d.toLocaleTimeString('en-US',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'});
}
timeInput.addEventListener('input',updateTZPreview);

form.addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('name').value.trim();
  const what=document.getElementById('what').value.trim();
  const date=dateInput.value;
  const time=resolveTime();
  if(!name){showMessage('Please enter your name.',false);document.getElementById('name').focus();return}
  if(!what){showMessage('Please enter the topic or purpose.',false);document.getElementById('what').focus();return}
  if(!date){showMessage('Please choose a date.',false);dateInput.focus();return}
  if(!time){showMessage('Please enter a valid time.',false);timeInput.focus();return}

  submitBtn.disabled=true;submitBtn.textContent='Sending…';showMessage('',true);msg.className='msg';
  const payload={
    name:name,
    type:document.getElementById('type').value,
    what:what,
    date:date,
    time:time,
    duration:duration,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    note:document.getElementById('note').value.trim()
  };

  google.script.run
    .withSuccessHandler(result=>{
      submitBtn.disabled=false;submitBtn.textContent='Send request';
      if(!result||result.ok!==true){showMessage((result&&result.error)||'Could not save the request.',false);return}
      showMessage('✓ Request sent. It is waiting for approval.',true);
      form.reset();
      const d=new Date(),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
      dateInput.value=local.toISOString().slice(0,10);
      duration=60;
      document.querySelectorAll('[data-duration]').forEach(x=>x.classList.toggle('on',x.dataset.duration==='60'));
      delete timeInput.dataset.value;
    })
    .withFailureHandler(err=>{
      submitBtn.disabled=false;submitBtn.textContent='Send request';
      showMessage((err&&err.message)||'Could not reach the booking service.',false);
    })
    .submitPublicBooking(payload);
});
</script>
</body>
</html>`;
}

function successPage_(r) {
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;background:#07111f;color:#f4f7fb;min-height:100vh;display:grid;place-items:center;margin:0;padding:20px}.c{max-width:500px;padding:28px;border:1px solid #263a55;border-radius:22px;background:#0f1d31;text-align:center}p{color:#9db0c8;line-height:1.5}</style><div class="c"><h1>✓ Request sent</h1><p>Your request for <strong>${escapeHtmlServer_(r.what)}</strong> on <strong>${escapeHtmlServer_(r.date)} at ${escapeHtmlServer_(bookingTime12_(r.time))} (${escapeHtmlServer_(r.time)})</strong> was sent. It still needs to be accepted.</p></div>`;
}

function errorPage_(message) {
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;background:#07111f;color:#f4f7fb;min-height:100vh;display:grid;place-items:center;margin:0;padding:20px}.c{max-width:500px;padding:28px;border:1px solid #51313a;border-radius:22px;background:#0f1d31;text-align:center}p{color:#ffb2bb;line-height:1.5}</style><div class="c"><h1>Could not send</h1><p>${escapeHtmlServer_(message)}</p><p>Please go back and check the details.</p></div>`;
}

function escapeHtmlServer_(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}


/*
PPP Booking UI rules:
- Show germanTime as the main ticket time.
- Show timezone/source time as secondary information.
- Accept: remove from inbox, open Today tab, highlight booked task.
- Decline: permanently delete request.
*/


// PPP_FIXED_VERSION
// Fixed:
// - Invalid 1899 booking time conversion
// - Date object time handling
// - Safer German time display

// PPP Booking Table Final cleanup
function PPP_Final_Cleanup(){
  const cache = CacheService.getScriptCache();
  cache.removeAll(["booking_requests","pending_requests","today_tasks"]);
  return "PPP booking cache cleared";
}

function PPP_Format_Germany_Time(value){
  return Utilities.formatDate(
    new Date(value),
    "Europe/Berlin",
    "dd.MM.yyyy HH:mm"
  );
}


function updateBookedTaskStatusV5(id, completed){
  const ss = getPPPSpreadsheetV4_ ? getPPPSpreadsheetV4_() : SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  const sheet = ss.getSheetByName(PPP_BOOKED_TASKS_SHEET_NAME);
  if(!sheet) return false;

  const rows = sheet.getDataRange().getValues();
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0])===String(id)){
      sheet.getRange(i+1,8).setValue(Boolean(completed));
      return true;
    }
  }
  return false;
}

function getTodayUnifiedTasksV5(){
  const booked = typeof getPPPBookedTasks === "function" ? getPPPBookedTasks() : [];
  return booked.map(t=>({
    id:t.id,
    title:t.title,
    time:t.time,
    duration:t.duration,
    person:t.person,
    source:"booking",
    completed:t.completed
  }));
}


// PPP FINAL COMPLETE V2 helpers
function getPPPRequestsForTable(){
  return listRequests_().map(function(r){
    return {
      id:r.id,
      name:r.name,
      type:r.type,
      date:r.date,
      time:r.time,
      displayTime:r.displayTime,
      duration:r.duration
    };
  });
}
