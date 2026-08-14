const SHARED_BOOKING_CONFIG_KEY="pppSharedBooking_v1";
let sharedBookingRequests=[],bookingRefreshInFlight=false;
function loadSharedBookingConfig(){try{return {url:"",adminKey:"",...(JSON.parse(localStorage.getItem(SHARED_BOOKING_CONFIG_KEY)||"null")||{})}}catch(e){return {url:"",adminKey:""}}}
function sharedBookingConfig(){return loadSharedBookingConfig()}
function safeBookingServiceUrl(value){try{const url=new URL(String(value||"").trim());return url.protocol==="https:"?url.href:""}catch(e){return ""}}
function saveSharedBookingConfig(){
  const entered=document.getElementById("sharedBookingUrl").value.trim(),url=safeBookingServiceUrl(entered),adminKey=document.getElementById("sharedBookingKey").value.trim();
  if(entered&&!url){showToast("Use a valid HTTPS Apps Script URL");return}localStorage.setItem(SHARED_BOOKING_CONFIG_KEY,JSON.stringify({url,adminKey}));renderSharedBookingConnection();showToast(url&&adminKey?"Booking connection saved":"Booking connection cleared");
}
function renderSharedBookingConnection(){
  const config=sharedBookingConfig(),url=document.getElementById("sharedBookingUrl"),key=document.getElementById("sharedBookingKey"),link=document.getElementById("publicBookingLink");
  if(url&&document.activeElement!==url)url.value=config.url;if(key&&document.activeElement!==key)key.value=config.adminKey;if(link)link.value=config.url;
  setText("sharedBookingStatus",config.url&&config.adminKey?"Connected. Booking requests can now be managed from the dashboard.":"Not connected. Deploy code.gs as a Google Apps Script web app, then paste its URL and admin key.");
  setText("bookingConnectionNote",config.url?"Public booking page ready. The private admin key remains only on this device.":"Connect the booking service in Settings first.");
}
function bookingJsonp(action,params={},onDone=()=>{}){
  const config=sharedBookingConfig();if(!config.url||!config.adminKey){showToast("Connect the booking service in Settings first");onDone(null);return}
  const callback=`pppBooking_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,script=document.createElement("script");let finished=false;
  const cleanup=()=>{if(finished)return;finished=true;try{delete window[callback]}catch(e){}script.remove()};
  const timeout=setTimeout(()=>{cleanup();showToast("Booking service did not respond");onDone(null)},12000);
  window[callback]=data=>{clearTimeout(timeout);cleanup();if(data?.ok===false){showToast(data.error||"Booking request failed");onDone(null);return}onDone(data)};
  const query=new URLSearchParams({action,key:config.adminKey,callback,_:Date.now(),...params});script.src=`${config.url}${config.url.includes("?")?"&":"?"}${query}`;script.onerror=()=>{clearTimeout(timeout);cleanup();showToast("Could not reach the booking service");onDone(null)};document.head.appendChild(script);
}
function bookingDateValue(request){return String(request.ownerDate||request.date||request.startDate||request.start_date||request.dateTime||request.start||"").slice(0,10)}
function bookingTimeValue(request){
  const raw=String(request.ownerTime||request.time||request.startTime||request.start_time||"").trim(),match=raw.match(/(?:^|T)([01]?\d|2[0-3]):([0-5]\d)/);return match?`${String(Number(match[1])).padStart(2,"0")}:${match[2]}`:"";
}
async function bookingPost(action,params={}){
  const config=sharedBookingConfig();if(!config.url||!config.adminKey)throw new Error("Connect the Apps Script service in Settings first");
  const body=new URLSearchParams({action,key:config.adminKey,...params}),response=await fetch(config.url,{method:"POST",body,redirect:"follow"});if(!response.ok)throw new Error(`Service request failed (${response.status})`);const data=await response.json();if(data?.ok===false)throw new Error(data.error||"Service request failed");return data;
}
function bookingRawTimeValue(value){const match=String(value||"").match(/(?:^|T)([01]?\d|2[0-3]):([0-5]\d)/);return match?`${String(Number(match[1])).padStart(2,"0")}:${match[2]}`:""}
function bookingVisitorTimeLabel(request){const value=bookingRawTimeValue(request.time);return value?`${bookingTimeLabel(value)} · ${request.timezone||"visitor timezone"}`:`Time unavailable · ${request.timezone||"visitor timezone"}`}
function bookingTitle(request){return String(request.what||request.title||request.type||"Appointment").trim()}
function bookingDateLabel(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value||"No date";return dateFromKey(value).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
function bookingTimeLabel(value){const normalized=bookingRawTimeValue(value);if(!normalized)return "No time";const [hours,minutes]=normalized.split(":").map(Number);return new Date(2000,0,1,hours,minutes).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}
function acceptedBookings(){return Array.isArray(state.acceptedBookings)?state.acceptedBookings:[]}
function syncBookingToPlanner(request){
  const date=bookingDateValue(request),time=bookingTimeValue(request),start=parseTime(time),duration=clamp(Number(request.duration)||30,15,240);if(!date||start==null)return false;
  addCommitment({id:`booking-${request.id}`,date,start,end:start+duration,title:`${bookingTitle(request)}${request.name?` · ${request.name}`:""}`});return true;
}
function storeAcceptedBooking(request){
  if(!request?.id)return;const index=acceptedBookings().findIndex(item=>String(item.id)===String(request.id));if(index>=0)state.acceptedBookings[index]={...state.acceptedBookings[index],...request,status:"accepted"};else state.acceptedBookings.push({...request,status:"accepted"});syncBookingToPlanner(request);save();renderRoutine();
}
function bookingStatCard(icon,value,label){return `<div class="box glass booking-stat"><span>${icon}</span><div><strong>${value}</strong><small>${label}</small></div></div>`}
function renderBookingDashboard(){
  const requests=document.getElementById("bookingRequestList");if(!requests)return;renderSharedBookingConnection();const accepted=acceptedBookings(),pending=sharedBookingRequests.filter(request=>String(request.status||"pending").toLowerCase()==="pending"),today=localDateKey(new Date()),upcoming=accepted.filter(request=>bookingDateValue(request)>=today).length;
  document.getElementById("bookingDashboardStats").innerHTML=bookingStatCard("⌛",pending.length,"Pending requests")+bookingStatCard("✓",accepted.length,"Accepted")+bookingStatCard("📌",upcoming,"Upcoming")+bookingStatCard("🔗",sharedBookingConfig().url?"Live":"Off","Public page");renderBookingRequests();renderAcceptedBookings();
}
function renderBookingRequests(){
  const host=document.getElementById("bookingRequestList");if(!host)return;if(!sharedBookingConfig().url){host.innerHTML='<div class="booking-empty">Connect the booking service in Settings, then refresh.</div>';return}
  const pending=sharedBookingRequests.filter(request=>String(request.status||"pending").toLowerCase()==="pending");if(!pending.length){host.innerHTML='<div class="booking-empty">No pending booking requests.</div>';return}
  host.innerHTML=`<div class="booking-table-wrap"><table class="booking-table"><thead><tr><th>Request</th><th>Person</th><th>Date</th><th>Germany time</th><th>Duration</th><th>Actions</th></tr></thead><tbody>${pending.map(request=>`<tr><td><strong>${escapeHtml(bookingTitle(request))}</strong>${request.note?`<div class="booking-note">${escapeHtml(request.note)}</div>`:""}</td><td>${escapeHtml(request.name||"Unknown")}</td><td>${escapeHtml(bookingDateLabel(bookingDateValue(request)))}</td><td><strong>${escapeHtml(bookingTimeLabel(bookingTimeValue(request)))}</strong><div class="booking-note">Visitor: ${escapeHtml(bookingVisitorTimeLabel(request))}</div></td><td>${clamp(Number(request.duration)||30,15,240)} min</td><td><div class="booking-row-actions"><button class="btn green" data-booking-action="accept" data-booking-id="${escapeHtml(request.id)}">Accept</button><button class="btn danger" data-booking-action="decline" data-booking-id="${escapeHtml(request.id)}">Decline</button></div></td></tr>`).join("")}</tbody></table></div>`;
}
function renderAcceptedBookings(){
  const host=document.getElementById("bookingPanelList");if(!host)return;const all=acceptedBookings().slice().sort((a,b)=>`${bookingDateValue(a)} ${bookingTimeValue(a)}`.localeCompare(`${bookingDateValue(b)} ${bookingTimeValue(b)}`));if(!all.length){host.innerHTML='<div class="box glass booking-empty">No accepted bookings yet.</div>';return}
  host.innerHTML=all.map(request=>`<article class="box glass accepted-booking-card"><div class="accepted-booking-date"><strong>${escapeHtml(new Date(`${bookingDateValue(request)}T00:00:00`).toLocaleDateString(undefined,{day:"2-digit"}))}</strong><span>${escapeHtml(new Date(`${bookingDateValue(request)}T00:00:00`).toLocaleDateString(undefined,{month:"short"}))}</span></div><div class="accepted-booking-info"><div class="booking-status accepted">Accepted</div><h3>${escapeHtml(bookingTitle(request))}</h3><p>${escapeHtml(request.name||"Unknown guest")} · ${escapeHtml(bookingTimeLabel(bookingTimeValue(request)))} · ${clamp(Number(request.duration)||30,15,240)} min</p>${request.note?`<div class="booking-guest-note">“${escapeHtml(request.note)}”</div>`:""}<label class="booking-feedback"><span>Your private feedback</span><textarea maxlength="800" data-booking-feedback="${escapeHtml(request.id)}" placeholder="Outcome, follow-up, or notes…">${escapeHtml(state.bookingFeedback?.[request.id]||"")}</textarea></label></div><div class="accepted-booking-actions"><button class="btn" data-booking-plan="${escapeHtml(request.id)}">Sync to My Day</button><button class="btn danger" data-booking-remove="${escapeHtml(request.id)}">Remove</button></div></article>`).join("");
}
function refreshBookingRequests(silent=false){const config=sharedBookingConfig();if(!config.url||!config.adminKey){renderBookingDashboard();return}if(bookingRefreshInFlight)return;bookingRefreshInFlight=true;if(!silent)document.getElementById("bookingRequestList").innerHTML='<div class="booking-empty">Loading requests…</div>';bookingJsonp("list",{},data=>{bookingRefreshInFlight=false;if(data)sharedBookingRequests=Array.isArray(data.requests)?data.requests:[];if(data)sharedBookingRequests.filter(request=>String(request.status).toLowerCase()==="accepted").forEach(storeAcceptedBooking);renderBookingDashboard();if(data&&!silent)showToast("Booking dashboard refreshed")})}
function updateBookingRequest(id,action){const request=sharedBookingRequests.find(item=>String(item.id)===String(id));if(!request)return;bookingJsonp(action,{id},data=>{if(!data)return;if(action==="accept"){storeAcceptedBooking({...request,...data.request,status:"accepted"});showToast("Booking accepted and added to My Day")}else showToast("Booking request declined");sharedBookingRequests=sharedBookingRequests.filter(item=>String(item.id)!==String(id));renderBookingDashboard()})}
function removeAcceptedBooking(id){const request=acceptedBookings().find(item=>String(item.id)===String(id));if(!request||!confirm("Remove this booking from PPP and My Day? The Google Calendar event must be deleted separately."))return;state.acceptedBookings=acceptedBookings().filter(item=>String(item.id)!==String(id));if(state.bookingFeedback)delete state.bookingFeedback[id];saveCommitments(loadCommitments().filter(item=>item.id!==`booking-${id}`));save();renderAll();showToast("Booking removed from PPP")}
function attachBookingEvents(){
  document.getElementById("saveSharedBookingBtn").onclick=saveSharedBookingConfig;document.getElementById("testSharedBookingBtn").onclick=()=>bookingJsonp("list",{},data=>{if(data){setText("sharedBookingStatus","Connection successful ✓");showToast("Booking connection works")}});document.getElementById("refreshBookingRequestsBtn").onclick=()=>refreshBookingRequests();
  document.getElementById("copyBookingLinkBtn").onclick=()=>{const url=sharedBookingConfig().url;if(!url){showToast("Connect the booking service first");return}navigator.clipboard?.writeText(url).then(()=>showToast("Booking link copied")).catch(()=>showToast("Could not copy the link"))};document.getElementById("openPublicBookingBtn").onclick=()=>{const url=sharedBookingConfig().url;if(url)window.open(url,"_blank","noopener");else showToast("Connect the booking service first")};
  document.getElementById("bookingRequestList").onclick=event=>{const button=event.target.closest("[data-booking-action]");if(button)updateBookingRequest(button.dataset.bookingId,button.dataset.bookingAction)};
  document.getElementById("bookingPanelList").onclick=event=>{const plan=event.target.closest("[data-booking-plan]"),remove=event.target.closest("[data-booking-remove]");if(plan){const request=acceptedBookings().find(item=>String(item.id)===String(plan.dataset.bookingPlan));if(request&&syncBookingToPlanner(request)){save();renderRoutine();showToast("Booking synchronized with My Day")}}if(remove)removeAcceptedBooking(remove.dataset.bookingRemove)};
  document.getElementById("bookingPanelList").oninput=event=>{const field=event.target;if(!field.dataset.bookingFeedback)return;state.bookingFeedback=state.bookingFeedback||{};state.bookingFeedback[field.dataset.bookingFeedback]=field.value;save()};
}
