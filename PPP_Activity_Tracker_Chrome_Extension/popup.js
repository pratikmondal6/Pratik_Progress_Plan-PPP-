function fmt(seconds){
  seconds=Math.max(0,Math.round(seconds||0));
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60);
  return h?`${h}h ${String(m).padStart(2,"0")}m`:m?`${m}m`:`${seconds}s`;
}
let activity=null;
async function send(type,payload={}){
  const response=await chrome.runtime.sendMessage({type,...payload});
  if(!response?.ok)throw new Error(response?.error||"Request failed");
  return response;
}
function render(){
  if(!activity)return;
  const t=activity.today,enabled=activity.settings.enabled,domain=activity.live.activeDomain;
  document.getElementById("status").textContent=enabled?"ON":"PAUSED";
  document.getElementById("status").style.color=enabled?"#74e9a4":"#ffc861";
  document.getElementById("status").style.background=enabled?"rgba(34,197,94,.13)":"rgba(255,191,63,.13)";
  document.getElementById("liveDomain").textContent=!enabled?"Tracking paused":domain||"No active website";
  document.getElementById("pulse").style.background=enabled&&domain?"#22c55e":"#64748b";
  document.getElementById("todayTotal").textContent=fmt(t.totalSeconds);
  document.getElementById("productive").textContent=fmt(t.productiveSeconds);
  document.getElementById("distracting").textContent=fmt(t.distractingSeconds);
  document.getElementById("ratio").textContent=`${t.focusRatio}%`;
  document.getElementById("toggleBtn").textContent=enabled?"Pause tracking":"Resume tracking";
}
async function refresh(){
  try{
    const response=await send("GET_ACTIVITY",{rangeDays:7});
    activity=response.activity;render();
  }catch(error){
    document.getElementById("liveDomain").textContent="Tracker error";
  }
}
document.getElementById("toggleBtn").onclick=async()=>{
  const btn=document.getElementById("toggleBtn");btn.disabled=true;
  try{const response=await send("SET_TRACKING",{enabled:!activity.settings.enabled});activity=response.activity;render()}finally{btn.disabled=false}
};
document.getElementById("openBtn").onclick=()=>send("OPEN_PPP");
document.getElementById("resetBtn").onclick=async()=>{
  if(!confirm("Delete all website timing for today?"))return;
  const response=await send("RESET_TODAY");activity=response.activity;render();
};
refresh();
setInterval(refresh,15000);