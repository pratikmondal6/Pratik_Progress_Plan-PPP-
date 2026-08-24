(() => {
  "use strict";

  const STORE_KEY = "pppNextDayPlanner_v2";
  const LEGACY_KEY = "pppNextDayPlanner_v1";
  const BOOKING_CONFIG_KEY = "pppSharedBooking_v1";
  const milestones = [
    { days: 3, label: "Momentum", icon: "⚡", bonus: 50 },
    { days: 7, label: "One Week", icon: "🔥", bonus: 100 },
    { days: 14, label: "Consistency", icon: "💎", bonus: 200 },
    { days: 21, label: "Planner", icon: "🏆", bonus: 350 }
  ];
  const celebrationBits = ["✨", "🎉", "⚡", "🔥", "🌈", "💎", "🚀", "⭐", "🪄"];
  const heroMessages = [
    { lead: "Make tomorrow easier", accent: "before it gets busy.", sub: "Pick 1–3 real priorities, give important work an actual time, and leave enough room for life to happen." },
    { lead: "Decide the important work", accent: "before distractions decide for you.", sub: "Choose the work that would make tomorrow feel worthwhile, then protect a realistic block for it." },
    { lead: "Plan less.", accent: "Finish more.", sub: "A short list you can complete is more useful than a perfect list you will ignore by noon." },
    { lead: "Give your best hour", accent: "to your hardest useful task.", sub: "Put demanding work where your energy is strongest instead of hoping motivation appears later." },
    { lead: "Tomorrow needs priorities,", accent: "not pressure.", sub: "Pick a few meaningful outcomes and leave enough slack for interruptions, travel, food, and recovery." },
    { lead: "Put it on the clock", accent: "or admit it is only a wish.", sub: "If something matters, give it a real start time or a clear place in the day." },
    { lead: "Start with what moves life forward,", accent: "not what feels easiest.", sub: "Handle one high-value task before small requests and low-effort work consume the day." },
    { lead: "Build a day", accent: "your real self can actually live.", sub: "Plan for normal energy, normal interruptions, and normal human limits—not an imaginary perfect version of you." },
    { lead: "Leave empty space", accent: "on purpose.", sub: "A useful plan includes transitions, delays, meals, rest, and the unexpected—not just work blocks." },
    { lead: "One clear win", accent: "can change the whole day.", sub: "Choose the single result that would make tomorrow feel productive even if everything else shifts." },
    { lead: "Do not schedule every minute.", accent: "Protect the important ones.", sub: "Use structure for priorities and breathing room for everything life will add without asking." },
    { lead: "Make the first step", accent: "too small to avoid.", sub: "Define the opening action clearly: open the document, write the first paragraph, send the first message." },
    { lead: "Your calendar shows", accent: "what your priorities really are.", sub: "Give important work actual space instead of relying on a vague intention to do it later." },
    { lead: "Finish tomorrow tonight", accent: "by removing decisions.", sub: "Choose what matters, when it starts, and what 'done enough' looks like before the day begins." },
    { lead: "Plan around energy,", accent: "not only availability.", sub: "Put thinking-heavy work when you are sharp and lighter tasks when your energy usually drops." },
    { lead: "A realistic plan", accent: "beats an ambitious fantasy.", sub: "Keep enough capacity for delays and low-energy moments so the plan survives contact with real life." },
    { lead: "If everything is urgent,", accent: "nothing is prioritized.", sub: "Mark only a few true priorities and let the rest stay flexible." },
    { lead: "Protect your morning", accent: "from accidental priorities.", sub: "Do something chosen before email, messages, and other people’s requests take control." },
    { lead: "Make progress visible", accent: "before motivation disappears.", sub: "Break a large task into a concrete first step and a block you can actually finish tomorrow." },
    { lead: "Schedule recovery", accent: "like it matters—because it does.", sub: "Rest, meals, movement, and transitions are part of a sustainable day, not failures of productivity." },
    { lead: "Do the thinking now", accent: "so tomorrow can be simpler.", sub: "A few minutes of planning tonight can remove dozens of tiny decisions tomorrow." },
    { lead: "Choose what to ignore", accent: "as carefully as what to do.", sub: "A useful plan has boundaries. Some tasks can wait without becoming emergencies." },
    { lead: "Your plan can change", accent: "without becoming a failure.", sub: "When reality changes, reschedule deliberately instead of abandoning the entire day." },
    { lead: "Give hard work", accent: "a protected beginning.", sub: "Starting is easier when the time, place, and first action are already decided." },
    { lead: "Three meaningful tasks", accent: "are enough for a strong day.", sub: "Add appointments and small chores around them, but do not confuse a long list with progress." },
    { lead: "Stop carrying tomorrow", accent: "in your head.", sub: "Capture tasks, appointments, and plans here so your brain can stop rehearsing them tonight." },
    { lead: "A calm day starts", accent: "with fewer open loops.", sub: "Write down what needs attention, decide what belongs tomorrow, and let the rest wait." },
    { lead: "Make room for friction", accent: "before friction arrives.", sub: "Add buffer between demanding blocks so one delay does not destroy the rest of the schedule." },
    { lead: "Treat focus like an appointment", accent: "with your future self.", sub: "Protect a real block for meaningful work instead of giving it whatever time is left." },
    { lead: "Do not chase a perfect day.", accent: "Build a useful one.", sub: "A good plan helps you move forward even when energy, mood, and circumstances are ordinary." },
    { lead: "Give tomorrow a shape", accent: "without filling every corner.", sub: "Anchor the day with priorities and appointments, then leave flexible space around them." },
    { lead: "Make the difficult task", accent: "easy to begin.", sub: "Prepare the file, location, materials, or first action tonight so tomorrow starts with less resistance." },
    { lead: "Your future self needs", accent: "fewer decisions, not more motivation.", sub: "Pre-decide the first important task and the time you will begin it." },
    { lead: "Plan the bottleneck", accent: "before the easy work.", sub: "Identify what could block progress tomorrow and give it attention while you still have energy." },
    { lead: "Do one thing completely", accent: "before starting five more.", sub: "Use focused blocks to reduce switching and finish meaningful chunks of work." },
    { lead: "A schedule is a guide,", accent: "not a courtroom.", sub: "Use it to make better choices, then adjust without guilt when real life changes the sequence." },
    { lead: "Make tomorrow specific", accent: "enough to start.", sub: "Replace 'study' with the chapter, 'work' with the deliverable, and 'exercise' with the actual session." },
    { lead: "Put important work", accent: "before optional work.", sub: "Sequence the day so lower-value tasks cannot quietly consume the energy meant for your priorities." },
    { lead: "Reduce tomorrow’s friction", accent: "tonight.", sub: "Prepare what you need, clarify the first move, and remove one obvious distraction in advance." },
    { lead: "Plan with your limits", accent: "instead of fighting them.", sub: "Use realistic durations and energy expectations so the plan can survive a normal day." },
    { lead: "A short plan", accent: "creates room to execute.", sub: "Keep the core list small enough that starting does not feel like facing an entire backlog." },
    { lead: "Tomorrow is not a storage bin", accent: "for everything unfinished.", sub: "Move only what truly deserves tomorrow. Let lower-priority work stay in the backlog." },
    { lead: "Choose your stopping point", accent: "before you start.", sub: "Define what 'enough' means for important work so tasks do not expand to fill the whole day." },
    { lead: "Start the day with intention,", accent: "not reaction.", sub: "Know your first meaningful action before opening messages, feeds, or low-value notifications." },
    { lead: "Give every big task", accent: "a smaller doorway.", sub: "Turn intimidating work into a first action that takes only a few minutes to begin." },
    { lead: "Use time blocks", accent: "to protect—not punish.", sub: "A block is a commitment to focus, not a reason to feel guilty if you need to adjust it." },
    { lead: "Do not borrow energy", accent: "from tomorrow night.", sub: "Avoid packing the day so tightly that every delay must be paid for with lost rest." },
    { lead: "Plan the day you need", accent: "not the day that looks impressive.", sub: "Choose work that actually matters to your goals instead of filling space with visible busyness." },
    { lead: "Make one promise", accent: "you are likely to keep.", sub: "Build trust with yourself through realistic commitments, then expand gradually when consistency is real." },
    { lead: "Protect deep work", accent: "from shallow urgency.", sub: "Give meaningful concentration a block before small administrative work multiplies." },
    { lead: "Schedule the outcome", accent: "not just the activity.", sub: "Write what you intend to finish or move forward, not only the category of work." },
    { lead: "When the day changes,", accent: "re-plan the next decision.", sub: "Do not waste energy mourning a broken schedule. Choose the next best action and continue." },
    { lead: "Create a finishable tomorrow", accent: "instead of an endless one.", sub: "Limit commitments so there is a real point where the day can feel complete." },
    { lead: "Give yourself a buffer", accent: "between roles.", sub: "Leave a few minutes between study, work, errands, and personal time so transitions do not become chaos." },
    { lead: "Put the biggest consequence", accent: "near the top.", sub: "Do the task whose completion—or delay—matters most to your goals, deadlines, or responsibilities." },
    { lead: "Plan for distraction", accent: "instead of pretending it will vanish.", sub: "Reduce obvious triggers and choose where your phone, tabs, or notifications will be during focus blocks." },
    { lead: "Tomorrow does not need hype.", accent: "It needs a clear next step.", sub: "Choose the first useful action and make it easy to begin when the time arrives." },
    { lead: "Use fewer priorities", accent: "with stronger commitment.", sub: "A smaller number of protected goals creates more progress than a long list of weak intentions." },
    { lead: "Make space to think", accent: "before you make space to do.", sub: "Clarify the result you actually want, then choose the work that moves it forward." },
    { lead: "Do tomorrow a favor", accent: "and remove one decision tonight.", sub: "Pick the first task, prepare what you need, or schedule the difficult conversation now." },
    { lead: "Let unfinished work wait", accent: "without turning it into guilt.", sub: "Backlogs are normal. Tomorrow only needs the items that genuinely deserve tomorrow." },
    { lead: "Be ambitious about direction", accent: "and conservative about capacity.", sub: "Aim at meaningful outcomes while keeping the number of commitments realistic." },
    { lead: "Give attention a destination", accent: "before the day starts.", sub: "Choose where your focus should go first so it is not spent entirely on incoming demands." },
    { lead: "Plan the first hour", accent: "better than the whole fantasy day.", sub: "A strong beginning often matters more than a perfectly detailed schedule you will never follow." },
    { lead: "If it matters tomorrow,", accent: "make it visible tonight.", sub: "Put important work, appointments, and preparation into one place so nothing relies on memory alone." },
    { lead: "Leave enough room", accent: "to still be a person.", sub: "A productive day can include food, movement, relationships, recovery, and quiet without apology." },
    { lead: "Make completion easier", accent: "by defining enough.", sub: "Decide what a successful version of the task looks like before perfection expands the scope." },
    { lead: "Choose tomorrow’s trade-offs", accent: "before they choose themselves.", sub: "Every yes uses time. Decide which commitments deserve it and which can move." },
    { lead: "Work from a plan", accent: "not from whatever feels loudest.", sub: "Use your priorities as a filter when messages, requests, and small urgencies start competing." },
    { lead: "Plan one honest day", accent: "at a time.", sub: "You do not need to optimize your whole life tonight. Make tomorrow clear, realistic, and worth showing up for." }
  ];

  let viewDate = tomorrow();
  let itemType = "task";
  let bookingMode = false;
  let toastTimer = null;
  let heroMessageIndex = Math.abs(new Date().getDate() + new Date().getMonth() * 7) % heroMessages.length;
  let heroMessageTimer = null;

  const focusTimer = {
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    deadline: 0,
    interval: null
  };

  function $(id) { return document.getElementById(id); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }
  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function parseDate(key) {
    const [y, m, d] = String(key).split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  function tomorrow() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(12, 0, 0, 0);
    return date;
  }
  function today() {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  }
  function formatDate(date, long = false) {
    return date.toLocaleDateString(undefined, long
      ? { weekday: "long", month: "long", day: "numeric", year: "numeric" }
      : { weekday: "short", month: "short", day: "numeric" });
  }
  function displayDayName(date) {
    const key = dateKey(date);
    if (key === dateKey(tomorrow())) return "Tomorrow";
    if (key === dateKey(today())) return "Today";
    return formatDate(date);
  }
  function uid() {
    return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function safeHttpsUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }
  function bookingServiceUrl() {
    try {
      const fromQuery = safeHttpsUrl(new URLSearchParams(window.location.search).get("booking"));
      if (fromQuery) return fromQuery;
    } catch (_) {}
    try {
      const config = JSON.parse(localStorage.getItem(BOOKING_CONFIG_KEY) || "null") || {};
      return safeHttpsUrl(config.url);
    } catch (_) {
      return "";
    }
  }
  function renderBookingQuick() {
    const url = bookingServiceUrl();
    const input = $("bookingPublicLink");
    const open = $("openPlannerBookingLinkBtn");
    const copy = $("copyPlannerBookingLinkBtn");
    if (input) input.value = url;
    if (open) open.disabled = !url;
    if (copy) copy.disabled = !url;
  }
  function copyBookingLink() {
    const url = bookingServiceUrl();
    if (!url) { showToast("Connect Book with Pratik in PPP Settings first."); return; }
    const input = $("bookingPublicLink");
    const fallback = () => {
      try { input?.focus(); input?.select(); document.execCommand("copy"); showToast("Booking link copied ✓"); }
      catch (_) { showToast("Copy the booking link from the field."); }
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(() => showToast("Booking link copied ✓")).catch(fallback);
    else fallback();
  }
  function openBookingPage(prefill = null) {
    const base = bookingServiceUrl();
    if (!base) { showToast("Plan saved. Connect Book with Pratik in PPP Settings to open the booking page."); return false; }
    let target = base;
    if (prefill) {
      try {
        const url = new URL(base);
        if (prefill.what) url.searchParams.set("what", prefill.what);
        if (prefill.date) url.searchParams.set("date", prefill.date);
        if (prefill.time) url.searchParams.set("time", prefill.time);
        if (prefill.duration) url.searchParams.set("duration", String(prefill.duration));
        if (prefill.note) url.searchParams.set("note", prefill.note);
        url.searchParams.set("type", "Appointment");
        target = url.href;
      } catch (_) {}
    }
    const opened = window.open(target, "_blank", "noopener,noreferrer");
    if (!opened) showToast("Plan saved. Use the Book with Pratik link to finish the booking.");
    return Boolean(opened);
  }

  function emptyData() {
    return { items: [], sealedDays: [], planningLog: [], intentions: {}, sessions: [] };
  }
  function normalizeData(data) {
    const clean = data && typeof data === "object" ? data : emptyData();
    clean.items = Array.isArray(clean.items) ? clean.items : [];
    clean.sealedDays = Array.isArray(clean.sealedDays) ? clean.sealedDays : [];
    clean.planningLog = Array.isArray(clean.planningLog) ? clean.planningLog : [];
    clean.intentions = clean.intentions && typeof clean.intentions === "object" ? clean.intentions : {};
    clean.sessions = Array.isArray(clean.sessions) ? clean.sessions : [];
    return clean;
  }
  function loadData() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) return normalizeData(JSON.parse(stored));
    } catch (_) {}

    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
      if (legacy && Array.isArray(legacy.items)) {
        const migrated = emptyData();
        migrated.items = legacy.items.map(item => ({
          id: item.id || uid(),
          title: item.title || "Untitled",
          date: item.date || dateKey(tomorrow()),
          start: item.start || "",
          end: item.end || "",
          notes: item.notes || "",
          type: ["task", "appointment", "plan"].includes(item.type) ? item.type : "task",
          priority: item.priority || "medium",
          area: item.area || "Personal",
          tinyStep: item.tinyStep || "",
          frog: Boolean(item.frog),
          done: Boolean(item.done),
          createdAt: item.createdAt || Date.now()
        }));
        migrated.sealedDays = [...new Set(migrated.items.map(item => item.date))];
        migrated.planningLog = [...migrated.sealedDays];
        saveData(migrated);
        return migrated;
      }
    } catch (_) {}
    return emptyData();
  }
  function saveData(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(normalizeData(data)));
  }
  function mutate(mutator) {
    const data = loadData();
    mutator(data);
    data.sealedDays = [...new Set(data.sealedDays)].sort();
    data.planningLog = [...new Set(data.planningLog)].sort();
    saveData(data);
    return data;
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function itemsForDate(key = dateKey(viewDate), data = loadData()) {
    return data.items
      .filter(item => item.date === key)
      .sort((a, b) => (a.start || "99:99").localeCompare(b.start || "99:99") || (a.createdAt || 0) - (b.createdAt || 0));
  }
  function itemTypeLabel(type) {
    return type === "appointment" ? "Appointment" : type === "plan" ? "Plan" : "Task";
  }
  function itemTypeIcon(type) {
    return type === "appointment" ? "▣" : type === "plan" ? "✦" : "✓";
  }

  function setType(type) {
    bookingMode = false;
    itemType = ["task", "appointment", "plan"].includes(type) ? type : "task";
    document.querySelectorAll("[data-plan-type]").forEach(button => button.classList.toggle("active", button.dataset.planType === itemType));
    $("bookWithPratikBtn")?.classList.remove("active");
    $("bookingQuick")?.classList.add("hidden");
    const isAppointment = itemType === "appointment";
    $("frogToggle").classList.toggle("hidden", isAppointment);
    $("tinyStepField").classList.toggle("hidden", isAppointment);
    if (isAppointment) $("itemFrog").checked = false;
    if (!$("itemId").value) $("saveItemBtn").textContent = "＋ Add to plan";
  }

  function setBookingMode() {
    bookingMode = true;
    itemType = "appointment";
    document.querySelectorAll("[data-plan-type]").forEach(button => button.classList.remove("active"));
    $("bookWithPratikBtn")?.classList.add("active");
    $("bookingQuick")?.classList.remove("hidden");
    $("frogToggle").classList.add("hidden");
    $("tinyStepField").classList.add("hidden");
    $("itemFrog").checked = false;
    if (!$("itemTitle").value) $("itemTitle").placeholder = "What do you want to book with Pratik?";
    $("itemArea").value = "Relationships";
    $("saveItemBtn").textContent = "＋ Add to plan & Book with Pratik ↗";
    renderBookingQuick();
    $("itemTitle").focus();
  }

  function timeToMinutes(value) {
    if (!value) return null;
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  }
  function itemDuration(item) {
    const start = timeToMinutes(item.start);
    const end = timeToMinutes(item.end);
    return start !== null && end !== null && end > start ? end - start : 0;
  }
  function scheduleHasOverlap(items) {
    const timed = items
      .map(item => ({ start: timeToMinutes(item.start), end: timeToMinutes(item.end) }))
      .filter(block => block.start !== null && block.end !== null && block.end > block.start)
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < timed.length; i++) if (timed[i].start < timed[i - 1].end) return true;
    return false;
  }

  function qualityFor(items) {
    const workItems = items.filter(item => item.type !== "appointment");
    const frog = workItems.find(item => item.frog);
    const highCount = workItems.filter(item => item.priority === "high").length;
    const focusBlock = workItems.some(item => itemDuration(item) >= 25);
    const totalScheduled = items.reduce((sum, item) => sum + itemDuration(item), 0);
    const noOverlap = !scheduleHasOverlap(items);
    const hasMargin = totalScheduled > 0 && totalScheduled <= 10 * 60 && noOverlap;
    const rules = [
      {
        good: Boolean(frog),
        title: "One must-win item",
        detail: frog ? `Your best energy has a target: ${frog.title}.` : "Choose one difficult, high-value task instead of treating everything as equal."
      },
      {
        good: highCount >= 1 && highCount <= 3,
        title: "Three big rocks max",
        detail: highCount === 0 ? "Give at least one meaningful item high priority." : highCount > 3 ? "Too many top priorities dilute focus. Reduce the high-priority list." : `${highCount} big rock${highCount === 1 ? "" : "s"} — focused and realistic.`
      },
      {
        good: Boolean(frog && frog.tinyStep && frog.tinyStep.trim()),
        title: "Tiny first step",
        detail: frog && frog.tinyStep ? `Start with: ${frog.tinyStep}` : "Define a very small first action for the must-win task."
      },
      {
        good: focusBlock,
        title: "Protected focus",
        detail: focusBlock ? "At least one important item has a 25+ minute focus block." : "Reserve at least 25 uninterrupted minutes for meaningful work."
      },
      {
        good: hasMargin,
        title: "Leave breathing room",
        detail: scheduleHasOverlap(items) ? "Two scheduled items overlap. Fix the collision before sealing." : totalScheduled > 10 * 60 ? "The timed plan is overloaded. Reduce it so real life still fits." : totalScheduled === 0 ? "Add time to at least one item so intention becomes a real commitment." : "Your schedule has room for transitions, surprises and recovery."
      }
    ];
    return { score: rules.filter(rule => rule.good).length * 20, rules, frog };
  }

  function streakStats(data = loadData()) {
    const days = [...new Set(data.planningLog)].sort();
    if (!days.length) return { current: 0, best: 0, total: 0 };
    let best = 1;
    let run = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = Math.round((parseDate(days[i]) - parseDate(days[i - 1])) / 86400000);
      run = diff === 1 ? run + 1 : 1;
      best = Math.max(best, run);
    }

    const sealed = new Set(days);
    const todayDate = today();
    const tomorrowDate = tomorrow();
    let cursor = sealed.has(dateKey(tomorrowDate)) ? tomorrowDate : todayDate;
    if (!sealed.has(dateKey(cursor))) {
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);
      cursor = yesterday;
    }
    let current = 0;
    while (sealed.has(dateKey(cursor))) {
      current += 1;
      const previous = new Date(cursor);
      previous.setDate(previous.getDate() - 1);
      cursor = previous;
    }
    return { current, best, total: days.length };
  }

  function rewardPoints(data, stats) {
    const milestoneBonus = milestones.filter(item => stats.best >= item.days).reduce((sum, item) => sum + item.bonus, 0);
    return data.planningLog.length * 25 + data.sessions.length * 10 + milestoneBonus;
  }


  function formatMinutesShort(total) {
    const safe = Math.max(0, Math.round(Number(total) || 0));
    if (safe >= 60) {
      const hours = Math.floor(safe / 60);
      const mins = safe % 60;
      return mins ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${safe}m`;
  }

  function renderMotivation(data = loadData()) {
    const items = itemsForDate(dateKey(viewDate), data);
    const quality = qualityFor(items);
    const focusStates = quality.score >= 80
      ? { emoji: "🚀", title: "Launch-ready plan.", text: "You have enough structure to move with confidence tomorrow." }
      : quality.score >= 60
        ? { emoji: "⚡", title: "Good energy, sharpen one thing.", text: "Improve one weak point and the day becomes easier to execute." }
        : quality.score >= 40
          ? { emoji: "🧭", title: "Direction exists — now protect it.", text: "Turn at least one intention into a timed block and name a must-win." }
          : { emoji: "🌱", title: "Start simple and make it real.", text: "Pick one important task, give it a time, and let the plan grow from there." };
    if ($("focusEnergyEmoji")) $("focusEnergyEmoji").textContent = focusStates.emoji;
    if ($("focusEnergyTitle")) $("focusEnergyTitle").textContent = focusStates.title;
    if ($("focusEnergyText")) $("focusEnergyText").textContent = focusStates.text;
  }


  function renderInsightCharts(data = loadData()) {
    const items = itemsForDate(dateKey(viewDate), data);
    const counts = { task: 0, appointment: 0, plan: 0 };
    items.forEach(item => { counts[item.type] = (counts[item.type] || 0) + 1; });
    const total = items.length;

    const chart = $("planMixChart");
    const center = $("planMixCenter");
    const legend = $("planMixLegend");
    const colors = { task: "#72b6ff", appointment: "#68e8bc", plan: "#f2a4ff" };
    const labels = { task: ["Tasks", "✓"], appointment: ["Appointments", "▣"], plan: ["Plans", "✦"] };
    if (chart && center && legend) {
      let start = 0;
      const parts = ["task", "appointment", "plan"].map(type => {
        const value = counts[type];
        const end = total ? start + (value / total) * 100 : start;
        const rule = `${colors[type]} ${start}% ${end}%`;
        start = end;
        return rule;
      });
      chart.style.background = total ? `conic-gradient(${parts.join(", ")})` : "conic-gradient(rgba(255,255,255,.10) 0 100%)";
      center.textContent = total ? `${total} item${total === 1 ? "" : "s"}` : "No items";
      legend.innerHTML = ["task", "appointment", "plan"].map(type => {
        const value = counts[type] || 0;
        const percent = total ? Math.round(value / total * 100) : 0;
        return `<div class="legend-item"><span class="legend-dot" style="background:${colors[type]}"></span><strong>${labels[type][1]} ${labels[type][0]}</strong><span>${value} · ${percent}%</span></div>`;
      }).join("");
    }

    const areaHost = $("areaBarChart");
    if (areaHost) {
      const areaTotals = {};
      items.forEach(item => {
        const weight = itemDuration(item) || (item.priority === "high" ? 50 : item.priority === "medium" ? 30 : 20);
        areaTotals[item.area || "Personal"] = (areaTotals[item.area || "Personal"] || 0) + weight;
      });
      const rows = Object.entries(areaTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const max = rows.length ? rows[0][1] : 1;
      areaHost.innerHTML = rows.length
        ? rows.map(([area, value]) => `<div class="bar-row"><strong>${escapeHtml(area)}</strong><div class="bar-track"><span style="width:${Math.max(12, value / max * 100)}%"></span></div><em>${escapeHtml(formatMinutesShort(value))}</em></div>`).join("")
        : `<div class="bar-row"><strong>Start</strong><div class="bar-track"><span style="width:22%"></span></div><em>Add items</em></div>`;
    }
  }

  function renderWeeklyPulse(data = loadData()) {
    const host = $("weeklyBars");
    if (!host) return;
    const base = today();
    const entries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const key = dateKey(d);
      const plannedItems = data.items.filter(item => item.date === key).length;
      const focused = data.sessions.filter(session => session.planDate === key).length;
      const sealed = data.sealedDays.includes(key) || data.planningLog.includes(key) ? 1 : 0;
      const score = plannedItems * 12 + focused * 18 + sealed * 35;
      entries.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), value: score, sealed });
    }
    const max = Math.max(...entries.map(entry => entry.value), 50);
    host.innerHTML = entries.map(entry => {
      const height = Math.max(10, Math.round(entry.value / max * 100));
      return `<div class="spark-col"><div class="spark-bar" style="height:${height}%; opacity:${entry.sealed ? 1 : .72}"></div><small>${escapeHtml(entry.label)}</small></div>`;
    }).join("");

    const stats = streakStats(data);
    const line = stats.current >= 7
      ? "Momentum loves repetition. Keep the chain alive."
      : stats.current >= 3
        ? "The habit is warming up. Keep showing up before the day arrives."
        : stats.current >= 1
          ? "A streak starts with one sealed evening. Repeat tomorrow."
          : "Every sealed plan is one vote for your future self.";
    if ($("rewardMotivation")) $("rewardMotivation").textContent = line;
  }

  function burstCelebration(symbols = celebrationBits, count = 18) {
    const host = $("confettiLayer");
    if (!host) return;
    for (let i = 0; i < count; i++) {
      const bit = document.createElement("span");
      bit.className = "confetti-bit";
      bit.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      bit.style.left = `${10 + Math.random() * 80}%`;
      bit.style.animationDelay = `${Math.random() * .18}s`;
      bit.style.animationDuration = `${1.2 + Math.random() * .6}s`;
      bit.style.fontSize = `${.85 + Math.random() * .75}rem`;
      host.appendChild(bit);
      setTimeout(() => bit.remove(), 1900);
    }
  }

  function renderHeroMessage(animate = false) {
    const message = heroMessages[heroMessageIndex % heroMessages.length];
    const host = $("heroMessage");
    const bar = $("heroRotationBar");
    const apply = () => {
      $("heroLead").textContent = message.lead;
      $("heroAccent").textContent = message.accent;
      $("heroSubline").textContent = message.sub;
      host?.classList.remove("hero-message-out");
      host?.classList.add("hero-message-in");
      setTimeout(() => host?.classList.remove("hero-message-in"), 650);
    };
    if (animate && host) {
      host.classList.add("hero-message-out");
      setTimeout(apply, 260);
    } else apply();
    if (bar) {
      bar.classList.remove("hero-rotation-running");
      void bar.offsetWidth;
      bar.classList.add("hero-rotation-running");
    }
  }

  function nextHeroMessage() {
    heroMessageIndex = (heroMessageIndex + 1) % heroMessages.length;
    renderHeroMessage(true);
  }

  function startHeroRotation() {
    clearInterval(heroMessageTimer);
    renderHeroMessage(false);
    heroMessageTimer = setInterval(nextHeroMessage, 15000);
  }

  function renderHeaderDate() {
    $("plannerClockDate").textContent = `Tonight · ${formatDate(new Date(), true)}`;
  }

  function renderIntent(data = loadData()) {
    const key = dateKey(viewDate);
    $("dayIntention").value = data.intentions[key] || "";
    $("intentDateBadge").textContent = displayDayName(viewDate);
  }

  function renderAgenda(data = loadData()) {
    const key = dateKey(viewDate);
    const items = itemsForDate(key, data);
    const dayName = displayDayName(viewDate);
    $("agendaTitle").textContent = `${dayName}’s plan`;
    $("agendaSubtitle").textContent = items.length
      ? `${items.length} item${items.length === 1 ? "" : "s"} · completely separate from PPP auto plans.`
      : "Your private planner stays separate from PPP auto plans.";
    $("formDateBadge").textContent = dayName;
    if (!$("itemId").value) $("itemDate").value = key;

    const taskCount = items.filter(item => item.type === "task").length;
    const appointmentCount = items.filter(item => item.type === "appointment").length;
    const totalMinutes = items.reduce((sum, item) => sum + itemDuration(item), 0);
    if ($("agendaTaskCount")) $("agendaTaskCount").textContent = taskCount;
    if ($("agendaAppointmentCount")) $("agendaAppointmentCount").textContent = appointmentCount;
    if ($("agendaPlannedTime")) $("agendaPlannedTime").textContent = formatMinutesShort(totalMinutes);
    if ($("sealQualityScore")) $("sealQualityScore").textContent = `${qualityFor(items).score}/100`;

    const host = $("agendaList");
    host.classList.toggle("has-items", items.length > 0);
    if (!items.length) {
      host.innerHTML = `<div class="agenda-empty">
        <div class="empty-visual" aria-hidden="true">
          <div class="empty-sun">☀</div>
          <div class="empty-schedule">
            <span class="schedule-line line-one"></span><i></i>
            <span class="schedule-line line-two"></span><i></i>
            <span class="schedule-line line-three"></span><i></i>
          </div>
        </div>
        <div class="empty-copy"><span class="empty-kicker">OPEN SPACE</span><strong>Your day has room to breathe.</strong><span>Start with what cannot move, then give one important thing a real place on the clock.</span><em>“An empty calendar is possibility — use it on purpose.”</em></div>
        <button type="button" data-empty-add>＋ Add the first item</button>
      </div>`;
    } else {
      host.innerHTML = items.map(item => {
        const time = item.start ? `${item.start}${item.end ? ` – ${item.end}` : ""}` : "Anytime";
        const detail = [item.area, item.tinyStep ? `First: ${item.tinyStep}` : "", item.notes || ""].filter(Boolean).join(" · ");
        return `<article class="agenda-item ${escapeHtml(item.type)} ${item.frog ? "frog" : ""} ${item.done ? "done" : ""}">
          <button class="complete-btn" type="button" data-toggle="${escapeHtml(item.id)}" aria-label="${item.done ? "Mark incomplete" : "Mark complete"}">${item.done ? "✓" : "○"}</button>
          <div class="agenda-time">${escapeHtml(time)}</div>
          <div class="agenda-copy"><div class="agenda-title-line"><strong>${escapeHtml(item.title)}</strong>${item.frog ? '<span class="frog-pill">🐸 MUST-WIN</span>' : ""}</div>${detail ? `<span>${escapeHtml(detail)}</span>` : ""}</div>
          <div class="agenda-meta"><span class="type-pill ${escapeHtml(item.type)}">${itemTypeIcon(item.type)} ${itemTypeLabel(item.type)}</span><span class="priority-pill ${escapeHtml(item.priority || "medium")}">${escapeHtml((item.priority || "medium").toUpperCase())}</span></div>
          <div class="item-actions">
            ${item.type !== "appointment" ? `<button type="button" data-frog="${escapeHtml(item.id)}" title="Make must-win">🐸</button><button type="button" data-focus="${escapeHtml(item.id)}" title="Focus on this">▶</button>` : ""}
            <button type="button" data-edit="${escapeHtml(item.id)}" title="Edit">✎</button>
            <button type="button" data-delete="${escapeHtml(item.id)}" title="Delete">×</button>
          </div>
        </article>`;
      }).join("");
    }

    const sealed = data.sealedDays.includes(key);
    $("sealStatusTitle").textContent = sealed ? "Plan sealed ✨" : "Not sealed yet";
    $("sealStatusText").textContent = sealed
      ? "This day counts toward your planning streak. You can still refine the details."
      : "When the plan feels realistic, seal it to count toward your streak.";
    $("sealPlanBtn").textContent = sealed ? "✓ Sealed" : "✨ Seal this plan";
    $("sealPlanBtn").classList.toggle("sealed", sealed);
  }

  function renderQuality(data = loadData()) {
    const items = itemsForDate(dateKey(viewDate), data);
    const quality = qualityFor(items);
    $("qualityScore").textContent = quality.score;
    $("qualityRing").style.background = `conic-gradient(var(--green) 0 ${quality.score}%, rgba(255,255,255,.12) ${quality.score}% 100%)`;
    $("qualityRing").querySelector("span").textContent = `${quality.score}%`;
    $("qualityHeadline").textContent = quality.score >= 100
      ? "Clear, focused and realistic."
      : quality.score >= 80 ? "Strong plan — one more refinement." : quality.score >= 60 ? "Good direction. Protect the important work." : quality.score >= 40 ? "The shape is forming. Make priorities sharper." : "Give tomorrow a clear target.";
    $("qualityList").innerHTML = quality.rules.map(rule => `<div class="quality-rule ${rule.good ? "good" : ""}"><span>${rule.good ? "✓" : "○"}</span><div><strong>${escapeHtml(rule.title)}</strong><small>${escapeHtml(rule.detail)}</small></div></div>`).join("");

    if (quality.frog) {
      $("frogTitle").textContent = quality.frog.title;
      $("frogText").textContent = quality.frog.tinyStep
        ? `First move: ${quality.frog.tinyStep}`
        : "Give this task a tiny first step so starting requires less willpower.";
      $("frogJumpBtn").textContent = "Edit must-win →";
      $("frogJumpBtn").dataset.editFrog = quality.frog.id;
    } else {
      $("frogTitle").textContent = "Choose your Frog";
      $("frogText").textContent = "Pick the one high-value task that deserves your best energy before easier work expands.";
      $("frogJumpBtn").textContent = "Choose from the plan →";
      delete $("frogJumpBtn").dataset.editFrog;
    }
  }

  function renderFocusTasks(data = loadData()) {
    const items = itemsForDate(dateKey(viewDate), data).filter(item => item.type !== "appointment");
    const select = $("focusTaskSelect");
    const previous = select.value;
    select.innerHTML = `<option value="">Choose a planned task</option>${items.map(item => `<option value="${escapeHtml(item.id)}">${item.frog ? "🐸 " : ""}${escapeHtml(item.title)}</option>`).join("")}`;
    if (items.some(item => item.id === previous)) select.value = previous;
    else if (items.find(item => item.frog)) select.value = items.find(item => item.frog).id;
  }

  function renderRewards(data = loadData()) {
    const stats = streakStats(data);
    const challenge = clamp(stats.current, 0, 21);
    $("heroStreak").textContent = stats.current;
    $("challengeLabel").textContent = `Day ${challenge} of 21`;
    $("challengeBar").style.width = `${challenge / 21 * 100}%`;
    $("challengeMessage").textContent = stats.current >= 21
      ? "Twenty-one consecutive plans. The preparation habit is established."
      : stats.current > 0 ? `${21 - challenge} more consecutive day${21 - challenge === 1 ? "" : "s"} to complete the challenge.` : "Seal your first plan and start the chain.";

    const points = rewardPoints(data, stats);
    $("rewardPoints").textContent = points;
    const next = milestones.find(item => stats.best < item.days);
    if (next) {
      $("nextRewardIcon").textContent = next.icon;
      $("nextRewardTitle").textContent = `${next.label} badge`;
      $("nextRewardText").textContent = `Seal ${next.days} consecutive days · +${next.bonus} bonus`;
      $("rewardProgress").style.width = `${clamp(stats.current / next.days * 100, 0, 100)}%`;
    } else {
      $("nextRewardIcon").textContent = "🏆";
      $("nextRewardTitle").textContent = "21-day challenge complete";
      $("nextRewardText").textContent = "All planning badges unlocked";
      $("rewardProgress").style.width = "100%";
    }

    $("badgeRow").innerHTML = milestones.map(item => `<div class="reward-badge ${stats.best >= item.days ? "unlocked" : ""}" title="${escapeHtml(item.label)}"><span>${item.icon}</span><small>${item.days} DAYS</small></div>`).join("");
    $("challengeDots").innerHTML = Array.from({ length: 21 }, (_, index) => {
      const number = index + 1;
      const cls = number <= challenge ? "done" : number === challenge + 1 && challenge < 21 ? "current" : "";
      return `<div class="challenge-dot ${cls}">${number}</div>`;
    }).join("");
  }

  function renderAll() {
    const data = loadData();
    renderHeaderDate();
    renderIntent(data);
    renderAgenda(data);
    renderQuality(data);
    renderFocusTasks(data);
    renderRewards(data);
    renderMotivation(data);
    renderInsightCharts(data);
    renderWeeklyPulse(data);
    renderBookingQuick();
  }

  function resetForm() {
    $("plannerForm").reset();
    $("itemId").value = "";
    $("itemDate").value = dateKey(viewDate);
    $("itemPriority").value = "medium";
    $("itemArea").value = "Personal";
    $("cancelEditBtn").classList.add("hidden");
    $("itemTitle").placeholder = "What needs to happen?";
    $("saveItemBtn").textContent = "＋ Add to plan";
    setType("task");
  }

  function submitItem(event) {
    event.preventDefault();
    const id = $("itemId").value;
    const title = $("itemTitle").value.trim();
    const date = $("itemDate").value;
    const start = $("itemStart").value;
    const end = $("itemEnd").value;
    const priority = $("itemPriority").value;
    const area = $("itemArea").value;
    const tinyStep = itemType === "appointment" ? "" : $("itemTinyStep").value.trim();
    const notes = $("itemNotes").value.trim();
    const frog = itemType !== "appointment" && $("itemFrog").checked;
    const shouldBookWithPratik = bookingMode;

    if (!title || !date) return;
    if (shouldBookWithPratik && !start) {
      showToast("Choose a start time for Book with Pratik.");
      return;
    }
    if (start && end && end <= start) {
      showToast("End time must be after start time.");
      return;
    }

    mutate(data => {
      if (frog) data.items.forEach(item => { if (item.date === date) item.frog = false; });
      if (id) {
        const item = data.items.find(entry => entry.id === id);
        if (item) Object.assign(item, { title, date, start, end, priority: frog ? "high" : priority, area, tinyStep, notes, type: itemType, frog, source: shouldBookWithPratik ? "pratik-booking" : item.source, updatedAt: Date.now() });
      } else {
        data.items.push({ id: uid(), title, date, start, end, priority: frog ? "high" : priority, area, tinyStep, notes, type: itemType, frog, source: shouldBookWithPratik ? "pratik-booking" : "manual", done: false, createdAt: Date.now() });
      }
    });

    let bookingDuration = 30;
    if (start && end) {
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);
      if (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes) bookingDuration = clamp(endMinutes - startMinutes, 15, 240);
    }
    const bookingPrefill = shouldBookWithPratik ? { what: title, date, time: start, duration: bookingDuration, note: notes } : null;

    viewDate = parseDate(date);
    resetForm();
    renderAll();
    if (shouldBookWithPratik) {
      const opened = openBookingPage(bookingPrefill);
      if (opened) showToast("Added to your plan — finish the booking in the new tab 📅");
    } else {
      showToast(id ? "Plan item updated ✓" : frog ? "Must-win task added 🐸" : "Added to your plan ✨");
    }
  }

  function editItem(id) {
    const item = loadData().items.find(entry => entry.id === id);
    if (!item) return;
    viewDate = parseDate(item.date);
    renderAll();
    $("itemId").value = item.id;
    $("itemTitle").value = item.title;
    $("itemDate").value = item.date;
    $("itemStart").value = item.start || "";
    $("itemEnd").value = item.end || "";
    $("itemPriority").value = item.priority || "medium";
    $("itemArea").value = item.area || "Personal";
    $("itemTinyStep").value = item.tinyStep || "";
    $("itemNotes").value = item.notes || "";
    $("itemFrog").checked = Boolean(item.frog);
    setType(item.type || "task");
    $("cancelEditBtn").classList.remove("hidden");
    $("saveItemBtn").textContent = "Save changes";
    if ($("moreDetails")) $("moreDetails").open = true;
    $("composeCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteItem(id) {
    mutate(data => {
      const item = data.items.find(entry => entry.id === id);
      const itemDate = item?.date;
      data.items = data.items.filter(entry => entry.id !== id);
      if (itemDate && !data.items.some(entry => entry.date === itemDate)) data.sealedDays = data.sealedDays.filter(day => day !== itemDate);
    });
    renderAll();
    showToast("Planner item removed");
  }

  function toggleItem(id) {
    mutate(data => {
      const item = data.items.find(entry => entry.id === id);
      if (item) item.done = !item.done;
    });
    renderAll();
  }

  function makeFrog(id) {
    mutate(data => {
      const target = data.items.find(entry => entry.id === id);
      if (!target || target.type === "appointment") return;
      data.items.forEach(item => { if (item.date === target.date) item.frog = item.id === id; });
      target.priority = "high";
    });
    renderAll();
    showToast("Must-win task chosen 🐸");
  }

  function saveIntention() {
    const key = dateKey(viewDate);
    const value = $("dayIntention").value.trim();
    mutate(data => {
      if (value) data.intentions[key] = value;
      else delete data.intentions[key];
    });
    showToast(value ? "Tomorrow’s identity intention saved ✦" : "Intention cleared");
  }

  function sealPlan() {
    const key = dateKey(viewDate);
    const data = loadData();
    const items = itemsForDate(key, data);
    if (!items.length) {
      showToast("Add at least one item before sealing the plan.");
      $("composeCard").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (data.sealedDays.includes(key)) {
      showToast("This plan is already sealed ✓");
      return;
    }
    const before = streakStats(data).best;
    mutate(current => { current.sealedDays.push(key); current.planningLog.push(dateKey(today())); });
    const updated = loadData();
    const afterStats = streakStats(updated);
    renderAll();
    burstCelebration(["✨", "🎉", "🏆", "💎", "⚡"], 22);
    const unlocked = milestones.find(item => before < item.days && afterStats.best >= item.days);
    showToast(unlocked ? `${unlocked.icon} ${unlocked.label} badge unlocked! +${unlocked.bonus} points` : `Plan sealed ✨ ${afterStats.current}-day planning streak`);
  }

  function shiftView(days) {
    viewDate = new Date(viewDate);
    viewDate.setDate(viewDate.getDate() + days);
    viewDate.setHours(12, 0, 0, 0);
    resetForm();
    renderAll();
  }

  function goTomorrow() {
    viewDate = tomorrow();
    resetForm();
    renderAll();
  }

  function jumpToForm() {
    $("composeCard").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("itemTitle").focus(), 400);
  }

  function selectFocusItem(id) {
    if (!id) return;
    setHubTab("focus");
    const option = [...$("focusTaskSelect").options].find(entry => entry.value === id);
    if (option) $("focusTaskSelect").value = id;
    document.querySelector(".focus-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    resetFocusTimer(false);
    showToast("Focus task selected 🎯");
  }

  function formatTimer(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const min = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  function renderTimer() {
    $("timerDisplay").textContent = formatTimer(focusTimer.remaining);
    $("focusStatus").textContent = focusTimer.running ? "Focusing" : focusTimer.remaining < focusTimer.duration ? "Paused" : "Ready";
    $("timerStartBtn").textContent = focusTimer.running ? "▶ Running" : focusTimer.remaining < focusTimer.duration ? "▶ Resume" : "▶ Start";
    $("timerStartBtn").disabled = focusTimer.running;
    $("timerPauseBtn").disabled = !focusTimer.running;
  }
  function chooseTimer(minutes) {
    if (focusTimer.running) {
      showToast("Pause or reset the current sprint before changing duration.");
      return;
    }
    focusTimer.duration = clamp(Number(minutes) || 25, 1, 180) * 60;
    focusTimer.remaining = focusTimer.duration;
    document.querySelectorAll("[data-minutes]").forEach(button => button.classList.toggle("active", Number(button.dataset.minutes) === Number(minutes)));
    renderTimer();
  }
  function tickFocusTimer() {
    if (!focusTimer.running) return;
    focusTimer.remaining = Math.max(0, Math.ceil((focusTimer.deadline - Date.now()) / 1000));
    renderTimer();
    if (focusTimer.remaining <= 0) finishFocusTimer();
  }
  function startFocusTimer() {
    const taskId = $("focusTaskSelect").value;
    if (!taskId) {
      showToast("Choose one planned task to focus on first.");
      return;
    }
    if (focusTimer.running) return;
    if (focusTimer.remaining <= 0) focusTimer.remaining = focusTimer.duration;
    focusTimer.deadline = Date.now() + focusTimer.remaining * 1000;
    focusTimer.running = true;
    clearInterval(focusTimer.interval);
    focusTimer.interval = setInterval(tickFocusTimer, 250);
    renderTimer();
    $("focusFoot").textContent = "Stay with one target until the sprint ends. New decisions can wait.";
  }
  function pauseFocusTimer() {
    if (!focusTimer.running) return;
    focusTimer.remaining = Math.max(0, Math.ceil((focusTimer.deadline - Date.now()) / 1000));
    focusTimer.running = false;
    clearInterval(focusTimer.interval);
    focusTimer.interval = null;
    renderTimer();
    $("focusFoot").textContent = "Paused. Resume when you are ready to protect the block again.";
  }
  function resetFocusTimer(showMessage = true) {
    focusTimer.running = false;
    clearInterval(focusTimer.interval);
    focusTimer.interval = null;
    focusTimer.remaining = focusTimer.duration;
    renderTimer();
    $("focusFoot").textContent = "One protected block beats a vague intention to “work later.”";
    if (showMessage) showToast("Focus timer reset");
  }
  function finishFocusTimer() {
    const taskId = $("focusTaskSelect").value;
    focusTimer.running = false;
    clearInterval(focusTimer.interval);
    focusTimer.interval = null;
    const minutes = Math.round(focusTimer.duration / 60);
    mutate(data => data.sessions.push({ id: uid(), itemId: taskId, planDate: dateKey(viewDate), completedAt: Date.now(), minutes }));
    focusTimer.remaining = focusTimer.duration;
    renderAll();
    renderTimer();
    $("focusStatus").textContent = "Complete ✓";
    $("focusFoot").textContent = `${minutes} focused minutes completed. +10 planning points.`;
    burstCelebration(["🎯", "⚡", "✨", "🚀"], 14);
    showToast(`Focus sprint complete 🎯 +10 points`);
  }

  function setHubTab(name) {
    const target = ["focus", "quality", "rewards"].includes(name) ? name : "focus";
    document.querySelectorAll("[data-hub-tab]").forEach(button => {
      const active = button.dataset.hubTab === target;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-hub-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.hubPanel === target));
  }

  function attachEvents() {
    document.querySelectorAll("[data-hub-tab]").forEach(button => button.addEventListener("click", () => setHubTab(button.dataset.hubTab)));
    document.querySelectorAll("[data-plan-type]").forEach(button => button.addEventListener("click", () => setType(button.dataset.planType)));
    $("bookWithPratikBtn").addEventListener("click", setBookingMode);
    $("copyPlannerBookingLinkBtn").addEventListener("click", copyBookingLink);
    $("openPlannerBookingLinkBtn").addEventListener("click", () => openBookingPage());
    $("plannerForm").addEventListener("submit", submitItem);
    $("cancelEditBtn").addEventListener("click", resetForm);
    $("saveIntentionBtn").addEventListener("click", saveIntention);
    $("dayIntention").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); saveIntention(); } });
    $("prevDayBtn").addEventListener("click", () => shiftView(-1));
    $("nextDayBtn").addEventListener("click", () => shiftView(1));
    $("tomorrowBtn").addEventListener("click", goTomorrow);
    $("sealPlanBtn").addEventListener("click", sealPlan);
    $("heroSealBtn").addEventListener("click", () => { goTomorrow(); sealPlan(); });
    $("heroAddBtn").addEventListener("click", () => { goTomorrow(); jumpToForm(); });
    $("frogJumpBtn").addEventListener("click", () => {
      const id = $("frogJumpBtn").dataset.editFrog;
      if (id) editItem(id);
      else jumpToForm();
    });

    $("agendaList").addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.emptyAdd !== undefined) jumpToForm();
      if (button.dataset.toggle) toggleItem(button.dataset.toggle);
      if (button.dataset.edit) editItem(button.dataset.edit);
      if (button.dataset.delete) deleteItem(button.dataset.delete);
      if (button.dataset.frog) makeFrog(button.dataset.frog);
      if (button.dataset.focus) selectFocusItem(button.dataset.focus);
    });

    document.querySelectorAll("[data-minutes]").forEach(button => button.addEventListener("click", () => chooseTimer(Number(button.dataset.minutes))));
    $("timerStartBtn").addEventListener("click", startFocusTimer);
    $("timerPauseBtn").addEventListener("click", pauseFocusTimer);
    $("timerResetBtn").addEventListener("click", () => resetFocusTimer(true));
    window.addEventListener("beforeunload", () => { clearInterval(focusTimer.interval); clearInterval(heroMessageTimer); });
  }

  function init() {
    attachEvents();
    startHeroRotation();
    setHubTab("focus");
    resetForm();
    renderAll();
    renderTimer();
  }

  init();
})();
