function attachEvents(){
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{showTab(b.dataset.tab);closeNavMore()});
  document.getElementById("navMoreBtn").onclick=e=>{e.stopPropagation();toggleNavMore()};
  document.getElementById("navMoreMenu").onclick=e=>e.stopPropagation();
  document.addEventListener("click",closeNavMore);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeNavMore()});
  document.getElementById("navExportBtn").onclick=()=>{closeNavMore();exportBackup()};
  document.getElementById("navImportBtn").onclick=()=>{closeNavMore();document.getElementById("importFile").click()};
  document.getElementById("navCsvBtn").onclick=()=>{closeNavMore();exportCsv()};
  document.getElementById("prevMonth").onclick=()=>changeMonth(-1);document.getElementById("nextMonth").onclick=()=>changeMonth(1);
  document.getElementById("quickBtn").onclick=()=>showModal("quickModal");document.getElementById("closeQuick").onclick=()=>hideModal("quickModal");document.getElementById("openDetailed").onclick=()=>{hideModal("quickModal");showTab("today")};
  document.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>applyQuick(b.dataset.quick));
  document.getElementById("todayHeroBtn").onclick=()=>showTab("today");document.getElementById("beastBtn").onclick=beastDay;document.getElementById("focusHeroBtn").onclick=openFocusTimer;
  document.getElementById("autoSuggestBtn").onclick=smartMinimum;document.getElementById("completeTodayBtn").onclick=completeToday;document.getElementById("tableStartBtn").onclick=()=>{
    const wrap=document.getElementById("calendarTableWrap");
    if(wrap)wrap.scrollTo({left:0,behavior:"smooth"});
  };
  document.getElementById("jumpTodayBtn").onclick=jumpToday;
  document.getElementById("timerStart").onclick=()=>{if(startTimer())showToast("Focus timer started")};document.getElementById("timerPause").onclick=pauseTimer;document.getElementById("timerFinish").onclick=()=>finishAndSaveTimer(false);document.getElementById("timerReset").onclick=resetTimer;
  document.getElementById("musicPlayPause").onclick=toggleFocusMusic;
  document.getElementById("musicPreset").onchange=e=>changeFocusSound(e.target.value);
  document.getElementById("musicWithTimer").onchange=e=>{focusMusic.withTimer=e.target.checked;saveFocusMusic();setMusicStatus(focusMusic.withTimer?"Focus sound will follow the timer.":"Automatic sound is off. Manual playback still works.");renderMusicControls()};
  document.getElementById("musicVolume").oninput=e=>{focusMusic.volume=Number(e.target.value);saveFocusMusic();if(focusAudioMaster)focusAudioMaster.gain.value=(focusMusic.volume/100)*.34;renderMusicControls()};
  document.getElementById("refreshActivityBtn").onclick=()=>requestActivity(true);
  document.getElementById("exportActivityBtn").onclick=exportDigitalActivity;
  document.getElementById("activityTrackingBtn").onclick=toggleActivityTracking;
  document.getElementById("activityInstallHelpBtn").onclick=showActivityInstallGuide;
  document.getElementById("activityIdleSelect").onchange=e=>updateActivityIdle(e.target.value);
  document.getElementById("refreshRoutineBtn").onclick=()=>{document.getElementById("routineWakeInput").focus();showToast("Optional: confirm your wake-up and sleep times, then create the plan")};
  document.getElementById("routinePlanDate").onchange=()=>{document.getElementById("routinePlanDate").dataset.timesFor="";populatePlannerTimeInputs(true);renderRoutine()};
  document.getElementById("applyPlannerTimes").onclick=applyPlannerTimeInputs;
  document.getElementById("clearPlannerTimes").onclick=clearPlannerTimeInputs;
  document.getElementById("routineCommitments").onclick=e=>{const button=e.target.closest("[data-delete-commitment]");if(button&&confirm("Delete this fixed commitment?"))deleteCommitment(button.dataset.deleteCommitment)};
  document.getElementById("planTodayBtn").onclick=()=>{render21DayPlan();showToast("21-day plan starts today")};
  document.getElementById("routineNextBtn").onclick=openRoutineNext;
  document.getElementById("themeBtn").onclick=()=>{state.profile.theme=state.profile.theme==="dark"?"light":"dark";save();renderAll()};
  document.getElementById("exportBtn").onclick=exportBackup;document.getElementById("csvBtn").onclick=exportCsv;document.getElementById("printBtn").onclick=()=>window.print();document.getElementById("resetMonthBtn").onclick=resetMonth;
  document.getElementById("importBtn").onclick=()=>document.getElementById("importFile").click();
  document.getElementById("importFile").onchange=async e=>{try{const x=JSON.parse(await e.target.files[0].text());if(!x.months)throw 0;const lib=x.library||{};state={profile:{...DEFAULTS.profile,...x.profile},settings:{...DEFAULTS.settings,...x.settings},weights:{...DEFAULTS.weights,...x.weights},months:x.months,library:{books:Array.isArray(lib.books)?lib.books:clone(DEFAULT_LIBRARY_BOOKS),progress:lib.progress||{},filter:lib.filter||"all"},acceptedBookings:Array.isArray(x.acceptedBookings)?x.acceptedBookings:[],bookingFeedback:x.bookingFeedback||{}};if(Array.isArray(x.diaryEntries)){localStorage.setItem(DIARY_KEY,JSON.stringify(x.diaryEntries));loadDiaryEntries()}save();renderAll();showToast("Backup restored")}catch(err){alert("Invalid backup file.")}e.target.value=""};
  document.getElementById("celebrationToggle").onclick=()=>{state.profile.celebrations=!state.profile.celebrations;save();renderSettings()};
  document.getElementById("coachToggle").onclick=()=>{state.profile.coach=!state.profile.coach;save();renderAll()};
  attachLibraryEvents();
  attachBookingEvents();
  document.addEventListener("click",e=>{
    if(e.target.classList.contains("preset"))setTodayField(e.target.dataset.field,Number(e.target.dataset.value));
    if(e.target.classList.contains("seg"))setTodayField(e.target.dataset.field,e.target.dataset.value);
    if(e.target.dataset.timerMode)setTimerMode(e.target.dataset.timerMode);
    if(e.target.dataset.duration)setTimerDuration(Number(e.target.dataset.duration));
    if(e.target.dataset.routineMode){
      state.profile.routineMode=e.target.dataset.routineMode;
      save();
      renderRoutine();
    }
    if(e.target.dataset.focus){
      if(timer.running||timer.elapsed>0){
        showToast("Finish or reset the current session before changing its study habit");
      }else{
        timer.focus=e.target.dataset.focus;
        saveFocusTimer();
        renderFocus();
      }
    }
    if(e.target.classList.contains("heat-day")&&e.target.dataset.day!==undefined){showTab("calendar");setTimeout(()=>document.getElementById(`row-${e.target.dataset.day}`)?.scrollIntoView({behavior:"smooth",block:"center"}),70)}
    if(e.target.classList.contains("modal-backdrop"))hideModal(e.target.id);
  });
  document.getElementById("goalCheckinGrid").addEventListener("input",e=>{if(e.target.dataset.goalRange)setTodayField(e.target.dataset.goalRange,Number(e.target.value))});
  ["sleepTime","wakeTime"].forEach((id,j)=>document.getElementById(id).onchange=e=>setTodayField(j?"wake":"sleep",e.target.value));
  document.getElementById("notes").oninput=e=>{ensureMonth()[todayIndex()].notes=e.target.value;save();renderTodayPreview()};
  document.getElementById("dataBody").addEventListener("change",e=>{const el=e.target;if(el.dataset.i!==undefined){let v=el.value;if(GOAL_KEYS.includes(el.dataset.f))v=Number(v)||0;ensureMonth()[+el.dataset.i][el.dataset.f]=v;save();renderAll()}});
  document.getElementById("dataBody").addEventListener("input",e=>{const el=e.target;if(el.dataset.i!==undefined&&el.dataset.f==="notes"){ensureMonth()[+el.dataset.i].notes=el.value;save()}});
  document.addEventListener("change",e=>{
    const el=e.target;
    if(el.dataset.activityDomain)updateActivityCategory(el.dataset.activityDomain,el.value);
    if(el.id==="customDuration")setTimerDuration(Number(el.value));
    if(el.dataset.weight){state.weights[el.dataset.weight]=Number(el.value)||0;save();renderAll()}
    if(el.dataset.goalTarget){state.settings.goalTargets[el.dataset.goalTarget]=Number(el.value)||GOAL_MAP[el.dataset.goalTarget].target;save();renderAll()}
    if(["targetSleep","shortBelow","longAbove","preferredSleep","preferredWake","tolerance","missionThreshold"].includes(el.id)){state.settings[el.id]=el.type==="number"?Number(el.value):el.value;save();renderAll()}
    if(el.id==="userName"){state.profile.name=el.value||"Pratik";save();renderAll()}
    if(el.id==="monthlyTarget"){state.profile.monthlyTarget=Number(el.value)||1000;save();renderAll()}
  });
  window.addEventListener("resize",()=>{clearTimeout(window.__r);window.__r=setTimeout(()=>{renderDashboard()},100)});
}
async function startApp(){
  await loadComponents();
  ensureMonth();
  attachEvents();
  initDiary();
  initMotivationalQuotes();
  renderAll();
  restoreRunningTimer();
  setTimeout(()=>requestActivity(false),700);
  setInterval(()=>{if(document.getElementById("activity")?.classList.contains("active"))requestActivity(false)},30000);
}

if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
startApp().catch(showStartupError);
