(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (value, options = { weekday: 'long', month: 'long', day: 'numeric' }) => new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', options);
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function sanitizeRichHtml(input = '') {
    const allowed = new Set(['P', 'BR', 'H2', 'H3', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SPAN', 'DIV', 'SUP', 'SUB', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD']);
    const dangerous = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'VIDEO', 'AUDIO', 'SVG', 'MATH']);
    try {
      const parsed = new DOMParser().parseFromString(String(input), 'text/html');
      const clean = node => [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.COMMENT_NODE) { child.remove(); return; }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (dangerous.has(child.tagName)) { child.remove(); return; }
        if (!allowed.has(child.tagName)) { clean(child); child.replaceWith(...child.childNodes); return; }
        [...child.attributes].forEach(attr => {
          if (attr.name === 'style') {
            const style = child.style; const keep = {};
            ['color', 'background-color', 'font-weight', 'font-style', 'text-decoration', 'text-align', 'font-size', 'border', 'padding', 'vertical-align'].forEach(key => { const value = style.getPropertyValue(key); if (value && !/url\s*\(|expression/i.test(value)) keep[key] = value; });
            child.removeAttribute('style'); Object.entries(keep).forEach(([key, value]) => child.style.setProperty(key, value));
          } else child.removeAttribute(attr.name);
        });
        clean(child);
      });
      clean(parsed.body);
      return parsed.body.innerHTML;
    } catch { return escapeHtml(String(input).replace(/<[^>]*>/g, '')); }
  }
  function safeMediaUrl(value = '') {
    const url = String(value);
    if (/^(https:\/\/|blob:|data:image\/(png|jpeg|jpg|gif|webp);base64,|data:audio\/[a-z0-9.+-]+;base64,|data:video\/[a-z0-9.+-]+;base64,|data:application\/(?:pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|zip);base64,)/i.test(url)) return escapeHtml(url);
    return '';
  }
  const colors = ['sand', 'sage', 'rose', 'ink', 'blue'];
  const promptPool = [
    'What is something small that made today feel like yours?',
    'What would you like to remember about this week?',
    'What felt easier than you expected?',
    'Which place has been on your mind lately?',
    'What are you quietly proud of?',
    'What did you notice today that you might usually miss?'
  ];
  const templates = {
    daily: { title: 'A day in my life', elements: [
      { type: 'text', x: 9, y: 8, w: 78, h: 12, content: '<h2>Today, in a few words.</h2>' },
      { type: 'text', x: 9, y: 25, w: 78, h: 19, content: '<p>What happened today? Start anywhere. The ordinary things count, too.</p>' },
      { type: 'quote', x: 11, y: 53, w: 72, h: 12, content: 'One thing I want to remember…' },
      { type: 'text', x: 9, y: 74, w: 78, h: 12, content: '<p><strong>Tomorrow, I hope…</strong></p>' }
    ] },
    weekly: { title: 'A week to look back on', elements: [
      { type: 'text', x: 8, y: 8, w: 82, h: 12, content: '<h2>This week, I learned…</h2>' },
      { type: 'text', x: 8, y: 25, w: 82, h: 17, content: '<p>The moments I want to keep:</p>' },
      { type: 'checklist', x: 10, y: 48, w: 70, h: 20, items: ['A little win', 'A moment with someone', 'Something new'] },
      { type: 'quote', x: 10, y: 76, w: 75, h: 12, content: 'Next week, I want to make room for…' }
    ] },
    gratitude: { title: 'Things I am grateful for', elements: [
      { type: 'text', x: 8, y: 8, w: 82, h: 12, content: '<h2>Good things, big & small.</h2>' },
      { type: 'text', x: 10, y: 28, w: 75, h: 11, content: '<p>Today I am grateful for…</p>' },
      { type: 'checklist', x: 11, y: 43, w: 76, h: 36, items: ['A person who makes me feel seen', 'A place I feel at home', 'A small thing I often take for granted'] }
    ] },
    travel: { title: 'A place I went', elements: [
      { type: 'text', x: 9, y: 8, w: 82, h: 13, content: '<h2>A little postcard to myself.</h2>' },
      { type: 'quote', x: 10, y: 28, w: 76, h: 10, content: 'Where I went · Who was there · How it felt' },
      { type: 'text', x: 10, y: 46, w: 80, h: 17, content: '<p>The details I want to remember…</p>' },
      { type: 'sticker', x: 76, y: 75, w: 12, h: 12, content: '✈️' }
    ] },
    ideas: { title: 'An ideas page', elements: [
      { type: 'text', x: 8, y: 8, w: 82, h: 13, content: '<h2>Things worth exploring.</h2>' },
      { type: 'text', x: 10, y: 28, w: 80, h: 13, content: '<p>A thought I keep coming back to…</p>' },
      { type: 'quote', x: 11, y: 53, w: 75, h: 13, content: 'What if I tried…' }
    ] },
    dream: { title: 'A dream to remember', elements: [
      { type: 'text', x: 9, y: 8, w: 82, h: 13, content: '<h2>Somewhere between sleep & waking.</h2>' },
      { type: 'text', x: 10, y: 29, w: 78, h: 25, content: '<p>What do I remember? Colours, places, people, strange little details…</p>' },
      { type: 'quote', x: 10, y: 69, w: 75, h: 12, content: 'The feeling I woke up with…' }
    ] }
  };

  const sampleDate = todayISO();
  const seed = {
    version: 1,
    profile: { displayName: 'Your space', accent: 'sage', paper: 'cream', reminders: false, privateByDefault: true },
    journals: [
      { id: 'journal_everyday', title: 'The everyday', description: 'A place for the days in between.', cover: 'sage', archived: false, createdAt: sampleDate, updatedAt: sampleDate, pages: [
        { id: 'page_welcome', date: sampleDate, title: 'A page to begin', paper: 'cream', size: 'a5', elements: [
          { id: 'welcome_title', type: 'text', x: 10, y: 10, w: 78, h: 16, content: '<h2>A life is made<br>of little things.</h2>' },
          { id: 'welcome_body', type: 'text', x: 10, y: 34, w: 76, h: 18, content: '<p>This is your space to collect them. Write a little, add a photograph, leave a note for another day. There is no right way to fill these pages.</p>' },
          { id: 'welcome_quote', type: 'quote', x: 11, y: 66, w: 74, h: 13, content: 'Make a little room for the life you are living.' },
          { id: 'welcome_flower', type: 'sticker', x: 78, y: 82, w: 12, h: 12, content: '✳' }
        ]},
        { id: 'page_today', date: sampleDate, title: 'A Friday to keep', paper: 'cream', size: 'a5', elements: [
          { id: 'today_heading', type: 'text', x: 9, y: 9, w: 82, h: 14, content: '<h2>Friday, in a few words.</h2>' },
          { id: 'today_text', type: 'text', x: 10, y: 27, w: 79, h: 20, content: '<p>Start with the part of today you want to remember. A conversation, a walk, a little win, a feeling. This page belongs to you.</p>' },
          { id: 'today_quote', type: 'quote', x: 10, y: 62, w: 74, h: 12, content: 'The ordinary is worth noticing.' }
        ]}
      ]},
      { id: 'journal_places', title: 'Places & moments', description: 'Postcards from here and there.', cover: 'sand', archived: false, createdAt: sampleDate, updatedAt: sampleDate, pages: [
        { id: 'page_places_left', date: sampleDate, title: 'A little map', paper: 'white', size: 'a5', elements: [
          { id: 'places_intro', type: 'text', x: 9, y: 10, w: 81, h: 15, content: '<h2>Somewhere worth remembering.</h2>' },
          { id: 'places_intro_body', type: 'text', x: 10, y: 34, w: 78, h: 18, content: '<p>Keep a ticket, a map, a photograph, or just the name of a street. Small details bring a place back.</p>' }
        ]},
        { id: 'page_places', date: sampleDate, title: 'Places to remember', paper: 'white', size: 'a5', elements: [
          { id: 'places_title', type: 'text', x: 9, y: 10, w: 81, h: 15, content: '<h2>Places that stay with me.</h2>' },
          { id: 'places_body', type: 'text', x: 10, y: 34, w: 78, h: 18, content: '<p>Keep a ticket, a map, a photograph, or just the name of a street. Small details bring a place back.</p>' },
          { id: 'places_sticker', type: 'sticker', x: 73, y: 76, w: 13, h: 13, content: '✿' }
        ]}
      ]}
    ],
    goals: [
      { id: 'goal_read', title: 'Read more for pleasure', detail: 'Make a little time for books.', progress: 35, due: '', done: false },
      { id: 'goal_photos', title: 'Make a photo book', detail: 'Collect favourite moments from this year.', progress: 60, due: '', done: false }
    ],
    habits: [
      { id: 'habit_write', title: 'Write a few lines', frequency: 'Daily', doneDates: [] },
      { id: 'habit_read', title: 'Read for 15 minutes', frequency: 'Daily', doneDates: [] },
      { id: 'habit_pause', title: 'Take a quiet moment', frequency: 'Daily', doneDates: [] }
    ],
    checkins: [],
    memories: []
  };

  let state = null;
  let activeView = 'today';
  let currentJournalId = 'journal_everyday';
  let spreadStart = 0;
  let mobileSide = 'right';
  let selectedElementId = null;
  let selectedPageSide = 'right';
  let activeTool = 'select';
  let zoom = 100;
  let saveTimer = null;
  let toastTimer = null;
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selectedCalendarDate = todayISO();
  let journalFilter = 'all';
  let settingsTab = 'appearance';
  let drawContext = null;
  let drawState = null;
  let selectedElementDrag = null;
  let idb = null;
  let lastSnapshot = null;
  let pendingSnapshot = null;
  let historyTimer = null;
  const undoStack = [];
  const redoStack = [];
  const modalBackdrop = $('#modal-backdrop');

  function openDb() {
    return new Promise(resolve => {
      try {
        if (!('indexedDB' in window)) return resolve(null);
        const request = indexedDB.open('morrow-local-v1', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('app', { keyPath: 'key' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
  }
  async function dbGet(key) {
    if (!idb) return null;
    return new Promise(resolve => { const tx = idb.transaction('app', 'readonly'); const req = tx.objectStore('app').get(key); req.onsuccess = () => resolve(req.result?.value ?? null); req.onerror = () => resolve(null); });
  }
  async function dbPut(key, value) {
    if (!idb) { try { localStorage.setItem('morrow-state', JSON.stringify(value)); return true; } catch { return false; } }
    return new Promise(resolve => { const tx = idb.transaction('app', 'readwrite'); tx.objectStore('app').put({ key, value }); tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); });
  }
  async function loadState() {
    idb = await openDb();
    let saved = await dbGet('state');
    if (!saved) { try { saved = JSON.parse(localStorage.getItem('morrow-state') || 'null'); } catch { saved = null; } }
    if (saved && saved.version === 1) return saved;
    return structuredClone(seed);
  }
  function saveState() {
    $('#save-state').textContent = 'Saving…';
    const snapshot = JSON.stringify(state);
    if (lastSnapshot !== null && snapshot !== lastSnapshot) {
      pendingSnapshot = lastSnapshot;
      clearTimeout(historyTimer);
      historyTimer = setTimeout(() => {
        if (pendingSnapshot && pendingSnapshot !== JSON.stringify(state)) {
          undoStack.push(pendingSnapshot);
          if (undoStack.length > 25) undoStack.shift();
          redoStack.length = 0;
        }
        lastSnapshot = JSON.stringify(state);
        pendingSnapshot = null;
      }, 600);
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const ok = await dbPut('state', state);
      $('#save-state').textContent = ok ? 'All changes saved' : 'Storage is full';
      if (!ok) toast('Could not save. Try a smaller media file or export a backup.');
    }, 350);
  }
  function restoreHistory(from, to, direction) {
    clearTimeout(historyTimer);
    if (pendingSnapshot && pendingSnapshot !== JSON.stringify(state)) from.push(pendingSnapshot);
    pendingSnapshot = null;
    if (!from.length) return toast(direction === 'undo' ? 'Nothing to undo yet.' : 'Nothing to redo yet.');
    to.push(JSON.stringify(state));
    state = JSON.parse(from.pop());
    lastSnapshot = JSON.stringify(state);
    saveState();
    renderLibrary();
    if (activeView === 'editor') {
      const existing = state.journals.some(j => j.id === currentJournalId);
      if (!existing) currentJournalId = state.journals[0]?.id;
      renderEditor();
    } else if (activeView === 'today') renderToday();
    else if (activeView === 'journals') renderJournals();
    else if (activeView === 'calendar') renderCalendar();
    else if (activeView === 'goals') renderGoals();
    else if (activeView === 'memories') renderMemories();
    else if (activeView === 'wrapped') renderWrapped();
    else if (activeView === 'settings') renderSettings();
    toast(direction === 'undo' ? 'Last change undone.' : 'Change restored.');
  }
  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }
  function currentJournal() { return state.journals.find(j => j.id === currentJournalId) || state.journals[0]; }
  function currentPage(index = spreadStart + 1) { const j = currentJournal(); return j?.pages[index] || j?.pages[0]; }
  function pageBySide(side) { const actualSide = window.innerWidth <= 650 ? mobileSide : side; return currentJournal()?.pages[spreadStart + (actualSide === 'left' ? 0 : 1)]; }
  function blankPage(title = 'Untitled page', date = todayISO()) { return { id: uid('page'), date, title, paper: state.profile.paper || 'cream', size: 'a5', elements: [] }; }
  function appendSpread(journal, rightPage) {
    if (journal.pages.length % 2 !== 0) journal.pages.push(blankPage('A quiet page'));
    const leftIndex = journal.pages.length;
    journal.pages.push(blankPage(''), rightPage);
    journal.updatedAt = rightPage.date || todayISO();
    return leftIndex;
  }
  function journalPageCount(j) { return j.pages.length; }
  function updateCrumb(view) {
    const labels = { today: 'Today', journals: 'My journals', editor: currentJournal()?.title || 'Journal', calendar: 'Calendar', goals: 'Goals & habits', memories: 'Memories', wrapped: 'Your year', community: 'Discover', settings: 'Settings' };
    $('#crumb-current').textContent = labels[view] || 'Today';
  }
  function showView(view) {
    activeView = view;
    $$('.view').forEach(el => el.classList.toggle('active', el.id === `view-${view}`));
    $$('.nav-link[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    updateCrumb(view);
    $('#sidebar').classList.remove('open');
    if (view === 'today') renderToday();
    if (view === 'journals') renderJournals();
    if (view === 'calendar') renderCalendar();
    if (view === 'goals') renderGoals();
    if (view === 'memories') renderMemories();
    if (view === 'wrapped') renderWrapped();
    if (view === 'settings') renderSettings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openJournal(journalId, pageIndex = 1) {
    currentJournalId = journalId;
    const maxIndex = Math.max(0, currentJournal().pages.length - 1);
    const targetIndex = Math.max(0, Math.min(pageIndex, maxIndex));
    spreadStart = targetIndex - (targetIndex % 2);
    mobileSide = targetIndex % 2 === 0 ? 'left' : 'right';
    selectedElementId = null; activeTool = 'select';
    showView('editor'); renderEditor();
  }
  function createElement(type, extras = {}) {
    const base = { id: uid('el'), type, x: 11, y: 12, w: 70, h: 13, content: '' };
    const defaults = {
      text: { content: '<p>Start writing here…</p>', w: 78, h: 14 },
      quote: { content: 'A thought worth keeping.', w: 72, h: 14 },
      sticker: { content: '✳', w: 12, h: 12 },
      checklist: { items: ['One thing to do', 'Another little thing'], w: 74, h: 19 },
      table: { content: '<table><tbody><tr><th>Moment</th><th>Details</th></tr><tr><td>A little thing</td><td>Write it here</td></tr><tr><td>Another one</td><td>And here</td></tr></tbody></table>', w: 78, h: 28 },
      photo: { src: '', caption: '', w: 42, h: 31 },
      audio: { src: '', fileName: 'Voice note', w: 70, h: 10 },
      video: { src: '', fileName: 'Video', w: 48, h: 30 },
      attachment: { src: '', fileName: 'Attachment', w: 60, h: 11 }
    };
    return { ...base, ...(defaults[type] || {}), ...extras };
  }
  function addElementToPage(element, side = 'right') {
    if (window.innerWidth <= 650) side = mobileSide;
    const page = pageBySide(side);
    if (!page) return toast('Add a page first.');
    page.elements.push(element);
    currentJournal().updatedAt = todayISO();
    selectedElementId = element.id; selectedPageSide = side;
    saveState(); renderEditor(); selectElement(element.id, side);
  }
  function selectElement(id, side = 'right') {
    selectedElementId = id; selectedPageSide = side;
    $$('.page-element').forEach(el => el.classList.toggle('selected', el.dataset.elementId === id));
    renderInspectorSelection();
  }
  function renderEditor() {
    const journal = currentJournal(); if (!journal) return;
    $('#editor-journal-title').textContent = journal.title;
    const left = journal.pages[spreadStart], right = journal.pages[spreadStart + 1];
    const isPhone = window.innerWidth <= 650;
    const activePage = isPhone ? (mobileSide === 'left' ? left : right) : right;
    const activeIndex = spreadStart + (isPhone && mobileSide === 'left' ? 0 : 1);
    renderBookPage('left', left, spreadStart);
    renderBookPage('right', right, spreadStart + 1);
    $('#spread-indicator').textContent = isPhone ? `Page ${Math.max(1, activeIndex + 1)} of ${journal.pages.length}` : `${spreadStart + 1}–${Math.min(spreadStart + 2, journal.pages.length)} of ${journal.pages.length}`;
    const canPrev = isPhone ? activeIndex > 0 : spreadStart > 0;
    const canNext = isPhone ? activeIndex < journal.pages.length - 1 : spreadStart + 2 < journal.pages.length;
    $('#prev-page').disabled = !canPrev; $('#next-page').disabled = !canNext;
    $('#prev-page').style.opacity = canPrev ? 1 : .35;
    $('#next-page').style.opacity = canNext ? 1 : .35;
    $('#editor-page-date').textContent = activePage ? fmtDate(activePage.date) : 'New page';
    $('#editor-page-number').textContent = activePage ? `Page ${String(activeIndex + 1).padStart(2, '0')}` : 'New page';
    $('#page-title-input').value = activePage?.title || '';
    $('#page-size').value = activePage?.size || 'a5';
    updatePaperSwatches(activePage?.paper || 'cream');
    $('#book-status').textContent = ({ a5: 'A5 · Portrait', a4: 'A4 · Portrait', square: 'Square · 20 × 20 cm' })[activePage?.size || 'a5'];
    $('#book-spread').style.transform = `scale(${zoom / 100})`;
    $$('.tool-button[data-tool]').forEach(b => b.classList.toggle('selected', b.dataset.tool === activeTool));
    if (selectedElementId) renderInspectorSelection(); else $('#selected-element-section').innerHTML = '<label>Selected element</label><p class="muted-small">Select something on the page to edit its details.</p>';
  }
  function renderBookPage(side, page, index) {
    const pageEl = $(`#${side}-page`), content = $(`#${side}-content`), canvas = $(`#${side}-canvas`);
    pageEl.classList.toggle('hide-page', !page);
    if (!page) { content.innerHTML = ''; return; }
    pageEl.dataset.pageIndex = index;
    const mobileActive = window.innerWidth <= 650 && side === mobileSide;
    pageEl.className = `book-page ${side}-page paper-${page.paper || 'cream'} ${mobileActive ? 'mobile-active' : ''}`;
    pageEl.querySelector('.page-number').textContent = String(index + 1).padStart(2, '0');
    content.innerHTML = page.elements.map(el => elementMarkup(el, side)).join('');
    pageEl.style.aspectRatio = page.size === 'square' ? '1 / 1' : (page.size === 'a4' ? '.707 / 1' : '.707 / 1');
    pageEl.style.maxWidth = page.size === 'square' ? 'none' : '';
    attachPageEvents(content, side);
    setupCanvas(canvas, page, side);
  }
  function elementMarkup(el, side) {
    const clamp = (value, fallback, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
    const defaultSize = el.type === 'quote' ? 17 : (el.type === 'sticker' ? 40 : 13);
    const fontFamily = ({ serif: 'Georgia, serif', sans: 'Arial, sans-serif', mono: 'monospace' })[el.fontFamily] || 'Georgia, serif';
    const left = clamp(el.x, 10, 0, 95), top = clamp(el.y, 10, 0, 95), width = clamp(el.w, 70, 8, 95), height = clamp(el.h, 15, 5, 80), fontSize = clamp(el.fontSize, defaultSize, 8, 60);
    const safeColor = /^#[0-9a-f]{3,8}$/i.test(String(el.color || '')) ? el.color : (el.type === 'quote' ? '#747e5d' : '#42463d');
    const style = `left:${left}%;top:${top}%;width:${width}%;height:${height}%;font-size:${fontSize}px;color:${safeColor};font-family:${fontFamily};`;
    const selected = selectedElementId === el.id && selectedPageSide === side ? ' selected' : '';
    const data = `data-element-id="${escapeHtml(el.id)}" data-side="${side}"`;
    if (el.type === 'text') return `<div class="page-element text-element${selected}" ${data} style="${style}" contenteditable="true" spellcheck="false">${sanitizeRichHtml(el.content || '<p>Start writing here…</p>')}</div>`;
    if (el.type === 'quote') return `<div class="page-element quote-element${selected}" ${data} style="${style}" contenteditable="true">${sanitizeRichHtml(el.content || '')}</div>`;
    if (el.type === 'table') return `<div class="page-element table-element${selected}" ${data} style="${style}" contenteditable="true" spellcheck="false">${sanitizeRichHtml(el.content || '')}</div>`;
    if (el.type === 'sticker') return `<div class="page-element sticker-element${selected}" ${data} style="${style}">${escapeHtml(el.content || '✳')}</div>`;
    if (el.type === 'photo') return `<div class="page-element photo-element${selected}" ${data} style="${style}transform:rotate(${Math.max(-20, Math.min(20, Number(el.rotation) || -2))}deg)"><img src="${safeMediaUrl(el.src)}" alt="${escapeHtml(el.caption || 'Journal photograph')}" draggable="false"><div class="photo-caption" contenteditable="true">${escapeHtml(el.caption || 'a moment to keep')}</div></div>`;
    if (el.type === 'checklist') return `<div class="page-element checklist-element${selected}" ${data} style="${style}">${(el.items || []).map((item, i) => `<label><input type="checkbox" data-check-index="${i}" ${el.checked?.[i] ? 'checked' : ''}> <span>${escapeHtml(item)}</span></label>`).join('')}</div>`;
    if (el.type === 'audio') return `<div class="page-element audio-element${selected}" ${data} style="${style}">♫ ${escapeHtml(el.fileName || 'Voice note')}<audio controls src="${safeMediaUrl(el.src)}" style="width:100%;height:24px"></audio></div>`;
    if (el.type === 'video') return `<div class="page-element photo-element${selected}" ${data} style="${style}"><video controls src="${safeMediaUrl(el.src)}" style="width:100%;height:100%;object-fit:cover"></video><div class="photo-caption">${escapeHtml(el.fileName || 'Video memory')}</div></div>`;
    if (el.type === 'attachment') return `<div class="page-element attachment-element${selected}" ${data} style="${style}"><a href="${safeMediaUrl(el.src)}" target="_blank" rel="noopener" download="${escapeHtml(el.fileName || 'attachment')}">↗ ${escapeHtml(el.fileName || 'Attachment')}</a></div>`;
    return '';
  }
  function attachPageEvents(container, side) {
    $$('.page-element', container).forEach(el => {
      const id = el.dataset.elementId;
      el.addEventListener('pointerdown', e => {
        if (activeTool === 'draw' || e.target.closest('input,audio,video,a,[contenteditable=true]') && (e.target.isContentEditable || e.target.tagName === 'INPUT')) return;
        if (e.target.closest('[contenteditable=true]')) {
          selectElement(id, side);
          const nodeRect = el.getBoundingClientRect();
          const nearMoveEdge = e.clientY - nodeRect.top < 12 || e.clientX - nodeRect.left < 12;
          if (!e.altKey && !nearMoveEdge) return;
        }
        selectElement(id, side);
        const page = pageBySide(side); const target = page?.elements.find(x => x.id === id); if (!target) return;
        const rect = $(`#${side}-page`).getBoundingClientRect();
        selectedElementDrag = { id, side, startX: e.clientX, startY: e.clientY, originX: target.x, originY: target.y, rect, moved: false };
        el.setPointerCapture?.(e.pointerId);
      });
      el.addEventListener('click', () => selectElement(id, side));
      el.addEventListener('input', () => {
        const page = pageBySide(side), model = page?.elements.find(x => x.id === id);
        if (!model) return;
        if (model.type === 'photo') model.caption = $('.photo-caption', el)?.textContent || '';
        else model.content = el.innerHTML;
        saveState();
      });
      $$('input[type=checkbox]', el).forEach(box => box.addEventListener('change', () => {
        const page = pageBySide(side), model = page?.elements.find(x => x.id === id); if (!model) return;
        model.checked ||= []; model.checked[Number(box.dataset.checkIndex)] = box.checked; saveState();
      }));
    });
  }
  window.addEventListener('pointermove', e => {
    if (!selectedElementDrag) return;
    const d = selectedElementDrag; const dx = (e.clientX - d.startX) / d.rect.width * 100; const dy = (e.clientY - d.startY) / d.rect.height * 100;
    if (Math.abs(dx) + Math.abs(dy) > .6) d.moved = true;
    const model = currentJournal().pages[spreadStart + (d.side === 'left' ? 0 : 1)]?.elements.find(x => x.id === d.id);
    if (!model) return;
    model.x = Math.max(0, Math.min(93, d.originX + dx)); model.y = Math.max(0, Math.min(93, d.originY + dy));
    const node = $(`.page-element[data-element-id="${d.id}"][data-side="${d.side}"]`);
    if (node) { node.style.left = `${model.x}%`; node.style.top = `${model.y}%`; }
  });
  window.addEventListener('pointerup', () => { if (selectedElementDrag) { if (selectedElementDrag.moved) saveState(); selectedElementDrag = null; } });
  function renderInspectorSelection() {
    const model = pageBySide(selectedPageSide)?.elements.find(x => x.id === selectedElementId);
    const box = $('#selected-element-section');
    if (!model) { box.innerHTML = '<label>Selected element</label><p class="muted-small">Select something on the page to edit its details.</p>'; return; }
    const textStyle = model.type === 'text' || model.type === 'quote' || model.type === 'table';
    box.innerHTML = `<label>Selected element · ${escapeHtml(model.type)}</label><div class="element-style-controls"><label class="element-control-label">Width<input id="element-width" type="range" min="8" max="95" value="${model.w || 40}"></label><label class="element-control-label">Height<input id="element-height" type="range" min="5" max="80" value="${model.h || 15}"></label>${textStyle ? `<label class="element-control-label">Text colour<input id="element-color" type="color" value="${model.color || '#454a3f'}"></label><label class="element-control-label">Text size<input id="element-size" type="range" min="8" max="34" value="${model.fontSize || (model.type === 'quote' ? 17 : 13)}"></label><label class="element-control-label">Typeface<select id="element-font"><option value="serif" ${model.fontFamily === 'serif' || !model.fontFamily ? 'selected' : ''}>Journal serif</option><option value="sans" ${model.fontFamily === 'sans' ? 'selected' : ''}>Clean sans</option><option value="mono" ${model.fontFamily === 'mono' ? 'selected' : ''}>Typewriter</option></select></label><div class="format-buttons"><button id="format-bold"><b>B</b></button><button id="format-italic"><i>I</i></button><button id="format-underline"><u>U</u></button><button id="format-hilite" title="Highlight selection">▰</button></div>` : ''}${model.type === 'sticker' ? `<label class="element-control-label">Sticker<input id="sticker-content" value="${escapeHtml(model.content)}" maxlength="8"></label>` : ''}${model.type === 'photo' ? `<label class="element-control-label">Caption<input id="photo-caption-input" value="${escapeHtml(model.caption || '')}"></label><label class="element-control-label">Rotation<input id="element-rotation" type="range" min="-12" max="12" value="${model.rotation || -2}"></label>` : ''}<button id="bring-front">Bring to front</button><button id="remove-element">Remove element</button></div>`;
    $('#element-width')?.addEventListener('input', e => { model.w = Number(e.target.value); const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.style.width = `${model.w}%`; saveState(); });
    $('#element-height')?.addEventListener('input', e => { model.h = Number(e.target.value); const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.style.height = `${model.h}%`; saveState(); });
    $('#element-font')?.addEventListener('change', e => { model.fontFamily = e.target.value; const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.style.fontFamily = ({ serif: 'Georgia, serif', sans: 'Arial, sans-serif', mono: 'monospace' })[model.fontFamily]; saveState(); });
    $('#element-rotation')?.addEventListener('input', e => { model.rotation = Number(e.target.value); const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.style.transform = `rotate(${model.rotation}deg)`; saveState(); });
    $('#element-color')?.addEventListener('input', e => { model.color = e.target.value; const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.style.color = model.color; saveState(); });
    $('#element-size')?.addEventListener('input', e => { model.fontSize = Number(e.target.value); const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.style.fontSize = `${model.fontSize}px`; saveState(); });
    $('#format-bold')?.addEventListener('click', () => formatSelection('bold'));
    $('#format-italic')?.addEventListener('click', () => formatSelection('italic'));
    $('#format-underline')?.addEventListener('click', () => formatSelection('underline'));
    $('#format-hilite')?.addEventListener('click', () => formatSelection('hiliteColor', '#fff0a8'));
    $('#sticker-content')?.addEventListener('input', e => { model.content = e.target.value; const node = $(`.page-element[data-element-id="${model.id}"]`); if (node) node.textContent = model.content; saveState(); });
    $('#photo-caption-input')?.addEventListener('input', e => { model.caption = e.target.value; const node = $(`.page-element[data-element-id="${model.id}"] .photo-caption`); if (node) node.textContent = model.caption; saveState(); });
    $('#bring-front')?.addEventListener('click', () => { const page = pageBySide(selectedPageSide); const i = page.elements.findIndex(x => x.id === model.id); page.elements.push(page.elements.splice(i, 1)[0]); saveState(); renderEditor(); });
    $('#remove-element')?.addEventListener('click', () => { const page = pageBySide(selectedPageSide); page.elements = page.elements.filter(x => x.id !== model.id); selectedElementId = null; saveState(); renderEditor(); toast('Element removed'); });
  }
  function formatSelection(command, value = null) { document.execCommand(command, false, value); const page = pageBySide(selectedPageSide); const model = page?.elements.find(x => x.id === selectedElementId); const node = $(`.page-element[data-element-id="${selectedElementId}"]`); if (model && node) { model.content = node.innerHTML; saveState(); } }
  function updatePaperSwatches(value) { $$('.paper-swatch').forEach(b => b.classList.toggle('active', b.dataset.paper === value)); }
  function setupCanvas(canvas, page, side) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (page.drawing) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height); img.src = page.drawing; }
    canvas.classList.toggle('drawing', activeTool === 'draw'); canvas.style.pointerEvents = activeTool === 'draw' ? 'auto' : 'none';
    canvas.onpointerdown = activeTool === 'draw' ? e => {
      e.preventDefault(); canvas.setPointerCapture(e.pointerId);
      const bounds = canvas.getBoundingClientRect(); const x = e.clientX - bounds.left, y = e.clientY - bounds.top;
      drawContext = { ctx, canvas, page, side, bounds, last: { x, y }, points: [] };
      ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = state.profile.inkColor || '#535d45'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = e.pointerType === 'pen' ? Math.max(1.2, (e.pressure || .5) * 4) : 2.2; ctx.globalAlpha = .9;
    } : null;
    canvas.onpointermove = activeTool === 'draw' ? e => {
      if (!drawContext || drawContext.canvas !== canvas) return;
      const x = e.clientX - drawContext.bounds.left, y = e.clientY - drawContext.bounds.top;
      const pressure = e.pointerType === 'pen' && e.pressure ? e.pressure : .6;
      ctx.lineWidth = e.pointerType === 'pen' ? Math.max(.8, pressure * 4.5) : 2.2;
      ctx.lineTo(x, y); ctx.stroke(); drawContext.last = { x, y };
    } : null;
    canvas.onpointerup = canvas.onpointercancel = () => {
      if (!drawContext || drawContext.canvas !== canvas) return;
      page.drawing = canvas.toDataURL('image/png'); drawContext = null; saveState(); toast('Drawing saved');
    };
  }
  function setTool(tool) {
    activeTool = tool; $$('.tool-button[data-tool]').forEach(b => b.classList.toggle('selected', b.dataset.tool === tool));
    if (activeView !== 'editor') return;
    renderEditor();
    if (tool === 'text') { const el = createElement('text'); addElementToPage(el); setTimeout(() => $(`.page-element[data-element-id="${el.id}"]`)?.focus(), 20); }
    if (tool === 'quote') { const el = createElement('quote'); addElementToPage(el); setTimeout(() => $(`.page-element[data-element-id="${el.id}"]`)?.focus(), 20); }
    if (tool === 'sticker') openStickerPicker();
    if (tool === 'checklist') addElementToPage(createElement('checklist'));
    if (tool === 'table') addElementToPage(createElement('table'));
    if (tool === 'photo') $('#file-picker').click();
    if (tool === 'draw') toast('Draw on either page with your finger, mouse or stylus.');
  }
  function openModal({ title, eyebrow = 'A LITTLE SOMETHING', body = '', actions = [] }) {
    $('#modal-title').textContent = title; $('#modal-eyebrow').textContent = eyebrow; $('#modal-body').innerHTML = body;
    $('#modal-actions').innerHTML = actions.map((a, i) => `<button class="button ${a.primary ? 'button-dark' : 'button-outline'}" data-modal-action="${i}">${escapeHtml(a.label)}</button>`).join('');
    modalBackdrop.hidden = false;
    $$('#modal-actions button').forEach((b, i) => b.addEventListener('click', actions[i].onClick));
    setTimeout(() => $('input,select,textarea,button', $('#modal-body'))?.focus(), 25);
  }
  function closeModal() { modalBackdrop.hidden = true; }
  function field(label, name, placeholder, value = '', type = 'text') { return `<div class="modal-field"><label for="modal-${name}">${label}</label><input id="modal-${name}" name="${name}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}"></div>`; }
  function createJournalModal() {
    openModal({ title: 'A new little chapter.', eyebrow: 'MAKE A JOURNAL', body: `${field('Journal name', 'journal-name', 'e.g. The everyday')}${field('A short description', 'journal-description', 'What will you keep here?')}<div class="modal-field"><label>Choose a cover</label><div class="cover-options">${colors.map(c => `<button class="cover-choice cover-${c} ${c === 'sage' ? 'active' : ''}" data-cover="${c}" aria-label="${c}"></button>`).join('')}</div></div>`, actions: [
      { label: 'Cancel', onClick: closeModal }, { label: 'Create journal', primary: true, onClick: () => {
        const title = $('#modal-journal-name').value.trim(); if (!title) return toast('Give your journal a name first.');
        const cover = $('.cover-choice.active')?.dataset.cover || 'sage';
        const j = { id: uid('journal'), title, description: $('#modal-journal-description').value.trim(), cover, archived: false, createdAt: todayISO(), updatedAt: todayISO(), pages: [blankPage('Opening page'), { id: uid('page'), date: todayISO(), title: 'A page to begin', paper: 'cream', size: 'a5', elements: [createElement('text', { x: 10, y: 12, w: 78, h: 15, content: `<h2>${escapeHtml(title)}.</h2>` }), createElement('text', { x: 10, y: 35, w: 76, h: 18, content: '<p>This is the beginning of something. Make it yours, one page at a time.</p>' })] }] };
        state.journals.unshift(j); currentJournalId = j.id; saveState(); closeModal(); renderLibrary(); openJournal(j.id, 1); toast('Your new journal is ready.');
      }}
    ] });
    $$('.cover-choice').forEach(b => b.addEventListener('click', () => { $$('.cover-choice').forEach(x => x.classList.remove('active')); b.classList.add('active'); }));
  }
  function openStickerPicker() {
    const stickers = ['✳','✿','❀','♡','♥','☼','☾','✦','✧','❋','🌿','🍂','🌸','☁','⭐','📍','✈️','☕','📖','🎧','🌷','🪴','🎞️','🧷'];
    openModal({ title: 'A little detail.', eyebrow: 'STICKER DRAWER', body: `<div class="sticker-grid">${stickers.map(s => `<button class="sticker-choice" data-sticker="${s}">${s}</button>`).join('')}</div>`, actions: [{ label: 'Close', onClick: closeModal }] });
    $$('.sticker-choice').forEach(b => b.addEventListener('click', () => { const el = createElement('sticker', { content: b.dataset.sticker }); closeModal(); addElementToPage(el); }));
    $('#modal-body').insertAdjacentHTML('beforeend', '<style>.sticker-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.sticker-choice{height:44px;border:1px solid #e0ddd2;background:#fffdf8;font-size:24px}.sticker-choice:hover{background:#e8eadd;border-color:#a6ad91}</style>');
  }
  function templateModal() {
    const builtins = Object.entries(templates).map(([key, v]) => `<button class="template-choice" data-template="${key}"><strong>${escapeHtml(v.title)}</strong><span>${({ daily: 'A thoughtful daily entry', weekly: 'Reflect on the week', gratitude: 'Notice the good things', travel: 'Keep a place close', ideas: 'Collect a new thought', dream: 'Capture a dream' })[key]}</span></button>`).join('');
    const saved = (state.customTemplates || []).map(t => `<button class="template-choice" data-custom-template="${escapeHtml(t.id)}"><strong>${escapeHtml(t.name)}</strong><span>Your saved page layout</span></button>`).join('');
    openModal({ title: 'Start with a shape.', eyebrow: 'PAGE TEMPLATES', body: `<div class="template-grid">${builtins}${saved}</div><button class="template-save-link" id="save-current-template">＋ Save this page as a template</button>`, actions: [{ label: 'Close', onClick: closeModal }] });
    $$('[data-template]').forEach(b => b.addEventListener('click', () => { applyTemplate(b.dataset.template); closeModal(); }));
    $$('[data-custom-template]').forEach(b => b.addEventListener('click', () => { applyTemplate(b.dataset.customTemplate); closeModal(); }));
    $('#save-current-template').addEventListener('click', saveCurrentPageAsTemplate);
  }
  function saveCurrentPageAsTemplate() {
    const page = pageBySide('right'); if (!page) return toast('Open a page first.');
    openModal({ title: 'Keep this layout for later.', eyebrow: 'YOUR TEMPLATE', body: field('Template name', 'template-name', 'e.g. Sunday reset'), actions: [{ label: 'Cancel', onClick: closeModal }, { label: 'Save template', primary: true, onClick: () => {
      const name = $('#modal-template-name').value.trim(); if (!name) return toast('Give your template a name.');
      state.customTemplates ||= [];
      state.customTemplates.push({ id: uid('template'), name, title: page.title, paper: page.paper, size: page.size, elements: structuredClone(page.elements), drawing: page.drawing || '' });
      saveState(); closeModal(); toast('Template saved to your library.');
    }}] });
  }
  function applyTemplate(key) {
    const page = pageBySide('right'); if (!page) return;
    const template = templates[key] || (state.customTemplates || []).find(t => t.id === key); if (!template) return;
    page.title = template.title || template.name; page.paper = template.paper || page.paper; page.size = template.size || page.size;
    page.elements = (template.elements || []).map(item => createElement(item.type, structuredClone(item))); page.drawing = template.drawing || '';
    $('#page-title-input').value = page.title; saveState(); renderEditor(); toast('Template added to your page.');
  }
  function handleFileSelection(files) {
    if (!files?.length) return;
    const page = pageBySide('right'); if (!page) return;
    [...files].forEach(file => {
      const max = file.type.startsWith('image/') ? 8 : 18;
      if (file.size > max * 1024 * 1024) { toast(`${file.name} is too large. Maximum ${max} MB.`); return; }
      const reader = new FileReader(); reader.onload = () => {
        let element;
        if (file.type.startsWith('image/')) element = createElement('photo', { src: reader.result, caption: file.name.replace(/\.[^.]+$/, ''), x: 56, y: 75, w: 34, h: 18, rotation: -2 });
        else if (file.type.startsWith('audio/')) element = createElement('audio', { src: reader.result, fileName: file.name, x: 10, y: 80, w: 78, h: 10 });
        else if (file.type.startsWith('video/')) element = createElement('video', { src: reader.result, fileName: file.name, x: 54, y: 47, w: 38, h: 24 });
        else element = createElement('attachment', { src: reader.result, fileName: file.name, x: 10, y: 83, w: 72, h: 10 });
        addElementToPage(element); toast(`${file.name} added to your page.`);
      }; reader.onerror = () => toast(`Couldn't read ${file.name}.`); reader.readAsDataURL(file);
    });
    $('#file-picker').value = '';
  }
  function renderToday() {
    const now = new Date();
    $('#today-date').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    $('#daily-large-day').textContent = String(now.getDate()).padStart(2, '0');
    $('#daily-month').textContent = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
    $('#daily-card-date').textContent = `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${String(now.getFullYear()).slice(-2)}`;
    $('#prompt-question').textContent = promptPool[(now.getDate() + now.getMonth()) % promptPool.length];
    renderShelf($('#today-shelf'), 3);
    const recent = state.journals.flatMap(j => j.pages.map(p => ({ j, p }))).sort((a, b) => b.p.date.localeCompare(a.p.date)).slice(0, 3);
    $('#recent-list').innerHTML = recent.length ? recent.map(({ j, p }) => `<button class="recent-item" data-open-page="${j.id}" data-page-id="${p.id}"><span class="recent-thumb">${p.elements.some(e => e.type === 'photo') ? '▧' : '✎'}</span><span class="recent-item-copy"><strong>${escapeHtml(p.title || 'Untitled page')}</strong><span>${escapeHtml(j.title)} · ${fmtDate(p.date, { day: 'numeric', month: 'short' })}</span></span><span class="recent-date">${p.date === todayISO() ? 'TODAY' : p.date}</span></button>`).join('') : '<p class="muted-small">Your recent pages will appear here.</p>';
    $$('.recent-item').forEach(b => b.addEventListener('click', () => { const j = state.journals.find(x => x.id === b.dataset.openPage); const i = j.pages.findIndex(p => p.id === b.dataset.pageId); openJournal(j.id, i); }));
    const mood = state.checkins.find(c => c.date === todayISO());
    $$('#mood-options button').forEach(b => b.classList.toggle('selected', b.dataset.mood === mood?.mood));
    $('#checkin-note').textContent = mood ? `You checked in as feeling ${mood.mood} today.` : 'A moment for yourself, whenever you\'re ready.';
    $('#journal-count').textContent = state.journals.filter(j => !j.archived).length;
  }
  function renderLibrary() {
    const el = $('#library-list');
    el.innerHTML = state.journals.filter(j => !j.archived).slice(0, 4).map(j => `<button class="library-item" data-jump-journal="${j.id}"><span class="library-cover cover-${j.cover}"></span><span>${escapeHtml(j.title)}</span></button>`).join('');
    $$('[data-jump-journal]').forEach(b => b.addEventListener('click', () => openJournal(b.dataset.jumpJournal)));
  }
  function renderShelf(container, max = Infinity) {
    const journals = state.journals.filter(j => !j.archived).slice(0, max);
    container.innerHTML = journals.map(j => `<button class="shelf-card" data-open-journal="${j.id}"><span class="cover-art cover-${j.cover}"><span class="cover-title">${escapeHtml(j.title)}</span><span class="cover-mark">✳</span></span><span class="shelf-copy"><strong>${escapeHtml(j.title)}</strong><span>${escapeHtml(j.description || 'A collection of little moments.')}</span><small>${j.pages.length} ${j.pages.length === 1 ? 'PAGE' : 'PAGES'} · UPDATED ${j.updatedAt || j.createdAt}</small></span></button>`).join('');
    $$('[data-open-journal]', container).forEach(b => b.addEventListener('click', () => openJournal(b.dataset.openJournal)));
  }
  function renderJournals() {
    const list = state.journals.filter(j => journalFilter === 'all' || (journalFilter === 'archived' ? j.archived : !j.archived));
    $('#journal-total').textContent = `${list.length} ${list.length === 1 ? 'journal' : 'journals'}`;
    $('#journals-grid').innerHTML = list.map(j => `<article class="journal-card"><div class="journal-cover-large cover-${j.cover}" data-open-journal="${j.id}"><span class="journal-cover-title">${escapeHtml(j.title)}</span><span class="journal-cover-sub">A MORROW JOURNAL</span></div><div class="journal-info"><div><h3>${escapeHtml(j.title)}</h3><p>${escapeHtml(j.description || 'A collection of little moments.')}</p></div><button class="journal-more" data-journal-menu="${j.id}" aria-label="Journal options">···</button></div><div class="journal-progress"><span style="width:${Math.min(100, 8 + j.pages.length * 9)}%"></span></div><div class="journal-foot"><span>${j.pages.length} PAGES</span><span>UPDATED ${j.updatedAt || j.createdAt}</span></div></article>`).join('') + `<button class="add-journal-card" id="grid-add-journal"><span class="add-circle">＋</span><strong>Make a new journal</strong><span>Every chapter begins somewhere.</span></button>`;
    $$('[data-open-journal]').forEach(b => b.addEventListener('click', () => openJournal(b.dataset.openJournal)));
    $$('[data-journal-menu]').forEach(b => b.addEventListener('click', () => journalMenu(b.dataset.journalMenu)));
    $('#grid-add-journal')?.addEventListener('click', createJournalModal);
  }
  function journalMenu(id) {
    const j = state.journals.find(x => x.id === id); if (!j) return;
    openModal({ title: j.title, eyebrow: 'JOURNAL OPTIONS', body: `<div class="settings-actions" style="margin:0;display:grid"><button id="rename-journal">Rename journal</button><button id="archive-journal">${j.archived ? 'Restore journal' : 'Archive journal'}</button><button id="delete-journal">Delete journal</button></div>`, actions: [{ label: 'Close', onClick: closeModal }] });
    $('#rename-journal').addEventListener('click', () => { closeModal(); openModal({ title: 'Give it a new name.', body: field('Journal name', 'rename', 'Journal name', j.title), actions: [{ label: 'Cancel', onClick: closeModal }, { label: 'Save name', primary: true, onClick: () => { const v = $('#modal-rename').value.trim(); if (v) j.title = v; saveState(); closeModal(); renderJournals(); renderLibrary(); toast('Journal renamed.'); } }] }); });
    $('#archive-journal').addEventListener('click', () => { j.archived = !j.archived; saveState(); closeModal(); renderJournals(); renderLibrary(); toast(j.archived ? 'Journal archived.' : 'Journal restored.'); });
    $('#delete-journal').addEventListener('click', () => { closeModal(); openModal({ title: 'Delete this journal?', body: '<p class="muted-small">This permanently removes the journal and every page inside it from this browser. Export a backup first if you may want it later.</p>', actions: [{ label: 'Keep journal', onClick: closeModal }, { label: 'Delete permanently', primary: true, onClick: () => { state.journals = state.journals.filter(x => x.id !== id); if (!state.journals.length) state.journals.push({ id: uid('journal'), title: 'My journal', description: '', cover: 'sage', pages: [blankPage('A page to begin'), blankPage('A little more room')], createdAt: todayISO(), updatedAt: todayISO() }); currentJournalId = state.journals[0].id; saveState(); closeModal(); renderJournals(); renderLibrary(); toast('Journal deleted.'); } }] }); });
  }
  function renderCalendar() {
    $('#calendar-month-label').textContent = calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1); const startDay = (first.getDay() + 6) % 7; const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    let html = weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('');
    const total = Math.ceil((startDay + daysInMonth) / 7) * 7; const prevDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
    const pagesByDate = new Map(); state.journals.forEach(j => j.pages.forEach(p => { if (!pagesByDate.has(p.date)) pagesByDate.set(p.date, []); pagesByDate.get(p.date).push({ journal: j, page: p }); }));
    for (let i = 0; i < total; i++) {
      let n, date, muted = false;
      if (i < startDay) { n = prevDays - startDay + i + 1; date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, n); muted = true; }
      else if (i >= startDay + daysInMonth) { n = i - startDay - daysInMonth + 1; date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, n); muted = true; }
      else { n = i - startDay + 1; date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), n); }
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const has = pagesByDate.has(iso); html += `<button class="calendar-day ${muted ? 'muted' : ''} ${iso === todayISO() ? 'today' : ''} ${iso === selectedCalendarDate ? 'selected' : ''}" data-calendar-date="${iso}">${n}<span class="day-dots">${has ? '<i></i>' : ''}</span></button>`;
    }
    $('#calendar-grid').innerHTML = html;
    $$('[data-calendar-date]').forEach(b => b.addEventListener('click', () => { selectedCalendarDate = b.dataset.calendarDate; const d = new Date(`${selectedCalendarDate}T12:00:00`); calendarMonth = new Date(d.getFullYear(), d.getMonth(), 1); renderCalendar(); }));
    $('#selected-day-label').textContent = fmtDate(selectedCalendarDate, { day: 'numeric', month: 'long', year: 'numeric' });
    const entries = pagesByDate.get(selectedCalendarDate) || [];
    $('#selected-day-items').innerHTML = entries.length ? entries.map(({ journal, page }) => `<button class="selected-day-entry" data-cal-open="${journal.id}" data-cal-page="${page.id}">${escapeHtml(page.title || 'Untitled page')}<small>${escapeHtml(journal.title)}</small></button>`).join('') : '<p class="muted-small">No pages saved for this day yet.</p>';
    $$('[data-cal-open]').forEach(b => b.addEventListener('click', () => { const j = state.journals.find(x => x.id === b.dataset.calOpen); openJournal(j.id, j.pages.findIndex(p => p.id === b.dataset.calPage)); }));
  }
  function renderGoals() {
    const done = state.habits.filter(h => h.doneDates.includes(todayISO())).length;
    $('#goal-summary').innerHTML = `<div class="summary-stat"><strong>${done}/${state.habits.length}</strong><span>Habits completed today</span></div><div class="summary-stat"><strong>${state.goals.filter(g => g.done).length}</strong><span>Goals reached</span></div><div class="summary-stat"><strong>${state.goals.length}</strong><span>Things you're working towards</span></div>`;
    $('#habit-list').innerHTML = state.habits.map(h => { const isDone = h.doneDates.includes(todayISO()); return `<div class="habit-row"><button class="habit-check ${isDone ? 'done' : ''}" data-habit-toggle="${h.id}">${isDone ? '✓' : ''}</button><div class="habit-copy"><strong>${escapeHtml(h.title)}</strong><span>${escapeHtml(h.frequency)}</span></div><span class="habit-streak">${h.doneDates.length} days</span></div>`; }).join('') || '<p class="muted-small">Add a small habit to begin.</p>';
    $('#goals-list').innerHTML = state.goals.map(g => `<div class="goal-row"><div class="goal-copy"><strong>${escapeHtml(g.title)}</strong><span>${escapeHtml(g.detail || (g.due ? `Target · ${g.due}` : 'A goal in progress'))}</span><div class="goal-progress"><span style="width:${g.done ? 100 : g.progress}%"></span></div><input class="goal-range" type="range" min="0" max="100" step="5" value="${g.done ? 100 : g.progress}" data-goal-progress="${g.id}" aria-label="Goal progress for ${escapeHtml(g.title)}"></div><span class="goal-percent">${g.done ? 'DONE' : `${g.progress}%`}</span></div>`).join('') || '<p class="muted-small">No goals yet. Start with something that matters to you.</p>';
    $$('[data-habit-toggle]').forEach(b => b.addEventListener('click', () => { const habit = state.habits.find(h => h.id === b.dataset.habitToggle); if (!habit) return; if (habit.doneDates.includes(todayISO())) habit.doneDates = habit.doneDates.filter(d => d !== todayISO()); else habit.doneDates.push(todayISO()); saveState(); renderGoals(); }));
    $$('[data-goal-progress]').forEach(input => input.addEventListener('input', () => { const goal = state.goals.find(g => g.id === input.dataset.goalProgress); if (!goal) return; goal.progress = Number(input.value); goal.done = goal.progress >= 100; input.parentElement.querySelector('.goal-progress span').style.width = `${goal.progress}%`; input.parentElement.nextElementSibling.textContent = goal.done ? 'DONE' : `${goal.progress}%`; saveState(); }));
  }
  function renderMemories() {
    const query = ($('#memory-search').value || '').toLowerCase(); const filter = $('#memory-filter').value;
    const memories = state.journals.flatMap(j => j.pages.map(p => ({ journal: j, page: p }))).filter(({ page, journal }) => {
      const hasPhoto = page.elements.some(e => e.type === 'photo');
      const matches = `${page.title} ${journal.title} ${page.elements.map(e => e.content || e.caption || '').join(' ')}`.toLowerCase().includes(query);
      return matches && (filter === 'all' || (filter === 'photo' ? hasPhoto : !hasPhoto));
    }).sort((a, b) => b.page.date.localeCompare(a.page.date));
    $('#memories-grid').innerHTML = memories.map(({ journal, page }) => { const photo = page.elements.find(e => e.type === 'photo'); return `<article class="memory-card"><button class="memory-preview" data-memory-open="${journal.id}" data-memory-page="${page.id}">${photo ? `<img src="${photo.src}" alt="${escapeHtml(photo.caption || 'Memory')}">` : (page.elements.some(e => e.type === 'sticker') ? '✳' : '“')}</button><h3>${escapeHtml(page.title || 'A page to remember')}</h3><p>${escapeHtml(journal.title)} · ${fmtDate(page.date, { day: 'numeric', month: 'long', year: 'numeric' })}</p><small>${page.elements.length} LITTLE DETAILS</small></article>`; }).join('') || '<p class="muted-small">No matching memories yet. Your journal pages will collect here as you make them.</p>';
    $$('[data-memory-open]').forEach(b => b.addEventListener('click', () => { const j = state.journals.find(x => x.id === b.dataset.memoryOpen); openJournal(j.id, j.pages.findIndex(p => p.id === b.dataset.memoryPage)); }));
  }
  function renderWrapped() {
    const year = String(new Date().getFullYear());
    $('#wrapped-year').textContent = year;
    const pages = state.journals.flatMap(j => j.pages).filter(p => String(p.date || '').startsWith(year)); const words = pages.reduce((n, p) => n + p.elements.filter(e => e.type === 'text' || e.type === 'quote').reduce((m, e) => m + (e.content || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length, 0), 0);
    const photos = pages.reduce((n, p) => n + p.elements.filter(e => e.type === 'photo').length, 0);
    const moods = state.checkins.length;
    $('#wrapped-stats').innerHTML = `<div class="wrapped-stat"><strong>${pages.length}</strong><span>PAGES KEPT</span></div><div class="wrapped-stat"><strong>${words}</strong><span>WORDS WRITTEN</span></div><div class="wrapped-stat"><strong>${photos}</strong><span>PHOTOS SAVED</span></div><div class="wrapped-stat"><strong>${moods}</strong><span>CHECK-INS</span></div>`;
  }
  function generateWrapped() {
    const year = String(new Date().getFullYear());
    const pages = state.journals.flatMap(j => j.pages).filter(p => String(p.date || '').startsWith(year)); const words = pages.reduce((n, p) => n + p.elements.filter(e => e.type === 'text' || e.type === 'quote').reduce((m, e) => m + (e.content || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length, 0), 0);
    const months = new Set(pages.map(p => p.date.slice(0, 7))).size;
    openModal({ title: 'Your year, in little pieces.', eyebrow: 'YOUR MORROW WRAPPED', body: `<p class="muted-small">This preview is calculated from the pages saved in this browser. It does not include activity from other devices.</p><div class="wrapped-stats" style="margin:15px 0;color:#5b654a"><div class="wrapped-stat"><strong>${pages.length}</strong><span>PAGES KEPT</span></div><div class="wrapped-stat"><strong>${words}</strong><span>WORDS WRITTEN</span></div><div class="wrapped-stat"><strong>${months}</strong><span>MONTHS WITH PAGES</span></div></div><p class="muted-small">Your real annual story becomes richer as you add more pages, photographs, check-ins and milestones throughout the year.</p>`, actions: [{ label: 'Close', onClick: closeModal }, { label: 'Print this preview', primary: true, onClick: () => { closeModal(); window.print(); } }] });
  }
  function renderSettings() {
    const sections = {
      appearance: `<h2>Make it feel like yours.</h2><p>Small choices that make your writing space feel familiar.</p><div class="setting-row"><div><strong>Default page paper</strong><small>Used when you add a new page.</small></div><select id="setting-paper"><option value="cream">Warm cream</option><option value="white">Clean white</option><option value="grid">Grid</option><option value="lines">Lined</option><option value="dot">Dotted</option></select></div><div class="setting-row"><div><strong>Accent ink</strong><small>Your default colour for drawings.</small></div><input type="color" id="setting-ink" value="${state.profile.inkColor || '#535d45'}"></div><div class="setting-row"><div><strong>Reduced motion</strong><small>Use calmer transitions across the interface.</small></div><button class="toggle" id="setting-motion" aria-label="Reduced motion"></button></div>`,
      privacy: `<h2>Your pages belong to you.</h2><p>Privacy comes first. This build stores your journal in this browser on this device.</p><div class="setting-row"><div><strong>Private by default</strong><small>Sharing will be opt-in when community accounts are connected.</small></div><button class="toggle ${state.profile.privateByDefault ? 'on' : ''}" id="setting-private"></button></div><div class="setting-row"><div><strong>Local storage</strong><small>Page content and uploaded media are stored in this browser's IndexedDB where available.</small></div><span class="muted-small">On this device</span></div><div class="settings-actions"><button id="export-backup">Export a backup (.json)</button><button id="import-backup">Import a backup</button><button id="clear-data">Delete all local data</button></div>`,
      reminders: `<h2>A gentle nudge, when you need one.</h2><p>Daily reminders can be added after install and notification permissions are configured.</p><div class="setting-row"><div><strong>Daily journal reminder</strong><small>This first release does not yet have a background notification service.</small></div><button class="toggle ${state.profile.reminders ? 'on' : ''}" id="setting-reminders"></button></div><div class="setting-row"><div><strong>Suggested time</strong><small>Choose a time for your future reminder.</small></div><input type="time" id="reminder-time" value="20:30"></div>`,
      about: `<h2>Morrow, your life in pages.</h2><p>A paper-inspired digital journal for thoughts, plans, photographs and the details you want to keep.</p><div class="setting-row"><div><strong>Build</strong><small>Local-first preview · Version 0.1.0</small></div><span class="muted-small">Early foundation</span></div><div class="setting-row"><div><strong>What's not connected yet</strong><small>Accounts, cross-device sync, online sharing, community feeds, cloud backup and print fulfilment require a secure backend.</small></div></div><div class="settings-actions"><button id="about-export">Export your journal data</button></div>`
    };
    $('#settings-content').innerHTML = sections[settingsTab];
    if (settingsTab === 'appearance') {
      $('#setting-paper').value = state.profile.paper || 'cream'; $('#setting-paper').addEventListener('change', e => { state.profile.paper = e.target.value; saveState(); });
      $('#setting-ink').addEventListener('input', e => { state.profile.inkColor = e.target.value; saveState(); });
      $('#setting-motion').classList.toggle('on', !!state.profile.reducedMotion); $('#setting-motion').addEventListener('click', () => { state.profile.reducedMotion = !state.profile.reducedMotion; document.documentElement.style.setProperty('--motion-scale', state.profile.reducedMotion ? '0' : '1'); saveState(); renderSettings(); });
    }
    if (settingsTab === 'privacy') {
      $('#setting-private').addEventListener('click', () => { state.profile.privateByDefault = !state.profile.privateByDefault; saveState(); renderSettings(); });
      $('#export-backup').addEventListener('click', exportBackup); $('#import-backup').addEventListener('click', () => $('#import-picker').click());
      $('#clear-data').addEventListener('click', clearLocalData);
    }
    if (settingsTab === 'reminders') $('#setting-reminders').addEventListener('click', () => { state.profile.reminders = !state.profile.reminders; saveState(); renderSettings(); toast(state.profile.reminders ? 'Reminder preference saved. Notifications are not active yet.' : 'Reminder preference turned off.'); });
    if (settingsTab === 'about') $('#about-export').addEventListener('click', exportBackup);
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `morrow-backup-${todayISO()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); toast('Your backup is ready.');
  }
  function importBackup(file) {
    const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(reader.result); if (!imported || imported.version !== 1 || !Array.isArray(imported.journals)) throw new Error('Invalid file'); state = imported; saveState(); renderLibrary(); showView('today'); toast('Backup imported.'); } catch { toast('That file is not a valid Morrow backup.'); } }; reader.readAsText(file);
  }
  function clearLocalData() {
    openModal({ title: 'Clear this device?', body: '<p class="muted-small">This will permanently remove all journals, pages, photos, goals and habits stored in this browser. Export a backup before continuing.</p>', actions: [{ label: 'Cancel', onClick: closeModal }, { label: 'Delete local data', primary: true, onClick: async () => { if (idb) { const tx = idb.transaction('app', 'readwrite'); tx.objectStore('app').clear(); } localStorage.removeItem('morrow-state'); state = structuredClone(seed); currentJournalId = state.journals[0].id; saveState(); closeModal(); renderLibrary(); showView('today'); toast('Local data cleared.'); } }] });
  }
  function printJournal() {
    const j = currentJournal(); if (!j) return;
    const pages = j.pages.map((p, i) => {
      const inner = p.elements.map(el => {
        if (el.type === 'text') return `<div style="position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;font: ${el.fontSize || 13}px/1.6 Georgia;color:${el.color || '#42463d'}">${sanitizeRichHtml(el.content)}</div>`;
        if (el.type === 'quote') return `<div style="position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;font:italic ${el.fontSize || 17}px/1.45 Georgia;color:${el.color || '#747e5d'};border-left:2px solid #a0a68c;padding-left:12px">${sanitizeRichHtml(el.content || '')}</div>`;
        if (el.type === 'table') return `<div style="position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;font:11px Arial;color:#45483e">${sanitizeRichHtml(el.content || '')}</div>`;
        if (el.type === 'sticker') return `<div style="position:absolute;left:${el.x}%;top:${el.y}%;font-size:36px">${sanitizeRichHtml(el.content || '')}</div>`;
        if (el.type === 'photo') return `<figure style="position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;margin:0;background:white;padding:6px 6px 22px;box-shadow:2px 4px 9px #0002;transform:rotate(${el.rotation || -2}deg)"><img src="${safeMediaUrl(el.src)}" style="width:100%;height:100%;object-fit:cover"><figcaption style="font:10px Georgia;text-align:center">${escapeHtml(el.caption || '')}</figcaption></figure>`;
        if (el.type === 'checklist') return `<div style="position:absolute;left:${el.x}%;top:${el.y}%;font:12px/2 Arial">${(el.items || []).map((x, n) => `<div>${el.checked?.[n] ? '☑' : '□'} ${escapeHtml(x)}</div>`).join('')}</div>`;
        if (el.type === 'audio' || el.type === 'video' || el.type === 'attachment') return `<div style="position:absolute;left:${el.x}%;top:${el.y}%;font:11px Arial;color:#666">${escapeHtml(el.fileName || 'Attached media')} — see digital journal backup</div>`;
        return '';
      }).join('');
      const draw = p.drawing ? `<img src="${p.drawing}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">` : '';
      const bg = ({ cream: '#fbf8f0', white: '#fff', grid: '#fbfaf5', lines: '#fbfaf5', dot: '#fbfaf5' })[p.paper] || '#fbf8f0';
      const printSize = p.size === 'a4' ? 'a4' : (p.size === 'square' ? 'square' : 'a5');
      return `<section class="page ${printSize}" style="background-color:${bg};background-image:${p.paper === 'grid' ? 'linear-gradient(#bfc8ca33 1px,transparent 1px),linear-gradient(90deg,#bfc8ca33 1px,transparent 1px)' : p.paper === 'lines' ? 'repeating-linear-gradient(transparent 0,transparent 26px,#bfc8ca44 27px)' : p.paper === 'dot' ? 'radial-gradient(#9fa99755 .8px,transparent .8px)' : 'radial-gradient(#7a6f580d .7px,transparent .7px)'};background-size:${p.paper === 'grid' ? '22px 22px' : p.paper === 'lines' ? 'auto' : p.paper === 'dot' ? '15px 15px' : '5px 5px'}"><div class="page-title">${escapeHtml(p.title || '')}</div>${inner}${draw}<span class="page-no">${String(i + 1).padStart(2, '0')}</span></section>`;
    }).join('');
    const win = window.open('', '_blank'); if (!win) return toast('Allow pop-ups to open the print layout.');
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(j.title)} — Morrow</title><meta charset="utf-8"><style>@page a5{size:A5 portrait;margin:0}@page a4{size:A4 portrait;margin:0}@page square{size:200mm 200mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#eee;font-family:Georgia,serif}.page{position:relative;overflow:hidden;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}.page.a5{page:a5;width:148mm;height:210mm;padding:20mm 18mm}.page.a4{page:a4;width:210mm;height:297mm;padding:22mm 20mm}.page.square{page:square;width:200mm;height:200mm;padding:20mm 18mm}.page-title{position:absolute;left:18mm;top:9mm;font:9px Arial;color:#aaa}.page-no{position:absolute;bottom:10mm;right:13mm;font:8px monospace;color:#aaa}.table-element,table{border-collapse:collapse}img{print-color-adjust:exact}@media screen{.page{margin:12mm auto;box-shadow:0 3px 20px #0002}}</style></head><body>${pages}<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);
    win.document.close();
  }
  function openSearch() {
    openModal({ title: 'Find a little something.', eyebrow: 'SEARCH YOUR JOURNAL', body: '<input class="search-modal-input" id="global-search-input" placeholder="Search titles, words and memories…"><div class="search-results" id="global-search-results"><span class="muted-small">Start typing to search your pages.</span></div>', actions: [{ label: 'Close', onClick: closeModal }] });
    $('#global-search-input').addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim(); const result = state.journals.flatMap(j => j.pages.map((p, i) => ({ j, p, i }))).filter(({ j, p }) => `${j.title} ${p.title} ${p.elements.map(el => `${el.content || ''} ${el.caption || ''}`).join(' ')}`.toLowerCase().includes(q)).slice(0, 10);
      $('#global-search-results').innerHTML = q ? (result.map(({ j, p, i }) => `<button class="search-result" data-search-journal="${j.id}" data-search-index="${i}">${escapeHtml(p.title || 'Untitled page')}<small>${escapeHtml(j.title)} · ${p.date}</small></button>`).join('') || '<span class="muted-small">No pages found.</span>') : '<span class="muted-small">Start typing to search your pages.</span>';
      $$('[data-search-journal]').forEach(b => b.addEventListener('click', () => { closeModal(); openJournal(b.dataset.searchJournal, Number(b.dataset.searchIndex)); }));
    });
  }

  // Core navigation and UI bindings
  $$('.nav-link[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => showView(b.dataset.go)));
  $('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#sidebar-new-journal').addEventListener('click', createJournalModal); $('#new-journal').addEventListener('click', createJournalModal);
  $('#write-today').addEventListener('click', () => { const j = state.journals[0]; const existing = j.pages.findIndex(p => p.date === todayISO()); if (existing >= 0) openJournal(j.id, existing); else { const p = { id: uid('page'), date: todayISO(), title: 'Today', paper: state.profile.paper || 'cream', size: 'a5', elements: templates.daily.elements.map(x => createElement(x.type, structuredClone(x))) }; const leftIndex = appendSpread(j, p); saveState(); openJournal(j.id, leftIndex + 1); } });
  $('#open-daily').addEventListener('click', () => $('#write-today').click());
  $('#prompt-write').addEventListener('click', () => { $('#write-today').click(); setTimeout(() => { const p = currentJournal().pages[spreadStart + 1]; if (p) p.elements.unshift(createElement('quote', { content: $('#prompt-question').textContent, x: 9, y: 8, w: 80, h: 13 })); saveState(); renderEditor(); }, 50); });
  $$('#mood-options button').forEach(b => b.addEventListener('click', () => { const old = state.checkins.find(x => x.date === todayISO()); if (old) old.mood = b.dataset.mood; else state.checkins.push({ date: todayISO(), mood: b.dataset.mood }); saveState(); renderToday(); toast('Check-in saved.'); }));
  $$('.filter-tab').forEach(b => b.addEventListener('click', () => { journalFilter = b.dataset.filter; $$('.filter-tab').forEach(x => x.classList.toggle('active', x === b)); renderJournals(); }));
  $('#back-to-journals').addEventListener('click', () => showView('journals'));
  $$('.tool-button[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('#template-open').addEventListener('click', templateModal);
  $('#editor-undo').addEventListener('click', () => restoreHistory(undoStack, redoStack, 'undo'));
  $('#editor-redo').addEventListener('click', () => restoreHistory(redoStack, undoStack, 'redo'));
  $('#file-picker').addEventListener('change', e => handleFileSelection(e.target.files));
  $('#prev-page').addEventListener('click', () => {
    const j = currentJournal(); selectedElementId = null;
    if (window.innerWidth <= 650) {
      let index = spreadStart + (mobileSide === 'left' ? 0 : 1);
      if (index <= 0) return;
      index -= 1; spreadStart = index - (index % 2); mobileSide = index % 2 === 0 ? 'left' : 'right';
    } else { if (spreadStart < 2) return; spreadStart -= 2; }
    renderEditor();
  });
  $('#next-page').addEventListener('click', () => {
    const j = currentJournal(); selectedElementId = null;
    if (window.innerWidth <= 650) {
      let index = spreadStart + (mobileSide === 'left' ? 0 : 1);
      if (index >= j.pages.length - 1) return;
      index += 1; spreadStart = index - (index % 2); mobileSide = index % 2 === 0 ? 'left' : 'right';
    } else { if (spreadStart + 2 >= j.pages.length) return; spreadStart += 2; }
    renderEditor();
  });
  $('#page-title-input').addEventListener('input', e => { const p = pageBySide('right'); if (p) { p.title = e.target.value; saveState(); } });
  $('#page-size').addEventListener('change', e => { const p = pageBySide('right'); if (p) { p.size = e.target.value; saveState(); renderEditor(); } });
  $$('#paper-swatches .paper-swatch').forEach(b => b.addEventListener('click', () => { const p = pageBySide('right'); if (p) { p.paper = b.dataset.paper; saveState(); renderEditor(); } }));
  $('#duplicate-page').addEventListener('click', () => { const p = pageBySide('right'); if (!p) return; const copy = structuredClone(p); copy.id = uid('page'); copy.title = `${p.title || 'Page'} · copy`; copy.elements.forEach(e => e.id = uid('el')); const leftIndex = appendSpread(currentJournal(), copy); spreadStart = leftIndex; mobileSide = 'right'; saveState(); renderEditor(); toast('Page duplicated onto a fresh spread.'); });
  $('#delete-page').addEventListener('click', () => { const j = currentJournal(); if (j.pages.length <= 2) return toast('Keep at least one complete spread in your journal.'); const deleteIndex = spreadStart + (window.innerWidth <= 650 && mobileSide === 'left' ? 0 : 1); if (!j.pages[deleteIndex]) return; j.pages.splice(deleteIndex, 1); if (j.pages.length % 2 !== 0) j.pages.push(blankPage('A quiet page')); spreadStart = Math.min(spreadStart, Math.max(0, j.pages.length - 2)); if (spreadStart % 2) spreadStart--; mobileSide = 'right'; selectedElementId = null; saveState(); renderEditor(); toast('Page deleted.'); });
  $('#add-page').addEventListener('click', () => { const j = currentJournal(); const leftIndex = appendSpread(j, blankPage('Untitled page')); spreadStart = leftIndex; mobileSide = 'right'; selectedElementId = null; saveState(); renderEditor(); toast('A fresh spread, just for you.'); });
  $('#zoom-in').addEventListener('click', () => { zoom = Math.min(120, zoom + 5); $('#zoom-value').textContent = `${zoom}%`; $('#book-spread').style.transform = `scale(${zoom / 100})`; });
  $('#zoom-out').addEventListener('click', () => { zoom = Math.max(70, zoom - 5); $('#zoom-value').textContent = `${zoom}%`; $('#book-spread').style.transform = `scale(${zoom / 100})`; });
  $('#focus-mode').addEventListener('click', () => {
    const editor = $('#view-editor');
    const focused = editor.classList.toggle('focus-mode');
    $('#focus-mode').setAttribute('aria-pressed', String(focused));
    $('#focus-mode').title = focused ? 'Exit focus mode' : 'Focus mode';
  });
  $('#paper-settings').addEventListener('click', () => {
    if (window.innerWidth <= 900) $('#inspector').classList.toggle('open');
    else { $('#paper-swatches').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#paper-swatches').classList.add('highlight'); setTimeout(() => $('#paper-swatches')?.classList.remove('highlight'), 1200); }
  });
  $('#inspector-close').addEventListener('click', () => $('#inspector').classList.remove('open'));
  $('#print-journal').addEventListener('click', printJournal);
  $('#month-prev').addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); renderCalendar(); });
  $('#month-next').addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); renderCalendar(); });
  $('#calendar-today').addEventListener('click', () => { calendarMonth = new Date(); selectedCalendarDate = todayISO(); renderCalendar(); });
  $('#calendar-new-entry').addEventListener('click', () => { const j = state.journals[0]; const page = { id: uid('page'), date: selectedCalendarDate, title: 'A day to remember', paper: state.profile.paper || 'cream', size: 'a5', elements: templates.daily.elements.map(x => createElement(x.type, structuredClone(x))) }; const leftIndex = appendSpread(j, page); saveState(); openJournal(j.id, leftIndex + 1); });
  $('#new-goal').addEventListener('click', () => openModal({ title: 'Something to grow towards.', eyebrow: 'A NEW GOAL', body: `${field('Goal', 'goal-title', 'What would you like to work towards?')}${field('A little note', 'goal-detail', 'Why does this matter to you?')}<div class="modal-field"><label for="modal-goal-due">Target date (optional)</label><input type="date" id="modal-goal-due"></div>`, actions: [{ label: 'Cancel', onClick: closeModal }, { label: 'Add goal', primary: true, onClick: () => { const title = $('#modal-goal-title').value.trim(); if (!title) return toast('Add a goal title.'); state.goals.push({ id: uid('goal'), title, detail: $('#modal-goal-detail').value.trim(), due: $('#modal-goal-due').value, progress: 0, done: false }); saveState(); closeModal(); renderGoals(); toast('A new goal added.'); } }] }));
  $('#add-habit').addEventListener('click', () => openModal({ title: 'A small thing, often.', eyebrow: 'A NEW HABIT', body: `${field('Habit', 'habit-title', 'e.g. Take a little walk') }<div class="modal-field"><label for="modal-habit-frequency">How often?</label><select id="modal-habit-frequency"><option>Daily</option><option>Weekdays</option><option>Weekly</option></select></div>`, actions: [{ label: 'Cancel', onClick: closeModal }, { label: 'Add habit', primary: true, onClick: () => { const title = $('#modal-habit-title').value.trim(); if (!title) return toast('Name your habit first.'); state.habits.push({ id: uid('habit'), title, frequency: $('#modal-habit-frequency').value, doneDates: [] }); saveState(); closeModal(); renderGoals(); } }] }));
  $('#memory-search').addEventListener('input', renderMemories); $('#memory-filter').addEventListener('change', renderMemories);
  $('#memory-new').addEventListener('click', () => { const j = state.journals[0]; const p = { id: uid('page'), date: todayISO(), title: 'A little memory', paper: state.profile.paper || 'cream', size: 'a5', elements: [createElement('text', { content: '<h2>I want to remember…</h2>', x: 10, y: 10 }), createElement('text', { content: '<p>Write down what made this moment worth keeping.</p>', x: 10, y: 31 })] }; const leftIndex = appendSpread(j, p); saveState(); openJournal(j.id, leftIndex + 1); });
  $('#generate-wrapped').addEventListener('click', generateWrapped);
  $$('.settings-nav button').forEach(b => b.addEventListener('click', () => { settingsTab = b.dataset.settingsTab; $$('.settings-nav button').forEach(x => x.classList.toggle('active', x === b)); renderSettings(); }));
  $('#search-open').addEventListener('click', openSearch);
  $('#help-open').addEventListener('click', () => openModal({ title: 'A few ways to begin.', eyebrow: 'A NOTE FROM MORROW', body: '<p class="muted-small" style="line-height:1.8">Open a journal to enter the book. Use the tools on the left to add text, photos, stickers, checklists, quotes or drawings. Drag elements to move them. On a touch screen or with a stylus, choose Draw to write directly on the paper. Your content is saved locally in this browser. Use Settings → Privacy & data to export a backup.</p>', actions: [{ label: 'Got it', primary: true, onClick: closeModal }] }));
  $('#modal-close').addEventListener('click', closeModal); modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
  $('#import-picker').addEventListener('change', e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });
  $('#sidebar').addEventListener('click', e => { if (e.target === $('#sidebar')) $('#sidebar').classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modalBackdrop.hidden) closeModal(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveState(); toast('Saved on this device.'); } if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
  window.addEventListener('resize', () => { if (activeView === 'editor') renderEditor(); });

  async function init() {
    state = await loadState();
    if (!state.profile) state.profile = structuredClone(seed.profile);
    if (!Array.isArray(state.checkins)) state.checkins = [];
    if (!Array.isArray(state.memories)) state.memories = [];
    if (!Array.isArray(state.customTemplates)) state.customTemplates = [];
    lastSnapshot = JSON.stringify(state);
    renderLibrary(); renderToday();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  init();
})();