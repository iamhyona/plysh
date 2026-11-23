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
  function say(t, bad) { if (st) { st.textContent = t; st.style.color = bad ? '#f04452' : ''; st.style.background = bad ? '#fdecec' : ''; } }
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
// 자간을 넓힌 글자(S E A S O N ' S)는 낱자 사이에 가짜 공백이 들어옴 → 단어로 다시 묶기. o[i] = 묶은 글자 i의 원래 위치
function wordSeg(w) { // 띄어쓰기 없이 붙은 대문자 덩어리를 사전·팀 규칙 단어로 나누기
  var U = w.toUpperCase(), n = U.length, best = [0]; if (n < 6) return null;
  var ok = function (x) { return DICTS[x] || (x.length >= 2 && WSEG[x]) || /^\d+$/.test(x) || (/'S$/.test(x) && DICTS[x.slice(0, -2)]); };
  var dp = [[]]; for (var i = 1; i <= n; i++) { dp[i] = null; for (var j = Math.max(0, i - 16); j < i; j++) if (dp[j] && ok(U.slice(j, i))) { dp[i] = dp[j].concat([i]); break; } }
  return dp[n] && dp[n].length > 1 ? dp[n].slice(0, -1) : null;
}
var WSEG = {};
function untrack(str) {
  var toks = str.split(/( +)/), words = toks.filter(function (t, i) { return i % 2 === 0 && t; });
  var single = words.filter(function (t) { return t.length === 1; }).length;
  var id = { s: str, o: str.split('').map(function (c, i) { return i; }), trk: false };
  if (words.length < 4 || single < words.length * 0.75) return id;
  var out = '', o = [], pos = 0, prevSingle = false;
  toks.forEach(function (t, i) {
    if (i % 2) { if (t.length >= 2 || !prevSingle || (toks[i + 1] || '').length > 1) { out += ' '; o.push(pos); } pos += t.length; return; }
    if (!t) return; for (var k = 0; k < t.length; k++) { out += t[k]; o.push(pos + k); } pos += t.length; prevSingle = t.length === 1;
  });
  // 공백 없이 붙은 덩어리 → 글자/숫자 경계, 사전 단어로 나누기
  var res = '', ro = [];
  out.split(/( )/).reduce(function (at, w) {
    if (w === ' ' || !w) { if (w) { res += w; ro.push(o[at]); } return at + w.length; }
    var cuts = {}; for (var k = 1; k < w.length; k++) if (/\d/.test(w[k]) !== /\d/.test(w[k - 1]) && /[A-Za-z0-9]/.test(w[k]) && /[A-Za-z0-9]/.test(w[k - 1])) cuts[k] = 1;
    var parts = [], st = 0; Object.keys(cuts).map(Number).forEach(function (c) { parts.push([st, c]); st = c; }); parts.push([st, w.length]);
    parts.forEach(function (pr, pi) {
      if (pi) { res += ' '; ro.push(o[at + pr[0]]); }
      var sub = w.slice(pr[0], pr[1]), sg = /[A-Za-z]/.test(sub) ? wordSeg(sub) : null;
      for (var k = 0; k < sub.length; k++) { if (sg && sg.indexOf(k) > -1) { res += ' '; ro.push(o[at + pr[0] + k]); } res += sub[k]; ro.push(o[at + pr[0] + k]); }
    });
    return at + w.length;
  }, 0);
  return { s: res, o: ro, trk: true };
}
function lines(P) {
  if (P._lines) return P._lines;
  var it = (P.tc || []).filter(function (t) { return !t.rot && t.s; }).slice().sort(function (a, b) { return b.y - a.y || a.x - b.x; }), L = [];
  // 같은 자리에 똑같이 겹친 글자(복사 남음) · 다른 면에 완전히 가려진 글자는 읽지 않음
  it = it.filter(function (t) { return !tcHidden(P, t); });
  it = it.filter(function (t, i) { for (var j = i - 1; j >= 0 && j >= i - 40; j--) { var o = it[j]; if (o.s === t.s && Math.abs(o.x - t.x) < 0.5 && Math.abs(o.y - t.y) < 0.5) return false; } return true; });
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
      // 낱자 조각이 대부분이면(자간 넓힘) 조각을 먼저 이어 붙인 뒤 한 번에 다시 묶기
      var oneCh = s.filter(function (t) { return t.s.trim().length === 1; }).length, trkItems = s.length >= 4 && oneCh >= s.length * 0.75;
      var gaps = []; s.forEach(function (t, i) { if (i) gaps.push(t.x - (s[i - 1].x + s[i - 1].w)); });
      var med = gaps.slice().sort(function (a, b) { return a - b; })[gaps.length >> 1] || 0;
      var txt = '', prev = null, offs = [], src = [];
      s.forEach(function (t) {
        if (prev) { var gap = t.x - (prev.x + prev.w), z = Math.min(prev.z, t.z), th = trkItems ? Math.max(z * 0.18, med + z * 0.15) : z * 0.18; if (gap > th && !/\s$/.test(txt) && !/^\s/.test(t.s)) { txt += ' '; src.push(null); } }
        var u = untrack(t.s); if (u.trk) t.trk = true;
        offs.push(txt.length); for (var k = 0; k < u.s.length; k++) src.push({ t: t, i: u.o[k] }); txt += u.s; prev = t;
      });
      if (trkItems) { // 조각 단위로 낱자가 흩어진 경우: 공백 없는 덩어리를 사전으로 다시 나누기
        var re = /[A-Za-z']{6,}/g, m, ins = [];
        while ((m = re.exec(txt))) { var sg = wordSeg(m[0]); if (sg) sg.forEach(function (k) { ins.push(m.index + k); }); }
        ins.sort(function (a, b) { return b - a; }).forEach(function (k) { txt = txt.slice(0, k) + ' ' + txt.slice(k); src.splice(k, 0, src[k]); });
        s.forEach(function (t) { t.trk = true; });
      }
      var b = [Math.min.apply(null, s.map(function (t) { return t.b[0]; })), Math.min.apply(null, s.map(function (t) { return t.b[1]; })), Math.max.apply(null, s.map(function (t) { return t.b[2]; })), Math.max.apply(null, s.map(function (t) { return t.b[3]; }))];
      return { t: txt, items: s, src: src, b: b, trk: trkItems || s.some(function (t) { return t.trk; }), z: Math.max.apply(null, s.map(function (t) { return t.z; })) };
    });
  });
  P._lines = L; return L;
}
function segsOf(P) { var r = []; lines(P).forEach(function (l) { l.segs.forEach(function (s) { r.push(s); }); }); return r; }
// 문자열 안 위치 → 글자 상자 (묶은 글자 → 원래 조각 · 원래 글자 위치)
function subBox(seg, idx, len) {
  var b = null, src = seg.src;
  if (!src) return seg.b;
  for (var i = Math.max(0, idx); i < Math.min(src.length, idx + len); i++) {
    var q = src[i]; if (!q) continue; var t = q.t, n = Math.max(1, t.s.length), cw = t.w / n, x0 = t.x + q.i * cw, bb = [x0, t.b[1], x0 + cw, t.b[3]];
    b = b ? [Math.min(b[0], bb[0]), Math.min(b[1], bb[1]), Math.max(b[2], bb[2]), Math.max(b[3], bb[3])] : bb;
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
  var dbl = []; all.forEach(function (s) { if (/^[\d\s.·\/]+$/.test(s.t)) return; /* 달력 날짜 줄 · 숫자 표처럼 칸 맞춤 공백 */ var re = / {2,}|　/g, m; while ((m = re.exec(s.t))) { if (m.index === 0 || m.index + m[0].length >= s.t.length) continue; dbl.push({ P: s.P, b: subBox(s, Math.max(0, m.index - 2), m[0].length + 4), s: s.t.slice(Math.max(0, m.index - 8), m.index + m[0].length + 8) }); } });
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
  // 인디자인 단축키(v · z · w 등)가 실수로 찍혀 혼자 떨어져 있는 영문 한 글자
  var stray = []; all.forEach(function (s) { if (s.trk || /^\s*([A-Za-z]\s+){2,}[A-Za-z]\s*$/.test(s.t)) return; /* S M T W T F S · W E D 처럼 낱글자를 띄워 쓴 머리글 · 자간 디자인 */ var re = /(^|[^A-Za-z0-9'’&.-])([vzwVZWtTpP])(?=$|[^A-Za-z0-9'’&.])/g, m; while ((m = re.exec(s.t))) {
    var at = m.index + m[1].length, ch = m[2];
    if (/[tTpP]/.test(ch) && !/^\s*$/.test(s.t.replace(ch, ''))) continue; // t · p는 그 글자만 따로 있는 덩어리일 때만
    stray.push({ P: s.P, b: subBox(s, Math.max(0, at - 2), 5), s: s.t.slice(Math.max(0, at - 10), at + 10), ch: ch }); } });
  perPage('vzw', 'warn', '혼자 떨어진 영문 한 글자', '단축키(v · z · w 등)가 잘못 찍힌 것 같으면 지우기', stray, function (L) { return L.length + '곳 · ' + L.slice(0, 3).map(function (h) { return '“' + cut(h.s, 20) + '”'; }).join(', '); });
  // 4) 오타 의심: 한글 자주 틀리는 말, 같은 단어 반복, 사전·문서 안 단어와 한두 글자 차이
  var tk = []; all.forEach(function (s) { TYPO_KO.forEach(function (t) { var re = new RegExp(t[0].source, 'g'), m; while ((m = re.exec(s.t))) tk.push({ P: s.P, b: subBox(s, m.index, m[0].length), w: m[0], to: t[1] }); }); });
  perPage('typoko', 'warn', '맞춤법 의심', '바른 표기를 확인해 주세요.', tk, function (L) { return L.slice(0, 4).map(function (h) { return h.w + ' → ' + h.to; }).join(', '); }, true);
  var rep = []; all.forEach(function (s) { var re = /(^|[\s(])([A-Za-z]{2,20}|[가-힣]{1,20})\s+\2(?=[\s.,)!?]|$)/g, m; while ((m = re.exec(s.t))) { var at = m.index + m[1].length; rep.push({ P: s.P, b: subBox(s, at, m[0].length - m[1].length), w: m[2] }); } });
  perPage('repword', 'warn', '같은 단어가 연달아 나와요', '하나를 지워야 하는지 확인해 주세요.', rep, function (L) { return L.slice(0, 4).map(function (h) { return '“' + h.w + ' ' + h.w + '”'; }).join(', '); }, true);
  var words = {}; all.forEach(function (s) { (s.t.match(/[A-Za-z][A-Za-z']{3,}/g) || []).forEach(function (w) { var u = w.toUpperCase(); (words[u] = words[u] || { n: 0, forms: {}, hits: [] }); words[u].n++; words[u].forms[w] = (words[u].forms[w] || 0) + 1; if (words[u].hits.length < 30) words[u].hits.push({ P: s.P, b: subBox(s, s.t.indexOf(w), w.length), s: s.t, trk: s.trk }); }); });
  var wk = Object.keys(words), sp = [];
  var ENW = window.PLYSH_ENW, isEn = function (u) { if (!ENW) return true; var l = u.toLowerCase().replace(/['’]s$/, '').replace(/['’]/g, ''); return ENW.has(l) || ENW.has(u.toLowerCase()); };
  // 영어 사전(27만 단어, 어형 변화 포함)에 있으면 정상 단어. 사전에 없는 단어만 팀 표기 · 업계 단어와 한두 글자 차이인지 봄
  if (ENW) wk.forEach(function (u) {
    if (isEn(u) || DICTS[u] || WSEG[u] || u.length < 5) return;
    if (/'S$/.test(u) && (DICTS[u.slice(0, -2)] || WSEG[u.slice(0, -2)])) return;
    var cand = DICT.concat(Object.keys(WSEG)), best = null;
    cand.forEach(function (d) { if (d.length >= 4 && Math.abs(d.length - u.length) <= 2) { var e = lev(u, d); if (e > 0 && e <= (u.length >= 8 ? 2 : 1) && (!best || e < best.e)) best = { d: d, e: e }; } });
    if (!best) wk.forEach(function (v) { if (v !== u && !isEn(v) && words[v].n >= 3 * words[u].n && words[v].n >= 3 && Math.abs(v.length - u.length) <= 1 && lev(u, v) === 1) best = { d: v, e: 1, doc: true }; });
    if (best && u.length >= 10 && words[u].hits.every(function (h) { return h.trk; })) best = null;
    if (best) words[u].hits.forEach(function (h) { sp.push({ P: h.P, b: h.b, w: Object.keys(words[u].forms)[0], to: best.d, doc: best.doc }); });
  });
  perPage('typoen', 'warn', '영문 철자 의심', '철자를 확인해 주세요.', sp, function (L) { return uniq(L.map(function (h) { return h.w + ' → ' + (h.doc ? h.to + '(문서에 더 많은 표기)' : h.to); })).slice(0, 4).join(', '); }, true);
  // 5) 대소문자 섞임 (같은 단어가 다른 대소문자로)
  var cs = [];
  wk.forEach(function (u) {
    var f = Object.keys(words[u].forms); if (f.length < 2) return;
    if (isEn(u) && !WSEG[u]) return; // 일반 영어 단어는 문장(첫 글자 대문자) · 제목(전부 대문자) 표기가 섞여도 정상. 고유명사만
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
  // 7-1) 아티스트 · 멤버 · 팀 이름 표기 흔들림: 띄어쓰기 · 하이픈 · 가운뎃점 다름, 영문 한두 글자 오타 (2026-11-23 실장님)
  (function () {
    var ENW = window.PLYSH_ENW, SEP = /[\s\-·.'’_]/;
    var lev = function (a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var d = []; for (var i = 0; i <= a.length; i++) { d[i] = [i]; } for (var j = 1; j <= b.length; j++) d[0][j] = j; for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
    var keyOf = function (x) { return x.toLowerCase().replace(/[\s\-·.'’_]/g, ''); };
    var var1 = [], typo = [], seen = {};
    rules.members.concat(rules.terms).forEach(function (r) {
      var ok = r.forms.concat(r.wrong);
      r.forms.forEach(function (f) {
        var k = keyOf(f), lat = /[A-Za-z]/.test(f) && !HANGUL.test(f); if (k.length < (lat ? 4 : 2)) return;
        all.forEach(function (sg) {
          var t = sg.t, map = [], nk = '';
          for (var i = 0; i < t.length; i++) { if (SEP.test(t.charAt(i))) continue; nk += t.charAt(i).toLowerCase(); map.push(i); }
          var at = nk.indexOf(k);
          while (at > -1) {
            var a = map[at], b = map[at + k.length - 1] + 1, raw = t.slice(a, b);
            var pre = t.charAt(a - 1) || '', post = t.charAt(b) || '';
            var wordOK = lat ? !/[A-Za-z]/.test(pre) && !/[A-Za-z]/.test(post) : true;
            if (wordOK && ok.indexOf(raw) < 0) {
              var sepRaw = raw.replace(/[^\s\-·.'’_]/g, ''), sepF = r.forms.map(function (x) { return x.replace(/[^\s\-·.'’_]/g, ''); });
              if (sepF.indexOf(sepRaw) < 0 && !seen[sg.P.i + raw]) { seen[sg.P.i + raw] = 1; var1.push({ P: sg.P, b: subBox(sg, a, b - a), s: raw, f: r.forms[0] }); }
            }
            at = nk.indexOf(k, at + 1);
          }
          // 영문 한두 글자 오타 (사전에 없는 단어만)
          if (!lat) return;
          var words = t.split(/\s+/).filter(Boolean), nW = f.split(/\s+/).length;
          for (var w = 0; w + nW <= words.length; w++) {
            var raw2 = words.slice(w, w + nW).join(' ').replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ''), k2 = keyOf(raw2);
            if (k2.length < 5 || k2 === k || ok.indexOf(raw2) > -1) continue;
            var dist = lev(k2, k); if (dist < 1 || dist > (k.length >= 9 ? 2 : 1)) continue;
            if (ENW && raw2.split(/\s+/).every(function (x) { return ENW.has(x.toLowerCase()); })) continue;
            if (rules.members.concat(rules.terms).some(function (o) { return o.forms.some(function (g) { return keyOf(g) === k2; }); })) continue; // 다른 정식 이름
            if (!seen['t' + sg.P.i + raw2]) { seen['t' + sg.P.i + raw2] = 1; var ix = t.indexOf(raw2); typo.push({ P: sg.P, b: subBox(sg, Math.max(0, ix), raw2.length), s: raw2, f: f }); }
          }
        });
      });
    });
    var byF = {}; var1.forEach(function (h) { (byF[h.f] = byF[h.f] || []).push(h); });
    Object.keys(byF).forEach(function (f) { perPage('namevar', 'err', '이름 표기가 달라요 (띄어쓰기 · 하이픈): ' + f, '정식 표기 “' + f + '”(으)로 맞추기', byF[f], function (L) { return uniq(L.map(function (h) { return '“' + h.s + '”'; })).join(', ') + ' ' + L.length + '곳'; }); });
    var byT = {}; typo.forEach(function (h) { (byT[h.f] = byT[h.f] || []).push(h); });
    Object.keys(byT).forEach(function (f) { perPage('nametypo', 'err', '이름 철자가 달라 보여요: ' + f, '정식 표기 “' + f + '” 확인 (다른 이름이면 팀 규칙에 추가하면 통과)', byT[f], function (L) { return uniq(L.map(function (h) { return '“' + h.s + '”'; })).join(', ') + ' ' + L.length + '곳'; }); });
  })();
  // 7-2) 팀 기본 표기법 (자가점검리스트 › 표기법체크, 2026-11-20)
  var STD = [
    ['CREDITS', /\bCREDIT\b/gi], ['1st · 2nd · 3rd', /\b(?:1(?:th|nd|rd)|2(?:th|st|rd)|3(?:th|st|nd))\b/gi], ['TRACK LIST', /\bTRACKLIST\b/gi],
    ['PHOTOCARD', /\bPHOTO\s+CARDS?\b/gi], ['PHOTO BOOK', /\bPHOTOBOOKS?\b/gi], ['RANDOM N OUT OF NN', /\bRANDOM\s+\d+\s*(?:OF|\/)\s*\d+/gi],
    ['POSTCARD', /\bPOST\s+CARDS?\b/gi], ['Digipack', /\bDigi\s+Pack\b/gi], ['Jewel Case', /\bJewelcase\b/gi], ['Mini Album', /\bMINI ALBUM\b/g],
    ['Folded Poster', /\bFolding\s+Poster\b/gi], ['Double-Sided Poster', /\bDouble\s+Sided?\s+Poster\b|\bDouble-Side\s+Poster\b/gi],
    ['Image Card', /\bImagecards?\b/gi], ['Sticker Set', /\bStickersets?\b/gi], ['CD-R', /\bCDR\b/gi]
  ];
  STD.forEach(function (d) {
    var hits = []; all.forEach(function (s) { var re = new RegExp(d[1].source, d[1].flags), m; while ((m = re.exec(s.t))) hits.push({ P: s.P, b: subBox(s, m.index, m[0].length), s: m[0] }); });
    perPage('stdterm', 'warn', '팀 표기법과 달라요: ' + d[0], '권장 “' + d[0] + '”', hits, function (L) { return uniq(L.map(function (h) { return '“' + h.s + '”'; })).join(', ') + ' ' + L.length + '곳'; });
  });
  // 7-3) 수량 표기 통일 (1EA · 1 EA · 1ea · 1PCS 섞임)
  var qf = {}; all.forEach(function (s) { var re = /\d(\s*)(EA|Ea|ea|PCS|Pcs|pcs|SET|Set|set)\b/g, m; while ((m = re.exec(s.t))) { var k = (m[1] ? '숫자 띄고 ' : '숫자 붙여 ') + m[2]; (qf[k] = qf[k] || []).push({ P: s.P, b: subBox(s, m.index, m[0].length), s: s.t.slice(Math.max(0, m.index - 3), m.index + m[0].length) }); } });
  var qk = Object.keys(qf).sort(function (x, y) { return qf[y].length - qf[x].length; });
  if (qk.length > 1) qk.slice(1).forEach(function (k) { perPage('qtyunit', 'warn', '수량 표기 방식이 섞여 있어요', '권장 문서 대부분과 같은 “' + qk[0] + '” (' + qf[qk[0]].length + '곳)', qf[k], function (L) { return k + ' ' + L.length + '곳 · ' + L.slice(0, 3).map(function (h) { return '“' + h.s + '”'; }).join(', '); }); });
  // 7-4) 치수 소수점 자릿수 통일 (55.5mm 와 55.50mm 섞임)
  var dp = {}; all.forEach(function (s) { var re = /\d+\.(\d+)\s*(mm|cm)\b/g, m; while ((m = re.exec(s.t))) { var n = m[1].length; (dp[n] = dp[n] || []).push({ P: s.P, b: subBox(s, m.index, m[0].length), s: m[0] }); } });
  var dk = Object.keys(dp).sort(function (x, y) { return dp[y].length - dp[x].length; });
  if (dk.length > 1) dk.slice(1).forEach(function (k) { perPage('decmix', 'adv', '치수 소수점 자릿수가 섞여 있어요', '권장 반올림 기준을 하나로 (대부분 소수점 ' + dk[0] + '자리)', dp[k], function (L) { return '소수점 ' + k + '자리 ' + L.length + '곳 · ' + uniq(L.map(function (h) { return h.s; })).slice(0, 4).join(', '); }); });
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
  var cr = /(©|℗|Ⓟ|Ⓒ|\(c\)|\(p\)\s*&|copyright|all rights reserved|판권|무단\s*(복제|전재|배포)|unauthorized|manufactured by|distributed by)/i, crP = [];
  R.pages.forEach(function (P) { if (segsOf(P).some(function (s) { return cr.test(s.t); })) crP.push(P.i); });
  var txt = R.pages.some(function (P) { return (P.tc || []).length; });
  if (txt && !crP.length) issue({ page: null, sev: 'warn', cat: 'text', code: 'nocopy', title: '리걸 문구 없음', detail: '©, Ⓟ&Ⓒ, All rights reserved 없음', fix: '필요 품목인지 확인', boxes: [], sus: true });
  if (crP.length) {
    var years = {}; R.pages.forEach(function (P) { segsOf(P).forEach(function (s) { if (!/©|\(c\)|copyright/i.test(s.t)) return; var y = s.t.match(/(19|20)\d{2}/); if (y) (years[y[0]] = years[y[0]] || []).push({ P: P, s: s }); }); });
    var ys = Object.keys(years).sort(function (a, b) { return years[b].length - years[a].length; });
    if (ys.length > 1) ys.slice(1).forEach(function (y) { years[y].forEach(function (x) { issue({ page: x.P.i, sev: 'warn', cat: 'text', code: 'copyyear', title: '저작권 연도가 다른 페이지와 달라요', detail: '이 페이지 ' + y + ' · 다른 페이지 ' + ys[0] + ' (' + years[ys[0]].length + '곳)', fix: '연도를 확인해 주세요.', boxes: [x.s.b] }); }); });
    issue({ page: null, sev: 'info', cat: 'text', code: 'copyok', title: '리걸 문구', detail: crP.length + '개 페이지에 있어요 (' + crP.slice(0, 10).map(function (p) { return p + 1; }).join(',') + '쪽)', fix: '', boxes: [] });
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
  var nMem = +((rules.info || {})['인원'] || 0) || (rules.members.length || 0);
  if (nMem === 1) return; // 솔로 아티스트는 배분 검사 없음
  var setProd = R.prod === 'photobook' || R.prod === 'photocard' || R.prod === 'calendar' || R.prod === 'book' || /엽서|포스트\s*카드|post\s*card|폴라로이드|polaroid|증명\s*사진|포카|티켓|ticket|미니\s*포스터|스티커|cut/i.test((R.prodName || '') + ' ' + (R.file || ''));
  // 1) 이름 캡션이 있으면 이름별로 단독 컷 수 (사진 1장에 얼굴 1개 + 이름)
  var byName = {}, seenI = {};
  R.faces.forEach(function (F) { if (!F.cap) return; var k = F.img || ('p' + F.page); if (seenI[k]) return; var n = (imgFaces[k] || []).filter(function (x) { return x.score > 0.6; }).length; if (n !== 1) return; seenI[k] = 1; byName[F.cap.name] = (byName[F.cap.name] || 0) + 1; });
  var named = Object.keys(byName);
  if (named.length >= 2 && setProd) {
    rules.members.forEach(function (r) { if (byName[r.name] == null && named.length >= Math.max(2, rules.members.length - 1)) byName[r.name] = 0; });
    var cv = {}; Object.keys(byName).forEach(function (k) { cv[byName[k]] = (cv[byName[k]] || 0) + 1; });
    var md = +Object.keys(cv).sort(function (a, b) { return cv[b] - cv[a] || b - a; })[0], offN = Object.keys(byName).filter(function (k) { return byName[k] !== md; });
    if (offN.length) { issue({ page: null, sev: 'warn', cat: 'face', code: 'count', title: '멤버별 컷 수가 달라요 (이름 기준)', detail: Object.keys(byName).map(function (k) { return k + ' ' + byName[k] + '컷'; }).join(' · ') + ' · 보통 ' + md + '컷', fix: '그룹 품목은 멤버별 같은 수로 배분. 의도한 배분이면 확인 후 통과', boxes: [], top: true }); return; }
  }
  // 2) 이름이 없으면 얼굴 묶음 기준
  if (main.length >= 2 && setProd) {
    var cnt = {}; main.forEach(function (p) { cnt[p.solo] = (cnt[p.solo] || 0) + 1; });
    var mode = +Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; })[0];
    var off = main.filter(function (p) { return p.solo !== mode; });
    var many = nMem >= 2 && main.length > nMem + 1;
    if (off.length) issue({ page: null, sev: 'warn', cat: 'face', code: 'count', title: '멤버별 단독 컷 수가 달라요', detail: main.map(function (p) { return p.name + ' ' + p.solo + '컷'; }).join(' · ') + ' · 보통 ' + mode + '컷' + (many ? ' · 얼굴 묶음 ' + main.length + '개가 멤버 수(' + nMem + '명)보다 많아 표에서 묶음 확인 필요' : ''), fix: '그룹 품목은 멤버별 같은 수로 배분. 얼굴 자동 인식이라 표에서 묶음이 맞는지도 확인', boxes: [], sus: true, top: true });
  }
}

// ── 바코드·ISBN·QR ──
var zxP = null;
function zx() { if (!zxP) zxP = (window.ZXing ? Promise.resolve(true) : new Promise(function (ok) { var s = document.createElement('script'); s.src = LIBS.zxing; s.onload = function () { ok(true); }; s.onerror = function () { ok(false); }; document.head.appendChild(s); })); return zxP; }
async function barcodes(R, pdfjs) {
  var issue = X.issue, MM = X.MM, mm = X.mm, cands = [];
  R.pages.forEach(function (P) {
    var barObj = P.fills.concat(P.strokes).filter(function (f) { return f.box && !f.ink.white; }); // 선(획)으로 그린 막대도
    var bars = barObj.filter(function (f) { var w = f.box[2] - f.box[0], h = f.box[3] - f.box[1]; return w < 1.2 * MM && h > 6 * MM && h < 40 * MM; });
    var barsH = barObj.filter(function (f) { var w = f.box[2] - f.box[0], h = f.box[3] - f.box[1]; return h < 1.2 * MM && w > 6 * MM && w < 40 * MM; }); // 90도 돌린 바코드
    var sq = P.fills.filter(function (f) { var w = f.box[2] - f.box[0], h = f.box[3] - f.box[1]; return w < 2.5 * MM && h < 2.5 * MM && Math.abs(w - h) < 0.2 * MM && !f.ink.white; });
    var isbn = segsOf(P).filter(function (s) { return /ISBN|ISSN|97[89][\d\- ]{10,}/i.test(s.t); });
    function cluster(list, minN) { // 붙어 있는 덩어리
      var out = []; list.forEach(function (f) { var c = out.find(function (o) { return f.box[0] < o[2] + 4 * MM && f.box[2] > o[0] - 4 * MM && f.box[1] < o[3] + 4 * MM && f.box[3] > o[1] - 4 * MM; }); if (c) { c[0] = Math.min(c[0], f.box[0]); c[1] = Math.min(c[1], f.box[1]); c[2] = Math.max(c[2], f.box[2]); c[3] = Math.max(c[3], f.box[3]); c.n++; } else { var o = f.box.slice(); o.n = 1; out.push(o); } }); return out.filter(function (o) { return o.n >= minN; });
    }
    cluster(bars, 20).forEach(function (b) { cands.push({ P: P, b: b, kind: 'bar', mem: bars.filter(function (f) { return f.box[0] >= b[0] - 0.1 && f.box[2] <= b[2] + 0.1 && f.box[1] >= b[1] - 0.1 && f.box[3] <= b[3] + 0.1; }) }); });
    cluster(barsH, 20).forEach(function (b) { if (!cands.some(function (c) { return c.P === P && b[0] < c.b[2] && b[2] > c.b[0] && b[1] < c.b[3] && b[3] > c.b[1]; })) cands.push({ P: P, b: b, kind: 'bar', rot: true, mem: barsH.filter(function (f) { return f.box[0] >= b[0] - 0.1 && f.box[2] <= b[2] + 0.1 && f.box[1] >= b[1] - 0.1 && f.box[3] <= b[3] + 0.1; }) }); });
    P.fills.forEach(function (f) { if (!f.vb || !f.box || f.ink.white) return; var w = f.box[2] - f.box[0], h = f.box[3] - f.box[1]; if (Math.max(w, h) < 12 * MM || Math.max(w, h) > 90 * MM || Math.min(w, h) < 3 * MM) return; if (cands.some(function (c) { return c.P === P && f.box[0] < c.b[2] && f.box[2] > c.b[0] && f.box[1] < c.b[3] && f.box[3] > c.b[1]; })) return; var o = f.box.slice(); o.n = f.vb; cands.push({ P: P, b: o, kind: 'bar', one: true, ve: f.ve, rot: (f.box[3] - f.box[1]) > (f.box[2] - f.box[0]) }); }); // 한 패스로 된 바코드 (읽힐 때만 알림)
    cluster(sq, 60).forEach(function (b) { // QR은 정사각형 · 모듈 크기 일정 · 채움 30~75% (FSC 같은 로고 제외)
      var w = b[2] - b[0], h = b[3] - b[1]; if (w < 6 * MM || h / w < 0.8 || h / w > 1.25) return;
      var inb = sq.filter(function (f) { return f.box[0] >= b[0] - 0.01 && f.box[2] <= b[2] + 0.01 && f.box[1] >= b[1] - 0.01 && f.box[3] <= b[3] + 0.01; });
      var sz = inb.map(function (f) { return f.box[2] - f.box[0]; }).sort(function (x, y) { return x - y; }), mod = sz[Math.floor(sz.length / 2)] || 1;
      var same = sz.filter(function (v) { return Math.abs(v - mod) < 0.15 * mod || Math.abs(v / mod - Math.round(v / mod)) < 0.15; }).length / Math.max(1, sz.length);
      var cover = inb.reduce(function (a, f) { return a + (f.box[2] - f.box[0]) * (f.box[3] - f.box[1]); }, 0) / (w * h);
      if (same < 0.8 || cover < 0.25 || cover > 0.8) return;
      cands.push({ P: P, b: b, kind: 'qr' });
    });
    (P.images || []).forEach(function (im) { /* 이미지 속 바코드는 아래 전체 페이지 스캔으로 */ });
    if (isbn.length) P._isbn = isbn;
  });
  var pagesISBN = R.pages.filter(function (P) { return P._isbn; });
  // ISBN 숫자 자체 검증
  pagesISBN.forEach(function (P) { P._isbn.forEach(function (s) { var d = (s.t.match(/97[89][\d\- ]{10,16}/) || [''])[0].replace(/\D/g, ''); if (d.length === 13 && !ean13ok(d)) issue({ page: P.i, sev: 'err', cat: 'print', code: 'isbnsum', title: 'ISBN 숫자의 검증 번호가 틀려요', detail: d, fix: 'ISBN 번호를 다시 확인해 주세요.', boxes: [s.b] }); }); });
  // 찾은 자리가 없는 페이지는 통째로 읽기: 이미지로 넣은 바코드, 모양으로 못 찾은 바코드 (파일이 12p 이하이거나 ISBN 글자가 있는 페이지, 최대 12p)
  var scanPages = R.pages.filter(function (P) { return !cands.some(function (c) { return c.P === P; }) && (R.pages.length <= 12 || P._isbn); }).slice(0, 12);
  if (!cands.length && !scanPages.length) return;
  var ok = await zx(); if (!ok) { issue({ page: null, sev: 'info', cat: 'print', code: 'bcload', title: '바코드 판독 도구를 불러오지 못했어요', detail: '', fix: '', boxes: [] }); return; }
  var hints = new Map(); hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
  var reader = new ZXing.MultiFormatReader(); reader.setHints(hints);
  async function decodeRegion(P, b) {
    var pg = await pdfjs.getPage(P.i + 1), pad = 6 * MM, bw = b[2] - b[0] + 2 * pad, bh = b[3] - b[1] + 2 * pad, scale = Math.min(8, 1400 / Math.max(bw, bh));
    var vp = pg.getViewport({ scale: scale }), cv = document.createElement('canvas'), r = X.toPxVp(vp, [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]);
    cv.width = Math.max(10, Math.round(r[2] - r[0])); cv.height = Math.max(10, Math.round(r[3] - r[1]));
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.translate(-r[0], -r[1]);
    await pg.render({ canvasContext: cx, viewport: vp, intent: 'print' }).promise;
    var res = readCv(cv); if (!res) decodeRegion.last = cv; return res;
  }
  function readOnce(cv) { try { var src = new ZXing.HTMLCanvasElementLuminanceSource(cv), bmp = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src)); var res = reader.decode(bmp); 
return { text: res.getText(), fmt: ZXing.BarcodeFormat[res.getBarcodeFormat()] }; } catch (e) { return null; } }
  function rot90(cv) { var o = document.createElement('canvas'); o.width = cv.height; o.height = cv.width; var x = o.getContext('2d', { willReadFrequently: true }); x.translate(o.width, 0); x.rotate(Math.PI / 2); x.drawImage(cv, 0, 0); return o; }
  function readCv(cv) { return readOnce(cv) || readOnce(rot90(cv)); } // 돌려 놓은 바코드도 읽기
  async function decodePage(P) {
    var pg = await pdfjs.getPage(P.i + 1), v1 = pg.getViewport({ scale: 1 }), scale = Math.min(4, 4000 / Math.max(v1.width, v1.height));
    var vp = pg.getViewport({ scale: scale }), cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: cx, viewport: vp, intent: 'print' }).promise;
    var res = readCv(cv), W = cv.width, H = cv.height, tw = Math.round(W / 2), th = Math.round(H / 2);
    // 페이지 전체로는 작은 바코드를 놓쳐서, 반 크기 칸을 겹쳐 가며 다시 읽기 (3×3)
    for (var ty = 0; !res && ty + th <= H + 1; ty += Math.round(th / 2)) for (var tx = 0; !res && tx + tw <= W + 1; tx += Math.round(tw / 2)) {
      var tc = document.createElement('canvas'); tc.width = tw; tc.height = th; tc.getContext('2d', { willReadFrequently: true }).drawImage(cv, tx, ty, tw, th, 0, 0, tw, th); res = readCv(tc); tc.width = tc.height = 1;
    }
    cv.width = cv.height = 1; return res;
  }
  // QR 모서리 표식(검-흰-검검검-흰-검 1:1:3:1:1)이 3곳 이상 있어야 진짜 QR로 봄
  function hasFinders(cv) {
    var W = cv.width, H = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H).data, hits = [];
    for (var y = 0; y < H; y += 2) {
      var runs = [], cur = -1, len = 0, x0 = 0;
      for (var x = 0; x < W; x++) { var i = (y * W + x) * 4, k = (d[i] + d[i + 1] + d[i + 2]) < 384 ? 1 : 0; if (k === cur) len++; else { if (cur >= 0) runs.push([cur, len, x0]); cur = k; len = 1; x0 = x; } }
      runs.push([cur, len, x0]);
      for (var r = 0; r + 4 < runs.length; r++) {
        if (runs[r][0] !== 1) continue; var u = (runs[r][1] + runs[r + 1][1] + runs[r + 2][1] + runs[r + 3][1] + runs[r + 4][1]) / 7; if (u < 1.5) continue;
        var ok = [1, 1, 3, 1, 1].every(function (m, j) { return Math.abs(runs[r + j][1] - m * u) < 0.5 * m * u + 1; });
        if (ok) hits.push([runs[r + 2][2] + runs[r + 2][1] / 2, y, u]);
      }
    }
    var groups = []; hits.forEach(function (h) { var g = groups.find(function (g) { return Math.abs(g.x - h[0]) < 3 * h[2] && Math.abs(g.y - h[1]) < 5 * h[2]; }); if (g) { g.n++; g.y = h[1]; } else groups.push({ x: h[0], y: h[1], n: 1 }); });
    return groups.filter(function (g) { return g.n >= 2; }).length >= 3;
  }
  for (var i = 0; i < cands.length && i < 40; i++) {
    var c = cands[i], res = await decodeRegion(c.P, c.b);
    if (!res && c.one) continue;
    if (!res && c.kind === 'qr' && !(decodeRegion.last && hasFinders(decodeRegion.last))) continue; // QR 모양이 아니면(로고 등) 알리지 않음
    if (!res) { issue({ page: c.P.i, sev: 'err', cat: 'print', code: 'bcfail', title: (c.kind === 'qr' ? 'QR코드' : '바코드') + '가 읽히지 않아요', detail: '크기 ' + mm(c.b[2] - c.b[0]).toFixed(1) + '×' + mm(c.b[3] - c.b[1]).toFixed(1) + 'mm', fix: c.kind === 'qr' ? '여백(조용한 영역)과 크기(최소 15mm)를 확인해 주세요.' : '가장 가는 바 폭(권장 X 0.264mm · 80% 이상), 바 색(K100), 여백을 확인해 주세요.', boxes: [c.b], sus: true }); continue; }
    c.res = res;
    var dg = String(res.text).replace(/\D/g, ''), chk = null;
    if (/EAN_13|EAN_8|UPC_A|UPC_E/.test(res.fmt) && dg.length >= 8) { var sm = 0; for (var qq = dg.length - 2, ww = 3; qq >= 0; qq--, ww = 4 - ww) sm += +dg[qq] * ww; chk = (10 - sm % 10) % 10 === +dg[dg.length - 1]; }
    var bw = mm(c.b[2] - c.b[0]), bh = mm(c.b[3] - c.b[1]);
    var msg = res.fmt + ' · ' + res.text + ' · ' + bw.toFixed(1) + '×' + bh.toFixed(1) + 'mm' + (chk === null ? '' : chk ? ' · 체크 숫자 맞음' : ' · 체크 숫자 틀림'), bad = chk === false ? '바코드 체크 숫자 틀림' : '';
    if (/EAN_13/.test(res.fmt) && c.P._isbn) { var t = c.P._isbn.map(function (s) { return s.t.replace(/\D/g, ''); }).join(' '); if (t.indexOf(res.text) < 0) bad = '바코드 번호(' + res.text + ')가 ISBN 글자와 달라요'; }
    var nMod = /EAN_13|UPC_A/.test(res.fmt) ? 95 : /EAN_8/.test(res.fmt) ? 67 : /UPC_E/.test(res.fmt) ? 51 : 0;
    if (nMod && c.kind !== 'qr') { // 기준 = 가장 가는 검은 바 · 가장 좁은 흰 칸 실측 mm (GS1 소매 POS X 0.264mm 이상), 높이 줄이기(트렁케이션) 따로
      var rot = !!c.rot, iv = [];
      if (c.ve) { var E = rot ? c.ve.y : c.ve.x; if (E && E.length >= 4 && E.length % 2 === 0) for (var ei = 0; ei < E.length; ei += 2) iv.push([E[ei], E[ei + 1]]); }
      else if (c.mem && c.mem.length) { c.mem.forEach(function (f) { iv.push(rot ? [f.box[1], f.box[3]] : [f.box[0], f.box[2]]); }); }
      iv.sort(function (p, q) { return p[0] - q[0]; }); var mg = []; iv.forEach(function (v) { var l = mg[mg.length - 1]; if (l && v[0] <= l[1] + 0.01) l[1] = Math.max(l[1], v[1]); else mg.push(v.slice()); });
      var minB = 0, minS = 0;
      if (mg.length >= 10) { minB = Math.min.apply(null, mg.map(function (v) { return v[1] - v[0]; })); var sp = []; for (var gi = 1; gi < mg.length; gi++) sp.push(mg[gi][0] - mg[gi - 1][1]); minS = Math.min.apply(null, sp); minB = mm(minB); minS = mm(minS); }
      var Lb = Math.max(bw, bh), Sb = Math.min(bw, bh), xm = minB > 0 && minS > 0 ? (minB + minS) / 2 : Lb / nMod, mag = xm / 0.33, hNom = (nMod === 95 ? 22.85 : nMod === 67 ? 18.23 : 22.85) * mag, hr = Math.max(0, Sb - 5 * xm) / hNom; // 가드 바가 5X 더 길게 내려옴
      var bwr = minB > 0 ? (minS - minB) / 2 : null;
      // 양옆 여백 (콰이어트 존): 바코드 옆에 붙은 다른 그림 · 글자 (배경 · 흰 상자 · 숫자 글자는 제외)
      var B0 = rot ? c.b[1] : c.b[0], B1 = rot ? c.b[3] : c.b[2], C0 = rot ? c.b[0] : c.b[1], C1 = rot ? c.b[2] : c.b[3], gapL = 99, gapR = 99;
      var others = c.P.fills.concat(c.P.strokes, c.P.images || []).filter(function (f) { return f.box && !(f.ink && f.ink.white) && (c.mem ? c.mem.indexOf(f) < 0 : true) && !(f.vb && f.box[0] === c.b[0] && f.box[1] === c.b[1]); }).map(function (f) { return f.box; })
        .concat(segsOf(c.P).filter(function (t) { return !/^[\d\s>-]*$/.test(t.t); }).map(function (t) { return t.b; }));
      others.forEach(function (o) {
        if (o[0] <= c.b[0] + 0.1 && o[1] <= c.b[1] + 0.1 && o[2] >= c.b[2] - 0.1 && o[3] >= c.b[3] - 0.1) return; // 바코드를 감싼 배경
        var a0 = rot ? o[1] : o[0], a1 = rot ? o[3] : o[2], d0 = rot ? o[0] : o[1], d1 = rot ? o[2] : o[3];
        if (d1 <= C0 || d0 >= C1) return;
        if (a1 <= B0 + 0.1) gapL = Math.min(gapL, mm(B0 - a1)); else if (a0 >= B1 - 0.1) gapR = Math.min(gapR, mm(a0 - B1));
      });
      var qL = 11 * xm, qR = 7 * xm, qBad = (gapL < qL - 0.15 ? '왼쪽 ' + gapL.toFixed(1) + 'mm (필요 ' + qL.toFixed(1) + ')' : '') + (gapR < qR - 0.15 ? (gapL < qL - 0.15 ? ' · ' : '') + '오른쪽 ' + gapR.toFixed(1) + 'mm (필요 ' + qR.toFixed(1) + ')' : '');
      var xs = (minB > 0 ? '가장 가는 검은 바 ' + minB.toFixed(3) + 'mm · 가장 좁은 흰 칸 ' + minS.toFixed(3) + 'mm · ' : '') + 'X 약 ' + xm.toFixed(3) + 'mm (배율 약 ' + Math.round(mag * 100) + '%)' + (bwr !== null && Math.abs(bwr) >= 0.005 ? ' · 바 폭 보정(BWR) 약 ' + bwr.toFixed(3) + 'mm' : '') + ' · 높이 ' + Sb.toFixed(1) + 'mm (그 배율 기준 ' + Math.round(hr * 100) + '%)';
      msg += ' · ' + xs;
      if (mag < 0.6) issue({ page: c.P.i, sev: 'err', cat: 'print', code: 'bcsize', title: '바코드 바가 너무 가늘어요 (X 약 ' + xm.toFixed(2) + 'mm)', detail: xs, fix: '권장 가장 가는 바 · 흰 칸 0.264mm 이상 (80%). 0.2mm 아래는 번짐으로 칸이 메워짐. 출력물 스캔 테스트 · 인쇄소 BWR 확인', boxes: [c.b] });
      else if (mag < 0.795) issue({ page: c.P.i, sev: 'warn', cat: 'print', code: 'bcsize', title: '바코드 X 약 ' + xm.toFixed(3) + 'mm · GS1 소매 최소(0.264mm) 미만', detail: xs, fix: '출력물로 휴대폰 · 납품처 스캐너 테스트. 인쇄소 BWR 반영. 비도공지 · 실크 인쇄면 0.264mm 이상 권장', boxes: [c.b] });
      if (minB > 0 && minS > 0 && minS < minB - 0.01) issue({ page: c.P.i, sev: 'warn', cat: 'print', code: 'bcbwr', title: '바코드 흰 칸이 검은 바보다 좁아요', detail: xs, fix: '인쇄하면 잉크가 번져 바가 굵어지고 흰 칸은 더 좁아짐. 바 폭 보정(BWR)은 검은 바를 가늘게, 흰 칸은 넓게', boxes: [c.b] });
      if (qBad) issue({ page: c.P.i, sev: 'warn', cat: 'print', code: 'bcquiet', title: '바코드 양옆 여백(콰이어트 존)이 좁아요', detail: qBad + ' · 여백 = 왼쪽 11X · 오른쪽 7X', fix: '여백 안 글자 · 선 · 무늬 · 재단선 치우기. 숫자(사람이 읽는 번호)는 괜찮음', boxes: [c.b] });
      if (hr < 0.5) issue({ page: c.P.i, sev: 'warn', cat: 'print', code: 'bctrunc', title: '바코드 높이를 많이 줄였어요 (약 ' + Math.round(hr * 100) + '%)', detail: xs, fix: '권장 원래 높이의 50% 이상. 대형마트 평판(전방향) 스캐너는 짧으면 못 읽음. 손 스캐너 납품처면 출력 테스트로 확인', boxes: [c.b] });
      else if (hr < 0.9) issue({ page: c.P.i, sev: 'adv', cat: 'print', code: 'bctrunc', title: '바코드 높이 줄임 (약 ' + Math.round(hr * 100) + '%)', detail: xs, fix: 'GS1 소매 기준은 높이 줄이기 불가. 평판 스캐너 납품처면 높이 유지', boxes: [c.b] });
    }
    try { inkOK(c.P, c.b, c.kind === 'qr' ? 'QR코드' : '바코드', 'bcink', 'warn'); } catch (e) {}
    issue({ page: c.P.i, sev: bad ? 'err' : 'info', cat: 'print', code: 'bcok', title: bad || ((c.kind === 'qr' ? 'QR코드' : '바코드') + ' 읽힘'), detail: msg, fix: bad ? '바코드와 번호를 다시 확인해 주세요.' : (c.kind === 'qr' ? '주소가 맞는지 열어 봐 주세요.' : ''), boxes: [c.b], bc: { fmt: res.fmt, text: res.text, w: bw, h: bh, chk: chk, kind: c.kind } });
  }
  var pageHit = {};
  for (var si = 0; si < scanPages.length; si++) {
    var SP = scanPages[si], pr = null; try { pr = await decodePage(SP); } catch (e) { console.warn(e); }
    if (!pr) continue; pageHit[SP.i] = 1;
    var pd = String(pr.text).replace(/\D/g, ''), pchk = null;
    if (/EAN_13|EAN_8|UPC_A|UPC_E/.test(pr.fmt) && pd.length >= 8) { var ps = 0; for (var q2 = pd.length - 2, w2 = 3; q2 >= 0; q2--, w2 = 4 - w2) ps += +pd[q2] * w2; pchk = (10 - ps % 10) % 10 === +pd[pd.length - 1]; }
    var pbad = pchk === false ? '바코드 체크 숫자 틀림' : '';
    if (/EAN_13/.test(pr.fmt) && SP._isbn) { var pt = SP._isbn.map(function (s) { return s.t.replace(/\D/g, ''); }).join(' '); if (pt.indexOf(pr.text) < 0) pbad = '바코드 번호(' + pr.text + ')가 ISBN 글자와 달라요'; }
    var isQ = /QR/.test(pr.fmt);
    issue({ page: SP.i, sev: pbad ? 'err' : 'info', cat: 'print', code: 'bcok', title: pbad || ((isQ ? 'QR코드' : '바코드') + ' 읽힘'), detail: pr.fmt + ' · ' + pr.text + (pchk === null ? '' : pchk ? ' · 체크 숫자 맞음' : ' · 체크 숫자 틀림') + ' · 페이지 전체에서 읽음 (이미지 바코드일 수 있어요)', fix: pbad ? '바코드와 번호를 다시 확인해 주세요.' : (isQ ? '주소가 맞는지 열어 봐 주세요.' : '크기·바 색은 원본에서 확인'), boxes: [], bc: { fmt: pr.fmt, text: pr.text, w: 0, h: 0, chk: pchk, kind: isQ ? 'qr' : 'bar' } });
  }
  pagesISBN.forEach(function (P) { if (!pageHit[P.i] && !cands.some(function (c) { return c.P === P; })) issue({ page: P.i, sev: 'warn', cat: 'print', code: 'isbnbar', title: 'ISBN 글자는 있는데 바코드를 찾지 못했어요', detail: '이미지로 들어간 바코드면 판독을 못 했을 수 있어요.', fix: '바코드가 있는지, 벡터(K100)로 들어갔는지 확인해 주세요.', boxes: P._isbn.map(function (s) { return s.b; }), sus: true }); });
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
function monOf(str) { // 글자 → 월 번호
  var m = null; MON.forEach(function (n, i) { if (m) return; if (new RegExp('\\b' + n + '\\b', 'i').test(str) || new RegExp('\\b' + n.slice(0, 3) + '\\b').test(str)) m = i + 1; });
  if (!m) { var k = str.match(/(?:^|[^\d])(\d{1,2})\s*월/); if (k && +k[1] >= 1 && +k[1] <= 12) m = +k[1]; }
  return m;
}
// 달력 검수: 달(날짜 묶음)마다 따로, 그 해 실제 달력과 대조. 달끼리 비교하지 않음
function calendar(R, rules) {
  var issue = X.issue, MM = X.MM, months = [];
  R.pages.forEach(function (P) {
    var items0 = (P.tc || []).filter(function (t) { return !t.rot && /^\s*\d{1,2}\s*$/.test(t.s) && +t.s >= 1 && +t.s <= 31; });
    if (items0.length < 20) return;
    // 위에 덮인(안 보이는) 날짜 글자는 빼고 읽음 — 예전 연도 날짜가 카드 밑에 남은 경우 (2026-11-23 예나 탁상 2028 연간)
    var hid = items0.filter(function (t) { return tcHidden(P, t); });
    var items = items0.filter(function (t) { return hid.indexOf(t) < 0; });
    if (hid.length >= 7) issue({ page: P.i, sev: 'warn', cat: 'cal', code: 'calhidden', title: '다른 면 밑에 가려진 날짜 글자가 남아 있어요', detail: hid.length + '개 · 화면엔 안 보이지만 파일 안에 있음 (예전 연도 · 다른 달 날짜일 수 있음)', fix: '안 쓰는 날짜 글자 삭제 (가린 면이 빠지면 그대로 인쇄됨)', boxes: hid.slice(0, 12).map(function (t) { return t.b; }) });
    if (items.length < 20) return;
    var zs = {}; items.forEach(function (t) { var k = Math.round(t.z); zs[k] = (zs[k] || 0) + 1; }); var zk = +Object.keys(zs).sort(function (a, b) { return zs[b] - zs[a]; })[0];
    var D = items.filter(function (t) { return Math.abs(t.z - zk) <= Math.max(1, zk * 0.12); });
    if (D.length < 20) return;
    // 줄 → 줄 안에서 왼쪽부터. 가로로 나란한 달력 두 개는 큰 간격으로 나눔
    var rows = []; D.forEach(function (t) { var y = (t.b[1] + t.b[3]) / 2, r = rows.find(function (r) { return Math.abs(r.y - y) < zk * 0.9; }); if (!r) { r = { y: y, items: [] }; rows.push(r); } r.items.push(t); });
    rows.sort(function (a, b) { return b.y - a.y; });
    var cx = function (t) { return (t.b[0] + t.b[2]) / 2; };
    var pitch = []; rows.forEach(function (r) { r.items.sort(function (a, b) { return cx(a) - cx(b); }); for (var i = 1; i < r.items.length; i++) pitch.push(cx(r.items[i]) - cx(r.items[i - 1])); });
    pitch.sort(function (a, b) { return a - b; }); var pt = pitch[pitch.length >> 1] || zk * 3;
    // 묶음(블록) = x 범위가 겹치는 줄들. 간격이 pt*2.5보다 크면 다른 블록
    var pieces = []; rows.forEach(function (r, ri) { var cur = null; r.items.forEach(function (t) { if (!cur || cx(t) - cx(cur.items[cur.items.length - 1]) > pt * 2.5) { cur = { y: r.y, ri: ri, items: [] }; pieces.push(cur); } cur.items.push(t); }); });
    var grids = []; pieces.forEach(function (pc) {
      var x0 = cx(pc.items[0]), x1 = cx(pc.items[pc.items.length - 1]);
      var g = grids.find(function (g) { return x0 < g.x1 + pt * 0.6 && x1 > g.x0 - pt * 0.6 && g.lastY - pc.y < zk * 6; });
      if (!g) { g = { x0: x0, x1: x1, pieces: [], lastY: pc.y }; grids.push(g); }
      g.pieces.push(pc); g.x0 = Math.min(g.x0, x0); g.x1 = Math.max(g.x1, x1); g.lastY = pc.y;
    });
    var segs = segsOf(P);
    grids.forEach(function (g) {
      var seq = []; g.pieces.forEach(function (pc, ri) { pc.items.forEach(function (t) { seq.push({ d: +t.s, t: t, r: ri }); }); });
      if (seq.length < 20) return;
      // 열: 7칸
      var cols = []; seq.forEach(function (c) { var x = cx(c.t), k = cols.find(function (k) { return Math.abs(k.x - x) < pt * 0.45; }); if (k) { k.n++; k.x += (x - k.x) / k.n; } else cols.push({ x: x, n: 1 }); });
      cols.sort(function (a, b) { return a.x - b.x; });
      var col7 = cols.length === 7;
      seq.forEach(function (c) { var bd = 1e9; cols.forEach(function (k, i) { var d = Math.abs(k.x - cx(c.t)); if (d < bd) { bd = d; c.c = i; } }); });
      // 순서대로 읽어 1부터 이어지는 달 찾기. 앞쪽 큰 수 = 지난달, 달 끝 뒤 작은 수 = 다음 달
      var runs = [], cur = null;
      seq.forEach(function (c) { if (!cur || c.d === 1 || c.d < cur.cells[cur.cells.length - 1].d - 1) { cur = { cells: [] }; runs.push(cur); } cur.cells.push(c); });
      runs.forEach(function (rn) {
        var ds = rn.cells.map(function (c) { return c.d; });
        if (ds[0] !== 1 || ds.length < 20) { rn.cells.forEach(function (c) { c.other = true; }); return; }
        // 같은 블록 안 다른 달 → 같은 블록(열) 위·아래·옆 글자에서 연·월
        var gb = [Math.min.apply(null, rn.cells.map(function (c) { return c.t.b[0]; })), Math.min.apply(null, rn.cells.map(function (c) { return c.t.b[1]; })), Math.max.apply(null, rn.cells.map(function (c) { return c.t.b[2]; })), Math.max.apply(null, rn.cells.map(function (c) { return c.t.b[3]; }))];
        months.push({ P: P, cells: rn.cells, gb: gb, zk: zk, col7: col7, cols: cols, multi: false });
      });
    });
    var mine = months.filter(function (M) { return M.P === P; });
    // 연·월: 블록이 하나면 페이지 글자 전체, 여럿이면 블록 위쪽에서 가장 가까운 글자
    var txt = segs.map(function (s) { return s.t; }).join(' '), yr = (txt.match(/20[2-4]\d/) || [])[0];
    var bigM = (P.tc || []).filter(function (t) { return /^\s*(0?[1-9]|1[0-2])\s*(월)?\s*$/.test(t.s) && t.z > zk * 1.6; }).sort(function (a, b) { return b.z - a.z; });
    mine.forEach(function (M) {
      M.multi = mine.length > 1;
      var lab = segs.filter(function (s) { return s.z !== zk && monOf(s.t); }).concat(bigM.map(function (t) { return { t: t.s, b: t.b, big: true }; }));
      if (M.multi) lab = lab.filter(function (s) { var c = (s.b[0] + s.b[2]) / 2; return c > M.gb[0] - zk * 4 && c < M.gb[2] + zk * 4 && s.b[1] > M.gb[1] - zk * 2; })
        .sort(function (a, b) { return Math.abs(a.b[1] - M.gb[3]) - Math.abs(b.b[1] - M.gb[3]); });
      var L = lab[0]; M.lab = L && String(L.t).slice(0, 30); M.m = L ? (L.big ? +String(L.t).replace(/\D/g, '') : monOf(L.t)) : null;
      var ly = L && String(L.t).match(/20[2-4]\d/); M.y = ly ? +ly[0] : yr ? +yr : null;
    });
  });
  R.calMonths = months;
  if (!months.length) { if (R.prod === 'calendar') issue({ page: null, sev: 'info', cat: 'cal', code: 'calnone', title: '달력 날짜 칸을 찾지 못했어요', detail: '날짜 숫자가 글자로 살아 있는 파일(아웃라인 전)이어야 검사할 수 있어요.', fix: '', boxes: [] }); return; }
  var yGuess = months.map(function (m) { return m.y; }).filter(Boolean); var yMode = yGuess.length ? +mode(yGuess) : null;
  // 달 이름을 못 읽은 달(손글씨 · 그림 글자): 앞뒤 달과 날짜 배열(1일 요일 · 마지막 날)로 몇 월인지 추정
  months.forEach(function (M, i) {
    if (M.m || !M.col7) return; var y = M.y || yMode; if (!y) return;
    var same = function (o) { return o.m && !o.inf && o.multi === M.multi; }, prev = null, next = null;
    for (var a = i - 1; a >= 0; a--) if (same(months[a])) { prev = months[a]; break; }
    for (var b = i + 1; b < months.length; b++) if (same(months[b])) { next = months[b]; break; }
    var c1 = M.cells[0].c, last = M.cells[M.cells.length - 1].d;
    var fits = function (m) { var d1 = new Date(y, m - 1, 1).getDay(); return new Date(y, m, 0).getDate() === last && (d1 === c1 || (d1 + 6) % 7 === c1); };
    var want = prev ? prev.m % 12 + 1 : next ? (next.m + 10) % 12 + 1 : null, pick = null;
    if (want && fits(want)) pick = want; else { var cs = []; for (var m = 1; m <= 12; m++) if (fits(m)) cs.push(m); if (cs.length === 1) pick = cs[0]; }
    if (pick) { M.m = pick; M.inf = true; issue({ page: M.P.i, sev: 'info', cat: 'cal', code: 'calminf', title: '달 이름을 글자로 못 읽어 ' + pick + '월로 보고 검사했어요', detail: '손글씨 · 그림 글자로 보임 · 앞뒤 달과 날짜 배열(1일 요일 · 마지막 ' + last + '일)로 추정', fix: '', boxes: [M.gb] }); }
  });
  var noym = [];
  var bd = {}; rules.days.forEach(function (d) { bd[d.m + '-' + d.d] = d.label; });
  months.forEach(function (M) {
    var P = M.P, y = M.y || yMode, mth = M.m, nm = mth ? mth + '월' : '이 달';
    var ds = M.cells.map(function (c) { return c.d; }), dup = [], skip = [];
    for (var i = 1; i < ds.length; i++) { if (ds[i] === ds[i - 1]) dup.push(M.cells[i]); else if (ds[i] > ds[i - 1] + 1) for (var k = ds[i - 1] + 1; k < ds[i]; k++) if (!slotDeco(P, M, k)) skip.push(k); }
    var last = ds[ds.length - 1], dim = y && mth ? new Date(y, mth, 0).getDate() : null;
    if (dup.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'caldup', title: nm + '에 같은 날짜가 두 번 있어요', detail: uniq(dup.map(function (c) { return c.d; })).join(', ') + '일', fix: '날짜 확인', boxes: dup.map(function (c) { return c.t.b; }) });
    if (skip.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calmiss', title: nm + '에 빠진 날짜가 있어요', detail: skip.join(', ') + '일', fix: '날짜 확인', boxes: [] });
    if (dim && last < dim) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calmiss', title: nm + ' 마지막 날짜가 빠졌어요', detail: y + '년 ' + mth + '월은 ' + dim + '일까지 · 파일은 ' + last + '일까지', fix: '날짜 확인', boxes: [M.cells[M.cells.length - 1].t.b] });
    if (dim && last > dim) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calextra', title: nm + '에 없는 날짜가 있어요', detail: y + '년 ' + mth + '월은 ' + dim + '일까지 · 파일은 ' + last + '일까지', fix: '', boxes: M.cells.filter(function (c) { return c.d > dim; }).map(function (c) { return c.t.b; }) });
    // 요일 머리글 (이 블록 위 7칸)
    var head = null, hd = (P.tc || []).filter(function (t) { return !t.rot && DOW.some(function (re) { return re.test(t.s.trim()); }) && t.b[1] > M.gb[3] - M.zk && t.b[1] < M.gb[3] + M.zk * 6 && t.b[0] > M.gb[0] - M.zk * 3 && t.b[2] < M.gb[2] + M.zk * 3; });
    if (M.col7 && hd.length >= 7) { var hc = M.cols.map(function (c) { var h = hd.filter(function (t) { return Math.abs((t.b[0] + t.b[2]) / 2 - c.x) < M.zk * 1.5; }).sort(function (a, b) { return a.b[1] - b.b[1]; })[0]; if (!h) return -1; var w = h.s.trim(); for (var i = 0; i < 7; i++) if (DOW[i].test(w)) { if (w.length === 1 && /[STW]/i.test(w)) return -2; return i; } return -1; });
      if (hc.every(function (i) { return i !== -1; })) { head = hc.map(function (v, i) { return v >= 0 ? v : null; }); var a0 = head.findIndex(function (v) { return v !== null; }); if (a0 >= 0) head = head.map(function (v, i) { return (head[a0] + i - a0 + 7) % 7; }); } }
    M.head = head || [0, 1, 2, 3, 4, 5, 6]; M.headGuess = !head;
    if (y && mth && M.col7) {
      var wrong = M.cells.filter(function (c) { return dup.indexOf(c) < 0 && new Date(y, mth - 1, c.d).getDay() !== M.head[c.c]; });
      if (wrong.length) issue({ page: P.i, sev: M.headGuess ? 'warn' : 'err', cat: 'cal', code: 'caldow', title: nm + ' 날짜와 요일이 안 맞아요', detail: y + '년 ' + mth + '월 1일은 ' + '일월화수목금토'.charAt(new Date(y, mth - 1, 1).getDay()) + '요일 · 어긋난 날짜 ' + wrong.length + '개' + (M.headGuess ? ' (요일 머리글을 못 읽어 일요일 시작으로 봄)' : ''), fix: '달력 시작 요일 확인', boxes: wrong.slice(0, 10).map(function (c) { return c.t.b; }), sus: M.headGuess });
    } else if (!(y && mth)) noym.push(P.i + 1);
    M.cells.forEach(function (c) { c.mark = markOf(P, c); c.date = y && mth ? y + '-' + mth + '-' + c.d : null; c.dow = y && mth ? new Date(y, mth - 1, c.d).getDay() : M.col7 ? M.head[c.c] : -1; c.own = true; });
    // 글자색이 칸마다 다르면 글자색만으로 구분 (사진 위 띠처럼 바탕 샘플이 흔들리는 경우)
    var inkK = {}; M.cells.forEach(function (c) { inkK[c.mark.split('|')[0]] = 1; });
    var inkOnly = Object.keys(inkK).length > 1; if (inkOnly) M.cells.forEach(function (c) { c.mark = c.mark.split('|')[0]; });
    // 이 달 안에서: 평일 기본 표시 = 가장 흔한 표시
    var base = mode(M.cells.filter(function (c) { return c.dow > 0 && c.dow < 6 && !(c.date && holOf(c.date)); }).map(function (c) { return c.mark; }));
    var suns = M.cells.filter(function (c) { return c.dow === 0; }), sunDiff = suns.length && suns.filter(function (c) { return c.mark !== base; }).length >= suns.length * 0.7;
    var sunMark = sunDiff ? mode(suns.map(function (c) { return c.mark; })) : null;
    var notMarked = [], birthMiss = [], extraRed = [];
    M.cells.forEach(function (c) {
      if (!c.date) return;
      var md = mth + '-' + c.d, hol = holOf(c.date), isB = bd[md], marked = c.mark !== base;
      if (sunDiff && hol && c.dow !== 0 && c.mark !== sunMark) notMarked.push({ c: c, why: hol });
      // 표시된 날인데 공휴일 · 생일 목록에 없음 검사는 실장님 요청으로 뺀 상태 (오판 많음)
      if (isB && !marked && !decoOf(P, c, M)) birthMiss.push({ c: c, why: isB });
    });
    if (notMarked.length) issue({ page: P.i, sev: 'err', cat: 'cal', code: 'calhol', title: nm + ' 공휴일이 일요일처럼 표시되지 않았어요', detail: notMarked.map(function (n) { return n.c.d + '일 ' + n.why; }).join(', '), fix: '일요일과 같은 색으로 표시. 음력 명절 · 대체공휴일은 자동 계산, 선거일 · 임시공휴일은 PLYSH 달력 목록 기준', boxes: notMarked.map(function (n) { return n.c.t.b; }) });
    if (birthMiss.length) issue({ page: P.i, sev: 'warn', cat: 'cal', code: 'calbirth', title: nm + ' 생일 · 기념일 표시가 안 보여요', detail: birthMiss.map(function (n) { return n.c.d + '일 ' + n.why; }).join(', ') + ' · 숫자 색, 뒤 도형, 근처 글자 모두 없음', fix: '다른 생일과 같은 방식으로 표시', boxes: birthMiss.map(function (n) { return n.c.t.b; }), sus: true });
    // 생일 글자가 다른 날짜 칸에 있는지
    rules.days.forEach(function (d) {
      if (!mth || d.m !== mth) return;
      var nmL = d.label.replace(/\s*(생일|생신|기념일|데뷔.*)$/, '').trim(); if (!nmL) return;
      segsOf(P).filter(function (s) { return s.t.indexOf(nmL) > -1 && s.z < M.zk * 0.8 && X.overlaps(s.b, [M.gb[0] - M.zk * 2, M.gb[1] - M.zk * 2, M.gb[2] + M.zk * 2, M.gb[3] + M.zk * 2]); }).forEach(function (s) {
        var cxs = (s.b[0] + s.b[2]) / 2, cys = (s.b[1] + s.b[3]) / 2, near = null, nd = 1e9;
        M.cells.forEach(function (c) { var dx = (c.t.b[0] + c.t.b[2]) / 2 - cxs, dy = (c.t.b[1] + c.t.b[3]) / 2 - cys, dd = dx * dx + dy * dy; if (dd < nd) { nd = dd; near = c; } });
        if (near && near.d !== d.d) issue({ page: P.i, sev: 'warn', cat: 'cal', code: 'calbirth2', title: '생일 · 기념일 글자가 다른 날짜 칸 가까이 있어요', detail: '“' + cut(s.t, 20) + '” 가까운 칸 ' + near.d + '일 · 목록 ' + d.m + '/' + d.d, fix: '날짜 확인', boxes: [s.b, near.t.b], sus: true });
      });
    });
  });
  calSections(months);
  if (noym.length) issue({ page: null, sev: 'info', cat: 'cal', code: 'calnoym', title: '연도 · 월을 읽지 못해 요일 검사를 못 한 달이 있어요', detail: uniq(noym).join(', ') + 'p', fix: '연도(예: 2027)와 월이 글자로 있어야 검사 가능', boxes: [] });
}
// 섹션(연간 달력 · 먼슬리 등)마다 달이 1씩 이어지는지. 섹션끼리는 비교하지 않음 (2026-11-23 실장님)
function calSections(months) {
  var issue = X.issue, list = [];
  var pages = []; months.forEach(function (M) { if (pages.indexOf(M.P) < 0) pages.push(M.P); });
  var part = {}; // 연간 면에서 달 이름은 더 많은데 날짜 묶음을 다 못 읽은 페이지 (기울인 카드 · 아웃라인 등)
  pages.forEach(function (P) { // 한 페이지 안: 위 → 아래, 왼 → 오른 (읽는 순서)
    var mine = months.filter(function (M) { return M.P === P; }), z = mine.length ? mine[0].zk : 10;
    mine.sort(function (a, b) { var dy = b.gb[3] - a.gb[3]; return Math.abs(dy) > z * 3 ? dy : a.gb[0] - b.gb[0]; });
    if (mine.length > 1) {
      var names = {}; segsOf(P).forEach(function (sg) { var m = monOf(sg.t); if (m && sg.t.length < 30) names[m] = 1; });
      (P.tc || []).forEach(function (t) { if (t.rot) { var m = monOf(t.s); if (m) names[m] = 1; } });
      var got = mine.filter(function (M) { return M.m; }).length, nn = Object.keys(names).length;
      if (nn > got) { part[P.i] = true; issue({ page: P.i, sev: 'info', cat: 'cal', code: 'calpart', title: '이 면의 달력 일부만 읽었어요', detail: nn + '개 달 중 ' + got + '개 · 기울인 카드 · 아웃라인 글자는 눈으로 확인', fix: '', boxes: [] }); }
    }
    list = list.concat(mine);
  });
  // 모양(연간 여러 달 · 한 달 한 면 · 한 줄 띠)마다 따로 이어 봄. 탁상 달력처럼 앞면 달력 + 뒷면 띠가 번갈아 와도 섞이지 않게
  var secs = [], cur = {};
  list.forEach(function (M) {
    if (!M.m) return;
    var type = M.multi ? 'multi' : (M.gb[3] - M.gb[1]) < M.zk * 3 ? 'strip' : 'single', c = cur[type];
    if (!c || (M.m === 1 && c.last.m !== 12) || (M.y && c.last.y && M.y !== c.last.y && !(c.last.m === 12 && M.m === 1))) { c = cur[type] = { type: type, items: [], last: null }; secs.push(c); }
    c.items.push(M); c.last = M;
  });
  var TN = { multi: '연간(여러 달 한 면)', single: '월별', strip: '한 줄 날짜 띠' }, cnt = {};
  secs.forEach(function (S) { cnt[S.type] = (cnt[S.type] || 0) + 1; S.no = cnt[S.type]; });
  secs.forEach(function (S) {
    var name = (cnt[S.type] > 1 ? S.no + '번째 ' : '') + TN[S.type] + ' 섹션';
    for (var i = 1; i < S.items.length; i++) {
      var a = S.items[i - 1], b = S.items[i], want = a.m % 12 + 1;
      if (b.m === a.m) issue({ page: b.P.i, sev: 'err', cat: 'cal', code: 'calmdup', title: name + '에서 ' + b.m + '월이 두 번 있어요', detail: (a.P.i + 1) + 'p · ' + (b.P.i + 1) + 'p', fix: '달 표기 확인', boxes: [b.gb] });
      else if (b.m !== want && !(part[b.P.i] && a.P === b.P && b.m > a.m)) issue({ page: b.P.i, sev: 'err', cat: 'cal', code: 'calorder', title: name + ' 달 순서가 이어지지 않아요', detail: a.m + '월 다음에 ' + b.m + '월 (' + want + '월이어야 함) · ' + (b.P.i + 1) + 'p', fix: '달 순서 · 빠진 달 확인', boxes: [b.gb] });
    }
  });
}
function slotDeco(P, M, k) { // 빠진 날짜 칸에 그림 · 도형 · 다른 글자(생일 표시 등)가 있으면 빠진 게 아님
  var pv = M.cells.find(function (c) { return c.d === k - 1; }), nx = M.cells.find(function (c) { return c.d === k + 1; }), x, y;
  var cy = function (c) { return (c.t.b[1] + c.t.b[3]) / 2; };
  if (pv && pv.c < M.cols.length - 1) { x = M.cols[pv.c + 1].x; y = cy(pv); } else if (nx && nx.c > 0) { x = M.cols[nx.c - 1].x; y = cy(nx); } else return false;
  var pitch = M.cols.length > 1 ? (M.cols[M.cols.length - 1].x - M.cols[0].x) / (M.cols.length - 1) : M.zk * 3, r = pitch * 0.45;
  var near = function (b) { return b && b[0] < x + r && b[2] > x - r && b[1] < y + r && b[3] > y - r && (b[2] - b[0]) < pitch * 2.5 && (b[3] - b[1]) < pitch * 2.5; };
  return (P.images || []).some(function (im) { return near(im.vis); }) || (P.fills || []).some(function (f) { return !f.ink.white && near(f.vis); }) || (P.tc || []).some(function (t) { return M.cells.every(function (c) { return c.t !== t; }) && near(t.b); });
}
function tcHidden(P, t) { // pdf.js 글자(t) ↔ 엔진 글자를 그린 순서대로 짝지어, 나중에 그린 불투명 면 · 사진에 완전히 덮였는지
  if (!P._tcMap) {
    P._tcMap = new Map(); var used = new Set(), ets = P.texts || [], from = 0;
    (P.tc || []).forEach(function (q) {
      var cx = (q.b[0] + q.b[2]) / 2, cy = (q.b[1] + q.b[3]) / 2, tol = Math.max(1, q.z * 0.3);
      for (var i = from; i < ets.length; i++) { if (used.has(i)) continue; var b = ets[i].box; if (Math.abs((b[0] + b[2]) / 2 - cx) < tol + 1 && Math.abs((b[1] + b[3]) / 2 - cy) < tol) { used.add(i); P._tcMap.set(q, ets[i]); while (used.has(from)) from++; return; } }
    });
  }
  var e = P._tcMap.get(t); if (!e) return false;
  var b = e.vis || e.box;
  var lap = (P.tc || []).some(function (o) { if (o === t || !o.s.trim()) return false; var w = Math.min(o.b[2], t.b[2]) - Math.max(o.b[0], t.b[0]), h = Math.min(o.b[3], t.b[3]) - Math.max(o.b[1], t.b[1]); return w > (t.b[2] - t.b[0]) * 0.4 && h > (t.b[3] - t.b[1]) * 0.4; });
  if (P.px && X.pix && !lap) { // 그려진 화면에서 글자 자리가 고른 색이면 가려진 것, 글자 모양이 보이면 보이는 것
    var q = X.toPx(P, t.b), lo = 999, hi = -1;
    for (var px = Math.floor(q[0]); px <= Math.ceil(q[2]); px++) for (var py = Math.floor(q[1]); py <= Math.ceil(q[3]); py++) { var c = X.pix(P, px, py), l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; if (l < lo) lo = l; if (l > hi) hi = l; }
    if (hi - lo > 35) return false;
  }
  return (P.fills || []).some(function (f) { var v = f.vis; if (!v || f.seq <= e.seq || (f.ca != null && f.ca < 0.99) || f.sm || f.op || !f.ink || f.ink.none || f.ink.pattern) return false; return v[0] <= b[0] + 0.3 && v[2] >= b[2] - 0.3 && v[1] <= b[1] + 0.3 && v[3] >= b[3] - 0.3; });
}
function decoOf(P, c, M) { // 숫자 뒤 도형(별 · 하트 · 원) 또는 칸 안 작은 글자(이름 · Birthday · Debut …)
  var b = c.t.b, z = M.zk, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  var shape = (P.fills || []).some(function (f) { var fb = f.box; if (!fb || f.ink.white || f.ink.none) return false; var w = fb[2] - fb[0], h = fb[3] - fb[1]; return fb[0] <= cx && fb[2] >= cx && fb[1] <= cy && fb[3] >= cy && w < z * 5 && h < z * 5 && w > z * 0.6; });
  if (shape) return true;
  var pitch = M.cols.length > 1 ? (M.cols[M.cols.length - 1].x - M.cols[0].x) / (M.cols.length - 1) : z * 3;
  return (P.tc || []).some(function (t) { if (t === c.t || /^\s*\d{1,2}\s*$/.test(t.s) || !/[A-Za-z가-힣]/.test(t.s) || t.z > z * 0.9) return false; var tx = (t.b[0] + t.b[2]) / 2, ty = (t.b[1] + t.b[3]) / 2; return Math.abs(tx - cx) < pitch * 0.5 && Math.abs(ty - cy) < pitch * 0.9; });
}
function markOf(P, c) { // 숫자 글자색 + 칸 바탕색을 거칠게 묶은 키
  var t = c.t, b = t.b, et = (P.texts || []).find(function (x) { return X.overlaps(x.vis, b); }), ink = et && et.ink ? [Math.round(et.ink.c * 4), Math.round(et.ink.m * 4), Math.round(et.ink.y * 4), Math.round(et.ink.k * 4), et.ink.spots ? Object.keys(et.ink.spots)[0] : '', et.ink.rgbv ? et.ink.rgbv.map(function (v) { return Math.round(v * 4); }).join('') : ''].join('') : '';
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

// ── 인증 마크 (FSC · 소이잉크 · KOMCA) 찾기 + 전개도 기준 방향 · 반전 판정 ──
var MARKS = [['분리배출', /분리\s*배출|재활용\s*(가능|어려움)|^(종이|종이팩|플라스틱|비닐류|캔류|유리|PET|HDPE|LDPE|PP|PS|OTHER)$/i], ['FSC', /\bFSC\b|FSC\s*[®Ⓡ]|\bC\d{6}\b|^MIX$|RECYCLED|FSC\s*MIX/i], ['소이잉크', /SOY\s*INK|SOYINK|PRINTED\s*WITH\s*SOY|소이\s*잉크|^SOY$/i], ['KOMCA', /KOMCA/i]];
var BOXRE2 = /박스|아웃\s*박스|outbox|box|패키지|package|상자/i;
var tsP = null;
function tess() { if (!tsP) tsP = (window.Tesseract ? Promise.resolve(true) : new Promise(function (ok) { var s = document.createElement('script'); s.src = LIBS.tess; s.onload = function () { ok(true); }; s.onerror = function () { ok(false); }; document.head.appendChild(s); })); return tsP; }
function tcAng(t) { return t.a == null ? 0 : t.a; }
async function marks(R, pdfjs, step) {
  var isBox = BOXRE2.test((R.prodName || '') + ' ' + R.file); // 글자 마크는 모든 품목, 그림 OCR은 아웃박스만 (느림)
  var issue = X.issue, MM = X.MM, mm = X.mm, found = {};
  R.pages.forEach(function (P) { P._marks = []; (P.tc || []).forEach(function (t) { MARKS.forEach(function (k) { if (k[1].test(t.s.trim())) { P._marks.push({ k: k[0], rot: t.a || 0, mir: !!t.m, b: t.b, src: t.a ? '글자 (' + t.a + '° 돌아감)' : '글자' }); found[k[0]] = 1; } }); }); });
  var need = function () { return !found.FSC || !found['소이잉크']; };
  if (isBox && need() && await tess() && window.Tesseract) {
    var W = null;
    try { W = await Tesseract.createWorker('eng', 1, { workerPath: LIBS.tessWorker, corePath: LIBS.tessCore, langPath: LIBS.tessLang }); await W.setParameters({ tessedit_pageseg_mode: '11' }); } catch (e) { console.warn(e); W = null; }
    if (W) for (var pi = 0; pi < Math.min(R.pages.length, 4) && need(); pi++) {
      var P = R.pages[pi], pg = await pdfjs.getPage(P.i + 1), v1 = pg.getViewport({ scale: 1 }), sc;
      sc = Math.min(8 * 25.4 / 72, 5000 / Math.max(v1.width, v1.height));
      var vp = pg.getViewport({ scale: sc }), cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await pg.render({ canvasContext: cx, viewport: vp, intent: 'print' }).promise;
      var passes = [[0, false], [180, false], [90, false], [270, false], [0, true], [180, true], [90, true], [270, true]];
      for (var qi = 0; qi < passes.length && need(); qi++) {
        var deg = passes[qi][0], mir = passes[qi][1]; if (step) step('인증 마크 찾는 중… ' + (pi + 1) + 'p · ' + deg + '°' + (mir ? ' 반전' : ''));
        var w = cv.width, h = cv.height, rw = deg % 180 ? h : w, rh = deg % 180 ? w : h, rc = document.createElement('canvas'); rc.width = rw; rc.height = rh;
        var rx = rc.getContext('2d'); rx.translate(rw / 2, rh / 2); rx.rotate(deg * Math.PI / 180); if (mir) rx.scale(-1, 1); rx.drawImage(cv, -w / 2, -h / 2);
        var M = rx.getTransform().inverse(), data = null;
        try { data = (await W.recognize(rc)).data; } catch (e) { console.warn(e); }
        rc.width = rc.height = 1; if (!data) continue;
        (data.words || []).forEach(function (wd) {
          var tx = (wd.text || '').replace(/[^\w®]/g, ''); if (wd.confidence < 55 || tx.length < 3) return;
          MARKS.forEach(function (k) {
            if (found[k[0]] || !(k[1].test(tx) || (k[0] === '소이잉크' && /^SOY$/i.test(tx)))) return;
            var bb = wd.bbox, pts = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1]].map(function (q) { var o = M.transformPoint(new DOMPoint(q[0], q[1])); return vp.convertToPdfPoint(o.x, o.y); });
            var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
            P._marks.push({ k: k[0], rot: deg, mir: mir, b: [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)], src: '그림 (OCR)', t: tx }); found[k[0]] = 1;
          });
        });
      }
      cv.width = cv.height = 1;
    }
    if (W) try { await W.terminate(); } catch (e) {}
  }
  R._marks = found;
  orient(R);
}
// 마크(FSC · 소이잉크 · 분리배출 · KOMCA) · 바코드 색: K100 권장, 바탕이 흰색이 아니면 오버프린트
function inkOK(P, b, label, code, sev) {
  var MM = X.MM, issue = X.issue, objs = (P.fills || []).concat(P.texts || []).filter(function (o) { var v = o.vis || o.box; return v && o.ink && !o.ink.white && !o.ink.none && v[0] >= b[0] - 0.5 && v[1] >= b[1] - 0.5 && v[2] <= b[2] + 0.5 && v[3] <= b[3] + 0.5; });
  if (!objs.length) return;
  var notK = objs.filter(function (o) { return !o.ink.k100; }), noOP = objs.filter(function (o) { return o.ink.k100 && !o.op; });
  var g = 1.5 * MM, rs = [[b[0] - g - 2, b[1], b[0] - g, b[3]], [b[2] + g, b[1], b[2] + g + 2, b[3]], [b[0], b[1] - g - 2, b[2], b[1] - g], [b[0], b[3] + g, b[2], b[3] + g + 2]].map(function (r) { var c = X.avgPx(P, r); return c ? (c[0] + c[1] + c[2]) / 3 : 255; });
  var dark = P.px && Math.max.apply(null, rs) < 245; // 네 방향 모두 흰색이 아닐 때만 '바탕 있음'
  if (notK.length > objs.length * 0.3) issue({ page: P.i, sev: sev || 'warn', cat: 'print', code: code, title: label + ' 색이 K100이 아니에요', detail: uniq(notK.map(function (o) { return o.ink.rgb ? 'RGB' : o.ink.spots ? Object.keys(o.ink.spots).join('+') : ['c', 'm', 'y', 'k'].filter(function (q) { return o.ink[q] > 0.004; }).map(function (q) { return q.toUpperCase() + Math.round(o.ink[q] * 100); }).join(' '); })).slice(0, 3).join(', '), fix: '권장 K100 단색 (여러 색 겹치면 판 어긋남으로 흐려짐)', boxes: [b] });
  else if (dark && noOP.length > objs.length * 0.3) issue({ page: P.i, sev: 'warn', cat: 'print', code: code, title: label + ' 바탕이 흰색이 아닌데 오버프린트가 꺼져 있어요', detail: 'K100 ' + noOP.length + '개', fix: '권장 K100 + 오버프린트 (흰 테두리 생김 방지)', boxes: [b] });
}
function markInk(P, it) { if (/^(글자|그림)/.test(it.src) || it.src) inkOK(P, it.b, it.nm, 'markink', 'warn'); }
function orient(R) { // 전개도(칼선 · 접는 선) 기준으로 면마다 방향 · 반전
  var issue = X.issue, MM = X.MM, mm = X.mm;
  R.pages.forEach(function (P) {
    var tc = (P.tc || []).filter(function (t) { return t.s.trim().length >= 2; }); if (!tc.length && !(P._marks || []).length) return;
    // 칼선 · 접는 선의 긴 가로선 → 면 띠
    var die = P.strokes.filter(function (o) { if (!o.ink.spots) return false; for (var s in o.ink.spots) if (/die|cut|thomson|칼선|도무송|톰슨|fold|crease|score|오시|접는|접지/i.test(s)) return true; return false; });
    var bands = null;
    if (die.length) {
      var dx0 = Math.min.apply(null, die.map(function (o) { return o.box[0]; })), dx1 = Math.max.apply(null, die.map(function (o) { return o.box[2]; })), dy0 = Math.min.apply(null, die.map(function (o) { return o.box[1]; })), dy1 = Math.max.apply(null, die.map(function (o) { return o.box[3]; }));
      var hy = die.filter(function (o) { return o.box[3] - o.box[1] < 1 && o.box[2] - o.box[0] > 0.5 * (dx1 - dx0); }).map(function (o) { return (o.box[1] + o.box[3]) / 2; }).sort(function (a, b) { return a - b; });
      var ys = [dy0]; hy.forEach(function (y) { if (y - ys[ys.length - 1] > 5 * MM && dy1 - y > 5 * MM) ys.push(y); }); ys.push(dy1);
      if (ys.length >= 4) { bands = []; for (var i = 0; i + 1 < ys.length; i++) bands.push([ys[i], ys[i + 1]]); }
    }
    var bandOf = function (b) { if (!bands) return -1; var cy = (b[1] + b[3]) / 2; for (var i = 0; i < bands.length; i++) if (cy >= bands[i][0] && cy <= bands[i][1]) return i; return -1; };
    // 기준 방향 = 몸통 면(가장 큰 띠, 없으면 페이지 전체)의 글자 방향 다수
    var main = -1; if (bands) { var big = 0; bands.forEach(function (bd, i) { if (bd[1] - bd[0] > big) { big = bd[1] - bd[0]; main = i; } }); }
    var vote = {}; tc.forEach(function (t) { if (main >= 0 && bandOf(t.b) !== main) return; var a = t.a || 0; vote[a] = (vote[a] || 0) + t.s.length; });
    var ref = +Object.keys(vote).sort(function (a, b) { return vote[b] - vote[a]; })[0] || 0;
    var items = (P._marks || []).map(function (m) { return { nm: m.k + ' 마크', rot: m.rot, mir: m.mir, b: m.b, src: m.src }; });
    var seen = {};
    items.forEach(function (it) {
      var key = it.nm + Math.round(it.b[0]) + ',' + Math.round(it.b[1]); if (seen[key]) return; seen[key] = 1;
      var bi = bandOf(it.b), d = ((it.rot - ref) % 360 + 360) % 360, where = bands ? (bi === main ? '몸통 면' : bi >= 0 ? (bi < main ? '아래쪽 날개 면' : '위쪽 날개 면') : '면 밖') : '';
      if (it.mir) issue({ page: P.i, sev: 'err', cat: 'print', code: 'mirror', title: it.nm + ' 좌우 반전', detail: (where ? where + ' · ' : '') + '찾은 방법: ' + it.src, fix: '반전(뒤집기) 풀기. 투명 소재 안쪽 인쇄가 아니면 반전 금지', boxes: [it.b] });
      else if (/마크/.test(it.nm)) issue({ page: P.i, sev: 'info', cat: 'print', code: 'markok', title: it.nm + ' 있음 · 반전 없음' + (d ? ' (' + d + '° 회전 · 전개도 방향이면 괜찮음)' : ''), detail: (where ? where + ' · ' : '') + '찾은 방법: ' + it.src, fix: '', boxes: [it.b] });
      if (/마크/.test(it.nm)) markInk(P, it);
      if (it.nm === 'FSC 마크' && !seen['fsz' + P.i]) { seen['fsz' + P.i] = 1; var lb = logoBox(P, it.b), h = Math.min(lb[2] - lb[0], lb[3] - lb[1]) / MM, H = Math.max(lb[2] - lb[0], lb[3] - lb[1]) / MM; // 팀 기준: FSC 로고 높이 14mm 이상 (2026-11-19 실장님)
        if (H < 14) issue({ page: P.i, sev: 'warn', cat: 'print', code: 'fscsize', title: 'FSC 로고가 작아요', detail: '로고 묶음 약 ' + (Math.round((lb[2] - lb[0]) / MM * 10) / 10) + '×' + (Math.round((lb[3] - lb[1]) / MM * 10) / 10) + 'mm · 팀 기준 높이 14mm 이상 (FSC 최소 6mm)', fix: '권장 높이 14mm 이상. 바코드처럼 대비 선명하게 (검정 · 흰색 권장)', boxes: [lb], sus: true }); }
    });
  });
}
function logoBox(P, b) { // 마크 글자 둘레로 붙어 있는 작은 면 · 선 · 글자를 모아 로고 크기 추정
  var MM = X.MM, box = b.slice(), gap = 1.5 * MM, objs = (P.fills || []).concat(P.strokes || [], P.texts || []).map(function (o) { return o.vis || o.box; }).filter(function (v) { return v && v[2] - v[0] < 40 * MM && v[3] - v[1] < 40 * MM; });
  for (var it = 0; it < 4; it++) { var grew = false; objs.forEach(function (v) { if (v[0] < box[2] + gap && v[2] > box[0] - gap && v[1] < box[3] + gap && v[3] > box[1] - gap) { var nb = [Math.min(box[0], v[0]), Math.min(box[1], v[1]), Math.max(box[2], v[2]), Math.max(box[3], v[3])]; if (nb[2] - nb[0] < 45 * MM && nb[3] - nb[1] < 45 * MM && (nb[0] !== box[0] || nb[1] !== box[1] || nb[2] !== box[2] || nb[3] !== box[3])) { box = nb; grew = true; } } }); if (!grew) break; }
  return box;
}
// ── 영어 문장 판독 (Harper: 브라우저 안에서만 도는 무료 문법 검사기, 글자가 밖으로 나가지 않음) ──
var hpP = null;
function harper() {
  if (!hpP) hpP = Promise.all([import(new URL('vendor/harper/index.js', location.href).href), import(new URL('vendor/harper/slimBinary.js', location.href).href)])
    .then(function (m) { var L = new m[0].LocalLinter({ binary: m[1].slimBinary || m[1].binary }); return L.setup().then(function () { return L; }); })
    .catch(function (e) { console.warn(e); return null; });
  return hpP;
}
function paras(P) { // 같은 단 · 같은 크기 · 줄 간격이 가까운 줄들을 문단으로
  var out = [], cur = null;
  segsOf(P).forEach(function (s) {
    var t = s.t.trim(); if (!t) return;
    var ok = cur && Math.abs(s.b[0] - cur.x0) < s.z * 1.5 + 20 && Math.abs(s.z - cur.z) < cur.z * 0.12 && cur.y - s.b[3] < s.z * 1.2 && cur.y - s.b[3] > -s.z * 0.3;
    if (!ok) { cur = { x0: s.b[0], z: s.z, y: s.b[1], txt: '', map: [] }; out.push(cur); }
    else { var hy = /[A-Za-z]-$/.test(cur.txt); if (hy) { cur.txt = cur.txt.slice(0, -1); cur.map.pop(); } else { cur.txt += ' '; cur.map.push(null); } }
    var off = s.t.indexOf(t); for (var i = 0; i < t.length; i++) cur.map.push({ s: s, i: off + i }); cur.txt += t; cur.y = s.b[1];
  });
  return out.filter(function (p) { var en = (p.txt.match(/[A-Za-z]/g) || []).length, all = (p.txt.match(/[A-Za-z가-힣]/g) || []).length; return en >= 20 && en >= all * 0.8 && (p.txt.match(/[A-Za-z]{2,}/g) || []).length >= 4; });
}
function pBox(p, a, b) { var bb = null; for (var i = a; i < b; i++) { var q = p.map[i]; if (!q) continue; var x = subBox(q.s, q.i, 1); bb = bb ? [Math.min(bb[0], x[0]), Math.min(bb[1], x[1]), Math.max(bb[2], x[2]), Math.max(bb[3], x[3])] : x; } return bb; }
var HP_KEEP = /^(Agreement|Grammar|Malapropism|Eggcorn|Repetition|Typo|BoundaryError|Usage|WordChoice|Spelling)$/;
async function sentences(R, step) {
  var issue = X.issue, ps = []; R.pages.forEach(function (P) { paras(P).forEach(function (p) { p.P = P; ps.push(p); }); });
  if (!ps.length) return;
  // 같은 페이지 안에서 같은 문장이 두 번
  var rep = [];
  R.pages.forEach(function (P) {
    var seen = {}; ps.filter(function (p) { return p.P === P; }).forEach(function (p) {
      var re = /[^.!?]+[.!?]+/g, m; while ((m = re.exec(p.txt))) { var k = m[0].toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); if (k.length < 24) continue; if (seen[k]) rep.push({ P: P, b: pBox(p, m.index, m.index + m[0].length), s: m[0].trim() }); else seen[k] = 1; }
    });
  });
  var byP = {}; rep.forEach(function (h) { (byP[h.P.i] = byP[h.P.i] || []).push(h); });
  Object.keys(byP).forEach(function (pi) { var L = byP[pi]; issue({ page: +pi, sev: 'warn', cat: 'text', code: 'sentrep', title: '같은 문장이 한 페이지에 두 번 있어요', detail: L.slice(0, 2).map(function (h) { return '“' + cut(h.s, 40) + '”'; }).join(', '), fix: '하나 지우기', boxes: L.map(function (h) { return h.b; }).filter(Boolean) }); });
  if (step) step('영어 문장 읽는 중…');
  var L = await Promise.race([harper(), new Promise(function (ok) { setTimeout(function () { ok(null); }, 60000); })]);
  if (!L) { issue({ page: null, sev: 'info', cat: 'text', code: 'grammar', title: '영어 문법 검사기를 불러오지 못했어요', detail: '철자 검사(사전)만 했어요.', fix: '', boxes: [] }); return; }
  var ENW = window.PLYSH_ENW, sp = [], gr = [];
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i], lints = []; try { lints = await L.lint(p.txt); } catch (e) { console.warn(e); continue; }
    lints.forEach(function (x) {
      var kind = x.lint_kind(), sp0 = x.span(), w = p.txt.slice(sp0.start, sp0.end); if (!HP_KEEP.test(kind) || !w.trim()) return;
      if (w === w.toUpperCase() && /[A-Z]{2}/.test(w)) return; // 제목 · 이름 (전부 대문자)
      var sug = x.suggestions().map(function (g) { try { return g.get_replacement_text(); } catch (e) { return ''; } }).filter(Boolean).slice(0, 3);
      var b = pBox(p, sp0.start, sp0.end) || p.map.find(Boolean).s.b;
      if (kind === 'Spelling') {
        // 사전에 있는 단어 · 대문자로 시작하는 이름 · 팀 규칙 표기는 맞는 것으로
        if ((/^[A-Z]/.test(w) && !/(^|[.!?]\s+)$/.test(p.txt.slice(0, sp0.start))) || /^[A-Z]{2}/.test(w) || WSEG[w.toUpperCase()] || (ENW && ENW.has(w.toLowerCase())) || w.length < 3 || !sug.length) return;
        sp.push({ P: p.P, b: b, w: w, to: sug.join(' 또는 ') }); return;
      }
      if (kind === 'WordChoice' && /^Insert `to`/.test(x.message())) return; // 단어 반복은 따로 잡음
      gr.push({ P: p.P, b: b, w: w, msg: x.message().replace(/`/g, ''), to: sug[0], ctx: cut(p.txt.slice(Math.max(0, sp0.start - 20), sp0.end + 20), 50) });
    });
  }
  var grp = function (arr) { var o = {}; arr.forEach(function (h) { (o[h.P.i] = o[h.P.i] || []).push(h); }); return o; };
  var a = grp(sp); Object.keys(a).forEach(function (pi) { var L2 = a[pi]; issue({ page: +pi, sev: 'warn', cat: 'text', code: 'typoen', title: '영문 철자 틀림', detail: uniq(L2.map(function (h) { return h.w + ' → ' + h.to; })).slice(0, 4).join(', '), fix: '철자 고치기', boxes: L2.map(function (h) { return h.b; }) }); });
  var g = grp(gr); Object.keys(g).forEach(function (pi) { var L3 = g[pi]; issue({ page: +pi, sev: 'adv', cat: 'text', code: 'grammar', title: '영어 문장 확인', detail: L3.slice(0, 3).map(function (h) { return '“' + h.ctx + '” ' + h.w + (h.to ? ' → ' + h.to : ''); }).join(' / '), fix: '문법 확인 (자동 판독이라 의도한 표현이면 그대로 두기)', boxes: L3.map(function (h) { return h.b; }), sus: true }); });
}
var enwP = null;
function enWords() { // 영어 단어 목록 (an-array-of-english-words, 처음 한 번만 받음)
  if (window.PLYSH_ENW) return Promise.resolve();
  if (!enwP) enwP = fetch(LIBS.enwords).then(function (r) { return r.json(); }).then(function (a) { window.PLYSH_ENW = new Set(a); }).catch(function (e) { console.warn(e); });
  return Promise.race([enwP, new Promise(function (ok) { setTimeout(ok, 15000); })]);
}
window.RV2 = {
  attach: function (x) { X = x; },
  parseRules: parseRules, rulesToRows: rulesToRows, rowsToRules: rowsToRules, RULES_EX: RULES_EX, korHolidays: korHolidays,
  run: async function (R, pdfjs, step) {
    var rules = parseRules(R.rulesText != null ? R.rulesText : rulesText()); R.rulesN = rules;
    WSEG = {}; rules.members.concat(rules.terms).forEach(function (r) { r.forms.concat(r.wrong).forEach(function (f) { f.toUpperCase().split(/[\s\-·]+/).forEach(function (w) { if (/^[A-Z0-9']{2,}$/.test(w)) WSEG[w] = 1; }); }); }); R.pages.forEach(function (P) { P._lines = null; });
    step('글자 검사 중…'); await X.tick(); await enWords(); textChecks(R, rules);
    repeatChecks(R); pageNumbers(R);
    try { await sentences(R, step); } catch (e) { console.warn(e); }
    step('달력·멤버 사진 확인 중…'); await X.tick(); calendar(R, rules); var hf = Object.keys(HOL_FAIL); if (hf.length) X.issue({ page: null, sev: 'info', cat: 'cal', code: 'holfail', title: hf.join(', ') + '년 음력 명절은 계산하지 못했어요', detail: '음력 변환표가 2050년까지라서 그 뒤의 설날·추석·부처님오신날은 빠져 있어요.', fix: '해당 연도 공휴일은 직접 확인해 주세요.', boxes: [] }); members(R, rules);
    step('바코드·QR 읽는 중…'); await X.tick(); try { await barcodes(R, pdfjs); } catch (e) { console.warn(e); }
    step('인증 마크 · 방향 확인 중…'); await X.tick(); try { await marks(R, pdfjs, step); } catch (e) { console.warn(e); }
  },
  cards: cards, parseRules: parseRules
};
})();
