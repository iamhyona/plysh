// PLYSH 터잡기 미리보기 (2026-11-19)
// PDF 페이지를 일반적인 직각 접지(4·8·16·32p) 기준으로 인쇄 판에 앉혀서 앞면·뒷면을 보여 준다.
// 접지 순서는 실제로 종이를 접는 과정을 흉내 내서 계산한다 (16p: 앞면 아래줄 4·13·16·1 / 윗줄 거꾸로 5·12·9·8).
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
var PT = 25.4 / 72;
var SHEETS = { kj: [939, 636], kh: [636, 469], k4: [469, 318], sj: [1091, 788], sh: [788, 545], s4: [545, 394] };
var SHEET_NAME = { kj: '국전', kh: '국반절', k4: '국4절', sj: '46전', sh: '46반절', s4: '46 4절', cu: '직접 입력' };

var O = { bind: 'perfect', sheet: 'kj', mode: 'sw', sig: 0, cover: false, spread: false, shW: 939, shH: 636, pgW: 0, pgH: 0, gap: 6, grip: 12, edge: 6, ink: false };
try { var sv = JSON.parse(localStorage.getItem('plysh:impose') || 'null'); if (sv) ['bind', 'sheet', 'mode', 'sig', 'shW', 'shH', 'gap', 'grip', 'edge', 'ink'].forEach(function (k) { if (sv[k] != null) O[k] = sv[k]; }); } catch (e) {}
function save() { try { localStorage.setItem('plysh:impose', JSON.stringify(O)); } catch (e) {} }

// 원본 페이지: { url, w, h (mm, 재단 기준), ink:[전체, 왼쪽 반, 오른쪽 반] }
var RAW = [], NAME = '', PAGES = [];

// ── 라이브러리 ──
function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('불러오기 실패: ' + src)); }; document.head.appendChild(s); }); }
var libP = null;
function libs() {
  if (!libP) libP = Promise.all([loadScript(LIBS.pdfjs), loadScript(LIBS.pdflib).catch(function () {})]).then(function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.worker; });
  return libP;
}

// ── 잉크 양 (대략): RGB → 단순 CMYK 합계 % ──
function inkOf(ctx, x, y, w, h) {
  if (w < 1 || h < 1) return 0;
  var d = ctx.getImageData(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h))).data, s = 0, n = 0, step = 4 * 3;
  for (var i = 0; i < d.length; i += step) {
    var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, k = 1 - Math.max(r, g, b);
    if (k >= 1) { s += 1; } else { s += (1 - r - k) / (1 - k) + (1 - g - k) / (1 - k) + (1 - b - k) / (1 - k) + k; }
    n++;
  }
  return n ? Math.round(s / n * 100) : 0;
}
function finishRaw(cv, wmm, hmm) {
  var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  return { url: cv.toDataURL('image/jpeg', 0.82), w: wmm, h: hmm, ink: [inkOf(ctx, 0, 0, W, H), inkOf(ctx, 0, 0, W / 2, H), inkOf(ctx, W / 2, 0, W / 2, H)] };
}

// ── PDF 읽기 ──
function readPdf(file) {
  NAME = file.name; $('#fname').textContent = file.name + ' 읽는 중…';
  bar(0);
  var buf;
  return file.arrayBuffer().then(function (b) { buf = b; return libs(); }).then(function () {
    var trims = null;
    var lp = window.PDFLib ? window.PDFLib.PDFDocument.load(buf.slice(0), { ignoreEncryption: true, updateMetadata: false }).then(function (d) {
      trims = d.getPages().map(function (p) { try { var t = p.getTrimBox(); return [t.x, t.y, t.x + t.width, t.y + t.height]; } catch (e) { return null; } });
    }).catch(function () {}) : Promise.resolve();
    return lp.then(function () { return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise; }).then(function (doc) {
      RAW = []; var n = doc.numPages, i = 0;
      function next() {
        if (i >= n) return Promise.resolve();
        var idx = i++;
        return doc.getPage(idx + 1).then(function (page) {
          var v = page.view, t = (trims && trims[idx]) || v;
          var tx0 = Math.max(t[0], v[0]), ty0 = Math.max(t[1], v[1]), tx1 = Math.min(t[2], v[2]), ty1 = Math.min(t[3], v[3]);
          if (page.rotate || tx1 - tx0 < 10 || ty1 - ty0 < 10) { tx0 = v[0]; ty0 = v[1]; tx1 = v[2]; ty1 = v[3]; }
          var tw = tx1 - tx0, th = ty1 - ty0, rot = page.rotate || 0;
          var long = Math.max(tw, th), sc = Math.min(3, (tw > th * 1.3 ? 760 : 420) / long * (tw > th ? 1 : th / tw > 1.6 ? 1 : 1));
          sc = Math.min(sc, 520 / Math.min(tw, th) * 1.6);
          var vp = page.getViewport({ scale: sc });
          var full = document.createElement('canvas'); full.width = Math.ceil(vp.width); full.height = Math.ceil(vp.height);
          var fx = full.getContext('2d'); fx.fillStyle = '#fff'; fx.fillRect(0, 0, full.width, full.height);
          return page.render({ canvasContext: fx, viewport: vp }).promise.then(function () {
            var out = document.createElement('canvas'), wmm, hmm;
            if (rot) { out = full; wmm = (rot % 180 ? th : tw) * PT; hmm = (rot % 180 ? tw : th) * PT; }
            else {
              var cx = (tx0 - v[0]) * sc, cy = (v[3] - ty1) * sc, cw = tw * sc, ch = th * sc;
              out.width = Math.max(1, Math.round(cw)); out.height = Math.max(1, Math.round(ch));
              out.getContext('2d').drawImage(full, cx, cy, cw, ch, 0, 0, out.width, out.height);
              wmm = tw * PT; hmm = th * PT;
            }
            RAW.push(finishRaw(out, wmm, hmm));
            page.cleanup && page.cleanup();
            bar(i / n);
            return next();
          });
        });
      }
      return next().then(function () { doc.destroy && doc.destroy(); });
    });
  }).then(function () {
    bar(-1); $('#fname').textContent = NAME + ' · PDF ' + RAW.length + 'p';
    onNewDoc();
  }).catch(function (e) { bar(-1); $('#fname').textContent = 'PDF를 읽지 못했어요: ' + (e && e.message || e); });
}
function bar(f) { var b = $('#bar'); if (f < 0) { b.classList.add('hide'); return; } b.classList.remove('hide'); $('#barI').style.width = Math.round(f * 100) + '%'; }

// ── 예시 문서 (A5 40p, 사진 면·글 면 섞음) ──
function demo() {
  NAME = '예시_포토북_A5_40p.pdf'; RAW = [];
  for (var i = 0; i < 40; i++) {
    var cv = document.createElement('canvas'); cv.width = 296; cv.height = 420; var c = cv.getContext('2d');
    var hue = (i * 37) % 360, dark = [2, 3, 8, 13, 14, 19, 24, 29, 30, 35].indexOf(i) > -1, text = i % 5 === 4;
    if (text) { c.fillStyle = '#fff'; c.fillRect(0, 0, 296, 420); c.fillStyle = '#c9ced4'; for (var l = 0; l < 14; l++) c.fillRect(34, 120 + l * 16, 228 - (l % 4) * 30, 6); }
    else {
      var g = c.createLinearGradient(0, 0, 296, 420);
      g.addColorStop(0, 'hsl(' + hue + ',' + (dark ? 45 : 60) + '%,' + (dark ? 22 : 78) + '%)'); g.addColorStop(1, 'hsl(' + ((hue + 40) % 360) + ',' + (dark ? 50 : 55) + '%,' + (dark ? 10 : 58) + '%)');
      c.fillStyle = g; c.fillRect(0, 0, 296, 420);
      c.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(148, 190, 78, 0, Math.PI * 2); c.fill();
      c.fillRect(70, 290, 156, 140);
    }
    c.fillStyle = text ? '#191f28' : (dark ? '#fff' : 'rgba(25,31,40,.85)'); c.font = '800 64px "Pretendard Variable", sans-serif'; c.textAlign = 'center'; c.fillText(String(i + 1), 148, text ? 86 : 214);
    RAW.push(finishRaw(cv, 148, 210));
  }
  $('#fname').textContent = NAME + ' · PDF 40p (예시)';
  onNewDoc();
}

function onNewDoc() {
  // 펼침면 자동 감지: 폭이 가장 좁은 페이지의 1.8배 이상인 페이지가 있으면 스프레드
  var ws = RAW.map(function (r) { return r.w; }), mn = Math.min.apply(null, ws), mx = Math.max.apply(null, ws);
  O.spread = RAW.length > 1 && mx > mn * 1.8;
  $('#spread').checked = O.spread;
  O.pgW = 0; O.pgH = 0; // 문서에서 다시 읽기
  layout();
}

// ── 논리 페이지 (펼침면이면 반으로 나눔) ──
function buildPages() {
  var ws = RAW.map(function (r) { return r.w; }), mn = Math.min.apply(null, ws), mx = Math.max.apply(null, ws), cut = mx > mn * 1.8 ? mn * 1.5 : 0;
  var out = [];
  RAW.forEach(function (r, i) {
    var split = O.spread && (cut ? r.w > cut : r.w > r.h);
    if (split) { out.push({ raw: i, half: 0, w: r.w / 2, h: r.h, ink: r.ink[1] }); out.push({ raw: i, half: 1, w: r.w / 2, h: r.h, ink: r.ink[2] }); }
    else out.push({ raw: i, half: -1, w: r.w, h: r.h, ink: r.ink[0] });
  });
  return out;
}
function commonSize(pg) {
  var cnt = {}, best = null;
  pg.forEach(function (p) { var k = Math.round(p.w) + 'x' + Math.round(p.h); cnt[k] = (cnt[k] || 0) + 1; if (!best || cnt[k] > cnt[best]) best = k; });
  return best ? best.split('x').map(Number) : [148, 210];
}

// ── 접지 흉내 ──
// C×R 칸을 접는다. 세로 접기(V)가 마지막이 되도록 번갈아 접고, 마지막 접기 자리가 책등(왼쪽)이 된다.
function fold(C, R) {
  var cells = [], pos = {};
  for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) { var id = cells.length; cells.push({ c: c, r: r, sx: 1, sy: 1 }); pos[c + ',' + r] = { x: c, y: r, st: [id] }; }
  var w = C, h = R, v = Math.round(Math.log2(C)), hz = Math.round(Math.log2(R)), seq = [], first = v > hz ? 'V' : 'H';
  for (var i = 0; i < v + hz; i++) seq.push(i % 2 === 0 ? first : (first === 'V' ? 'H' : 'V'));
  seq.forEach(function (k, i) {
    var np = {}, last = i === seq.length - 1;
    Object.keys(pos).forEach(function (key) {
      var p = pos[key], lo, mv, nx = p.x, ny = p.y;
      if (k === 'V') { lo = p.x < w / 2; mv = last ? lo : !lo; if (mv) nx = lo ? (w / 2 - 1 - p.x) : (w - 1 - p.x); else nx = lo ? p.x : p.x - w / 2; }
      else { lo = p.y < h / 2; mv = lo; if (mv) ny = h / 2 - 1 - p.y; else ny = p.y - h / 2; }
      if (mv) p.st.forEach(function (id) { if (k === 'V') cells[id].sx = -cells[id].sx; else cells[id].sy = -cells[id].sy; });
      var nk = nx + ',' + ny; np[nk] = np[nk] || { x: nx, y: ny, top: [], bot: [] };
      if (mv) np[nk].top = p.st.slice().reverse(); else np[nk].bot = p.st.slice();
    });
    pos = {}; Object.keys(np).forEach(function (kk) { var q = np[kk]; pos[kk] = { x: q.x, y: q.y, st: q.top.concat(q.bot) }; });
    if (k === 'V') w /= 2; else h /= 2;
  });
  var g = []; for (var rr = 0; rr < R; rr++) g.push([]);
  pos['0,0'].st.forEach(function (id, i) { var cl = cells[id], fl = cl.sx * cl.sy < 0, up = 2 * i + 1, dn = 2 * i + 2; g[cl.r][cl.c] = { f: fl ? dn : up, b: fl ? up : dn, rot: cl.sy === 1 ? 0 : 180 }; });
  // 1p 가 있는 면 = 앞면(바깥면). 각 면은 그 면을 바라본 모습으로.
  var outer = [], inner = [];
  for (var r2 = 0; r2 < R; r2++) { outer.push([]); inner.push([]); for (var c2 = 0; c2 < C; c2++) { var a = g[r2][C - 1 - c2], b = g[r2][c2]; outer[r2].push({ l: a.b, rot: a.rot }); inner[r2].push({ l: b.f, rot: b.rot }); } }
  return { C: C, R: R, outer: outer, inner: inner };
}
var GRID = { 4: [2, 1], 8: [2, 2], 16: [4, 2], 32: [4, 4], 64: [8, 4] };

// ── 판 위에 앉히기 ──
function sheetDims() { var a = +O.shW || 939, b = +O.shH || 636; return [Math.max(a, b), Math.min(a, b)]; }
// frame: rows×cols 배열 (각 칸 {..., rot}) → 판 위 좌표. 들어가지 않으면 null
// back=true: 뒷면 격자(종이를 좌우로 뒤집어 본 모습). 대를 90° 돌려 앉히면 판의 좌우 뒤집기가 대 기준 상하 뒤집기가 돼서 180° 돌린다.
function rot180(fr) { return fr.slice().reverse().map(function (row) { return row.slice().reverse().map(function (c) { return Object.assign({}, c, { rot: ((c.rot || 0) + 180) % 360 }); }); }); }
function hcat(a, b) { return a.map(function (row, r) { return row.concat(b[r]); }); }
function placeSides(outer, inner, pw, ph) { var po = place(outer, pw, ph); return [po, po ? place(inner, pw, ph, po.r90, true) : null]; }
// 돌려찍기: 판 왼쪽·오른쪽 반에 앞면·뒷면을 같이 앉힌다 (종이를 좌우로 뒤집어 같은 판으로 한 번 더 찍음)
function plateWT(outer, inner, pw, ph) { return place(hcat(outer, inner), pw, ph, false) || place(outer.concat(rot180(inner)), pw, ph, true); }
function place(frame, pw, ph, forceRot, back) {
  var fr0 = frame;
  var SD = sheetDims(), W = SD[0], H = SD[1], g = +O.gap || 0, e = +O.edge || 0, gr = +O.grip || 0;
  var aw = W - 2 * e, ah = H - gr - e, R = frame.length, C = frame[0].length;
  function tryRot(r90) {
    var frame = back && r90 ? rot180(fr0) : fr0;
    var cols = r90 ? R : C, rows = r90 ? C : R, cw = r90 ? ph : pw, ch = r90 ? pw : ph;
    var bw = cols * cw + (cols - 1) * g, bh = rows * ch + (rows - 1) * g;
    if (bw > aw + 0.01 || bh > ah + 0.01) return null;
    var x0 = e + (aw - bw) / 2, y0 = e + (ah - bh) / 2, cells = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      var cc = r90 ? R - 1 - r : c, rr = r90 ? c : r, f = frame[r][c];
      cells.push(Object.assign({}, f, { x: x0 + cc * (cw + g), y: y0 + rr * (ch + g), w: cw, h: ch, rot: ((f.rot || 0) + (r90 ? 90 : 0)) % 360 }));
    }
    return { W: W, H: H, cells: cells, r90: r90 };
  }
  if (forceRot != null) return tryRot(forceRot);
  return tryRot(false) || tryRot(true);
}
function fitsSig(S, pw, ph) { var gd = GRID[S]; if (!gd) return false; var C = gd[0] * (O.mode === 'wt' ? 2 : 1), R = gd[1], fr = []; for (var r = 0; r < R; r++) { fr.push([]); for (var c = 0; c < C; c++) fr[r].push({}); } return !!(O.mode === 'wt' ? plateWT(fr.map(function (r) { return r.slice(0, C / 2); }), fr.map(function (r) { return r.slice(0, C / 2); }), pw, ph) : place(fr, pw, ph)); }
// 낱장: 판 한 면에 가장 많이 들어가는 칸 수
function bestGrid(pw, ph, evenCols) {
  var SD = sheetDims(), W = SD[0], H = SD[1], g = +O.gap || 0, e = +O.edge || 0, gr = +O.grip || 0, aw = W - 2 * e, ah = H - gr - e, best = null;
  [false, true].forEach(function (r90) {
    var cw = r90 ? ph : pw, ch = r90 ? pw : ph, cols = Math.floor((aw + g) / (cw + g)), rows = Math.floor((ah + g) / (ch + g));
    if (evenCols) cols -= cols % 2;
    if (cols > 0 && rows > 0 && (!best || cols * rows > best.n)) best = { cols: cols, rows: rows, r90: r90, n: cols * rows };
  });
  return best;
}

function pageLabel(li) { return li == null ? '' : (li + 1) + 'p'; }

function compute() {
  var pg = PAGES, N = pg.length, pw = +O.pgW, ph = +O.pgH, res = { sheets: [], warns: [], sum: [] };
  if (!N || !(pw > 0) || !(ph > 0)) return res;
  var SD = sheetDims();
  if (O.bind === 'simplex' || O.bind === 'duplex') {
    var two = O.bind === 'duplex', wt = two && O.mode === 'wt', bg = bestGrid(pw, ph, wt);
    if (!bg) { res.warns.push(['red', '완성 크기가 판보다 커서 앉힐 수 없어요. 판 크기나 완성 크기를 확인해 주세요.']); return res; }
    var items = []; if (two) for (var i = 0; i < N; i += 2) items.push([i, i + 1 < N ? i + 1 : null]); else for (var j = 0; j < N; j++) items.push([j, null]);
    var per = wt ? bg.n / 2 : bg.n, cols = wt ? bg.cols / 2 : bg.cols, rows = bg.rows;
    var nSheets = Math.ceil(items.length / per);
    for (var s = 0; s < nSheets; s++) {
      var its = items.slice(s * per, (s + 1) * per), sheet = { title: (s + 1) + '판', sub: '', sides: [] };
      var mk = function (fn) { var fr = []; for (var r = 0; r < rows; r++) { fr.push([]); for (var c = 0; c < cols; c++) fr[r].push(fn(c, r)); } return fr; };
      var itemAt = function (c, r) { return its[r * cols + c]; };
      var cellOf = function (it, k) { var li = it ? it[k] : null; return { li: li, lab: it && li != null ? pageLabel(li) : '', rot: bg.r90 ? 90 : 0 }; };
      var front = mk(function (c, r) { return cellOf(itemAt(c, r), 0); });
      var back = mk(function (c, r) { var o = cellOf(itemAt(cols - 1 - c, r), 1); if (bg.r90) o.rot = 270; return o; });
      var placed;
      if (wt) {
        var plate = front.map(function (row, r) { return row.concat(back[r]); });
        placed = placeSheetGrid(plate, pw, ph, bg.r90);
        sheet.sides.push(side('앞뒤 같은 판', '한 장에서 2벌 나와요', placed));
      } else {
        sheet.sides.push(side('앞면', '', placeSheetGrid(front, pw, ph, bg.r90)));
        if (two) sheet.sides.push(side('뒷면', '종이를 좌우로 뒤집어 본 모습', placeSheetGrid(back, pw, ph, bg.r90)));
      }
      var a = its[0], z = its[its.length - 1];
      sheet.sub = two ? '낱장 ' + its.length + '개 (' + (a[0] + 1) + '–' + ((z[1] != null ? z[1] : z[0]) + 1) + 'p)' : (a[0] + 1) + '–' + (z[0] + 1) + 'p';
      res.sheets.push(sheet);
    }
    res.sum = [[N, 'p'], [nSheets, '판'], [per, '개씩 한 면에']];
    return res;
  }
  // 책 (무선·중철)
  var cov = O.cover && N >= 6, inner = [];
  for (var k = cov ? 2 : 0; k < (cov ? N - 2 : N); k++) inner.push(k);
  var NI = inner.length, Np = Math.ceil(NI / 4) * 4;
  var fitList = [16, 8, 4].filter(function (S) { return fitsSig(S, pw, ph); });
  if (!fitList.length) { res.warns.push(['red', '1대 4p도 판에 들어가지 않아요. 판 크기나 완성 크기를 확인해 주세요.']); return res; }
  var Smax = fitList[0];
  if (O.sig) { if (+O.sig === 32 ? fitsSig(32, pw, ph) : fitList.indexOf(+O.sig) > -1) Smax = +O.sig; else res.warns.push(['', O.sig + 'p 대는 이 판에 들어가지 않아서 ' + Smax + 'p로 앉혔어요.']); }
  while (Smax > 4 && Smax > Np) Smax /= 2;
  var sizes = [], rem = Np;
  while (rem >= Smax) { sizes.push(Smax); rem -= Smax; }
  [16, 8, 4].forEach(function (s) { if (s < Smax && rem >= s) { sizes.push(s); rem -= s; } });
  if (Np > NI) res.warns.push(['', '내지가 ' + NI + 'p라 4의 배수가 되도록 끝에 빈 면 ' + (Np - NI) + 'p를 넣었어요.']);
  if (O.bind === 'saddle' && cov) res.warns.push(['', '중철은 보통 표지를 내지와 같이 접어요. 표지를 따로 찍을 때만 표지 옵션을 켜 주세요.']);
  var gi = function (n) { return n <= NI ? inner[n - 1] : null; }; // 내지 n번째 (1부터) → 논리 페이지
  var front = 0, backp = Np, base = 0;
  if (cov) {
    var cf = [[{ li: N - 1, lab: '표4' }, { li: 0, lab: '표1' }]], cb = [[{ li: 1, lab: '표2' }, { li: N - 2, lab: '표3' }]];
    var cs = { title: '표지', sub: '표1·표4 / 표2·표3 · 책등 두께는 빼고 보여요', sides: [] };
    if (O.mode === 'wt') cs.sides.push(side('앞뒤 같은 판', '한 장에서 2벌 나와요', plateWT(cf, cb, pw, ph)));
    else { var cp = placeSides(cf, cb, pw, ph); cs.sides.push(side('바깥면', '', cp[0])); cs.sides.push(side('안쪽면', '종이를 좌우로 뒤집어 본 모습', cp[1])); }
    res.sheets.push(cs);
  }
  var sigs = [];
  sizes.forEach(function (S, si) {
    var fd = fold(GRID[S][0], GRID[S][1]), map;
    if (O.bind === 'saddle') { var f0 = front, b0 = backp; map = function (l) { return l <= S / 2 ? f0 + l : b0 - (S - l); }; front += S / 2; backp -= S / 2; }
    else { var b1 = base; map = function (l) { return b1 + l; }; base += S; }
    var conv = function (grid) { return grid.map(function (row) { return row.map(function (c) { var n = map(c.l), li = gi(n); return { li: li, lab: li != null ? pageLabel(li) : '빈 면', rot: c.rot, blank: li == null }; }); }); };
    var ps = []; for (var l = 1; l <= S; l++) ps.push(gi(map(l)));
    sigs.push({ no: si + 1, S: S, out: conv(fd.outer), inn: conv(fd.inner), ps: ps });
  });
  // 앞뒤 다른 판이면 같은 크기 대 2개를 한 판에 같이 앉힌다 (2대 걸이). 옆으로 또는 위아래로.
  var ganged = 0;
  for (var q = 0; q < sigs.length; q++) {
    var A = sigs[q], B = sigs[q + 1], sheet = null;
    if (O.mode === 'sw' && B && B.S === A.S) {
      var pp = placeSides(hcat(A.out, B.out), hcat(B.inn, A.inn), pw, ph);
      if (!pp[0]) pp = placeSides(A.out.concat(B.out), A.inn.concat(B.inn), pw, ph);
      var po = pp[0], pi = pp[1];
      if (po && pi) {
        sheet = { title: (res.sheets.length + 1 - (cov ? 1 : 0)) + '판 · ' + A.no + '–' + B.no + '대', sub: A.S + 'p 2대 · ' + rangeText(A.ps.concat(B.ps)), sides: [side('앞면', A.no + '대·' + B.no + '대 첫 페이지가 있는 면', po), side('뒷면', '종이를 좌우로 뒤집어 본 모습', pi)] };
        q++; ganged++;
      }
    }
    if (!sheet) {
      sheet = { title: (res.sheets.length + 1 - (cov ? 1 : 0)) + '판 · ' + A.no + '대', sub: A.S + 'p · ' + rangeText(A.ps), sides: [] };
      if (O.mode === 'wt') sheet.sides.push(side('앞뒤 같은 판', '한 장에서 같은 대가 2벌 나와요', plateWT(A.out, A.inn, pw, ph)));
      else { var sp = placeSides(A.out, A.inn, pw, ph); sheet.sides.push(side('앞면', A.no + '대 첫 페이지가 있는 면', sp[0])); sheet.sides.push(side('뒷면', '종이를 좌우로 뒤집어 본 모습', sp[1])); }
    }
    res.sheets.push(sheet);
  }
  var cnt = {}; sizes.forEach(function (s) { cnt[s] = (cnt[s] || 0) + 1; });
  res.sum = [[N, 'p'], [res.sheets.length, '판'], [sigs.length, '대'], [Object.keys(cnt).sort(function (a, b) { return b - a; }).map(function (s) { return s + 'p×' + cnt[s]; }).join(' + '), '']];
  return res;
}
// 낱장 격자는 판 방향 그대로 만들고, 돌려 앉힐 땐 칸마다 90° 돌린다
function placeSheetGrid(frame, pw, ph, r90) { return r90 ? place(frame, ph, pw, false) : place(frame, pw, ph, false); }
function side(label, note, placed) { return { label: label, note: note, p: placed }; }
function rangeText(lis) {
  var ns = lis.filter(function (x) { return x != null; }).map(function (x) { return x + 1; }).sort(function (a, b) { return a - b; }), out = [], s = null, p = null;
  ns.forEach(function (n) { if (s == null) { s = p = n; } else if (n === p + 1) p = n; else { out.push(s === p ? s + 'p' : s + '–' + p + 'p'); s = p = n; } });
  if (s != null) out.push(s === p ? s + 'p' : s + '–' + p + 'p');
  return out.join(', ') || '빈 면';
}

// ── 그리기 ──
function paperHTML(sd, big) {
  var p = sd.p; if (!p) return '<div class="warn red">이 면은 판에 들어가지 않아요.</div>';
  var W = p.W, H = p.H, gr = +O.grip || 0, h = '';
  h += '<div class="paper" style="padding-top:' + (H / W * 100).toFixed(3) + '%">';
  h += '<div class="grip" style="height:' + (gr / H * 100).toFixed(3) + '%">물림 쪽 · 종이가 들어가는 방향 ↑</div>';
  // 잉크 키 줄 (세로 칸 경계)
  var xs = {}; p.cells.forEach(function (c) { xs[c.x.toFixed(1)] = c.x; xs[(c.x + c.w).toFixed(1)] = c.x + c.w; });
  Object.keys(xs).forEach(function (k) { h += '<i class="keyline" style="left:' + (xs[k] / W * 100).toFixed(3) + '%"></i>'; });
  p.cells.forEach(function (c) {
    var pg = c.li != null ? PAGES[c.li] : null, raw = pg ? RAW[pg.raw] : null, sw = c.rot % 180 !== 0;
    var iw = sw ? c.h / c.w * 100 : 100, ih = sw ? c.w / c.h * 100 : 100;
    h += '<div class="cell" data-li="' + (c.li != null ? c.li : '') + '" style="left:' + (c.x / W * 100).toFixed(3) + '%;top:' + (c.y / H * 100).toFixed(3) + '%;width:' + (c.w / W * 100).toFixed(3) + '%;height:' + (c.h / H * 100).toFixed(3) + '%">';
    h += '<div class="pg' + (raw ? '' : ' blank') + '" style="width:' + iw.toFixed(3) + '%;height:' + ih.toFixed(3) + '%;transform:translate(-50%,-50%) rotate(' + c.rot + 'deg)">';
    if (raw) h += '<img src="' + raw.url + '" alt=""' + (pg.half >= 0 ? ' style="width:200%;max-width:none;margin-left:' + (pg.half ? '-100%' : '0') + '"' : '') + '>';
    h += '</div>';
    if (c.lab) h += '<span class="no">' + c.lab + (c.rot === 180 ? ' ↓' : c.rot === 90 ? ' →' : c.rot === 270 ? ' ←' : '') + '</span>';
    if (pg) h += '<span class="ink' + (pg.ink >= 280 ? ' hi' : '') + '">' + pg.ink + '%</span>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}
function inkWarn(sd) {
  var p = sd.p; if (!p) return '';
  var cols = [];
  p.cells.forEach(function (c) { if (c.li == null) return; var cx = c.x + c.w / 2, col = cols.filter(function (k) { return Math.abs(k.x - cx) < c.w / 2; })[0]; if (!col) { col = { x: cx, it: [] }; cols.push(col); } col.it.push(c); });
  var msgs = [];
  cols.sort(function (a, b) { return a.x - b.x; }).forEach(function (col) {
    if (col.it.length < 2) return;
    var s = col.it.slice().sort(function (a, b) { return PAGES[b.li].ink - PAGES[a.li].ink; }), hi = s[0], lo = s[s.length - 1], d = PAGES[hi.li].ink - PAGES[lo.li].ink;
    if (d >= 90) msgs.push(hi.lab + '(' + PAGES[hi.li].ink + '%) ↔ ' + lo.lab + '(' + PAGES[lo.li].ink + '%)');
  });
  return msgs.length ? '같은 잉크 줄에서 농도 차이가 커요: ' + msgs.join(' · ') : '';
}
function sideList(sd) { if (!sd.p) return ''; var lis = sd.p.cells.map(function (c) { return c.li; }); return '<div class="plist"><b>이 면 페이지</b> ' + rangeText(lis) + '</div>'; }

var LAST = null;
function layout() {
  syncUI();
  var out = $('#out');
  if (!RAW.length) { out.innerHTML = ''; return; }
  PAGES = buildPages();
  if (!(O.pgW > 0 && O.pgH > 0)) { var cs = commonSize(PAGES); O.pgW = cs[0]; O.pgH = cs[1]; $('#pgW').value = O.pgW; $('#pgH').value = O.pgH; $('#pgFrom').textContent = 'PDF 재단 크기'; }
  var res = compute(); LAST = res;
  var SD = sheetDims(), h = '';
  h += '<div class="card noprint"><div class="sum">';
  res.sum.forEach(function (s) { h += '<span class="pill"><b>' + s[0] + '</b>' + s[1] + '</span>'; });
  h += '<span class="pill">' + SHEET_NAME[O.sheet] + ' ' + SD[0] + '×' + SD[1] + 'mm · ' + (O.mode === 'wt' ? '돌려찍기' : '앞뒤 다른 판') + '</span></div>';
  res.warns.forEach(function (w) { h += '<div class="warn' + (w[0] === 'red' ? ' red' : '') + '">' + w[1] + '</div>'; });
  h += '<div class="tools"><label class="chk" style="margin:0"><input type="checkbox" id="inkT"' + (O.ink ? ' checked' : '') + '> 잉크 양 보기 (대략)</label><span class="sp"></span><button class="pick ghost" id="prt" type="button">판면 인쇄</button></div>';
  h += '<div class="legend">파란 점선은 잉크 줄이에요. 종이가 들어가는 방향(위아래)으로 같은 줄에 선 페이지는 인쇄기 잉크 조절을 같이 써서, 한쪽을 진하게 올리면 같은 줄의 다른 페이지도 같이 진해져요. 숫자는 화면 색을 CMYK로 단순 환산한 평균 잉크 양이라 참고만 해 주세요.</div>';
  h += '</div>';
  res.sheets.forEach(function (sh, si) {
    h += '<div class="card sheetCard"><h3>' + sh.title + ' <small>' + sh.sub + '</small></h3><div class="sides' + (sh.sides.length === 1 ? ' one' : '') + '">';
    sh.sides.forEach(function (sd, k) {
      h += '<div class="side" data-s="' + si + '" data-k="' + k + '"><div class="sh">' + sd.label + (sd.note ? ' <span>' + sd.note + '</span>' : '') + '</div>' + paperHTML(sd) + sideList(sd) + '<div class="inkw">' + inkWarn(sd) + '</div></div>';
    });
    h += '</div></div>';
  });
  out.innerHTML = h;
  out.classList.toggle('showInk', !!O.ink);
  var it = $('#inkT'); if (it) it.onchange = function () { O.ink = it.checked; save(); out.classList.toggle('showInk', O.ink); $('#ov').classList.toggle('showInk', O.ink); };
  var pb = $('#prt'); if (pb) pb.onclick = function () { window.print(); };
  $$('#out .paper').forEach(function (el) {
    el.onclick = function () { var sd = el.closest('.side'), sh = res.sheets[+sd.dataset.s], s = sh.sides[+sd.dataset.k]; openBig(sh.title + ' · ' + s.label, s); };
  });
  bindHover(out);
}
function bindHover(root) {
  root.addEventListener('mouseover', function (e) { var c = e.target.closest && e.target.closest('.cell'); hl(c && c.dataset.li !== '' ? c.dataset.li : null); });
  root.addEventListener('mouseleave', function () { hl(null); });
}
function hl(li) { $$('.cell.hl').forEach(function (c) { c.classList.remove('hl'); }); if (li == null) return; $$('.cell[data-li="' + li + '"]').forEach(function (c) { c.classList.add('hl'); }); }
function openBig(t, sd) {
  $('#ovT').textContent = t; $('#ovB').innerHTML = paperHTML(sd, true) + sideList(sd) + '<div class="inkw">' + inkWarn(sd) + '</div>';
  var ov = $('#ov'); ov.classList.add('on'); ov.classList.toggle('showInk', !!O.ink);
}
$('#ovX').onclick = function () { $('#ov').classList.remove('on'); };
$('#ov').onclick = function (e) { if (e.target.id === 'ov') $('#ov').classList.remove('on'); };
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#ov').classList.remove('on'); });

// ── 옵션 UI ──
function syncUI() {
  [['#sBind', O.bind], ['#sSheet', O.sheet], ['#sMode', O.mode], ['#sSig', String(O.sig)]].forEach(function (a) { $$(a[0] + ' button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === a[1]); }); });
  var book = O.bind === 'perfect' || O.bind === 'saddle';
  $('#coverWrap').classList.toggle('hide', !book);
  $('#sigL').classList.toggle('hide', !book); $('#sSig').classList.toggle('hide', !book);
  $$('#sMode button')[1].disabled = O.bind === 'simplex';
  if (O.bind === 'simplex' && O.mode === 'wt') { O.mode = 'sw'; $$('#sMode button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === 'sw'); }); }
  $('#cover').checked = !!O.cover;
  $('#shW').value = O.shW; $('#shH').value = O.shH;
  $('#shW').readOnly = $('#shH').readOnly = O.sheet !== 'cu';
  if (O.pgW) $('#pgW').value = round1(O.pgW); if (O.pgH) $('#pgH').value = round1(O.pgH);
  $('#gap').value = O.gap; $('#grip').value = O.grip; $('#edge').value = O.edge;
}
function round1(n) { return Math.round(n * 10) / 10; }
function seg(sel, key, after) { $$(sel + ' button').forEach(function (b) { b.onclick = function () { if (b.disabled) return; O[key] = key === 'sig' ? +b.dataset.v : b.dataset.v; if (after) after(b.dataset.v); save(); layout(); }; }); }
seg('#sBind', 'bind', function (v) { if (v === 'saddle') O.cover = false; });
seg('#sSheet', 'sheet', function (v) { if (SHEETS[v]) { O.shW = SHEETS[v][0]; O.shH = SHEETS[v][1]; } });
seg('#sMode', 'mode'); seg('#sSig', 'sig');
$('#cover').onchange = function () { O.cover = this.checked; layout(); };
$('#spread').onchange = function () { O.spread = this.checked; O.pgW = O.pgH = 0; layout(); };
function numIn(id, key, noSave) { $(id).onchange = function () { var v = parseFloat(this.value); if (v > 0 || (v === 0 && /gap|grip|edge/.test(key))) { O[key] = v; if (key === 'pgW' || key === 'pgH') $('#pgFrom').textContent = '직접 입력'; if (!noSave) save(); layout(); } else syncUI(); }; }
numIn('#shW', 'shW'); numIn('#shH', 'shH'); numIn('#pgW', 'pgW', true); numIn('#pgH', 'pgH', true); numIn('#gap', 'gap'); numIn('#grip', 'grip'); numIn('#edge', 'edge');

// ── 파일 ──
var drop = $('#drop'), fi = $('#file');
$('#pick').onclick = function () { fi.click(); };
$('#demo').onclick = demo;
fi.onchange = function () { if (fi.files[0]) readPdf(fi.files[0]); fi.value = ''; };
['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('on'); }); });
['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('on'); }); });
drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) readPdf(f); });
if (SHEETS[O.sheet]) { O.shW = SHEETS[O.sheet][0]; O.shH = SHEETS[O.sheet][1]; }
syncUI();
window.PLYSH_IMPOSE = { fold: fold, demo: demo };
})();
