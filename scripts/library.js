function ensureLibrary(){
  if(!state.library||typeof state.library!=="object")state.library=clone(DEFAULTS.library);
  if(!Array.isArray(state.library.books))state.library.books=clone(DEFAULT_LIBRARY_BOOKS);
  if(!state.library.progress||typeof state.library.progress!=="object")state.library.progress={};
  if(!state.library.filter)state.library.filter="all";
  state.library.books.forEach(book=>{
    if(!state.library.progress[book.id])state.library.progress[book.id]={percent:0,status:"Not started",sessions:0,lastOpened:"",note:"",lastPage:0};
    if(state.library.progress[book.id].lastPage==null)state.library.progress[book.id].lastPage=0;
  });
  return state.library;
}
function libraryProgress(id){return ensureLibrary().progress[id]}
function libraryCategoryLabel(category){return {german:"German",english:"English",growth:"Personal Growth",technical:"Technical",other:"Other"}[category]||"Other"}
function safeBookUrl(url){
  if(!url)return "";
  try{const parsed=new URL(url);return ["http:","https:"].includes(parsed.protocol)?parsed.href:""}catch(e){return ""}
}
function renderLibrary(){
  const mount=document.getElementById("libraryGrid");if(!mount)return;
  const library=ensureLibrary(),books=library.books,progress=library.progress;
  const reading=books.filter(book=>progress[book.id].status==="Reading").length;
  const finished=books.filter(book=>progress[book.id].status==="Finished").length;
  const pages=books.reduce((sum,book)=>sum+Number(progress[book.id].lastPage||0),0);
  document.getElementById("librarySummary").innerHTML=[[books.length,"Books"],[reading,"Currently reading"],[finished,"Finished"],[pages,"Pages recorded"]].map(([value,label])=>`<div class="library-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
  document.querySelectorAll("[data-library-filter]").forEach(button=>button.classList.toggle("active",button.dataset.libraryFilter===library.filter));
  const visible=books.filter(book=>library.filter==="all"||book.category===library.filter||(library.filter==="reading"&&progress[book.id].status==="Reading"));
  mount.innerHTML=visible.length?visible.map(book=>{
    const p=progress[book.id],url=safeBookUrl(book.url);
    return `<article class="box glass book-card">
      <div class="book-top"><div class="book-icon">${escapeHtml(book.icon||"📘")}</div><div class="book-meta"><h3>${escapeHtml(book.title)}</h3><div class="book-author">${escapeHtml(book.author||"Unknown author")}</div><span class="book-category">${escapeHtml(libraryCategoryLabel(book.category))}</span></div></div>
      <label class="book-page"><span>Last read page</span><input type="number" min="0" max="100000" step="1" value="${Number(p.lastPage)||0}" data-book-page="${book.id}" aria-label="Last read page for ${escapeHtml(book.title)}"></label>
      <div class="book-actions">${url?`<button class="btn primary" data-book-open="${book.id}">Open</button>`:""}<button class="btn" data-book-edit="${book.id}">Edit</button><button class="btn danger" data-book-delete="${book.id}">Delete</button></div>
    </article>`;
  }).join(""):`<div class="box glass library-empty"><div>📚</div><strong>No books here yet</strong><p>Add a book or choose another filter.</p><button class="btn primary" data-library-add-empty>Add Book</button></div>`;
}
function openBookEditor(id=""){
  const book=id?ensureLibrary().books.find(item=>item.id===id):null;
  document.getElementById("bookEditorTitle").textContent=book?"Edit Book":"Add Book";
  document.getElementById("bookEditId").value=book?.id||"";
  document.getElementById("bookTitle").value=book?.title||"";
  document.getElementById("bookAuthor").value=book?.author||"";
  document.getElementById("bookCategory").value=book?.category||"other";
  document.getElementById("bookIcon").value=book?.icon||"📘";
  document.getElementById("bookUrl").value=book?.url||"";
  document.getElementById("bookPurpose").value=book?.purpose||"";
  showModal("bookEditorModal");setTimeout(()=>document.getElementById("bookTitle").focus(),20);
}
function saveBookEditor(event){
  event.preventDefault();
  const library=ensureLibrary(),editId=document.getElementById("bookEditId").value,title=document.getElementById("bookTitle").value.trim();
  if(!title)return;
  const enteredUrl=document.getElementById("bookUrl").value.trim(),url=safeBookUrl(enteredUrl);
  if(enteredUrl&&!url){showToast("Use a valid http or https link");return}
  const book={id:editId||`book-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title,author:document.getElementById("bookAuthor").value.trim(),category:document.getElementById("bookCategory").value,icon:document.getElementById("bookIcon").value.trim()||"📘",url,purpose:document.getElementById("bookPurpose").value.trim()};
  if(editId){const index=library.books.findIndex(item=>item.id===editId);if(index>=0)library.books[index]=book}else library.books.unshift(book);
  if(!library.progress[book.id])library.progress[book.id]={percent:0,status:"Not started",sessions:0,lastOpened:"",note:"",lastPage:0};
  save();hideModal("bookEditorModal");renderLibrary();showToast(editId?"Book updated":"Book added to your library");
}
function deleteLibraryBook(id){
  const library=ensureLibrary(),book=library.books.find(item=>item.id===id);if(!book||!confirm(`Delete “${book.title}” and its reading progress?`))return;
  library.books=library.books.filter(item=>item.id!==id);delete library.progress[id];save();renderLibrary();showToast("Book deleted");
}
function openLibraryBook(id){
  const library=ensureLibrary(),book=library.books.find(item=>item.id===id),url=safeBookUrl(book?.url);if(!book||!url)return;
  const p=libraryProgress(id);p.lastOpened=new Date().toISOString();if(p.status==="Not started")p.status="Reading";save();renderLibrary();window.open(url,"_blank","noopener,noreferrer");
}
function continueLibraryReading(){
  const books=ensureLibrary().books,reading=books.filter(book=>libraryProgress(book.id).status==="Reading"&&safeBookUrl(book.url)).sort((a,b)=>String(libraryProgress(b.id).lastOpened).localeCompare(String(libraryProgress(a.id).lastOpened)))[0];
  const book=reading||books.find(item=>safeBookUrl(item.url));if(book)openLibraryBook(book.id);else showToast("Add a link to a book first");
}
function attachLibraryEvents(){
  document.getElementById("libraryAddBtn").onclick=()=>openBookEditor();document.getElementById("libraryContinueBtn").onclick=continueLibraryReading;
  document.getElementById("bookEditorClose").onclick=()=>hideModal("bookEditorModal");document.getElementById("bookEditorCancel").onclick=()=>hideModal("bookEditorModal");document.getElementById("bookEditorForm").onsubmit=saveBookEditor;
  document.getElementById("libraryFilter").onclick=e=>{const button=e.target.closest("[data-library-filter]");if(!button)return;ensureLibrary().filter=button.dataset.libraryFilter;save();renderLibrary()};
  document.getElementById("libraryGrid").onclick=e=>{const target=e.target.closest("button");if(!target)return;if(target.dataset.bookOpen)openLibraryBook(target.dataset.bookOpen);else if(target.dataset.bookEdit)openBookEditor(target.dataset.bookEdit);else if(target.dataset.bookDelete)deleteLibraryBook(target.dataset.bookDelete);else if(target.hasAttribute("data-library-add-empty"))openBookEditor()};
  document.getElementById("libraryGrid").oninput=e=>{const target=e.target;if(!target.dataset.bookPage)return;const p=libraryProgress(target.dataset.bookPage);p.lastPage=Math.max(0,Math.round(Number(target.value)||0));if(p.lastPage>0&&p.status==="Not started")p.status="Reading";p.lastOpened=new Date().toISOString();save()};
}
