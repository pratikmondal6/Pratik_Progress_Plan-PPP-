function clone(v){return JSON.parse(JSON.stringify(v))}
function loadState(){
  try{
    let raw=localStorage.getItem(APP_KEY);
    if(!raw){
      for(const key of LEGACY_KEYS){
        raw=localStorage.getItem(key);
        if(raw)break;
      }
    }
    const s=raw?JSON.parse(raw):null;
    if(s){
      const settings={...DEFAULTS.settings,...s.settings,goalTargets:{...DEFAULTS.settings.goalTargets,...s.settings?.goalTargets}};
      const months=s.months||{};
      Object.values(months).forEach(days=>days.forEach(day=>{
        if(day.habib&&!day.habibStudy)day.habibStudy=day.habib==="Done"?30:day.habib==="Partial"?15:0;
        if(day.english&&!day.englishSpoken)day.englishSpoken=day.english==="Done"?20:day.english==="Partial"?10:0;
        if(day.selfImprovement&&!day.motivationalReading)day.motivationalReading=day.selfImprovement==="Done"?20:day.selfImprovement==="Partial"?10:0;
      }));
      const savedLibrary=s.library&&typeof s.library==="object"?s.library:{};
      const migrated={profile:{...DEFAULTS.profile,...s.profile},settings,weights:{...DEFAULTS.weights,...s.weights},months,library:{books:Array.isArray(savedLibrary.books)?savedLibrary.books:clone(DEFAULT_LIBRARY_BOOKS),progress:savedLibrary.progress||{},filter:savedLibrary.filter||"all"},acceptedBookings:Array.isArray(s.acceptedBookings)?s.acceptedBookings:[],bookingFeedback:s.bookingFeedback&&typeof s.bookingFeedback==="object"?s.bookingFeedback:{}};
      localStorage.setItem(APP_KEY,JSON.stringify(migrated));
      return migrated;
    }
  }catch(e){}
  return clone(DEFAULTS);
}
function save(){localStorage.setItem(APP_KEY,JSON.stringify(state));setSaveStatus("Saved")}
function saveFocusTimer(){
  const safe={mode:timer.mode,elapsed:timer.elapsed,duration:timer.duration,running:timer.running,startedAt:timer.startedAt,focus:timer.focus,sessionFocus:timer.sessionFocus};
  localStorage.setItem(FOCUS_TIMER_KEY,JSON.stringify(safe));
}
function monthDays(key){const [y,m]=key.split("-").map(Number);return new Date(y,m,0).getDate()}
function ensureMonth(key=currentMonth){
  const n=monthDays(key);
  if(!state.months[key])state.months[key]=Array.from({length:n},blankDay);
  while(state.months[key].length<n)state.months[key].push(blankDay());
  state.months[key]=state.months[key].slice(0,n).map(d=>({...blankDay(),...d}));
  return state.months[key];
}
function dayDate(i,key=currentMonth){const [y,m]=key.split("-").map(Number);return new Date(y,m-1,i+1)}
function dateLabel(d){return d.toLocaleDateString(undefined,{day:"2-digit",month:"short"})}
function monthLabel(key=currentMonth){const [y,m]=key.split("-").map(Number);return new Date(y,m-1,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}
function todayIndex(){
  const d=new Date(),[y,m]=currentMonth.split("-").map(Number);
  return d.getFullYear()===y&&d.getMonth()+1===m?d.getDate()-1:0;
}
function mult(v){return v==="Done"?1:v==="Partial"?.5:0}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function parseTime(v){if(!v)return null;const [h,m]=v.split(":").map(Number);return h*60+m}
function sleepCalc(d){
  const s=parseTime(d.sleep),w=parseTime(d.wake);if(s==null||w==null)return {hours:null,status:"",timingScore:0};
  let mins=w-s;if(mins<=0)mins+=1440;const hours=mins/60,st=state.settings;
  let status;
  if(hours<st.shortBelow)status="Short sleep";
  else if(hours>st.longAbove)status="Long sleep";
  else{
    const ps=parseTime(st.preferredSleep),pw=parseTime(st.preferredWake);
    const circ=(a,b)=>Math.abs(((a-b+720)%1440)-720);
    status=circ(s,ps)<=st.tolerance&&circ(w,pw)<=st.tolerance?"On track":"Timing shifted";
  }
  const durationScore=clamp(100-Math.abs(hours-st.targetSleep)*16,0,100);
  const ps=parseTime(st.preferredSleep),pw=parseTime(st.preferredWake),circ=(a,b)=>Math.abs(((a-b+720)%1440)-720);
  const timingScore=clamp(100-((circ(s,ps)+circ(w,pw))/2)/2,0,100);
  return {hours,status,timingScore:(durationScore*.65+timingScore*.35)};
}
function goalTarget(key){return Number(state.settings.goalTargets?.[key]||GOAL_MAP[key]?.target||30)}
function activeGoals(){const keys=Array.isArray(state.settings.activeGoalKeys)?state.settings.activeGoalKeys:GOAL_KEYS;const goals=GOALS.filter(goal=>keys.includes(goal.key));return goals.length?goals:[GOALS[0]]}
function maxPoints(){return activeGoals().reduce((total,goal)=>total+Number(state.weights[goal.key]||0),0)}
function calcMonth(key=currentMonth){
  const days=ensureMonth(key);let streak=0,best=0;
  return days.map((d,i)=>{
    const points=activeGoals().reduce((total,goal)=>total+Math.min((Number(d[goal.key])||0)/goalTarget(goal.key),1)*Number(state.weights[goal.key]||0),0);
    const logged=activeGoals().some(goal=>Number(d[goal.key])>0);
    const completion=maxPoints()?points/maxPoints():0;
    const mission=logged&&completion>=state.settings.missionThreshold/100;
    streak=mission?streak+1:0;best=Math.max(best,streak);
    const bonus=mission&&streak%7===0?10:0,sleep=sleepCalc(d);
    return {...d,index:i,logged,points,completion,mission,streak,best,bonus,reward:points+bonus,sleepHours:sleep.hours,sleepStatus:sleep.status,sleepScore:sleep.timingScore};
  });
}
function currentData(){return calcMonth()}
function rollingData(days=90){const now=new Date(),cutoff=new Date(now);cutoff.setDate(cutoff.getDate()-days+1);cutoff.setHours(0,0,0,0);return Object.keys(state.months).sort().flatMap(key=>calcMonth(key).map((day,index)=>({...day,date:dayDate(index,key),dateKey:localDateKey(dayDate(index,key))}))).filter(day=>day.date>=cutoff&&day.date<=now)}
function recentLogged(data,n=7){return data.filter(x=>x.logged).slice(-n)}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function rewardLevel(points){
  const levels=[[1000,"August Champion"],[850,"Strong Mind"],[600,"Disciplined"],[350,"Focused"],[150,"Momentum"],[0,"Starter"]];
  return levels.find(([p])=>points>=p)[1];
}
function changeMonth(delta){
  let [y,m]=currentMonth.split("-").map(Number);m+=delta;
  if(m<1){m=12;y--}if(m>12){m=1;y++}
  currentMonth=`${y}-${String(m).padStart(2,"0")}`;ensureMonth();renderAll();
}
function setText(id,v){document.getElementById(id).textContent=v}
function trendClass(v){return v>2?"up":v<-2?"down":"flat"}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function badge(text){
  if(!text)return "";
  const cls=text==="YES"||text==="On track"?"good":text==="PARTIAL"||text==="Long sleep"?"partial":text==="NO"||text==="Short sleep"?"bad":"shift";
  return `<span class="badge ${cls}">${text}</span>`;
}

state=loadState();
timer=loadFocusTimer();
