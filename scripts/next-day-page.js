(() => {
  "use strict";

  const STORE_KEY = "pppNextDayPlanner_v2";
  const FOCUS_SOUND_KEY = "pppFocusSound_v1";
  const focusSoundModes = {
    rain: { name: "Natural Rain", file: "assets/sounds/rain.ogg", note: "Layered rainfall with soft individual drops — steady enough for reading, coding, or study." },
    birds: { name: "Forest Birds", file: "assets/sounds/birds.ogg", note: "Light breeze with occasional bird calls — calm, open, and less repetitive than music." },
    ocean: { name: "Ocean Waves", file: "assets/sounds/ocean.ogg", note: "Slow wave swells with gentle foam — useful when you want a broad, relaxing background." },
    forest: { name: "Forest Stream", file: "assets/sounds/forest.ogg", note: "Running water, soft wind, and distant birds — a natural background for longer focus blocks." }
  };
  const LEGACY_KEY = "pppNextDayPlanner_v1";
  const DIRECT_BOOKING_URL = "https://script.google.com/macros/s/AKfycbz84LtyJlgNapkn5hVQ8bt8_VBKiKjdK-Yp9UxZZpWQJpuq2TumGxYsYNtBG9RgXSs/exec";
  const TIMEZONE_PREF_KEY = "pppPlannerTimezone_v1";
  const TIME_ZONES = {
    "Europe/Berlin": { country: "Germany", flag: "🇩🇪", inputFormat: "24h", other: "Asia/Dhaka" },
    "Asia/Dhaka": { country: "Bangladesh", flag: "🇧🇩", inputFormat: "12h", other: "Europe/Berlin" }
  };
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
  let toastTimer = null;
  let heroMessageIndex = Math.abs(new Date().getDate() + new Date().getMonth() * 7) % heroMessages.length;
  let heroMessageTimer = null;
  let activePlannerTimeZone = "Europe/Berlin";

  const focusTimer = {
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    deadline: 0,
    interval: null
  };


  const focusAudio = {
    ctx: null,
    master: null,
    compressor: null,
    element: null,
    mode: "rain",
    enabled: true,
    volume: 0.28,
    playing: false,
    previewing: false,
    nodes: [],
    timers: []
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
  function challengeUid() {
    return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  function createChallenge(startDate = dateKey(today())) {
    return { id: challengeUid(), startDate, status: "active", completedAt: null, completedDate: "" };
  }
  function normalizeChallenge(challenge) {
    if (!challenge || typeof challenge !== "object") return null;
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(challenge.startDate || "")) ? String(challenge.startDate) : dateKey(today());
    return {
      id: String(challenge.id || challengeUid()),
      startDate,
      status: challenge.status === "completed" ? "completed" : "active",
      completedAt: Number(challenge.completedAt) || null,
      completedDate: /^\d{4}-\d{2}-\d{2}$/.test(String(challenge.completedDate || "")) ? String(challenge.completedDate) : ""
    };
  }

  function emptyData() {
    return { items: [], sealedDays: [], planningLog: [], intentions: {}, sessions: [], challenge: createChallenge(), challengeHistory: [] };
  }
  function normalizeData(data) {
    const clean = data && typeof data === "object" ? data : emptyData();
    clean.items = Array.isArray(clean.items) ? clean.items : [];
    clean.sealedDays = Array.isArray(clean.sealedDays) ? clean.sealedDays : [];
    clean.planningLog = Array.isArray(clean.planningLog) ? clean.planningLog : [];
    clean.intentions = clean.intentions && typeof clean.intentions === "object" ? clean.intentions : {};
    clean.sessions = Array.isArray(clean.sessions) ? clean.sessions : [];
    clean.challenge = normalizeChallenge(clean.challenge);
    clean.challengeHistory = Array.isArray(clean.challengeHistory) ? clean.challengeHistory.filter(entry => entry && typeof entry === "object").map(entry => ({
      id: String(entry.id || challengeUid()),
      startDate: String(entry.startDate || ""),
      endDate: String(entry.endDate || ""),
      status: entry.status === "completed" ? "completed" : "restarted",
      progress: clamp(Number(entry.progress) || 0, 0, 21),
      endedAt: Number(entry.endedAt) || Date.now()
    })) : [];
    return clean;
  }
  function loadData() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) {
        const clean = normalizeData(JSON.parse(stored));
        if (!clean.challenge) {
          const executionStats = executionStreakStats(clean);
          const start = today();
          if (executionStats.current > 0) start.setDate(start.getDate() - executionStats.current + 1);
          clean.challenge = createChallenge(dateKey(start));
          saveData(clean);
        }
        return clean;
      }
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
          timeZone: TIME_ZONES[item.timeZone] ? item.timeZone : detectedPlannerTimeZone(),
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

  function itemTimestamp(item, which = "start") {
    const value = item?.[which] || "";
    if (!value || !item?.date) return null;
    const zone = TIME_ZONES[item.timeZone] ? item.timeZone : detectedPlannerTimeZone();
    return wallTimeToTimestamp(item.date, value, zone);
  }

  function itemsForDate(key = dateKey(viewDate), data = loadData()) {
    return data.items
      .filter(item => item.date === key)
      .sort((a, b) => {
        const ta = itemTimestamp(a) ?? Number.POSITIVE_INFINITY;
        const tb = itemTimestamp(b) ?? Number.POSITIVE_INFINITY;
        return ta - tb || (a.createdAt || 0) - (b.createdAt || 0);
      });
  }
  function itemTypeLabel(type) {
    return type === "appointment" ? "Appointment" : type === "plan" ? "Plan" : "Task";
  }
  function itemTypeIcon(type) {
    return type === "appointment" ? "▣" : type === "plan" ? "✦" : "✓";
  }

  function setType(type) {
    itemType = ["task", "appointment", "plan"].includes(type) ? type : "task";
    document.querySelectorAll("[data-plan-type]").forEach(button => button.classList.toggle("active", button.dataset.planType === itemType));
    $("bookWithPratikBtn")?.classList.remove("active");
    const isAppointment = itemType === "appointment";
    $("frogToggle").classList.toggle("hidden", isAppointment);
    $("tinyStepField").classList.toggle("hidden", isAppointment);
    if (isAppointment) $("itemFrog").checked = false;
    if (!$("itemId").value) $("saveItemBtn").textContent = "＋ Add to plan";
  }

  function detectedPlannerTimeZone() {
    let detected = "";
    try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
    if (detected === "Asia/Dhaka") return "Asia/Dhaka";
    if (detected === "Europe/Berlin") return "Europe/Berlin";
    return "Europe/Berlin";
  }

  function loadPlannerTimeZone() {
    let stored = "";
    try { stored = localStorage.getItem(TIMEZONE_PREF_KEY) || ""; } catch (_) {}
    activePlannerTimeZone = TIME_ZONES[stored] ? stored : detectedPlannerTimeZone();
    return activePlannerTimeZone;
  }

  function savePlannerTimeZone(zone) {
    if (!TIME_ZONES[zone]) return;
    activePlannerTimeZone = zone;
    try { localStorage.setItem(TIMEZONE_PREF_KEY, zone); } catch (_) {}
  }

  function parseTimeInput(value, zone = activePlannerTimeZone) {
    const text = String(value || "").trim();
    if (!text) return { empty: true, valid: true, hhmm: "" };
    if (TIME_ZONES[zone]?.inputFormat === "12h") {
      const match = text.match(/^(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*([AaPp][Mm])$/);
      if (!match) return { empty: false, valid: false, hhmm: "" };
      let hour = Number(match[1]);
      const minute = Number(match[2] || 0);
      const meridiem = match[3].toUpperCase();
      if (meridiem === "AM" && hour === 12) hour = 0;
      if (meridiem === "PM" && hour !== 12) hour += 12;
      return { empty: false, valid: true, hhmm: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
    }
    const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) return { empty: false, valid: false, hhmm: "" };
    return { empty: false, valid: true, hhmm: `${String(Number(match[1])).padStart(2, "0")}:${match[2]}` };
  }

  function formatLocalTime(hhmm, zone = activePlannerTimeZone) {
    if (!hhmm) return "";
    const [hour, minute] = hhmm.split(":").map(Number);
    if (TIME_ZONES[zone]?.inputFormat === "12h") {
      const h = hour % 12 || 12;
      return `${h}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
    }
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function zonedParts(timestamp, zone) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
    return {
      year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
      hour: Number(parts.hour), minute: Number(parts.minute)
    };
  }

  function wallTimeToTimestamp(dateValue, hhmm, zone) {
    if (!dateValue || !hhmm || !TIME_ZONES[zone]) return null;
    const [year, month, day] = dateValue.split("-").map(Number);
    const [hour, minute] = hhmm.split(":").map(Number);
    if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    let timestamp = desired;
    for (let i = 0; i < 4; i++) {
      const seen = zonedParts(timestamp, zone);
      const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, 0, 0);
      const diff = desired - seenAsUtc;
      timestamp += diff;
      if (Math.abs(diff) < 60000) break;
    }
    const verify = zonedParts(timestamp, zone);
    if (verify.year !== year || verify.month !== month || verify.day !== day || verify.hour !== hour || verify.minute !== minute) return null;
    return timestamp;
  }

  function formatTimestampForZone(timestamp, zone) {
    if (timestamp === null || timestamp === undefined || !TIME_ZONES[zone]) return null;
    const parts = zonedParts(timestamp, zone);
    const date = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
    const hhmm = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
    return { date, hhmm, display: formatLocalTime(hhmm, zone) };
  }

  function convertWallTime(dateValue, hhmm, fromZone, toZone) {
    const timestamp = wallTimeToTimestamp(dateValue, hhmm, fromZone);
    return timestamp === null ? null : formatTimestampForZone(timestamp, toZone);
  }

  function plannerZoneLabel(zone) {
    const config = TIME_ZONES[zone];
    return `${config.flag} ${config.country}`;
  }

  function updateTimeZoneUI() {
    const zone = activePlannerTimeZone;
    const config = TIME_ZONES[zone];
    const other = config.other;
    const otherConfig = TIME_ZONES[other];
    const select = $("itemTimeZone");
    if (select) select.value = zone;
    const is12 = config.inputFormat === "12h";
    if ($("startTimeLabel")) $("startTimeLabel").textContent = `Start · ${config.country} (${is12 ? "12h AM/PM" : "24h"})`;
    if ($("endTimeLabel")) $("endTimeLabel").textContent = `End · ${config.country} (${is12 ? "12h AM/PM" : "24h"})`;
    if ($("startMirrorLabel")) $("startMirrorLabel").textContent = `${otherConfig.flag} ${otherConfig.country} time`;
    if ($("endMirrorLabel")) $("endMirrorLabel").textContent = `${otherConfig.flag} ${otherConfig.country} time`;
    if ($("startTimeHelp")) $("startTimeHelp").textContent = is12 ? "Example: 2:30 PM" : "Example: 14:30";
    if ($("endTimeHelp")) $("endTimeHelp").textContent = is12 ? "Example: 4:00 PM" : "Example: 16:00";
    if ($("itemStart")) {
      $("itemStart").placeholder = is12 ? "2:30 PM" : "14:30";
      $("itemStart").inputMode = is12 ? "text" : "numeric";
    }
    if ($("itemEnd")) {
      $("itemEnd").placeholder = is12 ? "4:00 PM" : "16:00";
      $("itemEnd").inputMode = is12 ? "text" : "numeric";
    }
    let detected = "";
    try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
    if ($("timezoneDetected")) {
      const detectedText = detected === "Asia/Dhaka" ? "Bangladesh" : detected === "Europe/Berlin" ? "Germany" : detected || "unknown";
      $("timezoneDetected").textContent = `Device detected: ${detectedText}. You can switch manually.`;
    }
    updateTimeMirrors();
  }

  function updateSingleTimeMirror(inputId, mirrorId) {
    const input = $(inputId);
    const mirror = $(mirrorId);
    const dateValue = $("itemDate")?.value || "";
    if (!input || !mirror) return;
    const parsed = parseTimeInput(input.value, activePlannerTimeZone);
    input.classList.toggle("time-invalid", !parsed.valid);
    if (parsed.empty) {
      mirror.value = "";
      mirror.placeholder = "—";
      return;
    }
    if (!parsed.valid || !dateValue) {
      mirror.value = parsed.valid ? "Choose a date" : "Invalid time";
      return;
    }
    const other = TIME_ZONES[activePlannerTimeZone].other;
    const converted = convertWallTime(dateValue, parsed.hhmm, activePlannerTimeZone, other);
    mirror.value = converted ? `${converted.display}${converted.date !== dateValue ? ` · ${converted.date}` : ""}` : "Unavailable (DST time)";
  }

  function updateTimeMirrors() {
    updateSingleTimeMirror("itemStart", "startTimeMirror");
    updateSingleTimeMirror("itemEnd", "endTimeMirror");
  }

  function changePlannerTimeZone(newZone) {
    if (!TIME_ZONES[newZone] || newZone === activePlannerTimeZone) return;
    const oldZone = activePlannerTimeZone;
    const dateValue = $("itemDate")?.value || dateKey(viewDate);
    const oldStart = parseTimeInput($("itemStart")?.value || "", oldZone);
    const oldEnd = parseTimeInput($("itemEnd")?.value || "", oldZone);
    let convertedStart = null;
    let convertedEnd = null;
    if (oldStart.valid && !oldStart.empty) convertedStart = convertWallTime(dateValue, oldStart.hhmm, oldZone, newZone);
    if (oldEnd.valid && !oldEnd.empty) convertedEnd = convertWallTime(dateValue, oldEnd.hhmm, oldZone, newZone);
    savePlannerTimeZone(newZone);
    if (convertedStart && $("itemDate")) $("itemDate").value = convertedStart.date;
    if ($("itemStart")) $("itemStart").value = convertedStart ? convertedStart.display : "";
    if ($("itemEnd")) $("itemEnd").value = convertedEnd ? convertedEnd.display : "";
    updateTimeZoneUI();
  }

  function normalizedFormTime(inputId) {
    const parsed = parseTimeInput($(inputId)?.value || "", activePlannerTimeZone);
    return parsed.valid ? parsed.hhmm : null;
  }

  function normalizeVisibleTime(inputId) {
    const input = $(inputId);
    if (!input) return;
    const parsed = parseTimeInput(input.value, activePlannerTimeZone);
    if (parsed.valid && !parsed.empty) input.value = formatLocalTime(parsed.hhmm, activePlannerTimeZone);
    updateTimeMirrors();
  }

  function directBookWithPratik() {
    try {
      const url = new URL(DIRECT_BOOKING_URL);
      const title = $("itemTitle")?.value.trim() || "";
      const date = $("itemDate")?.value || "";
      const start = normalizedFormTime("itemStart");
      const end = normalizedFormTime("itemEnd");
      const germanyZone = "Europe/Berlin";
      const startGermany = start ? convertWallTime(date, start, activePlannerTimeZone, germanyZone) : null;
      const endGermany = end ? convertWallTime(date, end, activePlannerTimeZone, germanyZone) : null;
      if (title) url.searchParams.set("what", title);
      if (startGermany) {
        url.searchParams.set("date", startGermany.date);
        url.searchParams.set("time", startGermany.hhmm);
      } else if (date) {
        url.searchParams.set("date", date);
      }
      if (startGermany && endGermany) {
        const startStamp = wallTimeToTimestamp(startGermany.date, startGermany.hhmm, germanyZone);
        const endStamp = wallTimeToTimestamp(endGermany.date, endGermany.hhmm, germanyZone);
        if (startStamp !== null && endStamp !== null && endStamp > startStamp) {
          url.searchParams.set("duration", String(clamp(Math.round((endStamp - startStamp) / 60000), 15, 240)));
        }
      }
      url.searchParams.set("type", "Appointment");
      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch (_) {
      window.open(DIRECT_BOOKING_URL, "_blank", "noopener,noreferrer");
    }
  }

  function timeToMinutes(value) {
    if (!value) return null;
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  }
  function itemDuration(item) {
    const start = itemTimestamp(item, "start");
    const end = itemTimestamp(item, "end");
    return start !== null && end !== null && end > start ? Math.round((end - start) / 60000) : 0;
  }
  function scheduleHasOverlap(items) {
    const timed = items
      .map(item => ({ start: itemTimestamp(item, "start"), end: itemTimestamp(item, "end") }))
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

  function executionForDate(key, data = loadData()) {
    const items = itemsForDate(key, data);
    const total = items.length;
    const done = items.filter(item => item.done).length;
    const percent = total ? Math.round(done / total * 100) : 0;
    const frog = items.find(item => item.frog);
    const frogDone = Boolean(frog && frog.done);
    const focusMinutes = data.sessions.filter(session => session.planDate === key).reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
    const isFuture = parseDate(key) > today();
    const success = !isFuture && total > 0 && (percent >= 70 || frogDone);
    let status = "open";
    if (isFuture) status = "future";
    else if (!total) status = "open";
    else if (percent === 100) status = "perfect";
    else if (success) status = "strong";
    else if (percent > 0) status = "partial";
    else status = "missed";
    return { key, items, total, done, percent, frog, frogDone, focusMinutes, isFuture, success, status };
  }

  function executionStreakStats(data = loadData()) {
    const todayKey = dateKey(today());
    const candidateDays = [...new Set(data.items.map(item => item.date))]
      .filter(key => key <= todayKey)
      .sort();
    const successDays = candidateDays.filter(key => executionForDate(key, data).success);
    if (!successDays.length) return { current: 0, best: 0, total: 0 };

    let best = 1;
    let run = 1;
    for (let i = 1; i < successDays.length; i++) {
      const diff = Math.round((parseDate(successDays[i]) - parseDate(successDays[i - 1])) / 86400000);
      run = diff === 1 ? run + 1 : 1;
      best = Math.max(best, run);
    }

    const successSet = new Set(successDays);
    let cursor = today();
    if (!successSet.has(dateKey(cursor))) {
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    let current = 0;
    while (successSet.has(dateKey(cursor))) {
      current += 1;
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    return { current, best, total: successDays.length };
  }

  function challengeExecutionStats(data = loadData()) {
    const challenge = data.challenge || createChallenge();
    if (challenge.status === "completed") {
      return { progress: 21, complete: true, startDate: challenge.startDate, runStart: challenge.startDate, current: 21 };
    }
    const startDate = parseDate(challenge.startDate);
    const todayDate = today();
    const successSet = new Set(
      [...new Set(data.items.map(item => item.date))]
        .filter(key => key >= challenge.startDate && key <= dateKey(todayDate))
        .filter(key => executionForDate(key, data).success)
    );
    let cursor = todayDate;
    if (!successSet.has(dateKey(cursor))) {
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    let current = 0;
    let runStart = "";
    while (cursor >= startDate && successSet.has(dateKey(cursor))) {
      current += 1;
      runStart = dateKey(cursor);
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    return { progress: clamp(current, 0, 21), complete: current >= 21, startDate: challenge.startDate, runStart, current };
  }

  function archiveChallenge(data, status, progress, endDate = dateKey(today())) {
    const challenge = data.challenge;
    if (!challenge) return;
    if (data.challengeHistory.some(entry => entry.id === challenge.id)) return;
    data.challengeHistory.push({
      id: challenge.id,
      startDate: challenge.startDate,
      endDate,
      status: status === "completed" ? "completed" : "restarted",
      progress: clamp(Number(progress) || 0, 0, 21),
      endedAt: Date.now()
    });
  }

  function syncChallengeCompletion(data) {
    if (!data.challenge) data.challenge = createChallenge();
    if (data.challenge.status === "completed") return false;
    const stats = challengeExecutionStats(data);
    if (!stats.complete) return false;
    data.challenge.status = "completed";
    data.challenge.completedAt = Date.now();
    data.challenge.completedDate = dateKey(today());
    archiveChallenge(data, "completed", 21, data.challenge.completedDate);
    return true;
  }

  function restartChallenge() {
    const data = loadData();
    const current = challengeExecutionStats(data);
    const message = data.challenge?.status === "completed"
      ? "Start a new 21-day challenge? Your completed challenge, tasks, points and lifetime stats will stay محفوظed."
      : `Restart the current challenge from Day 0? Your ${current.progress}/21 challenge progress will reset, but tasks, completion history, points, focus sessions and lifetime stats will stay.`;
    if (!window.confirm(message.replace("محفوظed", "saved"))) return;
    mutate(currentData => {
      if (!currentData.challenge) currentData.challenge = createChallenge();
      const stats = challengeExecutionStats(currentData);
      if (currentData.challenge.status !== "completed") archiveChallenge(currentData, "restarted", stats.progress);
      currentData.challenge = createChallenge(dateKey(today()));
    });
    renderAll();
    setHubTab("rewards");
    burstCelebration(["🌱", "✨", "🚀"], 10);
    showToast(data.challenge?.status === "completed" ? "New 21-day challenge started 🌱" : "Challenge restarted from Day 0 ↻");
  }

  function resetProgressHistory() {
    const answer = window.prompt("This resets completion marks, seals, focus sessions, challenge history, streaks and points, but keeps your planned items and intentions. Type RESET to continue.");
    if (String(answer || "").trim().toUpperCase() !== "RESET") {
      showToast("Progress reset cancelled");
      return;
    }
    mutate(data => {
      data.items.forEach(item => { item.done = false; });
      data.sealedDays = [];
      data.planningLog = [];
      data.sessions = [];
      data.challengeHistory = [];
      data.challenge = createChallenge(dateKey(today()));
    });
    renderAll();
    setHubTab("rewards");
    showToast("Progress history reset. Planned items were kept.");
  }

  function lifetimeStats(data = loadData()) {
    const todayKey = dateKey(today());
    const executionStats = executionStreakStats(data);
    const completedItems = data.items.filter(item => item.date <= todayKey && item.done).length;
    const focusMinutes = data.sessions.filter(session => session.planDate <= todayKey).reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
    const completedChallenges = data.challengeHistory.filter(entry => entry.status === "completed").length;
    const restartedChallenges = data.challengeHistory.filter(entry => entry.status === "restarted").length;
    return { completedItems, focusMinutes, completedChallenges, restartedChallenges, currentStreak: executionStats.current, bestStreak: executionStats.best };
  }

  function rewardPoints(data, executionStats = executionStreakStats(data)) {
    const todayKey = dateKey(today());
    const eligibleItems = data.items.filter(item => item.date <= todayKey);
    const doneItems = eligibleItems.filter(item => item.done);
    const frogDone = doneItems.filter(item => item.frog).length;
    const perfectDays = [...new Set(eligibleItems.map(item => item.date))].filter(key => executionForDate(key, data).status === "perfect").length;
    const milestoneBonus = milestones.filter(item => executionStats.best >= item.days).reduce((sum, item) => sum + item.bonus, 0);
    return data.sealedDays.filter(key => key <= todayKey).length * 10
      + doneItems.length * 5
      + frogDone * 20
      + data.sessions.filter(session => session.planDate <= todayKey).length * 10
      + perfectDays * 25
      + milestoneBonus;
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
      const execution = executionForDate(key, data);
      entries.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), value: execution.percent, status: execution.status });
    }
    host.innerHTML = entries.map(entry => {
      const height = Math.max(8, entry.value);
      return `<div class="spark-col"><div class="spark-bar ${entry.status}" style="height:${height}%"></div><small>${escapeHtml(entry.label)}</small></div>`;
    }).join("");

    const stats = executionStreakStats(data);
    const line = stats.current >= 7
      ? "Seven days of real follow-through. Protect the chain."
      : stats.current >= 3
        ? "Execution is becoming a pattern. Keep finishing what you planned."
        : stats.current >= 1
          ? "The streak is alive. Repeat the follow-through tomorrow."
          : "Planning creates direction. Completion creates evidence.";
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
    heroMessageTimer = setInterval(nextHeroMessage, 5000);
  }

  function renderHeaderDate() {
    $("plannerClockDate").textContent = `Tonight · ${formatDate(new Date(), true)}`;
  }

  function renderIntent() {
    const dayName = displayDayName(viewDate);
    const isToday = dateKey(viewDate) === dateKey(today());
    const isTomorrow = dateKey(viewDate) === dateKey(tomorrow());
    $("intentDateBadge").textContent = dayName;
    $("todayQuickBtn")?.classList.toggle("active", isToday);
    $("tomorrowQuickBtn")?.classList.toggle("active", isTomorrow);
    $("modalTodayBtn")?.classList.toggle("active", isToday);
    $("modalTomorrowBtn")?.classList.toggle("active", isTomorrow);
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
    if ($("agendaDoneCount")) $("agendaDoneCount").textContent = `${items.filter(item => item.done).length}/${items.length}`;
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
        const itemZone = TIME_ZONES[item.timeZone] ? item.timeZone : detectedPlannerTimeZone();
        const zoneConfig = TIME_ZONES[itemZone];
        const otherZone = zoneConfig.other;
        const time = item.start ? `${formatLocalTime(item.start, itemZone)}${item.end ? ` – ${formatLocalTime(item.end, itemZone)}` : ""}` : "Anytime";
        const convertedStart = item.start ? convertWallTime(item.date, item.start, itemZone, otherZone) : null;
        const otherTime = convertedStart ? `${TIME_ZONES[otherZone].flag} ${convertedStart.display}` : "";
        const detail = [item.area, item.tinyStep ? `First: ${item.tinyStep}` : "", item.notes || ""].filter(Boolean).join(" · ");
        return `<article class="agenda-item ${escapeHtml(item.type)} ${item.frog ? "frog" : ""} ${item.done ? "done" : ""}">
          <button class="complete-btn" type="button" data-toggle="${escapeHtml(item.id)}" aria-label="${item.done ? "Mark incomplete" : "Mark complete"}">${item.done ? "✓" : "○"}</button>
          <div class="agenda-time">${escapeHtml(time)}${item.start ? `<small>${zoneConfig.flag} ${escapeHtml(zoneConfig.country)}${otherTime ? ` · ${escapeHtml(otherTime)}` : ""}</small>` : ""}</div>
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
    const executionStats = executionStreakStats(data);
    const planningStats = streakStats(data);
    const currentChallenge = challengeExecutionStats(data);
    const challengeProgress = data.challenge?.status === "completed" ? 21 : currentChallenge.progress;
    const lifetime = lifetimeStats(data);

    $("heroStreak").textContent = executionStats.current;
    $("challengeLabel").textContent = data.challenge?.status === "completed" ? "21 / 21 complete" : `Day ${challengeProgress} of 21`;
    $("challengeBar").style.width = `${challengeProgress / 21 * 100}%`;
    $("challengeMessage").textContent = data.challenge?.status === "completed"
      ? "Challenge complete 🏆 Your lifetime execution streak can keep growing."
      : challengeProgress > 0
        ? `${21 - challengeProgress} more consecutive execution day${21 - challengeProgress === 1 ? "" : "s"} in this challenge.`
        : "Complete at least 70% of a planned day—or finish its must-win—to start this challenge chain.";

    const points = rewardPoints(data, executionStats);
    $("rewardPoints").textContent = points;
    const next = milestones.find(item => executionStats.best < item.days);
    if (next) {
      $("nextRewardIcon").textContent = next.icon;
      $("nextRewardTitle").textContent = `${next.label} badge`;
      $("nextRewardText").textContent = `Execute ${next.days} consecutive days · +${next.bonus} bonus`;
      $("rewardProgress").style.width = `${clamp(executionStats.current / next.days * 100, 0, 100)}%`;
    } else {
      $("nextRewardIcon").textContent = "🏆";
      $("nextRewardTitle").textContent = "21-day execution milestone";
      $("nextRewardText").textContent = "All lifetime execution badges unlocked";
      $("rewardProgress").style.width = "100%";
    }

    $("badgeRow").innerHTML = milestones.map(item => `<div class="reward-badge ${executionStats.best >= item.days ? "unlocked" : ""}" title="${escapeHtml(item.label)}"><span>${item.icon}</span><small>${item.days} DAYS</small></div>`).join("");
    $("challengeDots").innerHTML = Array.from({ length: 21 }, (_, index) => {
      const number = index + 1;
      const cls = number <= challengeProgress ? "done" : number === challengeProgress + 1 && challengeProgress < 21 ? "current" : "";
      return `<div class="challenge-dot ${cls}">${number}</div>`;
    }).join("");

    $("currentChallengeProgress").textContent = `${challengeProgress}/21`;
    $("completedChallengesCount").textContent = lifetime.completedChallenges;
    $("challengeBestStreak").textContent = lifetime.bestStreak;
    $("challengeStatePill").textContent = data.challenge?.status === "completed" ? "COMPLETE" : "ACTIVE";
    $("challengeStatePill").classList.toggle("complete", data.challenge?.status === "completed");
    $("challengeCardTitle").textContent = data.challenge?.status === "completed" ? "Challenge complete 🏆" : "Build the execution habit.";
    $("challengeLifeNote").textContent = data.challenge?.status === "completed"
      ? `Completed ${data.challenge.completedDate ? formatDate(parseDate(data.challenge.completedDate)) : ""}. Start a new challenge whenever you want; lifetime stats stay intact.`
      : `Started ${formatDate(parseDate(data.challenge?.startDate || dateKey(today())))} · restarting resets only this attempt.`;
    $("challengeActionBtn").textContent = data.challenge?.status === "completed" ? "🏆 Start new 21-day challenge" : "↻ Restart challenge";
    $("restartChallengeMenuBtn").textContent = data.challenge?.status === "completed" ? "🏆 Start a new challenge" : "↻ Restart current challenge";

    $("lifetimeCompletedTasks").textContent = lifetime.completedItems;
    $("lifetimeCurrentStreak").textContent = lifetime.currentStreak;
    $("lifetimeBestStreak").textContent = lifetime.bestStreak;
    $("lifetimeFocusTime").textContent = formatMinutesShort(lifetime.focusMinutes);
    $("challengeHistorySummary").textContent = lifetime.completedChallenges
      ? `${lifetime.completedChallenges} completed${lifetime.restartedChallenges ? ` · ${lifetime.restartedChallenges} restarted` : ""}`
      : lifetime.restartedChallenges ? `${lifetime.restartedChallenges} restarted attempt${lifetime.restartedChallenges === 1 ? "" : "s"}` : "No completed challenges yet";

    const history = [...data.challengeHistory].sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0)).slice(0, 5);
    $("challengeHistoryList").innerHTML = history.length ? history.map(entry => {
      const completed = entry.status === "completed";
      const label = completed ? "Completed" : "Restarted";
      const icon = completed ? "🏆" : "↻";
      const dates = entry.startDate && entry.endDate ? `${formatDate(parseDate(entry.startDate))} → ${formatDate(parseDate(entry.endDate))}` : "Previous attempt";
      return `<div class="challenge-history-row ${entry.status}"><span>${icon}</span><div><strong>${label}</strong><small>${escapeHtml(dates)}</small></div><b>${entry.progress}/21</b></div>`;
    }).join("") : `<div class="challenge-history-empty">Finish or restart a challenge and its record will appear here.</div>`;

    const rewardCard = document.querySelector(".reward-card");
    if (rewardCard) rewardCard.dataset.planningStreak = String(planningStats.current);
  }

  function renderProgress(data = loadData()) {
    const selectedKey = dateKey(viewDate);
    const selected = executionForDate(selectedKey, data);
    const executionStats = executionStreakStats(data);
    $("progressDayTitle").textContent = `${displayDayName(viewDate)} · ${formatDate(viewDate)}`;
    $("progressDoneCount").textContent = `${selected.done}/${selected.total}`;
    $("progressFrogStatus").textContent = selected.frog ? (selected.frogDone ? "Done ✓" : "Open") : "None";
    $("progressFocusMinutes").textContent = formatMinutesShort(selected.focusMinutes);
    $("progressExecutionStreak").textContent = executionStats.current;
    $("executionPercent").textContent = `${selected.percent}%`;
    $("executionRing").style.background = `conic-gradient(${selected.percent >= 70 ? "#25b67a" : selected.percent > 0 ? "#e9a93a" : "#cbd5e1"} 0 ${selected.percent}%, rgba(83,99,126,.12) ${selected.percent}% 100%)`;
    const statusText = selected.isFuture
      ? "Future day — execution starts when the day arrives."
      : !selected.total
        ? "No planned items for this day."
        : selected.status === "perfect"
          ? "Perfect day: every planned item is complete. 🌟"
          : selected.success
            ? selected.frogDone && selected.percent < 70 ? "Must-win completed — this day counts as an execution win. 🐸" : "Strong follow-through — this day counts toward your execution streak."
            : selected.status === "partial"
              ? "Some progress, but below the 70% execution threshold."
              : "Nothing completed yet. One finished item changes the direction.";
    $("executionStatus").textContent = statusText;
    $("executionStatus").className = `execution-status ${selected.status}`;

    const bars = [];
    let completedSum = 0;
    let daysWithPlans = 0;
    for (let i = 6; i >= 0; i--) {
      const d = today();
      d.setDate(d.getDate() - i);
      const ex = executionForDate(dateKey(d), data);
      if (ex.total) { completedSum += ex.percent; daysWithPlans += 1; }
      bars.push({ d, ex });
    }
    $("completionBars").innerHTML = bars.map(({ d, ex }) => `<button type="button" class="completion-day ${ex.status}" data-progress-date="${dateKey(d)}" title="${formatDate(d)} · ${ex.done}/${ex.total} complete"><span class="completion-value">${ex.total ? ex.percent : 0}%</span><div class="completion-track"><i style="height:${Math.max(ex.total ? 8 : 3, ex.percent)}%"></i></div><small>${d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2)}</small></button>`).join("");
    $("sevenDayAverage").textContent = `${daysWithPlans ? Math.round(completedSum / daysWithPlans) : 0}% avg`;

    const heat = [];
    for (let i = 20; i >= 0; i--) {
      const d = today();
      d.setDate(d.getDate() - i);
      heat.push({ d, ex: executionForDate(dateKey(d), data) });
    }
    $("executionBestStreak").textContent = `Best ${executionStats.best}`;
    $("executionHeatmap").innerHTML = heat.map(({ d, ex }) => `<button type="button" class="execution-cell ${ex.status}" data-progress-date="${dateKey(d)}" title="${formatDate(d)} · ${ex.done}/${ex.total} · ${ex.percent}%"><strong>${d.getDate()}</strong><span>${ex.total ? `${ex.percent}%` : "—"}</span></button>`).join("");

    const historyDays = [...new Set(data.items.map(item => item.date))]
      .filter(key => key <= dateKey(today()))
      .sort().reverse().slice(0, 8);
    $("executionHistory").innerHTML = historyDays.length ? historyDays.map(key => {
      const ex = executionForDate(key, data);
      const d = parseDate(key);
      const frogText = ex.frog ? (ex.frogDone ? "🐸 ✓" : "🐸 open") : "";
      return `<button type="button" class="history-row ${ex.status}" data-progress-date="${key}"><span class="history-date"><strong>${formatDate(d)}</strong><small>${frogText}${frogText && ex.focusMinutes ? " · " : ""}${ex.focusMinutes ? `🎯 ${formatMinutesShort(ex.focusMinutes)}` : ""}</small></span><span class="history-score"><strong>${ex.done}/${ex.total}</strong><small>${ex.percent}%</small></span><i>›</i></button>`;
    }).join("") : `<div class="history-empty">Complete items on a planned day and your execution history will appear here.</div>`;
  }

  function renderAll() {
    const data = loadData();
    if (syncChallengeCompletion(data)) saveData(data);
    renderHeaderDate();
    renderIntent(data);
    renderAgenda(data);
    renderQuality(data);
    renderFocusTasks(data);
    renderRewards(data);
    renderProgress(data);
    renderMotivation(data);
    renderInsightCharts(data);
    renderWeeklyPulse(data);
  }

  function setQuickAddOpen(open = true) {
    const modal = $("quickAddModal");
    const body = $("quickAddBody");
    if (!modal || !body) return;
    body.classList.remove("collapsed");
    if (open) {
      if (typeof modal.showModal === "function") {
        if (!modal.open) modal.showModal();
      } else {
        modal.setAttribute("open", "");
        modal.classList.add("fallback-open");
      }
      $("composeCard")?.classList.add("quick-add-open");
      requestAnimationFrame(() => $("itemTitle")?.focus());
    } else {
      if (typeof modal.close === "function" && modal.open) modal.close();
      else {
        modal.removeAttribute("open");
        modal.classList.remove("fallback-open");
      }
      $("composeCard")?.classList.remove("quick-add-open");
    }
  }

  function toggleQuickAdd() {
    const modal = $("quickAddModal");
    if (!modal) return;
    setQuickAddOpen(!modal.open);
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
    if ($("itemTimeZone")) $("itemTimeZone").value = activePlannerTimeZone;
    updateTimeZoneUI();
  }

  function submitItem(event) {
    event.preventDefault();
    const id = $("itemId").value;
    const title = $("itemTitle").value.trim();
    const date = $("itemDate").value;
    const startParsed = parseTimeInput($("itemStart").value, activePlannerTimeZone);
    const endParsed = parseTimeInput($("itemEnd").value, activePlannerTimeZone);
    const start = startParsed.valid ? startParsed.hhmm : null;
    const end = endParsed.valid ? endParsed.hhmm : null;
    const priority = $("itemPriority").value;
    const area = $("itemArea").value;
    const tinyStep = itemType === "appointment" ? "" : $("itemTinyStep").value.trim();
    const notes = $("itemNotes").value.trim();
    const frog = itemType !== "appointment" && $("itemFrog").checked;

    if (!title || !date) return;
    if (!startParsed.valid || !endParsed.valid) {
      showToast(activePlannerTimeZone === "Asia/Dhaka" ? "Use time like 2:30 PM." : "Use 24-hour time like 14:30.");
      updateTimeMirrors();
      return;
    }
    if (start && end) {
      const startStamp = wallTimeToTimestamp(date, start, activePlannerTimeZone);
      const endStamp = wallTimeToTimestamp(date, end, activePlannerTimeZone);
      if (startStamp === null || endStamp === null) {
        showToast("That local time is unavailable on this date because of a daylight-saving change.");
        return;
      }
      if (endStamp <= startStamp) {
        showToast("End time must be after start time.");
        return;
      }
    }

    mutate(data => {
      if (frog) data.items.forEach(item => { if (item.date === date) item.frog = false; });
      if (id) {
        const item = data.items.find(entry => entry.id === id);
        if (item) Object.assign(item, { title, date, start: start || "", end: end || "", timeZone: activePlannerTimeZone, priority: frog ? "high" : priority, area, tinyStep, notes, type: itemType, frog, source: item.source, updatedAt: Date.now() });
      } else {
        data.items.push({ id: uid(), title, date, start: start || "", end: end || "", timeZone: activePlannerTimeZone, priority: frog ? "high" : priority, area, tinyStep, notes, type: itemType, frog, source: "manual", done: false, createdAt: Date.now() });
      }
    });

    viewDate = parseDate(date);
    resetForm();
    renderAll();
    setQuickAddOpen(false);
    showToast(id ? "Plan item updated ✓" : frog ? "Must-win task added 🐸" : "Added to your plan ✨");
  }

  function editItem(id) {
    const item = loadData().items.find(entry => entry.id === id);
    if (!item) return;
    viewDate = parseDate(item.date);
    renderAll();
    $("itemId").value = item.id;
    $("itemTitle").value = item.title;
    $("itemDate").value = item.date;
    activePlannerTimeZone = TIME_ZONES[item.timeZone] ? item.timeZone : activePlannerTimeZone;
    if ($("itemTimeZone")) $("itemTimeZone").value = activePlannerTimeZone;
    $("itemStart").value = formatLocalTime(item.start || "", activePlannerTimeZone);
    $("itemEnd").value = formatLocalTime(item.end || "", activePlannerTimeZone);
    updateTimeZoneUI();
    $("itemPriority").value = item.priority || "medium";
    $("itemArea").value = item.area || "Personal";
    $("itemTinyStep").value = item.tinyStep || "";
    $("itemNotes").value = item.notes || "";
    $("itemFrog").checked = Boolean(item.frog);
    setType(item.type || "task");
    $("cancelEditBtn").classList.remove("hidden");
    $("saveItemBtn").textContent = "Save changes";
    if ($("moreDetails")) $("moreDetails").open = true;
    setQuickAddOpen(true);
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
    const beforeData = loadData();
    const beforeItem = beforeData.items.find(entry => entry.id === id);
    if (!beforeItem) return;
    const beforeExecution = executionForDate(beforeItem.date, beforeData);
    const markingDone = !beforeItem.done;
    const wasFrog = Boolean(beforeItem.frog);
    mutate(data => {
      const item = data.items.find(entry => entry.id === id);
      if (item) {
        item.done = !item.done;
        item.completedAt = item.done ? Date.now() : null;
      }
    });
    const afterData = loadData();
    const afterExecution = executionForDate(beforeItem.date, afterData);
    const challengeCompletedNow = syncChallengeCompletion(afterData);
    if (challengeCompletedNow) saveData(afterData);
    renderAll();
    if (challengeCompletedNow) {
      burstCelebration(["🏆", "🔥", "✨", "💎", "🎉"], 32);
      showToast("21-day challenge complete 🏆 Your lifetime streak continues.");
      setHubTab("rewards");
    } else if (markingDone) {
      if (afterExecution.status === "perfect" && beforeExecution.status !== "perfect") {
        burstCelebration(["🌟", "🎉", "✨", "🏆"], 24);
        showToast(`Perfect day 🌟 ${afterExecution.done}/${afterExecution.total} complete · +25 day bonus`);
      } else if (afterExecution.success && !beforeExecution.success) {
        burstCelebration(["🔥", "✅", "⚡", "✨"], 18);
        showToast(`Execution day unlocked 🔥 ${afterExecution.percent}% complete`);
      } else {
        showToast(wasFrog ? "Must-win completed 🐸 +25 points" : "Completed ✓ +5 points");
      }
    } else {
      showToast("Marked incomplete — progress updated");
    }
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

  function sealPlan() {
    const key = dateKey(viewDate);
    const data = loadData();
    const items = itemsForDate(key, data);
    if (!items.length) {
      showToast("Add at least one item before sealing the plan.");
      setQuickAddOpen(true);
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

  function goToday() {
    viewDate = today();
    resetForm();
    renderAll();
  }

  function goTomorrow() {
    viewDate = tomorrow();
    resetForm();
    renderAll();
  }

  function jumpToForm() {
    setQuickAddOpen(true);
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


  function loadFocusSoundSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(FOCUS_SOUND_KEY) || "null") || {};
      if (focusSoundModes[stored.mode]) focusAudio.mode = stored.mode;
      if (typeof stored.enabled === "boolean") focusAudio.enabled = stored.enabled;
      if (Number.isFinite(Number(stored.volume))) focusAudio.volume = clamp(Number(stored.volume), 0, 1);
    } catch (_) {}
  }

  function saveFocusSoundSettings() {
    try {
      localStorage.setItem(FOCUS_SOUND_KEY, JSON.stringify({ mode: focusAudio.mode, enabled: focusAudio.enabled, volume: focusAudio.volume }));
    } catch (_) {}
  }

  function ensureFocusAudioContext() {
    if (!focusAudio.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      master.gain.value = focusAudio.volume;
      compressor.threshold.value = -18;
      compressor.knee.value = 24;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.35;
      master.connect(compressor);
      compressor.connect(ctx.destination);
      focusAudio.ctx = ctx;
      focusAudio.master = master;
      focusAudio.compressor = compressor;
    }
    if (focusAudio.ctx.state === "suspended") focusAudio.ctx.resume().catch(() => {});
    return focusAudio.ctx;
  }

  function registerAudioNode(node) {
    focusAudio.nodes.push(node);
    return node;
  }

  function registerAudioTimer(timer) {
    focusAudio.timers.push(timer);
    return timer;
  }

  function clearFocusAudioEngine() {
    if (focusAudio.element) {
      try { focusAudio.element.pause(); focusAudio.element.currentTime = 0; } catch (_) {}
      focusAudio.element = null;
    }
    focusAudio.timers.forEach(timer => clearInterval(timer));
    focusAudio.timers = [];
    focusAudio.nodes.forEach(node => {
      try { if (typeof node.stop === "function") node.stop(); } catch (_) {}
      try { node.disconnect(); } catch (_) {}
    });
    focusAudio.nodes = [];
    focusAudio.playing = false;
    focusAudio.previewing = false;
    renderFocusSoundUI();
  }

  function makeNoiseBuffer(ctx, kind = "brown") {
    const seconds = 5;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === "brown") {
        brown = (brown + 0.018 * white) / 1.018;
        data[i] = brown * 3.4;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  function createNoiseSource(ctx, kind, gainValue, filterType = "lowpass", frequency = 1800) {
    const source = registerAudioNode(ctx.createBufferSource());
    const filter = registerAudioNode(ctx.createBiquadFilter());
    const gain = registerAudioNode(ctx.createGain());
    source.buffer = makeNoiseBuffer(ctx, kind);
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    gain.gain.value = gainValue;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(focusAudio.master);
    source.start();
    return { source, filter, gain };
  }

  function makeTone(ctx, frequency, duration = 1.8, gainValue = 0.035, type = "sine", delay = 0) {
    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), startAt + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(focusAudio.master);
    osc.addEventListener("ended", () => {
      try { osc.disconnect(); } catch (_) {}
      try { filter.disconnect(); } catch (_) {}
      try { gain.disconnect(); } catch (_) {}
    }, { once: true });
    osc.start(startAt);
    osc.stop(startAt + duration + 0.08);
    return osc;
  }

  function startLofiSound(ctx) {
    createNoiseSource(ctx, "brown", 0.022, "lowpass", 1100);
    const chords = [
      [130.81, 164.81, 196.00, 246.94],
      [110.00, 130.81, 164.81, 196.00],
      [87.31, 110.00, 130.81, 164.81],
      [98.00, 123.47, 146.83, 220.00]
    ];
    let chordIndex = 0;
    const chordNodes = chords[0].map((frequency, index) => {
      const osc = registerAudioNode(ctx.createOscillator());
      const gain = registerAudioNode(ctx.createGain());
      const filter = registerAudioNode(ctx.createBiquadFilter());
      osc.type = index % 2 ? "triangle" : "sine";
      osc.frequency.value = frequency;
      osc.detune.value = index * 2 - 3;
      filter.type = "lowpass";
      filter.frequency.value = 950;
      gain.gain.value = 0.018;
      osc.connect(filter); filter.connect(gain); gain.connect(focusAudio.master); osc.start();
      return { osc, gain };
    });
    const changeChord = () => {
      chordIndex = (chordIndex + 1) % chords.length;
      chordNodes.forEach((entry, index) => entry.osc.frequency.setTargetAtTime(chords[chordIndex][index], ctx.currentTime, 0.35));
    };
    registerAudioTimer(setInterval(changeChord, 6800));

    let beatCount = 0;
    const beat = () => {
      makeTone(ctx, 65, 0.15, 0.042, "sine");
      if (beatCount % 2 === 1) makeTone(ctx, 170, 0.09, 0.012, "triangle", 0.02);
      beatCount += 1;
    };
    beat();
    registerAudioTimer(setInterval(beat, 860));
  }

  function startAmbientSound(ctx) {
    createNoiseSource(ctx, "brown", 0.012, "lowpass", 700);
    const progression = [
      [110.00, 164.81, 220.00],
      [87.31, 130.81, 174.61],
      [130.81, 196.00, 261.63],
      [98.00, 146.83, 196.00]
    ];
    let step = 0;
    const voices = progression[0].map((frequency, index) => {
      const osc = registerAudioNode(ctx.createOscillator());
      const gain = registerAudioNode(ctx.createGain());
      const filter = registerAudioNode(ctx.createBiquadFilter());
      const lfo = registerAudioNode(ctx.createOscillator());
      const lfoGain = registerAudioNode(ctx.createGain());
      osc.type = index === 1 ? "triangle" : "sine";
      osc.frequency.value = frequency;
      osc.detune.value = [-7, 3, 8][index];
      filter.type = "lowpass"; filter.frequency.value = 900;
      gain.gain.value = 0.025;
      lfo.frequency.value = 0.06 + index * 0.025;
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      osc.connect(filter); filter.connect(gain); gain.connect(focusAudio.master);
      osc.start(); lfo.start();
      return osc;
    });
    registerAudioTimer(setInterval(() => {
      step = (step + 1) % progression.length;
      voices.forEach((osc, index) => osc.frequency.setTargetAtTime(progression[step][index], ctx.currentTime, 1.5));
    }, 12000));
  }

  function makeNatureNoiseBurst(ctx, { frequency = 3500, duration = 0.12, gainValue = 0.018, pan = 0 } = {}) {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
    source.buffer = makeNoiseBuffer(ctx, "white");
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.9;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    if (panner) { panner.pan.value = clamp(pan, -1, 1); gain.connect(panner); panner.connect(focusAudio.master); }
    else gain.connect(focusAudio.master);
    source.start(now);
    source.stop(now + duration + 0.04);
  }

  function makeBirdChirp(ctx, { base = 1800, pan = 0, gainValue = 0.018 } = {}) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
    const now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.55, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(base * 1.18, now + 0.2);
    filter.type = "highpass";
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(filter); filter.connect(gain);
    if (panner) { panner.pan.value = clamp(pan, -1, 1); gain.connect(panner); panner.connect(focusAudio.master); }
    else gain.connect(focusAudio.master);
    osc.start(now); osc.stop(now + 0.24);
    if (Math.random() > 0.35) {
      const timer = setTimeout(() => makeTone(ctx, base * 1.08, 0.13, gainValue * 0.65, "sine"), 150 + Math.random() * 100);
      registerAudioTimer(timer);
    }
  }

  function startRainSound(ctx) {
    const rumble = createNoiseSource(ctx, "brown", 0.028, "lowpass", 850);
    createNoiseSource(ctx, "white", 0.026, "bandpass", 2800);
    createNoiseSource(ctx, "white", 0.007, "highpass", 6500);
    const lfo = registerAudioNode(ctx.createOscillator());
    const lfoGain = registerAudioNode(ctx.createGain());
    lfo.type = "sine"; lfo.frequency.value = 0.08; lfoGain.gain.value = 0.006;
    lfo.connect(lfoGain); lfoGain.connect(rumble.gain.gain); lfo.start();
    registerAudioTimer(setInterval(() => {
      const drops = Math.random() > 0.45 ? 2 : 1;
      for (let i = 0; i < drops; i++) makeNatureNoiseBurst(ctx, {
        frequency: 2400 + Math.random() * 4200,
        duration: 0.05 + Math.random() * 0.12,
        gainValue: 0.006 + Math.random() * 0.012,
        pan: Math.random() * 1.7 - 0.85
      });
    }, 420));
  }

  function startBirdsSound(ctx) {
    createNoiseSource(ctx, "brown", 0.010, "lowpass", 650);
    createNoiseSource(ctx, "white", 0.004, "bandpass", 1800);
    const sing = () => {
      if (Math.random() > 0.2) makeBirdChirp(ctx, { base: 1500 + Math.random() * 1100, pan: Math.random() * 1.6 - 0.8, gainValue: 0.010 + Math.random() * 0.008 });
      if (Math.random() > 0.7) registerAudioTimer(setTimeout(() => makeBirdChirp(ctx, { base: 2100 + Math.random() * 900, pan: Math.random() * 1.4 - 0.7, gainValue: 0.008 }), 350));
    };
    sing();
    registerAudioTimer(setInterval(sing, 2300));
  }

  function startOceanSound(ctx) {
    const low = createNoiseSource(ctx, "brown", 0.030, "lowpass", 700);
    const foam = createNoiseSource(ctx, "white", 0.009, "bandpass", 2600);
    const waveLfo = registerAudioNode(ctx.createOscillator());
    const waveDepth = registerAudioNode(ctx.createGain());
    waveLfo.type = "sine"; waveLfo.frequency.value = 0.075; waveDepth.gain.value = 0.020;
    waveLfo.connect(waveDepth); waveDepth.connect(low.gain.gain); waveLfo.start();
    const foamLfo = registerAudioNode(ctx.createOscillator());
    const foamDepth = registerAudioNode(ctx.createGain());
    foamLfo.type = "sine"; foamLfo.frequency.value = 0.075; foamLfo.detune.value = 25; foamDepth.gain.value = 0.006;
    foamLfo.connect(foamDepth); foamDepth.connect(foam.gain.gain); foamLfo.start();
    registerAudioTimer(setInterval(() => {
      if (Math.random() > 0.45) makeNatureNoiseBurst(ctx, { frequency: 1700 + Math.random() * 1800, duration: 0.4 + Math.random() * 0.6, gainValue: 0.005 + Math.random() * 0.005, pan: Math.random() * 1.2 - 0.6 });
    }, 2400));
  }

  function startForestSound(ctx) {
    createNoiseSource(ctx, "brown", 0.010, "lowpass", 700);
    createNoiseSource(ctx, "white", 0.014, "bandpass", 1900);
    createNoiseSource(ctx, "white", 0.005, "highpass", 4700);
    const forestBird = () => {
      if (Math.random() > 0.35) makeBirdChirp(ctx, { base: 1700 + Math.random() * 850, pan: Math.random() * 1.5 - 0.75, gainValue: 0.007 + Math.random() * 0.006 });
    };
    registerAudioTimer(setInterval(forestBird, 3900));
    registerAudioTimer(setInterval(() => {
      makeNatureNoiseBurst(ctx, { frequency: 900 + Math.random() * 1200, duration: 0.18 + Math.random() * 0.25, gainValue: 0.004, pan: Math.random() * 1.4 - 0.7 });
    }, 1300));
  }

  function startKeysSound(ctx) {
    createNoiseSource(ctx, "brown", 0.010, "lowpass", 850);
    const notes = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
    let cursor = 0;
    const playPhrase = () => {
      const base = notes[cursor % notes.length];
      makeTone(ctx, base, 2.4, 0.045, "triangle");
      if (cursor % 3 === 0) makeTone(ctx, base * 1.5, 1.8, 0.023, "sine", 0.35);
      cursor = (cursor + (Math.random() > 0.45 ? 1 : 2)) % notes.length;
    };
    playPhrase();
    registerAudioTimer(setInterval(playPhrase, 2800));
  }

  function startFocusSound({ preview = false } = {}) {
    if (!focusAudio.enabled) return false;
    clearFocusAudioEngine();
    const mode = focusSoundModes[focusAudio.mode] || focusSoundModes.rain;
    try {
      const audio = new Audio(mode.file);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = clamp(focusAudio.volume, 0, 1);
      focusAudio.element = audio;
      focusAudio.playing = true;
      focusAudio.previewing = preview;
      renderFocusSoundUI();
      const play = audio.play();
      if (play && typeof play.catch === "function") play.catch(() => {
        if (focusAudio.element !== audio) return;
        focusAudio.playing = false;
        focusAudio.previewing = false;
        renderFocusSoundUI();
        showToast("Sound could not start. Click Preview or Start again.");
      });
      return true;
    } catch (_) {
      focusAudio.playing = false;
      focusAudio.previewing = false;
      renderFocusSoundUI();
      showToast("This browser could not play the nature soundscape.");
      return false;
    }
  }

  function stopFocusSound() {
    clearFocusAudioEngine();
  }

  function setFocusSoundMode(mode) {
    if (!focusSoundModes[mode]) return;
    const wasPlaying = focusAudio.playing;
    const wasPreviewing = focusAudio.previewing;
    focusAudio.mode = mode;
    saveFocusSoundSettings();
    if (wasPlaying) startFocusSound({ preview: wasPreviewing });
    renderFocusSoundUI();
  }

  function setFocusSoundEnabled(enabled) {
    focusAudio.enabled = Boolean(enabled);
    saveFocusSoundSettings();
    if (!focusAudio.enabled) stopFocusSound();
    else if (focusTimer.running) startFocusSound();
    renderFocusSoundUI();
  }

  function setFocusSoundVolume(value) {
    focusAudio.volume = clamp(Number(value) / 100, 0, 1);
    saveFocusSoundSettings();
    if (focusAudio.element) focusAudio.element.volume = focusAudio.volume;
    if (focusAudio.master && focusAudio.ctx) focusAudio.master.gain.setTargetAtTime(focusAudio.volume, focusAudio.ctx.currentTime, 0.03);
    renderFocusSoundUI();
  }

  function toggleFocusSoundPreview() {
    if (focusAudio.playing) {
      stopFocusSound();
      return;
    }
    if (!focusAudio.enabled) {
      focusAudio.enabled = true;
      saveFocusSoundSettings();
    }
    startFocusSound({ preview: !focusTimer.running });
  }

  function renderFocusSoundUI() {
    document.querySelectorAll("[data-soundscape]").forEach(button => {
      const active = button.dataset.soundscape === focusAudio.mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", active ? "true" : "false");
    });
    const toggle = $("focusSoundToggle");
    if (toggle) {
      toggle.classList.toggle("active", focusAudio.enabled);
      toggle.setAttribute("aria-pressed", focusAudio.enabled ? "true" : "false");
    }
    if ($("focusSoundToggleIcon")) $("focusSoundToggleIcon").textContent = focusAudio.enabled ? "🔊" : "🔇";
    if ($("focusSoundToggleText")) $("focusSoundToggleText").textContent = focusAudio.enabled ? "Sound on" : "Sound off";
    if ($("focusSoundVolume")) $("focusSoundVolume").value = String(Math.round(focusAudio.volume * 100));
    if ($("focusSoundNow")) $("focusSoundNow").textContent = focusSoundModes[focusAudio.mode].name;
    if ($("focusSoundPreview")) $("focusSoundPreview").textContent = focusAudio.playing ? "■ Stop sound" : "▶ Preview";
    if ($("focusSoundNote")) {
      $("focusSoundNote").textContent = focusAudio.playing
        ? `${focusSoundModes[focusAudio.mode].name} is playing. Keep it quiet enough that your task remains the main event.`
        : `${focusSoundModes[focusAudio.mode].note} Starts automatically with the Focus Sprint.`;
    }
    const wave = document.querySelector(".sound-wave");
    if (wave) wave.classList.toggle("playing", focusAudio.playing);
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
    if (focusAudio.enabled) startFocusSound();
    $("focusFoot").textContent = "Stay with one target until the sprint ends. New decisions can wait.";
  }
  function pauseFocusTimer() {
    if (!focusTimer.running) return;
    focusTimer.remaining = Math.max(0, Math.ceil((focusTimer.deadline - Date.now()) / 1000));
    focusTimer.running = false;
    clearInterval(focusTimer.interval);
    focusTimer.interval = null;
    renderTimer();
    stopFocusSound();
    $("focusFoot").textContent = "Paused. Resume when you are ready to protect the block again.";
  }
  function resetFocusTimer(showMessage = true) {
    focusTimer.running = false;
    clearInterval(focusTimer.interval);
    focusTimer.interval = null;
    focusTimer.remaining = focusTimer.duration;
    stopFocusSound();
    renderTimer();
    $("focusFoot").textContent = "One protected block beats a vague intention to “work later.”";
    if (showMessage) showToast("Focus timer reset");
  }
  function finishFocusTimer() {
    const taskId = $("focusTaskSelect").value;
    focusTimer.running = false;
    clearInterval(focusTimer.interval);
    focusTimer.interval = null;
    stopFocusSound();
    const minutes = Math.round(focusTimer.duration / 60);
    mutate(data => data.sessions.push({ id: uid(), itemId: taskId, planDate: dateKey(viewDate), completedAt: Date.now(), minutes }));
    focusTimer.remaining = focusTimer.duration;
    renderAll();
    renderTimer();
    $("focusStatus").textContent = "Complete ✓";
    $("focusFoot").textContent = `${minutes} focused minutes completed. +10 points.`;
    burstCelebration(["🎯", "⚡", "✨", "🚀"], 14);
    showToast(`Focus sprint complete 🎯 +10 points`);
  }

  function setHubTab(name) {
    const target = ["focus", "quality", "progress", "rewards"].includes(name) ? name : "focus";
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
    $("bookWithPratikBtn").addEventListener("click", directBookWithPratik);
    $("challengeActionBtn")?.addEventListener("click", restartChallenge);
    $("restartChallengeMenuBtn")?.addEventListener("click", restartChallenge);
    $("resetAllProgressBtn")?.addEventListener("click", resetProgressHistory);
    $("plannerForm").addEventListener("submit", submitItem);
    $("itemTimeZone")?.addEventListener("change", event => changePlannerTimeZone(event.target.value));
    $("itemDate")?.addEventListener("change", updateTimeMirrors);
    [$("itemStart"), $("itemEnd")].forEach(input => {
      input?.addEventListener("input", updateTimeMirrors);
      input?.addEventListener("blur", () => normalizeVisibleTime(input.id));
    });
    $("cancelEditBtn").addEventListener("click", () => { resetForm(); setQuickAddOpen(false); });
    $("quickAddToggleBtn")?.addEventListener("click", () => setQuickAddOpen(false));
    $("modalTodayBtn")?.addEventListener("click", () => { goToday(); setQuickAddOpen(true); });
    $("modalTomorrowBtn")?.addEventListener("click", () => { goTomorrow(); setQuickAddOpen(true); });
    $("quickAddModal")?.addEventListener("click", event => {
      const modal = $("quickAddModal");
      if (event.target === modal) setQuickAddOpen(false);
    });
    $("quickAddModal")?.addEventListener("close", () => {
      if ($("itemId")?.value || $("itemTitle")?.value.trim()) resetForm();
    });
    $("topQuickAddBtn")?.addEventListener("click", jumpToForm);
    $("todayQuickBtn")?.addEventListener("click", () => { goToday(); jumpToForm(); });
    $("tomorrowQuickBtn")?.addEventListener("click", () => { goTomorrow(); jumpToForm(); });
    $("prevDayBtn").addEventListener("click", () => shiftView(-1));
    $("nextDayBtn").addEventListener("click", () => shiftView(1));
    $("todayBtn")?.addEventListener("click", goToday);
    $("tomorrowBtn").addEventListener("click", goTomorrow);
    $("sealPlanBtn").addEventListener("click", sealPlan);
    $("heroSealBtn").addEventListener("click", () => { goTomorrow(); sealPlan(); });
    $("heroAddBtn").addEventListener("click", jumpToForm);

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

    [$("completionBars"), $("executionHeatmap"), $("executionHistory")].forEach(host => host?.addEventListener("click", event => {
      const button = event.target.closest("[data-progress-date]");
      if (!button) return;
      viewDate = parseDate(button.dataset.progressDate);
      resetForm();
      renderAll();
      setHubTab("progress");
    }));

    document.querySelectorAll("[data-soundscape]").forEach(button => button.addEventListener("click", () => setFocusSoundMode(button.dataset.soundscape)));
    $("focusSoundToggle")?.addEventListener("click", () => setFocusSoundEnabled(!focusAudio.enabled));
    $("focusSoundVolume")?.addEventListener("input", event => setFocusSoundVolume(event.target.value));
    $("focusSoundPreview")?.addEventListener("click", toggleFocusSoundPreview);
    document.querySelectorAll("[data-minutes]").forEach(button => button.addEventListener("click", () => chooseTimer(Number(button.dataset.minutes))));
    $("timerStartBtn").addEventListener("click", startFocusTimer);
    $("timerPauseBtn").addEventListener("click", pauseFocusTimer);
    $("timerResetBtn").addEventListener("click", () => resetFocusTimer(true));
    window.addEventListener("beforeunload", () => { clearInterval(focusTimer.interval); clearInterval(heroMessageTimer); stopFocusSound(); try { focusAudio.ctx?.close(); } catch (_) {} });
  }

  function init() {
    loadPlannerTimeZone();
    loadFocusSoundSettings();
    attachEvents();
    startHeroRotation();
    setHubTab("focus");
    resetForm();
    setQuickAddOpen(false);
    renderAll();
    renderTimer();
    renderFocusSoundUI();
  }

  init();
})();
