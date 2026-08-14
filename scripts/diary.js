const DIARY_KEY="pppDiary_v1";
const DIARY_RETENTION_MS=7*24*60*60*1000;
const DIARY_AI_REVIEW_KEY="pppDiaryGeminiReviews_v1";
const CONSISTENCY_LOG_KEY="pppConsistencyCheckins_v1";
const DIARY_TYPES={
  thought:{label:"Thought",icon:"💭"},
  task:{label:"Task or plan",icon:"✅"},
  summary:{label:"Daily summary",icon:"📖"},
  win:{label:"Win",icon:"🏆"},
  note:{label:"Quick note",icon:"📝"}
};
let diaryEntries=[];
let pendingDiaryImage=null;
let diaryReviewMode="local";

function normalizeDiaryImage(image){
  if(!image||typeof image!=="object"||!/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(image.dataUrl||""))return null;
  return {dataUrl:String(image.dataUrl),name:String(image.name||"Diary image").slice(0,180),type:String(image.type||"image/jpeg"),width:Number(image.width)||0,height:Number(image.height)||0};
}

function loadDiaryEntries(){
  try{
    const saved=JSON.parse(localStorage.getItem(DIARY_KEY));
    diaryEntries=Array.isArray(saved)?saved.filter(entry=>entry&&entry.id&&entry.createdAt&&entry.text!=null).map(entry=>({
      id:String(entry.id),
      title:String(entry.title||""),
      text:String(entry.text),
      type:DIARY_TYPES[entry.type]?entry.type:"note",
      createdAt:Number(entry.createdAt),
      autoDelete:entry.autoDelete===true,
      excludeAI:entry.excludeAI===true,
      image:normalizeDiaryImage(entry.image),
      analysis:normalizeDiaryAnalysis(entry.analysis)
    })):[];
  }catch(error){
    diaryEntries=[];
  }
  removeExpiredDiaryEntries();
}

function saveDiaryEntries(){
  try{localStorage.setItem(DIARY_KEY,JSON.stringify(diaryEntries));return true}catch(error){showToast("Diary storage is full. Delete an older image entry and try again.");return false}
}

function removeExpiredDiaryEntries(){
  const now=Date.now(),before=diaryEntries.length;
  diaryEntries=diaryEntries.filter(entry=>!entry.autoDelete||Number(entry.createdAt)+DIARY_RETENTION_MS>now);
  if(diaryEntries.length!==before)saveDiaryEntries();
}

function diaryId(){
  return globalThis.crypto?.randomUUID?.()||`diary-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function diaryDataUrlBytes(dataUrl){return Math.round((String(dataUrl).length-String(dataUrl).indexOf(",")-1)*.75)}
function diaryFileSize(bytes){return bytes<1024?`${bytes} B`:bytes<1048576?`${(bytes/1024).toFixed(0)} KB`:`${(bytes/1048576).toFixed(1)} MB`}
function clearPendingDiaryImage(){
  pendingDiaryImage=null;
  const input=document.getElementById("diaryImageInput"),preview=document.getElementById("diaryImagePreview"),image=document.getElementById("diaryImagePreviewImg");
  if(input)input.value="";if(preview)preview.classList.add("hidden");if(image)image.removeAttribute("src");
}
function showPendingDiaryImage(){
  const preview=document.getElementById("diaryImagePreview");if(!preview||!pendingDiaryImage)return;
  document.getElementById("diaryImagePreviewImg").src=pendingDiaryImage.dataUrl;
  setText("diaryImagePreviewName",pendingDiaryImage.name);setText("diaryImagePreviewSize",`${pendingDiaryImage.width} × ${pendingDiaryImage.height} · ${diaryFileSize(diaryDataUrlBytes(pendingDiaryImage.dataUrl))}`);preview.classList.remove("hidden");
}
function readDiaryImageFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
function loadDiaryImage(dataUrl){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=dataUrl})}
async function selectDiaryImage(file){
  if(!file)return;if(!/^image\/(?:jpeg|png|webp|gif)$/i.test(file.type)){showToast("Choose a JPG, PNG, WebP, or GIF image");return}if(file.size>12*1024*1024){showToast("Choose an image smaller than 12 MB");return}
  try{
    const source=await readDiaryImageFile(file),image=await loadDiaryImage(source),scale=Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight)),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const context=canvas.getContext("2d");context.fillStyle="#ffffff";context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
    let dataUrl=canvas.toDataURL("image/jpeg",.76);if(diaryDataUrlBytes(dataUrl)>700000)dataUrl=canvas.toDataURL("image/jpeg",.52);
    if(diaryDataUrlBytes(dataUrl)>900000){showToast("This image is still too large after optimization");return}
    pendingDiaryImage={dataUrl,name:file.name,type:"image/jpeg",width,height};showPendingDiaryImage();showToast("Image attached");
  }catch(error){showToast("Could not read that image")}
}

function normalizeDiaryAnalysis(analysis){
  if(!analysis||typeof analysis!=="object")return null;
  return {
    sentiment:["positive","negative","neutral"].includes(analysis.sentiment)?analysis.sentiment:"neutral",
    summary:String(analysis.summary||"No planner-relevant information detected."),
    actions:Array.isArray(analysis.actions)?analysis.actions.map(action=>({field:String(action.field||""),value:action.value,label:String(action.label||"")})).filter(action=>action.field):[],
    synced:Array.isArray(analysis.synced)?analysis.synced.map(String):[],
    ai:analysis.ai===true,
    insights:Array.isArray(analysis.insights)?analysis.insights.map(String).slice(0,4):[],
    suggestions:Array.isArray(analysis.suggestions)?analysis.suggestions.map(String).slice(0,4):[],
    analyzedAt:Number(analysis.analyzedAt)||Date.now()
  };
}

function diaryDateParts(timestamp){
  const date=new Date(timestamp);
  return {key:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`,index:date.getDate()-1};
}

function syncDiaryAnalysis(entry){
  if(!entry.analysis||entry.analysis.synced.length||!entry.analysis.actions.length)return;
  const {key,index}=diaryDateParts(entry.createdAt),day=ensureMonth(key)[index],synced=[];
  entry.analysis.actions.forEach(action=>{
    if(GOAL_KEYS.includes(action.field)){
      day[action.field]=Math.max(Number(day[action.field])||0,Number(action.value)||0);
      synced.push(action.label);
    }else if(action.field==="notes"){
      if(!day.notes.includes(action.value))day.notes=[day.notes,action.value].filter(Boolean).join("\n");
      synced.push(action.label);
    }else if(action.field==="commitment"){
      const result=addCommitment({...action.value,sourceEntryId:entry.id});
      synced.push(`${action.label}${result.created?"":" (already scheduled)"}`);
    }else if(action.field==="schedulePreference"){
      const result=upsertDayPreference(action.value);synced.push(`${action.label}${result.created?"":" (already applied)"}`);
    }
  });
  entry.analysis.synced=synced;
  save();
}

function persistDiaryEntry(analysis){
  const text=document.getElementById("diaryText").value.trim();
  const title=document.getElementById("diaryTitle").value.trim();
  const type=document.getElementById("diaryType").value;
  const autoDelete=document.getElementById("diaryAutoDelete").checked;
  const excludeAI=document.getElementById("diaryExcludeAI").checked;
  if(!text&&!pendingDiaryImage){showToast("Write something or attach an image before saving");document.getElementById("diaryText").focus();return}
  const createdAt=Date.now();
  const entry={id:diaryId(),title,text,type:DIARY_TYPES[type]?type:"note",createdAt,autoDelete,excludeAI,image:pendingDiaryImage,analysis:analysis||{sentiment:"neutral",summary:"Saved without Gemini analysis.",actions:[],synced:[],insights:[],suggestions:[],ai:false,analyzedAt:createdAt}};
  syncDiaryAnalysis(entry);
  diaryEntries.unshift(entry);
  if(!saveDiaryEntries()){diaryEntries.shift();return}
  document.getElementById("diaryTitle").value="";
  document.getElementById("diaryText").value="";
  document.getElementById("diaryAutoDelete").checked=false;
  document.getElementById("diaryExcludeAI").checked=false;
  clearPendingDiaryImage();
  updateDiaryCharacterCount();
  renderDiary();
  showToast(entry.analysis.synced.length?`Diary saved · ${entry.analysis.synced.length} planner update${entry.analysis.synced.length===1?"":"s"}`:"Diary entry saved");
}

function validatedGeminiEntryAnalysis(raw){
  const analysis={sentiment:["positive","negative","neutral"].includes(raw?.sentiment)?raw.sentiment:"neutral",summary:String(raw?.summary||"Gemini completed the analysis."),actions:[],synced:[],insights:Array.isArray(raw?.insights)?raw.insights.map(String).slice(0,4):[],suggestions:Array.isArray(raw?.suggestions)?raw.suggestions.map(String).slice(0,4):[],ai:true,analyzedAt:Date.now()};
  (Array.isArray(raw?.actions)?raw.actions:[]).forEach(action=>{const field=String(action?.field||""),label=String(action?.label||"Planner update").slice(0,220),value=action?.value;if(GOAL_KEYS.includes(field)){const minutes=Math.round(Number(value));if(Number.isFinite(minutes)&&minutes>=0&&minutes<=1440)analysis.actions.push({field,value:minutes,label})}else if(field==="notes"){const note=String(value||"").trim().slice(0,500);if(note)analysis.actions.push({field,value:note,label})}else if(field==="commitment"&&value&&/^20\d{2}-\d{2}-\d{2}$/.test(String(value.date||""))){const start=Number(value.start),end=Number(value.end);if(Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start&&end<=2880)analysis.actions.push({field,value:{date:String(value.date),start,end,title:String(value.title||"Fixed commitment").slice(0,100)},label})}else if(field==="schedulePreference"&&value&&/^20\d{2}-\d{2}-\d{2}$/.test(String(value.date||""))){const preference={date:String(value.date)};if(Number.isFinite(Number(value.wake)))preference.wake=clamp(Number(value.wake),0,1439);if(Number.isFinite(Number(value.sleep)))preference.sleep=clamp(Number(value.sleep),0,1439);if(preference.wake!=null||preference.sleep!=null)analysis.actions.push({field,value:preference,label})}});return analysis
}
async function addDiaryEntry(){
  const text=document.getElementById("diaryText").value.trim(),analyze=document.getElementById("diaryAnalyzeGemini").checked;if(!text&&!pendingDiaryImage){showToast("Write something or attach an image before saving");document.getElementById("diaryText").focus();return}if(!text||!analyze){persistDiaryEntry(null);return}const config=sharedBookingConfig();if(!config.url||!config.adminKey){showToast("Connect Gemini through the Apps Script service in Settings first");return}
  const button=document.getElementById("saveDiaryEntry"),fields=["diaryTitle","diaryText","diaryType","diaryAnalyzeGemini"].map(id=>document.getElementById(id));button.disabled=true;button.textContent="Gemini is analyzing…";fields.forEach(field=>field.disabled=true);
  try{const goals=JSON.stringify(GOALS.map(goal=>({key:goal.key,label:goal.label,targetMinutes:goalTarget(goal.key)}))),data=await bookingPost("analyzeEntry",{title:document.getElementById("diaryTitle").value.trim(),text,type:document.getElementById("diaryType").value,createdAt:new Date().toISOString(),goals});persistDiaryEntry(validatedGeminiEntryAnalysis(data.analysis))}catch(error){showToast(error?.message||"Gemini analysis failed; entry was not saved")}finally{button.disabled=false;button.textContent="Save Entry";fields.forEach(field=>field.disabled=false)}
}

function deleteDiaryEntry(id){
  if(!confirm("Delete this diary entry?"))return;
  diaryEntries=diaryEntries.filter(entry=>entry.id!==id);
  saveDiaryEntries();
  renderDiary();
  showToast("Diary entry deleted");
}

function clearDiaryEntries(){
  if(!diaryEntries.length){showToast("Your diary is already empty");return}
  if(!confirm("Delete every diary entry? This cannot be undone."))return;
  diaryEntries=[];
  saveDiaryEntries();
  renderDiary();
  showToast("All diary entries deleted");
}

function diaryTimeRemaining(createdAt){
  const remaining=createdAt+DIARY_RETENTION_MS-Date.now();
  const hours=Math.max(0,Math.ceil(remaining/3600000));
  if(hours<24)return `${hours}h left`;
  const days=Math.ceil(hours/24);
  return `${days} day${days===1?"":"s"} left`;
}

function diaryDate(createdAt){
  return new Date(createdAt).toLocaleString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
}

function updateDiaryCurrentDateTime(){
  const display=document.getElementById("diaryCurrentDateTime");
  if(display)display.textContent=diaryDate(Date.now());
}

function diaryWordTotal(entries){
  return entries.reduce((total,entry)=>total+entry.text.trim().split(/\s+/).filter(Boolean).length,0);
}

function diaryImageMarkup(entry){
  const image=normalizeDiaryImage(entry.image);if(!image)return "";
  return `<figure class="diary-entry-image"><img src="${image.dataUrl}" alt="${escapeHtml(image.name)}" loading="lazy"><figcaption>🖼 ${escapeHtml(image.name)}</figcaption></figure>`;
}

function uniqueDiaryItems(items,limit=5){
  const seen=new Set();return items.map(item=>String(item).replace(/\s+/g," ").trim()).filter(item=>{const key=item.toLowerCase();if(!item||seen.has(key))return false;seen.add(key);return true}).slice(0,limit);
}
function buildDiaryDailyReview(){
  const today=localDateKey(new Date()),entries=diaryEntries.filter(entry=>localDateKey(new Date(entry.createdAt))===today),review={entries,achievements:[],completed:[],incomplete:[],plans:[],positives:[],negatives:[],improvements:[]};
  entries.forEach(entry=>{
    const analysis=entry.analysis;if(!analysis?.ai)return;const summary=String(analysis.summary||"").slice(0,220),insights=Array.isArray(analysis.insights)?analysis.insights:[],suggestions=Array.isArray(analysis.suggestions)?analysis.suggestions:[],labels=(analysis.actions||[]).map(action=>action.label).filter(Boolean);
    if(analysis.sentiment==="positive"){review.completed.push(summary);review.positives.push(...insights);if(entry.type==="win"||labels.length)review.achievements.push(...(labels.length?labels:[summary]))}else if(analysis.sentiment==="negative"){review.incomplete.push(summary);review.negatives.push(...insights)}else review.completed.push(...labels);
    review.plans.push(...suggestions);review.improvements.push(...suggestions);
  });
  Object.keys(review).filter(key=>Array.isArray(review[key])&&key!=="entries").forEach(key=>review[key]=uniqueDiaryItems(review[key]));
  if(!review.improvements.length)review.improvements.push("No Gemini next step is available yet. Analyze a text entry to generate coaching guidance.");
  review.improvements=uniqueDiaryItems(review.improvements,4);
  const positiveCount=review.completed.length+review.achievements.length+review.positives.length,negativeCount=review.incomplete.length+review.negatives.length;
  review.score=clamp(Math.round(55+positiveCount*7-negativeCount*8),10,95);
  review.outcome=!entries.length?"No review yet":!entries.some(entry=>entry.analysis?.ai)?"Waiting for Gemini outcomes":review.score>=75?"Strong day":review.score>=55?"Mixed but moving forward":"Recovery and reset needed";
  return review;
}
function diaryReviewList(title,icon,items,emptyText,kind=""){
  return `<div class="diary-review-group ${kind}"><div class="diary-review-group-title"><span>${icon}</span><strong>${title}</strong><em>${items.length}</em></div>${items.length?`<ul>${items.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul>`:`<p>${emptyText}</p>`}</div>`;
}
function loadConsistencyCheckins(){try{const value=JSON.parse(localStorage.getItem(CONSISTENCY_LOG_KEY)||"[]");return Array.isArray(value)?value:[]}catch(e){return []}}
function renderConsistencyWeek(){
  const host=document.getElementById("consistencyWeekSummary");if(!host)return;const days=rollingData(7),logged=days.filter(day=>day.logged),missions=logged.filter(day=>day.mission),completion=logged.length?avg(logged.map(day=>day.completion)):0,sleep=days.filter(day=>day.sleepHours!=null),sleepAverage=sleep.length?avg(sleep.map(day=>day.sleepHours)):null,today=localDateKey(new Date()),commitments=loadCommitments().filter(item=>item.date>=days[0]?.dateKey&&item.date<=today),recentDiary=diaryEntries.filter(entry=>entry.createdAt>=Date.now()-7*86400000),review={completed:[],negative:[],plans:[]};
  recentDiary.forEach(entry=>{const analysis=entry.analysis;if(!analysis?.ai)return;if(analysis.sentiment==="positive")review.completed.push(analysis.summary,...(analysis.insights||[]));if(analysis.sentiment==="negative")review.negative.push(analysis.summary,...(analysis.insights||[]));review.plans.push(...(analysis.suggestions||[]))});
  const scores=habitScores(days).sort((a,b)=>a[1]-b[1]),weak=scores[0],strong=scores[scores.length-1],missed=Math.max(0,logged.length-missions.length),guidance=[];
  if(!logged.length)guidance.push("Start with one active goal for five minutes today. Recording a small action is the first coaching signal.");else if(missed>=2)guidance.push("The current plan is too difficult for this week. Protect one minimum habit and rebuild before increasing targets.");else guidance.push("Keep the same minimum for another week. Increase it only when starting feels reliable.");
  if(weak&&weak[1]<.5)guidance.push(`${weak[0]} needs a smaller starting action and a fixed cue.`);if(sleepAverage!=null&&sleepAverage<state.settings.shortBelow)guidance.push("Low sleep is reducing focus capacity; protect bedtime before adding more work.");guidance.push(...review.plans);if(review.negative.length)guidance.push(`Gemini diary friction: ${review.negative[0]}`);if(!recentDiary.some(entry=>entry.analysis?.ai))guidance.push("No recent Gemini diary outcomes are available. Save a text entry with Gemini analysis enabled.");
  host.innerHTML=`<div class="consistency-week"><div><strong>${Math.round(completion*100)}%</strong><span>7-day completion</span></div><div><strong>${missions.length}</strong><span>mission days</span></div><div><strong>${commitments.length}</strong><span>calendar commitments</span></div><div><strong>${sleepAverage==null?"—":sleepAverage.toFixed(1)+"h"}</strong><span>average sleep</span></div></div><div class="diary-review-grid">${diaryReviewList("Strongest active habit","✓",strong?[`${strong[0]} · ${Math.round(strong[1]*100)}%`]:[],"No habit data yet.","positive")}${diaryReviewList("Needs a smaller step","→",weak?[`${weak[0]} · ${Math.round(weak[1]*100)}%`]:[],"No habit data yet.")}${diaryReviewList("Diary progress","🏆",uniqueDiaryItems(review.completed,3),"No completed action mentioned.","positive")}${diaryReviewList("Diary friction","!",uniqueDiaryItems(review.negative,3),"No negative pattern mentioned.","negative")}${diaryReviewList("Upcoming intentions","📌",uniqueDiaryItems(review.plans,3),"No upcoming plan mentioned.")}</div><div class="diary-tomorrow"><div class="diary-tomorrow-head"><span>↻</span><div><strong>Automatic recovery plan</strong><p>Small adjustments from your combined data</p></div></div><ol>${uniqueDiaryItems(guidance,5).map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ol></div>`
}
function loadDiaryGeminiReviews(){try{return JSON.parse(localStorage.getItem(DIARY_AI_REVIEW_KEY)||"{}")||{}}catch(e){return {}}}
function diaryGeminiEntries(scope){const now=Date.now(),start=scope==="day"?new Date().setHours(0,0,0,0):scope==="week"?now-7*86400000:0;return diaryEntries.filter(entry=>entry.createdAt>=start&&!entry.excludeAI).slice().reverse()}
function renderGeminiReview(scope,analysis,count){
  const container=document.getElementById("diaryReviewContent"),list=(title,icon,items,kind="")=>diaryReviewList(title,icon,Array.isArray(items)?items:[],"Nothing confidently identified.",kind);
  container.innerHTML=`<div class="diary-outcome"><div><span class="diary-outcome-label">Gemini ${escapeHtml(scope)} review · ${count} entries</span><h4>${escapeHtml(analysis.overview||"Diary review")}</h4><p>${escapeHtml(analysis.summary||"")}</p></div></div><div class="diary-review-grid">${list("Goals","🎯",analysis.goals)}${list("Achievements","🏆",analysis.achievements,"positive")}${list("Lifestyle","🌿",analysis.lifestyle)}${list("Positive patterns","＋",analysis.positives,"positive")}${list("Negative effects","−",analysis.negatives,"negative")}${list("Problems / obstacles","!",analysis.obstacles,"negative")}${list("Habit and addiction patterns","🔁",analysis.habitPatterns)}${list("Triggers","⚡",analysis.triggers,"negative")}${list("Lessons and patterns","💡",analysis.patterns)}</div><div class="diary-tomorrow"><div class="diary-tomorrow-head"><span>🌅</span><div><strong>Supportive next steps</strong><p>Practical, non-judgmental actions based on your diary</p></div></div><ol>${(analysis.nextSteps||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ol></div>${analysis.supportNote?`<p class="diary-hint">${escapeHtml(analysis.supportNote)}</p>`:""}`;
}
async function requestGeminiDiaryReview(scope){
  const entries=diaryGeminiEntries(scope);if(!entries.length){showToast(`No diary entries found for this ${scope}`);return}const config=sharedBookingConfig();if(!config.url||!config.adminKey){showToast("Connect the Apps Script service in Settings first");return}
  if(!document.getElementById("geminiReviewConsent").checked){showToast("Confirm the Gemini privacy notice first");return}
  let text=entries.map(entry=>`[${diaryDate(entry.createdAt)}] ${entry.type}${entry.title?` — ${entry.title}`:""}\n${entry.text}`).join("\n\n"),truncated=false;if(text.length>50000){text=text.slice(-50000);truncated=true}
  const buttons=[...document.querySelectorAll("[data-gemini-review]")];buttons.forEach(button=>button.disabled=true);document.getElementById("diaryReviewContent").innerHTML='<div class="diary-review-empty"><span>✦</span><strong>Gemini is reviewing your diary…</strong><p>Looking for goals, achievements, positive and negative patterns, obstacles, and next steps.</p></div>';
  try{const data=await bookingPost("analyzeDiary",{scope,text});const reviews=loadDiaryGeminiReviews();reviews[scope]={analysis:data.analysis,count:entries.length,createdAt:Date.now(),truncated};reviews.latestScope=scope;localStorage.setItem(DIARY_AI_REVIEW_KEY,JSON.stringify(reviews));diaryReviewMode=scope;renderGeminiReview(scope,data.analysis,entries.length);showToast(`Gemini ${scope} review ready${truncated?" · latest history used":""}`)}catch(error){diaryReviewMode="local";renderDiaryDailyReview();showToast(error?.message||"Gemini review failed")}finally{buttons.forEach(button=>button.disabled=false)}
}
function renderDiaryDailyReview(){
  const container=document.getElementById("diaryReviewContent");if(!container)return;const review=buildDiaryDailyReview();
  if(!review.entries.length){container.innerHTML=`<div class="diary-review-empty"><span>☀️</span><strong>Your review will appear here</strong><p>Write about what happened, what you finished, what felt difficult, and what you want to do next.</p></div>`;return}
  container.innerHTML=`<div class="diary-outcome"><div class="diary-score" style="--review-score:${review.score*3.6}deg"><div><strong>${review.score}</strong><span>DAY SCORE</span></div></div><div><span class="diary-outcome-label">Overall outcome</span><h4>${escapeHtml(review.outcome)}</h4><p>${review.score>=75?"You created visible progress. Protect the behaviors that made it possible.":review.score>=55?"There was progress and friction. Tomorrow needs fewer priorities and clearer starting points.":"The useful outcome is clarity. Recover first, then restart with one achievable commitment."}</p></div></div><div class="diary-review-grid">${diaryReviewList("Achievements","🏆",review.achievements,"No explicit achievement identified yet.","positive")}${diaryReviewList("Completed","✓",review.completed,"No completed task was clearly mentioned.","positive")}${diaryReviewList("Incomplete / difficult","!",review.incomplete,"No incomplete task was clearly mentioned.","negative")}${diaryReviewList("Tasks and intentions","→",review.plans,"No future task was clearly mentioned.")}${diaryReviewList("Positive highlights","＋",review.positives,"Add what felt good or worked well.","positive")}${diaryReviewList("Negative highlights","−",review.negatives,"No strong negative signal identified.","negative")}</div><div class="diary-tomorrow"><div class="diary-tomorrow-head"><span>🌅</span><div><strong>Tomorrow’s improvement plan</strong><p>Small, specific actions based on today’s writing</p></div></div><ol>${review.improvements.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ol></div>`;
}

function renderDiary(){
  const container=document.getElementById("diaryEntries");
  if(!container)return;
  removeExpiredDiaryEntries();
  const query=document.getElementById("diarySearch").value.trim().toLowerCase();
  const filter=document.getElementById("diaryFilter").value;
  const visible=diaryEntries.filter(entry=>{
    const matchesType=filter==="all"||entry.type===filter;
    const matchesSearch=!query||`${entry.title||""} ${entry.text}`.toLowerCase().includes(query);
    return matchesType&&matchesSearch;
  });
  setText("diaryEntryCount",diaryEntries.length);
  setText("diaryWordCount",diaryWordTotal(diaryEntries).toLocaleString());
  const savedReviews=loadDiaryGeminiReviews(),savedReview=savedReviews[diaryReviewMode];if(diaryReviewMode!=="local"&&savedReview)renderGeminiReview(diaryReviewMode,savedReview.analysis,savedReview.count);else renderDiaryDailyReview();
  if(!visible.length){
    container.innerHTML=`<div class="box glass diary-empty"><div>📓</div><strong>${diaryEntries.length?"No matching entries":"Your diary is ready"}</strong><p>${diaryEntries.length?"Try another search or filter.":"Write your first thought, plan, task, or daily summary above."}</p></div>`;
    return;
  }
  container.innerHTML=visible.map(entry=>{
    const type=DIARY_TYPES[entry.type]||DIARY_TYPES.note;
    return `<article class="box glass diary-entry">
      <div class="diary-entry-head">
        <div><time>${escapeHtml(diaryDate(entry.createdAt))}</time><span class="diary-type">${type.icon} ${type.label}</span></div>
        <button class="diary-delete" data-diary-delete="${escapeHtml(entry.id)}" aria-label="Delete diary entry">Delete</button>
      </div>
      ${entry.title?`<h3>${escapeHtml(entry.title)}</h3>`:""}
      ${diaryImageMarkup(entry)}
      ${entry.text?`<p>${escapeHtml(entry.text).replace(/\n/g,"<br>")}</p>`:""}
      ${entry.analysis?`<div class="diary-analysis ${entry.analysis.sentiment}">
        <div class="diary-analysis-head"><strong>✦ ${entry.analysis.ai?"Gemini AI":"Smart diary"} analysis</strong><span>${escapeHtml(entry.analysis.sentiment)}</span></div>
        <p>${escapeHtml(entry.analysis.summary)}</p>
        ${entry.analysis.insights?.length?`<div class="diary-analysis-signals">${entry.analysis.insights.map(item=>`<span>${escapeHtml(item)}</span>`).join("")}</div>`:""}
        ${entry.analysis.suggestions?.length?`<p><strong>Next:</strong> ${escapeHtml(entry.analysis.suggestions.join(" · "))}</p>`:""}
        ${entry.analysis.actions.length?`<div class="diary-analysis-signals">${entry.analysis.actions.map(action=>`<span>${escapeHtml(action.label)}</span>`).join("")}</div>`:""}
        <div class="diary-sync-result">${entry.analysis.synced.length?`✓ Synced to ${escapeHtml(diaryDate(entry.createdAt).split(",")[0])}'s planner: ${escapeHtml(entry.analysis.synced.join(" · "))}`:"No planner fields changed."}</div>
      </div>`:""}
      <div class="diary-expiry">${entry.autoDelete?`⌛ Automatically deletes in ${escapeHtml(diaryTimeRemaining(entry.createdAt))}`:"📌 Kept until you delete it"}</div>
    </article>`;
  }).join("");
}

function updateDiaryCharacterCount(){
  const field=document.getElementById("diaryText"),counter=document.getElementById("diaryCharacterCount");
  if(field&&counter)counter.textContent=`${field.value.length.toLocaleString()} / 10,000`;
}

function initDiary(){
  loadDiaryEntries();
  const reviews=loadDiaryGeminiReviews();if(reviews.latestScope&&reviews[reviews.latestScope])diaryReviewMode=reviews.latestScope;
  updateDiaryCurrentDateTime();
  document.getElementById("saveDiaryEntry").onclick=addDiaryEntry;
  document.getElementById("clearDiaryEntries").onclick=clearDiaryEntries;
  document.getElementById("refreshConsistencyCoach").onclick=()=>{renderConsistencyWeek();showToast("Consistency coaching refreshed")};
  document.getElementById("diaryText").addEventListener("input",updateDiaryCharacterCount);
  document.getElementById("diaryText").addEventListener("keydown",event=>{if(event.ctrlKey&&event.key==="Enter")addDiaryEntry()});
  document.getElementById("diaryImageButton").onclick=()=>document.getElementById("diaryImageInput").click();
  document.getElementById("diaryImageInput").onchange=event=>selectDiaryImage(event.target.files?.[0]);
  document.getElementById("diaryImageRemove").onclick=clearPendingDiaryImage;
  document.getElementById("refreshDiaryReview").onclick=()=>{diaryReviewMode="local";renderDiaryDailyReview();showToast("Today’s private review refreshed")};
  document.querySelectorAll("[data-gemini-review]").forEach(button=>button.onclick=()=>requestGeminiDiaryReview(button.dataset.geminiReview));
  document.getElementById("diarySearch").addEventListener("input",renderDiary);
  document.getElementById("diaryFilter").addEventListener("change",renderDiary);
  document.getElementById("diaryEntries").addEventListener("click",event=>{
    const button=event.target.closest("[data-diary-delete]");
    if(button)deleteDiaryEntry(button.dataset.diaryDelete);
  });
  renderDiary();
  renderConsistencyWeek();
  setInterval(updateDiaryCurrentDateTime,1000);
  setInterval(renderDiary,60000);
}
