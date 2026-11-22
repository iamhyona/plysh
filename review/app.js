/* PLYSH 검수 화면 (2026-11-18) — engine.js 결과 + 화면 렌더링(pdf.js)으로 페이지별 보고서를 만든다 */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var MM = 72 / 25.4; function mm(pt) { return pt / MM; } function f1(x) { return (Math.round(x * 10) / 10).toString(); }
var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

// ── 검수 기준 ──
var DEF = { ppi: 250, bleed: 3, safe: 3, minText: 4, smallText: 12, small4c: 7, tacWarn: 300, tacErr: 320, hair: 0.15, thin4c: 0.3, blackArea: 900, whiteText: 10, glue: 3, gutterSaddle: 5 };
var SET_LABEL = { ppi: '이미지 최소 해상도', bleed: '도련', safe: '재단선 안쪽 안전 여백', minText: '이 크기 이하 글자는 조언', smallText: 'K100 텍스트(오버프린트확인)', small4c: '4도 혼합 금지 글자', tacWarn: '잉크 총량 확인', tacErr: '잉크 총량 오류', hair: '너무 얇은 선', thin4c: '4도 혼합 얇은 선', blackArea: '리치블랙 권장 면적', whiteText: '흰 글자 주의 크기', glue: '포토북 풀칠 영역', gutterSaddle: '중철 접지 안쪽 여백' };
// 단위는 입력칸 안 오른쪽에 (2026-11-20 실장님: 라벨에 단위 넣지 않기)
var SET_UNIT = { ppi: 'ppi', bleed: 'mm', safe: 'mm', minText: 'pt', smallText: 'pt 미만', small4c: 'pt 미만', tacWarn: '%', tacErr: '%', hair: 'pt 이하', thin4c: 'pt 미만', blackArea: 'mm²', whiteText: 'pt 미만', glue: 'mm', gutterSaddle: 'mm' };
var SET = {}; (function () { var s = {}; try { s = JSON.parse(ls.get('rv:set') || '{}'); } catch (e) {} if (s.minText == 6) delete s.minText; for (var k in DEF) SET[k] = s[k] != null ? +s[k] : DEF[k]; })();
var PAPERS = [['', '종이 (두께)'], ['0.10', '모조 80g · 0.10mm'], ['0.12', '모조 100g · 0.12mm'], ['0.15', '모조 120g · 0.15mm'], ['0.10', '아트 120g · 0.10mm'], ['0.13', '아트 150g · 0.13mm'], ['0.12', '스노우 120g · 0.12mm'], ['0.15', '스노우 150g · 0.15mm'], ['0.20', '스노우 200g · 0.20mm'], ['0.17', '랑데뷰 130g · 0.17mm'], ['0.21', '랑데뷰 160g · 0.21mm'], ['0.17', '몽블랑 130g · 0.17mm'], ['0.21', '몽블랑 160g · 0.21mm'], ['0.25', '포토 용지 250g · 0.25mm'], ['x', '직접 입력']];
var OPT = { kind: ls.get('rv:kind') || 'id', prod: ls.get('rv:prod') || 'print' };

function setupUI() {
  $('#setG').innerHTML = Object.keys(DEF).map(function (k) { return '<label>' + SET_LABEL[k] + '<span class="ifx"><input class="inp" type="number" step="any" data-k="' + k + '" value="' + SET[k] + '"><em>' + (SET_UNIT[k] || '') + '</em></span></label>'; }).join('');
  $$('#setG input').forEach(function (i) { i.onchange = function () { SET[i.dataset.k] = +i.value; ls.set('rv:set', JSON.stringify(SET)); }; });
  $('#setReset').onclick = function () { for (var k in DEF) SET[k] = DEF[k]; ls.set('rv:set', '{}'); $$('#setG input').forEach(function (i) { i.value = SET[i.dataset.k]; }); };
  document.addEventListener('dragover', function (e) { e.preventDefault(); }); document.addEventListener('drop', function (e) { e.preventDefault(); });
}
var KIND_LABEL = { id: 'PDF (인디자인 작업)', aiF: 'PDF (일러스트 outline)', ai: 'AI (일러스트 원본)', img: 'JPG·PNG (이미지)' };
function pl(i) { var P = R && R.pages[i]; return R && R.isImg && P ? P.name : (i + 1) + 'p'; }

// ── 라이브러리 ──
function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error(src + ' 불러오기 실패')); }; document.head.appendChild(s); }); }
var libsP = null;
function libs() {
  if (!libsP) libsP = Promise.all([window.pdfjsLib ? 0 : loadScript(LIBS.pdfjs), window.PDFLib ? 0 : loadScript(LIBS.pdflib)]).then(function () { return window.PRV ? 0 : loadScript('engine.js?v=20261122b1'); }).then(function () { pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.worker; });
  return libsP;
}
var faceP = null;
function faceLib() {
  if (!faceP) faceP = (window.faceapi ? Promise.resolve() : loadScript(LIBS.face)).then(function () {
    return Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri(LIBS.model), faceapi.nets.faceLandmark68Net.loadFromUri(LIBS.model), faceapi.nets.faceRecognitionNet.loadFromUri(LIBS.model)]);
  }).then(function () { return true; }, function (e) { console.warn(e); return false; });
  return faceP;
}

// ── 진행 표시 ──
var ABORT = false;
function prog(t, p, s) { if (ABORT) { var e = new Error('중지했어요'); e.abort = true; throw e; } if (window.RVB_prog) return RVB_prog(t, p, s); $('#prog').hidden = false; $('#progT').textContent = t; $('#progB').style.width = Math.round((p || 0) * 100) + '%'; $('#progS').textContent = s || ''; }

// ── 상태 ──
var R = null; // 보고서
function issue(o) { o.id = R.issues.length + 1; R.issues.push(o); return o; }

function newR(name, size, meta) { return { file: name, size: size, WO: meta.WO, cover: !!meta.cover, kind: meta.kind, prod: meta.prod, prodName: meta.prodName || '', artist: meta.artist || '', spec: meta.spec || '', rulesText: meta.rulesText, issues: [], pages: [], imgs: [], faces: [], notes: [], fonts: [], dups: [], repeats: [], rules: [], people: [] }; }
function fatal(name, msg, sub) { return { file: name, fatal: msg, fatalSub: sub || '', issues: [], pages: [] }; }
async function analyzePdf(file, meta) {
  var WO = meta.WO, lab = meta.label || file.name;
  prog('파일 읽는 중…', 0.01, lab);
  try { await libs(); } catch (e) { prog('검수 도구를 불러오지 못했어요', 0, '인터넷 연결을 확인하고 다시 시도해 주세요. ' + e.message); return fatal(file.name, '검수 도구를 불러오지 못했어요', e.message); }
  var buf = new Uint8Array(await file.arrayBuffer());
  var head = String.fromCharCode.apply(null, buf.subarray(0, Math.min(1024, buf.length)));
  if (head.indexOf('%PDF') < 0) return fatal(file.name, '이 파일은 읽을 수 없어요', /\.ai$/i.test(file.name) ? '일러스트에서 저장할 때 “PDF 호환 파일 만들기”를 켜고 다시 저장해 주세요.' : 'PDF 또는 PDF 호환 AI 파일만 검수할 수 있어요.');
  R = newR(file.name, file.size, meta);
  var pdfjs, plib;
  try {
    pdfjs = await pdfjsLib.getDocument({ data: buf.slice(), isEvalSupported: false, disableFontFace: false }).promise;
    plib = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
    buf = null;
  } catch (e) { return fatal(file.name, '파일을 여는 중 문제가 생겼어요', String(e && e.message || e)); }
  var doc = PRV.open(plib), n = pdfjs.numPages;
  R.offLayers = []; try { var NM = PDFLib.PDFName, ocp = plib.catalog.lookup(NM.of('OCProperties')), dd = ocp && ocp.lookup(NM.of('D')), off = dd && dd.lookup(NM.of('OFF')); if (off && off.size) for (var oi = 0; oi < off.size(); oi++) { var og = off.lookup(oi), on = og && og.lookup && og.lookup(NM.of('Name')); R.offLayers.push(on && on.decodeText ? on.decodeText() : '이름 없음'); } } catch (e) {}
  R.n = n;
  var wantFaces = WO.bind !== 'none' || /photobook|photocard|book|calendar/.test(meta.prod);
  var faceOK = false;
  if (wantFaces) { prog('얼굴 인식 준비 중…', 0.02); faceOK = await faceLib(); if (!faceOK) R.notes.push('얼굴 인식을 불러오지 못해 제본 안쪽 검사는 글자만 했어요.'); }
  R.faceOK = faceOK;
  for (var i = 0; i < n; i++) {
    if (i % 4 === 0) { prog('파일 구조 읽는 중 ' + (i + 1) + ' / ' + n, 0.03 + 0.12 * i / n, lab); await tick(); }
    var P = PRV.page(doc, i, {}); P.no = i + 1; R.pages.push(P);
  }
  layoutPages();
  var PXB = 0, PX_CAP = 480e6, pxDrop = 0; // 남겨 두는 픽셀 합계 한도 (약 480MB)
  for (var j = 0; j < n; j++) {
    prog('페이지 ' + (j + 1) + ' / ' + n + ' 검사 중' + (faceOK ? ' (얼굴 인식 포함)' : ''), 0.15 + 0.8 * j / n, lab);
    await tick();
    var PJ = R.pages[j];
    try { await renderPage(pdfjs, PJ, faceOK); }
    catch (e) { if (e && e.abort) throw e; PJ.renderErr = String(e && e.message || e); PJ.px = null; }
    if (PJ.px) { try { pageChecks(PJ); } catch (e) { console.warn('pageChecks', e); } PJ._pc = 1; }
    else { PJ.cw = PJ.cw || 1; PJ.ch = PJ.ch || 1; try { pageChecks(PJ); } catch (e) { console.warn('pageChecks', e); } PJ._pc = 1; }
    if (PJ.px) { PXB += PJ.px.data.length; if (PXB > PX_CAP) { PJ.px = null; pxDrop++; } }
  }
  if (pxDrop) R.notes.push('페이지가 많아 반복 칸 디자인 비교는 앞쪽 ' + (n - pxDrop) + 'p까지만 했어요. 나머지 검사는 모든 페이지에 했어요.');
  prog('페이지 사이 비교 중 (중복 사진, 디자인 규칙)…', 0.96);
  await tick();
  R.fonts = PRV.fonts(doc);
  R.pages.forEach(function (P) { if (!P._pc) pageChecks(P); });
  docChecks();
  dupPhotos();
  designRules();
  faceAdvice();
  if (window.RV2) { try { await RV2.run(R, pdfjs, function (t) { prog(t, 0.97, lab); }); } catch (e) { if (e && e.abort) throw e; console.warn('phase2', e); issue({ page: null, sev: 'info', cat: 'text', code: 'p2err', title: '2단계 검사 중 일부가 실패했어요', detail: String(e && e.message || e), fix: '', boxes: [] }); } }
  R.pages.forEach(function (P) { P.px = null; }); // 메모리 정리 (여러 파일 검사)
  try { pdfjs.destroy(); } catch (e) {}
  return R;
}

// ── 페이지 렌더 + 픽셀 검사 재료 ──
async function renderPage(pdfjs, P, faceOK) {
  var pg = await pdfjs.getPage(P.i + 1);
  var v1 = pg.getViewport({ scale: 1 }), maxSide = Math.max(v1.width, v1.height);
  var scale = Math.min(130 / 72, 2600 / maxSide);
  var vp = pg.getViewport({ scale: scale });
  var cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
  var cx = cv.getContext('2d', { willReadFrequently: true });
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
  try { await pg.render({ canvasContext: cx, viewport: vp, intent: 'print' }).promise; } catch (e) { P.renderErr = String(e.message || e); }
  P.vt = vp.transform.slice(); P.cw = cv.width; P.ch = cv.height; P.scale = scale;
  P.px = cx.getImageData(0, 0, cv.width, cv.height);
  // 글자 내용 (스니펫용)
  try { var tc = await pg.getTextContent(); P.tc = tc.items.filter(function (t) { return t.str; }).map(function (t) { var m = t.transform, z = Math.hypot(m[2], m[3]) || Math.abs(t.height) || 1; return { s: t.str, b: [m[4], m[5] - z * 0.2, m[4] + t.width, m[5] + z * 0.85], x: m[4], y: m[5], w: t.width, z: z, f: t.fontName, rot: Math.abs(m[1]) > 0.01 || m[0] < 0 }; }); } catch (e) { P.tc = []; }
  // 썸네일
  var tw = Math.min(1100, cv.width), th = Math.round(cv.height * tw / cv.width), tcv = document.createElement('canvas'); tcv.width = tw; tcv.height = th;
  tcv.getContext('2d').drawImage(cv, 0, 0, tw, th);
  P.thumb = await new Promise(function (ok) { tcv.toBlob(function (b) { ok(URL.createObjectURL(b)); }, 'image/jpeg', 0.82); });
  P.tw = tw; P.th = th;
  // 사진 조각 (중복 비교용 해시 + 작은 미리보기)
  P.images.forEach(function (im, k) {
    im.page = P.i; im.k = k;
    if (im.mask || !im.vis) return;
    var v = PRV.isect(im.vis, P.crop); if (PRV.empty(v)) return;
    if (mm(v[2] - v[0]) < 12 || mm(v[3] - v[1]) < 12) return;
    var r = toPx(P, v); if (r[2] - r[0] < 16 || r[3] - r[1] < 16) return;
    im.px = r; im.hashV = dhash(cv, r); im.thumb = cropURL(cv, r, 160); im.stats = regionStats(P, r);
    R.imgs.push(im);
  });
  // 얼굴
  P.faces = [];
  if (faceOK) await detectFaces(P, cv);
  cv.width = cv.height = 0; tcv.width = tcv.height = 0;
  pg.cleanup();
}
async function detectFaces(P, cv) {
  try {
    var big = Math.max(cv.width, cv.height), fcv = cv;
    if (big > 1700) { var s2 = 1700 / big; fcv = document.createElement('canvas'); fcv.width = Math.round(cv.width * s2); fcv.height = Math.round(cv.height * s2); fcv.getContext('2d').drawImage(cv, 0, 0, fcv.width, fcv.height); }
    var k2 = cv.width / fcv.width;
    var det = await faceapi.detectAllFaces(fcv, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45, maxResults: 60 })).withFaceLandmarks().withFaceDescriptors();
    var all = det.map(function (d) { var b = d.detection.box; return { d: d, r: [b.x * k2, b.y * k2, (b.x + b.width) * k2, (b.y + b.height) * k2] }; });
    // 제본·접지 쪽은 잘라서 한 번 더 (작게 나온 얼굴, 숙인 얼굴까지)
    var GC = gutterCrops(P);
    for (var gi = 0; gi < GC.length; gi++) {
      var gr = GC[gi], gw = gr[2] - gr[0], gh = gr[3] - gr[1], gs = Math.min(1, 1400 / Math.max(gw, gh)), gc = document.createElement('canvas');
      gc.width = Math.round(gw * gs); gc.height = Math.round(gh * gs); gc.getContext('2d').drawImage(cv, gr[0], gr[1], gw, gh, 0, 0, gc.width, gc.height);
      var d2 = await faceapi.detectAllFaces(gc, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3, maxResults: 40 })).withFaceLandmarks().withFaceDescriptors();
      d2.forEach(function (d) { var b = d.detection.box, r = [gr[0] + b.x / gs, gr[1] + b.y / gs, gr[0] + (b.x + b.width) / gs, gr[1] + (b.y + b.height) / gs]; if (!all.some(function (a) { return iou(a.r, r) > 0.3; })) all.push({ d: d, r: r, low: d.detection.score < 0.5 }); });
    }
    all.forEach(function (a) {
      var d = a.d, r = a.r;
      var F = { page: P.i, px: r, box: toPt(P, r), score: d.detection.score, desc: Array.from(d.descriptor), low: !!a.low };
      F.thumb = cropURL(cv, padR(r, 0.25, cv), 110);
      F.skin = skinStats(P, r);
      F.outfit = outfitColor(P, r);
      P.faces.push(F); R.faces.push(F);
    });
  } catch (e) { console.warn('face', e); }
}

// ── JPG·PNG 이미지 (같은 품목끼리 한 묶음으로 검사) ──
function u8str(u, a, n) { var s = ''; for (var i = a; i < Math.min(u.length, a + n); i++) s += String.fromCharCode(u[i]); return s; }
function imgHeader(u) { // 크기, 색 모드, 투명, dpi, 색 프로파일
  var o = { fmt: '', w: 0, h: 0, comps: 3, alpha: false, dpi: 0, icc: '' };
  if (u[0] === 0xFF && u[1] === 0xD8) {
    o.fmt = 'JPG'; var i = 2;
    while (i + 4 < u.length) {
      if (u[i] !== 0xFF) { i++; continue; }
      var m = u[i + 1], len = (u[i + 2] << 8) | u[i + 3];
      if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { o.h = (u[i + 5] << 8) | u[i + 6]; o.w = (u[i + 7] << 8) | u[i + 8]; o.comps = u[i + 9]; break; }
      if (m === 0xE0 && u8str(u, i + 4, 4) === 'JFIF') { var unit = u[i + 11], xd = (u[i + 12] << 8) | u[i + 13]; if (unit === 1) o.dpi = xd; else if (unit === 2) o.dpi = Math.round(xd * 2.54); }
      if (m === 0xE2 && u8str(u, i + 4, 11) === 'ICC_PROFILE') { var t = u8str(u, i + 18, Math.min(len, 4000)); var mm2 = t.match(/(sRGB[^\x00]{0,30}|Adobe RGB[^\x00]{0,20}|Display P3|ProPhoto[^\x00]{0,10}|Japan Color[^\x00]{0,20}|Coated FOGRA[^\x00]{0,10}|U\.?S\.? Web[^\x00]{0,20}|Generic[^\x00]{0,20})/); if (mm2) o.icc = mm2[1].replace(/[^\x20-\x7e]/g, '').trim(); else o.icc = o.icc || '포함'; }
      if (m === 0xE1 && u8str(u, i + 4, 4) === 'Exif' && !o.dpi) { var ex = u8str(u, i + 10, Math.min(len, 600)); }
      if (m === 0xDA) break;
      i += 2 + len;
    }
  } else if (u[0] === 0x89 && u[1] === 0x50) {
    o.fmt = 'PNG'; o.w = (u[16] << 24 | u[17] << 16 | u[18] << 8 | u[19]) >>> 0; o.h = (u[20] << 24 | u[21] << 16 | u[22] << 8 | u[23]) >>> 0;
    var ct = u[25]; o.alphaType = ct === 4 || ct === 6; o.comps = ct === 0 || ct === 4 ? 1 : 3;
    var p = 8; while (p + 8 < u.length && p < 2e6) { var L = (u[p] << 24 | u[p + 1] << 16 | u[p + 2] << 8 | u[p + 3]) >>> 0, ty = u8str(u, p + 4, 4);
      if (ty === 'pHYs' && u[p + 16] === 1) o.dpi = Math.round(((u[p + 8] << 24 | u[p + 9] << 16 | u[p + 10] << 8 | u[p + 11]) >>> 0) * 0.0254);
      if (ty === 'iCCP') o.icc = u8str(u, p + 8, 40).split('\x00')[0]; if (ty === 'sRGB') o.icc = 'sRGB'; if (ty === 'tRNS') o.alphaType = true;
      if (ty === 'IDAT' || ty === 'IEND') break; p += 12 + L; }
  }
  return o;
}
async function analyzeImages(files, meta) {
  var lab = meta.label || files[0].name;
  prog('이미지 읽는 중…', 0.01, lab);
  try { await libs(); } catch (e) { return fatal(files[0].name, '검수 도구를 불러오지 못했어요', e.message); }
  R = newR(files.length > 1 ? files.length + '개 이미지 · ' + (meta.prodName || '이미지') : files[0].name, files.reduce(function (a, f) { return a + f.size; }, 0), meta);
  R.isImg = true; R.kind = 'img'; R.n = files.length; R.bookPages = files.length; R.files = files.map(function (f) { return f.name; });
  var web = meta.prod === 'web', faceOK = false;
  prog('얼굴 인식 준비 중…', 0.03, lab); faceOK = await faceLib(); R.faceOK = faceOK;
  var WO = meta.WO || {}, bl = SET.bleed;
  for (var i = 0; i < files.length; i++) {
    var f = files[i]; prog('이미지 ' + (i + 1) + ' / ' + files.length + ' 검사 중', 0.05 + 0.85 * i / files.length, f.name); await tick();
    var buf = new Uint8Array(await f.arrayBuffer()), hd = imgHeader(buf), bmp = null;
    try { bmp = await createImageBitmap(new Blob([buf])); } catch (e) { issue({ page: null, sev: 'err', cat: 'print', code: 'imgread', title: '이미지를 열지 못했어요: ' + f.name, detail: String(e && e.message || e), fix: '', boxes: [] }); continue; }
    var W = bmp.width, H = bmp.height, sc = Math.min(1, 2400 / Math.max(W, H)), cv = document.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
    var cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height);
    // 투명 여부 (PNG)
    var alpha = false; if (hd.alphaType) { var tc0 = document.createElement('canvas'); tc0.width = Math.min(400, W); tc0.height = Math.round(H * tc0.width / W) || 1; var tx = tc0.getContext('2d', { willReadFrequently: true }); tx.drawImage(bmp, 0, 0, tc0.width, tc0.height); var dd = tx.getImageData(0, 0, tc0.width, tc0.height).data; for (var q = 3; q < dd.length; q += 16) if (dd[q] < 250) { alpha = true; break; } }
    bmp.close && bmp.close();
    // 실제 크기: 사양서 크기(도련 포함/미포함 중 비율이 맞는 쪽) → 없으면 파일 dpi → 없으면 300dpi 가정
    var ar = W / H, fitB = null, mmW, mmH, hasBleed = false, sizeSrc = '';
    if (!web && WO.w && WO.h) {
      var cands = [[WO.w, WO.h, false], [WO.h, WO.w, false], [WO.w + 2 * bl, WO.h + 2 * bl, true], [WO.h + 2 * bl, WO.w + 2 * bl, true]];
      cands.forEach(function (c) { var e = Math.abs(c[0] / c[1] - ar) / ar; if (!fitB || e < fitB.e) fitB = { e: e, w: c[0], h: c[1], b: c[2] }; });
      mmW = fitB.w; mmH = fitB.h; hasBleed = fitB.b; sizeSrc = 'spec';
    } else { var dpi = hd.dpi > 30 ? hd.dpi : (web ? 72 : 300); mmW = W / dpi * 25.4; mmH = H / dpi * 25.4; sizeSrc = hd.dpi > 30 ? 'dpi' : 'guess'; }
    var Wpt = mmW * MM, Hpt = mmH * MM, s = cv.width / Wpt;
    var P = { i: i, no: i + 1, name: f.name.replace(/\.(jpe?g|png)$/i, ''), file: f.name, media: [0, 0, Wpt, Hpt], crop: [0, 0, Wpt, Hpt], fills: [], strokes: [], texts: [], images: [], annots: [], spots: {}, tc: [], spread: false, lp: [i + 1], faces: [], img: { fmt: hd.fmt || (f.type || '').replace('image/', '').toUpperCase(), w: W, h: H, comps: hd.comps, alpha: alpha, dpi: hd.dpi, icc: hd.icc, bytes: f.size, mmW: mmW, mmH: mmH, sizeSrc: sizeSrc, fit: fitB } };
    var b0 = hasBleed ? bl * MM : 0; P.trim = [b0, b0, Wpt - b0, Hpt - b0]; P.bleed = hasBleed ? [0, 0, Wpt, Hpt] : null;
    P.vt = [s, 0, 0, -s, 0, cv.height]; P.cw = cv.width; P.ch = cv.height; P.scale = s;
    P.px = cx.getImageData(0, 0, cv.width, cv.height);
    var tw = Math.min(1100, cv.width), th = Math.round(cv.height * tw / cv.width), tcv = document.createElement('canvas'); tcv.width = tw; tcv.height = th; tcv.getContext('2d').drawImage(cv, 0, 0, tw, th);
    P.thumb = await new Promise(function (ok) { tcv.toBlob(function (b) { ok(URL.createObjectURL(b)); }, 'image/jpeg', 0.82); }); P.tw = tw; P.th = th;
    var im = { page: i, k: 0, vis: P.crop.slice(), box: P.crop.slice(), hash: PRV.hashBytes ? PRV.hashBytes(buf) : null, px: [0, 0, cv.width, cv.height] };
    im.hashV = dhash(cv, im.px); im.thumb = cropURL(cv, im.px, 160); im.stats = regionStats(P, im.px); P.images.push(im); R.imgs.push(im);
    R.pages.push(P);
    if (faceOK) await detectFaces(P, cv);
  }
  R.n = R.pages.length; R.bookPages = R.n; R.gz = 0; R.gNote = '';
  prog('이미지 사이 비교 중…', 0.93, lab); await tick();
  R.pages.forEach(function (P) { imageChecks(P, web); });
  imageSetChecks(web);
  dupPhotos();
  faceAdvice();
  R.pages.forEach(function (P) { P.px = null; });
  return R;
}
function kb(n) { return n > 1048576 ? f1(n / 1048576) + 'MB' : Math.round(n / 1024) + 'KB'; }
function imageChecks(P, web) {
  var I = P.img, WO = R.WO || {}, pg = P.i;
  function add(sev, cat, code, title, detail, fix, boxes, ex) { var o = { page: pg, sev: sev, cat: cat, code: code, title: title, detail: detail || '', fix: fix || '', boxes: boxes || [] }; if (ex) for (var k in ex) o[k] = ex[k]; return issue(o); }
  var whole = [P.crop.slice()];
  if (web) {
    if (I.comps === 4) add('err', 'img', 'imgcmyk', '웹용 이미지가 CMYK예요', I.fmt + ' · CMYK', '화면에서 색이 크게 달라 보여요. sRGB로 바꿔 저장해 주세요.');
    else if (I.icc && !/sRGB/i.test(I.icc) && I.icc !== '포함') add('warn', 'img', 'imgprofile', '색 프로파일이 sRGB가 아니에요: ' + I.icc, '웹·SNS에서는 sRGB가 아니면 색이 바래거나 달라 보일 수 있어요.', '내보낼 때 sRGB로 변환해 주세요.');
    if (I.bytes > 5 * 1048576) add('warn', 'img', 'imgweight', '파일이 커요 (' + kb(I.bytes) + ')', I.w + '×' + I.h + 'px', '업로드 제한이 있는 곳이면 품질 80~90%로 다시 저장해 보세요.');
    if (I.alpha && I.fmt === 'PNG') add('info', 'img', 'imgalpha', '투명한 부분이 있는 PNG예요', '배경이 투명하게 나와요.', '의도한 게 아니면 배경을 채워 주세요.');
    return;
  }
  // 인쇄용
  if (I.comps === 3) add('warn', 'img', 'imgrgb', 'RGB 이미지예요', I.fmt + (I.icc ? ' · ' + I.icc : ''), '인쇄소에서 CMYK로 바뀌면서 색이 달라질 수 있어요. 인쇄용이면 CMYK로 변환해 색을 확인해 주세요.', [], { sus: false });
  if (I.alpha) add('warn', 'img', 'imgalpha', '투명한 부분이 있어요', 'PNG 투명 영역은 인쇄할 때 흰색으로 나와요.', '배경을 채운 파일로 넣어 주세요.');
  var ppiX = I.w / (I.mmW / 25.4), ppiY = I.h / (I.mmH / 25.4), ppi = Math.min(ppiX, ppiY);
  if (I.sizeSrc === 'spec') {
    if (I.fit && I.fit.e > 0.02) add('warn', 'img', 'imgratio', '이미지 비율이 사양서 크기와 달라요', '이미지 ' + I.w + '×' + I.h + 'px (비율 ' + f1(I.w / I.h) + ') · 사양 ' + WO.w + '×' + WO.h + 'mm' + ' (도련 포함 ' + (WO.w + 2 * SET.bleed) + '×' + (WO.h + 2 * SET.bleed) + 'mm)', '잘리거나 늘어날 수 있어요. 사양서 비율에 맞춰 다시 내보내 주세요.');
    else if (I.fit && !I.fit.b) add('warn', 'print', 'bleedbox', '도련(' + SET.bleed + 'mm)이 없는 크기예요', '이미지 비율이 재단 크기 ' + WO.w + '×' + WO.h + 'mm와 같아요.', '사방 ' + SET.bleed + 'mm씩 도련을 넣어 ' + (WO.w + 2 * SET.bleed) + '×' + (WO.h + 2 * SET.bleed) + 'mm로 만들어 주세요.', [], { sus: true });
    if (ppi < SET.ppi) add('err', 'print', 'lowppi', '해상도가 낮은 이미지', '사양 크기로 인쇄하면 약 ' + Math.round(ppi) + 'ppi (기준 ' + SET.ppi + 'ppi) · ' + I.w + '×' + I.h + 'px', '최소 ' + Math.ceil(I.mmW / 25.4 * SET.ppi) + '×' + Math.ceil(I.mmH / 25.4 * SET.ppi) + 'px 이상 원본으로 바꿔 주세요.', whole);
  } else {
    add('info', 'img', 'imgsizeinfo', '인쇄 크기를 몰라 해상도는 추정이에요', I.w + '×' + I.h + 'px · ' + (I.sizeSrc === 'dpi' ? '파일 해상도 ' + I.dpi + 'dpi 기준 ' : '300dpi로 가정하면 ') + f1(I.mmW) + '×' + f1(I.mmH) + 'mm', '사양서에 크기를 넣으면 정확히 봐요.');
    if (I.sizeSrc === 'dpi' && I.dpi < SET.ppi) add('warn', 'print', 'lowppi', '파일 해상도가 낮게 저장됐어요 (' + I.dpi + 'dpi)', '이 크기(' + f1(I.mmW) + '×' + f1(I.mmH) + 'mm)로 인쇄하면 기준 ' + SET.ppi + 'ppi보다 낮아요.', '실제 인쇄 크기를 사양서에 넣어 다시 확인해 주세요.', whole, { sus: true });
  }
  // 재단선 가까이 얼굴
  var T = P.trim, sf = SET.safe * MM;
  P.faces.forEach(function (F) { var b = F.box; if (b[0] < T[0] + sf || b[1] < T[1] + sf || b[2] > T[2] - sf || b[3] > T[3] - sf) add('warn', 'print', 'safeface', '재단선 가까이에 얼굴이 있어요', '재단선 안쪽 ' + SET.safe + 'mm 안에 얼굴이 걸려요' + (P.bleed ? '' : ' (도련 없는 크기 기준)') + '.', '재단이 밀리면 잘릴 수 있어요. 얼굴을 안쪽으로 옮겨 주세요.', [b], { sus: true }); });
}
function imageSetChecks(web) {
  if (R.pages.length < 2) return;
  var sz = {}; R.pages.forEach(function (P) { var k = P.img.w + '×' + P.img.h; (sz[k] = sz[k] || []).push(P); });
  var keys = Object.keys(sz).sort(function (a, b) { return sz[b].length - sz[a].length; });
  if (keys.length > 1 && sz[keys[0]].length >= 2) {
    var major = keys[0];
    keys.slice(1).forEach(function (k) { sz[k].forEach(function (P) { issue({ page: P.i, sev: 'warn', cat: 'rule', code: 'imgsize', title: '다른 이미지와 크기가 달라요', detail: P.name + ' ' + k + 'px · 대부분은 ' + major + 'px (' + sz[major].length + '개)', fix: '같은 세트면 크기를 맞춰 주세요.', boxes: [] }); }); });
  }
  var md = {}; R.pages.forEach(function (P) { var k = P.img.comps === 4 ? 'CMYK' : P.img.comps === 1 ? '흑백' : 'RGB'; (md[k] = md[k] || []).push(P); });
  if (Object.keys(md).length > 1) issue({ page: null, sev: 'warn', cat: 'img', code: 'imgmix', title: '색 모드가 섞여 있어요', detail: Object.keys(md).map(function (k) { return k + ' ' + md[k].length + '개'; }).join(' · '), fix: '같은 세트는 같은 색 모드로 맞춰 주세요.', boxes: [] });
}

function iou(a, b) { var i = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); return i / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i); }
function gutterCrops(P) { // 얼굴 재검사할 픽셀 영역: 펼침면 가운데 또는 낱장 제본 쪽 (±70mm)
  if (R.WO.bind === 'none' && !P.spread) return [];
  var T = P.trim, w = 70 * MM, b;
  if (P.spread) { var cx = (T[0] + T[2]) / 2; b = [cx - w, T[1], cx + w, T[3]]; }
  else { var odd = P.lp[0] % 2 === 1; b = odd ? [T[0], T[1], T[0] + w, T[3]] : [T[2] - w, T[1], T[2], T[3]]; }
  var r = toPx(P, b); return [[Math.max(0, r[0]), Math.max(0, r[1]), Math.min(P.cw, r[2]), Math.min(P.ch, r[3])]];
}
function padR(r, k, cv) { var w = r[2] - r[0], h = r[3] - r[1]; return [Math.max(0, r[0] - w * k), Math.max(0, r[1] - h * k), Math.min(cv.width, r[2] + w * k), Math.min(cv.height, r[3] + h * k)]; }
function toPx(P, b) { // pt 상자 → 화면 픽셀 [x0,y0,x1,y1]
  var t = P.vt, a = [t[0] * b[0] + t[2] * b[1] + t[4], t[1] * b[0] + t[3] * b[1] + t[5]], c = [t[0] * b[2] + t[2] * b[3] + t[4], t[1] * b[2] + t[3] * b[3] + t[5]];
  var d = [t[0] * b[0] + t[2] * b[3] + t[4], t[1] * b[0] + t[3] * b[3] + t[5]], e = [t[0] * b[2] + t[2] * b[1] + t[4], t[1] * b[2] + t[3] * b[1] + t[5]];
  return [Math.min(a[0], c[0], d[0], e[0]), Math.min(a[1], c[1], d[1], e[1]), Math.max(a[0], c[0], d[0], e[0]), Math.max(a[1], c[1], d[1], e[1])];
}
function toPt(P, r) { // 픽셀 → pt
  var t = P.vt, det = t[0] * t[3] - t[1] * t[2];
  function inv(x, y) { x -= t[4]; y -= t[5]; return [(t[3] * x - t[2] * y) / det, (-t[1] * x + t[0] * y) / det]; }
  var a = inv(r[0], r[1]), b = inv(r[2], r[3]);
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}
function pix(P, x, y) { if (!P.px) return [255, 255, 255]; x = Math.max(0, Math.min(P.cw - 1, Math.round(x))); y = Math.max(0, Math.min(P.ch - 1, Math.round(y))); var i = (y * P.cw + x) * 4, d = P.px.data; return [d[i], d[i + 1], d[i + 2]]; }
function avgPix(P, x, y, r) { var s = [0, 0, 0], n = 0; for (var dx = -r; dx <= r; dx++) for (var dy = -r; dy <= r; dy++) { var p = pix(P, x + dx, y + dy); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++; } return [s[0] / n, s[1] / n, s[2] / n]; }
function isW(c) { return c[0] > 244 && c[1] > 244 && c[2] > 244; }
function lum(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function ptPx(P, x, y) { var t = P.vt; return [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]]; }
function cropURL(cv, r, size) {
  var w = r[2] - r[0], h = r[3] - r[1], k = size / Math.max(w, h), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  c.getContext('2d').drawImage(cv, r[0], r[1], w, h, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.8);
}
function dhash(cv, r) {
  var c = document.createElement('canvas'); c.width = 9; c.height = 8; var x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(cv, r[0], r[1], r[2] - r[0], r[3] - r[1], 0, 0, 9, 8);
  var d = x.getImageData(0, 0, 9, 8).data, bits = [], g = [], sum = 0, sq = 0;
  for (var i = 0; i < 72; i++) { var v = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11; g.push(v); sum += v; sq += v * v; }
  for (var y = 0; y < 8; y++) for (var xx = 0; xx < 8; xx++) bits.push(g[y * 9 + xx] > g[y * 9 + xx + 1] ? 1 : 0);
  var mean = sum / 72; return { bits: bits, sd: Math.sqrt(Math.max(0, sq / 72 - mean * mean)), mean: mean, col: [d[0], d[1], d[2]] };
}
function ham(a, b) { var n = 0; for (var i = 0; i < 64; i++) if (a[i] !== b[i]) n++; return n; }
// 사진/얼굴 영역 색 통계 (Lab)
function rgb2lab(c) {
  var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92; g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92; b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, Y = r * 0.2126 + g * 0.7152 + b * 0.0722, Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  function f(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; }
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function regionStats(P, r) {
  var n = 0, L = 0, dark = 0, C = 0, step = Math.max(1, Math.floor(Math.sqrt((r[2] - r[0]) * (r[3] - r[1]) / 2500)));
  for (var y = r[1]; y < r[3]; y += step) for (var x = r[0]; x < r[2]; x += step) { var lab = rgb2lab(pix(P, x, y)); L += lab[0]; C += Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]); if (lab[0] < 14) dark++; n++; }
  return n ? { L: L / n, C: C / n, dark: dark / n } : null;
}
function skinStats(P, r) { // 얼굴 상자 가운데 40%
  var w = r[2] - r[0], h = r[3] - r[1], q = [r[0] + w * 0.3, r[1] + h * 0.35, r[2] - w * 0.3, r[3] - h * 0.25], s = [0, 0, 0], n = 0;
  for (var y = q[1]; y < q[3]; y += 1.5) for (var x = q[0]; x < q[2]; x += 1.5) { var lab = rgb2lab(pix(P, x, y)); s[0] += lab[0]; s[1] += lab[1]; s[2] += lab[2]; n++; }
  return n ? [s[0] / n, s[1] / n, s[2] / n] : null;
}
function outfitColor(P, r) { // 얼굴 아래 옷 색
  var w = r[2] - r[0], h = r[3] - r[1], q = [r[0] - w * 0.3, r[3] + h * 0.6, r[2] + w * 0.3, r[3] + h * 1.6];
  if (q[1] >= P.ch - 2) return null; q[3] = Math.min(q[3], P.ch - 1); var s = [0, 0, 0], n = 0;
  for (var y = q[1]; y < q[3]; y += 2) for (var x = q[0]; x < q[2]; x += 2) { var lab = rgb2lab(pix(P, x, y)); s[0] += lab[0]; s[1] += lab[1]; s[2] += lab[2]; n++; }
  return n ? [s[0] / n, s[1] / n, s[2] / n] : null;
}

// ── 낱장/펼침면, 쪽 번호, 제본 안쪽 ──
function layoutPages() {
  var WO = R.WO, ws = R.pages.map(function (P) { return P.trim[2] - P.trim[0]; }), minW = Math.min.apply(null, ws);
  var lp = 1;
  R.pages.forEach(function (P) {
    var w = P.trim[2] - P.trim[0], spread;
    if (WO.layout === 'spread') spread = true; else if (WO.layout === 'single') spread = false;
    else if (WO.w) spread = Math.abs(mm(w) - WO.w * 2) < 2.5; else spread = w > minW * 1.6;
    P.spread = spread;
    P.lp = spread ? [lp, lp + 1] : [lp]; lp += spread ? 2 : 1;
  });
  R.bookPages = lp - 1;
  // 제본 안쪽 위험 구역 (mm)
  var b = WO.bind, t = WO.cal && R.bookPages ? Math.ceil(R.bookPages / 2) * WO.cal : 0, z = 0, note = '';
  if (b === 'saddle') { z = SET.gutterSaddle; note = '중철은 가운데 접히는 부분 ' + z + 'mm 안쪽에 얼굴·글자를 두지 마세요.'; }
  else if (b === 'perfect') { z = clamp(8 + 0.4 * t, 10, 22); }
  else if (b === 'pur') { z = clamp(6 + 0.3 * t, 8, 18); }
  else if (b === 'hard') { z = clamp(10 + 0.4 * t, 12, 25); }
  else if (b === 'layflat') { z = SET.glue; }
  z = Math.round(z * 2) / 2; R.gz = z; R.thick = t;
  if (b === 'perfect' || b === 'pur' || b === 'hard') note = (t ? '책 두께 약 ' + f1(t) + 'mm(' + R.bookPages + '쪽 × 종이 ' + WO.cal + 'mm ÷ 2) 기준, ' : '종이 두께를 넣으면 더 정확해요. 지금은 기본값으로, ') + '안쪽(제본 쪽) 여백 ' + z + 'mm 안에는 얼굴·글자를 두지 않는 걸 권장해요. 인쇄소 기준이 따로 있으면 그걸 따라 주세요.';
  if (b === 'layflat') note = '레이플랫 포토북은 펼침이 거의 평평해서 안쪽 ' + z + 'mm(풀칠 영역)만 비우면 돼요.';
  R.gNote = note;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function gutterZones(P) { // pt 상자 목록 [{b, side}]
  if (!R.gz || R.WO.bind === 'none') return [];
  var T = P.trim, z = R.gz * MM;
  if (P.spread) { var cx = (T[0] + T[2]) / 2; return [{ b: [cx - z, T[1], cx + z, T[3]], fold: cx }]; }
  var odd = P.lp[0] % 2 === 1; // 홀수 쪽 = 오른쪽 페이지 → 제본은 왼쪽
  return [odd ? { b: [T[0], T[1], T[0] + z, T[3]], edge: 'L' } : { b: [T[2] - z, T[1], T[2], T[3]], edge: 'R' }];
}
function snippet(P, b) {
  var best = '', ov = 0;
  (P.tc || []).forEach(function (t) { if (!t.s.trim()) return; var o = Math.max(0, Math.min(b[2], t.b[2]) - Math.max(b[0], t.b[0])) * Math.max(0, Math.min(b[3], t.b[3]) - Math.max(b[1], t.b[1])); if (o > ov) { ov = o; best = t.s; } });
  best = best.trim(); return best.length > 24 ? best.slice(0, 24) + '…' : best;
}
function inside(b, T) { return b[0] >= T[0] - 0.5 && b[1] >= T[1] - 0.5 && b[2] <= T[2] + 0.5 && b[3] <= T[3] + 0.5; }
function overlaps(a, b) { return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }
function inkTxt(k) { if (!k) return ''; if (k.rgb) return 'RGB'; var s = []; if (k.c > 0.004) s.push('C' + Math.round(k.c * 100)); if (k.m > 0.004) s.push('M' + Math.round(k.m * 100)); if (k.y > 0.004) s.push('Y' + Math.round(k.y * 100)); if (k.k > 0.004) s.push('K' + Math.round(k.k * 100)); if (k.spots) for (var n in k.spots) s.push(n + ' ' + Math.round(k.spots[n] * 100) + '%'); return s.join(' ') || '흰색(0%)'; }

// ── 페이지별 검사 ──
function pageChecks(P) {
  var T = P.trim, WO = R.WO, pg = P.i, aiFinal = R.kind === 'aiF', isAI = R.kind !== 'id';
  function add(sev, cat, code, title, detail, fix, boxes, ex) { var o = { page: pg, sev: sev, cat: cat, code: code, title: title, detail: detail || '', fix: fix || '', boxes: boxes || [] }; if (ex) for (var k in ex) o[k] = ex[k]; return issue(o); }
  if (P.error) add('warn', 'print', 'parse', '이 페이지 일부를 읽지 못했어요', P.error, '아크로뱃 프리플라이트로 한 번 더 확인해 주세요.');
  if (P.truncated) add('info', 'print', 'trunc', '내용이 아주 많아 앞부분만 검사했어요', '오브젝트가 너무 많아 일부만 봤어요.', '');
  // 재단 사이즈
  if (WO.w && WO.h) {
    var tw = mm(T[2] - T[0]), th = mm(T[3] - T[1]), ew = P.spread ? WO.w * 2 : WO.w;
    if (Math.abs(tw - ew) > 0.6 || Math.abs(th - WO.h) > 0.6) { if (!(Math.abs(tw - WO.h) < 0.6 && Math.abs(th - ew) < 0.6)) add('err', 'print', 'trimsize', '재단 사이즈가 사양서와 달라요', '파일 ' + f1(tw) + '×' + f1(th) + 'mm · 사양서 ' + f1(ew) + '×' + WO.h + 'mm', '문서 크기를 사양서에 맞춰 주세요.', [T]); }
  }
  // 도련 상자
  if (!isAI) {
    var bl = P.bleed || P.crop, d = [mm(T[0] - bl[0]), mm(T[1] - bl[1]), mm(bl[2] - T[2]), mm(bl[3] - T[3])], mn = Math.min.apply(null, d);
    if (!P.hasTrim && !P.hasBleed) add('warn', 'print', 'nobox', '재단선 정보가 없는 PDF예요', '도련 포함 여부를 판단하기 어려워요.', '인디자인 내보내기 > 표시 및 도련 > “문서 도련 설정 사용(3mm)”을 켜 주세요.');
    else if (mn < SET.bleed - 0.2) add('err', 'print', 'bleedbox', '도련이 ' + SET.bleed + 'mm보다 작아요', '도련 위·아래·왼쪽·오른쪽: ' + [d[3], d[1], d[0], d[2]].map(f1).join(' / ') + 'mm', '내보내기에서 도련 ' + SET.bleed + 'mm를 넣어 주세요.', [T]);
    bleedFill(P, add);
  }
  // 안전 여백 + 제본 안쪽 + 칼선 주변 + 가이드선
  var safeIn = [T[0] + SET.safe * MM, T[1] + SET.safe * MM, T[2] - SET.safe * MM, T[3] - SET.safe * MM];
  var zones = gutterZones(P); P.zones = zones;
  var die = []; P.strokes.concat(P.fills).forEach(function (o) { if (o.ink.spots) for (var s in o.ink.spots) if (PRV.isFin(s) && o.segs) die = die.concat(o.segs.map(function (g) { return { g: g, n: s }; })); });
  var safeHits = [], gText = [], dieHits = [];
  P.texts.forEach(function (t) {
    var b = t.vis; if (!b || PRV.empty(b)) return;
    if (!overlaps(b, T)) return; // 재단 밖 (슬러그) 글자
    if (b[0] < safeIn[0] || b[1] < safeIn[1] || b[2] > safeIn[2] || b[3] > safeIn[3]) safeHits.push(b);
    zones.forEach(function (z) { if (overlaps(b, z.b)) gText.push(b); });
    if (die.length && nearSegs(b, die, SET.safe * MM)) dieHits.push(b);
  });
  if (safeHits.length) add('warn', 'print', 'safe', '재단선 안쪽 ' + SET.safe + 'mm 안에 글자가 있어요', '재단이 밀리면 잘릴 수 있어요. ' + list(safeHits.map(function (b) { return snippet(P, b); })), '글자를 안쪽으로 ' + SET.safe + 'mm 이상 옮겨 주세요.', safeHits);
  if (dieHits.length) add('warn', 'print', 'diesafe', '칼선 가까이(' + SET.safe + 'mm 안) 글자가 있어요', list(dieHits.map(function (b) { return snippet(P, b); })), '칼선 안쪽으로 ' + SET.safe + 'mm 이상 띄워 주세요.', dieHits);
  if (gText.length) add('err', 'bind', 'guttertext', (P.spread ? '접히는 가운데' : '제본 안쪽') + '에 글자가 걸려요', list(gText.map(function (b) { return snippet(P, b); })), '제본 쪽에서 ' + R.gz + 'mm 이상 떨어지게 옮겨 주세요.', gText, { top: true });
  // 얼굴: 제본 안쪽, 재단 안전 여백
  var gFace = [], sFace = [];
  (P.faces || []).forEach(function (F) {
    var b = F.box; if (!overlaps(b, T)) return;
    zones.forEach(function (z) { if (overlaps(b, z.b)) { var mv = z.fold ? (b[0] < z.fold && b[2] > z.fold ? null : (b[2] <= z.fold ? b[2] - z.b[0] : z.b[2] - b[0])) : z.edge === 'L' ? z.b[2] - b[0] : b[2] - z.b[0]; F.gutter = true; gFace.push({ b: b, mv: mv }); } });
    if (b[0] < T[0] + SET.safe * MM || b[2] > T[2] - SET.safe * MM || b[1] < T[1] + SET.safe * MM || b[3] > T[3] - SET.safe * MM) sFace.push(b);
  });
  gFace.forEach(function (g) {
    add('err', 'bind', 'gutterface', (P.spread ? '접히는 가운데에 얼굴이 걸려요' : '제본 안쪽에 얼굴이 걸려요'), g.mv === null ? '얼굴이 접히는 선을 가로질러요.' : '얼굴이 위험 구역에 약 ' + f1(mm(g.mv)) + 'mm 들어가 있어요.', g.mv === null ? '사진을 한쪽 페이지로 옮기거나 크기를 조정해 주세요.' : '사진을 바깥쪽으로 약 ' + Math.ceil(mm(g.mv) + 2) + 'mm 옮겨 주세요.', [g.b], { top: true });
  });
  if (sFace.length) add('warn', 'print', 'safeface', '재단선 가까이에 얼굴이 있어요', '재단선 안쪽 ' + SET.safe + 'mm 안에 얼굴이 걸려요.', '사진 위치를 조금 안쪽으로 옮겨 주세요.', sFace, { sus: true });
  // 펼침면 가운데 가이드선
  if (P.spread) {
    var cx = (T[0] + T[2]) / 2, gl = P.strokes.concat(P.fills).filter(function (o) { var b = o.box; return b[2] - b[0] < 1.5 && (b[3] - b[1]) > (T[3] - T[1]) * 0.5 && Math.abs((b[0] + b[2]) / 2 - cx) < 1.2 * MM; });
    if (gl.length) add('err', 'print', 'centerguide', '펼침면 가운데 가이드선이 남아 있어요', '가운데 세로선 ' + gl.length + '개 (' + inkTxt(gl[0].ink) + ')', '가이드용 선이면 지워 주세요.', gl.map(function (o) { return pad(o.box, 2); }));
  }
  // 이미지
  var low = [], rgbI = [];
  P.images.forEach(function (im) {
    if (!im.vis || PRV.empty(PRV.isect(im.vis, P.crop))) return;
    var ppi = Math.min(im.ppiX, im.ppiY);
    if (!im.mask && ppi && ppi < SET.ppi && mm(im.vis[2] - im.vis[0]) > 3 && mm(im.vis[3] - im.vis[1]) > 3) low.push({ b: im.vis, ppi: ppi });
    if (im.ink && im.ink.rgb) rgbI.push(im.vis);
  });
  low.forEach(function (l) { add('err', 'print', 'lowppi', '해상도가 낮은 이미지', '유효 해상도 ' + Math.round(l.ppi) + 'ppi (기준 ' + SET.ppi + 'ppi)', '원본을 더 큰 걸로 바꾸거나 이미지를 ' + Math.round(l.ppi / SET.ppi * 100) + '% 이하로 줄여 주세요.', [l.b]); });
  if (rgbI.length) add('warn', 'print', 'rgbimg', 'RGB 이미지가 있어요', rgbI.length + '개', '포토샵에서 CMYK로 바꿔 주세요. 의도한 거면 인쇄소 변환 방식을 확인해 주세요.', rgbI);
  var rv = P.rgb.fill + P.rgb.stroke + P.rgb.text + P.rgb.shade;
  if (rv) add('warn', 'print', 'rgbvec', 'RGB 색이 남아 있어요 (도형·글자)', rv + '곳', '색상 견본을 CMYK로 바꿔 주세요.', P.rgb.boxes.filter(function (b, i) { return i < 30; }));
  // 재단선 · 맞춤표는 원래 레지스트레이션이라 재단선 바깥은 빼고, 재단 안쪽 디자인에 쓰인 것만 알림
  var regIn = P.reg.filter(function (b) { var T = P.trim, e = 0.3 * MM; return b && b[0] < T[2] - e && b[2] > T[0] + e && b[1] < T[3] - e && b[3] > T[1] + e; });
  // 위에 사진·흰 박스가 오버프린트 없이 완전히 덮은 건 판에 안 나오니 빼기 (덮은 게 오버프린트면 비쳐 나와서 남김) (2026-11-20 실장님)
  var covers = P.images.filter(function (o) { return !o.smask && !o.mask && !o.rot && !o.op && (o.ca == null || o.ca >= 0.999) && o.vis; }).concat(P.fills.filter(function (o) { return o.rect && !o.op && (o.ca == null || o.ca >= 0.999) && o.vis && !o.ink.none && !o.ink.pattern; }));
  regIn = regIn.filter(function (b) { var e = 0.05; return !covers.some(function (o) { var v = o.vis; return o.seq > (b.seq || 0) && v[0] <= b[0] + e && v[1] <= b[1] + e && v[2] >= b[2] - e && v[3] >= b[3] - e; }); });
  // 가는 선(칼선·접는선·가이드)은 주의, 면·글자는 경고 (2026-11-20 실장님)
  var regLine = regIn.filter(function (b) { return b.line; }), regArt = regIn.filter(function (b) { return !b.line; });
  if (regArt.length) add('err', 'print', 'reg', '재단 안쪽에 레지스트레이션 색 (면·글자)', regArt.length + '곳', 'K100 또는 리치블랙으로 바꾸기', regArt);
  if (regLine.length) add('warn', 'print', 'regline', '칼선·가이드선이 레지스트레이션 색', regLine.length + '곳', '칼선·접는선이면 별색 + 오버프린트로 바꾸기, 가이드선이면 지우기', regLine);
  if (P.annots) add('warn', 'print', 'annot', '메모·주석이 남아 있어요', P.annots + '개', '인쇄될 수 있으니 지우고 다시 내보내 주세요.');
  // 칠·선
  var kOP = [], tacB = [], tacE = [], kBig = [], rbOff = [], wOP = [], sOP = [], hair = [], h0 = [], t4 = [], finOff = [], wThin = [], finThin = [], lt5 = [], lt10 = [], opCol = [];
  // 옅은 농도 (자가점검리스트: 5% 이하 ❌, 10% 주의) — 가장 진한 판도 그 이하면 인쇄에서 거의 안 보이거나 얼룩져요
  var lite = function (k, b) { if (!k || k.rgb || k.lab || k.white || k.reg || k.pattern || k.none || !b) return; var mx = Math.max(k.c, k.m, k.y, k.k); if (k.spots) { var fin = false; for (var s in k.spots) { if (PRV.isFin(s)) fin = true; mx = Math.max(mx, k.spots[s]); } if (fin) return; } if (mx <= 0.005) return; if (mx <= 0.05 + 1e-4) lt5.push({ b: b, k: k }); else if (mx <= 0.10 + 1e-4) lt10.push({ b: b, k: k }); };
  var isFinK = function (k) { if (k && k.spots) for (var s in k.spots) if (PRV.isFin(s)) return s; return ''; };
  P.fills.forEach(function (f) {
    var k = f.ink, b = f.vis; if (!b || PRV.empty(b) || !overlaps(b, P.crop)) return;
    if (!k.spots && !k.rgb && !k.reg && !f.shade) {
      if (k.tac > SET.tacErr + 0.5) tacE.push({ b: b, k: k }); else if (k.tac > SET.tacWarn + 0.5) tacB.push({ b: b, k: k });
    }
    var area = mm(b[2] - b[0]) * mm(b[3] - b[1]);
    if (area >= SET.blackArea && Math.min(mm(b[2] - b[0]), mm(b[3] - b[1])) >= 15) {
      if (k.k100) kBig.push(b);
      else if (!k.rgb && !k.spots && k.k > 0.99 && k.inkN > 1 && (Math.abs(k.c - 0.3) > 0.02 || Math.abs(k.m - 0.2) > 0.02 || Math.abs(k.y - 0.2) > 0.02)) rbOff.push({ b: b, k: k });
    }
    if (k.white && f.op) wOP.push(b);
    if (k.spots) for (var s in k.spots) if (PRV.isFin(s) && !f.op) finOff.push({ b: b, n: s });
    if (!f.shade) lite(k, b);
    if (f.op && !k.k100 && !k.white && !k.rgb && !isFinK(k) && !f.shade) opCol.push({ b: b, k: k });
  });
  P.strokes.forEach(function (o) {
    var k = o.ink, b = pad(o.vis || o.box, 1); if (PRV.empty(o.vis) || !overlaps(o.box, P.crop)) return;
    var fin = false; if (k.spots) for (var s in k.spots) if (PRV.isFin(s)) { fin = true; if (!o.op) finOff.push({ b: b, n: s }); }
    if (fin) { if (o.w0 !== 0 && o.w < 0.5 - 1e-4) finThin.push({ b: b, w: o.w, n: isFinK(k) }); return; }
    if (k.white && o.op) wOP.push(b);
    if (k.white && o.w0 !== 0 && o.w < 0.3 - 1e-4) wThin.push({ b: b, w: o.w });
    lite(k, b);
    if (!o.op && (k.spots || k.pure) && !k.white) (k.k100 ? kOP : sOP).push({ b: b, k: k });
    if (o.w0 === 0) h0.push(b); else if (o.w <= SET.hair + 1e-4) hair.push({ b: b, w: o.w });
    else if (o.w < SET.thin4c && k.inkN > 1) t4.push({ b: b, w: o.w });
  });
  // 흑백처럼 보이는 페이지 (2026-11-20 실장님): 회색을 만든 CMYK 값이 한쪽으로 치우쳤는지, 빠진 판이 있는지, 전체 농도가 너무 낮은지 — 감리 때 맞추기 어려움
  (function () {
    var px = P.px; if (!px || !px.data) return;
    var d = px.data, n = 0, col = 0, darkL = 255, step = 4 * Math.max(1, Math.round(Math.sqrt(d.length / 4 / 60000)));
    for (var i = 0; i < d.length; i += step) {
      var r = d[i], g = d[i + 1], b2 = d[i + 2], mx = Math.max(r, g, b2), mn = Math.min(r, g, b2);
      if (mn > 244) continue; n++;
      if (mx - mn > 22) col++;
      var L = 0.299 * r + 0.587 * g + 0.114 * b2; if (L < darkL) darkL = L;
    }
    if (n < 300 || col / n > 0.03) return;
    var objs = P.fills.concat(P.strokes, P.texts).filter(function (o) { var k = o.ink, bb = o.vis || o.box; return k && bb && !PRV.empty(bb) && overlaps(bb, P.crop) && !k.rgb && !k.spots && !k.reg && !k.white && !k.pattern && k.tac > 0.5; });
    var imgs = P.images.filter(function (im) { return im.vis && !PRV.empty(PRV.isect(im.vis, P.crop)) && !im.mask; });
    var cmykImg = imgs.filter(function (im) { var k = im.cs && (im.cs.k === 'idx' && im.cs.base ? im.cs.base.k : im.cs.k); return k === 'cmyk'; });
    if (!objs.length && !imgs.length) return;
    var used = { c: 0, m: 0, y: 0, k: 0 }, skew = [], noK = [], kOnly = 0, cmyGray = 0, maxT = 0;
    objs.forEach(function (o) {
      var k = o.ink; ['c', 'm', 'y', 'k'].forEach(function (ch) { if (k[ch] > 0.02) used[ch]++; });
      if (k.tac > maxT) maxT = k.tac;
      var mx = Math.max(k.c, k.m, k.y), mn = Math.min(k.c, k.m, k.y);
      if (mx < 0.02) kOnly++; else cmyGray++;
      if (mx >= 0.1 && mx - mn >= 0.2) skew.push(o);
      if (k.k < 0.02 && mx >= 0.15) noK.push(o);
    });
    var bx = function (L) { return L.slice(0, 30).map(function (o) { return o.vis || o.box; }); };
    var sample = function (L) { var u = []; L.forEach(function (o) { var t = inkTxt(o.ink); if (u.indexOf(t) < 0) u.push(t); }); return u.slice(0, 3).join(', '); };
    if (skew.length) add('warn', 'print', 'grayskew', '흑백 디자인인데 회색이 한 색으로 치우쳐 있어요', skew.length + '곳 · ' + sample(skew), '권장 K 단독 회색, 또는 C·M·Y를 고르게 (예 C40 M30 Y30). 한쪽이 많으면 감리 때 색이 끼어 보여요', bx(skew));
    if (noK.length) add('warn', 'print', 'graynok', '흑백 디자인인데 K판 없이 CMY로만 만든 회색', noK.length + '곳 · ' + sample(noK), '권장 K를 기본으로 한 회색. CMY만으로는 인쇄 농도가 흔들리고 감리 때 맞추기 어려워요', bx(noK));
    var cmyU = ['c', 'm', 'y'].filter(function (ch) { return used[ch]; }), miss = ['c', 'm', 'y'].filter(function (ch) { return !used[ch]; });
    if (cmyU.length && miss.length) add('warn', 'print', 'grayplate', '흑백 디자인에 빠진 판이 있어요: ' + miss.map(function (c) { return c.toUpperCase(); }).join(' · '), '쓰인 판 ' + ['c', 'm', 'y', 'k'].filter(function (ch) { return used[ch]; }).map(function (c) { return c.toUpperCase(); }).join(' · '), '권장 K 단독으로 정리하거나 C·M·Y를 모두 넣어 균형 맞추기. 일부 판만 있으면 회색에 색이 껴요');
    if (kOnly && cmyGray && !skew.length && !noK.length) add('info', 'print', 'graymix', '회색 만드는 방식이 섞여 있어요', 'K 단독 ' + kOnly + '곳 · CMY 섞은 회색 ' + cmyGray + '곳', '권장 한 가지 방식으로 통일. 같은 회색도 퍼센티지가 달라 감리 때 맞추기 어려워요');
    var darkPct = Math.round((1 - darkL / 255) * 100);
    if (darkPct < 55 && (maxT < 70 || !objs.length)) add('info', 'print', 'graylow', '흑백 디자인 전체 농도가 낮아요', '가장 진한 곳 약 ' + darkPct + '% · 벡터 최대 잉크 ' + Math.round(maxT) + '%', '권장 가장 진한 곳 K70 이상. 농도가 낮으면 감리 때 올리고 내릴 여지가 적어요');
    if (cmykImg.length) add('info', 'print', 'grayimg', '흑백으로 보이는 사진이 CMYK 이미지예요', cmykImg.length + '개', '권장 포토샵 정보 패널로 어두운 곳·중간 회색의 CMYK 값 확인. 한 색이 많거나 K가 없으면 그레이스케일(K)로 바꿀지 인쇄소와 확인', cmykImg.map(function (im) { return im.vis; }));
  })();
  if (tacE.length) add('err', 'print', 'tac', '잉크 총량이 ' + SET.tacErr + '%를 넘어요', tacE.slice(0, 3).map(function (t) { return inkTxt(t.k) + ' = ' + Math.round(t.k.tac) + '%'; }).join(', '), '리치블랙은 C30 M20 Y20 K100(170%)으로, 진한 색은 총량 ' + SET.tacWarn + '% 안으로 줄여 주세요.', tacE.map(function (t) { return t.b; }));
  if (tacB.length) add('warn', 'print', 'tac2', '잉크 총량이 ' + SET.tacWarn + '%를 넘어요', tacB.slice(0, 3).map(function (t) { return inkTxt(t.k) + ' = ' + Math.round(t.k.tac) + '%'; }).join(', '), '종이·인쇄소 기준을 확인하고 필요하면 줄여 주세요.', tacB.map(function (t) { return t.b; }));
  if (kBig.length) add('warn', 'print', 'richblack', '넓은 검정 면이 K100 단독이에요', kBig.length + '곳 · 넓은 면은 K100만 쓰면 회색빛으로 얼룩져 보여요.', '리치블랙 C30 M20 Y20 K100으로 바꿔 주세요 (작은 글자·얇은 선은 K100 유지).', kBig);
  if (rbOff.length) add('info', 'print', 'richblack2', '팀 리치블랙(C30 M20 Y20 K100)과 다른 검정 면', rbOff.slice(0, 3).map(function (t) { return inkTxt(t.k); }).join(', '), '의도한 게 아니면 C30 M20 Y20 K100으로 맞춰 주세요.', rbOff.map(function (t) { return t.b; }));
  if (wOP.length) add('err', 'print', 'whiteop', '흰색에 오버프린트가 켜져 있어요', wOP.length + '곳 · 인쇄하면 흰색이 사라져요.', '속성 패널에서 칠/획 중복 인쇄를 꺼 주세요.', wOP);
  if (finOff.length) add('err', 'print', 'finop', '후가공 판(' + uniq(finOff.map(function (f) { return f.n; })).join(', ') + ')에 오버프린트가 꺼져 있어요', finOff.length + '곳 · 아래 그림이 하얗게 빠져요.', '칼선·박·형압 등 후가공 선과 면은 별색 + 중복 인쇄로 설정해 주세요.', finOff.map(function (f) { return f.b; }));
  if (sOP.length) add('warn', 'print', 'strokeop', '별색·단색 선에 오버프린트가 꺼져 있어요', sOP.length + '곳 · ' + uniq(sOP.map(function (s) { return inkTxt(s.k); })).slice(0, 3).join(', '), '색이 맞닿는 부분이 벌어지지 않게 선에 중복 인쇄(획)를 켜는 걸 권장해요.', sOP.map(function (s) { return s.b; }), { sus: true });
  if (kOP.length) add('info', 'print', 'kop', 'K100 선에 오버프린트가 꺼져 있어요', kOP.length + '곳 · 인디자인 “[검정] 100% 중복 인쇄” 설정이 켜져 있으면 괜찮아요.', '색이 맞닿는 곳에 흰 틈이 걱정되면 선에 중복 인쇄(획)를 켜 주세요.', kOP);
  if (h0.length) add('err', 'print', 'hair0', '두께 0인 선이 있어요', h0.length + '개 · 인쇄기마다 다르게 나오거나 안 나와요.', '0.25pt 이상으로 바꿔 주세요.', h0);
  if (hair.length) add('warn', 'print', 'hair', SET.hair + 'pt 이하 얇은 선', hair.length + '개 (가장 얇은 ' + f1(Math.min.apply(null, hair.map(function (h) { return h.w; }))) + 'pt)', '0.25pt 이상을 권장해요.', hair.map(function (h) { return h.b; }));
  t4 = t4.filter(function (t) { var T = P.trim, e = 0.3 * MM, b = t.b; return b[0] < T[2] - e && b[2] > T[0] + e && b[1] < T[3] - e && b[3] > T[1] + e; });
  if (wThin.length) add('warn', 'print', 'whitethin', '흰 선이 0.3pt보다 얇아요', wThin.length + '개 (가장 얇은 ' + f1(Math.min.apply(null, wThin.map(function (h) { return h.w; }))) + 'pt)', '권장 역상(흰) 선 0.3pt 이상. 얇으면 잉크에 묻혀 끊겨 보여요', wThin.map(function (h) { return h.b; }));
  if (finThin.length) add('warn', 'print', 'finthin', '후가공 선이 0.5pt보다 얇아요: ' + uniq(finThin.map(function (h) { return h.n; })).join(', '), finThin.length + '개 (가장 얇은 ' + f1(Math.min.apply(null, finThin.map(function (h) { return h.w; }))) + 'pt)', '권장 박·형압 선 0.5pt 이상. 얇으면 박이 끊기거나 눌림이 안 나와요 (칼선은 해당 없음)', finThin.map(function (h) { return h.b; }));
  if (lt5.length) add('warn', 'print', 'lite5', '5% 이하 옅은 색', lt5.length + '곳 · ' + uniq(lt5.map(function (t) { return inkTxt(t.k); })).slice(0, 3).join(', '), '권장 10% 이상. 5% 이하는 인쇄에서 거의 안 나오거나 얼룩져요', lt5.map(function (t) { return t.b; }));
  if (lt10.length) add('adv', 'print', 'lite10', '10% 이하 옅은 색', lt10.length + '곳 · ' + uniq(lt10.map(function (t) { return inkTxt(t.k); })).slice(0, 3).join(', '), '권장 종이·인쇄 방식에 따라 흐리게 나올 수 있어요. 교정으로 확인', lt10.map(function (t) { return t.b; }));
  if (opCol.length) add('adv', 'print', 'opcolor', 'K100이 아닌 색에 오버프린트가 켜져 있어요', opCol.length + '곳 · ' + uniq(opCol.map(function (t) { return inkTxt(t.k); })).slice(0, 3).join(', '), '권장 의도한 게 아니면 끄기. 아래 색과 섞여 색이 바뀌어요 (오버프린트 미리보기로 확인)', opCol.map(function (t) { return t.b; }));
  if (t4.length) add('warn', 'print', 'thin4c', '4도 혼합 얇은 선', t4.length + '개 · 판이 조금만 어긋나도 선이 번져 보여요.', '얇은 선은 한 가지 색(예: K100)으로 바꿔 주세요.', t4.map(function (t) { return t.b; }));
  // 글자
  var tiny = [], skop = [], s4 = [], live = [], wt = [], wOPt = [], finTx = [], mirT = [];
  P.texts.forEach(function (t) {
    var b = t.vis; if (!b || PRV.empty(b) || !overlaps(b, P.crop)) return;
    live.push(b);
    var k = t.ink; if (!k) return;
    if (t.size <= SET.minText + 0.05) tiny.push({ b: b, t: t });
    if (k.k100 && t.size < SET.smallText && !t.op) skop.push({ b: b, t: t });
    if (!k.rgb && !k.spots && k.inkN > 1 && ((k.k > 0.8 && t.size < SET.smallText) || t.size < SET.small4c)) s4.push({ b: b, t: t });
    if (k.white && !t.op) wt.push(t);
    if (k.white && t.op) wOPt.push(b);
    var fn = isFinK(k); if (fn && t.size < 7 - 0.05) finTx.push({ b: b, t: t, n: fn });
    if (t.mir) mirT.push(b);
    if (!fn) lite(k, b);
  });
  if (aiFinal && live.length) add('err', 'print', 'outline', '아웃라인 안 된 글자가 남아 있어요', live.length + '덩어리 · ' + list(live.map(function (b) { return snippet(P, b); })), '문자 > 윤곽선 만들기(Ctrl/Cmd+Shift+O) 해 주세요.', live.slice(0, 40));
  if (tiny.length) add('adv', 'print', 'tiny', '작은 글자', '폰트 크기 ' + f1(Math.min.apply(null, tiny.map(function (x) { return x.t.size; }))) + 'pt · ' + tiny.length + '곳 · ' + list(tiny.map(function (x) { return snippet(P, x.b); })), '권장 6pt 이상. 작게 둘 리걸 문구는 K100 단색', tiny.map(function (x) { return x.b; }));
  if (skop.length) add('warn', 'print', 'smallk', '작은 검정 글자에 오버프린트가 꺼져 있어요', skop.length + '곳 · ' + list(skop.map(function (x) { return snippet(P, x.b); })), SET.smallText + 'pt 미만 검정 글자는 K100 + 중복 인쇄로 해야 바탕과 어긋나도 테두리가 안 생겨요.', skop.map(function (x) { return x.b; }));
  if (s4.length) add('warn', 'print', 'small4c', '작은 글자가 4도 혼합 색이에요', s4.length + '곳 · ' + uniq(s4.map(function (x) { return inkTxt(x.t.ink); })).slice(0, 2).join(', '), '판이 어긋나면 번져 보여요. 작은 글자는 한 가지 색(검정은 K100)으로 바꿔 주세요.', s4.map(function (x) { return x.b; }));
  if (finTx.length) add('warn', 'print', 'fintext', '후가공 글자가 7pt보다 작아요: ' + uniq(finTx.map(function (x) { return x.n; })).join(', '), '가장 작은 ' + f1(Math.min.apply(null, finTx.map(function (x) { return x.t.size; }))) + 'pt · ' + finTx.length + '곳 · ' + list(finTx.map(function (x) { return snippet(P, x.b); })), '권장 박·형압 글자 7pt 이상. 작으면 획이 뭉치거나 끊겨요', finTx.map(function (x) { return x.b; }));
  if (mirT.length) add('warn', 'print', 'mirror', '좌우·상하가 뒤집힌 글자', mirT.length + '곳 · ' + list(mirT.map(function (b) { return snippet(P, b); })), '권장 의도한 반전(투명 스티커 뒷면 등)이 아니면 반전 풀기', mirT);
  whiteText(P, wt, add);
  if (wOPt.length) add('err', 'print', 'whiteopt', '흰 글자에 오버프린트가 켜져 있어요', wOPt.length + '곳 · ' + list(wOPt.map(function (b) { return snippet(P, b); })) + ' · 인쇄하면 글자가 사라져요.', '글자 칠 중복 인쇄를 꺼 주세요.', wOPt);
  // 포토북 첫·끝 페이지 풀칠
  if (R.WO.bind === 'layflat' || R.prod === 'photobook') glueCheck(P, add);
}
function pad(b, k) { return [b[0] - k, b[1] - k, b[2] + k, b[3] + k]; }
function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
function list(a) { a = uniq(a.filter(Boolean)); return a.length ? '“' + a.slice(0, 4).join('”, “') + '”' + (a.length > 4 ? ' 외 ' + (a.length - 4) + '개' : '') : ''; }
function nearSegs(b, segs, d) {
  for (var i = 0; i < segs.length; i++) {
    var g = segs[i].g, n = Math.max(1, Math.ceil(Math.hypot(g[2] - g[0], g[3] - g[1]) / 3));
    for (var k = 0; k <= n; k++) { var x = g[0] + (g[2] - g[0]) * k / n, y = g[1] + (g[3] - g[1]) * k / n; var dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); if (dx * dx + dy * dy < d * d) return true; }
  }
  return false;
}

// 도련 채움: 재단선 안쪽엔 색이 있는데 바깥(도련)이 흰색이면 → 도련 미적용
function bleedFill(P, add) {
  var T = P.trim, C = P.crop, out = SET.bleed * MM * 0.6, inn = 0.7 * MM, step = MM, runs = [];
  var edges = [
    { n: '왼쪽', ok: T[0] - C[0] > 1.6 * MM, a: T[1], b: T[3], pt: function (s, o) { return [T[0] + o, s]; } },
    { n: '오른쪽', ok: C[2] - T[2] > 1.6 * MM, a: T[1], b: T[3], pt: function (s, o) { return [T[2] - o, s]; } },
    { n: '아래', ok: T[1] - C[1] > 1.6 * MM, a: T[0], b: T[2], pt: function (s, o) { return [s, T[1] + o]; } },
    { n: '위', ok: C[3] - T[3] > 1.6 * MM, a: T[0], b: T[2], pt: function (s, o) { return [s, T[3] - o]; } }
  ];
  edges.forEach(function (e) {
    if (!e.ok) return;
    var o2 = Math.min(out, (e.n === '왼쪽' ? T[0] - C[0] : e.n === '오른쪽' ? C[2] - T[2] : e.n === '아래' ? T[1] - C[1] : C[3] - T[3]) - 0.4 * MM);
    var run = null;
    for (var s = e.a + 3 * MM; s <= e.b - 3 * MM; s += step) {
      var pi = e.pt(s, inn), po = e.pt(s, -o2), qi = ptPx(P, pi[0], pi[1]), qo = ptPx(P, po[0], po[1]);
      var ci = avgPix(P, qi[0], qi[1], 1), co = avgPix(P, qo[0], qo[1], 1);
      var miss = co[0] > 250 && co[1] > 250 && co[2] > 250 && lum(ci) < 232 && Math.abs(lum(ci) - lum(co)) > 25;
      if (miss) { if (!run) run = { e: e, s0: s, s1: s }; else run.s1 = s; }
      else if (run) { runs.push(run); run = null; }
    }
    if (run) runs.push(run);
  });
  runs = runs.filter(function (r) { return r.s1 - r.s0 >= 5 * MM; });
  if (!runs.length) return;
  var boxes = runs.map(function (r) { var a = r.e.pt(r.s0, 2 * MM), b = r.e.pt(r.s1, -SET.bleed * MM); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; });
  add('err', 'print', 'bleedfill', '배경이 재단선에서 끊겨요 (도련 없음)', uniq(runs.map(function (r) { return r.e.n; })).join('·') + ' 가장자리 · 재단이 조금만 밀려도 흰 줄이 생겨요.', '배경·사진을 재단선 밖 ' + SET.bleed + 'mm까지 늘려 주세요.', boxes);
}

// 흰 글자: 렌더된 바탕 밝기로 판단
function whiteText(P, wt, add) {
  var hits = [];
  wt.forEach(function (t) {
    var r = toPx(P, t.vis); if (r[2] - r[0] < 2) return;
    var ls2 = [], step = Math.max(1, (r[2] - r[0]) / 40);
    for (var y = r[1]; y <= r[3]; y += Math.max(1, (r[3] - r[1]) / 8)) for (var x = r[0]; x <= r[2]; x += step) ls2.push(lum(pix(P, x, y)));
    ls2.sort(function (a, b) { return a - b; }); var bg = ls2.length ? ls2[Math.floor(ls2.length * 0.25)] : 255;
    if (bg > 120) return;
    var under = null; for (var i = P.fills.length - 1; i >= 0; i--) { var f = P.fills[i]; if (!f.ink.white && f.box[0] <= t.vis[0] && f.box[2] >= t.vis[2] && f.box[1] <= t.vis[1] && f.box[3] >= t.vis[3]) { under = f; break; } }
    var rich = under && under.ink.k > 0.9 && under.ink.inkN > 1, lim = SET.whiteText + (t.font.serif || t.font.thin ? 4 : 0) + (rich ? 4 : 0);
    if (t.size < lim) hits.push({ t: t, rich: rich, bg: bg });
  });
  if (!hits.length) return;
  var why = uniq(hits.map(function (h) { return (h.t.font.serif ? '명조·세리프' : h.t.font.thin ? '얇은 굵기' : '') ; })).join(', ');
  add('warn', 'print', 'whitetext', '어두운 바탕 위 작은 흰 글자', hits.length + '곳 · ' + list(hits.map(function (h) { return snippet(P, h.t.vis); })) + ' · ' + uniq(hits.map(function (h) { return h.t.font.name + ' ' + f1(h.t.size) + 'pt'; })).slice(0, 3).join(', ') + (why ? ' (' + why + ')' : '') + (hits.some(function (h) { return h.rich; }) ? ' · 리치블랙 바탕' : ''),
    '잉크가 번져 글자가 막힐 수 있어요. 굵기를 한 단계 올리거나 흰색 획 0.1~0.2pt를 더해 주세요' + (hits.some(function (h) { return h.rich; }) ? '. 리치블랙 바탕이면 글자 주변만 K100으로 바꾸는 것도 방법이에요.' : '.'), hits.map(function (h) { return h.t.vis; }));
}

// 포토북 표지: 안쪽면(마지막 페이지, 2p 이상일 때)의 책등 쪽 — 책등과 그 양옆 풀칠 영역이 비어 있어야 함
function coverGlue(P, add) {
  if (R.bookPages < 2 || P.lp.indexOf(R.bookPages) < 0) return; // 1p짜리 표지(바깥면만)·바깥면 페이지는 보지 않음
  var T = P.trim, g = SET.glue * MM, cx = (T[0] + T[2]) / 2, W = R.WO || {};
  var sp = W.pages && W.cal ? Math.ceil(W.pages / 2) * W.cal * MM : 0; // 사양서 쪽수·종이 두께로 책등 추정, 모르면 가운데만
  var strip = [cx - sp / 2 - g, T[1], cx + sp / 2 + g, T[3]];
  var r = toPx(P, strip), cnt = 0, tot = 0;
  for (var y = r[1] + 1; y < r[3] - 1; y += 2) for (var xx = r[0] + 1; xx < r[2] - 1; xx += 1) { tot++; if (!isW(pix(P, xx, y))) cnt++; }
  if (tot && cnt / tot > 0.01) add('err', 'bind', 'glue', '표지 안쪽면 책등 쪽에 그림이 있어요', '책등' + (sp ? '(약 ' + f1(mm(sp)) + 'mm)' : '') + '과 양옆 ' + SET.glue + 'mm는 풀칠돼서 가려져요 · 칠해진 비율 ' + Math.round(cnt / tot * 100) + '%', '이 영역은 비우기', [strip], { top: true });
}
// 포토북 첫·끝 페이지: 제본 쪽 3mm 풀칠 영역 비우기 + 그 영역 뺀 나머지에서 가운데 정렬
function glueCheck(P, add) {
  if (R.cover) return coverGlue(P, add); // 표지 파일은 바깥면이 아니라 안쪽면 책등 쪽을 봄 (2026-11-20 실장님)
  var first = P.lp.indexOf(1) > -1, last = P.lp.indexOf(R.bookPages) > -1;
  if (!first && !last) return;
  var T = P.trim, g = SET.glue * MM;
  [[first, 1], [last, R.bookPages]].forEach(function (x) {
    if (!x[0]) return;
    var n = x[1], half = T, k = P.lp.indexOf(n);
    if (P.spread) { var cx = (T[0] + T[2]) / 2; half = k === 0 ? [T[0], T[1], cx, T[3]] : [cx, T[1], T[2], T[3]]; }
    var left = n % 2 === 1; // 홀수 쪽 → 오른쪽 페이지 → 제본은 왼쪽
    var strip = left ? [half[0], half[1], half[0] + g, half[3]] : [half[2] - g, half[1], half[2], half[3]];
    var r = toPx(P, strip), cnt = 0, tot = 0;
    for (var y = r[1] + 1; y < r[3] - 1; y += 2) for (var xx = r[0] + 1; xx < r[2] - 1; xx += 1) { tot++; if (!isW(pix(P, xx, y))) cnt++; }
    if (tot && cnt / tot > 0.01) add('err', 'bind', 'glue', (n === 1 ? '첫' : '마지막') + ' 페이지 풀칠 영역(' + SET.glue + 'mm)에 그림이 있어요', '제본 쪽(' + (left ? '왼쪽' : '오른쪽') + ') ' + SET.glue + 'mm는 풀칠돼서 가려져요. 칠해진 비율 ' + Math.round(cnt / tot * 100) + '%', '이 영역은 비워 주세요.', [strip], { top: true });
    // 가운데 정렬: 풀칠 영역 뺀 나머지 기준
    var area = left ? [half[0] + g, half[1], half[2], half[3]] : [half[0], half[1], half[2] - g, half[3]], ra = toPx(P, area), x0 = Infinity, x1 = -Infinity;
    for (var yy = ra[1]; yy < ra[3]; yy += 3) for (var x2 = ra[0]; x2 < ra[2]; x2 += 2) { if (!isW(pix(P, x2, yy))) { if (x2 < x0) x0 = x2; if (x2 > x1) x1 = x2; } }
    if (x1 > x0 && (x1 - x0) < (ra[2] - ra[0]) * 0.97) {
      var lm = x0 - ra[0], rm = ra[2] - x1, diff = mm((lm - rm) / 2 / P.scale);
      if (Math.abs(diff) > 1) add('warn', 'bind', 'gluecenter', (n === 1 ? '첫' : '마지막') + ' 페이지 내용이 가운데가 아니에요', '풀칠 영역을 뺀 나머지 기준으로 ' + (diff > 0 ? '오른쪽' : '왼쪽') + '으로 약 ' + f1(Math.abs(diff)) + 'mm 치우쳐 있어요.', (diff > 0 ? '왼쪽' : '오른쪽') + '으로 ' + f1(Math.abs(diff)) + 'mm 옮겨 주세요.', [area]);
    }
  });
}

// ── 문서 전체 검사 ──
function docChecks() {
  var WO = R.WO, add = function (sev, cat, code, title, detail, fix, ex) { var o = { page: null, sev: sev, cat: cat, code: code, title: title, detail: detail || '', fix: fix || '', boxes: [] }; if (ex) for (var k in ex) o[k] = ex[k]; return issue(o); };
  // 쪽수와 제본
  var bp = R.bookPages;
  if (WO.bind === 'saddle' && bp % 4) add('err', 'bind', 'pages4', '중철은 4의 배수여야 해요', '지금 ' + bp + '쪽 → ' + (Math.ceil(bp / 4) * 4) + '쪽으로 맞춰야 해요 (' + (Math.ceil(bp / 4) * 4 - bp) + '쪽 추가 또는 ' + (bp % 4) + '쪽 줄이기).', '');
  if ((WO.bind === 'perfect' || WO.bind === 'pur' || WO.bind === 'hard' || WO.bind === 'layflat') && bp % 2) add('err', 'bind', 'pages2', '책 쪽수가 홀수예요', '지금 ' + bp + '쪽. 제본하려면 짝수여야 해요.', '빈 페이지를 넣거나 쪽수를 맞춰 주세요.');
  if (WO.pages && WO.pages !== bp && WO.pages !== R.n) add('err', 'bind', 'pagecount', '쪽수가 사양서와 달라요', '파일 ' + bp + '쪽 (PDF ' + R.n + '장) · 사양서 ' + WO.pages + '쪽', '빠지거나 더 들어간 페이지가 없는지 확인해 주세요.');
  if (R.gNote) add('info', 'bind', 'gutteradv', '제본 안쪽 여백 제안', R.gNote, '', { top: false });
  // 서체
  var ne = R.fonts.filter(function (f) { return !f.embedded && f.type !== 'Type3'; });
  if (R.offLayers && R.offLayers.length) add('warn', 'print', 'offlayer', '꺼진(숨긴) 레이어가 있어요: ' + R.offLayers.slice(0, 6).join(', '), R.offLayers.length + '개', '권장 필요 없는 레이어는 지우고 다시 내보내기. 출력 환경에 따라 인쇄될 수 있어요');
  if (ne.length) add('err', 'print', 'fontembed', '파일에 포함되지 않은 서체', ne.map(function (f) { return f.name + (f.pages.length ? ' (' + f.pages.map(function (p) { return p + 1; }).join(', ') + 'p)' : ''); }).join(', '), 'PDF 내보내기에서 서체 포함(100%)이 되게 하거나 아웃라인 해 주세요.');
  // 별색
  var spots = {}; R.pages.forEach(function (P) { for (var s in P.spots) (spots[s] = spots[s] || []).push(P.i + 1); });
  // 칼선 같은 후가공 판은 이름이 낯설어도 '선으로만 쓰이고 오버프린트가 켜진 별색'이면 후가공으로 본다 (2026-11-20 칼선이 인쇄 별색으로 잡히던 문제)
  var use = {}; var U = function (s) { return use[s] = use[s] || { f: 0, s: 0, t: 0, op: true }; };
  R.pages.forEach(function (P) {
    P.fills.forEach(function (o) { if (o.ink && o.ink.spots) for (var s in o.ink.spots) U(s).f++; });
    P.strokes.forEach(function (o) { if (o.ink && o.ink.spots) for (var s in o.ink.spots) { U(s).s++; if (!o.op) U(s).op = false; } });
    P.texts.forEach(function (o) { [o.ink, o.sink].forEach(function (k) { if (k && k.spots) for (var s in k.spots) U(s).t++; }); });
  });
  var isFinS = function (s) { var u = use[s]; return PRV.isFin(s) || !!(u && u.s > 0 && !u.f && !u.t && u.op); };
  R.spotList = Object.keys(spots).map(function (s) { return { n: s, fin: isFinS(s), pages: spots[s] }; });
  var fin = [], other = [];
  Object.keys(spots).forEach(function (s) { (isFinS(s) ? fin : other).push(s); });
  // 사양서와 비교: 사양서에 별색 인쇄가 있으면 안내, 없으면 주의, 사양서가 없으면 주의
  var specT = String(R.spec || ''), specSpot = /별색|pantone|팬톤|spot|PMS/i.test(specT);
  if (other.length) add(specT && specSpot ? 'info' : 'warn', 'print', 'spot', (specT && !specSpot ? '사양서에 별색 인쇄가 없는데 별색이 있어요: ' : '별색이 쓰였어요: ') + other.join(', '), other.map(function (s) { return s + ' → ' + spots[s].slice(0, 12).join(',') + '쪽'; }).join(' · '), '의도한 별색(팬톤 인쇄)이 아니면 CMYK로 바꿔 주세요.', { pages: uniq([].concat.apply([], other.map(function (s) { return spots[s]; }))) });
  if (fin.length) add('info', 'print', 'spotfin', '후가공 판: ' + fin.join(', '), fin.map(function (s) { return s + ' → ' + spots[s].slice(0, 12).join(',') + '쪽'; }).join(' · '), '판 이름이 인쇄소 요청과 같은지 확인해 주세요.');
  var finKo = fin.filter(function (s) { return /[가-힣]/.test(s); }); if (finKo.length) add('adv', 'print', 'finname', '후가공 판 이름이 한글이에요: ' + finKo.join(', '), '', '권장 영문 명칭 (예: Foil_Gold, Emboss, Die_Cut). 인쇄소 프로그램에서 한글 이름이 깨질 수 있어요');
  // 후가공 판 레이어 분리
  var finLayers = {}, artLayers = {};
  R.pages.forEach(function (P) {
    P.strokes.concat(P.fills).forEach(function (o) { var f = false; if (o.ink.spots) for (var s in o.ink.spots) if (PRV.isFin(s)) f = true; (f ? finLayers : artLayers)[o.layer || '(레이어 없음)'] = 1; });
  });
  if (fin.length) {
    var mixed = Object.keys(finLayers).filter(function (l) { return artLayers[l]; });
    if (mixed.length && !(mixed.length === 1 && mixed[0] === '(레이어 없음)' && Object.keys(artLayers).length === 1)) add('warn', 'print', 'finlayer', '후가공 판이 그림과 같은 레이어에 있어요', '레이어: ' + mixed.join(', ') + (mixed[0] === '(레이어 없음)' ? ' (PDF에 레이어 정보가 없어요)' : ''), '칼선·박 등은 별도 레이어로 분리해 주세요. 인쇄소가 판을 따로 뽑기 쉬워요.', { sus: true });
  }
  // 칼선 위치
  R.pages.forEach(function (P) {
    var bb = null; P.strokes.forEach(function (o) { if (!o.ink.spots) return; for (var s in o.ink.spots) if (/die|cut|thomson|칼선|도무송|톰슨/i.test(s)) bb = bb ? [Math.min(bb[0], o.box[0]), Math.min(bb[1], o.box[1]), Math.max(bb[2], o.box[2]), Math.max(bb[3], o.box[3])] : o.box.slice(); });
    if (!bb) return;
    var T = P.trim, dx = mm((bb[0] + bb[2]) / 2 - (T[0] + T[2]) / 2), dy = mm((bb[1] + bb[3]) / 2 - (T[1] + T[3]) / 2);
    var tol = MM; // 선 두께·곡선 때문에 0.1~0.3mm 넘는 건 정상 (2026-11-20 실장님)
    var outside = bb[0] < T[0] - tol || bb[2] > T[2] + tol || bb[1] < T[1] - tol || bb[3] > T[3] + tol;
    issue({ page: P.i, sev: outside ? 'warn' : 'info', cat: 'print', code: 'dieinfo', title: outside ? '칼선이 재단 영역 밖으로 나가요' : '칼선 위치', detail: '칼선 크기 ' + f1(mm(bb[2] - bb[0])) + '×' + f1(mm(bb[3] - bb[1])) + 'mm · 가운데에서 가로 ' + f1(dx) + 'mm, 세로 ' + f1(dy) + 'mm', fix: outside ? '칼선이 재단선 안에 있는지, 칼선 기준 도련 3mm가 있는지 확인해 주세요.' : '', boxes: [bb], sus: true });
  });
  // 이미지 임베드 안내
  add('info', 'print', 'embed', '이미지 임베드 여부는 PDF로 알 수 없어요', '원본 .ai/.indd의 링크 상태는 파일 안에서만 보여요.', '일러스트·인디자인 링크 패널 또는 데스크탑 스크립트로 확인해 주세요.');
  R.notes.forEach(function (n) { add('info', 'print', 'note', n, '', ''); });
}

// ── 중복 사진 (가장 중요) ──
function dupPhotos() {
  var I = R.imgs, groups = [], byHash = {};
  I.forEach(function (im) { if (im.hash) (byHash[im.hash] = byHash[im.hash] || []).push(im); });
  var used = new Set();
  Object.keys(byHash).forEach(function (h) {
    var g = byHash[h]; if (g.length < 2) return;
    var pages = uniq(g.map(function (x) { return x.page; }));
    var small = g.every(function (x) { return mm(x.vis[2] - x.vis[0]) < 30 && mm(x.vis[3] - x.vis[1]) < 30; });
    var rep = pages.length > 5 && small; // 로고·패턴처럼 반복되는 이미지
    g.forEach(function (x) { used.add(x); });
    groups.push({ items: g, exact: true, repeat: rep });
  });
  // 비슷한 사진 (해시 거리)
  var C = I.filter(function (x) { return x.hashV && x.hashV.sd > 9; });
  var parent = new Map(); function find(x) { while (parent.get(x) !== x) x = parent.get(x); return x; }
  C.forEach(function (x) { parent.set(x, x); });
  for (var a = 0; a < C.length; a++) for (var b = a + 1; b < C.length; b++) {
    var A = C[a], B = C[b]; if (A.hash && A.hash === B.hash) continue;
    if (A.page === B.page && overlaps(A.vis, B.vis)) continue;
    var d = ham(A.hashV.bits, B.hashV.bits), dc = Math.abs(A.hashV.mean - B.hashV.mean);
    if (d <= 5 && dc < 25) parent.set(find(A), find(B));
  }
  var near = {}; C.forEach(function (x) { var r = find(x); if (r !== x || C.some(function (y) { return y !== x && find(y) === r; })) (near[C.indexOf(r)] = near[C.indexOf(r)] || []).push(x); });
  Object.keys(near).forEach(function (k) { var g = near[k]; if (g.length > 1 && !g.every(function (x) { return used.has(x) && byHash[x.hash] && byHash[x.hash].length === g.length; })) groups.push({ items: g, exact: false }); });
  R.dups = groups.filter(function (g) { return !g.repeat; });
  R.repeats = groups.filter(function (g) { return g.repeat; });
  R.dups.forEach(function (g) {
    var pages = uniq(g.items.map(function (x) { return x.page + 1; }));
    issue({ page: null, sev: g.exact ? 'err' : 'warn', cat: 'photo', code: g.exact ? 'dup' : 'dupnear', title: g.exact ? (R.isImg ? '똑같은 이미지 파일이 ' + g.items.length + '개 있어요' : '같은 사진이 ' + g.items.length + '번 쓰였어요') : '같은 사진으로 보여요', detail: R.isImg ? uniq(g.items.map(function (x) { return pl(x.page); })).join(', ') : pages.join(', ') + '쪽', fix: g.exact ? '의도한 반복이 아니면 다른 사진으로 바꿔 주세요.' : '자르기·크기만 다른 같은 컷인지 확인해 주세요.', boxes: [], pages: pages, group: g, sus: !g.exact, top: true });
    g.items.forEach(function (x) { issue({ page: x.page, sev: g.exact ? 'err' : 'warn', cat: 'photo', code: g.exact ? 'dupP' : 'dupnearP', title: g.exact ? '중복 사진' : '중복 의심 사진', detail: '같은 사진: ' + pages.join(', ') + '쪽', fix: '', boxes: [x.vis], hidden: true }); });
  });
}

// ── 디자인 규칙 (반복 레이아웃에서 어긋난 페이지) ──
function designRules() {
  // 같은 크기 페이지끼리, 같은 자리에 반복되는 네모 칸을 모은다
  var groups = {};
  R.pages.forEach(function (P) { var k = Math.round(mm(P.trim[2] - P.trim[0])) + 'x' + Math.round(mm(P.trim[3] - P.trim[1])); (groups[k] = groups[k] || []).push(P); });
  R.rules = [];
  Object.keys(groups).forEach(function (gk) {
    var G = groups[gk]; if (G.length < 3) return;
    var tol = 1.2 * MM;
    // 각 페이지 네모 후보 (칠 또는 선으로 된 사각형, 5~90mm)
    var slots = [];
    G.forEach(function (P) {
      var seen = [];
      P.fills.concat(P.strokes).forEach(function (o) {
        if (!o.segs || o.segs.length !== 4) { if (!(o.segs === null && o.box)) return; }
        var b = o.box, w = mm(b[2] - b[0]), h = mm(b[3] - b[1]); if (w < 5 || h < 5 || w > 90 || h > 90) return;
        var rel = [b[0] - P.trim[0], b[1] - P.trim[1], b[2] - P.trim[0], b[3] - P.trim[1]];
        if (seen.some(function (s) { return near4(s, rel, tol); })) return; seen.push(rel);
        var sl = slots.find(function (s) { return near4(s.r, rel, tol); });
        if (!sl) { sl = { r: rel, pages: new Set() }; slots.push(sl); }
        sl.pages.add(P.i);
      });
    });
    slots = slots.filter(function (s) { return s.pages.size >= Math.max(3, G.length * 0.5); });
    if (slots.length < 4) return;
    // 이 틀을 쓰는 페이지 (칸의 60% 이상이 있는 페이지)
    var TP = G.filter(function (P) { var n = slots.filter(function (s) { return s.pages.has(P.i); }).length; return n >= slots.length * 0.6; });
    if (TP.length < 3) return;
    // 칸마다: 글자 있음/없음 + 렌더된 색
    var obs = [];
    TP.forEach(function (P) {
      slots.forEach(function (s, si) {
        var b = [s.r[0] + P.trim[0], s.r[1] + P.trim[1], s.r[2] + P.trim[0], s.r[3] + P.trim[1]];
        var has = P.texts.some(function (t) { var c = [(t.vis[0] + t.vis[2]) / 2, (t.vis[1] + t.vis[3]) / 2]; return c[0] > b[0] && c[0] < b[2] && c[1] > b[1] && c[1] < b[3]; }) || (P.tc || []).some(function (t) { if (!t.s.trim()) return false; var c = [(t.b[0] + t.b[2]) / 2, (t.b[1] + t.b[3]) / 2]; return c[0] > b[0] && c[0] < b[2] && c[1] > b[1] && c[1] < b[3]; });
        var col = cellColor(P, b, P.texts);
        if (col) obs.push({ P: P, si: si, b: b, has: has, col: col });
      });
    });
    // 반(글자 있음/없음)별 대표색
    var cls = { 1: [], 0: [] }; obs.forEach(function (o) { cls[o.has ? 1 : 0].push(o); });
    function major(arr) { var bins = []; arr.forEach(function (o) { var bn = bins.find(function (x) { return cdist(x.c, o.col) < 28; }); if (!bn) { bn = { c: o.col, n: 0, pages: new Set() }; bins.push(bn); } bn.n++; bn.pages.add(o.P.i); }); bins.sort(function (a, b) { return b.n - a.n; }); return bins; }
    var B1 = major(cls[1]), B0 = major(cls[0]);
    if (!B1.length || !B0.length) return;
    var c1 = B1[0], c0 = B0[0];
    if (cdist(c1.c, c0.c) < 28) return; // 두 반의 색이 같으면 규칙 없음
    if (c0.n < cls[0].length * 0.6 || c1.n < cls[1].length * 0.6) return;
    R.rules.push({ g: gk, txt: '날짜·글자 없는 칸은 ' + colName(c0.c) + ', 글자 있는 칸은 ' + colName(c1.c), c0: c0.c, c1: c1.c, pages: TP.length });
    // 어긋난 칸: 빈 칸인데 글자칸 색 / 글자칸인데 빈칸 색
    var bad = {};
    obs.forEach(function (o) {
      var want = o.has ? c1.c : c0.c, other = o.has ? c0.c : c1.c, Bset = o.has ? B1 : B0;
      if (cdist(o.col, want) < 28) return;
      var bin = Bset.find(function (x) { return cdist(x.c, o.col) < 28; }), share = bin ? bin.n / (o.has ? cls[1].length : cls[0].length) : 0;
      if (cdist(o.col, other) < 28 && share < 0.15) (bad[o.P.i] = bad[o.P.i] || []).push(o);
    });
    var ref = TP.find(function (P) { return !bad[P.i]; });
    Object.keys(bad).forEach(function (pi) {
      var L = bad[pi], P = R.pages[+pi], has = L[0].has;
      issue({ page: P.i, sev: 'warn', cat: 'rule', code: 'rulecell', title: '디자인 규칙과 다른 칸이 있어요', detail: (has ? '글자 있는 칸 ' : '날짜·글자 없는 칸 ') + L.length + '개가 ' + colName(L[0].col) + '이에요. 다른 ' + (TP.length - Object.keys(bad).length) + '개 페이지에선 이런 칸이 ' + colName(has ? c1.c : c0.c) + '이에요.', fix: (has ? '글자 있는 칸' : '빈 칸') + ' 색을 ' + colName(has ? c1.c : c0.c) + '으로 맞춰 주세요.' + (ref ? ' (' + (ref.i + 1) + '쪽과 비교)' : ''), boxes: L.map(function (o) { return o.b; }), ref: ref ? ref.i : null, refBox: unionB(L.map(function (o) { return o.b; })), sw: [L[0].col, has ? c1.c : c0.c], top: true });
    });
    // 반복 글자 스타일: 같은 자리 글자의 서체·크기·색이 다른 페이지
    textStyleRule(TP, tol);
  });
}
function textStyleRule(TP, tol) {
  var slots = [];
  TP.forEach(function (P) {
    P.texts.forEach(function (t) {
      if (!t.ink || t.size < 4) return;
      var rel = [t.vis[0] - P.trim[0], t.vis[1] - P.trim[1]];
      var sl = slots.find(function (s) { return Math.abs(s.r[0] - rel[0]) < tol * 2 && Math.abs(s.r[1] - rel[1]) < tol * 2; });
      if (!sl) { sl = { r: rel, list: [] }; slots.push(sl); }
      if (!sl.list.some(function (x) { return x.P === P; })) sl.list.push({ P: P, t: t });
    });
  });
  slots.forEach(function (s) {
    if (s.list.length < Math.max(3, TP.length * 0.7)) return;
    var keyOf = function (x) { return x.t.font.name + '|' + Math.round(x.t.size * 2) / 2 + '|' + inkTxt(x.t.ink); }, cnt = {};
    s.list.forEach(function (x) { var k = keyOf(x); cnt[k] = (cnt[k] || 0) + 1; });
    var best = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
    if (cnt[best] < s.list.length * 0.7) return;
    var ref = s.list.find(function (x) { return keyOf(x) === best; });
    s.list.forEach(function (x) {
      if (keyOf(x) === best) return;
      var a = best.split('|'), b = keyOf(x).split('|'), diff = [];
      if (a[0] !== b[0]) diff.push('서체 ' + b[0] + ' (보통 ' + a[0] + ')'); if (a[1] !== b[1]) diff.push('크기 ' + b[1] + 'pt (보통 ' + a[1] + 'pt)'); if (a[2] !== b[2]) diff.push('색 ' + b[2] + ' (보통 ' + a[2] + ')');
      issue({ page: x.P.i, sev: 'warn', cat: 'rule', code: 'ruletext', title: '같은 자리 글자 스타일이 다른 페이지와 달라요', detail: '“' + (snippet(x.P, x.t.vis) || '글자') + '” · ' + diff.join(', ') + ' · ' + cnt[best] + '개 페이지가 같은 스타일', fix: '의도한 게 아니면 ' + (ref.P.i + 1) + '쪽과 같은 스타일로 맞춰 주세요.', boxes: [x.t.vis], ref: ref.P.i, refBox: ref.t.vis, sus: true });
    });
  });
}
function near4(a, b, t) { return Math.abs(a[0] - b[0]) < t && Math.abs(a[1] - b[1]) < t && Math.abs(a[2] - b[2]) < t && Math.abs(a[3] - b[3]) < t; }
function unionB(L) { return [Math.min.apply(null, L.map(function (b) { return b[0]; })), Math.min.apply(null, L.map(function (b) { return b[1]; })), Math.max.apply(null, L.map(function (b) { return b[2]; })), Math.max.apply(null, L.map(function (b) { return b[3]; }))]; }
function cellColor(P, b, texts) { // 칸 안쪽(가장자리 20% 제외) 픽셀 중앙값, 글자 영역 제외
  if (!P.px) return null;
  var r = toPx(P, b), w = r[2] - r[0], h = r[3] - r[1]; if (w < 6 || h < 6) return null;
  var tb = texts.filter(function (t) { return overlaps(t.vis, b); }).map(function (t) { return toPx(P, t.vis); });
  var R0 = [], G0 = [], B0 = [];
  for (var y = r[1] + h * 0.2; y < r[3] - h * 0.2; y += Math.max(1, h / 14)) for (var x = r[0] + w * 0.2; x < r[2] - w * 0.2; x += Math.max(1, w / 14)) {
    if (tb.some(function (q) { return x >= q[0] - 2 && x <= q[2] + 2 && y >= q[1] - 2 && y <= q[3] + 2; })) continue;
    var p = pix(P, x, y); R0.push(p[0]); G0.push(p[1]); B0.push(p[2]);
  }
  if (R0.length < 6) return null;
  function med(a) { a.sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }
  return [med(R0), med(G0), med(B0)];
}
function cdist(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)); }
function colName(c) {
  var lab = rgb2lab(c), L = lab[0], a = lab[1], b = lab[2], C = Math.sqrt(a * a + b * b), hue = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, n;
  if (C < 5) n = L > 93 ? '흰색' : L < 25 ? '검정' : '회색';
  else if (L > 72 && C < 30) n = hue > 30 && hue < 110 ? '베이지' : '연한 색';
  else if (hue < 40 || hue > 340) n = '빨강'; else if (hue < 70) n = '주황'; else if (hue < 105) n = '노랑'; else if (hue < 170) n = '초록'; else if (hue < 260) n = '파랑'; else n = '보라';
  return '<i class="swc" style="display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:-1px;margin-right:3px;border:1px solid rgba(0,0,0,.15);background:rgb(' + c.map(Math.round).join(',') + ')"></i>' + n;
}

// ── 인물 사진 의견 (얼굴 크기, 밝기·피부톤, 코팅) ──
function faceAdvice() {
  var F = R.faces.filter(function (f) { return f.skin && f.score > 0.6; });
  R.people = [];
  if (!F.length) return;
  // 같은 사람 묶기 (얼굴 특징 거리)
  var P = [];
  F.forEach(function (f) {
    var best = null, bd = 0.52;
    P.forEach(function (p) { var d = edist(p.c, f.desc); if (d < bd) { bd = d; best = p; } });
    if (!best) { best = { c: f.desc.slice(), items: [] }; P.push(best); }
    best.items.push(f); var n = best.items.length; best.c = best.c.map(function (v, i) { return v + (f.desc[i] - v) / n; });
  });
  // 팀 정보의 인원수로 묶음 보정: 1인 아티스트면 한 사람으로, 여러 명이면 가까운 묶음끼리 합침
  var nP = 0; try { nP = +((window.RV2.parseRules(R.rulesText || '').info || {})['인원']) || 0; } catch (e) {}
  function mergeP(x, y) { x.items = x.items.concat(y.items); var n = x.items.length; x.c = x.c.map(function (v, i) { return (v * (n - y.items.length) + y.c[i] * y.items.length) / n; }); P.splice(P.indexOf(y), 1); }
  if (nP === 1 && P.length > 1) { P.sort(function (a, b) { return b.items.length - a.items.length; }); while (P.length > 1) mergeP(P[0], P[1]); }
  else if (nP > 1) while (P.length > nP) { var bp = null, bd2 = 0.62; for (var i1 = 0; i1 < P.length; i1++) for (var j1 = i1 + 1; j1 < P.length; j1++) { var dd = edist(P[i1].c, P[j1].c); if (dd < bd2) { bd2 = dd; bp = [P[i1], P[j1]]; } } if (!bp) break; mergeP(bp[0], bp[1]); }
  P.sort(function (a, b) { return b.items.length - a.items.length; });
  P.forEach(function (p, i) { p.name = nP === 1 && R.artist ? R.artist : '인물 ' + String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : ''); p.id = i; });
  R.solo = nP === 1;
  R.people = P;
  var card = R.prod === 'photocard', coat = !!R.WO.coat || card, book = R.prod === 'photobook';
  // 같은 사람 + 같은 옷끼리 톤 비교
  P.forEach(function (p) {
    if (p.items.length < 2) return;
    var outfits = [];
    p.items.forEach(function (f) { if (!f.outfit) return; var o = outfits.find(function (x) { return labD(x.c, f.outfit) < 20; }); if (!o) { o = { c: f.outfit, items: [] }; outfits.push(o); } o.items.push(f); });
    p.outfits = outfits;
    outfits.forEach(function (o, oi) {
      if (o.items.length < 3) return;
      var mL = median(o.items.map(function (f) { return f.skin[0]; })), ma = median(o.items.map(function (f) { return f.skin[1]; })), mb = median(o.items.map(function (f) { return f.skin[2]; }));
      o.items.forEach(function (f) {
        var dL = f.skin[0] - mL, da = f.skin[1] - ma, db = f.skin[2] - mb, msg = [];
        if (Math.abs(dL) > 7) msg.push((dL < 0 ? '어두워요' : '밝아요') + ' (밝기 약 ' + (dL < 0 ? '+' : '-') + Math.round(Math.abs(dL) * 1.3) + '% 조정)');
        if (Math.abs(db) > 6) msg.push(db > 0 ? '노란기가 많아요' : '푸른기가 돌아요');
        if (Math.abs(da) > 6) msg.push(da > 0 ? '붉은기가 많아요' : '초록기가 돌아요');
        if (msg.length) { f.flag = true; issue({ page: f.page, sev: 'adv', cat: 'face', code: 'tone', title: '같은 멤버·같은 착장인데 톤이 달라요', detail: p.name + ' · 같은 옷 ' + o.items.length + '장 중 이 사진 피부가 ' + msg.join(', '), fix: '같은 착장 사진들과 피부 밝기·색을 맞춰 주세요.', boxes: [f.box], face: f, person: p }); }
      });
    });
  });
  // 얼굴 크기 (포토카드: 카드끼리 / 포토북: 한 명 나오는 사진끼리)
  var single = R.pages.filter(function (Pg) { return Pg.faces && Pg.faces.length === 1; }).map(function (Pg) { var f = Pg.faces[0]; return { f: f, r: (f.box[3] - f.box[1]) / (Pg.trim[3] - Pg.trim[1]) / (Pg.spread ? 1 : 1) }; });
  if ((card || book) && single.length >= 4) {
    var mr = median(single.map(function (x) { return x.r; })), th = card ? 0.2 : 0.35;
    single.forEach(function (x) {
      var d = x.r / mr - 1; if (Math.abs(d) <= th) return;
      x.f.flag = true;
      issue({ page: x.f.page, sev: 'adv', cat: 'face', code: 'facesize', title: '얼굴 크기가 다른 ' + (card ? '카드' : '사진') + '보다 ' + (d > 0 ? '커요' : '작아요'), detail: '보통보다 약 ' + Math.round(Math.abs(d) * 100) + '% ' + (d > 0 ? '큼' : '작음') + ' (한 명만 나온 ' + single.length + '장 기준)', fix: (card ? '세트로 나란히 볼 때 튀어 보여요. ' : '') + '사진 크기를 약 ' + Math.round((1 / (1 + d)) * 100) + '%로 ' + (d > 0 ? '줄여' : '키워') + ' 보세요.', boxes: [x.f.box], face: x.f });
    });
  }
  // 카드 사이 피부 밝기 차이 (포토카드)
  if (card && F.length >= 4) {
    var mL2 = median(F.map(function (f) { return f.skin[0]; }));
    F.forEach(function (f) { var d = f.skin[0] - mL2; if (Math.abs(d) > 10 && !f.flag) { f.flag = true; issue({ page: f.page, sev: 'adv', cat: 'face', code: 'cardtone', title: '다른 카드보다 피부가 많이 ' + (d < 0 ? '어두워요' : '밝아요'), detail: '세트 평균보다 밝기 차이 ' + Math.round(Math.abs(d)) + ' (L*)', fix: '세트로 볼 때 튀어 보일 수 있어요. 밝기를 약 ' + (d < 0 ? '+' : '-') + Math.round(Math.abs(d) * 1.2) + '% 맞춰 보세요.', boxes: [f.box], face: f }); } });
  }
  // 코팅 후 어두워짐
  if (coat) {
    R.pages.forEach(function (Pg) {
      (Pg.faces || []).forEach(function (f) {
        if (!f.skin) return; var L = f.skin[0], C = Math.sqrt(f.skin[1] * f.skin[1] + f.skin[2] * f.skin[2]), msg = [], fix = [];
        if (L < 58) { msg.push('얼굴 밝기 L* ' + Math.round(L)); fix.push('얼굴 중간톤을 약 +' + Math.round((62 - L) * 1.5) + '% 밝게'); }
        if (C > 38) { msg.push('피부 채도가 높아요'); fix.push('채도 약 -' + Math.round((C - 32) * 1.5) + '%'); }
        if (msg.length) issue({ page: Pg.i, sev: 'adv', cat: 'face', code: 'coat', title: '코팅하면 더 어둡고 진해질 수 있어요', detail: msg.join(', ') + ' · ' + (R.WO.coat === 'matte' ? '무광' : '유광') + ' 코팅은 보통 전체가 한 톤 어두워지고 색이 진해져요.', fix: fix.join(', ') + ' 보정해 보세요.', boxes: [f.box], face: f });
      });
    });
    R.imgs.forEach(function (im) { if (im.stats && im.stats.dark > 0.3 && mm(im.vis[2] - im.vis[0]) > 30) issue({ page: im.page, sev: 'adv', cat: 'face', code: 'coatdark', title: '어두운 부분이 많아 코팅 후 뭉칠 수 있어요', detail: '사진의 ' + Math.round(im.stats.dark * 100) + '%가 아주 어두운 영역이에요.', fix: '어두운 영역(섀도)을 약 +10~15% 올려 디테일을 살려 주세요.', boxes: [im.vis] }); });
  }
}
function edist(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]); return Math.sqrt(s); }
function labD(a, b) { return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)); }
function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 0; }

// ── 보고서 화면 ──
var CATS = [['all', '전체'], ['top', '가장 중요'], ['print', '인쇄'], ['img', '이미지 파일'], ['bind', '제본'], ['photo', '중복 사진'], ['rule', '디자인 규칙'], ['text', '글자·표기'], ['cal', '달력'], ['face', '인물 사진']];
// 단계 이름: 오탈자 / 경고 / 주의 / 조언 (+ 안내) — 결과지와 같은 말 (2026-11-20 실장님)
var TYPO_CODES = ['typoko', 'typoen', 'repword', 'dblspace', 'oddchar', 'vzw', 'prime', 'rule', 'rulecase', 'stdterm', 'case', 'koen', 'koen2', 'qtyunit', 'decmix'];
function isTypo(x) { return x.sev !== 'info' && TYPO_CODES.indexOf(x.code) > -1; }
var SEVN = { err: '경고', warn: '주의', info: '안내', adv: '조언' };
function sevName(x) { return isTypo(x) ? '오탈자' : SEVN[x.sev]; }
function sevCls(x) { return isTypo(x) ? 'err' : x.sev; }
function sevO(x) { return isTypo(x) ? -1 : SEVO[x.sev]; }
var UI = { tab: 'all', onlyBad: true };
function renderReport() {
  var I = R.issues.filter(function (x) { return !x.hidden; });
  var c = { typo: 0, err: 0, warn: 0, adv: 0, info: 0 }; I.forEach(function (x) { c[isTypo(x) ? 'typo' : x.sev]++; });
  var T0 = R.pages[0] ? R.pages[0].trim : [0, 0, 0, 0];
  var meta = R.isImg ? '이미지 ' + R.n + '개' + (R.WO && R.WO.w ? ' · 사양 ' + R.WO.w + '×' + R.WO.h + 'mm' : '') : 'PDF ' + R.n + '장 · 책 ' + R.bookPages + '쪽 · 재단 ' + f1(mm(T0[2] - T0[0])) + '×' + f1(mm(T0[3] - T0[1])) + 'mm';
  var h = '<div class="card"><div class="row" style="justify-content:space-between"><div><h3 style="margin:0">' + esc(R.file) + '</h3><div class="small sub" style="margin-top:4px">' + meta + ' · ' + KIND_LABEL[R.kind] + (R.prodName ? ' · ' + esc(R.prodName) : '') + (R.title ? ' · ' + esc(R.title) : '') + (R.artist ? ' · ' + esc(R.artist) : '') + '</div></div>' +
    '<div class="row noprint"><button class="ib" id="print">이 파일 결과지</button></div></div>' +
    '<div class="sum">' + (c.typo ? '<span class="pill err"><b>' + c.typo + '</b>오탈자</span>' : '') + '<span class="pill ' + (c.err ? 'err' : 'ok') + '"><b>' + c.err + '</b>경고</span><span class="pill warn"><b>' + c.warn + '</b>주의</span><span class="pill adv"><b>' + c.adv + '</b>조언</span><span class="pill"><b>' + c.info + '</b>안내</span></div>' +
    '<div class="note">“의심” 표시는 자동으로 추정한 거라 직접 한 번 더 봐 주세요. 색은 화면용(RGB)으로 바꿔 본 대략값이에요.</div></div>';
  h += '<div class="tabs noprint" id="tabs">' + CATS.filter(function (t) { return t[0] === 'all' || t[0] === 'top' || I.some(function (x) { return inCat(x, t[0]); }) || (t[0] === 'face' && R.people && R.people.length); }).map(function (t) { var n = I.filter(function (x) { return inCat(x, t[0]); }).length; return '<button data-t="' + t[0] + '" class="' + (UI.tab === t[0] ? 'on' : '') + '">' + t[1] + '<em>' + n + '</em></button>'; }).join('') + '</div>';
  h += '<div id="tabB"></div>';
  $('#rep').innerHTML = h; $('#rep').hidden = false;
  $('#print').onclick = function () { if (window.RVB) RVB.printSheet([VR || R]); else window.print(); };
  $$('#tabs button').forEach(function (b) { b.onclick = function () { UI.tab = b.dataset.t; $$('#tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderTab(); }; });
  renderTab();
}
function inCat(x, t) { if (x.hidden) return false; if (t === 'all') return true; if (t === 'top') return !!x.top || x.cat === 'photo' && (x.code === 'dup' || x.code === 'dupnear'); return x.cat === t; }
var SEVO = { err: 0, warn: 1, adv: 2, info: 3 };
function renderTab() {
  var t = UI.tab, I = R.issues.filter(function (x) { return inCat(x, t); }), h = '';
  if (t === 'photo' || t === 'top' || t === 'all') h += dupCard(t);
  if (t === 'rule' && !R.isImg) h += '<div class="card"><h3>찾은 디자인 규칙</h3><div class="small sub">' + (R.rules.length ? R.rules.map(function (r) { return '· ' + r.txt + ' (' + r.pages + '개 페이지에서 찾음)'; }).join('<br>') : '반복되는 칸 규칙을 찾지 못했어요. 달력처럼 같은 틀을 여러 페이지에 쓰는 파일에서 동작해요.') + '<br>· 같은 자리에 반복되는 글자(제목, 월 표시 등)의 서체·크기·색도 비교해요.</div></div>';
  if (window.RV2) h += RV2.cards(t);
  if (t === 'face' || t === 'all') h += peopleCard();
  // 이슈 묶기 (같은 코드+제목)
  var G = {}, order = [];
  I.filter(function (x) { return x.code !== 'dup' && x.code !== 'dupnear'; }).forEach(function (x) { var k = x.code + '|' + x.title; if (!G[k]) { G[k] = []; order.push(k); } G[k].push(x); });
  order.sort(function (a, b) { return sevO(G[a][0]) - sevO(G[b][0]) || (G[b][0].top ? 1 : 0) - (G[a][0].top ? 1 : 0); });
  if (order.length) {
    h += '<div class="card"><h3>' + (t === 'all' ? '검사 결과' : CATS.find(function (c) { return c[0] === t; })[1]) + '</h3>';
    order.forEach(function (k) {
      var L = G[k], x = L[0], pages = uniq(L.map(function (y) { return y.page; }).filter(function (p) { return p !== null; }));
      h += '<div class="iss"><div class="ih"><span class="sev ' + sevCls(x) + '">' + sevName(x) + '</span><div class="t"><b>' + esc(x.title) + '</b>' + (x.sus ? '<span class="sus">의심</span>' : '') +
        (L.length === 1 || pages.length <= 1 ? '<div class="d">' + rich(x.detail) + '</div>' : '<div class="d">' + pages.length + '개 페이지 · 예: ' + rich(x.detail) + '</div>') +
        (x.fix ? '<div class="fx">→ ' + rich(x.fix) + '</div>' : '') +
        (/^(bcfail|bcok|isbnbar)$/.test(x.code) ? '<div class="fx noprint"><button type="button" class="lnk" data-gd="barcode">바코드 디자인 기준 보기</button></div>' : x.code === 'boxfsc' ? '<div class="fx noprint"><button type="button" class="lnk" data-gd="fsc">FSC 로고 기준 보기</button></div>' : '') +
        (pages.length ? '<div class="pgs">' + pages.slice(0, 80).map(function (p) { return '<button data-pg="' + p + '" data-iss="' + L.find(function (y) { return y.page === p; }).id + '">' + esc(pl(p)) + '</button>'; }).join('') + '</div>' : '') +
        (x.ref != null && L.length <= 6 ? L.map(function (y) { return compareHTML(y); }).join('') : '') +
        '</div></div></div>';
    });
    h += '</div>';
  } else if (!h) h += '<div class="card"><div class="sub">이 항목에서 찾은 문제가 없어요.</div></div>';
  if (t === 'all' || t === 'print' || t === 'img') h += infoCard();
  h += pagesCard();
  $('#tabB').innerHTML = h;
  bindPg($('#tabB'));
  $$('.cmp').forEach(drawCompare);
  $$('#pplG input').forEach(function (i) { i.onchange = function () { var Rv = VR || R; Rv.people[+i.dataset.p].name = i.value || Rv.people[+i.dataset.p].name; Rv.people[+i.dataset.p].auto = false; renderTab(); }; });
  var ob = $('#onlyBad'); if (ob) ob.onchange = function () { UI.onlyBad = ob.checked; renderTab(); };
}
function rich(s) { return String(s || '').indexOf('<i class="swc"') > -1 ? s : esc(s); }
function bindPg(root) {
  $$('[data-pg]', root).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openViewer(+b.dataset.pg, b.dataset.iss ? +b.dataset.iss : null); }; });
}
function dupCard(t) {
  if (!R.dups.length) return t === 'photo' ? '<div class="card"><h3>중복 사진</h3><div class="sub">같은 사진이 두 번 쓰인 곳을 찾지 못했어요.</div>' + (R.repeats.length ? '<div class="note">로고·패턴처럼 여러 페이지에 반복되는 작은 이미지 ' + R.repeats.length + '종은 빼고 봤어요.</div>' : '') + '</div>' : '';
  return '<div class="card"><h3>중복 사진 <span class="mute small">' + R.dups.length + '묶음</span></h3>' + R.dups.map(function (g) {
    return '<div class="dg"><div class="row" style="margin-bottom:8px"><span class="sev ' + (g.exact ? 'err' : 'warn') + '">' + (g.exact ? '같은 파일' : '비슷함') + '</span>' + (g.exact ? '' : '<span class="sus">의심</span>') + '<span class="small sub">' + esc(uniq(g.items.map(function (x) { return pl(x.page); })).join(', ')) + '</span></div><div class="ims">' +
      g.items.map(function (x) { return '<figure data-pg="' + x.page + '"><img src="' + x.thumb + '" alt=""><figcaption>' + esc(pl(x.page)) + '</figcaption></figure>'; }).join('') + '</div></div>';
  }).join('') + (R.repeats.length ? '<div class="note">로고·패턴처럼 여러 페이지에 반복되는 작은 이미지 ' + R.repeats.length + '종은 뺐어요. 자르기만 다르게 한 같은 사진은 “비슷함”으로 잡히지 않을 수 있어요.</div>' : '') + '</div>';
}
function peopleCard() {
  if (!R.faceOK) return R.prod === 'photobook' || R.prod === 'photocard' ? '<div class="card"><h3>인물 사진 의견</h3><div class="sub">얼굴 인식을 불러오지 못했어요.</div></div>' : '';
  if (!R.people.length) return UI.tab === 'face' ? '<div class="card"><h3>인물 사진 의견</h3><div class="sub">사진에서 얼굴을 찾지 못했어요.</div></div>' : '';
  return '<div class="card"><h3>인물별 사진 <span class="mute small">얼굴로 자동 묶음 · 이름은 바꿀 수 있어요</span></h3><div id="pplG">' + R.people.map(function (p) {
    return '<div class="pg2"><div class="gh"><input data-p="' + p.id + '" value="' + esc(p.name) + '"><span class="small sub">' + p.items.length + '장 · ' + uniq(p.items.map(function (f) { return f.page + 1; })).length + '개 페이지' + (p.outfits && p.outfits.length > 1 ? ' · 착장 ' + p.outfits.length + '가지 추정' : '') + '</span></div><div class="pp">' +
      p.items.map(function (f) { return '<div class="face' + (f.flag ? ' flag' : '') + '" data-pg="' + f.page + '"><img src="' + f.thumb + '" alt=""><div>' + esc(pl(f.page)) + '</div></div>'; }).join('') + '</div></div>';
  }).join('') + '</div><div class="note">보라색 테두리는 의견이 있는 사진이에요. 같은 사람이 둘로 나뉘거나 다른 사람이 섞일 수 있어요(의심). 멤버별 사진 수 표와 이름 매칭은 2단계에서 이 묶음을 이용해요.</div></div>';
}
function infoCard() {
  if (R.isImg) return '<div class="card"><h3>이미지 정보</h3><table class="tbl"><tr><th>파일</th><th>크기</th><th>색</th><th>프로파일</th><th>해상도</th><th>용량</th></tr>' + R.pages.map(function (P) { var I = P.img; return '<tr><td>' + esc(P.file) + '</td><td>' + I.w + '×' + I.h + 'px</td><td>' + (I.comps === 4 ? 'CMYK' : I.comps === 1 ? '흑백' : 'RGB') + (I.alpha ? ' · 투명' : '') + '</td><td>' + esc(I.icc || '-') + '</td><td>' + (I.sizeSrc === 'spec' ? Math.round(Math.min(I.w / (I.mmW / 25.4), I.h / (I.mmH / 25.4))) + 'ppi (사양 크기)' : I.dpi ? I.dpi + 'dpi' : '-') + '</td><td>' + kb(I.bytes) + '</td></tr>'; }).join('') + '</table></div>';
  var h = '<div class="card"><h3>파일 정보</h3><div class="kv">';
  h += '<span>서체</span><div>' + (R.fonts.length ? R.fonts.slice(0, 30).map(function (f) { return esc(f.name) + (f.embedded ? '' : ' <b class="err-t">미포함</b>'); }).join(', ') : '없음 (아웃라인 됨)') + '</div>';
  var sp = {}; R.pages.forEach(function (P) { for (var s in P.spots) sp[s] = 1; });
  h += '<span>별색</span><div>' + (Object.keys(sp).map(esc).join(', ') || '없음') + '</div>';
  var lay = {}; R.pages.forEach(function (P) { P.fills.concat(P.strokes, P.texts, P.images).forEach(function (o) { if (o.layer) lay[o.layer] = 1; }); });
  h += '<span>레이어</span><div>' + (Object.keys(lay).map(esc).join(', ') || 'PDF에 레이어 정보 없음') + '</div>';
  h += '<span>이미지</span><div>' + R.pages.reduce(function (a, P) { return a + P.images.length; }, 0) + '개 배치 · ' + (R.WO.bind !== 'none' ? '제본 안쪽 위험 구역 ' + R.gz + 'mm' : '제본 없음') + '</div>';
  return h + '</div></div>';
}
function pagesCard() {
  var cnt = {}; R.issues.forEach(function (x) { if (x.page === null || x.page === undefined || x.code === 'dieinfo') return; var c = cnt[x.page] = cnt[x.page] || { err: 0, warn: 0, adv: 0, info: 0 }; c[x.sev]++; });
  var P = R.pages.filter(function (p) { return !UI.onlyBad || (cnt[p.i] && (cnt[p.i].err + cnt[p.i].warn + cnt[p.i].adv)); });
  var h = '<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="margin:0">' + (R.isImg ? '이미지별 보기' : '페이지별 보기') + '</h3><label class="tgl noprint"><input type="checkbox" id="onlyBad"' + (UI.onlyBad ? ' checked' : '') + '>문제 있는 페이지만</label></div><div class="pgrid">';
  h += P.map(function (p) { var c = cnt[p.i] || {}; return '<div class="pc" data-pg="' + p.i + '"><div class="th"><img src="' + p.thumb + '" alt="" loading="lazy">' + overlaySVG(p, p.tw, p.th, false) + '</div><div class="pm"><span>' + esc(pl(p.i)) + (p.spread ? ' <span class="mute">(펼침 ' + p.lp.join('-') + ')</span>' : '') + '</span><span class="cnt">' + (c.err ? '<i class="e">' + c.err + '</i>' : '') + (c.warn ? '<i class="w">' + c.warn + '</i>' : '') + (c.adv ? '<i class="a">' + c.adv + '</i>' : '') + '</span></div></div>'; }).join('');
  if (!P.length) h += '<div class="sub">문제 있는 ' + (R.isImg ? '이미지' : '페이지') + '가 없어요.</div>';
  return h + '</div></div>';
}
// 마커 SVG (썸네일/뷰어 공용, w×h 좌표계)
function overlaySVG(P, w, h, full, only, hi) {
  var k = w / P.cw, s = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">';
  function rc(b, st) { var r = toPx(P, b); return '<rect x="' + (r[0] * k).toFixed(1) + '" y="' + (r[1] * k).toFixed(1) + '" width="' + Math.max(1, (r[2] - r[0]) * k).toFixed(1) + '" height="' + Math.max(1, (r[3] - r[1]) * k).toFixed(1) + '" ' + st + '/>'; }
  var T = P.trim, sf = SET.safe * MM, sw = full ? 1.5 : 1;
  if (full) {
    if (P.bleed) s += rc(P.bleed, 'fill="none" stroke="#8b95a1" stroke-dasharray="4 3" stroke-width="1"');
    s += rc(T, 'fill="none" stroke="#3182f6" stroke-width="1"');
    // 안전 여백 띠 (빨강)
    s += '<path fill="rgba(239,68,68,.13)" fill-rule="evenodd" d="' + rp(T) + rp([T[0] + sf, T[1] + sf, T[2] - sf, T[3] - sf]) + '"/>';
  }
  (P.zones || []).forEach(function (z) { s += rc(z.b, 'fill="rgba(245,158,11,' + (full ? '.18' : '.12') + ')" stroke="none"'); });
  function rp(b) { var r = toPx(P, b); return 'M' + (r[0] * k) + ' ' + (r[1] * k) + 'H' + (r[2] * k) + 'V' + (r[3] * k) + 'H' + (r[0] * k) + 'Z'; }
  var col = { err: '#e0263a', warn: '#ff7300', adv: '#8b71d0', info: '#8b95a1' }, n = 0;
  R.issues.forEach(function (x) {
    if (x.page !== P.i || !x.boxes.length) return; if (only && only !== x.id) return;
    n++; var c = col[x.sev], dim = hi && hi !== x.id ? ' opacity=".18"' : '', ww = hi === x.id ? sw * 2 : sw;
    x.boxes.slice(0, 60).forEach(function (b, bi) { if (b && b.b) b = b.b; s += rc(pad(b, 1.5), 'fill="' + c + '" fill-opacity="' + (hi === x.id ? '.22' : '.10') + '" stroke="' + c + '" stroke-width="' + ww + '" data-i="' + x.id + '"' + dim); });
    if (full) { var r = toPx(P, x.boxes[0].b || x.boxes[0]); s += '<g data-i="' + x.id + '"' + dim + '><circle cx="' + (r[0] * k) + '" cy="' + (r[1] * k) + '" r="9" fill="' + c + '"/><text x="' + (r[0] * k) + '" y="' + (r[1] * k + 3.5) + '" font-size="10" font-weight="800" text-anchor="middle" fill="#fff">' + x.id + '</text></g>'; }
  });
  return s + '</svg>';
}
// 디자인 규칙 비교 (이 페이지 vs 기준 페이지)
function compareHTML(x) { return '<div class="cmp row" style="gap:10px;margin-top:8px" data-a="' + x.page + '" data-b="' + x.ref + '" data-bx="' + x.refBox.join(',') + '"><div class="small sub" style="width:100%">왼쪽 ' + esc(pl(x.page)) + '(이 페이지) · 오른쪽 ' + esc(pl(x.ref)) + '(기준)</div></div>'; }
function drawCompare(el) {
  var A = R.pages[+el.dataset.a], B = R.pages[+el.dataset.b], bx = el.dataset.bx.split(',').map(Number);
  [A, B].forEach(function (P) {
    var img = new Image(); img.onload = function () {
      var r = toPx(P, pad(bx, 6 * MM)), k = P.tw / P.cw; r = r.map(function (v) { return v * k; });
      var c = document.createElement('canvas'), w = r[2] - r[0], h = r[3] - r[1], s = Math.min(1, 220 / Math.max(w, h)) * 1.6; c.width = w * s; c.height = h * s;
      c.style.cssText = 'width:' + (c.width / 1.6) + 'px;border-radius:8px;border:1px solid var(--line);cursor:pointer';
      c.getContext('2d').drawImage(img, r[0], r[1], w, h, 0, 0, c.width, c.height); c.onclick = function () { openViewer(P.i); };
      el.appendChild(c);
    }; img.src = P.thumb;
  });
}

// ── 크게 보기 ──
var V = { p: 0, zoom: false, hi: null };
function openViewer(pi, iss) { V.p = pi; V.hi = iss; $('#ov').classList.add('open'); document.body.style.overflow = 'hidden'; drawViewer(); }
function closeViewer() { $('#ov').classList.remove('open'); document.body.style.overflow = ''; }
function drawViewer() {
  var P = R.pages[V.p]; $('#vT').textContent = pl(P.i) + (P.spread ? ' (펼침 ' + P.lp.join('-') + '쪽)' : P.lp[0] !== P.i + 1 ? ' (책 ' + P.lp[0] + '쪽)' : '') + ' / ' + R.n;
  var st = $('#stage'), vc = $('#vc'), aw = vc.clientWidth - 24, ah = vc.clientHeight - 24, ratio = P.cw / P.ch;
  var w = V.zoom ? Math.max(aw, 1400) : Math.min(aw, ah * ratio); st.style.width = w + 'px';
  st.innerHTML = '<img src="' + P.thumb + '" style="width:100%;display:block" alt="">' + overlaySVG(P, P.tw, P.th, true, null, V.hi);
  if (V.zoom && R.pdfHi !== V.p) {} // 썸네일 해상도로 충분 (최대 1100px)
  var I = R.issues.filter(function (x) { return x.page === P.i; }).sort(function (a, b) { return sevO(a) - sevO(b); });
  var h = '<div class="leg"><span><i style="background:rgba(239,68,68,.25)"></i>재단선 안쪽 ' + SET.safe + 'mm</span><span><i style="border:1px solid #3182f6"></i>재단선</span><span><i style="border:1px dashed #8b95a1"></i>도련</span>' + (P.zones && P.zones.length ? '<span><i style="background:rgba(245,158,11,.3)"></i>제본 안쪽 ' + R.gz + 'mm</span>' : '') + '</div>';
  h += I.length ? I.map(function (x) { return '<div class="iss" data-hi="' + x.id + '"><div class="ih"><span class="num ' + (isTypo(x) ? '' : ({ err: '', warn: 'w', adv: 'a', info: 'i' })[x.sev]) + '">' + x.id + '</span><div class="t"><b>' + esc(x.title) + '</b>' + (x.sus ? '<span class="sus">의심</span>' : '') + '<div class="d">' + rich(x.detail) + '</div>' + (x.fix ? '<div class="fx">→ ' + rich(x.fix) + '</div>' : '') + (x.ref != null ? compareHTML(x) : '') + '</div></div></div>'; }).join('') : '<div class="sub">이 페이지에서 찾은 문제가 없어요.</div>';
  $('#vl').innerHTML = h;
  $$('#vl .cmp').forEach(drawCompare);
  $$('#vl [data-hi]').forEach(function (d) { d.classList.toggle('on', +d.dataset.hi === V.hi); d.onclick = function () { V.hi = V.hi === +d.dataset.hi ? null : +d.dataset.hi; drawViewer(); }; });
  if (V.hi) setTimeout(function () { hilite(V.hi); }, 60);
}
function hilite(id) {
  $$('#stage [data-i]').forEach(function (e) { e.classList.remove('hl'); });
  var els = $$('#stage [data-i="' + id + '"]'); els.forEach(function (e) { e.classList.add('hl'); });
  if (els[0] && els[0].getBoundingClientRect) { var r = els[0].getBoundingClientRect(), vc = $('#vc'), vr = vc.getBoundingClientRect(); vc.scrollBy({ top: r.top - vr.top - vr.height / 3, left: r.left - vr.left - vr.width / 3, behavior: 'smooth' }); }
}
$('#vX').onclick = closeViewer; $('#ov').onclick = function (e) { if (e.target === $('#ov')) closeViewer(); };
$('#vPrev').onclick = function () { if (V.p > 0) { V.p--; V.hi = null; drawViewer(); } };
$('#vNext').onclick = function () { if (V.p < (VR || R).n - 1) { V.p++; V.hi = null; drawViewer(); } };
$('#vZoom').onclick = function () { V.zoom = !V.zoom; $('#vZoom').textContent = V.zoom ? '맞춤' : '확대'; drawViewer(); };
window.addEventListener('resize', function () { if ($('#ov').classList.contains('open')) drawViewer(); });
document.addEventListener('keydown', function (e) { if (!$('#ov').classList.contains('open')) return; if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowLeft') $('#vPrev').click(); if (e.key === 'ArrowRight') $('#vNext').click(); });

function avgPx(P, b) { var r = toPx(P, b), s = [0, 0, 0], n = 0; for (var y = r[1]; y < r[3]; y += 2) for (var x = r[0]; x < r[2]; x += 2) { var p = pix(P, x, y); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++; } return n ? [s[0] / n, s[1] / n, s[2] / n] : null; }
function toPxVp(vp, b) { var a = vp.convertToViewportPoint(b[0], b[1]), c = vp.convertToViewportPoint(b[2], b[3]); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])]; }
// 화면(보고서·크게 보기)은 VR, 검사는 R — 여러 파일 검사 중에도 끝난 결과를 볼 수 있게 화면 함수만 VR로 잠깐 바꿔 씀
var VR = null;
function withV(fn) { return function () { var o = R; R = VR || R; try { return fn.apply(this, arguments); } finally { R = o; } }; }
renderReport = withV(renderReport); renderTab = withV(renderTab); openViewer = withV(openViewer); drawViewer = withV(drawViewer); drawCompare = withV(drawCompare);
setupUI();
if (window.RV2) RV2.attach({ issue: issue, MM: MM, mm: mm, toPx: toPx, toPxVp: toPxVp, overlaps: overlaps, esc: esc, tick: tick, avgPx: avgPx, R: function () { return R; } });
window.PLYSH_REVIEW = {
  analyzePdf: analyzePdf, analyzeImages: analyzeImages, prog: prog, SET: SET, KIND_LABEL: KIND_LABEL, esc: esc, pl: function (r, i) { var o = R; R = r; var s = pl(i); R = o; return s; },
  show: function (r) { VR = r; UI.tab = 'all'; if (!r || r.fatal) { $('#rep').hidden = true; return; } renderReport(); },
  view: function (r, pg, iss) { VR = r; openViewer(pg, iss || null); },
  abort: function (v) { ABORT = !!v; }, toPx: function (P, b) { return toPx(P, b); },
  get R() { return R; }
};
})();
