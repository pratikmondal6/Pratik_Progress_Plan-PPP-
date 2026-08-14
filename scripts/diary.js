const DIARY_KEY="pppDiary_v1";
const DIARY_RETENTION_MS=7*24*60*60*1000;
const DIARY_TYPES={
  thought:{label:"Thought",icon:"💭"},
  task:{label:"Task or plan",icon:"✅"},
  summary:{label:"Daily summary",icon:"📖"},
  win:{label:"Win",icon:"🏆"},
  note:{label:"Quick note",icon:"📝"}
};
let diaryEntries=[];
let pendingDiaryImage=null;

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
      image:normalizeDiaryImage(entry.image),
      analysis:normalizeDiaryAnalysis(entry.analysis)
    })):[];
  }catch(error){
    diaryEntries=[];
  }
  removeExpiredDiaryEntries();
  migrateDiarySchedulePreferences();
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
    analyzedAt:Number(analysis.analyzedAt)||Date.now()
  };
}

function diarySentences(text){
  return text.replace(/\n+/g,". ").split(/(?<=[.!?])\s+/).map(sentence=>sentence.trim()).filter(Boolean);
}

function diaryMinutes(sentence){
  const hours=sentence.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i);
  if(hours)return Math.round(Number(hours[1])*60);
  const minutes=sentence.match(/\b(\d{1,3})\s*(?:m|min|mins|minute|minutes)\b/i);
  return minutes?Number(minutes[1]):null;
}

function diarySentenceState(sentence){
  const negative=/\b(?:did\s*not|didn't|couldn't|failed|missed|skipped|relapsed|broke|not done|wasn't able)\b/i.test(sentence);
  const completed=/\b(?:did|done|completed|finished|studied|learned|read|practiced|worked|avoided|controlled|followed|stayed|kept|achieved)\b/i.test(sentence);
  const planned=/\b(?:plan|planning|will|going to|want to|need to|tomorrow|later|should|goal|intend|hope to)\b/i.test(sentence)&&!completed;
  const partial=/\b(?:partial|partly|some|a little|started)\b/i.test(sentence);
  return negative?"negative":planned?"plan":partial?"partial":completed?"positive":"neutral";
}

function diaryCommitmentDate(sentence,baseTimestamp=Date.now()){
  const date=new Date(baseTimestamp);
  if(/\btomorrow\b/i.test(sentence))date.setDate(date.getDate()+1);
  const iso=sentence.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if(iso)return `${iso[1]}-${String(Number(iso[2])).padStart(2,"0")}-${String(Number(iso[3])).padStart(2,"0")}`;
  return localDateKey(date);
}

function diaryClockMinutes(hour,minute,meridiem){
  let value=Number(hour),mins=Number(minute||0);if(value>23||mins>59)return null;
  if(meridiem){const period=meridiem.toLowerCase();if(value>12)return null;if(period==="pm"&&value<12)value+=12;if(period==="am"&&value===12)value=0}
  return value*60+mins;
}

function parseDiaryCommitment(sentence,baseTimestamp=Date.now()){
  const range=sentence.match(/\b(?:from\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if(!range)return null;
  let start=diaryClockMinutes(range[1],range[2],range[3]),end=diaryClockMinutes(range[4],range[5],range[6]);if(start==null||end==null)return null;
  if(end<=start)end+=end<720?720:1440;if(end-start<15||end-start>960)return null;
  const title=/\b(?:work|shift|office)\b/i.test(sentence)?"Work":/\bmeeting\b/i.test(sentence)?"Meeting":/\bappointment\b/i.test(sentence)?"Appointment":"Fixed commitment";
  return {date:diaryCommitmentDate(sentence,baseTimestamp),start,end,title,sourceText:sentence.slice(0,220)};
}

function parseDiarySchedulePreference(sentence,baseTimestamp=Date.now()){
  const wake=sentence.match(/\b(?:wake(?:\s+up)?|get\s+up)\s*(?:at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  const sleep=sentence.match(/\b(?:sleep|go\s+to\s+bed|bedtime)\s*(?:at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if(!wake&&!sleep)return null;const value={date:diaryCommitmentDate(sentence,baseTimestamp)};
  if(wake)value.wake=diaryClockMinutes(wake[1],wake[2],wake[3]);if(sleep)value.sleep=diaryClockMinutes(sleep[1],sleep[2],sleep[3]);
  if(value.wake==null&&value.sleep==null)return null;return value;
}

function schedulePreferenceLabel(preference){return `${preference.wake!=null?`Wake time: ${minutesToClock(preference.wake)}`:""}${preference.wake!=null&&preference.sleep!=null?" · ":""}${preference.sleep!=null?`Bedtime: ${minutesToClock(preference.sleep)}`:""} · ${preference.date}`}

function migrateDiarySchedulePreferences(){
  let changed=false;diaryEntries.forEach(entry=>diarySentences(`${entry.title?entry.title+". ":""}${entry.text}`).forEach(sentence=>{const preference=parseDiarySchedulePreference(sentence,entry.createdAt);if(!preference)return;entry.analysis=entry.analysis||{sentiment:"positive",summary:"Schedule preference extracted.",actions:[],synced:[],analyzedAt:Date.now()};if(entry.analysis.actions.some(action=>action.field==="schedulePreference"&&action.value?.date===preference.date))return;const label=schedulePreferenceLabel(preference);entry.analysis.actions.push({field:"schedulePreference",value:preference,label});upsertDayPreference(preference);entry.analysis.synced.push(label);entry.analysis.summary=`${entry.analysis.actions.length} planner signal${entry.analysis.actions.length===1?"":"s"} extracted.`;changed=true}));if(changed)saveDiaryEntries();
}

function analyzeDiaryEntry(text,title,type,baseTimestamp=Date.now()){
  const sentences=diarySentences(`${title?title+". ":""}${text}`),actions=[],signals=[];
  const add=(field,value,label)=>{const duplicate=actions.some(action=>action.field===field&&(field==="notes"?action.value===value:field==="commitment"?action.value.date===value.date&&action.value.start===value.start&&action.value.end===value.end:field==="schedulePreference"?JSON.stringify(action.value)===JSON.stringify(value):true));if(!duplicate)actions.push({field,value,label})};
  sentences.forEach(sentence=>{
    const lower=sentence.toLowerCase(),status=diarySentenceState(sentence),minutes=diaryMinutes(sentence);
    const schedulePreference=parseDiarySchedulePreference(sentence,baseTimestamp);
    if(schedulePreference){add("schedulePreference",schedulePreference,schedulePreferenceLabel(schedulePreference));signals.push("plan");return}
    const commitment=parseDiaryCommitment(sentence,baseTimestamp);
    if(commitment){add("commitment",commitment,`${commitment.title}: ${commitment.date} · ${minutesToClock(commitment.start)}–${minutesToClock(commitment.end)}`);signals.push("plan");return}
    const isPlan=status==="plan"||type==="task"&&status==="neutral";
    if(isPlan){
      add("notes",`[Diary plan] ${sentence.slice(0,220)}`,"Added a day plan to reflection");
      signals.push("plan");
      return;
    }
    const outcome=status==="negative"?"Missed":status==="partial"?"Partial":status==="positive"?"Done":"";
    GOALS.forEach(goal=>{
      if(!goal.keywords.some(keyword=>lower.includes(keyword)))return;
      if(minutes!=null&&outcome==="Done")add(goal.key,minutes,`${goal.label}: ${minutes} min`);
      else if(outcome==="Done")add(goal.key,goalTarget(goal.key),`${goal.label}: completed target`);
      else if(outcome==="Partial")add(goal.key,Math.round(goalTarget(goal.key)/2),`${goal.label}: partial`);
      else if(outcome==="Missed")add("notes",`[Diary result] ${goal.label}: Missed`,`${goal.label}: Missed`);
      if(outcome)signals.push(outcome==="Missed"?"negative":"positive");
    });
  });
  const sentiment=signals.includes("negative")?"negative":signals.includes("positive")||signals.includes("plan")?"positive":"neutral";
  const summary=actions.length?`${actions.length} planner signal${actions.length===1?"":"s"} extracted.`:"No confident planner update found; this entry remains diary-only.";
  return {sentiment,summary,actions,synced:[],analyzedAt:Date.now()};
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

function addDiaryEntry(){
  const text=document.getElementById("diaryText").value.trim();
  const title=document.getElementById("diaryTitle").value.trim();
  const type=document.getElementById("diaryType").value;
  const autoDelete=document.getElementById("diaryAutoDelete").checked;
  if(!text&&!pendingDiaryImage){showToast("Write something or attach an image before saving");document.getElementById("diaryText").focus();return}
  const createdAt=Date.now();
  const entry={id:diaryId(),title,text,type:DIARY_TYPES[type]?type:"note",createdAt,autoDelete,image:pendingDiaryImage,analysis:analyzeDiaryEntry(text,title,type,createdAt)};
  syncDiaryAnalysis(entry);
  diaryEntries.unshift(entry);
  if(!saveDiaryEntries()){diaryEntries.shift();return}
  document.getElementById("diaryTitle").value="";
  document.getElementById("diaryText").value="";
  document.getElementById("diaryAutoDelete").checked=false;
  clearPendingDiaryImage();
  updateDiaryCharacterCount();
  renderDiary();
  showToast(entry.analysis.synced.length?`Diary saved · ${entry.analysis.synced.length} planner update${entry.analysis.synced.length===1?"":"s"}`:"Diary entry saved");
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
    const text=`${entry.title?entry.title+". ":""}${entry.text}`,sentences=diarySentences(text);
    sentences.forEach(sentence=>{
      const state=diarySentenceState(sentence),clean=sentence.slice(0,220),lower=sentence.toLowerCase();
      if(state==="negative")review.incomplete.push(clean);else if(state==="plan")review.plans.push(clean);else if(state==="positive"||state==="partial")review.completed.push(clean);
      if(entry.type==="win"||/\b(?:achiev|proud|won|success|milestone|managed to|finally)\w*\b/i.test(sentence))review.achievements.push(clean);
      if(/\b(?:happy|good|great|grateful|calm|focused|productive|energized|confident|enjoyed|better|progress|proud)\b/i.test(lower))review.positives.push(clean);
      if(/\b(?:sad|bad|stressed|anxious|tired|exhausted|angry|frustrated|distracted|overwhelmed|worry|worried|late|procrastinat|failed|missed|skipped)\w*\b/i.test(lower))review.negatives.push(clean);
    });
    if(entry.type==="task"&&!sentences.some(sentence=>diarySentenceState(sentence)==="positive"))review.plans.push(entry.title||entry.text.slice(0,220));
  });
  Object.keys(review).filter(key=>Array.isArray(review[key])&&key!=="entries").forEach(key=>review[key]=uniqueDiaryItems(review[key]));
  review.incomplete.slice(0,2).forEach(item=>review.improvements.push(`Schedule a small first step for: ${item}`));
  review.plans.slice(0,2).forEach(item=>review.improvements.push(`Make tomorrow concrete: choose a time and minimum result for “${item}”`));
  if(review.negatives.length)review.improvements.push("Protect one recovery block tomorrow—sleep, a walk, or ten quiet minutes before demanding work.");
  if(!review.improvements.length&&review.completed.length)review.improvements.push("Repeat today’s strongest behavior tomorrow and begin with the same successful cue.");
  if(!review.improvements.length)review.improvements.push("Write one specific priority tonight: what, when, and the smallest acceptable finish.");
  review.improvements=uniqueDiaryItems(review.improvements,4);
  const positiveCount=review.completed.length+review.achievements.length+review.positives.length,negativeCount=review.incomplete.length+review.negatives.length;
  review.score=clamp(Math.round(55+positiveCount*7-negativeCount*8),10,95);
  review.outcome=!entries.length?"No review yet":review.score>=75?"Strong day":review.score>=55?"Mixed but moving forward":"Recovery and reset needed";
  return review;
}
function diaryReviewList(title,icon,items,emptyText,kind=""){
  return `<div class="diary-review-group ${kind}"><div class="diary-review-group-title"><span>${icon}</span><strong>${title}</strong><em>${items.length}</em></div>${items.length?`<ul>${items.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul>`:`<p>${emptyText}</p>`}</div>`;
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
  renderDiaryDailyReview();
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
        <div class="diary-analysis-head"><strong>✦ Smart diary analysis</strong><span>${escapeHtml(entry.analysis.sentiment)}</span></div>
        <p>${escapeHtml(entry.analysis.summary)}</p>
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
  updateDiaryCurrentDateTime();
  document.getElementById("saveDiaryEntry").onclick=addDiaryEntry;
  document.getElementById("clearDiaryEntries").onclick=clearDiaryEntries;
  document.getElementById("diaryText").addEventListener("input",updateDiaryCharacterCount);
  document.getElementById("diaryText").addEventListener("keydown",event=>{if(event.ctrlKey&&event.key==="Enter")addDiaryEntry()});
  document.getElementById("diaryImageButton").onclick=()=>document.getElementById("diaryImageInput").click();
  document.getElementById("diaryImageInput").onchange=event=>selectDiaryImage(event.target.files?.[0]);
  document.getElementById("diaryImageRemove").onclick=clearPendingDiaryImage;
  document.getElementById("refreshDiaryReview").onclick=()=>{renderDiaryDailyReview();showToast("Today’s private review refreshed")};
  document.getElementById("diarySearch").addEventListener("input",renderDiary);
  document.getElementById("diaryFilter").addEventListener("change",renderDiary);
  document.getElementById("diaryEntries").addEventListener("click",event=>{
    const button=event.target.closest("[data-diary-delete]");
    if(button)deleteDiaryEntry(button.dataset.diaryDelete);
  });
  renderDiary();
  setInterval(updateDiaryCurrentDateTime,1000);
  setInterval(renderDiary,60000);
}
