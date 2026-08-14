function smartMetrics(data=currentData()){
  const logged=data.filter(x=>x.logged),recent=recentLogged(data),prev=logged.slice(-14,-7);
  const completion=logged.length?avg(logged.map(x=>x.completion)):0;
  const recentCompletion=recent.length?avg(recent.map(x=>x.completion)):completion;
  const prevCompletion=prev.length?avg(prev.map(x=>x.completion)):recentCompletion;
  const sleepRows=data.filter(x=>x.sleepHours!=null),recentSleep=recent.filter(x=>x.sleepHours!=null);
  const avgSleep=sleepRows.length?avg(sleepRows.map(x=>x.sleepHours)):null;
  const sleepScore=recentSleep.length?avg(recentSleep.map(x=>x.sleepScore)):50;
  const current=[...data].reverse().find(x=>x.logged)?.streak||0,best=Math.max(0,...data.map(x=>x.streak));
  const careerKeys=["audiPrep","systemDesign","courseraML"];
  const discipline=logged.length?avg(logged.map(x=>avg(careerKeys.map(key=>Math.min((Number(x[key])||0)/goalTarget(key),1))))):0;
  const readiness=logged.length?Math.round(clamp(recentCompletion*62+sleepScore*.25+Math.min(current,7)/7*13,0,100)):0;
  const total=data.reduce((a,x)=>a+x.reward,0),projection=logged.length?total/logged.length*data.length:0;
  return {logged,recent,completion,recentCompletion,prevCompletion,avgSleep,sleepScore,current,best,discipline,readiness,total,projection};
}

function habitScores(data=currentData()){
  const logged=data.filter(x=>x.logged);
  return GOALS.map(goal=>[goal.label,avg(logged.map(x=>Math.min((Number(x[goal.key])||0)/goalTarget(goal.key),1)))]);
}

function coachData(data=currentData()){
  const m=smartMetrics(data),scores=habitScores(data).sort((a,b)=>a[1]-b[1]),today=data[todayIndex()]||data[0],items=[];
  if(!state.profile.coach)return {headline:"Smart Coach is paused in Settings.",items:[]};
  if(!m.logged.length)return {headline:`${state.profile.name}, turn the broad plan into one completed block.`,items:[
    ["Start with the career anchor","Spend 25 minutes preparing for your role at Audi."],
    ["Protect the nearest deadline","Schedule one Coursera Machine Learning Course block today."],
    ["Keep language momentum","Complete a short German Language Learning or Spoken English Practice block."]
  ]};
  const weak=scores[0],second=scores[1];
  if(today&&!today.logged)items.push(["Create today's first win","Start one 20-minute block on the highest-priority goal."]);
  if(weak&&weak[1]<.65)items.push([`Repair ${weak[0]}`,`It is your lowest consistency area at ${Math.round(weak[1]*100)}%. Make the next action small and concrete.`]);
  if(second&&second[1]<.7)items.push([`Support ${second[0]}`,"Put it directly after an existing routine instead of waiting for motivation."]);
  if(m.avgSleep!=null&&m.avgSleep<state.settings.shortBelow)items.push(["Recover your sleep debt",`Your average is ${m.avgSleep.toFixed(1)}h. Move bedtime 30 minutes earlier tonight.`]);
  if(m.current===0)items.push(["Restart the 21-day rhythm","A minimum focused day today is more valuable than a perfect plan tomorrow."]);
  while(items.length<3)items.push(["Use the two-minute rule","Open the material and do the first two minutes. Starting is the highest-friction step."]);
  const headline=m.recentCompletion>=.85?"You are operating at a high level. Protect recovery and consistency.":m.recentCompletion>=.65?"Momentum is working. Fix one weak link next.":"Reduce friction, not ambition. Build a minimum day you can repeat.";
  return {headline,items:items.slice(0,3)};
}
