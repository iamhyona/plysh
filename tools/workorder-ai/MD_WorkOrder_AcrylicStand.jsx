// MD 상품 작업지시서 포맷 v2 — 품목별 대지 (PLYSH 디자인4팀)
// 왼쪽 = 정보 (일반 글자, 표 · 글상자 없음) / 오른쪽 = 디자인 1:1 자리.
// 글자 크기는 품목 크기에 따라 단계별 HYONA_ 문자 스타일 (XS · S · M · L · XL). 스타일 크기만 바꾸면 한 번에 조절됨.
#target illustrator
(function(){var E={"acrStand_0.svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"140\" viewBox=\"0 0 200 140\" role=\"img\" font-family=\"Pretendard\"><path d=\"M30 16 C30 8 90 8 90 16 L96 96 H74 V108 H46 V96 H24Z\" fill=\"none\" stroke=\"#E60012\"/><path d=\"M34 20 C34 13 86 13 86 20 L90 92 H30Z\" stroke=\"#2B2F36\" stroke-width=\"1.2\" fill=\"#FFFFFF\"/><rect x=\"112\" y=\"84\" width=\"72\" height=\"30\" rx=\"3\" fill=\"none\" stroke=\"#E60012\"/><rect x=\"134\" y=\"96\" width=\"28\" height=\"4\" fill=\"none\" stroke=\"#E60012\" stroke-dasharray=\"2 1\"/><text x=\"60\" y=\"56\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">본체</text><text x=\"148\" y=\"92\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">받침 · 홈</text><text x=\"60\" y=\"118\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">탭</text><g stroke=\"#E4007F\" stroke-width=\"0.8\" fill=\"none\"><path d=\"M24 127V133M96 127V133M24 130H96\"/></g><text x=\"60\" y=\"127\" fill=\"#E4007F\" font-size=\"7\" text-anchor=\"middle\">본체 가로</text><g stroke=\"#E4007F\" stroke-width=\"0.8\" fill=\"none\"><path d=\"M112 125V131M184 125V131M112 128H184\"/></g><text x=\"148\" y=\"125\" fill=\"#E4007F\" font-size=\"7\" text-anchor=\"middle\">받침 가로</text></svg>","acrStand_1.svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"140\" viewBox=\"0 0 200 140\" role=\"img\" font-family=\"Pretendard\"><ellipse cx=\"100\" cy=\"112\" rx=\"56\" ry=\"12\" stroke=\"#2B2F36\" stroke-width=\"1.2\" fill=\"#FFFFFF\"/><path d=\"M70 20 C70 10 130 10 130 20 L134 108 H66Z\" stroke=\"#2B2F36\" stroke-width=\"1.2\" fill=\"#FFFFFF\"/><path d=\"M88 108 v6 h24 v-6\" fill=\"none\" stroke=\"#2B2F36\"/><text x=\"100\" y=\"60\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">본체</text><text x=\"100\" y=\"132\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">탭을 받침 홈에 꽂음</text><g stroke=\"#E4007F\" stroke-width=\"0.8\" fill=\"none\"><path d=\"M147 10H153M147 108H153M150 10V108\"/></g><text x=\"154\" y=\"61.5\" fill=\"#E4007F\" font-size=\"7\">전체 높이</text></svg>"};var fp=Folder(File($.fileName).parent+"/MD_WorkOrder_Format");if(!fp.exists)fp.create();var fd=Folder(File($.fileName).parent+"/MD_WorkOrder_Format/svg");if(!fd.exists)fd.create();for(var k in E){var f=File(fd+"/"+k);f.encoding="UTF-8";f.open("w");f.write(E[k]);f.close();}})();
(function () {
var DATA = [{"D":150,"k":"acrStand","n":"아크릴 스탠드","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"전개도","note":"본체 + 받침 한 판","f":"acrStand_0.svg"},{"t":"조립도","note":"","f":"acrStand_1.svg"}],"vs":[["본체","____T · 인쇄면 ____"],["받침","____T · 인쇄 유무"],["탭 · 홈","업체 템플릿 값"]],"mat":["투명","유백 (반투명)","글리터","홀로그램","미러"],"det":[["본체 두께",["3T","5T","____T"]],["받침 두께",["3T","5T"]],["인쇄면",["앞","뒤","양면"]],["화이트",["전체","부분","없음"]]],"proc":["UV 인쇄","레이저 커팅","받침 인쇄","보호 필름"],"col":["CMYK","화이트 판"],"dims":["본체 가로 · 세로","받침 가로 · 세로","탭 폭 (본체 1/3↑)","탭 높이","홈 폭 (두께 + 0.1~0.2)","홈 길이 (탭 + 0.2~0.5)","전체 높이"],"acc":[["받침",["일체형 (끼움)","별도 받침 판","받침 없음"]]],"pack":["OPP 개별","본체 · 받침 분리 포장","조립 안내 카드"],"warn":["본체 긴 변 50mm 이상 (작으면 흔들림)","탭 · 홈은 업체 템플릿 그대로","받침에 묻히는 높이는 디자인 비움","디오라마는 판 사이 5mm 이상"],"chk":["종류 · 크기 · 두께 · 수량","인쇄면 · 화이트 범위","탭 · 홈 = 업체 템플릿","조립도로 앞뒤 · 겹침 확인"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}}];
var MM = 2.834645669;
var HERE = Folder(File($.fileName).parent + "/MD_WorkOrder_Format"); if (!HERE.exists) HERE.create();
var OUTNAME = '[PLYSH]MDWorkOrder_AcrylicStand(261123)_v2';
var NOTE = [];
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
var doc = app.documents.add(DocumentColorSpace.CMYK, 420 * MM, 297 * MM);
var LBOX = doc.layers[0]; LBOX.name = 'info box'; var LINFO = doc.layers.add(); LINFO.name = 'info'; var LDES = doc.layers.add(); LDES.name = 'design'; var CT = LDES, CTI = LINFO, CTB = LBOX;

/* ── 별색 ── */
function spot(name, c, m, y, k) {
  var s; try { s = doc.spots.getByName(name); } catch (e) { s = doc.spots.add(); s.name = name; }
  var cc = new CMYKColor(); cc.cyan = c; cc.magenta = m; cc.yellow = y; cc.black = k;
  s.color = cc; s.colorType = ColorModel.SPOT;
  var sc = new SpotColor(); sc.spot = s; sc.tint = 100; return sc;
}
var C_LEN = spot('HYONA_Length', 0, 100, 0, 0);
var C_FOLD = spot('HYONA_Fold', 100, 0, 0, 0);
var C_MAR = spot('HYONA_Margin', 100, 0, 100, 0);
var C_CUT = spot('HYONA_Cut', 0, 100, 100, 0);
var C_TXT = spot('HYONA_Text', 0, 0, 0, 100);
var C_CHIP = spot('HYONA_ChipLine', 0, 0, 0, 40);
var C_REQ = spot('HYONA_Required', 0, 90, 80, 0);
function tint(sc, t) { var n = new SpotColor(); n.spot = sc.spot; n.tint = t; return n; }
var C_MUTE = tint(C_TXT, 55);

/* ── 문자 스타일 (단계별) ── */
function font(names) { for (var i = 0; i < names.length; i++) { try { return app.textFonts.getByName(names[i]); } catch (e) {} } NOTE.push('폰트 없음: ' + names[0]); return null; }
var F_R = font(['Pretendard-Regular', 'PretendardVariable-Regular', 'AppleSDGothicNeo-Regular']);
var F_B = font(['Pretendard-Bold', 'PretendardVariable-Bold', 'AppleSDGothicNeo-Bold']);
var F_XB = font(['Pretendard-ExtraBold', 'Pretendard-Bold', 'AppleSDGothicNeo-ExtraBold']) || F_B;
var F_S = font(['Pretendard-SemiBold', 'Pretendard-Bold', 'AppleSDGothicNeo-SemiBold']) || F_B;
function cstyle(name, f, size, color) {
  var st; try { st = doc.characterStyles.getByName(name); } catch (e) { st = doc.characterStyles.add(name); }
  var a = st.characterAttributes;
  if (f) a.textFont = f; a.size = size; a.tracking = -15;
  try { a.kerningMethod = AutoKernType.OPTICAL; } catch (e1) {}
  a.autoLeading = false; a.leading = size * 2.0; a.fillColor = color; return st;
}
// 기준 = 실장님 수정본 (아크릴 스탠드, 본문 25pt). 다른 단계는 본문 크기 비율로 전부 같이 커지고 작아짐.
var TIERS = {}, TB = { XS: 18, S: 25, M: 32, L: 42, XL: 60 };
function tierOf(D) { return D <= 60 ? 'XS' : D <= 150 ? 'S' : D <= 300 ? 'M' : D <= 700 ? 'L' : 'XL'; }
function st2(name, f, size, color, ld, trk) { var s = cstyle(name, f, size, color); var a = s.characterAttributes; a.leading = ld; a.tracking = trk; return s; }
function styles(t) {
  if (TIERS[t]) return TIERS[t];
  var b = TB[t], k = b / 25, p = 'HYONA_' + t + '_', L = 42 * k;
  return TIERS[t] = {
    b: b, k: k,
    title: st2(p + 'Title', F_B, 90 * k, C_TXT, 93 * k, -15),
    writer: st2(p + 'Writer', F_R, 60 * k, C_TXT, 93 * k, -15),
    eye: st2(p + 'Eyebrow', F_XB, 40 * k, C_TXT, L, -25),
    item: st2(p + 'Item', F_B, 70 * k, C_TXT, 100 * k, -15),
    sec: st2(p + 'Section', F_XB, 40 * k, C_TXT, 56 * k, -25),
    req: st2(p + 'Req', F_XB, 40 * k, C_REQ, 56 * k, -25),
    opt: st2(p + 'Opt', F_XB, 40 * k, C_MUTE, 56 * k, -25),
    rule: st2(p + 'Rule', F_R, b, tint(C_TXT, 30), 84 * k, -60),
    label: st2(p + 'Label', F_B, b, C_TXT, L, -25),
    body: st2(p + 'Body', F_R, b, C_TXT, L, -25),
    hint: st2(p + 'Hint', F_R, b, C_MUTE, L, -25),
    chip: st2(p + 'Chip', F_R, b, tint(C_CHIP, 60), L, -25),
    box: st2(p + 'Box', F_R, b, C_TXT, L, -25),
    dim: opFill(st2(p + 'Dim', F_R, b * 46 / 25, C_LEN, b * 92 / 25, -15)),
    view: st2(p + 'View', F_B, b * 46 / 25, C_TXT, b * 92 / 25, -15),
    vhint: st2(p + 'ViewHint', F_R, b * 40.5 / 25, C_MUTE, b * 81 / 25, -15)
  };
}

/* ── 좌표 (mm, 원점 = 현재 대지 왼쪽 위) ── */
var OX = 0, OY = 0;
function px(x) { return OX + x * MM; } function py(y) { return OY - y * MM; }
var BOXST = null;
function ptext(x, y, s, st, just) {
  var t = CT.textFrames.pointText([px(x), py(y)]); t.contents = s; st.applyTo(t.textRange, true);
  try { var ca = st.characterAttributes, ta = t.textRange.characterAttributes; if (ca.textFont) ta.textFont = ca.textFont; ta.size = ca.size; ta.autoLeading = false; ta.leading = ca.leading; ta.fillColor = ca.fillColor; ta.tracking = ca.tracking; } catch (eF) {}
  if (BOXST && s.indexOf('\u25A1') >= 0) { for (var ci = 0; ci < s.length; ci++) if (s.charAt(ci) == '\u25A1') BOXST.applyTo(t.textRange.characters[ci], true); }
  if (just) t.textRange.paragraphAttributes.justification = just; return t;
}
function line(x1, y1, x2, y2, col, sw, dash) {
  var p = CT.pathItems.add(); p.setEntirePath([[px(x1), py(y1)], [px(x2), py(y2)]]);
  p.filled = false; p.stroked = true; p.strokeColor = col; p.strokeWidth = sw; if (dash) p.strokeDashes = dash; return p;
}
// 글자 폭 대략 (em): 한글 0.92 · 그 밖 0.55
function emw(s) { var w = 0; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); w += (c >= 0x1100) ? 0.92 : 0.55; } return w; }
// 선택지 줄바꿈: 항목 단위로 maxEm 안에서 끊기
function wrapOpts(items, maxEm, box) {
  var lines = [], cur = '', sep = '    ';
  for (var i = 0; i < items.length; i++) {
    var it = (box ? '□ ' : '') + items[i];
    var nx = cur ? cur + sep + it : it;
    if (cur && emw(nx) > maxEm) { lines.push(cur); cur = it; } else cur = nx;
  }
  if (cur) lines.push(cur); return lines;
}
function wrapText(s, maxEm) {
  var words = String(s).split(' '), lines = [], cur = '';
  for (var i = 0; i < words.length; i++) { var nx = cur ? cur + ' ' + words[i] : words[i]; if (cur && emw(nx) > maxEm) { lines.push(cur); cur = words[i]; } else cur = nx; }
  if (cur) lines.push(cur); return lines;
}
function blanks(s) { return String(s).replace(/____/g, '________'); }

function setSt(rng, st) { st.applyTo(rng, true); try { var ca = st.characterAttributes, ta = rng.characterAttributes; if (ca.textFont) ta.textFont = ca.textFont; ta.size = ca.size; ta.autoLeading = false; ta.leading = ca.leading; ta.fillColor = ca.fillColor; ta.tracking = ca.tracking; } catch (e) {} }
function lead(st, l) { st.characterAttributes.leading = l; return st; }
function opFill(st) { try { st.characterAttributes.overprintFill = true; } catch (e) {} return st; }

/* SVG 도면 → 별색 · 글자 스타일 */
function mapCol(c) {
  if (!c || c.typename != 'CMYKColor') return null;
  if (c.magenta > 70 && c.yellow > 70 && c.cyan < 30) return C_CUT;
  if (c.magenta > 70 && c.yellow < 40 && c.cyan < 30) return C_LEN;
  if (c.cyan > 60 && c.yellow > 60 && c.magenta < 30) return C_MAR;
  if (c.cyan > 60 && c.magenta < 30 && c.yellow < 30) return C_FOLD;
  return null;
}
function recolor(it, S, k, kd) {
  if (it.typename == 'GroupItem') { for (var i = it.pageItems.length - 1; i >= 0; i--) recolor(it.pageItems[i], S, k, kd); return; }
  if (it.typename == 'CompoundPathItem') { for (var j = 0; j < it.pathItems.length; j++) recolor(it.pathItems[j], S, k, kd); return; }
  if (it.typename == 'PathItem') {
    if (it.stroked) { it.strokeWidth = it.strokeWidth * k; var m = mapCol(it.strokeColor); if (m) { it.strokeColor = m; it.strokeOverprint = true; } }
    if (it.filled) { var mf = mapCol(it.fillColor); if (mf) { it.fillColor = mf; it.fillOverprint = true; } }
    if (it.strokeDashes && it.strokeDashes.length) { var d = it.strokeDashes, nd = []; for (var q = 0; q < d.length; q++) nd.push(d[q] * kd); it.strokeDashes = nd; }
  }
  if (it.typename == 'TextFrame') {
    var fc = null; try { fc = it.textRange.characterAttributes.fillColor; } catch (e) {}
    var m2 = mapCol(fc); var cx = it.left + it.width / 2, cy = it.top;
    setSt(it.textRange, m2 == C_LEN ? S.dim : S.vhint);
    if (m2 && m2 != C_LEN) it.textRange.characterAttributes.fillColor = m2;
    if (m2) it.textRange.characterAttributes.overprintFill = true;
    it.left = cx - it.width / 2; it.top = cy;
  }
}
function placeSvg(f, x, y, w, S) {
  var file = File(HERE + '/svg/' + f);
  if (!file.exists) { NOTE.push('도면 파일 없음: ' + f); return 0; }
  var g = CT.groupItems.createFromFile(file);
  var w0 = g.width, sc = w * MM / w0 * 100; g.resize(sc, sc, true, true, true, true, sc);
  g.left = px(x); g.top = py(y);
  // 선 굵기는 크기에 비례하되 너무 굵지 않게
  var f = Math.max(1, Math.min(4, w / 200)); recolor(g, S, f / (w / 200), f);
  return g.height / MM;
}

/* ── 품목 하나 ── */
function item(d, ox, oy) {
  OX = ox; OY = oy;
  CT = LDES.groupItems.add(); CT.name = d.k; CTI = LINFO.groupItems.add(); CTI.name = d.k; CTB = LBOX.groupItems.add(); CTB.name = d.k;
  var D = d.D, t = tierOf(D), S = styles(t), b = S.b, k = S.k, U = b * 0.3528; // U = 본문 1em (mm)
  BOXST = S.box;
  var M = 59 * k, PAD = 40 * k, maxEm = 40;
  function tabsFor(min, list) { var e = 0; for (var i = 0; i < list.length; i++) e = Math.max(e, emw(list[i])); return Math.max(min * k, (e * 0.8 + 0.8) * U); }

  // 머리: [아티스트] 프로젝트 이름 / 작성자 이름 · 연락처 (글자 하나, 두 단락)
  var hd = CTI.textFrames.pointText([px(M), py(M)]); hd.contents = '[아티스트] 프로젝트 이름\r작성자 이름 · 연락처'; hd.name = '머리';
  setSt(hd.paragraphs[0], S.title); setSt(hd.paragraphs[1], S.writer);
  hd.top = py(M); hd.left = px(M);
  var boxTop = M + hd.height / MM + 43 * k;

  // 정보: 글자 하나, 엔터로 나눈 단락
  var P = [], IND = 30 * k, RULE = ''; for (var rr = 0; rr < 34; rr++) RULE += '\u2014'; // 구분 줄 = 엠대시 34개 (자간 -60)
  function para(text, st, o) { o = o || {}; o.text = text; o.st = st; P.push(o); }
  function sec(name, tag, tagSt) { para(RULE, S.rule, { noInd: true }); para(name + (tag ? '    ' + tag : ''), S.sec, { tag: tag, tagSt: tagSt, isSec: true, noInd: true }); }
  function lv(x) { return x == 'r' ? ['필수', S.req] : ['권장', S.opt]; }
  function secR(name, x) { var a = lv(x); sec(name, a[0], a[1]); }
  function opts(arr) { var ls = wrapOpts(arr, maxEm, true); for (var i = 0; i < ls.length; i++) para(blanks(ls[i]), S.body); }
  function sub(rows) {
    var names = []; for (var n = 0; n < rows.length; n++) names.push(rows[n][0]);
    var tw = tabsFor(63.9, names) * MM;
    for (var i = 0; i < rows.length; i++) {
      var ls = wrapOpts(rows[i][1], maxEm - 7, true);
      for (var j = 0; j < ls.length; j++) para((j ? '' : rows[i][0]) + '\t' + blanks(ls[j]), S.body, { tabs: [[tw, 'L']], label: !j });
    }
  }
  para('품목', S.eye, { noInd: true });
  para(d.n, S.item, { noInd: true });
  sec('가이드별색', '필수', S.req);
  var lg = [['——', C_LEN, '길이'], ['——', C_FOLD, '접지'], ['- - -', C_MAR, '여백 · 안전'], ['——', C_CUT, '재단 · 칼선']];
  for (var g = 0; g < lg.length; g++) para(lg[g][0] + '\t' + lg[g][2], S.body, { lineCol: lg[g][1], tabs: [[24.1 * k * MM, 'L']] });
  var hasNet = false; for (var z = 0; z < d.views.length; z++) if (d.views[z].t == '전개도') hasNet = true;
  para((hasNet ? '전개도는 조립도와 함께 · ' : '') + '치수 0.5 올림 · 가이드 · 후가공 별색 오버프린트', S.hint);
  secR('소재', d.R['소재']); opts(d.mat);
  secR('소재 세부', d.R['소재 세부']); sub(d.det);
  secR('인쇄 · 가공', d.R['인쇄 · 가공']); opts(d.proc);
  secR('컬러', d.R['컬러 안내']);
  var CL = ['PANTONE 231C (백그라운드 판)', 'PANTONE C ()', 'PANTONE C ()'];
  for (var c = 0; c < 3; c++) para('●\t' + CL[c], S.body, { chip: true, tabs: [[17 * k * MM, 'L']] });
  secR('치수 (정수 mm)', d.R['치수']);
  var dtw = tabsFor(95, d.dims) * MM;
  for (var di = 0; di < d.dims.length; di++) para(d.dims[di] + '\tmm', S.body, { tabs: [[dtw, 'L']] });
  secR('부자재', d.R['부자재']); sub(d.acc);
  secR('포장', 'o'); opts(d.pack);
  sec('발주 전 확인');
  for (var q = 0; q < d.chk.length; q++) para('□\t' + d.chk[q], S.body, { tabs: [[11.4 * k * MM, 'L']] });
  sec('작성 주의사항', '필독 읽고 삭제', S.req);
  for (var w = 0; w < d.warn.length; w++) { var wl = wrapText(d.warn[w], maxEm - 2); for (var kk = 0; kk < wl.length; kk++) para((kk ? '' : '•') + '\t' + wl[kk], S.body, { tabs: [[9.9 * k * MM, 'L']] }); }

  var all = []; for (var pi = 0; pi < P.length; pi++) all.push(P[pi].text);
  var tf = CTI.textFrames.pointText([px(M + PAD), py(boxTop + PAD)]); tf.contents = all.join('\r'); tf.name = '정보';
  S.body.applyTo(tf.textRange, true);
  var pars = tf.paragraphs;
  if (pars.length != P.length) NOTE.push(d.n + ': 단락 수 다름 ' + pars.length + '/' + P.length);
  for (var i2 = 0; i2 < P.length && i2 < pars.length; i2++) {
    var o = P[i2], pr = pars[i2], tx = o.text;
    setSt(pr, o.st);
    var pa = pr.paragraphAttributes;
    pa.spaceBefore = 0; pa.spaceAfter = o.isSec ? 12 * k : 0; // 앞 간격 없음 · 소제목만 뒤 간격, 나머지는 행간
    var ind = o.noInd ? 0 : IND; pa.leftIndent = ind; pa.firstLineIndent = 0;
    if (o.tabs) { var arr = []; for (var ti = 0; ti < o.tabs.length; ti++) { var ts = new TabStopInfo(); ts.position = o.tabs[ti][0] + ind; ts.alignment = TabStopAlignment.Left; arr.push(ts); } pa.tabStops = arr; }
    var tab = tx.indexOf('\t');
    try {
      if (o.label && tab > 0) for (var c1 = 0; c1 < tab; c1++) S.label.applyTo(pr.characters[c1], true);
      if (o.tag) { var tl = o.tag.length; for (var c3 = tx.length - tl; c3 < tx.length; c3++) o.tagSt.applyTo(pr.characters[c3], true); }
      if (o.chip) S.chip.applyTo(pr.characters[0], true);
      if (o.lineCol) for (var c4 = 0; c4 < tab; c4++) { var ch4 = pr.characters[c4]; S.label.applyTo(ch4, true); ch4.characterAttributes.fillColor = o.lineCol; ch4.characterAttributes.overprintFill = true; }
      for (var c5 = 0; c5 < tx.length; c5++) if (tx.charAt(c5) == '□') S.box.applyTo(pr.characters[c5], true);
    } catch (eS) { NOTE.push(d.n + ' 글자 스타일: ' + eS); }
  }
  tf.top = py(boxTop + PAD); tf.left = px(M + PAD);
  var boxW = Math.max(360 * k, tf.width / MM + PAD * 2), boxH = tf.height / MM + PAD * 2;
  var bx = CTB.pathItems.rectangle(py(boxTop), px(M), boxW * MM, boxH * MM);
  bx.name = '정보 바탕'; bx.stroked = false; bx.filled = true; bx.fillColor = tint(C_TXT, 5);
  var infoBottom = boxTop + boxH + M;

  // 오른쪽: 디자인 자리 (1:1)
  CTI = CT; // 도면 캡션은 design 레이어
  var dx = M + boxW + 150 * k, vy = boxTop + 23 * k, vw = D * 1.35, right = dx, viewBottom = 0, VL = S.view.characterAttributes.leading * 0.3528;
  var vx = dx;
  for (var v = 0; v < d.views.length; v++) {
    var V = d.views[v];
    var c1 = ptext(vx, vy, '디자인 ' + (v + 1) + ' · ' + V.t + (V.note ? '  (' + V.note + ')' : ''), S.view);
    var c2 = ptext(vx, vy + VL * 0.75, '실제 크기 1:1로 배치', S.vhint);
    var h = placeSvg(V.f, vx, vy + VL * 1.5, vw, S);
    if (vy + VL * 1.5 + h > viewBottom) viewBottom = vy + VL * 1.5 + h;
    var cw = Math.max(vw, c1.width / MM, c2.width / MM);
    right = Math.max(right, vx + cw); vx += cw + Math.max(80 * k, D * 0.5); // 디자인 사이 = 품목 크기의 50%
  }
  var c3 = ptext(dx, viewBottom + VL * 1.2, '디자인이 여러 개면 오른쪽 · 아래로 이어서 배치하고, 이 대지를 늘려 쓰기', S.vhint);
  right = Math.max(right, dx + c3.width / MM);
  var ROOM = Math.max(M * 1.5, D * 0.6); // 품목 크기 기준 여유
  var W = right + ROOM, H = Math.max(infoBottom, viewBottom + VL * 2 + ROOM);
  var ab = doc.artboards.add([px(0), py(0), px(W), py(H)]); ab.name = d.k;
  return [W, H, [CT, CTB, LINFO.groupItems.getByName(d.k)]];
}

// 배치: 한 줄에 5,000mm까지, 넘으면 다음 줄
var first = doc.artboards[0].artboardRect, cx = (first[0] + first[2]) / 2, cy = (first[1] + first[3]) / 2;
var X0 = cx - 2800 * MM, Y0 = cy + 2800 * MM, curX = 0, curY = 0, rowH = 0, GAPB = 60;
for (var i = 0; i < DATA.length; i++) {
  // 크기를 먼저 모르니 그려 보고, 줄을 넘치면 다음 줄로 옮김
  var sz = item(DATA[i], X0 + curX * MM, Y0 - curY * MM);
  if (curX > 0 && curX + sz[0] > 5000) {
    var abN = doc.artboards[doc.artboards.length - 1], rr = abN.artboardRect;
    var mdx = -curX * MM, mdy = -(rowH + GAPB) * MM;
    abN.artboardRect = [rr[0] + mdx, rr[1] + mdy, rr[2] + mdx, rr[3] + mdy];
    for (var gi = 0; gi < sz[2].length; gi++) sz[2][gi].translate(mdx, mdy);
    curY += rowH + GAPB; curX = 0; rowH = 0;
  }
  curX += sz[0] + GAPB; if (sz[1] > rowH) rowH = sz[1];
}
doc.artboards[0].remove();

var ai = new IllustratorSaveOptions(); ai.pdfCompatible = true; ai.compressed = true;
doc.saveAs(File(HERE + '/' + OUTNAME + '.ai'), ai);
var pdf = new PDFSaveOptions(); pdf.preserveEditability = false; pdf.viewAfterSaving = false;
doc.saveAs(File(HERE + '/' + OUTNAME + '.pdf'), pdf);
doc.saveAs(File(HERE + '/' + OUTNAME + '.ai'), ai);

var log = File(HERE + '/build_log.txt'); log.encoding = 'UTF-8'; log.open('w'); log.write('v2 done ' + DATA.length + '\n' + NOTE.join('\n')); log.close();
})();
