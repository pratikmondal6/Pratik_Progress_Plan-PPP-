const MOTIVATIONAL_QUOTES=[
  "Fall in love with the process, and the results will follow.",
  "The Audi role is not one distant event; it is built in today’s focused hour.",
  "Prepare so consistently that your first day at Audi feels like the next natural step.",
  "Career confidence grows from evidence—create one visible result today.",
  "Every technical concept you master becomes calm confidence in the room.",
  "Your future role deserves today’s preparation, not tomorrow’s pressure.",
  "You do not need to feel ready; you need to keep becoming ready.",
  "Professional growth is a collection of ordinary sessions completed with care.",
  "Build the skills now that your future teammates will depend on later.",
  "Let the Audi milestone guide your direction without stealing today’s peace.",
  "System design becomes simple when you learn one trade-off at a time.",
  "Do not memorize architecture—learn to explain why each decision belongs.",
  "A diagram drawn from memory teaches more than another hour of passive watching.",
  "Study the system, question the bottleneck, and make the trade-off visible.",
  "Strong engineers turn complicated systems into clear conversations.",
  "One design problem solved deeply is worth many solutions skimmed quickly.",
  "Your technical depth grows whenever you stay with confusion a little longer.",
  "Architecture confidence begins with asking better questions.",
  "Learn the principle, test it with an example, then explain it simply.",
  "Today’s small technical note can become tomorrow’s interview answer.",
  "The Coursera deadline is a guide for steady action, not a reason for panic.",
  "Finish one lesson, retrieve three ideas, and turn learning into memory.",
  "A completed quiz is stronger evidence than an open course tab.",
  "Machine learning becomes useful when theory meets one practical example.",
  "Progress through the course in sessions, not in promises.",
  "Protect the deadline by finishing early enough to review with a calm mind.",
  "Close the notes and recall what you learned—that is where memory strengthens.",
  "Certificates mark completion; applied understanding marks growth.",
  "One focused course block today keeps the October goal under control.",
  "Learn, retrieve, practice, reflect—then let the learning settle.",
  "Every German sentence spoken imperfectly is a step toward speaking naturally.",
  "Do not wait for perfect grammar before using the language you already know.",
  "Twenty honest minutes of German can change what feels possible in a year.",
  "A short story read with attention builds vocabulary, rhythm, and courage.",
  "Speak English to communicate, not to prove that every sentence is perfect.",
  "Language confidence is built by returning after every awkward attempt.",
  "Learn fewer words today and use them more often.",
  "A conversation is practice, progress, and connection at the same time.",
  "Read slowly enough to notice, and often enough to grow.",
  "Your voice becomes clearer every time you choose practice over embarrassment.",
  "The minimum day protects your identity when the perfect day is unavailable.",
  "Consistency is not never missing; it is returning without drama.",
  "Start with five minutes—the mind often follows the body into motion.",
  "Discipline becomes lighter when the next action is obvious and small.",
  "A difficult day still counts when you protect one meaningful commitment.",
  "Measure progress honestly, then use the result as guidance rather than judgment.",
  "Your streak is useful, but your ability to restart is more powerful.",
  "Finish the smallest valuable action before searching for more motivation.",
  "Momentum grows when promises to yourself become visible behavior.",
  "Today does not need to be impressive; it needs to be real.",
  "Sleep is preparation for tomorrow, not time stolen from achievement.",
  "A balanced life makes focused work repeatable.",
  "Rest before exhaustion turns every simple task into a battle.",
  "Protect meals, movement, relationships, and quiet—the plan must support a life.",
  "Recovery is productive when it helps you return with attention.",
  "Write the truth about your day, then use it to design a kinder tomorrow.",
  "Celebrate what worked before correcting what did not.",
  "You can pursue an ambitious future without punishing the person building it.",
  "A calm evening is part of a strong morning.",
  "Build a life where progress, health, learning, and connection can stay together."
];
let motivationalQuoteIndex=Math.floor(Date.now()/86400000)%MOTIVATIONAL_QUOTES.length,motivationalQuoteTimer=null;
function showMotivationalQuote(index,motion=true){
  const quote=document.getElementById("heroQuote"),text=document.getElementById("heroQuoteText"),count=document.getElementById("heroQuoteCount");if(!quote||!text||!count)return;
  motivationalQuoteIndex=(index+MOTIVATIONAL_QUOTES.length)%MOTIVATIONAL_QUOTES.length;
  const update=()=>{text.textContent=MOTIVATIONAL_QUOTES[motivationalQuoteIndex];count.textContent=`${motivationalQuoteIndex+1} / ${MOTIVATIONAL_QUOTES.length}`;quote.classList.remove("quote-changing")};
  if(motion){quote.classList.add("quote-changing");setTimeout(update,220)}else update();
}
function initMotivationalQuotes(){
  clearInterval(motivationalQuoteTimer);showMotivationalQuote(motivationalQuoteIndex,false);
  motivationalQuoteTimer=setInterval(()=>showMotivationalQuote(motivationalQuoteIndex+1),5000);
}
