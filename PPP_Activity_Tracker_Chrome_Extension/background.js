const DATA_KEY="pppActivityDataV1";
const SETTINGS_KEY="pppActivitySettingsV1";
const RUNTIME_KEY="pppActivityRuntimeV1";
const CHECKPOINT_ALARM="ppp-activity-checkpoint";
const MAX_CHECKPOINT_GAP_SECONDS=95;
const PPP_URL="https://pratikmondal6.github.io/Pratik_Progress_Plan-PPP-/";

const DEFAULT_SETTINGS={
  enabled:true,
  idleSeconds:60,
  categories:{
    "pratikmondal6.github.io":"productive",
    "chatgpt.com":"study",
    "github.com":"study",
    "stackoverflow.com":"study",
    "developer.mozilla.org":"study",
    "wikipedia.org":"study",
    "coursera.org":"study",
    "udemy.com":"study",
    "duolingo.com":"study",
    "dw.com":"study",
    "deutsch.info":"study",
    "python.org":"study",
    "docs.google.com":"productive",
    "drive.google.com":"productive",
    "calendar.google.com":"productive",
    "notion.so":"productive",
    "overleaf.com":"productive",
    "office.com":"productive",
    "microsoft.com":"productive",
    "mail.google.com":"communication",
    "outlook.live.com":"communication",
    "teams.microsoft.com":"communication",
    "web.whatsapp.com":"communication",
    "discord.com":"communication",
    "slack.com":"communication",
    "instagram.com":"social",
    "facebook.com":"social",
    "x.com":"social",
    "twitter.com":"social",
    "reddit.com":"social",
    "linkedin.com":"social",
    "tiktok.com":"social",
    "youtube.com":"entertainment",
    "netflix.com":"entertainment",
    "primevideo.com":"entertainment",
    "twitch.tv":"entertainment",
    "spotify.com":"entertainment"
  },
  ignoredDomains:[]
};

let operationQueue=Promise.resolve();
function enqueue(task){
  const result=operationQueue.then(task);
  operationQueue=result.catch(error=>console.error("PPP Activity Tracker:",error));
  return result;
}
function enqueueEvent(task){enqueue(task).catch(()=>{})}
function dateKey(date=new Date()){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function domainFromUrl(raw){
  try{
    const url=new URL(raw||"");
    if(url.protocol!=="http:"&&url.protocol!=="https:")return null;
    return url.hostname.toLowerCase().replace(/^www\./,"");
  }catch{return null}
}
function nextLocalMidnight(ms){
  const d=new Date(ms);
  return new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,0,0,0,0).getTime();
}
async function getSettings(){
  const result=await chrome.storage.local.get(SETTINGS_KEY);
  return {...DEFAULT_SETTINGS,...(result[SETTINGS_KEY]||{}),categories:{...DEFAULT_SETTINGS.categories,...(result[SETTINGS_KEY]?.categories||{})}};
}
async function getData(){
  const result=await chrome.storage.local.get(DATA_KEY);
  return result[DATA_KEY]||{days:{}};
}
async function getRuntime(){
  const result=await chrome.storage.local.get(RUNTIME_KEY);
  return result[RUNTIME_KEY]||{active:false,domain:null,lastCheckpoint:null,tabId:null,windowId:null};
}
async function saveRuntime(runtime){await chrome.storage.local.set({[RUNTIME_KEY]:runtime})}
async function addInterval(data,domain,startMs,endMs){
  let cursor=startMs;
  while(cursor<endMs){
    const boundary=Math.min(endMs,nextLocalMidnight(cursor));
    const key=dateKey(new Date(cursor));
    const seconds=Math.max(0,(boundary-cursor)/1000);
    data.days[key]??={domains:{}};
    data.days[key].domains[domain]=(data.days[key].domains[domain]||0)+seconds;
    cursor=boundary;
  }
}
async function commitRuntime(runtime,now=Date.now()){
  if(!runtime.active||!runtime.domain||!runtime.lastCheckpoint)return runtime;
  const rawSeconds=Math.max(0,(now-runtime.lastCheckpoint)/1000);
  const seconds=Math.min(rawSeconds,MAX_CHECKPOINT_GAP_SECONDS);
  if(seconds>=0.5){
    const data=await getData();
    await addInterval(data,runtime.domain,now-seconds*1000,now);
    await chrome.storage.local.set({[DATA_KEY]:data});
  }
  runtime.lastCheckpoint=now;
  return runtime;
}
async function detectCurrentContext(settings){
  if(!settings.enabled)return {active:false,domain:null,tabId:null,windowId:null};
  const idleState=await chrome.idle.queryState(settings.idleSeconds);
  if(idleState!=="active")return {active:false,domain:null,tabId:null,windowId:null};
  let win;
  try{win=await chrome.windows.getLastFocused()}catch{return {active:false,domain:null,tabId:null,windowId:null}}
  if(!win||!win.focused||win.id===chrome.windows.WINDOW_ID_NONE)return {active:false,domain:null,tabId:null,windowId:null};
  const tabs=await chrome.tabs.query({active:true,windowId:win.id});
  const tab=tabs[0],domain=domainFromUrl(tab?.url);
  if(!domain||settings.ignoredDomains.includes(domain))return {active:false,domain:null,tabId:tab?.id||null,windowId:win.id};
  return {active:true,domain,tabId:tab.id,windowId:win.id};
}
async function reconcile(){
  const now=Date.now(),settings=await getSettings();
  let runtime=await getRuntime();
  runtime=await commitRuntime(runtime,now);
  const context=await detectCurrentContext(settings);
  runtime={...context,lastCheckpoint:context.active?now:null};
  await saveRuntime(runtime);
  await updateBadge();
  return runtime;
}
function categoryFor(domain,settings){
  let candidate=domain;
  while(candidate){
    if(settings.categories[candidate])return settings.categories[candidate];
    const dot=candidate.indexOf(".");
    if(dot<0)break;
    candidate=candidate.slice(dot+1);
  }
  return "neutral";
}
function daySummary(key,domains,settings){
  const categorySeconds={study:0,productive:0,communication:0,social:0,entertainment:0,neutral:0};
  const domainRows=Object.entries(domains||{}).map(([domain,seconds])=>{
    const category=categoryFor(domain,settings);
    categorySeconds[category]=(categorySeconds[category]||0)+seconds;
    return {domain,seconds:Math.round(seconds),category};
  }).sort((a,b)=>b.seconds-a.seconds);
  const totalSeconds=Math.round(domainRows.reduce((sum,row)=>sum+row.seconds,0));
  const productiveSeconds=Math.round((categorySeconds.study||0)+(categorySeconds.productive||0));
  const distractingSeconds=Math.round((categorySeconds.social||0)+(categorySeconds.entertainment||0));
  const intentional=productiveSeconds+distractingSeconds;
  return {
    date:key,totalSeconds,productiveSeconds,distractingSeconds,
    focusRatio:intentional?Math.round(productiveSeconds/intentional*100):0,
    domainCount:domainRows.length,
    categories:Object.fromEntries(Object.entries(categorySeconds).map(([k,v])=>[k,Math.round(v)])),
    topDomains:domainRows.slice(0,15).map(row=>({...row,share:totalSeconds?Math.round(row.seconds/totalSeconds*100):0}))
  };
}
function lastDateKeys(count){
  const result=[],now=new Date();
  for(let i=count-1;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i);
    result.push(dateKey(d));
  }
  return result;
}
async function buildActivity(rangeDays=30){
  const [data,settings,runtime]=await Promise.all([getData(),getSettings(),getRuntime()]);
  const todayKey=dateKey(),today=daySummary(todayKey,data.days[todayKey]?.domains||{},settings);
  const keys=lastDateKeys(Math.max(7,Math.min(365,Number(rangeDays)||30)));
  const history=keys.map(key=>daySummary(key,data.days[key]?.domains||{},settings));
  return {
    version:"1.0.0",
    generatedAt:new Date().toISOString(),
    today,
    last7:history.slice(-7).map(day=>({...day,label:new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short"})})),
    history,
    live:{active:runtime.active,activeDomain:runtime.domain,lastCheckpoint:runtime.lastCheckpoint},
    settings:{enabled:settings.enabled,idleSeconds:settings.idleSeconds}
  };
}
async function updateBadge(){
  const data=await getData(),today=data.days[dateKey()]?.domains||{};
  const seconds=Object.values(today).reduce((a,b)=>a+Number(b||0),0);
  const hours=seconds/3600;
  const text=hours>=10?`${Math.round(hours)}`:hours>=1?`${hours.toFixed(1)}`:seconds>=60?`${Math.floor(seconds/60)}m`:"";
  await chrome.action.setBadgeBackgroundColor({color:"#2563eb"});
  await chrome.action.setBadgeText({text});
}
async function ensureAlarm(){
  const existing=await chrome.alarms.get(CHECKPOINT_ALARM);
  if(!existing)await chrome.alarms.create(CHECKPOINT_ALARM,{periodInMinutes:1});
}
async function initialize(){
  const settings=await getSettings();
  await chrome.storage.local.set({[SETTINGS_KEY]:settings});
  chrome.idle.setDetectionInterval(settings.idleSeconds);
  await ensureAlarm();
  await reconcile();
}

chrome.runtime.onInstalled.addListener(()=>enqueueEvent(initialize));
chrome.runtime.onStartup.addListener(()=>enqueueEvent(initialize));
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name===CHECKPOINT_ALARM)enqueueEvent(reconcile)});
chrome.tabs.onActivated.addListener(()=>enqueueEvent(reconcile));
chrome.tabs.onUpdated.addListener((_tabId,changeInfo)=>{if(changeInfo.url||changeInfo.status==="complete")enqueueEvent(reconcile)});
chrome.tabs.onRemoved.addListener(()=>enqueueEvent(reconcile));
chrome.windows.onFocusChanged.addListener(()=>enqueueEvent(reconcile));
chrome.idle.onStateChanged.addListener(()=>enqueueEvent(reconcile));

chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  enqueue(async()=>{
    const type=message?.type;
    if(type==="GET_ACTIVITY"){
      await reconcile();
      return {activity:await buildActivity(message.rangeDays)};
    }
    if(type==="SET_TRACKING"){
      const settings=await getSettings();
      settings.enabled=Boolean(message.enabled);
      await chrome.storage.local.set({[SETTINGS_KEY]:settings});
      await reconcile();
      return {activity:await buildActivity(30)};
    }
    if(type==="SET_IDLE_SECONDS"){
      const settings=await getSettings();
      settings.idleSeconds=Math.max(15,Math.min(1800,Number(message.seconds)||60));
      chrome.idle.setDetectionInterval(settings.idleSeconds);
      await chrome.storage.local.set({[SETTINGS_KEY]:settings});
      await reconcile();
      return {activity:await buildActivity(30)};
    }
    if(type==="SET_CATEGORY"){
      const domain=String(message.domain||"").toLowerCase().replace(/^www\./,"");
      const allowed=["study","productive","communication","social","entertainment","neutral"];
      if(!domain||!allowed.includes(message.category))throw new Error("Invalid category update");
      const settings=await getSettings();
      settings.categories[domain]=message.category;
      await chrome.storage.local.set({[SETTINGS_KEY]:settings});
      return {activity:await buildActivity(30)};
    }
    if(type==="RESET_TODAY"){
      await reconcile();
      const data=await getData();
      delete data.days[dateKey()];
      await chrome.storage.local.set({[DATA_KEY]:data});
      await updateBadge();
      return {activity:await buildActivity(30)};
    }
    if(type==="EXPORT_DATA"){
      await reconcile();
      const [data,settings]=await Promise.all([getData(),getSettings()]);
      return {exportData:{exportedAt:new Date().toISOString(),version:"1.0.0",data,settings}};
    }
    if(type==="OPEN_PPP"){
      await chrome.tabs.create({url:PPP_URL});
      return {opened:true};
    }
    throw new Error("Unknown request");
  }).then(payload=>sendResponse({ok:true,...payload})).catch(error=>sendResponse({ok:false,error:error.message}));
  return true;
});

ensureAlarm().then(()=>enqueueEvent(reconcile)).catch(error=>console.error("PPP Activity Tracker:",error));
