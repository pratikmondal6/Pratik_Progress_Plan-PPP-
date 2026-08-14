function renderDashboard(){
  const data=currentData(),m=smartMetrics(data),logged=m.logged;
  setText("monthLabel",monthLabel());setText("totalPoints",m.total.toFixed(1).replace(".0",""));setText("rewardLevel",rewardLevel(m.total));
  setText("completion",Math.round(m.completion*100)+"%");setText("currentStreak",m.current);setText("avgSleep",m.avgSleep==null?"—":m.avgSleep.toFixed(1));
  setText("disciplineScore",Math.round(m.discipline*100));
  const compDelta=(m.recentCompletion-m.prevCompletion)*100;
  setTrend("completionTrend",compDelta,compDelta===0?"Stable":`${compDelta>0?"+":""}${Math.round(compDelta)}% vs prior week`);
  const recentPts=m.recent.length?avg(m.recent.map(x=>x.reward)):0,oldPts=logged.slice(-14,-7).length?avg(logged.slice(-14,-7).map(x=>x.reward)):recentPts;
  setTrend("pointsTrend",recentPts-oldPts,recentPts===oldPts?"Stable pace":`${recentPts>oldPts?"+":""}${(recentPts-oldPts).toFixed(1)} avg/day`);
  setTrend("streakStatus",m.current?3:logged.length?-3:0,m.current?`${m.current} day momentum`:logged.length?"Restart today":"Ready to start");
  const recentSleep=m.recent.filter(x=>x.sleepHours!=null),oldSleep=logged.filter(x=>x.sleepHours!=null).slice(-14,-7);
  const sleepDelta=recentSleep.length&&oldSleep.length?avg(recentSleep.map(x=>x.sleepHours))-avg(oldSleep.map(x=>x.sleepHours)):0;
  setTrend("sleepTrend",sleepDelta,m.avgSleep==null?"No sleep data":sleepDelta===0?"Stable rhythm":`${sleepDelta>0?"+":""}${sleepDelta.toFixed(1)}h trend`);
  setTrend("disciplineTrend",m.discipline>=.8?3:m.discipline<.55?-3:0,m.discipline>=.8?"Strong baseline":m.discipline<.55?"Needs protection":"Building consistency");
  setText("readinessScore",m.readiness);document.getElementById("readinessRing").style.strokeDashoffset=490.09*(1-m.readiness/100);
  setText("forecastPoints",Math.round(m.projection));document.getElementById("forecastBar").style.width=Math.min(100,m.projection/state.profile.monthlyTarget*100)+"%";
  setText("forecastText",logged.length?`At this pace: ${Math.round(m.projection)} / ${state.profile.monthlyTarget} target points.`:"Log a few days to generate a forecast.");
  const risk=m.current===0&&logged.length?"High":m.recentCompletion<.55&&logged.length?"Medium":"Low";
  setText("riskLevel",risk);setText("riskText",risk==="High"?"Your streak is inactive. Complete a minimum mission day today.":risk==="Medium"?"Recent completion is low. Shrink today's plan and finish it.":"Momentum is currently protected.");
  const coachingHistory=rollingData(90),coach=coachData(coachingHistory);setText("coachHeadline",coach.headline);
  document.getElementById("coachPriorities").innerHTML=coach.items.map((x,i)=>`<div class="ai-item"><div class="ai-num">${i+1}</div><div><strong>${x[0]}</strong><span>${x[1]}</span></div></div>`).join("");
  renderHabitCoach(coachingHistory);
  renderHabitBars(data);renderHeatmap(data);renderAchievements(data);drawWeekly(data);drawSleep(data);renderMiniAchievements(data);renderInsights(data);
}
function renderHabitCoach(data=currentData()){
  const plan=habitCoachPlan(data);setText("habitCoachPhase",plan.phase);setText("habitCoachSummary",plan.summary);setText("habitCoachRule",plan.rule);const host=document.getElementById("habitCoachSteps");host.dataset.goal=plan.focus.key;host.dataset.minimum=plan.minimum;host.innerHTML=plan.steps.map(step=>`<article class="habit-coach-step"><span>${escapeHtml(step[0])}</span><strong>${escapeHtml(step[1])}</strong><p>${escapeHtml(step[2])}</p></article>`).join("");
}
function applyHabitCoachMinimum(){const host=document.getElementById("habitCoachSteps"),goal=host?.dataset.goal,minimum=Number(host?.dataset.minimum)||5;if(!GOAL_MAP[goal])return;const now=new Date(),key=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,day=ensureMonth(key)[now.getDate()-1];day[goal]=Math.max(Number(day[goal])||0,minimum);currentMonth=key;save();renderAll();showTab("today");showToast(`${GOAL_MAP[goal].short}: ${minimum}-minute consistency minimum applied`)}
function setTrend(id,val,text){const e=document.getElementById(id);e.textContent=text;e.className=`trend ${trendClass(val)}`}
function renderHabitBars(data){
  document.getElementById("habitBars").innerHTML=habitScores(data).map(([name,v])=>`<div class="progress-row"><div class="progress-name">${name}</div><div class="track"><div class="fill" style="width:${Math.round(v*100)}%"></div></div><div class="pct">${Math.round(v*100)}%</div></div>`).join("");
}
function renderHeatmap(data){
  const first=dayDate(0).getDay(),html=[];
  for(let i=0;i<first;i++)html.push(`<div class="heat-day empty"></div>`);
  const now=new Date();
  data.forEach((d,i)=>{
    const level=!d.logged?0:d.completion>=.85?4:d.completion>=.65?3:d.completion>=.4?2:1;
    const isToday=dayDate(i).toDateString()===now.toDateString();
    html.push(`<div class="heat-day ${level?`heat-${level}`:""} ${isToday?"today":""}" data-day="${i}" title="${dateLabel(dayDate(i))}: ${d.logged?Math.round(d.completion*100)+"%":"Not logged"}">${i+1}</div>`);
  });
  document.getElementById("heatmap").innerHTML=html.join("");
}
function achievementsData(data){
  const m=smartMetrics(data),scores=habitScores(data),sleep=data.filter(x=>x.sleepHours!=null);
  return [
    ["🌱","First Step",m.logged.length>=1],
    ["🔥","7-Day Streak",m.best>=7],
    ["🇩🇪","German 300",data.reduce((a,x)=>a+(Number(x.german)||0),0)>=300],
    ["🚘","Audi Ready",data.reduce((a,x)=>a+(Number(x.audiPrep)||0),0)>=300],
    ["🎓","ML Momentum",data.reduce((a,x)=>a+(Number(x.courseraML)||0),0)>=240],
    ["🌙","Sleep Rhythm",data.filter(x=>x.sleepStatus==="On track").length>=5],
    ["💯","90% Day",data.some(x=>x.completion>=.9)],
    ["👑","Beast Month",m.total>=state.profile.monthlyTarget]
  ];
}
function renderAchievements(data){
  document.getElementById("achievements").innerHTML=achievementsData(data).map(([emoji,name,on])=>`<div class="achievement ${on?"unlocked":""}"><div class="emoji">${emoji}</div><div class="name">${name}</div></div>`).join("");
}
function renderMiniAchievements(data){
  document.getElementById("achievementMini").innerHTML=achievementsData(data).filter(x=>x[2]).slice(-3).map(x=>`<div class="achievement unlocked" style="width:76px;padding:7px"><div class="emoji">${x[0]}</div><div class="name">${x[1]}</div></div>`).join("")||`<span class="k-sub">Your first achievement is one completed day.</span>`;
}
function canvasSetup(id){
  const c=document.getElementById(id),r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;
  c.width=Math.max(320,r.width)*d;c.height=Math.max(240,r.height)*d;const ctx=c.getContext("2d");ctx.scale(d,d);return {ctx,w:c.width/d,h:c.height/d};
}
function roundRect(ctx,x,y,w,h,r){if(h<0){y+=h;h=-h}r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function drawWeekly(data){
  const {ctx,w,h}=canvasSetup("weeklyChart"),len=data.length,weeks=[];for(let a=0;a<len;a+=7)weeks.push([a,Math.min(a+7,len)]);
  const vals=weeks.map(([a,b])=>data.slice(a,b).reduce((s,x)=>s+x.reward,0)),max=Math.max(10,...vals)*1.18;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle=getCss("--line");ctx.beginPath();ctx.moveTo(42,15);ctx.lineTo(42,h-35);ctx.lineTo(w-10,h-35);ctx.stroke();
  const slot=(w-60)/weeks.length,bw=Math.min(50,slot*.55);
  vals.forEach((v,i)=>{const bh=(h-60)*v/max,x=48+i*slot+(slot-bw)/2,y=h-35-bh,g=ctx.createLinearGradient(0,y,0,h-35);g.addColorStop(0,getCss("--gold"));g.addColorStop(1,getCss("--orange"));ctx.fillStyle=g;roundRect(ctx,x,y,bw,bh,9);ctx.fill();ctx.fillStyle=getCss("--text");ctx.textAlign="center";ctx.font="800 12px system-ui";ctx.fillText(v.toFixed(0),x+bw/2,Math.max(14,y-5));ctx.fillStyle=getCss("--muted");ctx.fillText(`W${i+1}`,x+bw/2,h-14)});
}
function drawSleep(data){
  const {ctx,w,h}=canvasSetup("sleepChart"),pts=data.map((x,i)=>x.sleepHours==null?null:{i,v:x.sleepHours}),valid=pts.filter(Boolean),min=4,max=12,toX=i=>43+i*(w-58)/(data.length-1||1),toY=v=>h-35-(v-min)/(max-min)*(h-55);
  ctx.clearRect(0,0,w,h);ctx.strokeStyle=getCss("--line");ctx.beginPath();ctx.moveTo(42,15);ctx.lineTo(42,h-35);ctx.lineTo(w-10,h-35);ctx.stroke();
  ctx.fillStyle=getCss("--muted");ctx.font="11px system-ui";ctx.textAlign="right";[4,6,8,10,12].forEach(v=>ctx.fillText(v,36,toY(v)+4));
  ctx.strokeStyle=getCss("--gold");ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(42,toY(state.settings.targetSleep));ctx.lineTo(w-10,toY(state.settings.targetSleep));ctx.stroke();ctx.setLineDash([]);
  if(valid.length){ctx.strokeStyle=getCss("--purple");ctx.lineWidth=2.5;ctx.beginPath();let active=false;pts.forEach(p=>{if(!p){active=false;return}const x=toX(p.i),y=toY(p.v);if(!active){ctx.moveTo(x,y);active=true}else ctx.lineTo(x,y)});ctx.stroke();valid.forEach(p=>{ctx.fillStyle=getCss("--cyan");ctx.beginPath();ctx.arc(toX(p.i),toY(p.v),3.8,0,Math.PI*2);ctx.fill()})}
  else{ctx.fillStyle=getCss("--muted");ctx.textAlign="center";ctx.font="700 13px system-ui";ctx.fillText("Sleep data will appear here",w/2,h/2)}
}
function drawSleepPerformance(data){
  const {ctx,w,h}=canvasSetup("sleepPerformanceChart"),pts=data.filter(x=>x.sleepHours!=null&&x.logged),toX=v=>42+(v-4)/8*(w-57),toY=v=>h-35-v*(h-55);
  ctx.clearRect(0,0,w,h);ctx.strokeStyle=getCss("--line");ctx.beginPath();ctx.moveTo(42,15);ctx.lineTo(42,h-35);ctx.lineTo(w-10,h-35);ctx.stroke();
  ctx.fillStyle=getCss("--muted");ctx.font="11px system-ui";ctx.textAlign="center";[4,6,8,10,12].forEach(v=>ctx.fillText(v,toX(v),h-15));
  pts.forEach(p=>{ctx.fillStyle=p.mission?getCss("--green"):getCss("--purple");ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(toX(clamp(p.sleepHours,4,12)),toY(p.completion),5,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
  if(!pts.length){ctx.fillStyle=getCss("--muted");ctx.fillText("Need sleep + habit data",w/2,h/2)}
}
function getCss(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function renderToday(){
  const i=todayIndex(),d=ensureMonth()[i],dt=dayDate(i);setText("todaySubtitle",`${dt.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})} • Autosaved`);
  document.getElementById("goalCheckinGrid").innerHTML=GOALS.map(goal=>`<div class="input-card glass"><h3>${goal.icon} ${goal.label}</h3>${goal.milestone?`<div class="goal-milestone">${goal.milestone}</div>`:""}<div class="minute-display" id="${goal.key}Display">${Number(d[goal.key])||0}m</div><input type="range" min="0" max="240" step="5" value="${Number(d[goal.key])||0}" data-goal-range="${goal.key}"><div class="preset-row">${[0,15,30,45,60,90].map(v=>`<button class="preset ${Number(d[goal.key])===v?"active":""}" data-field="${goal.key}" data-value="${v}">${v}</button>`).join("")}</div></div>`).join("");
  document.getElementById("sleepTime").value=d.sleep;document.getElementById("wakeTime").value=d.wake;document.getElementById("notes").value=d.notes;
  renderTodayPreview();
}
function bindMinute(field,value,presets){
  const range=document.getElementById(field+"Range"),disp=document.getElementById(field+"Display");range.value=value;disp.textContent=value+"m";
  const row=document.querySelector(`[data-minute="${field}"]`);row.innerHTML=presets.map(v=>`<button class="preset ${Number(value)===v?"active":""}" data-field="${field}" data-value="${v}">${v}</button>`).join("");
}
function renderSegments(d){
  document.querySelectorAll(".segment").forEach(row=>{const f=row.dataset.status,opts=row.dataset.binary?BINARY:STATUS;row.innerHTML=opts.slice(1).map(v=>`<button class="seg ${d[f]===v?"active":""}" data-field="${f}" data-value="${v}">${v}</button>`).join("")});
}
function renderTodayPreview(){
  const c=currentData()[todayIndex()],sl=sleepCalc(ensureMonth()[todayIndex()]);
  setText("todayScorePreview",`${c.points.toFixed(1)} points • ${Math.round(c.completion*100)}% completion${c.mission?" • Mission Day ✓":""}`);
  setText("sleepPreview",sl.hours==null?"Enter both times to calculate duration.":`${sl.hours.toFixed(1)} hours • ${sl.status}`);
}
function setTodayField(field,value){
  ensureMonth()[todayIndex()][field]=value;save();renderToday();renderDashboard();renderCalendar();
}
function renderCalendar(){
  const data=currentData(),now=new Date();
  document.getElementById("calendarHeadRow").innerHTML=`<th>Date</th><th>Day</th>${GOALS.map(goal=>`<th title="${goal.label}">${goal.short}</th>`).join("")}<th>Sleep</th><th>Wake</th><th>Duration</th><th>Status</th><th>Notes</th><th>Points</th><th>Completion</th><th>Mission</th><th>Streak</th><th>Reward</th>`;
  document.getElementById("dataBody").innerHTML=data.map((d,i)=>{const dt=dayDate(i),isToday=dt.toDateString()===now.toDateString();
    return `<tr id="row-${i}" class="${isToday?"today-row":""}">
      <td>${dateLabel(dt)}</td><td>${dt.toLocaleDateString(undefined,{weekday:"short"})}</td>
      ${GOALS.map(goal=>`<td><input type="number" min="0" max="480" step="5" value="${Number(d[goal.key])||0}" data-i="${i}" data-f="${goal.key}"></td>`).join("")}
      <td><input type="time" value="${d.sleep}" data-i="${i}" data-f="sleep"></td><td><input type="time" value="${d.wake}" data-i="${i}" data-f="wake"></td>
      <td>${d.sleepHours==null?"":d.sleepHours.toFixed(1)+"h"}</td><td>${badge(d.sleepStatus)}</td>
      <td><input type="text" value="${escapeHtml(d.notes)}" data-i="${i}" data-f="notes" style="min-width:180px"></td>
      <td><strong>${d.logged?d.points.toFixed(1):""}</strong></td><td>${d.logged?Math.round(d.completion*100)+"%":""}</td><td>${badge(d.mission?"YES":d.logged?"NO":"")}</td><td>${d.logged?d.streak:""}</td><td><strong>${d.logged?d.reward.toFixed(1):""}</strong></td>
    </tr>`}).join("");
}
function selectCell(value,options,i,f){return `<select data-i="${i}" data-f="${f}">${options.map(x=>`<option ${x===value?"selected":""}>${x}</option>`).join("")}</select>`}
function renderInsights(data=currentData()){
  const m=smartMetrics(data),scores=habitScores(data).sort((a,b)=>a[1]-b[1]),review=[],optimizer=[],plan=[];
  if(!m.logged.length){
    review.push(["No data yet","Complete your first check-in. Insights become smarter after 3–7 logged days."]);
    optimizer.push(["Start with the core","Audi preparation, the Coursera deadline, and one language block create the foundation."]);
    plan.push(["Day 1 plan","25 minutes of Audi preparation, 20 minutes of the Coursera ML course, and 15 minutes of German language learning."]);
  }else{
    review.push(["Strongest habit",`${scores[scores.length-1][0]} is leading at ${Math.round(scores[scores.length-1][1]*100)}%. Use it as an anchor routine.`]);
    review.push(["Weakest habit",`${scores[0][0]} is lowest at ${Math.round(scores[0][1]*100)}%. Reduce the starting step instead of avoiding it.`]);
    review.push(["Momentum",`Recent completion is ${Math.round(m.recentCompletion*100)}%, ${m.recentCompletion>=m.prevCompletion?"up or stable":"down"} versus the previous period.`]);
    optimizer.push(["Friction diagnosis",scores[0][1]<.4?`${scores[0][0]} is probably too difficult, unclear, or badly timed. Attach it to a fixed daily cue.`:`${scores[0][0]} needs a visible reminder and a smaller minimum.`]);
    optimizer.push(["Best leverage",`Improving ${scores[0][0]} by one level has more value than polishing your strongest habit.`]);
    optimizer.push(["Minimum viable day","20 minutes of Audi preparation, 20 minutes of the Coursera ML course, and 15 minutes of language learning."]);
    plan.push(["Tomorrow setup","Prepare the Audi, System Design, or Coursera material for the first priority block."]);
    plan.push(["Sleep action",m.avgSleep==null?"Log sleep and wake time to connect recovery with performance.":m.avgSleep<state.settings.shortBelow?"Move bedtime 30 minutes earlier.":"Keep wake time consistent within your tolerance window."]);
    plan.push(["Monthly target",`Current forecast is ${Math.round(m.projection)} points. Target is ${state.profile.monthlyTarget}.`]);
  }
  document.getElementById("weeklyReview").innerHTML=insightsHtml(review);document.getElementById("habitOptimizer").innerHTML=insightsHtml(optimizer);document.getElementById("nextPlan").innerHTML=insightsHtml(plan);
  const sleepRows=data.filter(x=>x.sleepHours!=null&&x.logged),good=sleepRows.filter(x=>x.sleepHours>=state.settings.shortBelow&&x.sleepHours<=state.settings.longAbove),bad=sleepRows.filter(x=>!good.includes(x));
  setText("sleepCorrelationText",sleepRows.length<4?"Log at least 4 sleep nights to compare recovery and performance.":`Healthy-range sleep days average ${Math.round(avg(good.map(x=>x.completion))*100||0)}% completion versus ${Math.round(avg(bad.map(x=>x.completion))*100||0)}% outside the range.`);
  drawSleepPerformance(data);
}
function insightsHtml(rows){return rows.map(x=>`<div class="insight"><strong>${x[0]}</strong><p>${x[1]}</p></div>`).join("")}
