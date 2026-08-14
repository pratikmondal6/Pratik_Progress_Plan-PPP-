function renderSettings(){
  setText("monthLabel",monthLabel());document.documentElement.dataset.theme=state.profile.theme;
  document.getElementById("userName").value=state.profile.name;document.getElementById("monthlyTarget").value=state.profile.monthlyTarget;
  ["targetSleep","shortBelow","longAbove","preferredSleep","preferredWake","tolerance","missionThreshold"].forEach(id=>document.getElementById(id).value=state.settings[id]);
  document.getElementById("goalTargetSettings").innerHTML=GOALS.map(goal=>`<div class="setting-row"><label><input type="checkbox" data-active-goal="${goal.key}" ${activeGoals().some(item=>item.key===goal.key)?"checked":""}> ${goal.icon} ${goal.label}</label><input type="number" min="5" max="480" step="5" value="${goalTarget(goal.key)}" data-goal-target="${goal.key}"></div>`).join("");
  document.getElementById("celebrationToggle").classList.toggle("on",state.profile.celebrations);document.getElementById("coachToggle").classList.toggle("on",state.profile.coach);
  document.getElementById("weightSettings").innerHTML=Object.entries(WEIGHT_LABELS).map(([k,label])=>`<div class="setting-row"><label>${label}</label><input type="number" min="0" max="20" step=".5" value="${state.weights[k]}" data-weight="${k}"></div>`).join("");
  document.querySelector(".brand>div:last-child>div").textContent=`Pratik´s Progress Plan`;
}
function focusLabel(key){return GOAL_MAP[key]?.label||"Study"}
function currentTimerSeconds(){
  if(timer.running&&timer.startedAt){
    timer.elapsed=Math.max(0,Math.floor((Date.now()-timer.startedAt)/1000));
  }
  return timer.mode==="countdown"?Math.max(0,timer.duration-timer.elapsed):timer.elapsed;
}
function renderFocus(){
  document.getElementById("focusSelect").innerHTML=GOALS.map(goal=>`<button class="chip ${timer.focus===goal.key?"active":""}" data-focus="${goal.key}">${goal.short}</button>`).join("");
  setText("timerFocusLabel",focusLabel(timer.sessionFocus||timer.focus));
  document.querySelectorAll("[data-timer-mode]").forEach(b=>b.classList.toggle("active",b.dataset.timerMode===timer.mode));
  document.getElementById("durationTools").classList.toggle("hidden-tool",timer.mode!=="countdown");
  const mins=[15,25,45,60,90];
  document.getElementById("durationPresets").innerHTML=mins.map(v=>`<button class="duration-preset ${timer.duration===v*60?"active":""}" data-duration="${v}">${v}m</button>`).join("");
  document.getElementById("customDuration").value=Math.round(timer.duration/60);
  renderTimer();
  renderMusicControls();
}
function renderTimer(){
  const seconds=currentTimerSeconds(),m=Math.floor(seconds/60),s=seconds%60;
  setText("timerDisplay",`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
  const card=document.getElementById("focusSprintBox");
  if(card){const progress=timer.mode==="countdown"?clamp(timer.elapsed/timer.duration,0,1):0;card.style.setProperty("--timer-progress",`${progress*360}deg`);card.classList.toggle("timer-running",timer.running);card.classList.toggle("timer-paused",!timer.running&&timer.elapsed>0)}
  const start=document.getElementById("timerStart"),pause=document.getElementById("timerPause"),finish=document.getElementById("timerFinish"),status=document.getElementById("timerStatus");
  const hasProgress=timer.elapsed>0;
  if(start){
    start.textContent=timer.running?"● Focusing…":hasProgress?"▶ Resume Focus":"▶ Start Focus";
    start.disabled=timer.running;
    start.style.opacity=timer.running?".72":"1";
  }
  if(pause)pause.disabled=!timer.running;
  if(finish)finish.disabled=!hasProgress;
  if(status){
    const label=focusLabel(timer.sessionFocus||timer.focus);
    if(timer.running){
      status.textContent=timer.mode==="stopwatch"
        ?`${label} stopwatch is running. Finish whenever the real session ends.`
        :`${label} countdown is running toward ${Math.round(timer.duration/60)} minutes.`;
    }else if(hasProgress){
      const actual=Math.floor(timer.elapsed/60);
      status.textContent=`Paused after ${actual} full minute${actual===1?"":"s"}. Resume, finish and save, or reset.`;
    }else{
      status.textContent=timer.mode==="stopwatch"
        ?`Selected: ${label}. Press Start and the timer will count upward from 00:00.`
        :`Selected: ${label}. Choose a target, then press Start.`;
    }
  }
  saveFocusTimer();
}
function renderAll(){ensureMonth();renderDashboard();renderToday();renderCalendar();renderSettings();renderFocus();renderRoutine();render21DayPlan();renderActivity();renderDiary();renderLibrary();renderBookingDashboard();save()}
function setSaveStatus(t){const e=document.getElementById("saveStatus");if(e)e.textContent=t}
function showTab(id){
  document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  const moreButton=document.getElementById("navMoreBtn"),moreTabs=["activity","insights","settings"];if(moreButton)moreButton.classList.toggle("active",moreTabs.includes(id));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
  if(id==="command"||id==="insights")setTimeout(()=>renderDashboard(),30);
  if(id==="routine")setTimeout(()=>renderRoutine(),20);
  if(id==="plan")setTimeout(()=>render21DayPlan(),20);
  if(id==="activity")setTimeout(()=>requestActivity(false),20);
  if(id==="diary")setTimeout(()=>renderDiary(),20);
  if(id==="library")setTimeout(()=>renderLibrary(),20);
  if(id==="bookings")setTimeout(()=>refreshBookingRequests(true),20);
  if(id==="calendar")setTimeout(()=>{
    const wrap=document.getElementById("calendarTableWrap");
    if(wrap)wrap.scrollLeft=0;
  },20);
}
function toggleNavMore(){const menu=document.getElementById("navMoreMenu"),button=document.getElementById("navMoreBtn"),willOpen=menu.classList.contains("hidden");menu.classList.toggle("hidden",!willOpen);button.setAttribute("aria-expanded",String(willOpen))}
function closeNavMore(){const menu=document.getElementById("navMoreMenu"),button=document.getElementById("navMoreBtn");if(menu)menu.classList.add("hidden");if(button)button.setAttribute("aria-expanded","false")}
function applyQuick(mode){
  const d=ensureMonth()[todayIndex()],set=(f,v)=>d[f]=v;
  if(mode==="minimum"){set("audiPrep",25);set("german",15);set("courseraML",15)}
  if(mode==="solid"){set("audiPrep",45);set("systemDesign",30);set("german",30);set("courseraML",30)}
  if(mode==="full")GOALS.forEach(goal=>set(goal.key,goalTarget(goal.key)));
  if(mode==="recovery"){set("motivationalReading",15);set("germanStory",15);set("englishSpoken",15)}
  save();renderAll();hideModal("quickModal");showTab("today");showToast(`${mode[0].toUpperCase()+mode.slice(1)} plan applied`);
}
function smartMinimum(){
  const data=currentData(),weak=habitScores(data).sort((a,b)=>a[1]-b[1])[0]?.[0]||GOAL_MAP.audiPrep.label,d=ensureMonth()[todayIndex()];
  const goal=GOALS.find(item=>item.label===weak)||GOAL_MAP.audiPrep;
  d.audiPrep=Math.max(d.audiPrep,20);d[goal.key]=Math.max(Number(d[goal.key])||0,20);
  save();renderAll();showToast(`Smart minimum applied — priority: ${weak}`);
}
function beastDay(){applyQuick("minimum")}
function completeToday(){
  const c=currentData()[todayIndex()],wasMission=c.mission;save();renderAll();showToast(c.mission?"Mission day completed ✓":"Check-in saved — keep building");
  if(c.mission&&state.profile.celebrations)confetti();if(c.streak&&c.streak%7===0&&state.profile.celebrations)confetti(true);
}
function runTimerLoop(){
  clearInterval(timer.interval);
  const tick=()=>{
    if(!timer.running)return;
    currentTimerSeconds();
    renderTimer();
    if(timer.mode==="countdown"&&timer.elapsed>=timer.duration)finishAndSaveTimer(true);
  };
  tick();
  timer.interval=setInterval(tick,250);
}
function startTimer(){
  if(timer.running)return false;
  if(!timer.sessionFocus)timer.sessionFocus=timer.focus;
  timer.running=true;
  timer.startedAt=Date.now()-timer.elapsed*1000;
  runTimerLoop();
  saveFocusTimer();
  if(focusMusic.withTimer)startFocusMusic();
  return true;
}
function pauseTimer(){
  if(!timer.running)return;
  currentTimerSeconds();
  clearInterval(timer.interval);
  timer.interval=null;
  timer.running=false;
  timer.startedAt=null;
  saveFocusTimer();
  renderTimer();
  if(focusMusic.withTimer)pauseFocusMusic();
  showToast("Focus timer paused");
}
function finishAndSaveTimer(autoCompleted=false){
  currentTimerSeconds();
  const minutes=autoCompleted&&timer.mode==="countdown"?Math.round(timer.duration/60):Math.floor(timer.elapsed/60);
  if(minutes<1){
    showToast("Focus for at least one full minute before saving");
    return false;
  }
  clearInterval(timer.interval);
  timer.interval=null;
  timer.running=false;
  timer.startedAt=null;
  const focus=timer.sessionFocus||timer.focus;
  const todayKey=localDateKey(new Date()),todayMonth=todayKey.slice(0,7),todayDay=Number(todayKey.slice(8))-1,d=ensureMonth(todayMonth)[todayDay];
  d[focus]=Number(d[focus]||0)+minutes;
  timer.elapsed=0;
  timer.sessionFocus=null;
  if(focusMusic.withTimer)pauseFocusMusic("Focus sound stopped because the session finished.");
  saveFocusTimer();
  save();
  renderAll();
  showToast(`${minutes} focused minute${minutes===1?"":"s"} added to ${focusLabel(focus)} ✓`);
  if(state.profile.celebrations)confetti();
  return true;
}
function resetTimer(){
  clearInterval(timer.interval);
  timer.interval=null;
  timer.running=false;
  timer.startedAt=null;
  timer.elapsed=0;
  timer.sessionFocus=null;
  if(focusMusic.withTimer)pauseFocusMusic("Focus sound stopped because the timer was reset.");
  saveFocusTimer();
  renderFocus();
  showToast("Focus timer reset");
}
function setTimerMode(mode){
  if(timer.running||timer.elapsed>0){
    showToast("Finish or reset the current session before changing timer mode");
    return;
  }
  timer.mode=mode;
  saveFocusTimer();
  renderFocus();
}
function setTimerDuration(minutes){
  if(timer.running||timer.elapsed>0){
    showToast("Finish or reset the current session before changing the target");
    return;
  }
  const safe=clamp(Number(minutes)||25,1,240);
  timer.duration=safe*60;
  saveFocusTimer();
  renderFocus();
}
function openFocusTimer(){
  showTab("command");
  setTimeout(()=>{
    const target=document.getElementById("focusSprintBox");
    if(target)target.scrollIntoView({behavior:"smooth",block:"center"});
    showToast("Choose a habit and press Start when you are ready");
  },100);
}
function restoreRunningTimer(){
  if(timer.running&&timer.startedAt){
    runTimerLoop();
  }else{
    timer.running=false;
    timer.startedAt=null;
    renderFocus();
  }
}
function confetti(big=false){
  const canvas=document.getElementById("confetti"),ctx=canvas.getContext("2d"),d=window.devicePixelRatio||1;canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.scale(d,d);
  const colors=["#4f8cff","#27d6e8","#9b6cff","#ffbf3f","#2bd576","#ff5ca8"],pieces=Array.from({length:big?180:90},()=>({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.2,vx:(Math.random()-.5)*5,vy:2+Math.random()*5,r:3+Math.random()*5,c:colors[Math.floor(Math.random()*colors.length)],a:Math.random()*6}));
  let frames=0;function anim(){ctx.clearRect(0,0,innerWidth,innerHeight);pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=.12;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r,p.r*2,p.r);ctx.restore()});frames++;if(frames<170)requestAnimationFrame(anim);else ctx.clearRect(0,0,innerWidth,innerHeight)}anim();
}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove("show"),2300)}
function showModal(id){document.getElementById(id).classList.remove("hidden")}function hideModal(id){document.getElementById(id).classList.add("hidden")}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);showToast("File downloaded")}
function backupStorageJson(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||"null");return value??fallback}catch(error){return fallback}}
function exportBackup(){
  const booking=loadSharedBookingConfig(),backup={backupFormat:"PPP_FULL_BACKUP",version:3,exportedAt:new Date().toISOString(),state:clone(state),datasets:{diaryEntries:Array.isArray(diaryEntries)?diaryEntries:[],geminiReviews:loadDiaryGeminiReviews(),consistencyCheckins:loadConsistencyCheckins(),commitments:loadCommitments(),dayPreferences:loadDayPreferences(),plan21:load21DayCycle(),nowCoachDone:loadNowCoachDone(),nowCoachCollapsed:localStorage.getItem(NOW_COACH_COLLAPSED_KEY)==="1",focusTimer:backupStorageJson(FOCUS_TIMER_KEY,null),focusMusic:backupStorageJson(FOCUS_MUSIC_KEY,null),bookingPublicConnection:{url:booking.url||""}}};
  download(`pratiks-progress-plan-full-backup-${localDateKey(new Date())}.json`,JSON.stringify(backup,null,2),"application/json")
}
function restoreBackupDataset(key,value){if(value===undefined)return;if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value))}
function restorePPPBackup(payload){
  const source=payload?.state?.months?payload.state:payload;if(!source||!source.months||typeof source.months!=="object")throw new Error("Backup does not contain PPP progress data.");const lib=source.library||{},datasets=payload.datasets||{};
  state={profile:{...DEFAULTS.profile,...source.profile},settings:{...DEFAULTS.settings,...source.settings,goalTargets:{...DEFAULTS.settings.goalTargets,...source.settings?.goalTargets}},weights:{...DEFAULTS.weights,...source.weights},months:source.months,library:{books:Array.isArray(lib.books)?lib.books:clone(DEFAULT_LIBRARY_BOOKS),progress:lib.progress||{},filter:lib.filter||"all"},acceptedBookings:Array.isArray(source.acceptedBookings)?source.acceptedBookings:[],bookingFeedback:source.bookingFeedback||{}};
  const restoredDiary=datasets.diaryEntries!==undefined?datasets.diaryEntries:payload.diaryEntries;if(Array.isArray(restoredDiary))restoreBackupDataset(DIARY_KEY,restoredDiary);restoreBackupDataset(DIARY_AI_REVIEW_KEY,datasets.geminiReviews);restoreBackupDataset(CONSISTENCY_LOG_KEY,datasets.consistencyCheckins);restoreBackupDataset(COMMITMENTS_KEY,datasets.commitments);restoreBackupDataset(DAY_PREFERENCES_KEY,datasets.dayPreferences);restoreBackupDataset(PLAN_21_KEY,datasets.plan21);restoreBackupDataset(NOW_COACH_DONE_KEY,datasets.nowCoachDone);if(datasets.nowCoachCollapsed!==undefined)localStorage.setItem(NOW_COACH_COLLAPSED_KEY,datasets.nowCoachCollapsed?"1":"0");if(datasets.focusTimer!==undefined)restoreBackupDataset(FOCUS_TIMER_KEY,datasets.focusTimer?{...datasets.focusTimer,running:false,startedAt:null}:null);restoreBackupDataset(FOCUS_MUSIC_KEY,datasets.focusMusic);
  if(datasets.bookingPublicConnection?.url){const current=loadSharedBookingConfig();localStorage.setItem(SHARED_BOOKING_CONFIG_KEY,JSON.stringify({...current,url:safeBookingServiceUrl(datasets.bookingPublicConnection.url)}))}
  save();loadDiaryEntries();timer=loadFocusTimer();focusMusic=loadFocusMusic();renderAll();restoreRunningTimer();return true
}
function exportCsv(){
  const data=currentData(),head=["Date","Day",...GOALS.map(goal=>`${goal.label} Minutes`),"Sleep","Wake","Sleep Hours","Sleep Status","Notes","Base Points","Completion","Mission Day","Streak","Bonus","Reward Points"];
  const rows=data.map((d,i)=>[dateLabel(dayDate(i)),dayDate(i).toLocaleDateString(undefined,{weekday:"long"}),...GOALS.map(goal=>Number(d[goal.key])||0),d.sleep,d.wake,d.sleepHours?.toFixed(1)||"",d.sleepStatus,d.notes,d.points.toFixed(1),Math.round(d.completion*100)+"%",d.mission?"YES":d.logged?"NO":"",d.streak,d.bonus,d.reward.toFixed(1)]);
  const csv=[head,...rows].map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");download(`pratiks-progress-plan-${currentMonth}.csv`,csv,"text/csv");
}
function resetMonth(){if(confirm(`Delete all data for ${monthLabel()}?`)){state.months[currentMonth]=Array.from({length:monthDays(currentMonth)},blankDay);save();renderAll();showToast("Month reset")}}
function getTodayRow(){return document.getElementById(`row-${todayIndex()}`)}
function jumpToday(){showTab("calendar");setTimeout(()=>getTodayRow()?.scrollIntoView({behavior:"smooth",block:"center"}),70)}
