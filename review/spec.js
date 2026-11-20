/* PLYSH PREFLIGHT — 사양서 검수 (2026-11-19)
   PLYSH 사양서(구글 시트)를 읽어 빈칸 · 숫자 맞춤 · 날짜 · 표기를 검사하고 결과지를 만듦.
   check(d, ctx)는 화면과 상관없는 순수 함수라 node에서도 돌릴 수 있음. */
(function (root) {
'use strict';

// ── 작은 도구 ──
function T(v) { return String(v == null ? '' : v).replace(/[\u00a0\s]+/g, ' ').trim(); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function isDash(v) { return /^[-–—]+$/.test(T(v)); }
function filled(v) { v = T(v); return !!v && !isDash(v); }
function num(s) { return +String(s).replace(/,/g, ''); }
function near(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 1.5 : tol); }
var TBD = /미정|추천\s*요청|확인\s*필요|TBD|추후\s*(확정|전달|결정)|협의/i;
var W = ['일', '월', '화', '수', '목', '금', '토'];
function f1(n) { return Math.round(n * 10) / 10; }

// 크기: "250×180×30mm" "55*85" "6×4in (150×100mm)" "520×374mm (접지 후 260×187mm)"
var SZ_RE = /(\d{1,4}(?:\.\d+)?)\s*(?:\([^)]*\))?\s*(?:mm)?\s*([×xX*])\s*(\d{1,4}(?:\.\d+)?)(?:\s*(?:mm)?\s*([×xX*])\s*(\d{1,4}(?:\.\d+)?))?\s*(mm|cm|in)?/g;
function sizes(s) {
  var out = [], m; s = T(s); SZ_RE.lastIndex = 0;
  while ((m = SZ_RE.exec(s))) {
    var k = m[6] === 'cm' ? 10 : m[6] === 'in' ? 25.4 : 1, before = s.slice(Math.max(0, m.index - 8), m.index);
    out.push({ w: num(m[1]) * k, h: num(m[3]) * k, d: m[5] ? num(m[5]) * k : 0, raw: m[0].trim(), sep: m[2] + (m[4] || ''), unit: m[6] || '', inch: m[6] === 'in', ctx: before, at: m.index });
  }
  return out;
}
function sameSize(a, b, tol) { return near(a.w, b.w, tol) && near(a.h, b.h, tol); }
function swapSize(a, b, tol) { return near(a.w, b.h, tol) && near(a.h, b.w, tol); }

// 장수 · 쪽수: "13매 / 26p" "2장 / 2p (종당 1장)" "24p" "1장"
function sheetsPages(s) {
  s = T(s); var o = {}, m;
  if ((m = s.match(/(\d+)\s*(?:장|매)/))) o.sh = +m[1];
  if ((m = s.match(/(\d+)\s*[pP](?![a-zA-Z])/))) o.p = +m[1];
  return o;
}
// 구성: "1종 (13매 / 26p)" "9종 (1세트)" "4pc" "9종 (멤버별)" "1종 (9면)"
function setOf(s) {
  s = T(s); var o = sheetsPages(s.replace(/^[^()]*\(/, '(')), m;
  if ((m = s.match(/(\d+)\s*(?:종|pc|ea)\b/i)) || (m = s.match(/(\d+)\s*종/))) o.kinds = +m[1];
  if ((m = s.match(/(\d+)\s*면/))) o.faces = +m[1];
  if (!/\(/.test(s)) { delete o.sh; delete o.p; var q = sheetsPages(s); if (/매/.test(s)) o.sh = q.sh; if (q.p) o.p = q.p; }
  o.member = /멤버\s*별/.test(s);
  return o;
}
// 인쇄도수 "4/1" "옵셋 - 4/4" "1/1"
function inkOf(s) { var m = T(s).match(/(\d)\s*\/\s*(\d)/); return m ? [+m[1], +m[2]] : null; }
// 방식·컬러 "옵셋 (CMYK/별색1)" "옵셋 (K/K)" "옵셋 (CMYK/1)"
function colorCount(t) {
  t = T(t).replace(/\s+/g, '');
  if (!t || t === '0' || isDash(t)) return 0;
  var n = 0;
  if (/CMYK/i.test(t)) { n += 4; t = t.replace(/CMYK/ig, ''); }
  var m = t.match(/별색(\d)/); if (m) { n += +m[1]; t = t.replace(/별색\d/, ''); }
  else if (/별색/.test(t)) { n += 1; t = t.replace(/별색/, ''); }
  if (/^\+?(K|먹|BK|black)/i.test(t)) { n += 1; t = t.replace(/^\+?(K|먹|BK|black)/i, ''); }
  if ((m = t.match(/^\+?(\d)도?$/))) n += +m[1];
  if (/white|화이트/i.test(t)) n += 0; // UV 화이트는 판 수로 안 셈
  return n;
}
function methodColors(s) {
  var m = T(s).match(/\(([^)]*)\)/); if (!m) return null;
  var p = m[1].split('/'); if (p.length !== 2) return null;
  if (/white|화이트|\+/i.test(m[1]) && !/^CMYK\s*\/|\/\s*CMYK$/i.test(m[1])) return null;
  return [colorCount(p[0]), colorCount(p[1])];
}
// 종이 두께(mm/장) 대략값 — batch.js caliper와 같은 기준
function caliper(paper, g) {
  if (!g) return 0;
  var k = /아트|art/i.test(paper) ? 0.00087 : /모조|랑데뷰|몽블랑|문켄|미색|백상/i.test(paper) ? 0.00125 : 0.001;
  return g * k;
}
function gsmOf(s) { var m = T(s).replace(/,/g, '').match(/(\d{2,4})\s*g\b/i); return m ? +m[1] : 0; }

// 날짜 "2026-11-16(월)" "2026-11-16(월) ~ 11-23(월)" "2026. 08. 17"
function dates(s) {
  s = T(s); var out = [], m, y0 = 0, re = /(?:(20\d\d)\s*[-.\/]\s*)?(\d{1,2})\s*[-.\/]\s*(\d{1,2})\.?\s*(?:\(\s*([일월화수목금토])\s*\))?/g;
  while ((m = re.exec(s))) {
    if (!m[1] && !y0) continue;
    var y = m[1] ? +m[1] : y0, mo = +m[2], d = +m[3]; if (m[1]) y0 = y;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    var dt = new Date(y, mo - 1, d); if (dt.getMonth() !== mo - 1) continue;
    out.push({ y: y, m: mo, d: d, wd: m[4] || '', real: W[dt.getDay()], t: +dt, raw: m[0].trim(), ymd: y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2) });
  }
  return out;
}
function md(x) { return x.m + '/' + x.d + '(' + x.real + ')'; }

// 자주 틀리는 표기 (틀린 말 → 바른 말)
var TYPO = [['맞춥', '맞춤'], ['멤버쉽', '멤버십'], ['셋트', '세트'], ['갯수', '개수'], ['됬', '됐'], ['몇일', '며칠'], ['금새', '금세'], ['왠만', '웬만'], ['할께', '할게'], ['바램', '바람'], ['어떻해', '어떡해'], ['댓가', '대가'], ['횟수', ''], ['악세사리', '액세서리'], ['메세지', '메시지'], ['컨텐츠', '콘텐츠'], ['리플렛', '리플릿'], ['싸이즈', '사이즈'], ['홀로그렘', '홀로그램'], ['스티카', '스티커'], ['톰선', '톰슨'], ['칼라', '']];
TYPO = TYPO.filter(function (x) { return x[1]; });

// ── 표 머리글 → 열 번호 ──
function cols(head) {
  var H = head.map(function (h) { return T(h).replace(/\s+/g, ' '); });
  var used = {};
  function ix(re, not) { for (var i = 0; i < H.length; i++) if (!used[i] && re.test(H[i]) && !(not && not.test(H[i]))) { used[i] = 1; return i; } return -1; }
  var c = {};
  c.no = ix(/^(번호|no\.?|순번)$/i);
  c.cat = ix(/대분류/);
  c.set = ix(/^구성$|종수|제작\s*종/);
  c.item = ix(/^품목$/); if (c.item < 0) c.item = ix(/세부\s*품목/); if (c.item < 0) c.item = ix(/소분류/);
  c.size = ix(/크기|사이즈|판형|외경/);
  c.cnt = ix(/장수|쪽수|^페이지$/);
  c.ink = ix(/도수|^인쇄$/);
  c.method = ix(/방식/);
  c.coat = ix(/코팅/);
  c.paper = ix(/종이|용지/);
  c.gsm = ix(/평량/);
  c.fin = ix(/박|형압|에폭시|후가공|특수\s*가공/);
  c.bind = []; var b; while ((b = ix(/접지|제본|톰슨|재단/)) >= 0) c.bind.push(b);
  c.pack = ix(/^포장$|배치/); if (c.pack < 0) c.pack = ix(/포장/, /기타|전달|비고/);
  c.note = ix(/기타|비고|전달/);
  c.qty = ix(/수량/);
  c.H = H;
  return c;
}

// ── 머리글 위 기본 정보: 라벨 칸 + 바로 옆 값 칸 ──
var LAB = /^(예약\s*판매|예판(\s*마감일?)?|발매(\s*예정일)?|최종\s*발주\s*수량\s*확정일|발주\s*수량\s*확정일|최종\s*데이터\s*전달일|데이터\s*전달일|배송\s*시작일|입고일|납기일?|제작\s*수량|발주\s*수량|판매가|단가.*|작성일|파일명|프로젝트명|담당자.*|작성자.*)$/;
var DATE_LAB = /예약|예판|발매|확정일|전달일|시작일|입고일|납기|작성일/;
function infoKV(info) {
  var kv = [], cells = [];
  (info || []).forEach(function (r, ri) { (r || []).forEach(function (c) { if (c && T(c.t)) cells.push({ r: ri, c: c.c, t: T(c.t) }); }); });
  var at = function (r, c) { return cells.filter(function (x) { return x.r === r && x.c === c; })[0]; };
  cells.forEach(function (x) {
    if (!LAB.test(x.t)) return;
    var v = at(x.r, x.c + 1); if (v && LAB.test(v.t)) v = null;
    if (!v) { var dn = at(x.r + 1, x.c); if (dn && !LAB.test(dn.t)) v = dn; } // 라벨 줄 + 값 줄 방식
    kv.push({ k: x.t, v: v ? v.t : '', r: x.r, c: x.c });
  });
  return { kv: kv, cells: cells };
}

// ── 본 검사 ──
function check(d, ctx) {
  ctx = ctx || {};
  var head = d.head || [], C = cols(head), out = [], pass = [];
  var lab = d.name || '';
  function add(lv, cat, where, title, prob, fix, key) { out.push({ lv: lv, cat: cat, where: where, title: title, prob: [].concat(prob || []), fix: [].concat(fix || []), key: key || '' }); }
  var g = function (r, i) { return i >= 0 ? T(r[i]) : ''; };

  // 1) 행 → 품목 묶음
  var groups = [], cur = null, lastNo = '', lastCat = '';
  (d.rows || []).forEach(function (r, ri) {
    if (!r || !r.some(function (v) { return T(v); })) return;
    var no = g(r, C.no), cat = g(r, C.cat);
    var startNew = !cur || (no && no !== lastNo) || (cat && cat !== lastCat);
    if (startNew) { cur = { no: no || lastNo, cat: cat || lastCat, set: g(r, C.set), pack: g(r, C.pack), notes: [], rows: [] }; groups.push(cur); }
    if (no) lastNo = no; if (cat) lastCat = cat;
    if (!cur.set && g(r, C.set)) cur.set = g(r, C.set);
    if (!cur.pack && g(r, C.pack)) cur.pack = g(r, C.pack);
    var nt = g(r, C.note); if (nt && cur.notes.indexOf(nt) < 0) cur.notes.push(nt);
    cur.rows.push({
      ri: ri, part: g(r, C.item), size: g(r, C.size), cnt: g(r, C.cnt), ink: g(r, C.ink), method: g(r, C.method), coat: g(r, C.coat),
      paper: g(r, C.paper) + (C.gsm >= 0 && g(r, C.gsm) ? ' / ' + g(r, C.gsm) : ''), fin: g(r, C.fin),
      bind: C.bind.map(function (i) { return T(r[i]); }).filter(filled).join(' / '), raw: r
    });
  });
  groups.forEach(function (G) {
    G.note = G.notes.join(' / ');
    G.name = G.cat || (G.rows[0] && G.rows[0].part) || '품목';
    G.label = (G.no ? G.no + '. ' : '') + G.name;
    G.S = setOf(G.set);
    G.md = /선방\s*입고|MD/i.test(G.cat + ' ' + G.pack + ' ' + G.note) || G.rows.every(function (x) { return !inkOf(x.ink); });
    G.bindAll = G.rows.map(function (x) { return x.bind; }).join(' ');
  });
  function where(G, x) { return G.label + (x && x.part && filled(x.part) && x.part !== G.name ? ' › ' + x.part : ''); }

  // 2) 기본 정보
  var I = infoKV(d.info), seen = {}, dupL = [];
  var datesBy = [], infoBlank = [];
  I.kv.forEach(function (p) {
    var key = p.k.replace(/\s+/g, '');
    if (seen[key]) { if (dupL.indexOf(p.k) < 0) dupL.push(p.k); } seen[key] = 1;
    if (!p.v) {
      if (/제작\s*수량|확정일|전달일|시작일|입고일|납기|예약|예판/.test(p.k)) infoBlank.push(p.k);
      return;
    }
    if (DATE_LAB.test(p.k)) {
      var ds = dates(p.v);
      ds.forEach(function (x) {
        if (x.wd && x.wd !== x.real) add('r', 'date', '기본 정보 › ' + p.k, '요일 틀림', p.v.replace(x.raw, x.raw) + ' · ' + x.y + '년 ' + x.m + '월 ' + x.d + '일은 ' + x.real + '요일', '(' + x.real + ')로 수정', 'wd');
      });
      if (ds.length) datesBy.push({ k: p.k, d: ds, last: ds[ds.length - 1], first: ds[0] });
    }
  });
  if (infoBlank.length) add('o', 'info', '기본 정보', '일정·수량 빈칸 ' + infoBlank.length + '곳', infoBlank, '확정되면 기입', 'info-empty');
  // 담당자 "(디자인)" 뒤 이름 빈칸
  var emptyRole = I.cells.filter(function (x) { return /^\((디자인|제작\s*기획|기획|제작)\)\s*$/.test(x.t); });
  if (emptyRole.length) add('o', 'info', '기본 정보 › 담당자', '담당자 이름 빈칸 ' + emptyRole.length + '곳', emptyRole.map(function (x) { return x.t + ' 뒤 이름·연락처 없음'; }), '담당자 이름 · 연락처 기입', 'role');
  if (dupL.length) add('p', 'info', '기본 정보', '같은 칸 이름 두 번', dupL.map(function (k) { return '"' + k + '" 2번'; }), '두 번째 칸 이름 확인 (예: 단가)', 'dup');
  // 일정 순서
  var ORDER = [[/예약|예판/, '예약판매'], [/확정일/, '발주 수량 확정일'], [/전달일/, '데이터 전달일'], [/시작일|입고일|납기/, '입고·배송']];
  var seq = [];
  ORDER.forEach(function (o) { var x = datesBy.filter(function (b) { return o[0].test(b.k); })[0]; if (x) seq.push({ n: x.k, s: x.first, e: x.last }); });
  for (var si = 1; si < seq.length; si++) {
    if (seq[si].s.t < seq[si - 1].s.t) add('r', 'date', '기본 정보 › 일정', '일정 순서 뒤바뀜', seq[si - 1].n + ' ' + md(seq[si - 1].s) + ' → ' + seq[si].n + ' ' + md(seq[si].s), '날짜 확인', 'order');
  }
  // 주말·공휴일
  var hol = function (x) { try { var H = root.PLYSH_REVIEW && root.PLYSH_REVIEW.korHolidays ? root.PLYSH_REVIEW.korHolidays(x.y) : (ctx.holidays && ctx.holidays(x.y)) || {}; return H[x.ymd] || ''; } catch (e) { return ''; } };
  datesBy.forEach(function (b) {
    if (!/전달일|확정일|입고일|납기/.test(b.k)) return;
    b.d.forEach(function (x) {
      var h = hol(x);
      if (x.real === '토' || x.real === '일' || h) add('p', 'date', '기본 정보 › ' + b.k, b.k + ' ' + (h ? '공휴일' : '주말'), md(x) + (h ? ' ' + h : ''), '업체 근무일 확인 · 권장 앞 평일', 'wkend');
    });
  });
  if (I.kv.length && !out.some(function (x) { return x.cat === 'info' || x.cat === 'date'; })) pass.push('기본 정보 · 일정');

  // 3) 번호
  var nos = groups.map(function (G) { return G.no; }).filter(Boolean), dupNo = [], seenNo = {};
  nos.forEach(function (n) { if (seenNo[n]) dupNo.push(n); seenNo[n] = 1; });
  if (dupNo.length) {
    var restart = groups.filter(function (G, i) { return i && G.no === '1'; })[0];
    add('p', 'no', '번호', '번호 겹침 ' + dupNo.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', '), restart ? '"' + restart.name + '"부터 다시 1번' : '같은 번호 ' + dupNo.length + '곳', ['이어지는 번호 권장 (예: ' + (nos.length - dupNo.length + 1) + '번부터)', '따로 묶은 구간이면 구간 이름 표시'], 'no');
  } else if (nos.length) pass.push('번호');

  // 4) 품목별
  var tbd = [], blanks = [];
  groups.forEach(function (G) {
    var S = G.S, rows = G.rows;
    var cover = rows.filter(function (x) { return /표지|커버/.test(x.part) && !/내지/.test(x.part); })[0];
    var inner = rows.filter(function (x) { return /내지/.test(x.part) && !/표지/.test(x.part); })[0];
    var both = rows.filter(function (x) { return /표지/.test(x.part) && /내지/.test(x.part); })[0];
    var isBook = /무선|PUR|중철|양장|사철/i.test(G.bindAll);
    var isCal = /캘린더|달력|calendar/i.test(G.name);
    var isDiary = /다이어리|노트|플래너|diary/i.test(G.name);

    rows.forEach(function (x) {
      var printed = !!inkOf(x.ink) && inkOf(x.ink).join('') !== '00';
      // 빈칸 ('-'는 해당 없음으로 봄)
      var need = G.md ? [['크기', x.size, C.size]] : printed ? [['크기', x.size, C.size], ['종이', x.paper, C.paper], ['장수·쪽수', x.cnt, C.cnt], ['코팅', x.coat, C.coat]] : [['크기', x.size, C.size]];
      var miss = need.filter(function (n) { return n[2] >= 0 && !T(n[1]); }).map(function (n) { return n[0]; });
      if (!x.part && C.item >= 0 && rows.length > 1) miss.unshift('품목');
      if (miss.length) blanks.push({ w: where(G, x), m: miss });
      // 미정·추천요청
      [['크기', x.size], ['종이', x.paper], ['장수·쪽수', x.cnt], ['후가공', x.fin], ['제본·톰슨', x.bind], ['품목', x.part]].forEach(function (f) { if (TBD.test(f[1])) tbd.push({ w: where(G, x), k: f[0], v: f[1] }); });

      // 인쇄도수 ↔ 방식·컬러
      var ik = inkOf(x.ink), mc = methodColors(x.method);
      if (ik && mc && (ik[0] !== mc[0] || ik[1] !== mc[1])) add('r', 'ink', where(G, x), '인쇄도수와 컬러 다름', '인쇄도수 ' + x.ink + ' · 방식·컬러 ' + x.method, '둘 중 맞는 쪽으로 통일', 'ink');

      // 장수 ↔ 쪽수
      var sp = sheetsPages(x.cnt);
      if (ik && sp.sh && sp.p) {
        var two = ik[1] > 0;
        if (cover === x && isBook && sp.p === 4 && sp.sh !== 1) add('o', 'cnt', where(G, x), '표지 장수 ' + sp.sh + '장', '표지 ' + x.cnt + ' · 펼침 표지 4p는 1장', '1장 / 4p로 수정 (따로 붙이는 앞·뒤 표지면 비고에 표시)', 'cover');
        else if (S.faces || (/중철/.test(G.bindAll) && sp.p === sp.sh * 4)) { /* 아코디언은 면 수로, 중철 내지는 접장(1장=4p)으로 봄 */ }
        else if (two && sp.p !== sp.sh * 2 && !(isBook && cover === x && sp.p === 4 && sp.sh === 1)) add('o', 'cnt', where(G, x), '장수와 쪽수 안 맞음', x.cnt + ' · 양면 인쇄(' + x.ink + ')면 ' + sp.sh + '장 = ' + sp.sh * 2 + 'p', '장수·쪽수 확인', 'cnt');
        else if (!two && sp.p !== sp.sh && sp.p !== sp.sh * 2) add('o', 'cnt', where(G, x), '장수와 쪽수 안 맞음', x.cnt + ' · 단면 인쇄(' + x.ink + ')', '장수·쪽수 확인', 'cnt');
      }
      // 평량 없음
      if (printed && filled(x.paper) && !gsmOf(x.paper) && !/\d\s*T\b|\d\s*mm|골/i.test(x.paper) && !TBD.test(x.paper)) {
        var gm = x.paper.match(/^(.*?)\s*(\d{2,4})\s*$/);
        if (gm) G.gsmTxt = (G.gsmTxt || []).concat(x.paper + ' → ' + gm[1] + ' / ' + gm[2] + 'g');
        else add('o', 'paper', where(G, x), '평량 없음', '종이 ' + x.paper, '평량(g) 기입', 'gsm');
      }
      // 다이어리 내지 코팅
      if (isDiary && x === inner && filled(x.coat) && /코팅|라미/.test(x.coat)) add('o', 'coat', where(G, x), '필기 면에 코팅', '코팅 ' + x.coat + ' · 종이 ' + x.paper, ['코팅 면은 볼펜·젤펜이 번지거나 잘 안 써짐', '권장 내지 코팅 없음'], 'diary');
      // 크기 · 가로세로 순서 (후가공 칸 안의 면적)
      var rs = sizes(x.size)[0], fs = sizes(x.fin);
      if (!rs && G.rows[0] !== x) rs = sizes(G.rows[0].size)[0];
      if (rs) fs.forEach(function (f) { if (!sameSize(rs, f) && swapSize(rs, f)) add('p', 'size', where(G, x), '가로·세로 순서 다름', '크기 ' + rs.raw + ' · 후가공 ' + f.raw, '같은 순서(가로×세로)로 통일', 'swap'); });
      // 접지 크기 계산
      var all = sizes(x.size), fold = /접지|폴드|fold/i.test(x.bind + x.size + G.note);
      if (fold && all.length) {
        var open = all[0], doneTxt = (x.size + ' ' + G.note).match(/(?:접지\s*(?:후|완성)|완성)\s*(\d{2,4}(?:\.\d+)?\s*[×xX*]\s*\d{2,4}(?:\.\d+)?)/);
        if (doneTxt) {
          var dn = sizes(doneTxt[1])[0], ok = false;
          for (var a = 1; a <= 10 && !ok; a++) for (var b2 = 1; b2 <= 10 && !ok; b2++) { var c1 = { w: open.w / a, h: open.h / b2 }; if (sameSize(c1, dn, 2) || swapSize(c1, dn, 2)) ok = true; }
          if (!ok) add('r', 'size', where(G, x), '접지 크기 계산 안 맞음', '펼침 ' + open.raw + ' · 접지 후 ' + dn.raw, '펼침 크기 ÷ 접는 수 = 접지 크기로 맞춤', 'fold');
        }
      }
      // 아코디언: 면 수 × 한 면 폭 = 펼침
      var fl = x.size.match(/펼침\s*(\d{2,4})/);
      if (S.faces && all.length && fl) {
        var want = S.faces * all[0].w;
        if (!near(want, +fl[1], 2)) add('r', 'size', where(G, x), '펼침 길이 계산 안 맞음', S.faces + '면 × ' + all[0].w + 'mm = ' + want + 'mm · 표기 ' + fl[1] + 'mm', '면 수 · 펼침 길이 확인', 'acc');
        if (ik && sp.p && ik[1] > 0 && sp.p !== S.faces * 2) add('o', 'cnt', where(G, x), '면 수와 쪽수 안 맞음', '구성 ' + S.faces + '면 · 양면 인쇄 → ' + S.faces * 2 + 'p · 표기 ' + sp.p + 'p', '쪽수 확인', 'face');
      }
      // 인치와 mm를 같이 적었을 때 환산 확인
      var inch = all.filter(function (z) { return z.inch; })[0], mm = all.filter(function (z) { return !z.inch; })[0];
      if (inch && mm && !sameSize(inch, mm, 1) && !swapSize(inch, mm, 1)) add('o', 'size', where(G, x), '인치·mm 크기 다름', inch.raw + ' = ' + f1(inch.w) + '×' + f1(inch.h) + 'mm · 표기 ' + mm.raw, '실제 재단 크기 하나로 확정', 'inch');
      // 표기: x · * · 단위 없음
      rs = all[0];
      if (rs && (/[xX*]/.test(rs.sep) || (!rs.unit && !/mm|cm|in/.test(x.size)))) G.notation = (G.notation || []).concat(x.size);
    });

    // 책: 쪽수 규칙 · 구성 쪽수 · 책등
    if (isBook && (inner || both)) {
      var ip = sheetsPages((inner || both).cnt), cp = cover ? sheetsPages(cover.cnt) : {};
      var total = (ip.p || 0) + (cover ? (cp.p || 4) : 0);
      if (/중철/.test(G.bindAll) && total && total % 4) add('r', 'bind', where(G), '중철 쪽수 4의 배수 아님', '표지 ' + (cover ? (cp.p || 4) : 0) + 'p + 내지 ' + ip.p + 'p = ' + total + 'p', '권장 4의 배수 (' + (total + 4 - total % 4) + 'p 또는 ' + (total - total % 4) + 'p)', 'saddle');
      if (/무선|PUR/i.test(G.bindAll) && ip.p && ip.p % 2) add('r', 'bind', where(G), '내지 쪽수 홀수', '내지 ' + ip.p + 'p', '짝수 쪽수로 맞춤', 'odd');
      if (S.p && ip.p && S.p !== ip.p && S.p !== total) add('r', 'cnt', where(G), '구성 쪽수와 표 쪽수 다름', '구성 ' + G.set + ' · 표지 ' + (cover ? (cp.p || 4) : 0) + 'p + 내지 ' + ip.p + 'p = ' + total + 'p', '구성 칸 또는 내지 쪽수 수정', 'setp');
      // 책등
      if (/무선|PUR|양장/i.test(G.bindAll) && ip.p && inner) {
        var gsm = gsmOf(inner.paper), est = (ip.sh || ip.p / 2) * caliper(inner.paper, gsm) + (cover ? 0.3 : 0);
        var sm = ((cover && cover.size) + ' ' + inner.size + ' ' + G.note).match(/책등\s*(\d+(?:\.\d+)?)\s*mm/), later = /책등[^/]*(별도|산출|추후|확정\s*후)/.test((cover && cover.size) + ' ' + G.note);
        if (gsm && est) {
          if (sm && Math.abs(+sm[1] - est) > Math.max(0.5, est * 0.15)) add('p', 'spine', where(G), '책등 두께 확인', '책등 ' + sm[1] + 'mm · 내지 ' + (ip.sh || ip.p / 2) + '장 ' + T(inner.paper) + ' 기준 예상 약 ' + f1(est) + 'mm', '업체 종이 두께로 확정 권장', 'spine');
          else if (!sm && !later) add('p', 'spine', where(G), '책등 두께 없음', '내지 ' + (ip.sh || ip.p / 2) + '장 ' + T(inner.paper) + ' · 예상 약 ' + f1(est) + 'mm', '표지 크기에 책등 기입 권장', 'spine0');
        }
      }
    }
    // 달력: 구성 매수 = 표지 + 내지
    if (isCal && (S.sh || S.p)) {
      var pr = rows.filter(function (x) { return /표지|내지/.test(x.part); }), sh = 0, pp = 0;
      pr.forEach(function (x) { var q = sheetsPages(x.cnt); sh += q.sh || 0; pp += q.p || 0; });
      var det = pr.map(function (x) { return x.part + ' ' + (sheetsPages(x.cnt).sh || '?') + '매'; }).join(' + ');
      if (pr.length && ((S.sh && sh && S.sh !== sh) || (!S.sh && S.p && pp && S.p !== pp))) add('r', 'cnt', where(G), '구성 매수와 표지·내지 합 다름', '구성 ' + G.set + ' · ' + det + ' = ' + sh + '매 / ' + pp + 'p', '구성 칸 또는 내지 매수 수정', 'cal');
      var mo = G.note.match(/월별\s*(\d+)\s*매/), inn = rows.filter(function (x) { return /내지/.test(x.part) && !/표지/.test(x.part); })[0];
      if (mo && inn && sheetsPages(inn.cnt).sh && +mo[1] !== sheetsPages(inn.cnt).sh) add('r', 'cnt', where(G, inn), '비고와 내지 매수 다름', '비고 "월별 ' + mo[1] + '매" · 내지 ' + inn.cnt, '내지 ' + mo[1] + '매 / ' + mo[1] * 2 + 'p로 수정 또는 비고 수정', 'calnote');
    }
    // 비고에 적힌 쪽수 ↔ 표
    var nt = G.note, inP = (inner || both) ? sheetsPages((inner || both).cnt).p : 0, cvP = cover ? (sheetsPages(cover.cnt).p || 4) : 0, m1;
    if ((m1 = nt.match(/표지\s*포함\s*(\d+)\s*p/i)) && inP && +m1[1] !== inP + cvP) add('r', 'cnt', where(G), '비고와 쪽수 다름', '비고 "표지 포함 ' + m1[1] + 'p" · 표 표지 ' + cvP + 'p + 내지 ' + inP + 'p = ' + (inP + cvP) + 'p', '내지 ' + (+m1[1] - cvP) + 'p로 수정 또는 비고 수정', 'notep');
    if ((m1 = nt.match(/내지\s*(\d+)\s*p/i)) && inP && +m1[1] !== inP) add('o', 'cnt', where(G), '비고와 내지 쪽수 다름', '비고 "내지 ' + m1[1] + 'p" · 표 내지 ' + inP + 'p', '최종 쪽수로 비고 정리', 'notei');
    // 비고에 적힌 크기 ↔ 표
    var szs = []; rows.forEach(function (x) { szs = szs.concat(sizes(x.size), sizes(x.fin)); });
    var fx = (cover && cover.size) || rows.map(function (x) { return x.size; }).join(' ');
    sizes(nt).forEach(function (s) {
      if (s.w < 10 || s.h < 10 || /접지|완성|펼침/.test(s.ctx)) return;
      if (szs.some(function (z) { return sameSize(z, s, 0.6) || swapSize(z, s, 0.6) || (s.d && z.d && near(z.d, s.d)); })) return;
      add('o', 'size', where(G), '비고와 크기 다름', '비고 ' + s.raw + ' · 크기 ' + (rows[0].size || fx), '최종 크기 확인 후 한쪽으로 정리', 'notesz');
    });
    var pf = nt.match(/펼침\s*(\d{2,4})\s*mm/), sf = rows.map(function (x) { return x.size; }).join(' ').match(/펼침\s*(\d{2,4})/);
    if (pf && sf && pf[1] !== sf[1]) add('o', 'size', where(G), '비고와 펼침 길이 다름', '비고 펼침 ' + pf[1] + 'mm · 크기 펼침 ' + sf[1] + 'mm', '최종 펼침 길이로 정리', 'notefl');
    // 종 수 ↔ 장수 · 정합 · 멤버 수
    if (S.kinds > 1) {
      rows.forEach(function (x) {
        var q = sheetsPages(x.cnt);
        if (q.sh && q.sh % S.kinds && !/종당/.test(x.cnt)) add('p', 'cnt', where(G, x), '장수가 종당인지 전체인지 불분명', '구성 ' + S.kinds + '종 · 장수 ' + x.cnt, '종당이면 "종당 ' + q.sh + '장" 표시 · 전체면 ' + S.kinds + '의 배수로', 'kinds');
      });
      var jh = (G.note + ' ' + G.pack).match(/(\d+)\s*종\s*정합/);
      if (jh && +jh[1] !== S.kinds) add('r', 'cnt', where(G), '정합 종 수 다름', '구성 ' + S.kinds + '종 · "' + jh[0] + '"', '종 수 통일', 'jh');
    }
    if (ctx.members > 1 && (S.member || /멤버\s*별/.test(G.note)) && S.kinds && S.kinds !== ctx.members) add('r', 'cnt', where(G), '멤버 수와 종 수 다름', '멤버별 ' + S.kinds + '종 · ' + (ctx.artist || '') + ' 멤버 ' + ctx.members + '명', '종 수 확인', 'mem');
  });

  if (blanks.length) add('o', 'blank', '품목 ' + blanks.length + '곳', '빈칸 ' + blanks.length + '곳', blanks.map(function (b) { return b.w + ' · ' + b.m.join(', '); }), ['내용 기입', '해당 없음이면 "-" 표시'], 'blank');
  else pass.push('필수 칸 (크기 · 종이 · 장수 · 코팅)');

  // 5) 표기
  var notation = []; groups.forEach(function (G) { (G.notation || []).forEach(function (s) { if (notation.indexOf(s) < 0) notation.push(s); }); });
  if (notation.length) add('p', 'text', '크기 ' + notation.length + '곳', '크기 표기 통일', notation.slice(0, 8).map(function (s) { return s; }).concat(notation.length > 8 ? ['외 ' + (notation.length - 8) + '곳'] : []), '권장 "가로×세로mm" (× 기호 · mm 단위)', 'notation');
  var gt = []; groups.forEach(function (G) { (G.gsmTxt || []).forEach(function (s) { if (gt.indexOf(s) < 0) gt.push(s); }); });
  if (gt.length) add('p', 'text', '종이 ' + gt.length + '곳', '평량 단위 g 없음', gt, '권장 "종이 / 평량g"', 'gsmtxt');
  // 같은 열의 띄어쓰기만 다른 표기
  var vari = [];
  var colsToCheck = [C.coat, C.paper, C.method, C.fin, C.pack].concat(C.bind).filter(function (i) { return i >= 0; });
  colsToCheck.forEach(function (ci) {
    var map = {};
    (d.rows || []).forEach(function (r) {
      T(r && r[ci]).split(/\s*\/\s*|\s*\+\s*/).forEach(function (t) { t = t.replace(/\s*\([^)]*\)\s*/g, '').trim(); if (t.length < 3) return; var k = t.replace(/\s+/g, ''); (map[k] = map[k] || []).indexOf(t) < 0 && map[k].push(t); });
    });
    Object.keys(map).forEach(function (k) { if (map[k].length > 1) vari.push(map[k].join(' / ')); });
  });
  if (vari.length) add('p', 'text', '표기 ' + vari.length + '곳', '띄어쓰기 다른 같은 말', vari, '한 가지로 통일', 'space');
  // 자주 틀리는 말 · 혼자 떨어진 글자
  var typos = [], stray = [];
  function scan(t, w) {
    TYPO.forEach(function (p) { if (t.indexOf(p[0]) >= 0) { var s = p[0] + ' → ' + p[1]; if (typos.indexOf(s) < 0) typos.push(s); } });
    if (/^[ㄱ-ㅎㅏ-ㅣ]$|^[vzwVZW]$/.test(t)) stray.push(w + ' "' + t + '"');
  }
  (d.rows || []).forEach(function (r, ri) { (r || []).forEach(function (v, ci) { v = T(v); if (v) scan(v, (C.H[ci] || '') + ' 칸'); }); });
  I.cells.forEach(function (x) { scan(x.t, '기본 정보'); });
  if (typos.length) add('o', 'text', '맞춤법', '맞춤법 ' + typos.length + '곳', typos, '바른 표기로 수정', 'typo');
  if (stray.length) add('p', 'text', '혼자 떨어진 글자', '혼자 떨어진 글자 ' + stray.length + '곳', stray, '잘못 입력한 글자면 삭제', 'stray');
  if (!out.some(function (x) { return x.cat === 'text'; })) pass.push('표기 · 맞춤법');
  if (!out.some(function (x) { return x.cat === 'cnt' || x.cat === 'bind'; })) pass.push('장수 · 쪽수 · 구성');
  if (!out.some(function (x) { return x.cat === 'ink'; })) pass.push('인쇄도수 · 컬러');
  if (!out.some(function (x) { return x.cat === 'size'; })) pass.push('크기 · 접지 계산');

  // 6) 아직 정하지 않은 칸 (조언, 한 항목)
  if (tbd.length) add('p', 'tbd', '미정 ' + tbd.length + '곳', '아직 정하지 않은 칸 ' + tbd.length + '곳', tbd.map(function (x) { return x.w + ' · ' + x.k + ' "' + x.v + '"'; }), '데이터 전달 전 확정', 'tbd');

  var ORD = { r: 0, o: 1, p: 2 };
  out.sort(function (a, b) { return ORD[a.lv] - ORD[b.lv]; });
  var pj = I.kv.filter(function (p) { return /프로젝트명/.test(p.k) && p.v; })[0];
  var title = pj ? pj.v : (I.cells.filter(function (x) { return x.t.length > 6 && !LAB.test(x.t) && !/^\(|^\d|^010/.test(x.t); })[0] || {}).t || lab;
  return { title: title, name: lab, tab: d.tab, groups: groups.length, rows: groups.reduce(function (s, G) { return s + G.rows.length; }, 0), kv: I.kv, items: out, pass: pass };
}

// ── 결과지 ──
var LV = { r: ['경고', '#e0263a', '수정함'], o: ['주의', '#ff7300', '확인함'], p: ['조언', '#6546b9', '확인'] };
function render(R, opt) {
  opt = opt || {};
  var c = { r: 0, o: 0, p: 0 }; R.items.forEach(function (x) { c[x.lv]++; });
  var now = new Date(), stamp = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();
  var h = '<div class="spk">';
  h += '<div class="spk-mast"><b>PLYSH 검수</b><span>사양서 검수 · ' + stamp + '</span></div>';
  h += '<p class="spk-eye">사양서 검수 결과</p><h1>' + esc(R.title || R.name) + '</h1>';
  h += '<div class="spk-file">' + esc(R.name) + (R.tab ? ' · 탭 ' + esc(R.tab) : '') + ' · 품목 ' + R.groups + '개 · ' + R.rows + '줄' + (opt.url ? ' · <a href="' + esc(opt.url) + '" target="_blank" rel="noopener">시트 열기</a>' : '') + '</div>';
  h += '<div class="spk-stat">' + ['r', 'o', 'p'].map(function (k) { return '<span class="' + k + '"><b>' + c[k] + '</b>' + LV[k][0] + '</span>'; }).join('') + '<span class="g"><b>' + R.pass.length + '</b>통과</span></div>';
  if (R.items.length) {
    h += '<h2>요약</h2><table class="spk-sum"><tr><th>#</th><th>단계</th><th>위치</th><th>내용</th></tr>' + R.items.map(function (x, i) {
      return '<tr><td class="n">' + (i + 1) + '</td><td><i class="lv ' + x.lv + '">' + LV[x.lv][0] + '</i></td><td>' + esc(x.where) + '</td><td>' + esc(x.title) + '</td></tr>';
    }).join('') + '</table>';
    h += '<h2>자세히</h2>';
    h += R.items.map(function (x, i) {
      return '<div class="spk-it ' + x.lv + '"><div class="spk-no">' + (i + 1) + '</div><div class="spk-bd"><div class="spk-h"><i class="lv ' + x.lv + '">' + LV[x.lv][0] + '</i><b>' + esc(x.title) + '</b><label class="spk-cb"><input type="checkbox"><span>' + LV[x.lv][2] + '</span></label></div>' +
        '<dl><dt>위치</dt><dd>' + esc(x.where) + '</dd><dt>문제</dt><dd>' + (x.prob.length > 1 ? '<ul>' + x.prob.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : esc(x.prob[0] || '')) + '</dd>' +
        '<dt>해결</dt><dd class="fx"><ul>' + x.fix.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></dd></dl></div></div>';
    }).join('');
  } else h += '<p class="spk-ok">고칠 곳이 없어요.</p>';
  if (R.pass.length) h += '<h2>통과</h2><div class="spk-pass">' + R.pass.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>';
  h += '<div class="spk-foot"><span>PLYSH 검수 · 사양서</span><span>' + stamp + '</span></div></div>';
  return h;
}
var CSS = '.spk{background:#fff;color:#191f28;font-family:"Pretendard Variable",Pretendard,-apple-system,sans-serif;letter-spacing:-0.01em;line-height:1.5;font-size:13px;padding:36px 40px 26px;border-radius:20px}' +
  '.spk a{color:inherit}.spk-mast{display:flex;justify-content:space-between;font-size:11px;color:#4e5968;border-bottom:1px solid #191f28;padding-bottom:8px;margin-bottom:22px}.spk-mast b{color:#191f28;font-weight:900}' +
  '.spk-eye{font-size:12px;color:#4e5968;margin:0 0 4px}.spk h1{font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:0 0 4px;line-height:1.3}.spk-file{font-size:12px;color:#4e5968}' +
  '.spk-stat{display:flex;gap:6px;margin:16px 0 4px;flex-wrap:wrap}.spk-stat span{min-width:76px;padding:8px 12px;font-size:11px;text-align:center;border-radius:10px;line-height:1.3}.spk-stat b{display:block;font-size:22px}' +
  '.spk-stat .r{background:#fdecee;color:#e0263a}.spk-stat .o{background:#fff1e5;color:#ff7300}.spk-stat .p{background:#f2eefb;color:#6546b9}.spk-stat .g{background:#e7f8f1;color:#0c8a62}' +
  '.spk h2{font-size:15px;font-weight:700;margin:26px 0 10px}' +
  '.spk-sum{width:100%;border-collapse:collapse;font-size:12.5px}.spk-sum th{text-align:left;font-weight:500;font-size:11px;color:#4e5968;border-bottom:1px solid #191f28;padding:6px 8px}.spk-sum td{border-bottom:1px solid #e5e8eb;padding:7px 8px;vertical-align:top}.spk-sum .n{color:#4e5968;font-variant-numeric:tabular-nums;width:24px}' +
  '.spk .lv{font-style:normal;font-size:11px;font-weight:800;border-radius:5px;padding:2px 6px;white-space:nowrap}.spk .lv.r{background:#fdecee;color:#e0263a}.spk .lv.o{background:#fff1e5;color:#ff7300}.spk .lv.p{background:#f2eefb;color:#6546b9}' +
  '.spk-it{display:grid;grid-template-columns:30px 1fr;gap:12px;border-top:1px solid #e5e8eb;padding:14px 0;break-inside:avoid}.spk-no{width:26px;height:26px;border-radius:50%;color:#fff;font-weight:700;font-size:12.5px;display:flex;align-items:center;justify-content:center}' +
  '.spk-it.r .spk-no{background:#e0263a}.spk-it.o .spk-no{background:#ff7300}.spk-it.p .spk-no{background:#8b71d0}' +
  '.spk-h{display:flex;gap:8px;align-items:center;margin:2px 0 8px}.spk-h b{font-size:14.5px;flex:1}.spk-cb{display:flex;align-items:center;gap:5px;font-size:12px;color:#4e5968;white-space:nowrap;cursor:pointer}' +
  '.spk-cb input{appearance:none;-webkit-appearance:none;width:16px;height:16px;border:1.5px solid #8b95a1;border-radius:4px;margin:0;background:#fff;cursor:pointer;display:grid;place-content:center}.spk-cb input:checked::after{content:"";width:9px;height:5px;border:solid #191f28;border-width:0 0 2px 2px;transform:rotate(-45deg) translate(1px,-1px)}' +
  '.spk dl{display:grid;grid-template-columns:40px 1fr;gap:3px 10px;margin:0}.spk dt{font-size:11px;color:#4e5968;padding-top:2px}.spk dd{margin:0}.spk dd ul{margin:0;padding-left:15px}.spk dd.fx{font-weight:500}' +
  '.spk-pass{display:flex;flex-wrap:wrap;gap:6px}.spk-pass span{background:#e7f8f1;color:#0c8a62;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600}.spk-pass span::before{content:"✓ "}' +
  '.spk-ok{font-size:15px;font-weight:700;color:#0c8a62}.spk-foot{display:flex;justify-content:space-between;font-size:10px;color:#4e5968;border-top:1px solid #e5e8eb;margin-top:28px;padding-top:8px}' +
  '@media (max-width:560px){.spk{padding:22px 16px}.spk h1{font-size:21px}.spk-sum td:nth-child(3){display:none}.spk-sum th:nth-child(3){display:none}}';

var api = { check: check, render: render, CSS: CSS, _t: { sizes: sizes, dates: dates, setOf: setOf, sheetsPages: sheetsPages, methodColors: methodColors, cols: cols, infoKV: infoKV } };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PLYSH_SPECCHECK = api;
})(typeof window !== 'undefined' ? window : globalThis);
