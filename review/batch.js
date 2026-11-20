/* PLYSH PREFLIGHT — 여러 파일 한 번에 검수 · 사양서 · 아티스트별 규칙 · 체크리스트 · 결과지 (2026-11-18) */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var RV = window.PLYSH_REVIEW, esc = RV.esc;
var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
function api() { try { var P = window.parent; if (P && P !== window && typeof P.call === 'function' && P.S && P.S.pin) return { call: P.call, pin: P.S.pin, preview: !!P.PLYSH_PREVIEW, S: P.S }; } catch (e) {} return null; }
var A = api();
function hm() { var d = new Date(); return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); }

// ── 품목: 파일 이름·사양서 글자에서 알아냄. 화면에는 자유롭게 적은 이름을 그대로 보여주고, 검사 방식만 아래 6가지 중 하나로 고름 ──
var PROD_CLS = [
  ['photobook', /포토\s*북|화보|레이\s*플랫|layflat|photo\s*book/i],
  ['photocard', /포토\s*카드|포카|photo\s*card|트레카|트레이딩\s*카드/i],
  ['calendar', /캘린더|달력|calendar|시즌\s*그리팅|season'?s?\s*greeting/i],
  ['book', /책자|북클릿|booklet|다이어리|diary|가사집|리플렛|leaflet|매거진|magazine|진\b|zine|브로슈어|노트/i],
  ['web', /팩샷|packshot|공지|notice|썸네일|thumbnail|배너|banner|sns|인스타|insta|상세\s*페이지|웹용|web/i]
];
var PROD_EN = [[/out\s*box/i, '아웃박스'], [/photo\s*book\s*cover/i, '포토북 커버'], [/photo\s*book/i, '포토북'], [/photo\s*card/i, '포토카드'], [/polaroid/i, '폴라로이드'], [/desk\s*calendar/i, '탁상 달력'], [/wall\s*calendar/i, '벽걸이 달력'], [/calendar/i, '달력'], [/poster/i, '포스터'], [/sticker/i, '스티커'], [/letter\s*envelope|envelope/i, '편지 봉투'], [/letter\s*paper/i, '편지지'], [/memo\s*pad\s*cover/i, '메모패드 커버'], [/memo\s*pad/i, '메모패드'], [/post\s*card/i, '엽서'], [/id\s*photo/i, '증명사진'], [/diary/i, '다이어리'], [/keyring|key\s*ring/i, '키링'], [/badge/i, '뱃지'], [/acryl/i, '아크릴']];
var PROD_WORDS = ['포토북', '포토카드', '포카', '캘린더', '달력', '데스크 캘린더', '벽걸이 캘린더', '다이어리', '책자', '북클릿', '가사집', '리플렛', '엽서', '포스터', '스티커', '뱃지', '아크릴 스탠드', '아크릴', '키링', '티켓', '슬로건', '봉투', '박스', '패키지', '띠지', '명함', '굿즈', '팩샷', '공지 이미지', '썸네일', '배너'];
var CLS_NAME = { photobook: '포토북', photocard: '포토카드', calendar: '달력', book: '책자', web: '웹·SNS 이미지', print: '인쇄물' };
function clsOf(s) { s = String(s || ''); for (var i = 0; i < PROD_CLS.length; i++) if (PROD_CLS[i][1].test(s)) return PROD_CLS[i][0]; return 'print'; }
function prodWord(name) {
  var n = String(name || '').replace(/[_\-.]+/g, ' '), best = '';
  PROD_WORDS.forEach(function (w) { if (n.replace(/\s+/g, '').indexOf(w.replace(/\s+/g, '')) >= 0 && w.length > best.length) best = w; });
  if (!best) { var m = String(name || '').replace(/([a-z])([A-Z])/g, '$1 $2'); for (var i = 0; i < PROD_EN.length; i++) if (PROD_EN[i][0].test(m)) { best = PROD_EN[i][1]; break; } }
  return best;
}

// ── 아티스트 목록 (PLYSH 사양서 · 팀 규칙 · 스케줄 파일 이름에서 모음) ──
var ARTISTS = [];
function addArtist(a) { a = String(a || '').trim(); if (a && a !== '공통' && a.length <= 20 && ARTISTS.indexOf(a) < 0) { ARTISTS.push(a); return true; } return false; }
function artistOf(name) {
  var n = String(name || '').toLowerCase().replace(/\s+/g, ''), best = '';
  ARTISTS.forEach(function (a) { var k = a.toLowerCase().replace(/\s+/g, ''); if (k.length >= 2 && n.indexOf(k) >= 0 && k.length > best.length) best = a; });
  if (!best) { var m = String(name || '').match(/^\s*\[([^\]]{1,15})\]/); if (m) best = m[1].trim(); }
  return best;
}
function fillArtistList() { $('#artL').innerHTML = ARTISTS.slice().sort().map(function (a) { return '<option value="' + esc(a) + '">'; }).join(''); }

// ── 사양서 ──
var SPEC = { src: '', text: '', items: [], att: [], specs: [], sheet: null };
function caliper(paper, g) {
  if (!g) return 0;
  var k = /아트|art/i.test(paper) ? 0.00087 : /모조|랑데뷰|몽블랑|문켄|미색|백상/i.test(paper) ? 0.00125 : 0.001;
  return Math.round(g * k * 100) / 100;
}
function parseLine(s) {
  s = String(s || ''); var o = { raw: s.trim() };
  var m = s.match(/(\d{2,4}(?:\.\d+)?)\s*(?:mm)?\s*[×xX*]\s*(\d{2,4}(?:\.\d+)?)\s*(mm|cm)?/);
  if (m) { var k = m[3] === 'cm' ? 10 : 1; o.w = +m[1] * k; o.h = +m[2] * k; }
  m = s.match(/(\d{1,4})\s*(?:p\b|P\b|쪽|페이지)/); if (m) o.pages = +m[1];
  o.bind = /레이\s*플랫|layflat/i.test(s) ? 'layflat' : /중철/.test(s) ? 'saddle' : /PUR/i.test(s) ? 'pur' : /양장|하드\s*커버/.test(s) ? 'hard' : /무선/.test(s) ? 'perfect' : /트윈링|스프링|와이어|링\s*제본|낱장|타공/.test(s) ? 'none' : '';
  o.coat = /무광|매트|matte/i.test(s) ? 'matte' : /유광|gloss|코팅/i.test(s) && !/코팅\s*(없음|x|X|무)/.test(s) ? 'gloss' : '';
  m = s.match(/([가-힣A-Za-z]*)\s*\/?\s*(\d{2,3})\s*g\b/); if (m) { o.paper = (m[1] + ' ' + m[2] + 'g').trim(); o.cal = caliper(m[1], +m[2]); }
  return o;
}
function itemFromRow(head, r) {
  var g = function (re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return String(r[i] == null ? '' : r[i]).trim(); return ''; };
  var big = g(/대분류/), part = g(/^품목/), size = g(/크기|외경/), paper = g(/종이/), cnt = g(/장수|쪽수/), coat = g(/코팅/), bind = g(/접지|제본/), fin = g(/박|형압|에폭시/);
  if (!big && !part) return null;
  var o = parseLine([size, paper, cnt, coat, bind].join(' | '));
  o.name = (big + (part && part !== big ? ' ' + part : '')).trim(); o.big = big; o.part = part; o.size = size; o.paperTxt = paper; o.fin = fin; o.bindTxt = bind;
  o.cls = clsOf(big + ' ' + part); if (/표지|커버/.test(part)) o.cover = true;
  if (!o.pages && /(\d+)\s*매/.test(cnt) && o.cls !== 'calendar') o.pages = 0;
  o.raw = [big, part, size, paper, cnt, coat, bind].filter(Boolean).join(' · ');
  return o;
}
function itemsFromText(t) {
  var out = [];
  String(t || '').split(/\n/).forEach(function (ln) {
    ln = ln.trim(); if (!ln || /^https?:\/\//.test(ln)) return;
    var o = parseLine(ln), w = prodWord(ln);
    if (!o.w && !w && !o.pages) return;
    o.name = w || ln.replace(/\d.*$/, '').trim() || ln.slice(0, 20); o.big = o.name; o.cls = clsOf(ln); out.push(o);
  });
  return out;
}
function specItems() { return SPEC.items; }
var MODE = 'plysh';
function rebuildItems() {
  var it = [];
  if ((MODE === 'plysh' || MODE === 'link') && SPEC.sheet) it = SPEC.sheet.items.slice();
  if (MODE === 'text') it = itemsFromText(SPEC.text);
  if (MODE === 'file') SPEC.att.forEach(function (a) { if (a.text) it = it.concat(itemsFromText(a.text)); });
  SPEC.items = it; showSpecSum(); Q.forEach(autoItem); drawQ();
}
function setMode(m) {
  MODE = m; $$('#specMode button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); });
  $$('#specCard .sm').forEach(function (d) { d.hidden = d.dataset.m !== m; });
  rebuildItems();
}
function specTable() {
  var it = SPEC.items; if (!it.length) return '';
  return '<div class="sv"><table><tr><th>품목</th><th>크기</th><th>종이</th><th>쪽수</th><th>코팅</th><th>제본</th></tr>' + it.map(function (o) {
    return '<tr><td><b>' + esc(o.name) + '</b></td><td>' + esc(o.size || (o.w ? o.w + '×' + o.h + 'mm' : '')) + '</td><td>' + esc(o.paperTxt || o.paper || '') + '</td><td>' + (o.pages ? o.pages + 'p' : '') + '</td><td>' + (o.coat ? (o.coat === 'matte' ? '무광' : '유광') : '') + '</td><td>' + esc(o.bindTxt || (o.bind ? BIND_N[o.bind] : '')) + '</td></tr>';
  }).join('') + '</table></div>';
}
function showSpecSum() {
  var it = SPEC.items, h = '', v = '';
  if (MODE === 'none') { $('#specSum').innerHTML = '사양서 없이 검수해요. 크기·쪽수는 파일 기준으로만 봐요.'; $('#specView').innerHTML = ''; return; }
  if ((MODE === 'plysh' || MODE === 'link') && SPEC.sheet) {
    var sh = SPEC.sheet, tg = (sh.tabs || []).find(function (t) { return t && t.n === sh.tab; }), url = 'https://docs.google.com/spreadsheets/d/' + sh.id + '/edit' + (tg && tg.g != null ? '#gid=' + tg.g : '');
    h += (sh.auto ? '<span class="mute">고른 아티스트의 가장 최근 사양서를 골라 뒀어요. 다르면 위에서 바꿔 주세요.</span><br>' : '') + '<b>' + esc(sh.name) + '</b> <a href="' + esc(url) + '" target="_blank" rel="noopener">시트 열기</a>';
    if (sh.tabs && sh.tabs.length > 1) h += ' · 탭 <select class="inp" id="specTab" style="padding:3px 6px;font-size:12.5px">' + sh.tabs.map(function (t) { var n = t && t.n != null ? t.n : t; return '<option' + (n === sh.tab ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>';
    h += '<br>품목 ' + it.length + '개를 읽었어요. 아래 내용이 맞는지 확인해 주세요.';
  } else if (it.length) h += '품목 ' + it.length + '개를 읽었어요. 아래 내용이 맞는지 확인해 주세요.';
  else if (MODE === 'plysh') h = SPEC.specs.length ? '사양서를 고르면 내용을 보여줘요.' : '';
  else if (MODE === 'link') h = '링크를 넣으면 사양서를 읽어 와요.';
  else if (MODE === 'text') h = SPEC.text.trim() ? '크기(예: 55×85mm)를 찾지 못했어요.' : '한 줄에 품목 하나씩 적어 주세요.';
  else if (MODE === 'file') h = SPEC.att.length ? '첨부한 파일에서 크기를 찾지 못했어요. 이미지는 참고용으로만 붙어요.' : 'PDF·텍스트 사양서는 글자를 읽고, 이미지는 참고용으로 붙여요.';
  $('#specSum').innerHTML = h; $('#specView').innerHTML = specTable(); specChkState();
  var tb = $('#specTab'); if (tb) tb.onchange = function () { pickSpec(SPEC.sheet.id, tb.value); };
}
var BIND_N = { none: '제본 없음', saddle: '중철', perfect: '무선', pur: 'PUR', hard: '양장', layflat: '레이플랫' };
function loadSpecs() {
  if (!A) { $('#specSel').innerHTML = '<option value="">PLYSH 안에서 열면 사양서 목록이 나와요</option>'; return; }
  A.call('appSpecs', A.pin).then(function (L) {
    SPEC.specs = (L || []).slice().sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
    SPEC.specs.forEach(function (s) { if (addArtist(s.artist)) {} });
    fillArtistList(); Q.forEach(function (q) { if (!q.artistSet) q.artist = artistOf(q.file.name); }); drawQ();
    fillSpecSel();
    autoSpec();
  }, function () { $('#specSel').innerHTML = '<option value="">사양서 목록을 불러오지 못했어요</option>'; });
}
function fillSpecSel() { // 고른 아티스트의 사양서를 위에, 나머지는 아래 묶음으로
  var sel = $('#specSel'), cur = sel.value, a = SELART;
  var mine = a ? SPEC.specs.filter(function (x) { return x.artist === a || String(x.name).indexOf(a) >= 0; }) : [];
  var rest = SPEC.specs.filter(function (x) { return mine.indexOf(x) < 0; });
  var opt = function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; };
  sel.innerHTML = '<option value="">' + (a ? (mine.length ? a + ' 사양서 ' + mine.length + '개 중에서 고르기' : a + ' 사양서가 없어요 · 다른 사양서에서 고르기') : '아티스트를 먼저 고르면 그 사양서만 보여요 (' + SPEC.specs.length + '개)') + '</option>' +
    (mine.length ? '<optgroup label="' + esc(a) + '">' + mine.map(opt).join('') + '</optgroup>' + (rest.length ? '<optgroup label="다른 아티스트">' + rest.map(opt).join('') + '</optgroup>' : '') : rest.map(opt).join(''));
  sel.value = cur;
}
function autoSpec() { // 사양서를 아직 안 골랐으면 아티스트로 가장 최근 사양서를 골라 둠
  if (MODE !== 'plysh' || (SPEC.sheet && !SPEC.sheet.auto) || SPEC.userPicked || !SPEC.specs.length) return;
  var a = SELART || Q.map(function (q) { return q.artist; }).filter(Boolean)[0]; if (!a) return;
  var s = SPEC.specs.find(function (x) { return x.artist === a || String(x.name).indexOf(a) >= 0; });
  if (s && (!SPEC.sheet || SPEC.sheet.id !== s.id)) { $('#specSel').value = s.id; pickSpec(s.id, '', true); }
}
function pickSpec(id, tab, auto) {
  if (!id) { SPEC.sheet = null; rebuildItems(); return; }
  if (!A) return;
  var meta = SPEC.specs.find(function (x) { return x.id === id; }) || { name: '연결한 사양서' };
  $('#specSum').textContent = '사양서 읽는 중…';
  A.call('appSpec', A.pin, id, tab || '').then(function (o) {
    var items = []; (o.rows || []).forEach(function (r) { var x = itemFromRow(o.head || [], r); if (x) items.push(x); });
    SPEC.sheet = { id: id, name: meta.name, url: meta.url, tab: o.tab, tabs: o.tabs, items: items, auto: auto, raw: o };
    rebuildItems();
  }, function (e) { SPEC.sheet = null; $('#specSum').textContent = '사양서를 읽지 못했어요: ' + (e && e.message || e); });
}
// ── 사양서 검수: 사양서 자체의 빈칸·숫자·날짜·표기 (spec.js) ──
function specChkState() {
  var b = $('#specChkGo'); if (!b) return;
  var ok = (MODE === 'plysh' || MODE === 'link') && SPEC.sheet && SPEC.sheet.raw;
  b.disabled = !ok;
  $('#specChkNote').textContent = ok ? '사양서 자체의 빈칸 · 장수·쪽수 · 날짜 · 표기를 봐요. 인쇄 파일 없이도 돼요.' : (MODE === 'plysh' || MODE === 'link') ? '사양서를 고르면 검수할 수 있어요.' : '구글 시트 사양서만 검수할 수 있어요.';
}
function specArtist() {
  var m = String(SPEC.sheet && SPEC.sheet.name || '').match(/\[([^\]]+)\]/);
  return (m && m[1]) || SELART || '';
}
function runSpecChk() {
  var SC = window.PLYSH_SPECCHECK, sh = SPEC.sheet; if (!SC || !sh || !sh.raw) return;
  var art = specArtist(), ai = aiFor(art), mem = ai && ai.members ? ai.members.length : 0;
  var R = SC.check({ head: sh.raw.head, rows: sh.raw.rows, info: sh.raw.info, tab: sh.tab, name: sh.name }, { members: mem, artist: art });
  var tg = (sh.tabs || []).find(function (t) { return t && t.n === sh.tab; }), url = 'https://docs.google.com/spreadsheets/d/' + sh.id + '/edit' + (tg && tg.g != null ? '#gid=' + tg.g : '');
  var el = $('#specRep');
  el.innerHTML = '<div class="row noprint" style="justify-content:flex-end;margin-bottom:8px"><button type="button" class="ib" id="specRepPdf">PDF 저장</button><button type="button" class="ib" id="specRepX">닫기</button></div>' + SC.render(R, { url: url });
  el.hidden = false; el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#specRepX').onclick = function () { el.hidden = true; el.innerHTML = ''; };
  $('#specRepPdf').onclick = function () {
    document.body.classList.add('spking');
    var t = document.title; document.title = (art ? '[' + art + ']' : '') + '사양서검수_' + String(sh.tab || '').replace(/\D/g, '').slice(-6);
    setTimeout(function () { window.print(); document.title = t; document.body.classList.remove('spking'); }, 50);
  };
}
function setupSpec() {
  if (window.PLYSH_SPECCHECK && !$('#spkCss')) { var st = document.createElement('style'); st.id = 'spkCss'; st.textContent = window.PLYSH_SPECCHECK.CSS; document.head.appendChild(st); }
  $('#specChkGo').onclick = runSpecChk;
  $$('#specMode button').forEach(function (b) { b.onclick = function () { setMode(b.dataset.m); }; });
  $('#specSel').onchange = function () { SPEC.userPicked = !!this.value; pickSpec(this.value); };
  var tmr = null;
  $('#specTa').oninput = function () { var v = this.value; clearTimeout(tmr); tmr = setTimeout(function () { SPEC.text = v; rebuildItems(); }, 400); };
  $('#specLink').oninput = function () {
    var m = this.value.match(/spreadsheets\/d\/([\w-]{20,})/) || this.value.trim().match(/^([\w-]{30,})$/);
    if (!m) { if (!this.value.trim()) { SPEC.sheet = null; rebuildItems(); } else $('#specSum').textContent = '구글 시트 링크가 아닌 것 같아요.'; return; }
    if (SPEC.sheet && SPEC.sheet.id === m[1]) return;
    if (!A) { $('#specSum').textContent = 'PLYSH 안에서 열어야 링크를 읽을 수 있어요.'; return; }
    SPEC.specs.some(function (s) { return s.id === m[1]; }) || SPEC.specs.push({ id: m[1], name: '링크로 연결한 사양서' });
    SPEC.userPicked = true; pickSpec(m[1]);
  };
  $('#specAttB').onclick = function () { $('#specFile').click(); };
  $('#specFile').onchange = function () { addSpecFiles(this.files); this.value = ''; };
}
async function addSpecFiles(fl) {
  for (var i = 0; i < fl.length; i++) {
    var f = fl[i], a = { name: f.name, text: '', url: '' };
    if (/^image\//.test(f.type)) a.url = URL.createObjectURL(f);
    else if (/\.pdf$/i.test(f.name)) { try { a.text = await pdfText(f); } catch (e) { a.err = true; } }
    else { try { a.text = await f.text(); } catch (e) {} }
    SPEC.att.push(a);
  }
  drawAtt(); rebuildItems();
}
function drawAtt() {
  $('#specAtt').innerHTML = SPEC.att.map(function (a, i) { return '<span class="att">' + (a.url ? '<img src="' + a.url + '" alt="">' : '') + esc(a.name) + (a.url ? ' <span class="mute">참고용</span>' : a.err ? ' <span class="mute">읽지 못함</span>' : '') + '<button type="button" data-i="' + i + '" aria-label="빼기">×</button></span>'; }).join('');
  $$('#specAtt button').forEach(function (b) { b.onclick = function () { SPEC.att.splice(+b.dataset.i, 1); drawAtt(); rebuildItems(); }; });
}
function loadJs(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
async function pdfText(f) {
  if (!window.pdfjsLib) { await loadJs(LIBS.pdfjs); pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.worker; }
  var d = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise, out = [];
  for (var p = 1; p <= Math.min(d.numPages, 10); p++) {
    var tc = await (await d.getPage(p)).getTextContent(), line = [], y = null;
    tc.items.forEach(function (t) { var ty = Math.round(t.transform[5]); if (y !== null && Math.abs(ty - y) > 3) { out.push(line.join(' ')); line = []; } y = ty; line.push(t.str); });
    out.push(line.join(' '));
  }
  d.destroy(); return out.join('\n');
}

// ── 파일 목록 ──
var Q = [], qid = 0;
var KINDS = [['id', 'PDF (인디자인 작업)'], ['aiF', 'PDF (일러스트 outline)'], ['ai', 'AI (일러스트 원본)'], ['img', 'JPG · PNG (이미지)']];
async function sniff(f) {
  if (/\.(jpe?g|png)$/i.test(f.name) || /^image\/(jpeg|png)$/.test(f.type)) return 'img';
  if (/\.ai$/i.test(f.name)) return 'ai';
  var t = ''; try { var b = new Uint8Array(await f.slice(0, 65536).arrayBuffer()); for (var i = 0; i < b.length; i++) t += String.fromCharCode(b[i]); } catch (e) {}
  if (/Adobe Illustrator|Illustrator/i.test(t)) return 'aiF';
  return 'id';
}
async function addFiles(fl) {
  var arr = Array.prototype.slice.call(fl).filter(function (f) { return /\.(pdf|ai|jpe?g|png)$/i.test(f.name); });
  if (!arr.length && fl.length) { alert('PDF · AI · JPG · PNG 파일만 넣을 수 있어요.'); return; }
  for (var i = 0; i < arr.length; i++) {
    var f = arr[i]; if (Q.some(function (q) { return q.file.name === f.name && q.file.size === f.size; })) continue;
    var w = prodWord(f.name), q = { id: ++qid, file: f, kind: await sniff(f), prodName: w, prod: clsOf(f.name), artist: artistOf(f.name), item: -1 };
    if (!w && q.prod !== 'print') q.prodName = CLS_NAME[q.prod];
    autoItem(q); Q.push(q);
    if (q.artist) { addArtist(q.artist); fillArtistList(); }
  }
  if (!SELART) { var fa = Q.map(function (q) { return q.artist; }).filter(Boolean)[0]; if (fa) { SELART = fa; $('#artQ').value = fa; setCur(fa); fillSpecSel(); } }
  drawQ(); autoSpec(); drawArtChips(); drawTitle();
}
function autoItem(q) { // 파일 이름과 가장 잘 맞는 사양서 품목
  if (q.itemSet) return; var n = q.file.name.replace(/[_\-.]+/g, ' ').toLowerCase(), best = -1, bs = 0;
  SPEC.items.forEach(function (o, i) {
    var s = 0; if (o.cls === q.prod && q.prod !== 'print') s += 2;
    [o.big, o.part, o.name].forEach(function (t) { t = String(t || '').toLowerCase().replace(/\s+/g, ''); if (t.length >= 2 && n.replace(/\s+/g, '').indexOf(t) >= 0) s += 3; });
    if (q.prodName && String(o.name).replace(/\s+/g, '').indexOf(q.prodName.replace(/\s+/g, '')) >= 0) s += 2;
    if (/표지|커버|cover/i.test(n) ? o.cover : !o.cover) s += 0.5;
    if (s > bs) { bs = s; best = i; }
  });
  q.item = bs >= 2 ? best : -1;
}
function woOf(q) {
  var o = SPEC.items[q.item]; if (!o) return { w: 0, h: 0, pages: 0, bind: q.prod === 'photobook' ? 'layflat' : 'none', cal: 0, coat: q.prod === 'photocard' ? 'gloss' : '', layout: 'auto' };
  return { w: o.w || 0, h: o.h || 0, pages: o.pages || 0, bind: o.bind || (q.prod === 'photobook' ? 'layflat' : 'none'), cal: o.cal || 0, coat: o.coat || '', layout: 'auto' };
}
function drawQ() {
  var h = '';
  if (Q.length) {
    h += '<div class="flh"><span>파일 ' + Q.length + '개</span><span>종류</span><span>품목</span><span>아티스트</span><span></span></div>';
    h += Q.map(function (q) {
      var o = SPEC.items[q.item];
      return '<div class="fr" data-id="' + q.id + '"><span class="fn" title="' + esc(q.file.name) + '">' + esc(q.file.name) + '</span>' +
        '<select class="inp" data-f="kind">' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (q.kind === k[0] ? ' selected' : '') + (k[0] === 'img' ? (q.kind === 'img' ? '' : ' disabled') : q.kind === 'img' ? ' disabled' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>' +
        '<input class="inp" data-f="prodName" list="prodL" placeholder="예: 엽서" value="' + esc(q.prodName) + '">' +
        '<input class="inp" data-f="artist" list="artL" placeholder="아티스트" value="' + esc(q.artist) + '">' +
        '<button type="button" class="x" data-f="x" aria-label="빼기">×</button>' +
        '<div class="fm">' + esc(CLS_NAME[q.prod]) + ' 기준으로 검사 · ' + (SPEC.items.length ? '사양 <select class="inp" data-f="item" style="padding:2px 6px;font-size:12px;max-width:260px"><option value="-1">맞는 품목 없음</option>' + SPEC.items.map(function (x, i) { return '<option value="' + i + '"' + (q.item === i ? ' selected' : '') + '>' + esc(x.name + (x.w ? ' ' + x.w + '×' + x.h : '')) + '</option>'; }).join('') + '</select>' + (o ? ' ' + esc([o.pages ? o.pages + 'p' : '', o.bind ? BIND_N[o.bind] : '', o.coat ? (o.coat === 'matte' ? '무광' : '유광') : '', o.paper || ''].filter(Boolean).join(' · ')) : '') : '사양서 없음 (크기는 파일 기준)') + '</div></div>';
    }).join('');
  }
  $('#flist').innerHTML = h + '<datalist id="prodL">' + PROD_WORDS.map(function (w) { return '<option value="' + w + '">'; }).join('') + '</datalist>';
  $$('#flist .fr').forEach(function (row) {
    var q = Q.find(function (x) { return x.id === +row.dataset.id; });
    $$('[data-f]', row).forEach(function (el) {
      var f = el.dataset.f;
      if (f === 'x') el.onclick = function () { Q.splice(Q.indexOf(q), 1); drawQ(); drawArtChips(); };
      else el.onchange = function () {
        if (f === 'kind') q.kind = el.value;
        if (f === 'prodName') { q.prodName = el.value.trim(); q.prod = clsOf(q.prodName + ' ' + q.file.name); autoItem(q); drawQ(); }
        if (f === 'artist') { q.artist = el.value.trim(); q.artistSet = true; if (addArtist(q.artist)) fillArtistList(); drawArtChips(); }
        if (f === 'item') { q.item = +el.value; q.itemSet = true; drawQ(); }
      };
    });
  });
  $('#go').disabled = !Q.length || RUN;
  $('#go').textContent = Q.length ? '검수 시작 · 파일 ' + Q.length + '개' : '검수 시작';
}
function setupFiles() {
  var d = $('#drop'), fi = $('#file');
  $('#pick').onclick = function (e) { e.stopPropagation(); fi.click(); };
  d.onclick = function () { fi.click(); };
  fi.onchange = function () { addFiles(fi.files); fi.value = ''; };
  d.addEventListener('dragover', function (e) { e.preventDefault(); d.classList.add('on'); });
  d.addEventListener('dragleave', function () { d.classList.remove('on'); });
  d.addEventListener('drop', function (e) { e.preventDefault(); d.classList.remove('on'); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
}

// ── 팀 표기 규칙 · 생일 (아티스트별) ──
var RULES = { '공통': '' }, CUR = '공통', RKEY = 'rv:rules2', R_OLD = false;
(function () { try { var o = JSON.parse(ls.get(RKEY) || 'null'); if (o) RULES = o; else { var t = ls.get('rv:rules'); if (t) RULES['공통'] = t; } } catch (e) {} if (RULES['공통'] == null) RULES['공통'] = ''; })();
function rulesFor(artist) { return [RULES['공통'] || '', artist && RULES[artist] || '', infoRules(artist)].filter(function (s) { return s.trim(); }).join('\n\n'); }
function cacheRules() { ls.set(RKEY, JSON.stringify(RULES)); }
function say(t, bad) { var st = $('#rulesSt'); st.textContent = t; st.style.color = bad ? '#f04452' : ''; st.style.background = bad ? '#fdecec' : ''; }
var INFO_KEYS = ['국문명', '영문명', '데뷔일', '팬덤명 (국문)', '팬덤명 (영문)', '소속사'], INFO_EDIT = false;
// 아티스트 기본 정보 시트 (PLASH › 05_아티스트정보) — 열: 아티스트 | 별칭 | 국문명 | 영문명 | 데뷔일 | 팬덤명 국문 | 팬덤명 영문 | 소속사 | 확인 필요 | 확인일
var AINFO = {}, AINFO_URL = '', AINFO_LIST = [];
function aiKey(a) { return String(a || '').toLowerCase().replace(/[\s.\-_·]/g, ''); }
function aiFor(a) { return a ? AINFO[aiKey(a)] || null : null; }
function loadArtistInfo() {
  if (!A) return;
  A.call('appArtistInfo', A.pin).then(function (o) {
    if (!o || !o.info) return;
    AINFO = {}; AINFO_LIST = []; AINFO_URL = o.url || '';
    o.info.forEach(function (r) {
      var e = { name: String(r[0]).trim(), info: {}, note: String(r[8] || '').trim(), at: String(r[9] || '').trim(), members: [] };
      INFO_KEYS.forEach(function (k, i) { e.info[k] = String(r[i + 2] || '').trim(); });
      AINFO_LIST.push(e);
      [e.name, e.info['국문명'], e.info['영문명']].concat(String(r[1] || '').split(/[,，]/)).forEach(function (n) { var k = aiKey(n); if (k.length >= 2 && !AINFO[k]) AINFO[k] = e; });
    });
    (o.members || []).forEach(function (r) { var e = aiFor(r[0]); if (e) e.members.push({ ko: String(r[1] || '').trim(), en: String(r[2] || '').trim(), bd: String(r[3] || '').trim(), y: String(r[4] || '').trim(), note: String(r[5] || '').trim() }); });
    drawInfo();
  }, function () {});
}

function drawInfo() {
  var el = $('#artInfo'); if (!el) return;
  if (CUR === '공통') { el.innerHTML = ''; return; }
  var ai = aiFor(CUR);
  if (ai) {
    var g = '<div class="row" style="justify-content:space-between;margin-bottom:8px"><b style="font-size:15px">' + esc(ai.name) + ' 기본 정보</b>' + (AINFO_URL ? '<a class="ib" href="' + esc(AINFO_URL) + '" target="_blank" rel="noopener">시트에서 고치기</a>' : '') + '</div><div class="ai">';
    g += INFO_KEYS.map(function (k) { return '<div>' + esc(k) + '<b>' + (ai.info[k] ? esc(ai.info[k]) : '<span class="mute" style="font-weight:600">—</span>') + '</b></div>'; }).join('') + '</div>';
    var solo = ai.members.length === 1 && aiKey(ai.members[0].ko) === aiKey(ai.info['국문명'] || ai.name);
    if (ai.members.length) g += '<div class="aim">' + (solo ? '<span class="mute">생일</span> ' : '<span class="mute">멤버 ' + ai.members.length + '명</span> ') + ai.members.map(function (m) { var b = m.bd.split('-'); return '<span>' + (solo ? '' : esc(m.ko) + (m.en ? ' <i>' + esc(m.en) + '</i> ' : ' ')) + (b.length === 2 ? +b[0] + '/' + +b[1] : esc(m.bd)) + '</span>'; }).join('') + '</div>';
    if (ai.note) g += '<div class="note" style="margin-top:8px">확인 필요: ' + esc(ai.note) + '</div>';
    el.innerHTML = g; return;
  }
  var info = RV2.parseRules(RULES[CUR] || '').info || {}, has = INFO_KEYS.some(function (k) { return info[k]; });
  var h = '<div class="row" style="justify-content:space-between;margin-bottom:8px"><b style="font-size:15px">' + esc(CUR) + ' 기본 정보</b><button type="button" class="ib" id="infoEd">' + (INFO_EDIT ? '입력 끝' : has ? '정보 고치기' : '정보 넣기') + '</button></div><div class="ai">';
  h += INFO_KEYS.map(function (k) { return '<div>' + esc(k) + (INFO_EDIT ? '<input class="inp" data-k="' + esc(k) + '" value="' + esc(info[k] || '') + '" placeholder="' + (k === '데뷔일' ? '예: 2017-08-02' : '') + '">' : '<b>' + (info[k] ? esc(info[k]) : '<span class="mute" style="font-weight:600">—</span>') + '</b>') + '</div>'; }).join('') + '</div>';
  if (!has && !INFO_EDIT) h += '<div class="note" style="margin-top:8px">아직 넣은 정보가 없어요. 한 번 넣으면 팀 시트에 저장돼서 다음부터 바로 보여요. 영문명·팬덤명은 파일 속 표기 검사에도 써요.</div>';
  el.innerHTML = h;
  $('#infoEd').onclick = function () { INFO_EDIT = !INFO_EDIT; drawInfo(); };
  $$('#artInfo input[data-k]').forEach(function (i) { i.onchange = function () { setInfo(i.dataset.k, i.value.trim()); }; });
}
function setInfo(k, v) {
  var rows = RV2.rulesToRows(RULES[CUR] || ''), found = false;
  rows = rows.filter(function (r) { if (/정보/.test(r[0]) && r[1] === k) { if (found || !v) return false; found = true; r[2] = v; } return true; });
  if (!found && v) rows.unshift(['기본 정보', k, v]);
  var inf = rows.filter(function (r) { return /정보/.test(r[0]); }).sort(function (x, y) { var i = INFO_KEYS.indexOf(x[1]), j = INFO_KEYS.indexOf(y[1]); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
  rows = inf.concat(rows.filter(function (r) { return !/정보/.test(r[0]); }));
  var ta = $('#rulesTa'); ta.value = RV2.rowsToRules(rows); ta.oninput();
}
function infoRules(artist) { // 영문명·팬덤명은 표기 검사에, 시트의 멤버·생일은 멤버/날짜 검사에 같이 씀
  var own = artist && RULES[artist] ? RV2.parseRules(RULES[artist]) : { info: {}, members: [], days: [] }, ai = aiFor(artist), info = {}, t = [], out = [];
  INFO_KEYS.forEach(function (k) { info[k] = (own.info || {})[k] || (ai && ai.info[k]) || ''; });
  ['영문명', '팬덤명 (영문)', '국문명', '팬덤명 (국문)'].forEach(function (k) { var v = String(info[k] || '').replace(/[\/=,]/g, ' ').trim(); if (v.length >= 2 && t.indexOf(v) < 0) t.push(v); });
  if (t.length) out.push('[표기]\n' + t.join('\n'));
  if (ai && ai.members.length) {
    var solo = ai.members.length === 1;
    out.push('[기본 정보]\n인원: ' + ai.members.length);
    if (!solo && !own.members.length) out.push('[멤버]\n' + ai.members.map(function (m) { return m.ko + (m.en ? ' / ' + m.en : ''); }).join('\n'));
    if (!own.days.length) { var d = ai.members.filter(function (m) { return /^\d{1,2}-\d{1,2}$/.test(m.bd); }).map(function (m) { var b = m.bd.split('-'); return +b[0] + '/' + +b[1] + ' ' + m.ko + ' 생일'; }); if (d.length) out.push('[생일·기념일]\n' + d.join('\n')); }
  }
  return out.join('\n\n');
}
function cnt() {
  var r = RV2.parseRules($('#rulesTa').value), n = r.members.length + r.terms.length + r.days.length;
  $('#rulesCnt').textContent = '· ' + CUR + ' 멤버 ' + r.members.length + ' · 표기 ' + r.terms.length + ' · 날짜 ' + r.days.length;
  drawInfo();
  var sm = $('#rulesSum'); if (!sm) return;
  sm.innerHTML = n ? '<b>' + esc(CUR) + '</b> 규칙: ' + esc(r.members.map(function (m) { return m.forms.join('/'); }).slice(0, 6).join(', ') + (r.members.length > 6 ? ' 외' : '')) + (r.terms.length ? ' · 표기 ' + r.terms.length + '개' : '') + (r.days.length ? ' · 날짜 ' + r.days.length + '개' : '') : '<b>' + esc(CUR) + '</b> 규칙이 아직 없어요. 직접 입력으로 넣으면 팀 시트에 저장돼요.';
}
function drawArtChips() {
  var fileA = Q.map(function (q) { return q.artist; }).filter(Boolean), list = ['공통'];
  fileA.concat(Object.keys(RULES)).forEach(function (a) { if (a && list.indexOf(a) < 0) list.push(a); });
  $('#artChips').innerHTML = list.map(function (a) { var n = (RULES[a] || '').trim() ? RV2.parseRules(RULES[a]) : null, c = n ? n.members.length + n.terms.length + n.days.length : 0; return '<button type="button" data-a="' + esc(a) + '" class="' + (a === CUR ? 'on' : '') + '">' + esc(a) + (fileA.indexOf(a) >= 0 ? ' ·파일' : '') + ' <span class="mute">' + c + '</span></button>'; }).join('');
  $$('#artChips button').forEach(function (b) { b.onclick = function () { if (b.dataset.a === '공통') setCur('공통'); else pickArtist(b.dataset.a); }; });
  $('#artCur').textContent = CUR;
}
var SELART = '';
function pickArtist(a) {
  a = String(a || '').trim(); if (a === SELART) return; SELART = a; $('#artQ').value = a;
  if (!a) { drawArtChips(); return; }
  if (addArtist(a)) fillArtistList();
  Q.forEach(function (q) { if (!q.artistSet) q.artist = a; });
  setCur(a); drawQ(); fillSpecSel(); autoSpec(); drawTitle();
}
function setCur(a) { INFO_EDIT = false; flush(); CUR = a || '공통'; if (RULES[CUR] == null) RULES[CUR] = ''; $('#rulesTa').value = RULES[CUR]; lastSaved[CUR] = lastSaved[CUR] != null ? lastSaved[CUR] : RULES[CUR]; cnt(); drawArtChips(); }
var timer = null, saving = false, lastSaved = {};
function flush() { if (timer) { clearTimeout(timer); timer = null; save(CUR); } }
function save(a) {
  if (!A || saving) return; var v = RULES[a] || ''; if (v === lastSaved[a]) return;
  if (R_OLD && a !== '공통') { say('시트 쪽 스크립트 업데이트 전이라 아티스트별 규칙은 이 기기에만 저장했어요', true); return; }
  saving = true; say('팀 시트에 저장 중…');
  var rows = RV2.rulesToRows(v);
  A.call('appRvRulesSet', A.pin, R_OLD ? rows : { artist: a, rows: rows }).then(function () {
    saving = false; lastSaved[a] = v; say((A.preview ? '미리보기라 임시로 저장했어요 · ' : '팀 시트에 저장했어요 · ') + hm());
    if (RULES[a] !== v) save(a);
  }, function (e) { saving = false; say('시트에 저장하지 못했어요 (' + (e && e.message || e) + ') · 이 기기에는 저장됨', true); });
}
function setupRules() {
  var ta = $('#rulesTa'); ta.placeholder = '한 줄에 하나씩 적어 주세요.\n[멤버]\n한글 이름 / 영문 이름 = 틀린 표기, 틀린 표기\n\n[표기]\n정식 표기 = 틀린 표기\n\n[생일·기념일]\n월/일 내용'; ta.value = RULES[CUR] || '';
  $('#rulesOpen').onclick = function () { ta.hidden = !ta.hidden; this.textContent = ta.hidden ? '직접 입력' : '입력 닫기'; if (!ta.hidden) ta.focus(); };
  ta.oninput = function () { RULES[CUR] = ta.value; cacheRules(); cnt(); drawArtChips(); if (A) { say('입력 중…'); var a = CUR; clearTimeout(timer); timer = setTimeout(function () { timer = null; save(a); }, 1500); } };
  ta.onblur = function () { flush(); };
  $('#artQ').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); pickArtist(this.value); } };
  $('#artQ').onchange = function () { pickArtist(this.value); };
  $('#artQ').oninput = function () { if (ARTISTS.indexOf(this.value.trim()) >= 0) pickArtist(this.value); };
  $('#artCommon').onclick = function () { setCur('공통'); };
  cnt(); drawArtChips();
  if (!A) { say('PLYSH 밖에서 열어서 이 기기에만 저장돼요'); return; }
  loadArtistInfo();
  say('팀 시트에서 불러오는 중…');
  A.call('appRvRules', A.pin).then(function (o) {
    var rows = (o && o.rows) || [], by = {};
    R_OLD = rows.length > 0 && rows[0].length < 4;
    rows.forEach(function (r) { var a = r.length >= 4 ? String(r[0] || '').trim() || '공통' : '공통', x = r.length >= 4 ? r.slice(1) : r; (by[a] = by[a] || []).push(x); });
    if (!rows.length) { say('팀 시트가 비어 있어요' + ((RULES['공통'] || '').trim() ? ' · 이 기기 내용을 올릴게요' : '')); Object.keys(RULES).forEach(function (a) { lastSaved[a] = ''; }); save('공통'); return; }
    Object.keys(by).forEach(function (a) { var v = RV2.rowsToRules(by[a]); if (!(a === CUR && timer)) { RULES[a] = v; lastSaved[a] = v; } addArtist(a); });
    cacheRules(); fillArtistList(); if (!timer) ta.value = RULES[CUR] || ''; cnt(); drawArtChips();
    say((A.preview ? '미리보기 임시 저장소' : '팀 시트') + '에서 불러왔어요' + (o.at ? ' · 마지막 수정 ' + o.at : '') + (R_OLD ? ' · 아티스트별 저장은 시트 업데이트 후에 돼요' : ''));
  }, function (e) { say('팀 시트를 불러오지 못했어요 · 이 기기 내용으로 검수해요', true); });
}
function scheduleArtists() { try { (A && A.S.D && A.S.D.files || []).forEach(function (f) { var n = String(f && (f.name || f) || ''), m = n.match(/^\s*\[?([^\]\s]+)/); if (m && !/^\d/.test(m[1])) addArtist(m[1]); }); } catch (e) {} fillArtistList(); }

// ── 프로젝트 타이틀 (직접 쓰거나, 비우면 파일 이름에서) ──
var STOPW = /^(final|fin|최종|수정|v\d+|ver\d*|rev\d*|\d{1,3}|\d{6,8}|outline|ol|cmyk|rgb|print|인쇄용|웹용|내지|표지|커버|cover|앞|뒤|앞면|뒷면|copy|사본)$/i;
function inferTitle() {
  if (!Q.length) return '';
  var cnt = {}, order = [];
  Q.forEach(function (q) {
    var n = q.file.name.replace(/\.[a-z0-9]+$/i, '').replace(/^\s*\[[^\]]*\]/, ' '), seen = {};
    ARTISTS.concat([q.artist, q.prodName]).forEach(function (a) { if (a && a.length > 1) n = n.split(a).join(' '); });
    PROD_WORDS.forEach(function (w) { n = n.split(w).join(' '); });
    n.split(/[_\-\s.()]+/).forEach(function (t) { t = t.trim(); if (!t || STOPW.test(t) || seen[t]) return; seen[t] = 1; if (!cnt[t]) { cnt[t] = 0; order.push(t); } cnt[t]++; });
  });
  var need = Math.max(1, Math.ceil(Q.length / 2)), out = order.filter(function (t) { return cnt[t] >= need; });
  return out.join(' ').trim();
}
function titleOf() { var t = $('#ttl').value.trim(); return t || inferTitle(); }
function drawTitle() {
  var t = $('#ttl').value.trim(), g = inferTitle();
  $('#ttlNote').innerHTML = t ? '파일 속 글자에서 <b>' + esc(t) + '</b> 표기가 다르게 쓰인 곳을 찾아요. (대소문자·띄어쓰기)' : g ? '파일 이름에서 읽은 타이틀: <b>' + esc(g) + '</b> · 다르면 위에 직접 적어 주세요.' : (Q.length ? '파일 이름에서 공통 타이틀을 찾지 못했어요. 필요하면 위에 직접 적어 주세요.' : '파일을 넣으면 파일 이름에서 타이틀을 찾아봐요.') + ' 나중에 PLYSH 프로젝트와 연동할 자리예요.';
}
function titleRule(t) { t = String(t || '').replace(/[\/=,]/g, ' ').replace(/\s+/g, ' ').trim(); return t.length >= 2 && /[A-Za-z가-힣]/.test(t) ? '[표기]\n' + t : ''; }

// ── 검수 실행 ──
var RS = [], CURR = null, RUN = false;
var JOBS = [], JI = -1, T0 = 0, pending = false, STOPPED = false;
function jobName(j) { return j.img ? j.files.length + '개 이미지 · ' + (j.meta.prodName || '이미지') : j.file.name; }
function sec(ms) { var s = Math.round(ms / 1000); return s < 60 ? s + '초' : Math.floor(s / 60) + '분 ' + (s % 60) + '초'; }
window.RVB_prog = function (t, p) { var j = JOBS[JI]; if (!j) return; j.pct = Math.max(j.pct || 0, Math.min(0.99, p || 0)); j.step = t; if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; drawProg(); }); } };
function drawProg() {
  var n = JOBS.length, done = JOBS.filter(function (j) { return j.st === 'done' || j.st === 'fail'; }).length, cur = JOBS[JI], tot = n ? (done + (cur && cur.st === 'run' ? cur.pct || 0 : 0)) / n : 0;
  var SN = { wait: '대기', run: '검수 중', done: '완료', fail: '열지 못함', stop: '중지됨' };
  var h = '<div class="row" style="justify-content:space-between;align-items:center"><div><b style="font-size:16px">' + (RUN ? '검수 중 · ' + Math.min(done + 1, n) + ' / ' + n : STOPPED ? '중지했어요 · ' + done + ' / ' + n + ' 완료' : '검수 끝 · ' + n + '개') + '</b> <span class="mute small">전체 ' + Math.round(tot * 100) + '% · ' + sec(Date.now() - T0) + '</span></div>' +
    (RUN ? '<button type="button" class="ib" id="stop" style="color:var(--red)">중지</button>' : '') + '</div><div class="bar" style="margin:10px 0 6px"><i style="width:' + Math.round(tot * 100) + '%"></i></div>';
  h += JOBS.map(function (j, i) {
    var pc = j.st === 'done' || j.st === 'fail' ? 100 : j.st === 'run' ? Math.round((j.pct || 0) * 100) : 0;
    return '<div class="pj ' + j.st + '"><div class="pjh"><span class="pjn">' + esc(jobName(j)) + '</span><span class="pjm">' + esc([j.meta.prodName, j.meta.artist].filter(Boolean).join(' · ')) + '</span><span class="pjs">' + (j.st === 'run' ? pc + '%' : SN[j.st]) + (j.ms ? ' · ' + sec(j.ms) : '') + '</span></div>' +
      (j.st === 'run' ? '<div class="bar sm"><i style="width:' + pc + '%"></i></div><div class="small mute" style="margin-top:3px">' + esc(j.step || '') + '</div>' : '') + '</div>';
  }).join('');
  $('#prog').innerHTML = h; $('#prog').hidden = false;
  var sb = $('#stop'); if (sb) sb.onclick = function () { sb.disabled = true; sb.textContent = '중지하는 중…'; STOPPED = true; RV.abort(true); };
}
async function run() {
  if (RUN || !Q.length) return; flush(); RUN = true; STOPPED = false; RV.abort(false); drawQ();
  RS = []; CURR = null; $('#results').hidden = true; RV.show(null); drawChecklist(null);
  var jobs = [], imgG = {};
  Q.forEach(function (q) {
    var meta = { WO: woOf(q), kind: q.kind, prod: q.prod, prodName: q.prodName || CLS_NAME[q.prod], artist: q.artist, spec: SPEC.items[q.item] ? SPEC.items[q.item].raw : '', title: titleOf(), rulesText: [rulesFor(q.artist), titleRule(titleOf())].filter(Boolean).join('\n\n') };
    if (q.kind === 'img') { var k = q.prod + '|' + q.prodName + '|' + q.artist + '|' + q.item; if (!imgG[k]) { imgG[k] = { img: true, files: [], meta: meta, st: 'wait' }; jobs.push(imgG[k]); } imgG[k].files.push(q.file); }
    else jobs.push({ file: q.file, meta: meta, st: 'wait' });
  });
  JOBS = jobs; T0 = Date.now(); drawProg();
  $('#prog').scrollIntoView({ behavior: 'smooth', block: 'start' });
  for (var i = 0; i < jobs.length; i++) {
    var j = jobs[i], r, t1 = Date.now(); JI = i; j.st = 'run'; j.pct = 0; drawProg();
    j.meta.label = jobName(j);
    try { r = j.img ? await RV.analyzeImages(j.files, j.meta) : await RV.analyzePdf(j.file, j.meta); }
    catch (e) {
      if (e && e.abort) { j.st = 'stop'; break; }
      console.error(e); r = { file: j.img ? j.files[0].name : j.file.name, fatal: '검수 중 문제가 생겼어요', fatalSub: String(e && e.message || e), issues: [], pages: [] };
    }
    j.ms = Date.now() - t1; j.st = r.fatal ? 'fail' : 'done';
    r.checked = {}; r.title = j.meta.title; RS.push(r); drawResults(); drawProg();
    if (i === 0) select(r);
    if (STOPPED) break;
  }
  JOBS.forEach(function (j) { if (j.st === 'wait' || j.st === 'run') j.st = 'stop'; });
  RV.abort(false); RUN = false; JI = -1; drawProg(); drawQ(); drawResults();
  if (CURR) select(CURR);
  if (RS.length) $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function counts(r) { var c = { err: 0, warn: 0, adv: 0, info: 0 }; (r.issues || []).forEach(function (x) { if (!x.hidden) c[x.sev]++; }); return c; }
function drawResults() {
  if (!RS.length) { $('#results').hidden = true; return; }
  var h = '<div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 class="sh" style="margin:0">검수 결과 · 파일 ' + RS.length + '개' + (RUN ? ' <span class="mute small" style="font-weight:600">· 끝난 파일부터 바로 눌러 볼 수 있어요</span>' : '') + '</h3><div class="row"><button class="ib" id="pAll"' + (RUN ? ' disabled' : '') + '>전체 결과지</button><button class="ib" id="again">파일 비우고 새로</button></div></div><div class="rf">';
  h += RS.map(function (r, i) { var c = counts(r); return '<button data-i="' + i + '" class="' + (r === CURR ? 'on' : !r._seen ? 'new' : '') + '"><b>' + (!r._seen && r !== CURR ? '<em class="nw">새 결과</em>' : '') + esc(r.file) + '</b><span class="small sub">' + (r.fatal ? '열지 못함' : esc([RV.KIND_LABEL[r.kind], r.prodName, r.artist].filter(Boolean).join(' · '))) + '</span><span class="c">' + (r.fatal ? '<i class="f">' + esc(r.fatal) + '</i>' : (c.err ? '<i class="e">경고 ' + c.err + '</i>' : '') + (c.warn ? '<i class="w">주의 ' + c.warn + '</i>' : '') + (c.adv ? '<i class="w">조언 ' + c.adv + '</i>' : '') + (!c.err && !c.warn ? '<i class="o">통과</i>' : '')) + '</span></button>'; }).join('');
  $('#results').innerHTML = h + '</div>'; $('#results').hidden = false;
  $$('#results .rf button').forEach(function (b) { b.onclick = function () { select(RS[+b.dataset.i]); }; });
  $('#pAll').onclick = function () { printSheet(RS); };
  $('#again').onclick = function () { Q = []; RS = []; CURR = null; drawQ(); drawResults(); drawChecklist(null); RV.show(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
}
function select(r) {
  CURR = r; r._seen = true; drawResults();
  drawChecklist(r);
  if (r.fatal) { RV.show(null); $('#chk').insertAdjacentHTML('afterbegin', '<div class="note" style="color:var(--red);margin:0 0 8px"><b>' + esc(r.fatal) + '</b> ' + esc(r.fatalSub || '') + '</div>'); return; }
  RV.show(r);
}

// ── 체크리스트 ──
function isText(r) { return !r.isImg && r.kind !== 'aiF'; }
function isBook(r) { return r.WO && r.WO.bind && r.WO.bind !== 'none' || r.prod === 'photobook' || r.prod === 'book'; }
function hasPeople(r) { return /photobook|photocard|calendar|book/.test(r.prod) || (r.faces && r.faces.length) || (r.people && r.people.length); }
var PRINTISH = function (r) { return r.prod !== 'web'; }, PDFONLY = function (r) { return !r.isImg; }, IMGONLY = function (r) { return !!r.isImg; };
var CHECK = [
  ['파일 · 크기', [
    ['재단 크기 = 사양서', ['trimsize', 'nobox', 'imgratio', 'imgsizeinfo'], PRINTISH],
    ['도련 3mm', ['bleedbox', 'bleedfill'], PRINTISH],
    ['안전 여백 3mm (얼굴 · 글자)', ['safe', 'safeface', 'diesafe'], PRINTISH],
    ['칼선 · 후가공 판 (별색 + 오버프린트)', ['dieinfo', 'finop', 'finlayer', 'spotfin'], PDFONLY],
    ['펼침면 가운데 기준선 남김', ['centerguide'], PDFONLY],
    ['주석 · 메모 · 파일 구조', ['annot', 'parse', 'trunc', 'p2err'], PDFONLY],
    ['이미지 포함(링크 아님)', ['embed'], PDFONLY]
  ]],
  ['이미지', [
    ['이미지 해상도 ' + RV.SET.ppi + 'ppi 이상', ['lowppi']],
    ['RGB 이미지 · RGB 색 남음', ['rgbimg', 'rgbvec', 'imgrgb'], PRINTISH],
    ['웹용 색 (sRGB) · 용량', ['imgcmyk', 'imgprofile', 'imgweight'], function (r) { return r.isImg && r.prod === 'web'; }],
    ['투명 배경 · 이미지 열기', ['imgalpha', 'imgread'], IMGONLY],
    ['같은 품목 이미지끼리 크기·색 모드 통일', ['imgsize', 'imgmix'], function (r) { return r.isImg && r.n > 1; }]
  ]],
  ['색 · 잉크', [
    ['쓰인 별색 · 의도치 않은 별색', ['spot', 'reg'], PDFONLY],
    ['잉크 총량 (TAC)', ['tac', 'tac2'], PDFONLY],
    ['리치블랙 C30 M20 Y20 K100', ['richblack', 'richblack2'], PDFONLY],
    ['K100 글자 오버프린트', ['smallk', 'kop'], PDFONLY],
    ['별색·단색 위 선 오버프린트', ['strokeop'], PDFONLY],
    ['흰색 오버프린트 (사라짐)', ['whiteop', 'whiteopt'], PDFONLY]
  ]],
  ['글자 · 선', [
    ['너무 작은 글자 (' + RV.SET.minText + 'pt 이하)', ['tiny'], PDFONLY],
    ['작은 글자 4색', ['small4c'], PDFONLY],
    ['얇은 선 · 4색 얇은 선', ['hair', 'hair0', 'thin4c'], PDFONLY],
    ['어두운 바탕 흰 글자 (뭉침)', ['whitetext'], PDFONLY],
    ['아웃라인 · 서체 포함', ['outline', 'fontembed'], PDFONLY]
  ]],
  ['제본 · 접지', [
    ['페이지 수 (제본 방식 · 사양서)', ['pages2', 'pages4', 'pagecount'], isBook],
    ['접히는 곳·제본 안쪽에 얼굴·글자', ['guttertext', 'gutterface', 'gutteradv'], isBook],
    ['포토북 첫·끝 페이지 풀칠 3mm · 가운데 정렬', ['glue', 'gluecenter'], function (r) { return r.prod === 'photobook' || r.WO && r.WO.bind === 'layflat'; }]
  ]],
  ['사진 · 인물', [
    ['중복 사진', ['dup', 'dupnear']],
    ['멤버별 사진 수', ['count'], hasPeople],
    ['멤버 사진과 이름', ['namematch'], function (r) { return hasPeople(r) && isText(r); }],
    ['얼굴 크기 일관성', ['facesize'], hasPeople],
    ['밝기 · 피부톤 (같은 멤버·의상)', ['tone', 'cardtone'], hasPeople],
    ['코팅 후 어두워짐', ['coat', 'coatdark'], function (r) { return hasPeople(r) && r.prod !== 'web'; }]
  ]],
  ['글자 · 표기', [
    ['두 칸 띄어쓰기', ['dblspace'], isText],
    ['문장부호 통일 · ′″ 따옴표', ['punct', 'prime'], isText],
    ['헷갈리는 글자 · 혼자 떨어진 v / z / w', ['oddchar', 'vzw'], isText],
    ['오타 · 반복 단어', ['typoko', 'typoen', 'repword'], isText],
    ['글자 중간에 스타일 바뀜', ['midstyle', 'sizemix'], isText],
    ['팀 표기 규칙 (멤버·소속사·타이틀·품목명)', ['rule', 'rulecase', 'case'], isText],
    ['한글 · 영문 섞임', ['koen', 'koen2'], isText],
    ['반복 문구 일관성', ['repeat'], isText],
    ['페이지 번호 · 목차', ['pagenum', 'toc', 'toc2', 'tocorder'], function (r) { return isText(r) && isBook(r); }],
    ['리걸 표기', ['nocopy', 'copyyear', 'copyok'], isText],
    ['바코드 · ISBN · QR', ['bcfail', 'bcok', 'bcload', 'isbnsum', 'isbnbar'], PDFONLY],
    ['글자를 읽을 수 없음', ['notext', 'nouni'], PDFONLY]
  ]],
  ['디자인 규칙', [
    ['반복되는 칸의 서체·크기·색', ['rulecell', 'ruletext'], PDFONLY]
  ]],
  ['달력', [
    ['공휴일 · 주말 색', ['calhol', 'caldow', 'holfail'], function (r) { return r.prod === 'calendar'; }],
    ['생일 · 기념일', ['calbirth', 'calbirth2'], function (r) { return r.prod === 'calendar'; }],
    ['날짜 빠짐 · 중복 · 순서', ['caldup', 'calmdup', 'calmiss', 'calextra', 'calorder', 'calodd', 'calnoym', 'calnone'], function (r) { return r.prod === 'calendar'; }]
  ]],
  ['직접 확인', [
    ['사양서와 후가공(박·형압·에폭시) 판 대조', [], PDFONLY, 1],
    ['내지 순서 · 앞뒤 면', [], isBook, 1],
    ['인쇄 감리용 출력 색 확인', [], PRINTISH, 1]
  ]]
];
var STN = { info: '참고', ok: '통과', err: '경고', warn: '주의', na: '해당 없음', man: '직접 확인', wait: '검수 전', chk: '확인함' };
var STI = { info: 'i', ok: '✓', err: '!', warn: '?', na: '–', man: '○', wait: '·', chk: '✓' };
function evalItem(r, it) {
  var key = it[0];
  if (!r) return { st: it[3] ? 'man' : 'wait', L: [] };
  if (it[2] && !it[2](r)) return { st: 'na', L: [] };
  if (it[3]) return { st: r.checked && r.checked[key] ? 'chk' : 'man', L: [] };
  var L = (r.issues || []).filter(function (x) { return !x.hidden && it[1].indexOf(x.code) >= 0; });
  var bad = L.filter(function (x) { return x.sev !== 'info' || !/ok$/.test(x.code); });
  var st = bad.some(function (x) { return x.sev === 'err'; }) ? 'err' : bad.some(function (x) { return x.sev === 'warn' || x.sev === 'adv'; }) ? 'warn' : bad.length ? 'info' : 'ok';
  if (st === 'warn' && r.checked && r.checked[key]) st = 'chk';
  return { st: st, L: bad };
}
// ── 문제 부분 캡처 (페이지 미리보기에서 잘라 빨간 상자 표시) ──
var IMGC = {};
function loadImg(u) { return IMGC[u] || (IMGC[u] = new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = u; })); }
function boxesOf(x) { return (x.boxes || []).map(function (b) { return b && b.b ? b.b : b; }).filter(function (b) { return Array.isArray(b) && b.length === 4 && b.every(isFinite); }).slice(0, 30); }
async function crop(r, x) {
  if (x._crop !== undefined) return x._crop;
  var P = r.pages[x.page]; if (!P || !P.thumb) return (x._crop = null);
  var im = await loadImg(P.thumb); if (!im) return (x._crop = null);
  var W = im.naturalWidth, H = im.naturalHeight, k = W / P.cw, bs = boxesOf(x).map(function (b) { return RV.toPx(P, b).map(function (v) { return v * k; }); }), u = null;
  bs.forEach(function (q) { u = u ? [Math.min(u[0], q[0]), Math.min(u[1], q[1]), Math.max(u[2], q[2]), Math.max(u[3], q[3])] : q.slice(); });
  var rx;
  if (u && (u[2] - u[0]) * (u[3] - u[1]) < W * H * 0.6) {
    var cx = (u[0] + u[2]) / 2, cy = (u[1] + u[3]) / 2, w = Math.max(220, (u[2] - u[0]) * 1.8), hh = Math.max(160, (u[3] - u[1]) * 1.8);
    w = Math.min(W, Math.max(w, hh * 1.2)); hh = Math.min(H, Math.max(hh, w * 0.6));
    var x0 = Math.min(Math.max(0, cx - w / 2), W - w), y0 = Math.min(Math.max(0, cy - hh / 2), H - hh); rx = [x0, y0, x0 + w, y0 + hh];
  } else rx = [0, 0, W, H];
  var ow = Math.min(520, Math.round(rx[2] - rx[0]) * 2), sc = ow / (rx[2] - rx[0]), oh = Math.round((rx[3] - rx[1]) * sc);
  var cv = document.createElement('canvas'); cv.width = ow; cv.height = oh; var c = cv.getContext('2d');
  c.drawImage(im, rx[0], rx[1], rx[2] - rx[0], rx[3] - rx[1], 0, 0, ow, oh);
  c.strokeStyle = x.sev === 'err' ? '#ef4444' : '#f59e0b'; c.lineWidth = 3;
  bs.forEach(function (q) { c.strokeRect((q[0] - rx[0]) * sc - 3, (q[1] - rx[1]) * sc - 3, (q[2] - q[0]) * sc + 6, (q[3] - q[1]) * sc + 6); });
  return (x._crop = cv.toDataURL('image/jpeg', 0.85));
}
function firstPerPage(L, n) { var seen = {}, out = []; L.forEach(function (x) { if (x.page != null && !seen[x.page] && out.length < n) { seen[x.page] = 1; out.push(x); } }); return out; }
function capLabel(r, x) { return (r.prodName ? r.prodName + ' · ' : '') + RV.pl(r, x.page); }
async function fillCrops(r, el) {
  var ids = el.dataset.ids.split(',').map(Number);
  for (var i = 0; i < ids.length; i++) {
    var x = r.issues.find(function (y) { return y.id === ids[i]; }); if (!x) continue;
    var u = await crop(r, x), fg = el.querySelector('[data-iss="' + x.id + '"]'); if (fg && u) fg.querySelector('img').src = u;
  }
}

function drawChecklist(r) {
  var h = '<div class="row" style="justify-content:space-between"><h3 class="sh" style="margin:0">검사 항목' + (r ? ' · ' + esc(r.file) : '') + '</h3>' + (r && !r.fatal ? '<button class="ib" id="ckPrint">이 파일 결과지</button>' : '') + '</div>';
  h += '<div class="note" style="margin-bottom:6px">' + (r ? '항목을 열면 어느 페이지인지 보여요. “주의” 항목은 직접 보고 눌러서 <b>확인함</b>으로 바꿀 수 있어요.' : '파일을 넣고 검수를 시작하면 항목마다 통과 · 조언 · 주의 · 경고가 표시돼요.') + '</div>';
  CHECK.forEach(function (cat, ci) {
    var E = cat[1].map(function (it) { return evalItem(r, it); }), n = { err: 0, warn: 0, ok: 0, na: 0 };
    E.forEach(function (e) { if (e.st === 'err') n.err++; else if (e.st === 'warn' || e.st === 'man') n.warn++; else if (e.st === 'ok' || e.st === 'chk' || e.st === 'info') n.ok++; else if (e.st === 'na') n.na++; });
    var all = r && n.na === E.length;
    h += '<details class="ck"' + (r && n.err ? ' open' : '') + '><summary>' + cat[0] + '<span class="bd">' + (!r ? '<i class="n">' + E.length + '개 항목</i>' : all ? '<i class="n">해당 없음</i>' : (n.err ? '<i class="e">경고 ' + n.err + '</i>' : '') + (n.warn ? '<i class="w">주의 ' + n.warn + '</i>' : '') + (n.ok ? '<i class="o">통과 ' + n.ok + '</i>' : '')) + '</span></summary>';
    cat[1].forEach(function (it, ii) {
      var e = E[ii], pages = [];
      e.L.forEach(function (x) { if (x.page != null && pages.indexOf(x.page) < 0) pages.push(x.page); });
      var titles = []; e.L.forEach(function (x) { if (titles.indexOf(x.title) < 0) titles.push(x.title); });
      var canChk = r && (e.st === 'warn' || e.st === 'man' || e.st === 'chk');
      h += '<div class="ci ' + e.st + '"><span class="st ' + e.st + '"' + (canChk ? ' data-ck="' + ci + ':' + ii + '" style="cursor:pointer" title="눌러서 확인함 표시"' : '') + '>' + STI[e.st] + '</span><div class="tx">' + esc(it[0]) + ' <span class="mute small">' + STN[e.st] + '</span>' +
        (titles.length ? '<small>' + titles.slice(0, 3).map(esc).join(' · ') + (titles.length > 3 ? ' 외 ' + (titles.length - 3) : '') + '</small>' : '') +
        (pages.length ? '<div class="crops" data-ids="' + firstPerPage(e.L, 8).map(function (x) { return x.id; }).join(',') + '">' + firstPerPage(e.L, 8).map(function (x) { return '<figure data-pg="' + x.page + '" data-iss="' + x.id + '"><img alt=""><figcaption>' + esc(capLabel(r, x)) + '</figcaption></figure>'; }).join('') + '</div>' : '') +
        (pages.length > 8 ? '<div class="pgs">' + pages.slice(0, 40).map(function (p) { var x = e.L.find(function (y) { return y.page === p; }); return '<button data-pg="' + p + '" data-iss="' + x.id + '">' + esc(RV.pl(r, p)) + '</button>'; }).join('') + (pages.length > 40 ? ' …' : '') + '</div>' : '') + '</div></div>';
    });
    h += '</details>';
  });
  $('#chk').innerHTML = h;
  if (!r) return;
  $$('#chk details').forEach(function (d) { var go = function () { $$('.crops', d).forEach(function (c) { if (!c.dataset.done) { c.dataset.done = 1; fillCrops(r, c); } }); }; if (d.open) go(); d.addEventListener('toggle', function () { if (d.open) go(); }); });
  $$('#chk .crops figure').forEach(function (b) { b.onclick = function () { var x = r.issues.find(function (y) { return y.id === +b.dataset.iss; }); RV.view(r, +b.dataset.pg, x); }; });
  $$('#chk .pgs button').forEach(function (b) { b.onclick = function () { var x = r.issues.find(function (y) { return y.id === +b.dataset.iss; }); RV.view(r, +b.dataset.pg, x); }; });
  $$('#chk [data-ck]').forEach(function (s) { s.onclick = function () { var p = s.dataset.ck.split(':'), k = CHECK[+p[0]][1][+p[1]][0]; r.checked[k] = !r.checked[k]; var op = $$('#chk details').map(function (d) { return d.open; }); drawChecklist(r); $$('#chk details').forEach(function (d, i) { d.open = op[i]; }); }; });
  var pb = $('#ckPrint'); if (pb) pb.onclick = function () { printSheet([r]); };
}

// ── 결과지 (2026-11-19 새 양식: 요약 → 상세 → 확인 후 통과 → 검사 항목 · 웹 체크 + PDF 저장) ──
var LV = { err: 'r', warn: 'a', adv: 'o' }, LVN = { r: ['경고', '수정함'], a: ['주의', '확인함'], o: ['조언', '확인'] };
var TITLE_FIX = { smallk: 'K100 글자 오버프린트 꺼짐', kop: 'K100 선 오버프린트 꺼짐', thin4c: '4색 얇은 선', small4c: '작은 글자 4색', nocopy: '리걸 문구 없음', copyok: '리걸 문구', copyyear: '리걸 연도 다름', tiny: '작은 글자' };
var ENDS = [[/꺼져 있어요/g, '꺼짐'], [/켜져 있어요/g, '켜짐'], [/남아 있어요/g, '남음'], [/섞여 있어요/g, '섞임'], [/찾지 못했어요/g, '없음'], [/못 ?했어요/g, '못 함'], [/읽히지 않아요/g, '안 읽힘'], [/있어요/g, '있음'], [/없어요/g, '없음'], [/달라요/g, '다름'], [/커요/g, '큼'], [/작아요/g, '작음'], [/어두워요/g, '어두움'], [/밝아요/g, '밝음'], [/나가요/g, '나감'], [/걸려요/g, '걸림'], [/끊겨요/g, '끊김'], [/맞아요/g, '맞음'], [/이상해요/g, '이상'], [/가리켜요/g, '가리킴'], [/넘어요/g, '넘음'], [/바뀌어요/g, '바뀜'], [/나와요/g, '나옴'], [/들어갔어요/g, '들어감'], [/쓰였어요/g, '쓰임'], [/아니에요/g, '아님'], [/보여요/g, '보임'], [/틀려요/g, '틀림'], [/실패했어요/g, '실패'], [/검사했어요/g, '검사'], [/여야 해요/g, '여야 함'], [/생겨요/g, '생김'], [/사라져요/g, '사라짐'], [/빠져요/g, '빠짐'], [/돼요/g, '됨'], [/권장해요/g, '권장'], [/어려워요/g, '어려움'], [/괜찮아요/g, '괜찮음'], [/해요/g, '함'], [/(이)?에요/g, ''], [/예요/g, ''], [/수 있음/g, '수 있음']];
var WORDS = [[/판권\s*·\s*저작권/g, '리걸'], [/판권/g, '리걸'], [/(\d+)\s*쪽/g, '$1p'], [/쪽수/g, '페이지 수'], [/작업지시서/g, '사양서'], [/4도\s*혼합/g, '4색'], [/중복\s*인쇄/g, '오버프린트']];
function words(s) { s = strip(s); WORDS.forEach(function (w) { s = s.replace(w[0], w[1]); }); return s; }
function tStmt(s) { s = words(s); ENDS.forEach(function (w) { s = s.replace(w[0], w[1]); }); return s.replace(/\s*\.\s*$/, '').replace(/\.\s+/g, ' · ').trim(); }
var VERB = { '꿔': '꾸기', '워': '우기', '겨': '기기', '려': '리기', '춰': '추기', '여': '이기', '켜': '키기', '써': '쓰기', '봐': '보기', '줘': '주기', '와': '오기', '빼': '빼기', '내': '내기', '꺼': '끄기', '쳐': '치기', '어': '기', '아': '기' };
function tFix(s) {
  s = words(s); if (!s.trim()) return [];
  return s.split(/(?<=[.)])\s+(?=\S)/).map(function (x) {
    x = x.trim().replace(/\.$/, '');
    var m = x.match(/^(.*?)(\S+?)\s*(주세요|보세요)$/);
    if (m) { var st = m[2], l = st.slice(-1), v; if (l === '해') v = st.length > 1 ? st.slice(0, -1) : '하기'; else if (VERB[l]) v = l === '어' || l === '아' ? st.slice(0, -1) + '기' : st.slice(0, -1) + VERB[l]; else v = st; x = m[1] + v; }
    ENDS.forEach(function (w) { x = x.replace(w[0], w[1]); });
    return x.trim();
  }).filter(Boolean);
}
function pgList(r, L) {
  var P = []; L.forEach(function (x) { (x.pages ? x.pages.map(function (p) { return p - 1; }) : x.page != null ? [x.page] : []).forEach(function (p) { if (P.indexOf(p) < 0) P.push(p); }); });
  if (!P.length) return '파일 전체';
  P.sort(function (a, b) { return a - b; });
  var nm = function (p) { return r.isImg ? RV.pl(r, p) : String(p + 1); };
  var s = P.slice(0, 40).map(nm).join(', ') + (P.length > 40 ? ' …' : '') + (r.isImg ? '' : 'p');
  return P.length > 8 ? P.length + '개 p · ' + s : s;
}
var BOXRE = /박스|아웃\s*박스|outbox|box|패키지|package/i, SETRE = /포토\s*카드|포카|엽서|증명\s*사진|폴라로이드|polaroid|photo\s*card|post\s*card|id\s*photo/i;
function allText(r) { return (r.pages || []).map(function (P) { return (P.tc || []).map(function (t) { return t.s; }).join(' '); }).join(' '); }
function extraIssues(r) { // 결과지 전용 리마인드 (품목 성격에 따라)
  if (r._extra) return; r._extra = true;
  var nm = (r.prodName || '') + ' ' + r.file, id = 900000 + Math.floor(Math.random() * 90000), add = function (o) { o.id = id++; o.page = null; o.boxes = []; o.cat = 'extra'; r.issues.push(o); };
  if (BOXRE.test(nm)) {
    if (!/\bFSC\b|SOY|소이\s*잉크/i.test(allText(r))) add({ sev: 'adv', code: 'boxfsc', title: 'FSC · 소이잉크 표기 없음', detail: 'FSC 로고 · 소이잉크 마크 찾지 못함 (글자 기준)', fix: '필수 아님. 사용 지류 · 잉크가 해당되면 표기 추가' });
    add({ sev: 'adv', code: 'boxsticker', title: '증지 부착 위치 가이드 확인', detail: '소속사마다 점선 요청 여부 다름', fix: '소속사 요청 여부 리마인드. 넣는 소속사면 점선 추가' });
    add({ sev: 'adv', code: 'boxsize', title: '증지 부착 크기 리마인드', detail: '증지 크기는 소속사마다 다름', fix: '소속사 증지 크기 확인. 부착 자리 크기 맞는지 확인' });
  }
  var ai = aiFor(r.artist), solo = ai && ai.members.length === 1;
  if (SETRE.test(nm) && !solo) add({ sev: 'adv', code: 'memorder', title: '멤버 배치 순서 확인', detail: '멤버별로 이어지는 구성', fix: '정합 순서대로 멤버 배치됐는지 확인' });
}
var SHEET_CHECK_EXTRA = [['아웃박스', [['FSC · 소이잉크 표기', ['boxfsc']], ['증지 위치 가이드', ['boxsticker']], ['증지 크기', ['boxsize']]], function (r) { return BOXRE.test((r.prodName || '') + ' ' + r.file); }],
  ['멤버 · 구성', [['멤버 배치 순서 (정합 순서)', ['memorder']]], function (r) { return SETRE.test((r.prodName || '') + ' ' + r.file); }]];
function groupsOf(r) {
  var G = {}, order = [];
  r.issues.forEach(function (x) { if (x.hidden || !LV[x.sev]) return; var k = x.code + '|' + x.title; if (!G[k]) { G[k] = []; order.push(k); } G[k].push(x); });
  var lv = { r: 0, a: 1, o: 2 };
  return order.map(function (k) { return { k: k, L: G[k], x: G[k][0], lv: LV[G[k][0].sev] }; }).sort(function (a, b) { return lv[a.lv] - lv[b.lv]; });
}
function specMeta(r) {
  var o = SPEC.items.find(function (x) { return x.raw === r.spec; }), f = r.isImg ? '이미지 ' + r.n + '개' : 'PDF ' + (r.bookPages || r.n) + 'p';
  var P0 = r.pages && r.pages[0]; if (P0 && P0.trim && !r.isImg) { var w = Math.round((P0.trim[2] - P0.trim[0]) / (72 / 25.4)), h = Math.round((P0.trim[3] - P0.trim[1]) / (72 / 25.4)); f += ' · ' + w + '×' + h + 'mm'; }
  var sp = o ? [o.size || (o.w ? o.w + '×' + o.h + 'mm' : ''), o.pages ? o.pages + 'p' : '', o.paperTxt || o.paper || '', o.coat ? (o.coat === 'matte' ? '무광 코팅' : '유광 코팅') : '', o.bindTxt || '', o.fin || ''].filter(function (s) { return s && String(s).trim() && !/^[-–—x×]$/i.test(String(s).trim()); }) : [];
  var sp2 = function (a) { return a.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join(''); };
  return '<div class="mr"><b>파일</b><span>' + esc(f) + '</span></div>' + (sp.length ? '<div class="mr"><b>사양</b>' + sp2(sp) + '</div>' : '');
}
function sheetFile(r, no, tot, pid) {
  extraIssues(r);
  var GS = groupsOf(r), n = { r: 0, a: 0, o: 0 }, num = {};
  GS.forEach(function (g, i) { g.n = i + 1; n[g.lv]++; g.L.forEach(function (x) { num[x.code] = num[x.code] || []; if (num[x.code].indexOf(g.n) < 0) num[x.code].push(g.n); }); });
  var stats = '<span class="r"><b>' + n.r + '</b>경고</span><span class="a"><b>' + n.a + '</b>주의</span>' + (n.o ? '<span class="o"><b>' + n.o + '</b>조언</span>' : '');
  var h = '<section class="sheet" id="p' + no + '"><header class="mast"><span class="brand">PLYSH · 프리플라이트</span><span>' + esc([r.artist, r.title].filter(Boolean).join(' ')) + '</span></header>' +
    '<div class="fhead"><div><p class="fno">품목 ' + no + ' / ' + tot + '</p><h2>' + esc(r.prodName || r.file) + '</h2><p class="file">' + esc(r.file) + '</p></div><div class="stat">' + stats + '</div></div><div class="meta2">' + specMeta(r) + '</div>';
  if (GS.length) {
    h += '<h3 class="sec">요약 <small>번호 누르면 상세로 이동 · 체크하면 완료 표시</small><span class="prog" data-p="' + pid + '"></span></h3><div class="tw"><table class="sum">' + GS.map(function (g) {
      var a = '#' + pid + '-' + g.n; return '<tr class="k' + g.lv + '"><td><input type="checkbox" data-k="' + pid + '-' + g.n + '" aria-label="' + LVN[g.lv][1] + '"></td><td class="n"><a href="' + a + '">' + g.n + '</a></td><td><span class="tg ' + g.lv + '">' + LVN[g.lv][0] + '</span></td><td><a href="' + a + '"><b>' + esc(TITLE_FIX[g.x.code] || tStmt(g.x.title)) + '</b></a></td><td class="wh">' + esc(pgList(r, g.L)) + '</td></tr>';
    }).join('') + '</table></div>';
    h += '<h3 class="sec">상세</h3><div class="fixes">' + GS.map(function (g) {
      var x = g.x, fx = tFix(x.fix), cr = firstPerPage(g.L, 4).filter(function (y) { return y._crop; });
      return '<article class="fix k' + g.lv + '" id="' + pid + '-' + g.n + '"><div class="no ' + g.lv + '">' + g.n + '</div><div class="fx"><div class="fh"><span class="tg ' + g.lv + '">' + LVN[g.lv][0] + '</span><h4>' + esc(TITLE_FIX[x.code] || tStmt(x.title)) + '</h4><label class="ck"><input type="checkbox" data-k="' + pid + '-' + g.n + '">' + LVN[g.lv][1] + '</label></div><dl><dt>위치</dt><dd>' + esc(pgList(r, g.L)) + '</dd><dt>문제</dt><dd>' + esc(tStmt(x.detail) || '—') + '</dd>' + (fx.length ? '<dt>해결</dt><dd class="how"><ul>' + fx.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></dd>' : '') + '</dl>' +
        (cr.length ? '<div class="shots">' + cr.map(function (y) { return '<figure><img src="' + y._crop + '" alt=""><figcaption>' + esc(capLabel(r, y)) + '</figcaption></figure>'; }).join('') + '</div>' : '') + '</div></article>';
    }).join('') + '</div>';
  } else h += '<p class="allok">경고 · 주의 · 조언 없음</p>';
  var oks = r.issues.filter(function (x) { return !x.hidden && x.sev === 'info' && /ok$/.test(x.code); });
  if (oks.length) h += '<h3 class="sec g">확인 후 통과 <small>근거</small></h3><ul class="oks">' + oks.map(function (x) { return '<li><b>' + esc(TITLE_FIX[x.code] || tStmt(x.title)) + '</b><span>' + esc(pgList(r, [x])) + '</span><span>' + esc(tStmt(x.detail)) + '</span></li>'; }).join('') + '</ul>';
  var bcs = r.issues.filter(function (x) { return !x.hidden && (x.code === 'bcok' || x.code === 'bcfail'); });
  if (bcs.length || BOXRE.test((r.prodName || '') + ' ' + r.file)) {
    h += '<h3 class="sec">바코드 인식 결과 <small>파일에서 실제 스캔</small></h3><div class="tw"><table class="bc">' + (bcs.length ? bcs.map(function (x) {
      var b = x.bc; return '<tr><th>' + esc(pgList(r, [x])) + '</th><td>' + (b ? esc(b.fmt.replace(/_/g, '-') + ' · ' + b.text + ' · ' + b.w.toFixed(1) + '×' + b.h.toFixed(1) + 'mm' + (b.chk === null ? '' : b.chk ? ' · 체크 숫자 맞음' : ' · 체크 숫자 틀림')) : '<span class="pend">' + esc(tStmt(x.title) + ' · ' + tStmt(x.detail)) + '</span>') + '</td></tr>';
    }).join('') : '<tr><th>결과</th><td class="pend">바코드를 찾지 못함</td></tr>') + '</table></div>';
  }
  // 검사 항목
  var cats = CHECK.filter(function (c) { return c[0] !== '직접 확인'; }).map(function (c) { return [c[0], c[1]]; });
  SHEET_CHECK_EXTRA.forEach(function (c) { if (c[2](r)) cats.push([c[0], c[1]]); });
  h += '<h3 class="sec">' + esc(r.prodName || '') + ' 검사 항목 <small>굵게 = 문제 · 동그라미 = 상세 번호</small></h3><div class="cl">';
  cats.forEach(function (cat) {
    var rows = [], bad = 0;
    cat[1].forEach(function (it) {
      var e = evalItem(r, it); if (e.st === 'na' || e.st === 'man') return;
      var refs = []; it[1].forEach(function (c) { (num[c] || []).forEach(function (k) { if (refs.indexOf(k) < 0) refs.push(k); }); }); refs.sort(function (a, b) { return a - b; });
      var lv = ''; e.L.forEach(function (x) { var l = LV[x.sev]; if (l && (!lv || 'rao'.indexOf(l) < 'rao'.indexOf(lv))) lv = l; });
      var st = refs.length ? lv : e.st === 'info' ? 'i' : 'ok'; if (st !== 'ok' && st !== 'i') bad++;
      var em = refs.length ? '<em>' + refs.map(function (k) { var g = GS[k - 1]; return '<a class="rf ' + g.lv + '" href="#' + pid + '-' + k + '">' + k + '</a>'; }).join('') + '</em>' : st === 'i' && e.L[0] ? '<em>' + esc(tStmt(e.L[0].title).slice(0, 24)) + '</em>' : '';
      rows.push('<li class="' + st + '"><i></i>' + esc(it[0]) + em + '</li>');
    });
    if (!rows.length) return;
    h += '<div class="cg"><h5>' + esc(cat[0]) + '<span>' + (rows.length - bad) + '/' + rows.length + ' 통과</span></h5><ul>' + rows.join('') + '</ul></div>';
  });
  h += '</div>';
  var man = (CHECK.find(function (c) { return c[0] === '직접 확인'; }) || [0, []])[1].filter(function (it) { return !it[2] || it[2](r); }).map(function (it) { return it[0]; });
  if (!r.isImg && r.prod !== 'web') man.push('FSC 로고 있으면 높이 14mm 이상 · 흑백 대비');
  if (/스티커|sticker/i.test((r.prodName || '') + ' ' + r.file)) man.push('칼선 모서리 부드러움 (각진 꺾임 없음)');
  if (man.length) h += '<div class="manual"><label><input type="checkbox" data-k="' + pid + '-m"> <b>직접 확인</b></label><span>' + esc(man.join(' · ')) + '</span></div>';
  return { html: h + '<footer class="foot"><span>' + esc((r.prodName ? r.prodName + ' · ' : '') + r.file) + '</span><span>' + (+no + 1) + '</span></footer></section>', n: n };
}
function spotTable(Rs) {
  var M = {};
  Rs.forEach(function (r, i) { (r.spotList || []).forEach(function (s) { var k = s.n; (M[k] = M[k] || { n: s.n, fin: s.fin, it: [] }).it.push(String(i + 1).padStart(2, '0') + ' ' + (r.prodName || r.file)); }); });
  var L = Object.keys(M).map(function (k) { return M[k]; }); if (!L.length) return '';
  var kind = function (s) { return !s.fin ? '인쇄 별색' : /cut|칼선|die|톰슨/i.test(s.n) ? '칼선' : /fold|접지|오시|crease/i.test(s.n) ? '접지선' : '후가공 판'; };
  L.sort(function (a, b) { return (a.fin - b.fin) || a.n.localeCompare(b.n); });
  var norm = function (s) { return s.toLowerCase().replace(/[^a-z가-힣]/g, '').replace(/(ed|ing|s)$/, ''); }, dif = [];
  L.forEach(function (a, i) { L.slice(i + 1).forEach(function (b) { if (a.n !== b.n && norm(a.n) === norm(b.n)) dif.push(a.n + ' / ' + b.n); }); });
  var pr = L.filter(function (s) { return !s.fin; });
  return '<h2 class="sec">사용 별색 <small>전체 품목 · 같은 별색이 맞는지 확인</small></h2><div class="tw"><table class="items spot"><tr><th>별색</th><th>구분</th><th>쓰인 품목</th><th>확인</th></tr>' + L.map(function (s, i) {
    return '<tr><td><b>' + esc(s.n) + '</b></td><td>' + kind(s) + '</td><td>' + esc(s.it.join(' · ')) + '</td><td><label class="ck"><input type="checkbox" data-k="spot-' + i + '">확인</label></td></tr>';
  }).join('') + '</table></div><p class="spotnote">' + esc('인쇄 별색 ' + pr.length + '종' + (pr.length ? ' (' + pr.map(function (s) { return s.n; }).join(', ') + ')' : '') + (dif.length ? ' · 판 이름 다름: ' + dif.join(', ') + ' → 인쇄소 전달 시 같은 판인지 확인' : '')) + '</p>';
}
var SHEET_JS = "var KEY=document.body.dataset.key;function ld(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}function sv(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}var S=ld();" +
  "function paint(){document.querySelectorAll('input[data-k]').forEach(function(c){c.checked=!!S[c.dataset.k];var a=c.closest('article,tr');if(a)a.classList.toggle('done',c.checked)});var T=0,D=0;document.querySelectorAll('.prog').forEach(function(p){var ks={};document.querySelectorAll('table.sum input[data-k^=\"'+p.dataset.p+'-\"]').forEach(function(c){ks[c.dataset.k]=1});var n=Object.keys(ks).length,d=Object.keys(ks).filter(function(k){return S[k]}).length;T+=n;D+=d;p.textContent=d+' / '+n+' 완료';p.classList.toggle('all',n>0&&d===n)});var t=document.querySelector('.bar .tot');if(t)t.textContent='전체 '+D+' / '+T+' 완료'}" +
  "document.addEventListener('change',function(ev){var c=ev.target;if(!c.dataset||!c.dataset.k)return;if(c.checked)S[c.dataset.k]=1;else delete S[c.dataset.k];sv(S);paint()});function rvReset(){if(!confirm('체크를 모두 지울까요?'))return;S={};sv(S);paint()}paint();" +
  "document.querySelectorAll('.facts a[data-col]').forEach(function(a){a.addEventListener('click',function(){var t=document.querySelector('table.items:not(.spot)');if(!t)return;t.className='items'+(a.dataset.col?' hl-'+a.dataset.col:'');t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash')})});";
async function printSheet(Rs) {
  Rs = Rs.filter(function (r) { return r && !r.fatal; }); if (!Rs.length) return;
  var w = window.open('', '_blank');
  if (!w) { alert('결과지 창이 막혔어요. 브라우저에서 팝업을 허용해 주세요.'); return; }
  w.document.write('<!doctype html><meta charset="utf-8"><title>프리플라이트 결과지</title><body style="font-family:sans-serif;padding:40px;color:#4e5968">결과지 만드는 중…</body>'); w.document.close();
  for (var ri = 0; ri < Rs.length; ri++) { var rr = Rs[ri]; extraIssues(rr); var GG = groupsOf(rr); for (var gi = 0; gi < GG.length; gi++) { var L0 = firstPerPage(GG[gi].L, 4); for (var li = 0; li < L0.length; li++) await crop(rr, L0[li]); } }
  var d = new Date(), date = d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2) + ' ' + (d.getHours() < 12 ? '오전 ' : '오후 ') + ((d.getHours() + 11) % 12 + 1) + ':' + ('0' + d.getMinutes()).slice(-2);
  var tot = Rs.length, pages = Rs.map(function (r, i) { return sheetFile(r, String(i + 1).padStart(2, '0'), tot, 'f' + (i + 1)); }), T = { r: 0, a: 0, o: 0 };
  pages.forEach(function (p) { T.r += p.n.r; T.a += p.n.a; T.o += p.n.o; });
  var art = Rs.map(function (r) { return r.artist; }).filter(Boolean)[0] || '', ai = aiFor(art), en = ai && ai.info['영문명'] || '', title = Rs[0].title || titleOf();
  var sh = SPEC.sheet, surl = sh ? 'https://docs.google.com/spreadsheets/d/' + sh.id + '/edit' : '';
  var noCopy = Rs.filter(function (r) { return r.issues.some(function (x) { return !x.hidden && x.code === 'nocopy'; }); }).length;
  var cov = '<section class="sheet cover"><header class="mast"><span class="brand">PLYSH · 프리플라이트</span><span>검수 결과지</span></header>' +
    '<div class="title"><h1 class="artist">' + esc(art || '프리플라이트') + (en && en !== art ? ' <span>' + esc(en) + '</span>' : '') + '</h1>' + (title ? '<p class="proj">' + esc(title) + '</p>' : '') + '<p class="lede">검수일 ' + date + '</p></div>' +
    '<div class="facts"><a class="f" href="#items" data-col=""><span>파일</span><b class="big">' + tot + '개</b></a>' + (sh ? '<a class="f" href="' + esc(surl) + '" target="_blank" rel="noopener"><span>사양서 ↗</span><b>' + esc(sh.name) + '</b></a>' : '') +
    '<a class="f fr" href="#items" data-col="r"><span>경고 ↗</span><b class="r">' + T.r + '건</b></a><a class="f fa" href="#items" data-col="a"><span>주의 ↗</span><b class="a">' + T.a + '건</b></a><a class="f fo" href="#items" data-col="o"><span>조언 ↗</span><b class="o">' + T.o + '건</b></a></div>';
  if (noCopy > 1) cov += '<h2 class="sec">모든 파일 공통</h2><ol class="common one"><li><b>리걸 문구 없는 품목 ' + noCopy + '개 · 필요 여부 확인</b><p>Ⓟ&amp;Ⓒ 표기 있으면 통과 처리</p></li></ol>';
  cov += spotTable(Rs);
  cov += '<h2 class="sec">품목별 결과 <small>숫자 = 항목 수 (페이지 수 아님)</small></h2><div class="tw" id="items"><table class="items"><tr><th>번호</th><th>품목</th><th class="r">경고</th><th class="r">주의</th><th class="r">조언</th><th>주요 항목</th></tr>' + Rs.map(function (r, i) {
    var no = String(i + 1).padStart(2, '0'), n = pages[i].n, G = groupsOf(r).slice(0, 2).map(function (g) { return TITLE_FIX[g.x.code] || tStmt(g.x.title); });
    var z = function (v, c) { return '<td class="nm ' + c + (v ? '' : ' z') + '">' + v + '</td>'; };
    return '<tr><td class="ix">' + no + '</td><td><a href="#p' + no + '"><b>' + esc(r.prodName || r.file) + '</b></a><small>' + esc(r.file.replace(/\.[a-z0-9]+$/i, '')) + '</small></td>' + z(n.r, 'r') + z(n.a, 'a') + z(n.o, 'o') + '<td>' + esc(G.join(' · ')) + '</td></tr>';
  }).join('') + '</table></div><footer class="foot"><span>' + esc([art, title].filter(Boolean).join(' ') + ' · 검수 결과') + '</span><span>1</span></footer></section>';
  var key = 'rv-sheet:' + [art, title, Rs.map(function (r) { return r.file; }).join('|')].join('#');
  var base = location.href.replace(/[^\/]*([?#].*)?$/, '');
  var css = ''; try { css = await (await fetch(base + 'sheet.css?v=' + SHEET_V)).text(); } catch (e) {}
  var doc = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>프리플라이트 결과지 · ' + esc([art, title].filter(Boolean).join(' ')) + '</title>' +
    '<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><style>' + css + '</style></head><body data-key="' + esc(key) + '">' +
    '<div class="bar"><b>프리플라이트 결과지</b><span class="tot"></span><button onclick="window.print()">PDF 저장</button><button class="ghost" onclick="rvReset()">체크 초기화</button></div>' +
    cov + pages.map(function (p) { return p.html; }).join('') + '<script>' + SHEET_JS + '<\/script></body></html>';
  w.document.open(); w.document.write(doc); w.document.close();
}
var SHEET_V = '20261119a';
function strip(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\*\*/g, ''); }

// ── 시작 ──
setupFiles(); setupSpec(); setupRules(); $('#ttl').oninput = drawTitle; drawTitle(); scheduleArtists(); loadSpecs(); showSpecSum(); drawQ(); drawChecklist(null);
$('#go').onclick = run;
window.RVB = { printSheet: printSheet, addFiles: addFiles, get Q() { return Q; }, get RS() { return RS; }, SPEC: SPEC, rulesFor: rulesFor };
})();
