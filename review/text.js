/* PLYSH 검수 2단계 (2026-11-18): 글자·표기 규칙·쪽 번호·판권·멤버 사진·바코드·달력
 * app.js 가 window.RVX 로 도구를 넘겨주면 RV2.run(R) 으로 실행. 결과는 R.issues 에 쌓인다. */
(function () {
'use strict';
var X; // app.js 도구 (issue, mm, MM, toPx, overlaps, esc …)
var HANGUL = /[가-힣]/, LATIN = /[A-Za-z]/;
function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
function lev(a, b) {
  if (a === b) return 0; var m = a.length, n = b.length; if (!m) return n; if (!n) return m; if (Math.abs(m - n) > 3) return 9;
  var p = [], q; for (var j = 0; j <= n; j++) p[j] = j;
  for (var i = 1; i <= m; i++) { q = [i]; for (var k = 1; k <= n; k++) q[k] = Math.min(p[k] + 1, q[k - 1] + 1, p[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1)); p = q; }
  return p[n];
}
function cut(s, n) { s = norm(s); n = n || 30; return s.length > n ? s.slice(0, n) + '…' : s; }

// ── 팀 규칙 목록 ──
var RULES_KEY = 'rv:rules';
var RULES_EX = '[멤버]\n효진 / HYOJIN = 효 진, Hyojin\n승준 / SEUNGJUN\n\n[표기]\nONF = Onf, 온앤오프\nWM ENTERTAINMENT = WM Entertainment\nSEASON\'S GREETINGS = Season\'s Greetings, SEASONS GREETINGS\n\n[생일·기념일]\n1/13 효진 생일\n8/2 데뷔 기념일';
function parseRules(t) {
  var sec = '', out = { members: [], terms: [], days: [], info: {} };
  String(t || '').split(/\n/).forEach(function (ln) {
    ln = ln.trim(); if (!ln || ln.charAt(0) === '#') return;
    var m = ln.match(/^\[(.+)\]$/); if (m) { sec = /정보/.test(m[1]) ? 'i' : /멤버/.test(m[1]) ? 'm' : /생일|기념|날짜/.test(m[1]) ? 'd' : 't'; return; }
    if (sec === 'i') { var kv = ln.match(/^([^:：]+)[:：]\s*(.*)$/); if (kv) out.info[kv[1].trim()] = kv[2].trim(); return; }
    if (sec === 'd') { var d = ln.match(/^(\d{1,2})\s*[\/.\-월]\s*(\d{1,2})\s*일?\s*(.*)$/); if (d) out.days.push({ m: +d[1], d: +d[2], label: d[3] || '' }); return; }
    var parts = ln.split('='), forms = parts[0].split('/').map(function (s) { return s.trim(); }).filter(Boolean), wrong = (parts[1] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!forms.length) return;
    (sec === 'm' ? out.members : out.terms).push({ forms: forms, wrong: wrong, name: forms[0] });
  });
  return out;
}
function rulesText() { try { return localStorage.getItem(RULES_KEY) || ''; } catch (e) { return ''; } }
// 팀 규칙은 PLYSH 시트(@4팀_업무보고 › PREFLIGHT 규칙 탭)에 저장해 팀이 같이 써요. 이 기기에는 마지막 내용을 캐시로만 둬요.
var RV_KIND = { m: '멤버', t: '표기', d: '생일·기념일', i: '기본 정보' };
function rulesToRows(t) {
  var sec = 't', rows = [];
  String(t || '').split(/\n/).forEach(function (ln) {
    ln = ln.trim(); if (!ln || ln.charAt(0) === '#') return;
    var m = ln.match(/^\[(.+)\]$/); if (m) { sec = /정보/.test(m[1]) ? 'i' : /멤버/.test(m[1]) ? 'm' : /생일|기념|날짜/.test(m[1]) ? 'd' : 't'; return; }
    if (sec === 'i') { var kv = ln.match(/^([^:：]+)[:：]\s*(.*)$/); if (kv) rows.push([RV_KIND.i, kv[1].trim(), kv[2].trim()]); return; }
    if (sec === 'd') { var d = ln.match(/^(\d{1,2}\s*[\/.\-월]\s*\d{1,2})\s*일?\s*(.*)$/); if (d) rows.push([RV_KIND.d, d[1].replace(/\s+/g, '').replace(/[.\-월]/, '/'), d[2] || '']); return; }
    var i = ln.indexOf('='); rows.push([RV_KIND[sec], (i < 0 ? ln : ln.slice(0, i)).trim(), i < 0 ? '' : ln.slice(i + 1).trim()]);
  });
  return rows;
}
function rowsToRules(rows) {
  var g = { i: [], m: [], t: [], d: [] };
  (rows || []).forEach(function (r) {
    var k = /정보/.test(r[0]) ? 'i' : /멤버/.test(r[0]) ? 'm' : /생일|기념|날짜/.test(r[0]) ? 'd' : 't', a = String(r[1] || '').trim(), b = String(r[2] || '').trim(); if (!a) return;
    g[k].push(k === 'i' ? a + ': ' + b : k === 'd' ? (a + ' ' + b).trim() : b ? a + ' = ' + b : a);
  });
  var out = [];
  [['i', '[기본 정보]'], ['m', '[멤버]'], ['t', '[표기]'], ['d', '[생일·기념일]']].forEach(function (x) { if (g[x[0]].length) out.push(x[1] + '\n' + g[x[0]].join('\n')); });
  return out.join('\n\n');
}
function plyshApi() { // 같은 사이트 안에서 PLYSH 본 화면의 call 을 빌려 씀
  try { var P = window.parent; if (P && P !== window && typeof P.call === 'function' && P.S && P.S.pin) return { call: P.call, pin: P.S.pin, preview: !!P.PLYSH_PREVIEW }; } catch (e) {}
  return null;
}
function setupRulesUI() {
  var box = document.getElementById('rulesBox'); if (!box) return;
  var ta = document.getElementById('rulesTa'), st = document.getElementById('rulesSt'); ta.value = rulesText(); ta.placeholder = RULES_EX;
  var api = plyshApi(), timer = null, saving = false, dirty = false, lastSaved = ta.value;
  function say(t, bad) { if (st) { st.textContent = t; st.style.color = bad ? 'var(--warn, #c2410c)' : ''; } }
  function cache(v) { try { localStorage.setItem(RULES_KEY, v); } catch (e) {} }
  function hm() { var d = new Date(); return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); }
  function cnt() { var r = parseRules(ta.value); document.getElementById('rulesCnt').textContent = '멤버 ' + r.members.length + ' · 표기 ' + r.terms.length + ' · 날짜 ' + r.days.length; }
  function noApi(e) { return /알 수 없는 요청/.test(String(e && e.message || e)); }
  function save() {
    if (!api || saving) return; if (ta.value === lastSaved) { dirty = false; return; }
    saving = true; dirty = false; var v = ta.value; say('팀 시트에 저장 중…');
    api.call('appRvRulesSet', api.pin, rulesToRows(v)).then(function () {
      saving = false; lastSaved = v; say(api.preview ? '미리보기라 실제 시트 대신 임시로 저장했어요 · ' + hm() : '팀 시트에 저장했어요 · ' + hm());
      if (dirty || ta.value !== v) { clearTimeout(timer); timer = setTimeout(save, 600); }
    }, function (e) {
      saving = false; say(noApi(e) ? '시트 쪽 스크립트 업데이트 전이라 이 기기에만 저장했어요' : '시트에 저장하지 못했어요 (' + (e && e.message || e) + ') · 이 기기에는 저장됨', true);
    });
  }
  ta.oninput = function () { cache(ta.value); cnt(); dirty = true; if (api) { say('입력 중…'); clearTimeout(timer); timer = setTimeout(save, 1500); } };
  ta.onblur = function () { if (api && ta.value !== lastSaved) { clearTimeout(timer); save(); } };
  document.getElementById('rulesEx').onclick = function () { ta.value = ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n\n' + RULES_EX : RULES_EX; ta.oninput(); };
  cnt();
  if (!api) { say('PLYSH 밖에서 열어서 이 기기에만 저장돼요'); return; }
  say('팀 시트에서 불러오는 중…');
  api.call('appRvRules', api.pin).then(function (o) {
    var v = rowsToRules(o && o.rows);
    if (!(o && o.rows && o.rows.length) && ta.value.trim()) { lastSaved = ''; say('팀 시트가 비어 있어서 이 기기 내용을 올릴게요'); save(); return; }
    if (dirty) { save(); return; } // 불러오는 사이 고쳤으면 고친 걸 우선
    ta.value = v; lastSaved = v; cache(v); cnt();
    say((api.preview ? '미리보기 임시 저장소' : '팀 시트') + '에서 불러왔어요' + (o.at ? ' · 마지막 수정 ' + o.at : ''));
  }, function (e) { say(noApi(e) ? '시트 쪽 스크립트 업데이트 전이라 이 기기에만 저장돼요' : '팀 시트를 불러오지 못했어요 · 이 기기 내용으로 검수해요', true); });
}

// ── 줄 만들기 (pdf.js 글자 조각 → 같은 기준선끼리) ──
function lines(P) {
  if (P._lines) return P._lines;
  var it = (P.tc || []).filter(function (t) { return !t.rot && t.s; }).slice().sort(function (a, b) { return b.y - a.y || a.x - b.x; }), L = [];
  it.forEach(function (t) {
    var ln = null;
    for (var i = L.length - 1; i >= 0 && i >= L.length - 6; i--) { var l = L[i]; if (Math.abs(l.y - t.y) < Math.max(1, Math.min(l.z, t.z) * 0.35)) { ln = l; break; } }
    if (!ln) { ln = { y: t.y, z: t.z, items: [] }; L.push(ln); }
    ln.items.push(t);
  });
  L.forEach(function (l) {
    l.items.sort(function (a, b) { return a.x - b.x; });
    // 단(column) 나누기: 큰 간격이면 끊기
    var segs = [[]]; l.items.forEach(function (t, i) { var pv = l.items[i - 1]; if (pv && t.x - (pv.x + pv.w) > Math.max(pv.z, t.z) * 2.2) segs.push([]); segs[segs.length - 1].push(t); });
    l.segs = segs.map(function (s) {
      var txt = '', prev = null;
      s.forEach(function (t) { if (prev) { var gap = t.x - (prev.x + prev.w); if (gap > Math.min(prev.z, t.z) * 0.18 && !/\s$/.test(txt) && !/^\s/.test(t.s)) txt += ' '; } txt += t.s; prev = t; });
      var b = [Math.min.apply(null, s.map(function (t) { return t.b[0]; })), Math.min.apply(null, s.map(function (t) { return t.b[1]; })), Math.max.apply(null, s.map(function (t) { return t.b[2]; })), Math.max.apply(null, s.map(function (t) { return t.b[3]; }))];
      return { t: txt, items: s, b: b, z: Math.max.apply(null, s.map(function (t) { return t.z; })) };
    });
  });
  P._lines = L; return L;
}
function segsOf(P) { var r = []; lines(P).forEach(function (l) { l.segs.forEach(function (s) { r.push(s); }); }); return r; }
// 문자열 안 위치 → 대략 상자
function subBox(seg, idx, len) {
  var acc = 0, b = null;
  for (var i = 0; i < seg.items.length; i++) {
    var t = seg.items[i], s = acc, e = acc + t.s.length + 1;
    if (idx < e && idx + len > s) { var cw = t.w / Math.max(1, t.s.length), x0 = t.x + Math.max(0, idx - s) * cw, x1 = t.x + Math.min(t.s.length, idx + len - s) * cw; var bb = [x0, t.b[1], Math.max(x1, x0 + cw), t.b[3]]; b = b ? [Math.min(b[0], bb[0]), Math.min(b[1], bb[1]), Math.max(b[2], bb[2]), Math.max(b[3], bb[3])] : bb; }
    acc = e;
  }
  return b || seg.b;
}

// ── 글자 검사 ──
var TYPO_KO = [[/되요/g, '돼요'], [/됬/g, '됐'], [/몇일/g, '며칠'], [/어의없/g, '어이없'], [/왠만/g, '웬만'], [/할께/g, '할게'], [/금새/g, '금세'], [/역활/g, '역할'], [/일일히/g, '일일이'], [/깨끗히/g, '깨끗이'], [/오랫만/g, '오랜만'], [/희안/g, '희한'], [/어떻해/g, '어떡해'], [/않되/g, '안 되'], [/안되요/g, '안 돼요'], [/설겆이/g, '설거지'], [/가르키/g, '가리키'], [/바램/g, '바람'], [/뵈요/g, '봬요'], [/웬지/g, '왠지'], [/곰곰히/g, '곰곰이'], [/틈틈히/g, '틈틈이'], [/생각컨대/g, '생각건대'], [/내노라/g, '내로라'], [/어짜피/g, '어차피'], [/돌맹이/g, '돌멩이'], [/구지/g, '굳이'], [/있슴/g, '있음'], [/없슴/g, '없음'], [/했슴/g, '했음']];
var DICT = ('JANUARY FEBRUARY MARCH APRIL MAY JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER DECEMBER SUNDAY MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY ' +
  'CALENDAR PHOTOBOOK PHOTOCARD POSTCARD POSTER STICKER DIARY ALBUM OFFICIAL ENTERTAINMENT MANUFACTURED DISTRIBUTED WARNING RESERVED RIGHTS UNAUTHORIZED DUPLICATION PROHIBITED COPYING KOREA COPYRIGHT ' +
  'SEASON SEASONS GREETINGS GREETING HAPPY BIRTHDAY ANNIVERSARY CHRISTMAS SPECIAL EDITION LIMITED MEMBER MEMBERS CONCERT TOUR WORLD FANMEETING FANCLUB GOODS MERCHANDISE PACKAGE ' +
  'BEHIND SCENES MAKING STORY MEMORIES MOMENT MOMENTS SUMMER WINTER SPRING AUTUMN FALL HOLIDAY WEEKEND WEEKLY MONTHLY SCHEDULE PLANNER NOTE NOTES PHOTO PHOTOS PICTURE IMAGE COVER CONTENTS INDEX ' +
  'THANK THANKS LOVE FOREVER TOGETHER FRIENDS FAMILY DREAM DREAMS SPECIAL ORIGINAL VERSION PREMIUM COLLECTION SERIES VOLUME CHAPTER EPISODE MARKET FESTIVAL').split(' ');
var DICTS = {}; DICT.forEach(function (w) { DICTS[w] = 1; });
var ODD = [[/[！-～]/, '전각(넓은) 영문·기호'], [/[Ѐ-ӿ]/, '키릴 문자(러시아 글자)'], [/[Ͱ-Ͽ]/, '그리스 문자'], [/[​-‍⁠﻿]/, '보이지 않는 글자(폭 없는 공백)'], [/[-]/, '서체 전용 글자(PUA)'], [/\ufffd/, '깨진 글자(\ufffd)'], [/[ㄱ-ㆎ](?=[가-힣])|[가-힣][ㄱ-ㆎ]/, '낱자모(ㄱ,ㅏ 등)가 글자 사이에']];

function textChecks(R, rules) {
  var all = [], issue = X.issue;
  R.pages.forEach(function (P) { segsOf(P).forEach(function (s) { s.P = P; all.push(s); }); });
  R.textCount = all.reduce(function (a, s) { return a + s.t.length; }, 0);
  if (!all.length) { issue({ page: null, sev: 'info', cat: 'text', code: 'notext', title: '글자 정보가 없어 글자 검사를 못 했어요', detail: R.kind === 'aiF' ? '아웃라인 된 최종 파일이에요.' : '글자가 모두 아웃라인 됐거나 이미지예요.', fix: '아웃라인 전 파일(.ai) 또는 인디자인 PDF로 다시 돌려 주세요.', boxes: [] }); return; }
  var pua = all.filter(function (s) { return /[-]/.test(s.t); }).length;
  if (pua > all.length * 0.3) issue({ page: null, sev: 'info', cat: 'text', code: 'nouni', title: '글자 코드가 없는 서체가 많아 글자 검사가 부정확할 수 있어요', detail: '', fix: '', boxes: [], sus: true });
  function perPage(code, sev, title, fix, hits, detailFn, sus) {
    var byP = {}; hits.forEach(function (h) { (byP[h.P.i] = byP[h.P.i] || []).push(h); });
    Object.keys(byP).forEach(function (pi) { var L = byP[pi]; issue({ page: +pi, sev: sev, cat: 'text', code: code, title: title, detail: detailFn(L), fix: fix, boxes: L.map(function (h) { return h.b; }).slice(0, 40), sus: sus }); });
  }
  // 1) 이중 띄어쓰기
  var dbl = []; all.forEach(function (s) { var re = / {2,}|　/g, m; while ((m = re.exec(s.t))) { if (m.index === 0 || m.index + m[0].length >= s.t.length) continue; dbl.push({ P: s.P, b: subBox(s, Math.max(0, m.index - 2), m[0].length + 4), s: s.t.slice(Math.max(0, m.index - 8), m.index + m[0].length + 8) }); } });
  perPage('dblspace', 'warn', '띄어쓰기가 두 번 들어갔어요', '한 칸으로 줄여 주세요. (인디자인 찾기/바꾸기: 공백 두 개 → 한 개)', dbl, function (L) { return L.length + '곳 · ' + L.slice(0, 3).map(function (h) { return '“' + h.s.replace(/ {2,}/g, '␣␣') + '”'; }).join(', '); });
  // 2) 따옴표·프라임·문장부호 혼용 (문서 전체에서 다수와 다른 것)
  var groups = [
    { n: '작은따옴표', k: [['직선 \'', /'/g], ['둥근 ‘ ’', /[‘’]/g], ['프라임 ′', /′/g]] },
    { n: '큰따옴표', k: [['직선 "', /"/g], ['둥근 “ ”', /[“”]/g], ['더블프라임 ″', /″/g]] },
    { n: '가운뎃점', k: [['·', /·/g], ['ㆍ', /ㆍ/g], ['•', /•/g], ['∙', /∙/g]] },
    { n: '물결·범위', k: [['~', /~/g], ['∼', /∼/g], ['–', /–/g], ['—', /—/g]] },
    { n: '말줄임', k: [['…', /…/g], ['...', /\.\.\./g]] }
  ];
  groups.forEach(function (g) {
    var cnt = g.k.map(function (k) { var hits = []; all.forEach(function (s) { var re = new RegExp(k[1].source, 'g'), m; while ((m = re.exec(s.t))) { // 숫자 뒤 ′″ 는 인치/분초라 제외
      if (/[′″]/.test(m[0]) && /\d$/.test(s.t.slice(0, m.index))) continue; if (k[0] === "직선 '" && /[A-Za-z]$/.test(s.t.slice(0, m.index)) && /^[a-z]/.test(s.t.slice(m.index + 1))) { hits.push({ P: s.P, b: subBox(s, m.index, 1), s: s.t, apos: true }); continue; }
      hits.push({ P: s.P, b: subBox(s, Math.max(0, m.index - 3), 6), s: s.t }); } }); return { k: k[0], hits: hits }; });
    var used = cnt.filter(function (c) { return c.hits.length; });
    if (used.length < 2) return;
    used.sort(function (a, b) { return b.hits.length - a.hits.length; });
    var major = used[0];
    used.slice(1).forEach(function (c) {
      perPage('punct', 'warn', g.n + ' 모양이 섞여 있어요', '문서 대부분은 ' + major.k + ' (' + major.hits.length + '곳)이에요. 하나로 맞춰 주세요.', c.hits, function (L) { return c.k + ' ' + L.length + '곳 · ' + L.slice(0, 2).map(function (h) { return '“' + cut(h.s, 26) + '”'; }).join(', '); });
    });
  });
  // 따옴표 대신 프라임(′ ″)을 쓴 곳 (숫자 뒤 인치·분초는 제외)
  var pr = []; all.forEach(function (s) { var re = /[\u2032\u2033]/g, m; while ((m = re.exec(s.t))) { if (/\d\s*$/.test(s.t.slice(0, m.index))) continue; pr.push({ P: s.P, b: subBox(s, Math.max(0, m.index - 3), 6), s: s.t.slice(Math.max(0, m.index - 10), m.index + 12) }); } });
  perPage('prime', 'warn', '따옴표 자리에 프라임(′ ″)이 쓰였어요', '따옴표(‘ ’ “ ”)로 바꿔 주세요. ′ ″는 피트·인치, 분·초 표시용이에요.', pr, function (L) { return L.length + '곳 · ' + L.slice(0, 2).map(function (h) { return '“' + cut(h.s, 26) + '”'; }).join(', '); });
  // 3) 헷갈리는 글자 (전각, 키릴, 보이지 않는 글자 …)
  ODD.forEach(function (o) {
    var hits = []; all.forEach(function (s) { var m = s.t.match(o[0]); if (m) hits.push({ P: s.P, b: subBox(s, s.t.indexOf(m[0]), 1), s: s.t }); });
    perPage('oddchar', 'warn', '헷갈리는 글자가 있어요: ' + o[1], '보기엔 비슷해도 다른 글자예요. 다시 입력해 주세요.', hits, function (L) { return L.length + '곳 · ' + L.slice(0, 2).map(function (h) { return '“' + cut(h.s, 24) + '”'; }).join(', '); });
  });
  // v·z·w 들어간 영문 단어 모아 보기
  var vzw = {}; all.forEach(function (s) { (s.t.match(/[A-Za-z]*[vzwVZW][A-Za-z]*/g) || []).forEach(function (w) { if (w.length < 2) return; (vzw[w] = vzw[w] || new Set()).add(s.P.i + 1); }); });
  var vk = Object.keys(vzw); if (vk.length) issue({ page: null, sev: 'info', cat: 'text', code: 'vzw', title: 'v·z·w 들어간 영문 단어 모아 보기', detail: vk.slice(0, 40).map(function (w) { return w + ' (' + Array.from(vzw[w]).slice(0, 4).join(',') + '쪽)'; }).join(', '), fix: '철자·서체 모양이 맞는지 한 번 훑어봐 주세요.', boxes: [] });
  // 4) 오타 의심: 한글 자주 틀리는 말, 같은 단어 반복, 사전·문서 안 단어와 한두 글자 차이
  var tk = []; all.forEach(function (s) { TYPO_KO.forEach(function (t) { var re = new RegExp(t[0].source, 'g'), m; while ((m = re.exec(s.t))) tk.push({ P: s.P, b: subBox(s, m.index, m[0].length), w: m[0], to: t[1] }); }); });
  perPage('typoko', 'warn', '맞춤법 의심', '바른 표기를 확인해 주세요.', tk, function (L) { return L.slice(0, 4).map(function (h) { return h.w + ' → ' + h.to; }).join(', '); }, true);
  var rep = []; all.forEach(function (s) { var re = /(^|[\s(])([A-Za-z가-힣]{1,20})\s+\2(?=[\s.,)!?]|$)/g, m; while ((m = re.exec(s.t))) rep.push({ P: s.P, b: subBox(s, m.index, m[0].length), w: m[2] }); });
  perPage('repword', 'warn', '같은 단어가 연달아 나와요', '하나를 지워야 하는지 확인해 주세요.', rep, function (L) { return L.slice(0, 4).map(function (h) { return '“' + h.w + ' ' + h.w + '”'; }).join(', '); }, true);
  var words = {}; all.forEach(function (s) { (s.t.match(/[A-Za-z][A-Za-z']{3,}/g) || []).forEach(function (w) { var u = w.toUpperCase(); (words[u] = words[u] || { n: 0, forms: {}, hits: [] }); words[u].n++; words[u].forms[w] = (words[u].forms[w] || 0) + 1; if (words[u].hits.length < 30) words[u].hits.push({ P: s.P, b: subBox(s, s.t.indexOf(w), w.length), s: s.t }); }); });
  var wk = Object.keys(words), sp = [];
  wk.forEach(function (u) {
    if (/'S$/.test(u) && DICTS[u.slice(0, -2)]) return;
    if (DICTS[u] || u.length < 5) return;
    var best = null; DICT.forEach(function (d) { if (Math.abs(d.length - u.length) <= 2) { var e = lev(u, d); if (e > 0 && e <= (u.length >= 8 ? 2 : 1) && (!best || e < best.e)) best = { d: d, e: e }; } });
    if (!best) wk.forEach(function (v) { if (v !== u && words[v].n >= 3 * words[u].n && words[v].n >= 3 && Math.abs(v.length - u.length) <= 1 && lev(u, v) === 1) best = { d: v, e: 1, doc: true }; });
    if (best) words[u].hits.forEach(function (h) { sp.push({ P: h.P, b: h.b, w: Object.keys(words[u].forms)[0], to: best.d, doc: best.doc }); });
  });
  perPage('typoen', 'warn', '영문 철자 의심', '철자를 확인해 주세요.', sp, function (L) { return uniq(L.map(function (h) { return h.w + ' → ' + (h.doc ? h.to + '(문서에 더 많은 표기)' : h.to); })).slice(0, 4).join(', '); }, true);
  // 5) 대소문자 섞임 (같은 단어가 다른 대소문자로)
  var cs = [];
  wk.forEach(function (u) {
    var f = Object.keys(words[u].forms); if (f.length < 2) return;
    // 문장 첫 글자 대문자(Title)와 소문자는 흔하니 ALL CAPS ↔ 다른 형태만
    var caps = f.filter(function (x) { return x === x.toUpperCase(); }), other = f.filter(function (x) { return x !== x.toUpperCase(); });
    var titleOnly = other.length && other.every(function (x) { return x === x.charAt(0).toUpperCase() + x.slice(1).toLowerCase() || x === x.toLowerCase(); }) && !caps.length;
    if (titleOnly) return;
    cs.push({ u: u, forms: f.map(function (x) { return x + ' ' + words[u].forms[x] + '번'; }) });
  });
  if (cs.length) issue({ page: null, sev: 'warn', cat: 'text', code: 'case', title: '같은 단어가 다른 대소문자로 쓰였어요', detail: cs.slice(0, 12).map(function (c) { return c.forms.join(' / '); }).join(' · '), fix: '타이틀·품목명·이름은 한 가지 표기로 맞춰 주세요.', boxes: [], sus: true, pages: [] });
  // 6) 일부만 적용된 스타일: 단어 중간에 서체·크기가 바뀜, 같은 줄에서 크기가 조금 다른 글자
  var mid = [], sz = [];
  R.pages.forEach(function (P) {
    lines(P).forEach(function (l) {
      l.items.forEach(function (t, i) {
        var n = l.items[i + 1]; if (!n) return;
        var gap = n.x - (t.x + t.w), touch = gap < Math.min(t.z, n.z) * 0.12;
        var diffF = t.f !== n.f, dz = Math.abs(t.z - n.z) / Math.max(t.z, n.z);
        if (touch && /[A-Za-z가-힣]$/.test(t.s) && /^[A-Za-z가-힣]/.test(n.s) && (diffF || dz > 0.02)) mid.push({ P: P, b: [t.b[0], Math.min(t.b[1], n.b[1]), n.b[2], Math.max(t.b[3], n.b[3])], s: cut(t.s.slice(-8) + n.s.slice(0, 8), 20) });
        else if (dz > 0.02 && dz < 0.15 && gap < Math.max(t.z, n.z) * 1.5 && t.s.trim() && n.s.trim()) sz.push({ P: P, b: [t.b[0], Math.min(t.b[1], n.b[1]), n.b[2], Math.max(t.b[3], n.b[3])], s: cut(t.s.slice(-8) + ' ' + n.s.slice(0, 8), 20), z: [t.z, n.z] });
      });
    });
  });
  perPage('midstyle', 'warn', '단어 중간에 서체·크기가 바뀌어요', '스타일이 일부만 적용된 것 같아요. 단락/문자 스타일을 다시 적용해 주세요.', mid, function (L) { return L.length + '곳 · ' + L.slice(0, 3).map(function (h) { return '“' + h.s + '”'; }).join(', '); }, true);
  perPage('sizemix', 'warn', '같은 줄에서 글자 크기가 조금 달라요', '의도한 게 아니면 같은 크기로 맞춰 주세요.', sz, function (L) { return L.slice(0, 3).map(function (h) { return '“' + h.s + '” ' + h.z.map(function (z) { return Math.round(z * 10) / 10; }).join('pt/') + 'pt'; }).join(', '); }, true);
  // 7) 팀 표기 규칙
  var lowAll = all.map(function (s) { return s.t; });
  rules.terms.concat(rules.members).forEach(function (r) {
    r.wrong.forEach(function (w) {
      var hits = []; all.forEach(function (s) { var i = s.t.indexOf(w); if (i < 0 && /[a-z]/i.test(w)) { var j = s.t.toLowerCase().indexOf(w.toLowerCase()); if (j > -1 && s.t.substr(j, w.length) !== r.forms[0] && r.forms.indexOf(s.t.substr(j, w.length)) < 0) i = j; } if (i > -1) hits.push({ P: s.P, b: subBox(s, i, w.length), s: s.t.substr(i, w.length) }); });
      perPage('rule', 'err', '팀 표기 규칙과 달라요: ' + r.forms[0], '정식 표기 “' + r.forms.join(' / ') + '”(으)로 바꿔 주세요.', hits, function (L) { return '“' + L[0].s + '” ' + L.length + '곳'; });
    });
    // 영문 정식 표기의 대소문자 변형 자동 검사
    r.forms.forEach(function (f) {
      if (!/[A-Za-z]/.test(f)) return;
      var hits = []; all.forEach(function (s) { var lo = s.t.toLowerCase(), i = lo.indexOf(f.toLowerCase()); while (i > -1) { var got = s.t.substr(i, f.length); if (got !== f && r.forms.indexOf(got) < 0 && r.wrong.indexOf(got) < 0 && !/[A-Za-z]/.test(s.t.charAt(i - 1) || '') && !/[A-Za-z]/.test(s.t.charAt(i + f.length) || '')) hits.push({ P: s.P, b: subBox(s, i, f.length), s: got }); i = lo.indexOf(f.toLowerCase(), i + 1); } });
      perPage('rulecase', 'err', '대소문자가 팀 표기와 달라요: ' + f, '“' + f + '”(으)로 맞춰 주세요.', hits, function (L) { return uniq(L.map(function (h) { return '“' + h.s + '”'; })).join(', ') + ' ' + L.length + '곳'; });
    });
  });
  // 8) 멤버 이름 영문/한글 혼용 (페이지마다 다른 언어)
  rules.members.forEach(function (r) {
    if (r.forms.length < 2) return;
    var ko = r.forms.filter(function (f) { return HANGUL.test(f); }), en = r.forms.filter(function (f) { return !HANGUL.test(f); }); if (!ko.length || !en.length) return;
    var pk = new Set(), pe = new Set(); all.forEach(function (s) { if (ko.some(function (f) { return s.t.indexOf(f) > -1; })) pk.add(s.P.i); if (en.some(function (f) { return s.t.toUpperCase().indexOf(f.toUpperCase()) > -1; })) pe.add(s.P.i); });
    var onlyK = Array.from(pk).filter(function (p) { return !pe.has(p); }), onlyE = Array.from(pe).filter(function (p) { return !pk.has(p); });
    if (onlyK.length && onlyE.length) issue({ page: null, sev: 'warn', cat: 'text', code: 'koen', title: '멤버 이름이 페이지마다 한글/영문으로 달라요: ' + r.forms.join(' / '), detail: '한글만 ' + onlyK.map(function (p) { return p + 1; }).join(',') + '쪽 · 영문만 ' + onlyE.map(function (p) { return p + 1; }).join(',') + '쪽', fix: '같은 역할(캡션, 목차 등)이면 한 가지로 맞춰 주세요.', boxes: [], pages: onlyK.concat(onlyE).map(function (p) { return p + 1; }), sus: true });
  });
  // 9) 영문/한글 혼용: 같은 반복 문구가 어떤 페이지는 영문, 어떤 페이지는 한글 (요일·월 이름)
  var dayKo = /^(일|월|화|수|목|금|토)요?일?$/, dayEn = /^(SUN|MON|TUE|WED|THU|FRI|SAT)(DAY|SDAY|NESDAY|URDAY|RSDAY)?$/i, pK = new Set(), pE = new Set();
  all.forEach(function (s) { s.t.split(/\s+/).forEach(function (w) { if (dayKo.test(w)) pK.add(s.P.i); if (dayEn.test(w)) pE.add(s.P.i); }); });
  if (pK.size && pE.size) { var oK = Array.from(pK).filter(function (p) { return !pE.has(p); }), oE = Array.from(pE).filter(function (p) { return !pK.has(p); }); if (oK.length && oE.length) issue({ page: null, sev: 'warn', cat: 'text', code: 'koen2', title: '요일 표기가 페이지마다 한글/영문으로 달라요', detail: '한글 ' + oK.map(function (p) { return p + 1; }).join(',') + '쪽 · 영문 ' + oE.map(function (p) { return p + 1; }).join(',') + '쪽', fix: '한 가지로 맞춰 주세요.', boxes: [], sus: true }); }
}

// ── 반복 문구 일관성 (판권·하단 문구 등), 판권 유무 ──
function repeatChecks(R) {
  var issue = X.issue, map = {}, N = R.pages.length;
  R.pages.forEach(function (P) { segsOf(P).forEach(function (s) { var t = norm(s.t); if (t.length < 12) return; (map[t] = map[t] || { t: t, pages: new Set(), segs: [] }).pages.add(P.i); map[t].segs.push({ P: P, s: s }); }); });
  var keys = Object.keys(map), majors = keys.filter(function (k) { return map[k].pages.size >= Math.max(3, N * 0.3); });
  majors.forEach(function (mk) {
    var M = map[mk];
    keys.forEach(function (k) {
      if (k === mk || map[k].pages.size >= M.pages.size) return;
      if (Math.abs(k.length - mk.length) > 4) return;
      var e = lev(k.toUpperCase(), mk.toUpperCase()); if (e === 0 && k !== mk) e = 1;
      if (e === 0 || e > Math.max(2, Math.round(mk.length * 0.06))) return;
      map[k].segs.forEach(function (x) {
        if (M.pages.has(x.P.i)) return;
        var ref = M.segs[0];
        issue({ page: x.P.i, sev: 'warn', cat: 'text', code: 'repeat', title: '다른 페이지와 같은 문구인데 조금 달라요', detail: '이 페이지: “' + cut(k, 60) + '” · 다른 ' + M.pages.size + '개 페이지: “' + cut(mk, 60) + '”' + diffHint(k, mk), fix: '오타인지 확인하고 같게 맞춰 주세요.', boxes: [x.s.b], ref: ref.P.i, refBox: ref.s.b, sus: true });
      });
    });
  });
  // 판권·저작권
  var cr = /(©|\(c\)|copyright|all rights reserved|판권|무단\s*(복제|전재|배포)|unauthorized|manufactured by|distributed by)/i, crP = [];
  R.pages.forEach(function (P) { if (segsOf(P).some(function (s) { return cr.test(s.t); })) crP.push(P.i); });
  var txt = R.pages.some(function (P) { return (P.tc || []).length; });
  if (txt && !crP.length) issue({ page: null, sev: 'warn', cat: 'text', code: 'nocopy', title: '판권·저작권 표기를 찾지 못했어요', detail: '©, Copyright, All rights reserved, 판권, 무단 복제 같은 문구가 없어요.', fix: '판권 면이나 하단 저작권 문구가 들어가야 하는 품목인지 확인해 주세요.', boxes: [], sus: true });
  if (crP.length) {
    var years = {}; R.pages.forEach(function (P) { segsOf(P).forEach(function (s) { if (!/©|\(c\)|copyright/i.test(s.t)) return; var y = s.t.match(/(19|20)\d{2}/); if (y) (years[y[0]] = years[y[0]] || []).push({ P: P, s: s }); }); });
    var ys = Object.keys(years).sort(function (a, b) { return years[b].length - years[a].length; });
    if (ys.length > 1) ys.slice(1).forEach(function (y) { years[y].forEach(function (x) { issue({ page: x.P.i, sev: 'warn', cat: 'text', code: 'copyyear', title: '저작권 연도가 다른 페이지와 달라요', detail: '이 페이지 ' + y + ' · 다른 페이지 ' + ys[0] + ' (' + years[ys[0]].length + '곳)', fix: '연도를 확인해 주세요.', boxes: [x.s.b] }); }); });
    issue({ page: null, sev: 'info', cat: 'text', code: 'copyok', title: '판권·저작권 문구', detail: crP.length + '개 페이지에 있어요 (' + crP.slice(0, 10).map(function (p) { return p + 1; }).join(',') + '쪽)', fix: '', boxes: [] });
  }
}
function diffHint(a, b) {
  var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return ' · 다른 곳: “…' + a.slice(Math.max(0, i - 6), i + 8) + '…” ↔ “…' + b.slice(Math.max(0, i - 6), i + 8) + '…”';
}

// ── 쪽 번호·목차 ──
function pageNumbers(R) {
  var issue = X.issue, MM = X.MM, found = [];
  R.pages.forEach(function (P) {
    var T = P.trim, cand = (P.tc || []).filter(function (t) { return /^\s*\d{1,3}\s*$/.test(t.s) && (t.b[1] < T[1] + 18 * MM || t.b[3] > T[3] - 18 * MM) && t.z < 16; });
    var halves = P.spread ? [[T[0], (T[0] + T[2]) / 2], [(T[0] + T[2]) / 2, T[2]]] : [[T[0], T[2]]];
    halves.forEach(function (h, k) { var c = cand.filter(function (t) { var cx = (t.b[0] + t.b[2]) / 2; return cx > h[0] && cx < h[1]; }); if (c.length === 1) found.push({ P: P, lp: P.lp[k], n: +c[0].s.trim(), b: c[0].b }); });
  });
  if (found.length < Math.max(3, R.bookPages * 0.3)) return;
  var off = {}; found.forEach(function (f) { var o = f.n - f.lp; off[o] = (off[o] || 0) + 1; });
  var best = +Object.keys(off).sort(function (a, b) { return off[b] - off[a]; })[0];
  if (off[best] < found.length * 0.6) return;
  R.pnOffset = best;
  found.forEach(function (f) { if (f.n - f.lp !== best) issue({ page: f.P.i, sev: 'err', cat: 'text', code: 'pagenum', title: '쪽 번호가 순서와 안 맞아요', detail: '찍힌 번호 ' + f.n + ' · 순서상 ' + (f.lp + best) + '쪽이어야 해요.', fix: '쪽 번호나 페이지 순서를 확인해 주세요.', boxes: [f.b] }); });
  // 목차
  R.pages.forEach(function (P) {
    if ((P.tc || []).filter(function (t) { return /^\s*\d{1,2}\s*$/.test(t.s); }).length >= 20) return; // 달력 페이지
    var ent = []; segsOf(P).forEach(function (s) { var m = norm(s.t).match(/^(.{2,40}?)[\s.·…\-_]{1,}(\d{1,3})$/); if (m && (m[1].match(/[A-Za-z\uac00-\ud7a3]/g) || []).length >= 2) ent.push({ title: m[1].replace(/[.·…\s]+$/, '').trim(), n: +m[2], s: s }); });
    if (ent.length < 3) return;
    var inc = ent.every(function (e, i) { return !i || e.n >= ent[i - 1].n; });
    if (!inc) issue({ page: P.i, sev: 'warn', cat: 'text', code: 'tocorder', title: '목차 쪽 번호가 순서대로가 아니에요', detail: ent.map(function (e) { return e.n; }).join(', '), fix: '목차 순서를 확인해 주세요.', boxes: ent.map(function (e) { return e.s.b; }), sus: true });
    ent.forEach(function (e) {
      var lp = e.n - best, tp = R.pages.find(function (Q) { return Q.lp.indexOf(lp) > -1; });
      if (!tp) { issue({ page: P.i, sev: 'err', cat: 'text', code: 'toc', title: '목차가 없는 쪽을 가리켜요', detail: '“' + e.title + '” → ' + e.n + '쪽 (파일에 없음)', fix: '목차 번호를 확인해 주세요.', boxes: [e.s.b] }); return; }
      var key = e.title.replace(/\s+/g, '').slice(0, 8).toUpperCase();
      var hit = segsOf(tp).some(function (s) { return s.t.replace(/\s+/g, '').toUpperCase().indexOf(key) > -1; });
      if (!hit && key.length >= 2) issue({ page: P.i, sev: 'warn', cat: 'text', code: 'toc2', title: '목차 제목이 해당 쪽에 안 보여요', detail: '“' + e.title + '” → ' + e.n + '쪽(' + (tp.i + 1) + '번째 장)에 이 제목이 없어요.', fix: '목차 쪽 번호나 제목을 확인해 주세요.', boxes: [e.s.b], ref: tp.i, refBox: tp.trim, sus: true });
    });
  });
}

// ── 멤버별 사진 수, 사진-이름 매칭 ──
function members(R, rules) {
  var issue = X.issue, MM = X.MM, mm = X.mm;
  if (!R.people || !R.people.length) return;
  var names = []; rules.members.forEach(function (r) { r.forms.forEach(function (f) { names.push({ f: f, r: r }); }); r.wrong.forEach(function (f) { names.push({ f: f, r: r }); }); });
  // 얼굴마다 근처 캡션에서 이름 찾기 (사진 안 또는 아래 20mm)
  R.faces.forEach(function (F) {
    var P = R.pages[F.page], im = (P.images || []).find(function (m) { return m.vis && X.overlaps(m.vis, F.box); }), area = im ? im.vis : F.box;
    var zone = [area[0] - 5 * MM, area[1] - 20 * MM, area[2] + 5 * MM, area[3] + 5 * MM], got = null;
    segsOf(P).forEach(function (s) { if (!X.overlaps(s.b, zone)) return; names.forEach(function (n) { if (!got && s.t.toUpperCase().indexOf(n.f.toUpperCase()) > -1) got = n.r; }); });
    F.cap = got; F.img = im ? im.page + ':' + im.k : null;
  });
  // 묶음 이름: 캡션 다수결
  R.people.forEach(function (p) {
    var c = {}; p.items.forEach(function (f) { if (f.cap) c[f.cap.name] = (c[f.cap.name] || 0) + 1; });
    var best = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
    if (best && c[best] >= Math.max(1, p.items.filter(function (f) { return f.cap; }).length * 0.5)) { p.name = best; p.auto = true; }
    p.items.forEach(function (f) { if (best && f.cap && f.cap.name !== best) issue({ page: f.page, sev: 'warn', cat: 'face', code: 'namematch', title: '사진과 이름이 안 맞아 보여요', detail: '캡션은 “' + f.cap.name + '”인데 얼굴은 ' + best + '(으)로 묶인 다른 사진들과 같아 보여요.', fix: '사진과 이름을 확인해 주세요.', boxes: [f.box], face: f, sus: true }); });
  });
  // 사진 수 (얼굴이 나온 이미지 기준: 단독/단체)
  var imgFaces = {}; R.faces.forEach(function (F) { var k = F.img || ('p' + F.page); (imgFaces[k] = imgFaces[k] || []).push(F); });
  R.people.forEach(function (p) { p.solo = 0; p.group = 0; var seen = {}; p.items.forEach(function (f) { var k = f.img || ('p' + f.page); if (seen[k]) return; seen[k] = 1; var n = imgFaces[k].filter(function (x) { return x.score > 0.6; }).length; if (n <= 1) p.solo++; else p.group++; }); });
  var main = R.people.filter(function (p) { return p.items.length >= 2; });
  R.photoTable = main;
  if (main.length >= 2) {
    var cnt = {}; main.forEach(function (p) { cnt[p.solo] = (cnt[p.solo] || 0) + 1; });
    var mode = +Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; })[0];
    var off = main.filter(function (p) { return p.solo !== mode; });
    if (off.length && (R.prod === 'photobook' || R.prod === 'photocard' || R.prod === 'calendar' || R.prod === 'book')) issue({ page: null, sev: 'warn', cat: 'face', code: 'count', title: '멤버별 단독 사진 수가 달라요', detail: off.map(function (p) { return p.name + ' ' + p.solo + '장'; }).join(', ') + ' · 대부분 ' + mode + '장', fix: '멤버별 사진 수를 맞춰야 하는 품목이면 확인해 주세요. (얼굴 자동 인식이라 표에서 묶음이 맞는지도 봐 주세요)', boxes: [], sus: true, top: true });
  }
}

// ── 바코드·ISBN·QR ──
var zxP = null;
function zx() { if (!zxP) zxP = (window.ZXing ? Promise.resolve(true) : new Promise(function (ok) { var s = document.createElement('script'); s.src = LIBS.zxing; s.onload = function () { ok(true); }; s.onerror = function () { ok(false); }; document.head.appendChild(s); })); return zxP; }
async function barcodes(R, pdfjs) {
  var issue = X.issue, MM = X.MM, mm = X.mm, cands = [];
  R.pages.forEach(function (P) {
    var bars = P.fills.filter(function (f) { var w = f.box[2] - f.box[0], h = f.box[3] - f.box[1]; return w < 1.2 * MM && h > 6 * MM && h < 40 * MM && !f.ink.white; });
    var sq = P.fills.filter(function (f) { var w = f.box[2] - f.box[0], h = f.box[3] - f.box[1]; return w < 2.5 * MM && h < 2.5 * MM && Math.abs(w - h) < 0.2 * MM && !f.ink.white; });
    var isbn = segsOf(P).filter(function (s) { return /ISBN|ISSN|97[89][\d\- ]{10,}/i.test(s.t); });
    function cluster(list, minN) { // 붙어 있는 덩어리
      var out = []; list.forEach(function (f) { var c = out.find(function (o) { return f.box[0] < o[2] + 4 * MM && f.box[2] > o[0] - 4 * MM && f.box[1] < o[3] + 4 * MM && f.box[3] > o[1] - 4 * MM; }); if (c) { c[0] = Math.min(c[0], f.box[0]); c[1] = Math.min(c[1], f.box[1]); c[2] = Math.max(c[2], f.box[2]); c[3] = Math.max(c[3], f.box[3]); c.n++; } else { var o = f.box.slice(); o.n = 1; out.push(o); } }); return out.filter(function (o) { return o.n >= minN; });
    }
    cluster(bars, 20).forEach(function (b) { cands.push({ P: P, b: b, kind: 'bar' }); });
    cluster(sq, 60).forEach(function (b) { cands.push({ P: P, b: b, kind: 'qr' }); });
    (P.images || []).forEach(function (im) { /* 이미지 속 바코드는 아래 전체 페이지 스캔으로 */ });
    if (isbn.length) P._isbn = isbn;
  });
  var pagesISBN = R.pages.filter(function (P) { return P._isbn; });
  // ISBN 숫자 자체 검증
  pagesISBN.forEach(function (P) { P._isbn.forEach(function (s) { var d = (s.t.match(/97[89][\d\- ]{10,16}/) || [''])[0].replace(/\D/g, ''); if (d.length === 13 && !ean13ok(d)) issue({ page: P.i, sev: 'err', cat: 'print', code: 'isbnsum', title: 'ISBN 숫자의 검증 번호가 틀려요', detail: d, fix: 'ISBN 번호를 다시 확인해 주세요.', boxes: [s.b] }); }); });
  if (!cands.length && !pagesISBN.length) return;
  var ok = await zx(); if (!ok) { issue({ page: null, sev: 'info', cat: 'print', code: 'bcload', title: '바코드 판독 도구를 불러오지 못했어요', detail: '', fix: '', boxes: [] }); return; }
  var hints = new Map(); hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
  var reader = new ZXing.MultiFormatReader(); reader.setHints(hints);
  async function decodeRegion(P, b) {
    var pg = await pdfjs.getPage(P.i + 1), pad = 6 * MM, bw = b[2] - b[0] + 2 * pad, bh = b[3] - b[1] + 2 * pad, scale = Math.min(8, 1400 / Math.max(bw, bh));
    var vp = pg.getViewport({ scale: scale }), cv = document.createElement('canvas'), r = X.toPxVp(vp, [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]);
    cv.width = Math.max(10, Math.round(r[2] - r[0])); cv.height = Math.max(10, Math.round(r[3] - r[1]));
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.translate(-r[0], -r[1]);
    await pg.render({ canvasContext: cx, viewport: vp, intent: 'print' }).promise;
    try { var src = new ZXing.HTMLCanvasElementLuminanceSource(cv), bmp = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src)); var res = reader.decode(bmp); return { text: res.getText(), fmt: ZXing.BarcodeFormat[res.getBarcodeFormat()] }; } catch (e) { return null; }
  }
  for (var i = 0; i < cands.length && i < 40; i++) {
    var c = cands[i], res = await decodeRegion(c.P, c.b);
    if (!res) { issue({ page: c.P.i, sev: 'err', cat: 'print', code: 'bcfail', title: (c.kind === 'qr' ? 'QR코드' : '바코드') + '가 읽히지 않아요', detail: '크기 ' + mm(c.b[2] - c.b[0]).toFixed(1) + '×' + mm(c.b[3] - c.b[1]).toFixed(1) + 'mm', fix: c.kind === 'qr' ? '여백(조용한 영역)과 크기(최소 15mm)를 확인해 주세요.' : '크기(80% 이상), 바 색(K100), 여백을 확인해 주세요.', boxes: [c.b], sus: true }); continue; }
    c.res = res;
    var msg = res.fmt + ' · ' + res.text, bad = '';
    if (/EAN_13/.test(res.fmt) && c.P._isbn) { var t = c.P._isbn.map(function (s) { return s.t.replace(/\D/g, ''); }).join(' '); if (t.indexOf(res.text) < 0) bad = '바코드 번호(' + res.text + ')가 ISBN 글자와 달라요'; }
    issue({ page: c.P.i, sev: bad ? 'err' : 'info', cat: 'print', code: 'bcok', title: bad || ((c.kind === 'qr' ? 'QR코드' : '바코드') + ' 읽힘'), detail: msg, fix: bad ? '바코드와 번호를 다시 확인해 주세요.' : (c.kind === 'qr' ? '주소가 맞는지 열어 봐 주세요.' : ''), boxes: [c.b] });
  }
  pagesISBN.forEach(function (P) { if (!cands.some(function (c) { return c.P === P; })) issue({ page: P.i, sev: 'warn', cat: 'print', code: 'isbnbar', title: 'ISBN 글자는 있는데 바코드를 찾지 못했어요', detail: '이미지로 들어간 바코드면 판독을 못 했을 수 있어요.', fix: '바코드가 있는지, 벡터(K100)로 들어갔는지 확인해 주세요.', boxes: P._isbn.map(function (s) { return s.b; }), sus: true }); });
}
function ean13ok(d) { var s = 0; for (var i = 0; i < 12; i++) s += (+d[i]) * (i % 2 ? 3 : 1); return (10 - s % 10) % 10 === +d[12]; }

// ── 달력 ──
// 대한민국 공휴일: 해마다 자동 계산 (양력 고정일 + 음력 명절 + 대체공휴일 규칙)
// 선거일·임시공휴일은 PLYSH 달력의 공휴일 목록에서 가져와 합쳐요.
var HOL_FIX = [[1, 1, '신정'], [3, 1, '삼일절'], [5, 5, '어린이날'], [6, 6, '현충일'], [7, 17, '제헌절'], [8, 15, '광복절'], [10, 3, '개천절'], [10, 9, '한글날'], [12, 25, '성탄절']];
var HOL_CACHE = {}, HOL_FAIL = {};
function ymdKey(y, m, d) { return y + '-' + m + '-' + d; }
function lunarToSolar(y, m, d) {
  var K = window.KoreanLunarCalendar; if (!K) return null;
  var c = new K(); if (!c.setLunarDate(y, m, d, false)) return null;
  var r = c.getSolarCalendar(); return new Date(r.year, r.month - 1, r.day);
}
function plyshHol() { // PLYSH 본 화면이 가진 공휴일 (선거일·임시공휴일 포함)
  var h = null;
  try { if (window.parent && window.parent !== window && window.parent.S && window.parent.S.D && window.parent.S.D.hol) h = window.parent.S.D.hol; } catch (e) {}
  if (!h) try { var c = JSON.parse(localStorage.getItem('d4:data') || 'null'); h = c && c.hol; } catch (e) {}
  return h || {};
}
function korHolidays(y) {
  if (HOL_CACHE[y]) return HOL_CACHE[y];
  var map = {}, groups = [];
  function add(dt, name, sub, grp) { var k = ymdKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()); (map[k] = map[k] || []).push({ n: name, sub: sub, grp: grp }); return k; }
  HOL_FIX.forEach(function (h) {
    if (h[2] === '제헌절' && y < 2026) return; // 2026년부터 다시 공휴일
    var dt = new Date(y, h[0] - 1, h[1]);
    // 대체공휴일 적용: 어린이날(2014~), 삼일절·광복절·개천절·한글날(2021~), 성탄절(2023~)
    var sub = h[2] === '어린이날' ? y >= 2014 : /삼일절|광복절|개천절|한글날/.test(h[2]) ? y >= 2021 : h[2] === '제헌절' ? true : h[2] === '성탄절' ? y >= 2023 : false;
    groups.push({ keys: [add(dt, h[2], sub ? 'we' : '', null)], sub: sub ? 'we' : '' });
  });
  var seol = lunarToSolar(y, 1, 1), chu = lunarToSolar(y, 8, 15), bud = lunarToSolar(y, 4, 8);
  if (!seol || !chu || !bud) HOL_FAIL[y] = true;
  [[seol, '설날'], [chu, '추석']].forEach(function (L) {
    if (!L[0]) return; var keys = [];
    for (var i = -1; i <= 1; i++) { var dt = new Date(L[0].getFullYear(), L[0].getMonth(), L[0].getDate() + i); keys.push(add(dt, i ? L[1] + ' 연휴' : L[1], y >= 2014 ? 'sun' : '', L[1])); }
    groups.push({ keys: keys, sub: y >= 2014 ? 'sun' : '' });
  });
  if (bud) groups.push({ keys: [add(bud, '부처님오신날', y >= 2023 ? 'we' : '', null)], sub: y >= 2023 ? 'we' : '' });
  // 대체공휴일: 겹치는 날마다 하나씩, 묶음이 끝난 뒤 처음 오는 평일(공휴일 아님)에
  function dateOf(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var subs = [], done = {};
  groups.sort(function (a, b) { return dateOf(a.keys[0]) - dateOf(b.keys[0]); }).forEach(function (g) {
    if (!g.sub) return; var need = 0;
    g.keys.forEach(function (k) {
      var w = dateOf(k).getDay(), over = map[k].length > 1, wk = g.sub === 'sun' ? w === 0 : (w === 0 || w === 6);
      if ((wk || over) && !done[k]) { need++; done[k] = true; }
    });
    var cur = dateOf(g.keys[g.keys.length - 1]);
    while (need > 0) {
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      var k = ymdKey(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()), w = cur.getDay();
      if (w === 0 || w === 6 || map[k] || subs.indexOf(k) > -1) continue;
      subs.push(k); need--;
    }
  });
  var out = {};
  Object.keys(map).forEach(function (k) { var ns = []; map[k].forEach(function (h) { if (ns.indexOf(h.n) < 0) ns.push(h.n); }); out[k] = ns.join('·'); });
  subs.forEach(function (k) { out[k] = '대체공휴일'; });
  // PLYSH 공휴일 목록(선거일·임시공휴일) 합치기
  var ph = plyshHol();
  Object.keys(ph).forEach(function (d) { var m = String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (!m || +m[1] !== y || /신정|설날|삼일절|어린이날|부처님|현충일|제헌절|광복절|추석|개천절|한글날|성탄|대체/.test(ph[d])) return; var k = ymdKey(+m[1], +m[2], +m[3]); if (!out[k]) out[k] = ph[d]; });
  // 선거일 (법정 공휴일): 국회의원 4/10 이후 첫 수요일(4년마다, 2028~), 지방선거 6/1 이후 첫 수요일(4년마다, 2026~). 대통령선거는 정해지면 PLYSH 목록으로
  function firstWed(m, d) { var t = new Date(y, m - 1, d); while (t.getDay() !== 3) t.setDate(t.getDate() + 1); return t; }
  [[y >= 2028 && y % 4 === 0, 4, 10, '국회의원선거'], [y >= 2026 && y % 4 === 2, 6, 1, '지방선거']].forEach(function (e) {
    if (!e[0] || Object.keys(out).some(function (k) { return +k.split('-')[0] === y && out[k].indexOf(e[3].slice(0, 2)) > -1; })) return;
    var t = firstWed(e[1], e[2]), k = ymdKey(y, t.getMonth() + 1, t.getDate()); if (!out[k]) out[k] = e[3];
  });
  return (HOL_CACHE[y] = out);
}
function holOf(ymd) { var y = +String(ymd).split('-')[0]; return y ? korHolidays(y)[ymd] || '' : ''; }
var MON = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
var DOW = [/^(SUN|SUNDAY|일|일요일|S)$/i, /^(MON|MONDAY|월|월요일|M)$/i, /^(TUE|TUESDAY|화|화요일|T)$/i, /^(WED|WEDNESDAY|수|수요일|W)$/i, /^(THU|THURSDAY|목|목요일|T)$/i, /^(FRI|FRIDAY|금|금요일|F)$/i, /^(SAT|SATURDAY|토|토요일|S)$/i];
function calendar(R, rules) {
  var issue = X.issue, MM = X.MM, months = [];
  R.pages.forEach(function (P) {
    var items = (P.tc || []).filter(function (t) { return /^\s*\d{1,2}\s*$/.test(t.s) && +t.s >= 1 && +t.s <= 31; });
    if (items.length < 20) return;
    // 가장 많은 크기 묶음 = 날짜 숫자
    var zs = {}; items.forEach(function (t) { var k = Math.round(t.z); zs[k] = (zs[k] || 0) + 1; }); var zk = +Object.keys(zs).sort(function (a, b) { return zs[b] - zs[a]; })[0];
    var D = items.filter(function (t) { return Math.abs(t.z - zk) <= Math.max(1, zk * 0.12); });
    if (D.length < 20) return;
    // 열 찾기 (x 중심)
    var xs = D.map(function (t) { return (t.b[0] + t.b[2]) / 2; }).sort(function (a, b) { return a - b; }), cols = [];
    xs.forEach(function (x) { var c = cols.find(function (c) { return Math.abs(c.x - x) < zk * 1.4; }); if (c) { c.n++; c.x += (x - c.x) / c.n; } else cols.push({ x: x, n: 1 }); });
    cols = cols.filter(function (c) { return c.n >= 3; }).sort(function (a, b) { return a.x - b.x; });
    if (cols.length !== 7) return;
    var rows = []; D.forEach(function (t) { var y = (t.b[1] + t.b[3]) / 2, r = rows.find(function (r) { return Math.abs(r.y - y) < zk * 0.9; }); if (!r) { r = { y: y, items: [] }; rows.push(r); } r.items.push(t); });
    rows.sort(function (a, b) { return b.y - a.y; });
    var cells = []; rows.forEach(function (r, ri) { r.items.forEach(function (t) { var cx = (t.b[0] + t.b[2]) / 2, ci = 0, bd = 1e9; cols.forEach(function (c, i) { var d = Math.abs(c.x - cx); if (d < bd) { bd = d; ci = i; } }); cells.push({ d: +t.s, r: ri, c: ci, t: t }); }); });
    // 요일 머리글 순서
    var head = null; segsOf(P).forEach(function (s) { var ws = s.t.trim().split(/\s+/); if (ws.length >= 7) { var idx = ws.slice(0, 7).map(function (w) { for (var i = 0; i < 7; i++) if (DOW[i].test(w) && !/^[SMTWF]$/.test(w)) return i; return -1; }); if (idx.every(function (i) { return i >= 0; })) head = idx; } });
    if (!head) { var hd = (P.tc || []).filter(function (t) { return DOW.some(function (re) { return re.test(t.s.trim()) && t.s.trim().length > 1; }); }); if (hd.length >= 7) { var hcols = cols.map(function (c) { var h = hd.filter(function (t) { return Math.abs((t.b[0] + t.b[2]) / 2 - c.x) < zk * 1.5; })[0]; if (!h) return -1; for (var i = 0; i < 7; i++) if (DOW[i].test(h.s.trim())) return i; return -1; }); if (hcols.every(function (i) { return i >= 0; })) head = hcols; } }
    // 연·월
    var txt = segsOf(P).map(function (s) { return s.t; }).join(' '), yr = (txt.match(/20[2-4]\d/) || [])[0], mo = null;
    MON.forEach(function (m, i) { if (new RegExp('\\b' + m + '\\b', 'i').test(txt) || new RegExp('\\b' + m.slice(0, 3) + '\\b').test(txt)) mo = mo || i + 1; });
    if (!mo) { var big = (P.tc || []).filter(function (t) { return /^\s*(0?[1-9]|1[0-2])\s*(월)?\s*$/.test(t.s) && t.z > zk * 1.6; }).sort(function (a, b) { return b.z - a.z; })[0]; if (big) mo = +big.s.replace(/\D/g, ''); }
    if (!mo) { var km = txt.match(/(\d{1,2})\s*월/); if (km) mo = +km[1]; }
    months.push({ P: P, y: yr ? +yr : null, m: mo, cells: cells, head: head || [0, 1, 2, 3, 4, 5, 6], headGuess: !head, zk: zk, cols: cols });
  });
  R.calMonths = months;
  if (!months.length) { if (R.prod === 'calendar') issue({ page: null, sev: 'info', cat: 'cal', code: 'calnone', title: '달력 날짜 칸을 찾지 못했어요', detail: '날짜 숫자가 글자로 살아 있는 파일(아웃라인 전)이어야 검사할 수 있어요.', fix: '', boxes: [] }); return; }
  var yGuess = months.map(function (m) { return m.y; }).filter(Boolean); var yMode = yGuess.length ? +mode(yGuess) : null;
  var seenM = {}, noym = [];
  months.forEach(function (M) {
    var P = M.P, y = M.y || yMode, mth = M.m;
    // 날짜 중복·누락 (숫자 기준)
    var ds = M.cells.map(function (c) { return c.d; }), dup = ds.filter(function (d, i) { return ds.indexOf(d) !== i; });
    var maxD = Math.max.apply(null, ds), dim = y && mth ? new Date(y, mth, 0).getDate() : maxD, miss = []; for (var d = 1; d <= dim; d++) if (ds.indexOf(d) < 0) miss.push(d);
    // 이전/다음 달 흐린 숫자가 섞인 디자인이면 중복이 생김 → 행 순서로 판단: 첫 행의 큰 수, 마지막 행의 작은 수는 다른 달
    var other = M.cells.filter(function (c) { return (c.r === 0 && c.d > 20) || (c.r >= 4 && c.d < 15); });
    var own = M.cells.filter(function (c) { return other.indexOf(c) < 0; });
    ds = own.map(function (c) { return c.d; }); dup = ds.filter(function (d, i) { return ds.indexOf(d) !== i; }); miss = []; for (var d2 = 1; d2 <= dim; d2++) if (ds.indexOf(d2) < 0) miss.push(d2);
    var extra = ds.filter(function (d) { return d > dim; });
    if (dup.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'caldup', title: '같은 날짜가 두 번 있어요', detail: uniq(dup).join(', ') + '일', fix: '날짜를 확인해 주세요.', boxes: own.filter(function (c) { return dup.indexOf(c.d) > -1; }).map(function (c) { return c.t.b; }) });
    if (miss.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calmiss', title: '빠진 날짜가 있어요', detail: miss.join(', ') + '일 (' + (mth || '?') + '월은 ' + dim + '일까지)', fix: '날짜를 확인해 주세요.', boxes: [] });
    if (extra.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calextra', title: '그 달에 없는 날짜가 있어요', detail: extra.join(', ') + '일 (' + mth + '월은 ' + dim + '일까지)', fix: '', boxes: own.filter(function (c) { return c.d > dim; }).map(function (c) { return c.t.b; }) });
    if (mth) { if (seenM[(y || '') + '-' + mth]) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calmdup', title: mth + '월이 두 번 있어요', detail: (seenM[(y || '') + '-' + mth].i + 1) + '쪽과 같은 달', fix: '', boxes: [] }); seenM[(y || '') + '-' + mth] = P; }
    // 요일 맞는지
    if (y && mth) {
      var wrong = own.filter(function (c) { return new Date(y, mth - 1, c.d).getDay() !== M.head[c.c]; });
      if (wrong.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'caldow', title: '날짜와 요일이 안 맞아요', detail: y + '년 ' + mth + '월 1일은 ' + '일월화수목금토'.charAt(new Date(y, mth - 1, 1).getDay()) + '요일이에요. 어긋난 날짜 ' + wrong.length + '개' + (M.headGuess ? ' (요일 머리글을 못 읽어 일요일 시작으로 봤어요)' : ''), fix: '달력 시작 요일을 확인해 주세요.', boxes: wrong.slice(0, 10).map(function (c) { return c.t.b; }), sus: M.headGuess });
    } else noym.push(P.i + 1);
    // 표시(색) 분석: 숫자 글자색 + 칸 색
    M.cells.forEach(function (c) { c.mark = markOf(P, c); c.date = y && mth ? y + '-' + mth + '-' + c.d : null; c.dow = M.head[c.c]; c.own = own.indexOf(c) > -1; });
  });
  if (noym.length) issue({ page: null, sev: 'info', cat: 'cal', code: 'calnoym', title: '연도·월을 읽지 못해 요일 검사를 못 한 달이 있어요', detail: noym.join(', ') + '쪽', fix: '연도(예: 2027)와 월이 글자로 들어 있어야 해요.', boxes: [] });
  // 평일 기본 표시 = 가장 흔한 표시
  var allC = []; months.forEach(function (M) { M.cells.forEach(function (c) { if (c.own) allC.push(c); }); });
  var base = mode(allC.filter(function (c) { return c.dow > 0 && c.dow < 6; }).map(function (c) { return c.mark; }));
  var sunMarked = allC.filter(function (c) { return c.dow === 0; }), sunDiff = sunMarked.filter(function (c) { return c.mark !== base; }).length > sunMarked.length * 0.7;
  var sunMark = sunDiff ? mode(sunMarked.map(function (c) { return c.mark; })) : null;
  R.calInfo = { sunDiff: sunDiff };
  var bd = {}; rules.days.forEach(function (d) { bd[d.m + '-' + d.d] = d.label; });
  months.forEach(function (M) {
    var P = M.P, notMarked = [], oddMark = [], birthMiss = [];
    M.cells.forEach(function (c) {
      if (!c.own || !c.date) return;
      var ymd = c.date, md = c.date.split('-').slice(1).join('-'), hol = holOf(ymd), isB = bd[md];
      var marked = c.mark !== base;
      if (sunDiff && hol && c.dow !== 0 && c.mark !== sunMark) notMarked.push({ c: c, why: hol });
      if (marked && !hol && !isB && c.dow !== 0 && !(c.dow === 6)) oddMark.push(c);
      if (isB && !marked && rules.days.length) birthMiss.push({ c: c, why: isB });
    });
    if (notMarked.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calhol', title: '공휴일이 일요일처럼 표시되지 않았어요', detail: notMarked.map(function (n) { return n.c.d + '일 ' + n.why; }).join(', '), fix: '일요일과 같은 색으로 표시해 주세요. 공휴일은 음력 명절과 대체공휴일까지 자동 계산하고, 선거일·임시공휴일은 PLYSH 달력 목록을 따라요.', boxes: notMarked.map(function (n) { return n.c.t.b; }) });
    if (oddMark.length) issue({ page: P.i, sev: 'warn', cat: 'cal', code: 'calodd', title: '표시된 날인데 공휴일·생일 목록에 없어요', detail: oddMark.map(function (c) { return c.d + '일'; }).join(', ') + (rules.days.length ? '' : ' (팀 규칙에 생일·기념일을 넣으면 더 정확해요)'), fix: '생일·기념일이면 팀 규칙 목록에 넣어 주세요. 아니면 표시를 지워 주세요.', boxes: oddMark.map(function (c) { return c.t.b; }), sus: true });
    if (birthMiss.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calbirth', title: '생일·기념일이 표시되지 않았어요', detail: birthMiss.map(function (n) { return n.c.d + '일 ' + n.why; }).join(', '), fix: '다른 생일과 같은 방식으로 표시해 주세요.', boxes: birthMiss.map(function (n) { return n.c.t.b; }) });
    // 생일 글자 확인: 칸 근처 작은 글자에 이름이 있으면 날짜 맞는지
    rules.days.forEach(function (d) {
      if (!M.m || d.m !== M.m) return;
      var nm = d.label.replace(/\s*(생일|생신|기념일|데뷔.*)$/, '').trim(); if (!nm) return;
      var labs = segsOf(P).filter(function (s) { return s.t.indexOf(nm) > -1 && s.z < M.zk * 0.8; });
      labs.forEach(function (s) { var cx = (s.b[0] + s.b[2]) / 2, cy = (s.b[1] + s.b[3]) / 2, near = null, nd = 1e9; M.cells.forEach(function (c) { var dx = (c.t.b[0] + c.t.b[2]) / 2 - cx, dy = (c.t.b[1] + c.t.b[3]) / 2 - cy, dd = dx * dx + dy * dy; if (dd < nd && c.own) { nd = dd; near = c; } }); if (near && near.d !== d.d) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calbirth2', title: '생일·기념일 글자가 다른 날짜에 있어요', detail: '“' + cut(s.t, 20) + '”가 ' + near.d + '일 칸에 있어요. 목록에는 ' + d.m + '/' + d.d, fix: '날짜를 확인해 주세요.', boxes: [s.b, near.t.b] }); });
    });
  });
  // 달 순서
  var ms = months.filter(function (M) { return M.m; }).map(function (M) { return M.m; });
  for (var i = 1; i < ms.length; i++) if (ms[i] !== ms[i - 1] % 12 + 1) { issue({ page: months.filter(function (M) { return M.m; })[i].P.i, sev: 'warn', cat: 'cal', code: 'calorder', title: '달 순서가 이상해요', detail: '앞 달 ' + ms[i - 1] + '월 → 이 달 ' + ms[i] + '월', fix: '빠진 달이나 순서를 확인해 주세요.', boxes: [] }); }
}
function markOf(P, c) { // 숫자 글자색 + 칸 바탕색을 거칠게 묶은 키
  var t = c.t, b = t.b, et = (P.texts || []).find(function (x) { return X.overlaps(x.vis, b); }), ink = et && et.ink ? [Math.round(et.ink.c * 4), Math.round(et.ink.m * 4), Math.round(et.ink.y * 4), Math.round(et.ink.k * 4), et.ink.spots ? Object.keys(et.ink.spots)[0] : ''].join('') : '';
  var z = c.t.z, bg = X.avgPx(P, [b[0] - z * 0.9, b[1] - z * 0.9, b[0] - z * 0.3, b[3]]);
  var bk = bg ? bg.map(function (v) { return Math.round(v / 40); }).join('') : '';
  return ink + '|' + bk;
}
function mode(a) { var c = {}, b = null; a.forEach(function (x) { c[x] = (c[x] || 0) + 1; if (b === null || c[x] > c[b]) b = x; }); return b; }

// ── 보고서 카드 ──
function cards(t) {
  var R = X.R(), h = '';
  if ((t === 'face' || t === 'all') && R.photoTable && R.photoTable.length >= 2) {
    h += '<div class="card"><h3>멤버별 사진 수 <span class="mute small">얼굴 자동 인식 · 이름은 캡션이나 아래 묶음에서 바꿀 수 있어요</span></h3><table class="tbl"><tr><th>인물</th><th>단독</th><th>단체</th><th>페이지</th></tr>' +
      R.photoTable.map(function (p) { return '<tr><td><b>' + X.esc(p.name) + '</b>' + (p.auto ? ' <span class="mute small">(캡션)</span>' : '') + '</td><td>' + p.solo + '</td><td>' + p.group + '</td><td class="small sub">' + uniq(p.items.map(function (f) { return f.page + 1; })).slice(0, 20).join(', ') + '</td></tr>'; }).join('') + '</table></div>';
  }
  if ((t === 'cal' || t === 'all') && R.calMonths && R.calMonths.length) {
    h += '<div class="card"><h3>달력 <span class="mute small">' + R.calMonths.length + '개 달을 찾았어요</span></h3><div class="small sub">' + R.calMonths.map(function (M) { return (M.P.i + 1) + '쪽 = ' + (M.y || '?') + '년 ' + (M.m || '?') + '월'; }).join(' · ') + '<br>' + (R.calInfo && R.calInfo.sunDiff ? '일요일을 다른 색으로 표시하는 디자인이라 공휴일도 같은 표시인지 봤어요.' : '일요일을 따로 표시하지 않는 디자인이라, 공휴일 표시는 검사하지 않고 생일·기념일 같은 특별 표시만 봤어요.') + '<br>공휴일 목록: 2026~2028년 (2028년은 예상치, 정부 발표로 다시 확인)</div></div>';
  }
  return h;
}

window.RV2 = {
  attach: function (x) { X = x; },
  parseRules: parseRules, rulesToRows: rulesToRows, rowsToRules: rowsToRules, RULES_EX: RULES_EX, korHolidays: korHolidays,
  run: async function (R, pdfjs, step) {
    var rules = parseRules(R.rulesText != null ? R.rulesText : rulesText()); R.rulesN = rules;
    step('글자 검사 중…'); await X.tick(); textChecks(R, rules);
    repeatChecks(R); pageNumbers(R);
    step('달력·멤버 사진 확인 중…'); await X.tick(); calendar(R, rules); var hf = Object.keys(HOL_FAIL); if (hf.length) X.issue({ page: null, sev: 'info', cat: 'cal', code: 'holfail', title: hf.join(', ') + '년 음력 명절은 계산하지 못했어요', detail: '음력 변환표가 2050년까지라서 그 뒤의 설날·추석·부처님오신날은 빠져 있어요.', fix: '해당 연도 공휴일은 직접 확인해 주세요.', boxes: [] }); members(R, rules);
    step('바코드·QR 읽는 중…'); await X.tick(); try { await barcodes(R, pdfjs); } catch (e) { console.warn(e); }
  },
  cards: cards, parseRules: parseRules
};
})();
