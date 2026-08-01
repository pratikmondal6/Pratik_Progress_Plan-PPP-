const PPP_ACTIVITY_PAGE_SOURCE="PPP_PROGRESS_PLAN_WEB_V1";
const PPP_ACTIVITY_EXTENSION_SOURCE="PPP_ACTIVITY_EXTENSION_V1";
const ACTIVITY_CATEGORIES=[
  ["study","Study","var(--cyan)"],["productive","Productive","var(--green)"],
  ["communication","Communication","var(--blue)"],["social","Social","var(--pink)"],
  ["entertainment","Entertainment","var(--purple)"],["neutral","Neutral","var(--muted)"]
];
let extensionActivity=null,extensionConnected=false,activityRequestSeq=0;
const activityPending=new Map();

function formatActivityTime(seconds){
  seconds=Math.max(0,Math.round(Number(seconds)||0));
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60);
  if(h)return `${h}h ${String(m).padStart(2,"0")}m`;
  if(m)return `${m}m`;
  return `${seconds}s`;
}
function activityRequest(action,payload={}){
  const requestId=`ppp-${Date.now()}-${++activityRequestSeq}`;
  return new Promise((resolve,reject)=>{
    activityPending.set(requestId,{resolve,reject});
    window.postMessage({source:PPP_ACTIVITY_PAGE_SOURCE,requestId,action,payload},"*");
    setTimeout(()=>{
      if(activityPending.has(requestId)){
        activityPending.delete(requestId);
        reject(new Error("PPP Activity Tracker did not respond"));
      }
    },3500);
  });
}
function setActivityConnection(status,title,text){
  const dot=document.getElementById("activityConnectionDot");
  if(!dot)return;
  dot.className=`connection-dot ${status}`;
  setText("activityConnectionTitle",title);
  setText("activityConnectionText",text);
}
async function requestActivity(showMessage=false){
  try{
    const response=await activityRequest("GET_ACTIVITY",{rangeDays:30});
    extensionConnected=true;
    extensionActivity=response.activity;
    renderActivity();
    if(showMessage)showToast("Digital activity refreshed");
  }catch(e){
    extensionConnected=false;
    renderActivity();
    if(showMessage)showToast("PPP Activity Tracker is not connected");
  }
}
function renderActivity(){
  const rows=document.getElementById("activityDomainRows");
  if(!rows)return;
  if(!extensionConnected||!extensionActivity){
    setActivityConnection("error","PPP Activity Tracker is not connected","Install or reload the Chrome extension, then refresh this page.");
    ["activityTotal","activityProductive","activityDistracting","activityFocusRatio","activityDomainCount"].forEach(id=>setText(id,"—"));
    setText("activityLiveDomain","Extension not detected");
    setText("activityLiveStatus","The website cannot track tabs by itself.");
    document.getElementById("activityLivePulse").style.background="var(--muted)";
    document.getElementById("activityTrackingBtn").textContent="Not connected";
    rows.innerHTML=`<tr><td colspan="4"><div class="activity-empty">No extension data yet. Open the Installation Guide above.</div></td></tr>`;
    document.getElementById("activityCategoryBars").innerHTML=`<div class="activity-empty">Category data will appear after tracking starts.</div>`;
    document.getElementById("activityLegend").innerHTML="";
    drawActivityWeek([]);
    return;
  }
  const a=extensionActivity,t=a.today;
  setActivityConnection("connected","PPP Activity Tracker connected",`Local activity updated ${new Date(a.generatedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}.`);
  setText("activityTotal",formatActivityTime(t.totalSeconds));
  setText("activityProductive",formatActivityTime(t.productiveSeconds));
  setText("activityDistracting",formatActivityTime(t.distractingSeconds));
  setText("activityFocusRatio",`${t.focusRatio}%`);
  setText("activityDomainCount",t.domainCount);
  const live=a.live||{};
  document.getElementById("activityLivePulse").style.background=live.activeDomain&&a.settings.enabled?"var(--green)":"var(--muted)";
  setText("activityLiveDomain",!a.settings.enabled?"Tracking paused":live.activeDomain||"No active website");
  setText("activityLiveStatus",!a.settings.enabled?"Resume tracking when you are ready.":live.activeDomain?`Counting active time on ${live.activeDomain}.`:"Chrome may be unfocused, idle, or on an internal page.");
  document.getElementById("activityTrackingBtn").textContent=a.settings.enabled?"Pause":"Resume";
  document.getElementById("activityIdleSelect").value=String(a.settings.idleSeconds||60);

  const maxCategory=Math.max(1,...ACTIVITY_CATEGORIES.map(([key])=>t.categories[key]||0));
  document.getElementById("activityCategoryBars").innerHTML=ACTIVITY_CATEGORIES.map(([key,label])=>{
    const value=t.categories[key]||0,pct=value/maxCategory*100;
    return `<div class="activity-bar-row"><div class="activity-bar-label">${label}</div><div class="activity-track"><div class="activity-fill" style="width:${pct}%"></div></div><div class="pct">${formatActivityTime(value)}</div></div>`;
  }).join("");
  document.getElementById("activityLegend").innerHTML=ACTIVITY_CATEGORIES.map(([key,label,color])=>`<span class="legend-chip"><span class="legend-dot" style="background:${color}"></span>${label}</span>`).join("");

  const options=ACTIVITY_CATEGORIES.map(([k,label])=>[k,label]);
  rows.innerHTML=t.topDomains.length?t.topDomains.map(d=>`<tr><td class="domain-cell">${escapeHtml(d.domain)}</td><td>${formatActivityTime(d.seconds)}</td><td>${d.share}%</td><td><select class="category-select" data-activity-domain="${escapeHtml(d.domain)}">${options.map(([k,l])=>`<option value="${k}" ${d.category===k?"selected":""}>${l}</option>`).join("")}</select></td></tr>`).join("")
    :`<tr><td colspan="4"><div class="activity-empty">Browse normally for a few minutes; results will appear here.</div></td></tr>`;
  drawActivityWeek(a.last7||[]);
}
function drawActivityWeek(days){
  const canvas=document.getElementById("activityWeekChart");
  if(!canvas)return;
  const {ctx,w,h}=canvasSetup("activityWeekChart");
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle=getCss("--line");ctx.beginPath();ctx.moveTo(42,15);ctx.lineTo(42,h-35);ctx.lineTo(w-10,h-35);ctx.stroke();
  if(!days.length||!days.some(d=>d.totalSeconds>0)){
    ctx.fillStyle=getCss("--muted");ctx.textAlign="center";ctx.font="700 13px system-ui";ctx.fillText("Activity history will appear here",w/2,h/2);return;
  }
  const max=Math.max(600,...days.map(d=>d.totalSeconds))*1.15,slot=(w-58)/days.length,bw=Math.min(24,slot*.27);
  days.forEach((d,i)=>{
    const x=48+i*slot+slot/2,totalH=(h-60)*d.totalSeconds/max,prodH=(h-60)*d.productiveSeconds/max;
    ctx.fillStyle=getCss("--purple");roundRect(ctx,x-bw-2,h-35-totalH,bw,totalH,6);ctx.fill();
    ctx.fillStyle=getCss("--green");roundRect(ctx,x+2,h-35-prodH,bw,prodH,6);ctx.fill();
    ctx.fillStyle=getCss("--muted");ctx.textAlign="center";ctx.font="10px system-ui";ctx.fillText(d.label,x,h-15);
  });
}
async function updateActivityCategory(domain,category){
  try{
    const response=await activityRequest("SET_CATEGORY",{domain,category});
    extensionActivity=response.activity;extensionConnected=true;renderActivity();showToast(`${domain} marked as ${category}`);
  }catch(e){showToast("Could not update website category")}
}
async function toggleActivityTracking(){
  if(!extensionActivity)return requestActivity(true);
  try{
    const response=await activityRequest("SET_TRACKING",{enabled:!extensionActivity.settings.enabled});
    extensionActivity=response.activity;renderActivity();showToast(extensionActivity.settings.enabled?"Automatic tracking resumed":"Automatic tracking paused");
  }catch(e){showToast("Tracker did not respond")}
}
async function updateActivityIdle(seconds){
  try{
    const response=await activityRequest("SET_IDLE_SECONDS",{seconds:Number(seconds)});
    extensionActivity=response.activity;renderActivity();showToast("Idle cutoff updated");
  }catch(e){showToast("Could not update idle cutoff")}
}
async function exportDigitalActivity(){
  try{
    const response=await activityRequest("EXPORT_DATA",{});
    download(`ppp-digital-activity-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(response.exportData,null,2),"application/json");
  }catch(e){showToast("Extension is not connected")}
}
function showActivityInstallGuide(){
  alert(`PPP Activity Tracker installation

1. Download and extract the Chrome extension ZIP.
2. Open chrome://extensions in Chrome.
3. Turn on Developer mode.
4. Select Load unpacked.
5. Choose the extracted PPP_Activity_Tracker folder.
6. Return to this PPP website and refresh it.

Chrome must be running, but this PPP page may stay closed. All tracked data remains local.`);
}
window.addEventListener("message",event=>{
  if(event.source!==window||!event.data||event.data.source!==PPP_ACTIVITY_EXTENSION_SOURCE)return;
  const msg=event.data;
  if(msg.type==="READY"){
    extensionConnected=true;
    requestActivity(false);
    return;
  }
  if(msg.type==="DATA_CHANGED"){
    if(document.getElementById("activity")?.classList.contains("active"))requestActivity(false);
    return;
  }
  if(msg.type==="RESPONSE"&&msg.requestId){
    const pending=activityPending.get(msg.requestId);
    if(!pending)return;
    activityPending.delete(msg.requestId);
    if(msg.ok)pending.resolve(msg.payload||{});
    else pending.reject(new Error(msg.error||"Extension request failed"));
  }
});

