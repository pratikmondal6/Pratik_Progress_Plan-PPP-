function minutesToClock(total){
  total=((total%1440)+1440)%1440;
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

function routineModeInfo(mode){
  const modes={
    balanced:{headline:"A balanced career-and-learning day.",description:"Three priority blocks plus language and reading rotation."},
    busy:{headline:"A minimum viable progress day.",description:"Protect the Audi, deadline, and language anchors when time is limited."},
    recovery:{headline:"A lighter day that keeps the system alive.",description:"Use reading and short review blocks while recovery stays the priority."}
  };return modes[mode]||modes.balanced;
}

function milestoneDays(dateString){return Math.ceil((new Date(`${dateString}T23:59:59`)-new Date())/86400000)}
const COMMITMENTS_KEY="pppCalendarCommitments_v1";
const DAY_PREFERENCES_KEY="pppDaySchedulePreferences_v1";
function localDateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function dateFromKey(key){const [year,month,day]=key.split("-").map(Number);return new Date(year,month-1,day)}
function loadCommitments(){try{const saved=JSON.parse(localStorage.getItem(COMMITMENTS_KEY));return Array.isArray(saved)?saved.filter(item=>item&&item.date&&Number.isFinite(item.start)&&Number.isFinite(item.end)):[]}catch(error){return []}}
function saveCommitments(items){localStorage.setItem(COMMITMENTS_KEY,JSON.stringify(items))}
function addCommitment(commitment){
  const items=loadCommitments(),duplicate=items.find(item=>item.date===commitment.date&&item.start===commitment.start&&item.end===commitment.end&&item.title.toLowerCase()===commitment.title.toLowerCase());
  if(duplicate)return {commitment:duplicate,created:false};
  const saved={id:commitment.id||`commitment-${Date.now()}-${Math.random().toString(16).slice(2)}`,date:commitment.date,start:commitment.start,end:commitment.end,title:commitment.title,sourceEntryId:commitment.sourceEntryId||null,createdAt:Date.now()};
  items.push(saved);saveCommitments(items);return {commitment:saved,created:true};
}
function commitmentsForDate(date){const key=typeof date==="string"?date:localDateKey(date);return loadCommitments().filter(item=>item.date===key).sort((a,b)=>a.start-b.start)}
function deleteCommitment(id){const items=loadCommitments(),next=items.filter(item=>item.id!==id);if(next.length===items.length)return;saveCommitments(next);renderRoutine();showToast("Commitment deleted")}
function loadDayPreferences(){try{const saved=JSON.parse(localStorage.getItem(DAY_PREFERENCES_KEY));return saved&&typeof saved==="object"?saved:{}}catch(error){return {}}}
function dayPreference(date){const key=typeof date==="string"?date:localDateKey(date);return loadDayPreferences()[key]||null}
function upsertDayPreference(preference){const all=loadDayPreferences(),existing=all[preference.date]||{},next={...existing,...preference};delete next.date;const changed=JSON.stringify(existing)!==JSON.stringify(next);all[preference.date]=next;saveDayPreferences(all);return {preference:next,created:changed}}
function saveDayPreferences(items){localStorage.setItem(DAY_PREFERENCES_KEY,JSON.stringify(items))}
function clearDayPreference(date){const key=typeof date==="string"?date:localDateKey(date),all=loadDayPreferences();delete all[key];saveDayPreferences(all)}
function populatePlannerTimeInputs(force=false){
  const dateInput=document.getElementById("routinePlanDate"),wakeInput=document.getElementById("routineWakeInput"),sleepInput=document.getElementById("routineSleepInput");if(!dateInput||!wakeInput||!sleepInput)return;
  const key=dateInput.value||localDateKey(new Date());if(!force&&dateInput.dataset.timesFor===key)return;const preference=dayPreference(key);
  wakeInput.value=preference?.wake!=null?minutesToClock(preference.wake):"";sleepInput.value=preference?.sleep!=null?minutesToClock(preference.sleep):"";dateInput.dataset.timesFor=key;
  setText("plannerTimeSource",preference?"Using date-specific times from your diary or an earlier planner choice.":"No date-specific times saved. Empty fields will use your default Settings.");
}
function applyPlannerTimeInputs(){
  const date=document.getElementById("routinePlanDate").value,wakeValue=document.getElementById("routineWakeInput").value,sleepValue=document.getElementById("routineSleepInput").value;if(!date)return;
  if(wakeValue||sleepValue){const preference={date};if(wakeValue)preference.wake=parseTime(wakeValue);if(sleepValue)preference.sleep=parseTime(sleepValue);upsertDayPreference(preference);document.getElementById("routinePlanDate").dataset.timesFor="";populatePlannerTimeInputs(true);showToast("Your times were included in the day plan")}
  else showToast("Using diary preferences or default Settings");renderRoutine();
}
function clearPlannerTimeInputs(){const date=document.getElementById("routinePlanDate").value;if(!date)return;clearDayPreference(date);document.getElementById("routinePlanDate").dataset.timesFor="";populatePlannerTimeInputs(true);renderRoutine();showToast("Using default wake and sleep settings")}
function render21DayPlan(){
  const root=document.getElementById("twentyOneDayPlan");if(!root)return;
  const start=new Date(),priority=[GOAL_MAP.courseraML,GOAL_MAP.audiPrep,GOAL_MAP.systemDesign],rotation=GOALS.filter(goal=>!priority.includes(goal));
  setText("audiCountdown",`${Math.max(0,milestoneDays("2026-12-01"))} days until joining`);setText("courseraCountdown",`${Math.max(0,milestoneDays("2026-10-22"))} days remaining`);
  root.innerHTML=[0,1,2].map(week=>`<div class="box glass plan-week"><div class="plan-week-head"><h3>Week ${week+1}</h3><span>${week===0?"Foundation":week===1?"Build depth":"Consolidate and finish"}</span></div><div class="plan-days">${Array.from({length:7},(_,day)=>{
    const index=week*7+day,date=new Date(start);date.setDate(start.getDate()+index);
    const goals=[priority[index%priority.length],rotation[index%rotation.length],rotation[(index+3)%rotation.length]];
    return `<article class="plan-day ${index===0?"today":""}"><div><strong>Day ${index+1}</strong><time>${date.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</time></div>${goals.map(goal=>`<span>${goal.icon} ${goal.short} · ${Math.min(goalTarget(goal.key),index<7?30:45)}m</span>`).join("")}</article>`;
  }).join("")}</div></div>`).join("");
}

function goalScoreMap(){return Object.fromEntries(habitScores(currentData()).map(([label,score])=>[label,score]))}
function awakeWindow(date=new Date()){const preference=dayPreference(date),wake=Number.isFinite(preference?.wake)?preference.wake:(parseTime(state.settings.preferredWake)||420);let sleep=Number.isFinite(preference?.sleep)?preference.sleep:(parseTime(state.settings.preferredSleep)||1380);if(sleep<=wake)sleep+=1440;return {wake,sleep,hours:(sleep-wake)/60,preference}}
function chooseDayGoals(date=new Date()){
  const scores=goalScoreMap(),day=currentData()[todayIndex()]||{},weekend=[0,6].includes(date.getDay());
  const deadline=milestoneDays("2026-10-22")<=75?GOAL_MAP.courseraML:GOAL_MAP.audiPrep;
  let career=[2,4].includes(date.getDay())?GOAL_MAP.systemDesign:GOAL_MAP.audiPrep;
  if(career.key===deadline.key)career=GOAL_MAP.systemDesign;
  const pool=weekend?[GOAL_MAP.soumi,GOAL_MAP.habibStudy,GOAL_MAP.germanStory,GOAL_MAP.motivationalReading,GOAL_MAP.englishSpoken]:[GOAL_MAP.german,GOAL_MAP.selfStudy,GOAL_MAP.englishSpoken,GOAL_MAP.germanStory,GOAL_MAP.motivationalReading];
  const human=pool.filter(goal=>![deadline.key,career.key].includes(goal.key)).sort((a,b)=>(scores[a.label]||0)-(scores[b.label]||0))[0];
  return [deadline,career,human].filter((goal,index,list)=>goal&&list.findIndex(item=>item.key===goal.key)===index).map((goal,index)=>({goal,duration:Math.min(goalTarget(goal.key),index===0?50:index===1?40:25),done:Number(day[goal.key])||0}));
}

function intervalsOverlap(start,end,busy){return busy.some(item=>start<item.end&&end>item.start)}
function freeFocusStart(preferred,duration,busy,wake,sleep){let start=Math.max(preferred,wake+60);while(start+duration<=sleep-75){if(!intervalsOverlap(start,start+duration,busy))return start;start+=15}return null}
function buildRoutine(planDate=new Date()){
  const {wake,sleep,hours,preference}=awakeWindow(planDate),chosen=chooseDayGoals(planDate),items=[],commitments=commitmentsForDate(planDate),busy=commitments.map(item=>({start:item.start,end:item.end}));
  const add=(offset,icon,title,detail,extra={})=>items.push({minute:wake+offset,icon,title,detail,...extra});
  add(0,"☀️","Wake slowly","Water, wash, daylight, and 20 phone-free minutes. No productivity test yet.");
  add(30,"🍳","Breakfast and private morning time","Eat, get ready, and let your mind arrive. Nothing from the goal list is required here.");
  commitments.forEach(commitment=>items.push({minute:commitment.start,icon:"💼",title:`${commitment.title} — ${minutesToClock(commitment.start)}–${minutesToClock(commitment.end)}`,detail:"Fixed diary commitment. Study is scheduled around this block.",commitment:true}));
  if(commitments.length){const lastEnd=Math.max(...commitments.map(item=>item.end));busy.push({start:lastEnd,end:lastEnd+60})}
  const preferences=[wake+90,wake+330,wake+690];
  chosen.forEach((selection,index)=>{const start=freeFocusStart(preferences[index],selection.duration,busy,wake,sleep);if(start==null)return;busy.push({start,end:start+selection.duration});items.push({minute:start,icon:selection.goal.icon,title:`${selection.goal.label} — ${selection.duration} min`,detail:index===0?(selection.goal.milestone||"Create one visible result."):index===2?"A light final learning block. Stop when the timer ends.":"One focused block is enough.",focus:selection.goal.key,priority:index===0,duration:selection.duration})});
  if(commitments.length){const lastEnd=Math.max(...commitments.map(item=>item.end));items.push({minute:lastEnd+15,icon:"🍲",title:"Meal and recovery after commitment",detail:"Eat, decompress, and take at least 45 minutes before expecting focused work."});items.push({minute:lastEnd+90,icon:"🧘",title:"Open buffer",detail:"Travel, delays, chores, rest, or doing nothing belong here."})}
  else{add(210,"🚶","Real break and movement","Leave the desk for at least 25 minutes. Walk, stretch, shower, or handle personal needs.");add(270,"🍲","Lunch and unstructured time","Eat without studying. Messages, family, errands, and normal life belong here.");add(450,"🧘","Open buffer","Use this for delays, appointments, chores, rest, or doing absolutely nothing for a while.")}
  items.push({minute:Math.min(sleep-240,wake+600),icon:"👥",title:"Social and private life",detail:"Family, friends, hobbies, errands, relationships, or personal responsibilities."});
  items.push({minute:sleep-180,icon:"🍽️",title:"Dinner and evening life",detail:"Eat, connect, relax, and do not compensate for an imperfect day."});
  items.push({minute:sleep-60,icon:"📓",title:"Diary and tomorrow setup — 10 min",detail:"Write what happened. The diary will sync confident results to the planner."});
  items.push({minute:sleep-30,icon:"🌙",title:"Calm shutdown",detail:"Reduce screens, prepare for sleep, and let the day be finished."});
  return {items:items.filter(item=>item.minute>=wake&&item.minute<sleep).sort((a,b)=>a.minute-b.minute),chosen,hours,wake,sleep,commitments,preference,date:planDate};
}

let routineNextFocus=null,routineNextItem=null;
function renderRoutine(){
  const input=document.getElementById("routinePlanDate"),today=new Date();if(!input.value)input.value=localDateKey(today);populatePlannerTimeInputs();const planDate=dateFromKey(input.value),plan=buildRoutine(planDate),now=new Date(),nowMin=now.getHours()*60+now.getMinutes(),routine=plan.items,isToday=localDateKey(planDate)===localDateKey(now);
  setText("routineHeadline",`${planDate.toLocaleDateString(undefined,{weekday:"long"})} starts at ${minutesToClock(plan.wake)}${plan.preference?.wake!=null?" from your saved schedule":""}, with ${plan.commitments.length?`${plan.commitments.length} fixed commitment${plan.commitments.length===1?"":"s"}`:"no fixed commitments"}.`);setText("routineDescription",`${planDate.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}: ${plan.chosen.map(item=>item.goal.short).join(" · ")}. Meals, breaks, social life, private time, and buffer are protected.`);setText("routineWake",minutesToClock(plan.wake));setText("routineSleep",minutesToClock(plan.sleep));
  setText("routinePriority",plan.chosen[0].goal.short);setText("routineFocusTotal",`${plan.chosen.reduce((sum,item)=>sum+item.duration,0)} min`);
  let comparableNow=isToday?nowMin:plan.wake;if(comparableNow<plan.wake)comparableNow+=1440;let nextIndex=routine.findIndex(item=>item.minute>=comparableNow);if(nextIndex<0)nextIndex=routine.length-1;
  document.getElementById("routineTimeline").innerHTML=routine.map((item,index)=>`<div class="routine-step ${index<nextIndex?"done":""} ${index===nextIndex?"now":""}"><div class="routine-time">${minutesToClock(item.minute)}</div><div class="routine-icon">${item.icon}</div><div class="routine-content"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span>${item.priority?'<span class="routine-badge">Main outcome</span>':""}</div></div>`).join("");
  document.getElementById("remainingPlan").innerHTML=plan.chosen.map(item=>{const remaining=Math.max(0,item.duration-item.done);return `<div class="remaining-item"><div class="remaining-check">${item.goal.icon}</div><div><strong>${item.goal.label}</strong><span>${remaining?`${remaining} planned minutes remaining`:"Today's planned block is complete"}</span></div></div>`}).join("");
  const preferenceHtml=plan.preference?`<div class="remaining-item"><div class="remaining-check">⏰</div><div class="commitment-content"><strong>Saved schedule preference</strong><span>${plan.preference.wake!=null?`Wake ${minutesToClock(plan.preference.wake)}`:""}${plan.preference.wake!=null&&plan.preference.sleep!=null?" · ":""}${plan.preference.sleep!=null?`Sleep ${minutesToClock(plan.preference.sleep)}`:""}</span></div></div>`:"";
  const commitmentHtml=plan.commitments.map(item=>`<div class="remaining-item"><div class="remaining-check">💼</div><div class="commitment-content"><strong>${escapeHtml(item.title)}</strong><span>${minutesToClock(item.start)}–${minutesToClock(item.end)}</span></div><button class="diary-delete" data-delete-commitment="${escapeHtml(item.id)}">Delete</button></div>`).join("");document.getElementById("routineCommitments").innerHTML=preferenceHtml+commitmentHtml||( '<div class="empty">No fixed commitments or diary schedule preferences for this date.</div>');
  const next=routine[nextIndex];routineNextItem=next||null;routineNextFocus=next?.focus||null;
  setText("routineNextText",next?`${minutesToClock(next.minute)} — ${next.title}. ${next.detail}`:"The planned day is complete. Rest without guilt.");
}

function openRoutineNext(){
  if(!routineNextFocus){showToast(routineNextItem?`Now: ${routineNextItem.title}`:"Today's plan is complete");return}
  if(!timer.running&&!timer.elapsed){timer.focus=routineNextFocus;saveFocusTimer()}
  showTab("command");setTimeout(()=>document.getElementById("focusSprintBox")?.scrollIntoView({behavior:"smooth",block:"center"}),50);
}
