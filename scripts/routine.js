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
const PLAN_21_KEY="ppp21DayPlan_v1";
function load21DayCycle(){try{const saved=JSON.parse(localStorage.getItem(PLAN_21_KEY)||"null");if(saved&&/^\d{4}-\d{2}-\d{2}$/.test(saved.startDate))return {startDate:saved.startDate,manualDone:saved.manualDone&&typeof saved.manualDone==="object"?saved.manualDone:{}}}catch(error){}return {startDate:localDateKey(new Date()),manualDone:{}}}
function save21DayCycle(cycle){localStorage.setItem(PLAN_21_KEY,JSON.stringify(cycle))}
function planDayData(date){const key=localDateKey(date),month=key.slice(0,7),day=Number(key.slice(8))-1;return ensureMonth(month)[day]||blankDay()}
function planItemId(date,goalKey){return `${localDateKey(date)}|${goalKey}`}
function planGoals(index){const priority=[GOAL_MAP.courseraML,GOAL_MAP.audiPrep,GOAL_MAP.systemDesign],priorityKeys=new Set(priority.map(goal=>goal.key)),rotation=GOALS.filter(goal=>!priorityKeys.has(goal.key));return [priority[index%priority.length],rotation[index%rotation.length],rotation[(index+3)%rotation.length]]}
function planItemStatus(date,goal,target,cycle){const minutes=Number(planDayData(date)[goal.key])||0,manual=Boolean(cycle.manualDone[planItemId(date,goal.key)]),today=localDateKey(new Date()),key=localDateKey(date);if(manual||minutes>=target)return {key:"completed",label:manual&&minutes<target?"Done manually":"Completed",minutes,checked:true,manual};if(minutes>0)return {key:"partial",label:`${minutes}/${target} min`,minutes,checked:false,manual:false};if(key<today)return {key:"missed",label:"Missed",minutes:0,checked:false,manual:false};return {key:"planned",label:key===today?"Due today":"Planned",minutes:0,checked:false,manual:false}}
let pendingPlanProgress=null;
function close21DayProgressModal(){pendingPlanProgress=null;hideModal("planProgressModal");render21DayPlan()}
function update21DayProgressPreview(){
  if(!pendingPlanProgress)return;const input=document.getElementById("planProgressMinutes"),range=document.getElementById("planProgressRange"),minutes=clamp(Math.round(Number(input.value)||0),0,1440);input.value=minutes;range.value=Math.min(minutes,Number(range.max));const target=pendingPlanProgress.target,remaining=Math.max(0,target-minutes);setText("planProgressPreview",minutes>=target?`Target reached. Saving will mark this item complete across PPP.`:minutes>0?`${minutes} minutes will be recorded. ${remaining} more minutes remain for the target.`:"No minutes will be recorded. The item will remain planned or missed.")
}
function open21DayProgressModal(id,target){
  const [dateKey,goalKey]=String(id).split("|"),goal=GOAL_MAP[goalKey];if(!goal)return;const date=dateFromKey(dateKey),existing=Number(planDayData(date)[goalKey])||0,suggested=Math.max(existing,Number(target)||goalTarget(goalKey));pendingPlanProgress={id,dateKey,goalKey,target:Number(target)||goalTarget(goalKey)};
  setText("planProgressTitle",existing?"Update completed minutes":"Record completed minutes");setText("planProgressIcon",goal.icon);setText("planProgressGoal",goal.label);setText("planProgressDate",date.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"}));setText("planProgressTarget",`${pendingPlanProgress.target} min`);
  const input=document.getElementById("planProgressMinutes"),range=document.getElementById("planProgressRange");input.value=suggested;range.max=Math.max(120,pendingPlanProgress.target,existing);range.value=Math.min(suggested,Number(range.max));document.getElementById("planProgressQuick").innerHTML=[5,15,pendingPlanProgress.target].filter((value,index,list)=>list.indexOf(value)===index).map(value=>`<button type="button" data-plan-minutes="${value}">${value===pendingPlanProgress.target?"Full target":`+${value} min`}</button>`).join("");update21DayProgressPreview();showModal("planProgressModal");setTimeout(()=>input.select(),30)
}
function save21DayProgress(){
  if(!pendingPlanProgress)return;const {id,dateKey,goalKey,target}=pendingPlanProgress,goal=GOAL_MAP[goalKey],minutes=Math.round(Number(document.getElementById("planProgressMinutes").value));if(!Number.isFinite(minutes)||minutes<0||minutes>1440){showToast("Enter completed minutes between 0 and 1440");return}const day=planDayData(dateFromKey(dateKey)),cycle=load21DayCycle();day[goalKey]=minutes;delete cycle.manualDone[id];save21DayCycle(cycle);pendingPlanProgress=null;hideModal("planProgressModal");save();renderAll();showToast(minutes>=target?`${goal.short} completed and synchronized across PPP`:`${minutes} minutes recorded — item is now partial`)
}
function toggle21DayItem(id,checked,target){
  const [dateKey,goalKey]=String(id).split("|"),goal=GOAL_MAP[goalKey],cycle=load21DayCycle();if(!goal||!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)){render21DayPlan();return}
  if(!checked){if(cycle.manualDone[id]){delete cycle.manualDone[id];save21DayCycle(cycle);render21DayPlan();showToast("Manual completion removed")}else{render21DayPlan();showToast("Recorded minutes are kept. Edit them in Today or Calendar.")}return}
  open21DayProgressModal(id,target)
}
function restart21DayPlan(){const existing=load21DayCycle(),today=localDateKey(new Date());if((existing.startDate!==today||Object.keys(existing.manualDone).length)&&!confirm("Restart the 21-day cycle from today? Manual plan checkmarks will be cleared, but recorded daily progress will remain."))return;save21DayCycle({startDate:today,manualDone:{}});render21DayPlan();showToast("21-day cycle restarted from today")}
function render21DayPlan(){
  const root=document.getElementById("twentyOneDayPlan");if(!root)return;const cycle=load21DayCycle();save21DayCycle(cycle);const start=dateFromKey(cycle.startDate),today=localDateKey(new Date());let completed=0,partial=0,missed=0;
  setText("audiCountdown",`${Math.max(0,milestoneDays("2026-12-01"))} days until joining`);setText("courseraCountdown",`${Math.max(0,milestoneDays("2026-10-22"))} days remaining`);
  root.innerHTML=[0,1,2].map(week=>`<div class="box glass plan-week"><div class="plan-week-head"><h3>Week ${week+1}</h3><span>${week===0?"Foundation":week===1?"Build depth":"Consolidate and finish"}</span></div><div class="plan-days">${Array.from({length:7},(_,day)=>{
    const index=week*7+day,date=new Date(start);date.setDate(start.getDate()+index);const dateKey=localDateKey(date),goals=planGoals(index),items=goals.map(goal=>{const target=Math.min(goalTarget(goal.key),index<7?30:45),status=planItemStatus(date,goal,target,cycle);if(status.key==="completed")completed++;if(status.key==="partial")partial++;if(status.key==="missed")missed++;return `<label class="plan-item ${status.key}"><input type="checkbox" data-plan-item="${escapeHtml(planItemId(date,goal.key))}" data-plan-target="${target}" ${status.checked?"checked":""}><span class="plan-check">${status.checked?"✓":""}</span><span class="plan-goal"><strong>${goal.icon} ${escapeHtml(goal.short)}</strong><small>${escapeHtml(status.label)} · ${target}m target</small></span></label>`}).join("");
    return `<article class="plan-day ${dateKey===today?"today":""} ${dateKey<today?"past":""}"><div><strong>Day ${index+1}</strong><time>${date.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</time></div>${items}</article>`;
  }).join("")}</div></div>`).join("");
  setText("planCycleProgress",`${completed} / 63`);setText("planCycleSummary",`${cycle.startDate} start · ${partial} partial · ${missed} missed`);
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

const NOW_COACH_DONE_KEY="pppNowCoachDone_v1",NOW_COACH_COLLAPSED_KEY="pppNowCoachCollapsed_v1";
let routineNextFocus=null,routineNextItem=null,routineNowOptions=[],routineNowIndex=0,routineNowEasy=false,routineNowDate="";
function routineActionId(item,date=routineNowDate){return `${date}|${item.minute}|${item.title}`}
function loadNowCoachDone(){try{const value=JSON.parse(localStorage.getItem(NOW_COACH_DONE_KEY)||"{}");return value&&typeof value==="object"?value:{}}catch(error){return {}}}
function isNowCoachDone(item,date=routineNowDate){return Boolean(loadNowCoachDone()[routineActionId(item,date)])}
function setNowCoachCollapsed(collapsed){localStorage.setItem(NOW_COACH_COLLAPSED_KEY,collapsed?"1":"0");renderNowCoachCollapse()}
function renderNowCoachCollapse(){const card=document.querySelector(".now-coach"),button=document.getElementById("nowCoachCollapseBtn");if(!card||!button)return;const collapsed=localStorage.getItem(NOW_COACH_COLLAPSED_KEY)==="1";card.classList.toggle("collapsed",collapsed);button.textContent=collapsed?"Expand":"Collapse";button.setAttribute("aria-expanded",String(!collapsed))}
function renderNowCoach(){
  const item=routineNowOptions[routineNowIndex]||routineNextItem,title=document.getElementById("nowCoachTitle");if(!title)return;
  renderNowCoachCollapse();if(!item){setText("nowCoachClock","What should I do right now?");setText("nowCoachTitle","Your planned day is complete.");setText("nowCoachDetail","Rest without guilt, or prepare one small thing for tomorrow.");setText("nowCoachReason","Stopping is part of a sustainable plan.");document.getElementById("nowCoachMeta").innerHTML="";return}
  const now=new Date(),nowMin=now.getHours()*60+now.getMinutes(),isToday=routineNowDate===localDateKey(now),overdue=isToday&&item.minute<nowMin&&!isNowCoachDone(item);
  const easyMinutes=Math.min(10,item.duration||10),displayTitle=routineNowEasy&&item.focus?`${GOAL_MAP[item.focus]?.label||item.title} — ${easyMinutes} min`:item.title;
  const clock=document.getElementById("nowCoachClock");setText("nowCoachClock",`${overdue?"Overdue action":"What should I do right now?"} · ${now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`);clock.classList.toggle("overdue",overdue);
  setText("nowCoachTitle",displayTitle);setText("nowCoachDetail",routineNowEasy&&item.focus?"Open the material and complete only the smallest visible step. Stop when the short timer ends.":item.detail);
  setText("nowCoachReason",overdue?"This action passed without being marked done. Do the easy version now, mark it done, or choose another option—no catch-up punishment.":item.focus?"This is the next focused block in today’s plan. Starting matters more than making it perfect.":"This is the next scheduled part of your realistic day; productivity is not always the right next action.");
  document.getElementById("nowCoachMeta").innerHTML=`${overdue?'<span class="overdue-badge">Overdue</span>':""}<span>${minutesToClock(item.minute)}</span><span>${item.duration?`${routineNowEasy?easyMinutes:item.duration} minutes`:"Scheduled routine"}</span><span>${item.focus?"Focus block":"Life & recovery"}</span>`;
}
function startNowCoach(){
  if(routineNowEasy&&routineNextFocus&&!timer.running&&!timer.elapsed){timer.focus=routineNextFocus;setTimerMode("countdown");setTimerDuration(Math.min(10,routineNextItem?.duration||10));saveFocusTimer()}
  openRoutineNext();
}
function makeNowCoachEasier(){routineNowEasy=!routineNowEasy;renderNowCoach()}
function anotherNowCoachOption(){if(!routineNowOptions.length)return;routineNowIndex=(routineNowIndex+1)%routineNowOptions.length;routineNowEasy=false;routineNextItem=routineNowOptions[routineNowIndex];routineNextFocus=routineNextItem.focus||null;renderNowCoach()}
function completeNowCoachAction(){const item=routineNowOptions[routineNowIndex]||routineNextItem;if(!item)return;const done=loadNowCoachDone();done[routineActionId(item)]=Date.now();localStorage.setItem(NOW_COACH_DONE_KEY,JSON.stringify(done));showToast("Action marked done — choosing what is next");renderRoutine()}
function renderRoutine(){
  const input=document.getElementById("routinePlanDate"),today=new Date();if(!input.value)input.value=localDateKey(today);populatePlannerTimeInputs();const planDate=dateFromKey(input.value),plan=buildRoutine(planDate),now=new Date(),nowMin=now.getHours()*60+now.getMinutes(),routine=plan.items,isToday=localDateKey(planDate)===localDateKey(now);
  setText("routineHeadline",`${planDate.toLocaleDateString(undefined,{weekday:"long"})} starts at ${minutesToClock(plan.wake)}${plan.preference?.wake!=null?" from your saved schedule":""}, with ${plan.commitments.length?`${plan.commitments.length} fixed commitment${plan.commitments.length===1?"":"s"}`:"no fixed commitments"}.`);setText("routineDescription",`${planDate.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}: ${plan.chosen.map(item=>item.goal.short).join(" · ")}. Meals, breaks, social life, private time, and buffer are protected.`);setText("routineWake",minutesToClock(plan.wake));setText("routineSleep",minutesToClock(plan.sleep));
  setText("routinePriority",plan.chosen[0].goal.short);setText("routineFocusTotal",`${plan.chosen.reduce((sum,item)=>sum+item.duration,0)} min`);
  routineNowDate=localDateKey(planDate);let comparableNow=isToday?nowMin:plan.wake;if(comparableNow<plan.wake)comparableNow+=1440;const unfinished=routine.map((item,index)=>({item,index})).filter(entry=>!isNowCoachDone(entry.item,routineNowDate)),recentOverdue=unfinished.filter(entry=>entry.item.minute<comparableNow&&comparableNow-entry.item.minute<=120).pop(),upcoming=unfinished.find(entry=>entry.item.minute>=comparableNow),chosenEntry=recentOverdue||upcoming||unfinished[unfinished.length-1],nextIndex=chosenEntry?chosenEntry.index:-1;
  document.getElementById("routineTimeline").innerHTML=routine.map((item,index)=>`<div class="routine-step ${isNowCoachDone(item,routineNowDate)||index<nextIndex?"done":""} ${index===nextIndex?"now":""}"><div class="routine-time">${minutesToClock(item.minute)}</div><div class="routine-icon">${item.icon}</div><div class="routine-content"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span>${item.priority?'<span class="routine-badge">Main outcome</span>':""}</div></div>`).join("");
  document.getElementById("remainingPlan").innerHTML=plan.chosen.map(item=>{const remaining=Math.max(0,item.duration-item.done);return `<div class="remaining-item"><div class="remaining-check">${item.goal.icon}</div><div><strong>${item.goal.label}</strong><span>${remaining?`${remaining} planned minutes remaining`:"Today's planned block is complete"}</span></div></div>`}).join("");
  const preferenceHtml=plan.preference?`<div class="remaining-item"><div class="remaining-check">⏰</div><div class="commitment-content"><strong>Saved schedule preference</strong><span>${plan.preference.wake!=null?`Wake ${minutesToClock(plan.preference.wake)}`:""}${plan.preference.wake!=null&&plan.preference.sleep!=null?" · ":""}${plan.preference.sleep!=null?`Sleep ${minutesToClock(plan.preference.sleep)}`:""}</span></div></div>`:"";
  const commitmentHtml=plan.commitments.map(item=>`<div class="remaining-item"><div class="remaining-check">💼</div><div class="commitment-content"><strong>${escapeHtml(item.title)}</strong><span>${minutesToClock(item.start)}–${minutesToClock(item.end)}</span></div><button class="diary-delete" data-delete-commitment="${escapeHtml(item.id)}">Delete</button></div>`).join("");document.getElementById("routineCommitments").innerHTML=preferenceHtml+commitmentHtml||( '<div class="empty">No fixed commitments or diary schedule preferences for this date.</div>');
  const next=chosenEntry?.item;routineNextItem=next||null;routineNextFocus=next?.focus||null;
  routineNowOptions=unfinished.filter(entry=>entry.index>=Math.max(0,nextIndex)).slice(0,4).map(entry=>entry.item);routineNowIndex=0;routineNowEasy=false;
  setText("routineNextText",next?`${minutesToClock(next.minute)} — ${next.title}. ${next.detail}`:"The planned day is complete. Rest without guilt.");
  renderNowCoach();
}

function openRoutineNext(){
  if(!routineNextFocus){showToast(routineNextItem?`Now: ${routineNextItem.title}`:"Today's plan is complete");return}
  if(!timer.running&&!timer.elapsed){timer.focus=routineNextFocus;saveFocusTimer()}
  showTab("command");setTimeout(()=>document.getElementById("focusSprintBox")?.scrollIntoView({behavior:"smooth",block:"center"}),50);
}
