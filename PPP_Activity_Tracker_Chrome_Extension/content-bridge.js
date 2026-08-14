const PAGE_SOURCE="PPP_PROGRESS_PLAN_WEB_V1";
const EXTENSION_SOURCE="PPP_ACTIVITY_EXTENSION_V1";

function post(type,extra={}){
  window.postMessage({source:EXTENSION_SOURCE,type,...extra},"*");
}
post("READY",{version:chrome.runtime.getManifest().version});

window.addEventListener("message",event=>{
  if(event.source!==window||!event.data||event.data.source!==PAGE_SOURCE)return;
  const {requestId,action,payload={}}=event.data;
  const message={type:action,...payload};
  chrome.runtime.sendMessage(message).then(response=>{
    if(!response?.ok)throw new Error(response?.error||"Extension request failed");
    const {ok,...clean}=response;
    post("RESPONSE",{requestId,ok:true,payload:clean});
  }).catch(error=>post("RESPONSE",{requestId,ok:false,error:error.message}));
});

let debounceTimer=null;
chrome.storage.onChanged.addListener((_changes,area)=>{
  if(area!=="local")return;
  clearTimeout(debounceTimer);
  debounceTimer=setTimeout(()=>post("DATA_CHANGED"),500);
});
