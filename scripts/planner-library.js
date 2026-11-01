(() => {
  "use strict";

  const APP_KEY = "pratiksProgressPlan_v3";
  const DEFAULT_BOOKS = [
    {id:"german-fundamentals",category:"german",icon:"🇩🇪",title:"German A1 Fundamentals Handbook",author:"A1 reference handbook",purpose:"Build grammar, vocabulary, and essential foundations for daily German.",url:"https://drive.google.com/file/d/1kVxmjmgO4rOIrywIOL0SaiKC6-MNru3t/view"},
    {id:"cafe-berlin",category:"german",icon:"☕",title:"Café in Berlin",author:"André Klein",purpose:"Learn beginner German naturally through short stories set in Berlin.",url:"https://drive.google.com/file/d/13JhV8dSWhm3bpXbxij277Zk78DXtJeNj/view"},
    {id:"english-conversation",category:"english",icon:"🗣️",title:"Practice Makes Perfect: English Conversation",author:"Fourth Edition",purpose:"Improve practical English speaking through structured conversation practice.",url:"https://drive.google.com/file/d/16WQQpN4T_Hhj_lUehbezTwo6jzfNo80v/view"},
    {id:"win-friends",category:"growth",icon:"🤝",title:"How to Win Friends and Influence People",author:"Dale Carnegie",purpose:"Strengthen communication, relationships, and everyday social confidence.",url:"https://drive.google.com/file/d/1frLkfcr18w139-fwH-_N94QBaDLM9ZM0/view"},
    {id:"zero-to-one",category:"growth",icon:"🚀",title:"Zero to One",author:"Peter Thiel with Blake Masters",purpose:"Think differently about ideas, value creation, and building something new.",url:"https://drive.google.com/file/d/1_ZZq5jGDp3QcF8E4g5LQBfZwO6Fh6SlN/view"},
    {id:"moved-cheese",category:"growth",icon:"🧀",title:"Who Moved My Cheese?",author:"Spencer Johnson",purpose:"A short story about adapting when life and plans change.",url:"https://drive.google.com/file/d/1xaW0Cp9MldCwFLtGIThVFSAWOIQ1-JH_/view"},
    {id:"subconscious",category:"growth",icon:"🧠",title:"The Power of Your Subconscious Mind",author:"Joseph Murphy",purpose:"Explore beliefs, mental habits, and the stories you repeatedly tell yourself.",url:"https://drive.google.com/file/d/1oVqSSOXPgDr5hQkskUVRl4upqzoMIM33/view"},
    {id:"thinking-clearly",category:"growth",icon:"💡",title:"The Art of Thinking Clearly",author:"Rolf Dobelli",purpose:"Recognize common thinking errors and make calmer everyday decisions.",url:"https://drive.google.com/file/d/1YlGeMD46YxdKmisZR4DAfAxN_xZ1Jm4K/view"},
    {id:"five-second-rule",category:"growth",icon:"5️⃣",title:"The 5 Second Rule",author:"Mel Robbins",purpose:"Use a simple countdown to interrupt hesitation and begin taking action.",url:"https://drive.google.com/file/d/1LC1GT8GJQZiDapJUVy8OvrRaFnZZPmMG/view"},
    {id:"seven-habits-teens",category:"growth",icon:"7️⃣",title:"The 7 Habits of Highly Effective Teens",author:"Sean Covey",purpose:"Build responsibility, priorities, relationships, and sustainable habits.",url:"https://drive.google.com/file/d/1ju-AIoDP6NAxYvALrZEr2eVpcbgwukb/view"},
    {id:"time-management-bn",category:"growth",icon:"⏰",title:"টাইম ম্যানেজমেন্ট",author:"Bangla edition",purpose:"Develop practical time-management thinking in a familiar language.",url:"https://drive.google.com/file/d/1l0UqQtzMeFQXO5qdXHKq_uAtNljRReeI/view"},
    {id:"miracle-morning-bn",category:"growth",icon:"🌅",title:"দ্য মিরাকল মর্নিং",author:"Bangla edition",purpose:"Explore a structured morning routine for energy and consistency.",url:"https://drive.google.com/file/d/1rMmYYAmNUpaQh3GTsxUp_ZS9CX-y0DVR/view"},
    {id:"t-popt",category:"growth",icon:"📘",title:"TPOPT 2019",author:"Bangla book",purpose:"A saved personal-development resource from your collection.",url:"https://drive.google.com/file/d/1CQtAZ8HdaDGk8PCQUkrfk6wlVj1ZBZJb/view"},
    {id:"system-design-bangla",category:"technical",icon:"💻",title:"System Design Bangla",author:"Mahfuz Mia",purpose:"Learn system design in Bangla through practical architecture concepts.",url:"https://systemdesignbangla.com/"}
  ];
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const categoryNames = {german:"German",english:"English",growth:"Personal Growth",technical:"Technical",other:"Other"};
  let library = null;

  function readLibrary() {
    let app = {};
    try { app = JSON.parse(localStorage.getItem(APP_KEY) || "{}") || {}; } catch (_) {}
    const saved = app.library && typeof app.library === "object" ? app.library : {};
    library = {
      books: Array.isArray(saved.books) ? saved.books : DEFAULT_BOOKS.map(book => ({...book})),
      progress: saved.progress && typeof saved.progress === "object" ? saved.progress : {},
      filter: saved.filter || "all"
    };
    library.books.forEach(book => {
      if (!library.progress[book.id]) library.progress[book.id] = {percent:0,status:"Not started",sessions:0,lastOpened:"",note:"",lastPage:0};
      if (library.progress[book.id].lastPage == null) library.progress[book.id].lastPage = 0;
    });
    return library;
  }

  function persistLibrary() {
    let app = {};
    try { app = JSON.parse(localStorage.getItem(APP_KEY) || "{}") || {}; } catch (_) {}
    app.library = library;
    localStorage.setItem(APP_KEY, JSON.stringify(app));
    window.dispatchEvent(new CustomEvent("ppp-library-updated"));
  }

  function safeURL(value) {
    if (!value) return "";
    try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) ? url.href : ""; } catch (_) { return ""; }
  }

  function showMessage(message) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function render() {
    if (!library) readLibrary();
    const books = library.books;
    const progress = library.progress;
    const reading = books.filter(book => progress[book.id].status === "Reading").length;
    const finished = books.filter(book => progress[book.id].status === "Finished").length;
    const pages = books.reduce((sum, book) => sum + (Number(progress[book.id].lastPage) || 0), 0);
    $("plannerLibrarySummary").innerHTML = [[books.length,"Books"],[reading,"Currently reading"],[finished,"Finished"],[pages,"Pages recorded"]]
      .map(([value,label]) => `<div class="pl-library-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
    document.querySelectorAll("[data-pl-library-filter]").forEach(button => button.classList.toggle("active", button.dataset.plLibraryFilter === library.filter));
    const visible = books.filter(book => library.filter === "all" || book.category === library.filter || (library.filter === "reading" && progress[book.id].status === "Reading"));
    $("plannerLibraryGrid").innerHTML = visible.length ? visible.map(book => {
      const p = progress[book.id], url = safeURL(book.url);
      return `<article class="pl-book-card">
        <div class="pl-book-top"><div class="pl-book-icon">${escapeHTML(book.icon || "📘")}</div><div class="pl-book-meta"><h3>${escapeHTML(book.title)}</h3><div class="pl-book-author">${escapeHTML(book.author || "Unknown author")}</div><span class="pl-book-category">${escapeHTML(categoryNames[book.category] || "Other")}</span></div></div>
        ${book.purpose ? `<p class="pl-book-purpose">${escapeHTML(book.purpose)}</p>` : ""}
        <label class="pl-book-page"><span>Last read page</span><input type="number" min="0" max="100000" step="1" value="${Math.max(0, Number(p.lastPage) || 0)}" data-pl-book-page="${escapeHTML(book.id)}" aria-label="Last read page for ${escapeHTML(book.title)}"></label>
        <div class="pl-book-actions">${url ? `<button class="pl-library-btn primary" data-pl-book-open="${escapeHTML(book.id)}" type="button">Open</button>` : ""}<button class="pl-library-btn" data-pl-book-edit="${escapeHTML(book.id)}" type="button">Edit</button><button class="pl-library-btn danger" data-pl-book-delete="${escapeHTML(book.id)}" type="button">Delete</button></div>
      </article>`;
    }).join("") : `<div class="pl-library-empty"><div>📚</div><strong>No books here yet</strong><p>Add a book or choose another filter.</p><button class="pl-library-btn primary" data-pl-library-add-empty type="button">Add Book</button></div>`;
  }

  function openEditor(id = "") {
    const book = id ? library.books.find(item => item.id === id) : null;
    $("plBookEditorTitle").textContent = book ? "Edit Book" : "Add Book";
    $("plBookEditId").value = book?.id || "";
    $("plBookTitle").value = book?.title || "";
    $("plBookAuthor").value = book?.author || "";
    $("plBookCategory").value = book?.category || "other";
    $("plBookIcon").value = book?.icon || "📘";
    $("plBookUrl").value = book?.url || "";
    $("plBookPurpose").value = book?.purpose || "";
    $("plBookEditor").showModal();
    setTimeout(() => $("plBookTitle").focus(), 30);
  }

  function saveEditor(event) {
    event.preventDefault();
    const editId = $("plBookEditId").value;
    const title = $("plBookTitle").value.trim();
    if (!title) return;
    const enteredURL = $("plBookUrl").value.trim();
    const url = safeURL(enteredURL);
    if (enteredURL && !url) { showMessage("Use a valid http or https link"); return; }
    const book = {
      id: editId || `book-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      title,
      author: $("plBookAuthor").value.trim(),
      category: $("plBookCategory").value,
      icon: $("plBookIcon").value.trim() || "📘",
      url,
      purpose: $("plBookPurpose").value.trim()
    };
    if (editId) {
      const index = library.books.findIndex(item => item.id === editId);
      if (index >= 0) library.books[index] = book;
    } else library.books.unshift(book);
    if (!library.progress[book.id]) library.progress[book.id] = {percent:0,status:"Not started",sessions:0,lastOpened:"",note:"",lastPage:0};
    persistLibrary();
    $("plBookEditor").close();
    render();
    showMessage(editId ? "Book updated" : "Book added to your library");
  }

  function deleteBook(id) {
    const book = library.books.find(item => item.id === id);
    if (!book || !window.confirm(`Delete “${book.title}” and its reading progress?`)) return;
    library.books = library.books.filter(item => item.id !== id);
    delete library.progress[id];
    persistLibrary();
    render();
    showMessage("Book deleted");
  }

  function openBook(id) {
    const book = library.books.find(item => item.id === id);
    const url = safeURL(book?.url);
    if (!book || !url) return;
    const p = library.progress[id];
    p.lastOpened = new Date().toISOString();
    if (p.status === "Not started") p.status = "Reading";
    persistLibrary();
    render();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function continueReading() {
    const reading = library.books.filter(book => library.progress[book.id].status === "Reading" && safeURL(book.url))
      .sort((a,b) => String(library.progress[b.id].lastOpened).localeCompare(String(library.progress[a.id].lastOpened)))[0];
    const book = reading || library.books.find(item => safeURL(item.url));
    if (book) openBook(book.id); else showMessage("Add a link to a book first");
  }

  function showLibrary() {
    $("plannerLibraryView").hidden = false;
    $("plannerMainContent").hidden = true;
    $("plannerLibraryOpenBtn").setAttribute("aria-pressed","true");
    window.scrollTo({top:0,behavior:"instant"});
    render();
  }
  function hideLibrary() {
    $("plannerLibraryView").hidden = true;
    $("plannerMainContent").hidden = false;
    $("plannerLibraryOpenBtn").setAttribute("aria-pressed","false");
    window.scrollTo({top:0,behavior:"instant"});
  }

  function init() {
    readLibrary();
    $("plannerLibraryOpenBtn").addEventListener("click", showLibrary);
    $("plannerLibraryBackBtn").addEventListener("click", hideLibrary);
    $("plannerLibraryAddBtn").addEventListener("click", () => openEditor());
    $("plannerLibraryContinueBtn").addEventListener("click", continueReading);
    $("plBookEditorClose").addEventListener("click", () => $("plBookEditor").close());
    $("plBookEditorCancel").addEventListener("click", () => $("plBookEditor").close());
    $("plBookEditorForm").addEventListener("submit", saveEditor);
    $("plBookEditor").addEventListener("click", event => { if (event.target === $("plBookEditor")) $("plBookEditor").close(); });
    $("plannerLibraryFilter").addEventListener("click", event => {
      const button = event.target.closest("[data-pl-library-filter]");
      if (!button) return;
      library.filter = button.dataset.plLibraryFilter;
      persistLibrary();
      render();
    });
    $("plannerLibraryGrid").addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.plBookOpen) openBook(button.dataset.plBookOpen);
      else if (button.dataset.plBookEdit) openEditor(button.dataset.plBookEdit);
      else if (button.dataset.plBookDelete) deleteBook(button.dataset.plBookDelete);
      else if (button.hasAttribute("data-pl-library-add-empty")) openEditor();
    });
    $("plannerLibraryGrid").addEventListener("change", event => {
      const input = event.target;
      if (!input.dataset.plBookPage) return;
      const progress = library.progress[input.dataset.plBookPage];
      progress.lastPage = Math.max(0, Math.min(100000, Math.round(Number(input.value) || 0)));
      if (progress.lastPage > 0 && progress.status === "Not started") progress.status = "Reading";
      progress.lastOpened = new Date().toISOString();
      persistLibrary();
      render();
    });
    window.addEventListener("storage", event => {
      if (event.key === APP_KEY) { readLibrary(); if (!$("plannerLibraryView").hidden) render(); }
    });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();