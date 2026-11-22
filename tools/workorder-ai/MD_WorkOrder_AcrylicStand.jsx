// MD 상품 작업지시서 포맷 v2 — 품목별 대지 (PLYSH 디자인4팀)
// 왼쪽 = 정보 (일반 글자, 표 · 글상자 없음) / 오른쪽 = 디자인 1:1 자리.
// 글자 크기는 품목 크기에 따라 단계별 HYONA_ 문자 스타일 (XS · S · M · L · XL). 스타일 크기만 바꾸면 한 번에 조절됨.
#target illustrator
(function(){var E={"acrStand_0.svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"140\" viewBox=\"0 0 200 140\" role=\"img\" font-family=\"Pretendard\"><path d=\"M30 16 C30 8 90 8 90 16 L96 96 H74 V108 H46 V96 H24Z\" fill=\"none\" stroke=\"#E60012\"/><path d=\"M34 20 C34 13 86 13 86 20 L90 92 H30Z\" stroke=\"#2B2F36\" stroke-width=\"1.2\" fill=\"#FFFFFF\"/><rect x=\"112\" y=\"84\" width=\"72\" height=\"30\" rx=\"3\" fill=\"none\" stroke=\"#E60012\"/><rect x=\"134\" y=\"96\" width=\"28\" height=\"4\" fill=\"none\" stroke=\"#E60012\" stroke-dasharray=\"2 1\"/><text x=\"60\" y=\"56\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">본체</text><text x=\"148\" y=\"92\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">받침 · 홈</text><text x=\"60\" y=\"118\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">탭</text><g stroke=\"#E4007F\" stroke-width=\"0.8\" fill=\"none\"><path d=\"M24 127V133M96 127V133M24 130H96\"/></g><text x=\"60\" y=\"127\" fill=\"#E4007F\" font-size=\"7\" text-anchor=\"middle\">본체 가로</text><g stroke=\"#E4007F\" stroke-width=\"0.8\" fill=\"none\"><path d=\"M112 125V131M184 125V131M112 128H184\"/></g><text x=\"148\" y=\"125\" fill=\"#E4007F\" font-size=\"7\" text-anchor=\"middle\">받침 가로</text></svg>","acrStand_1.svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"140\" viewBox=\"0 0 200 140\" role=\"img\" font-family=\"Pretendard\"><ellipse cx=\"100\" cy=\"112\" rx=\"56\" ry=\"12\" stroke=\"#2B2F36\" stroke-width=\"1.2\" fill=\"#FFFFFF\"/><path d=\"M70 20 C70 10 130 10 130 20 L134 108 H66Z\" stroke=\"#2B2F36\" stroke-width=\"1.2\" fill=\"#FFFFFF\"/><path d=\"M88 108 v6 h24 v-6\" fill=\"none\" stroke=\"#2B2F36\"/><text x=\"100\" y=\"60\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">본체</text><text x=\"100\" y=\"132\" fill=\"#6E737A\" font-size=\"6.5\" text-anchor=\"middle\">탭을 받침 홈에 꽂음</text><g stroke=\"#E4007F\" stroke-width=\"0.8\" fill=\"none\"><path d=\"M147 10H153M147 108H153M150 10V108\"/></g><text x=\"154\" y=\"61.5\" fill=\"#E4007F\" font-size=\"7\">전체 높이</text></svg>"};var fp=Folder(File($.fileName).parent+"/MD_WorkOrder_Format");if(!fp.exists)fp.create();var fd=Folder(File($.fileName).parent+"/MD_WorkOrder_Format/svg");if(!fd.exists)fd.create();for(var k in E){var f=File(fd+"/"+k);f.encoding="UTF-8";f.open("w");f.write(E[k]);f.close();}})();
(function () {
var DATA = [{"D":150,"k":"acrStand","n":"아크릴 스탠드","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"전개도","note":"본체 + 받침 한 판","f":"acrStand_0.svg"},{"t":"조립도","note":"","f":"acrStand_1.svg"}],"vs":[["본체","____T · 인쇄면 ____"],["받침","____T · 인쇄 유무"],["탭 · 홈","업체 템플릿 값"]],"mat":["투명","유백 (반투명)","글리터","홀로그램","미러"],"det":[["본체 두께",["3T","5T","____T"]],["받침 두께",["3T","5T"]],["인쇄면",["앞","뒤","양면"]],["화이트",["전체","부분","없음"]]],"proc":["UV 인쇄","레이저 커팅","받침 인쇄","보호 필름"],"col":["CMYK","화이트 판"],"dims":["본체 가로 · 세로","받침 가로 · 세로","탭 폭 (본체 1/3↑)","탭 높이","홈 폭 (두께 + 0.1~0.2)","홈 길이 (탭 + 0.2~0.5)","전체 높이"],"acc":[["받침",["일체형 (끼움)","별도 받침 판","받침 없음"]]],"pack":["OPP 개별","본체 · 받침 분리 포장","조립 안내 카드"],"warn":["본체 긴 변 50mm 이상 (작으면 흔들림)","탭 · 홈은 업체 템플릿 그대로","받침에 묻히는 높이는 디자인 비움","디오라마는 판 사이 5mm 이상"],"chk":["종류 · 크기 · 두께 · 수량","인쇄면 · 화이트 범위","탭 · 홈 = 업체 템플릿","조립도로 앞뒤 · 겹침 확인"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}}];
var MM = 2.834645669;
var HERE = Folder(File($.fileName).parent + "/MD_WorkOrder_Format"); if (!HERE.exists) HERE.create();
var OUTNAME = '[PLYSH]MDWorkOrder_AcrylicStand(261123)';
var NOTE = [];
app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
var doc = app.documents.add(DocumentColorSpace.CMYK, 420 * MM, 297 * MM);
var layer = doc.layers[0]; layer.name = 'HYONA_WorkOrder'; var CT = layer;

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
var F_S = font(['Pretendard-SemiBold', 'Pretendard-Bold', 'AppleSDGothicNeo-SemiBold']) || F_B;
function cstyle(name, f, size, color) {
  var st; try { st = doc.characterStyles.getByName(name); } catch (e) { st = doc.characterStyles.add(name); }
  var a = st.characterAttributes;
  if (f) a.textFont = f; a.size = size; a.tracking = -15;
  try { a.kerningMethod = AutoKernType.OPTICAL; } catch (e1) {}
  a.autoLeading = false; a.leading = size * 2.0; a.fillColor = color; return st;
}
var TIERS = {}, TB = { XS: 18, S: 26, M: 34, L: 46, XL: 70 }, TT = { XS: 36, S: 50, M: 66, L: 90, XL: 136 };
function tierOf(D) { return D <= 60 ? 'XS' : D <= 150 ? 'S' : D <= 300 ? 'M' : D <= 700 ? 'L' : 'XL'; }
function styles(t) {
  if (TIERS[t]) return TIERS[t];
  var b = TB[t], p = 'HYONA_' + t + '_';
  return TIERS[t] = {
    b: b,
    title: cstyle(p + 'Title', F_B, TT[t], C_TXT),
    item: lead(cstyle(p + 'Item', F_B, TT[t] * 0.8, C_TXT), TT[t] * 0.8 * 1.2),
    writer: lead(cstyle(p + 'Writer', F_R, b, C_TXT), b * 1.6),
    eye: cstyle(p + 'Eyebrow', F_R, b * 0.9, C_MUTE),
    sec: cstyle(p + 'Section', F_B, b * 1.45, C_TXT),
    label: cstyle(p + 'Label', F_B, b, C_TXT),
    body: cstyle(p + 'Body', F_R, b, C_TXT),
    hint: cstyle(p + 'Hint', F_R, b * 0.88, C_MUTE),
    req: cstyle(p + 'Req', F_S, b * 0.88, C_REQ),
    opt: cstyle(p + 'Opt', F_S, b * 0.88, C_MUTE),
    dim: opFill(cstyle(p + 'Dim', F_R, b, C_LEN)),
    chip: cstyle(p + 'Chip', F_R, b * 1.5, tint(C_CHIP, 60)),
    box: cstyle(p + 'Box', F_R, b * 1.25, C_TXT)
  };
}

/* ── 좌표 (mm, 원점 = 현재 대지 왼쪽 위) ── */
var OX = 0, OY = 0;
function px(x) { return OX + x * MM; } function py(y) { return OY - y * MM; }
var BOXST = null;
function ptext(x, y, s, st, just) {
  var t = CT.textFrames.pointText([px(x), py(y)]); t.contents = s; st.applyTo(t.textRange, true);
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
    (m2 == C_LEN ? S.dim : S.hint).applyTo(it.textRange, true);
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
  OX = ox; OY = oy; CT = layer.groupItems.add(); CT.name = d.k;
  var D = d.D, t = tierOf(D), S = styles(t), b = S.b, U = b * 0.3528; // U = 본문 1em (mm)
  var LH = U * 2.0, M = Math.max(10, U * 3); BOXST = S.box;
  var IW = 40 * U;                 // 정보 열 폭
  var x = M, y = M, maxEm = 40;
  // 제목만 따로, 나머지 정보는 글상자 하나 (엔터로 나눈 단락)
  var TU = TT[t] * 0.3528; y += TU * 1.1; ptext(x, y, '[아티스트] 프로젝트 이름', S.title);
  y += TU * 0.8 * 1.2;
  var P = [], GAPPT = b * 2.0 * 2.2, KW = 9 * U * MM, IWPT = IW * MM;
  function para(text, st, o) { o = o || {}; o.text = text; o.st = st; P.push(o); }
  function sec(name, lv) { para(name + (lv ? '   ' + (lv == 'r' ? '필수' : '권장') : ''), S.sec, { sb: GAPPT, tag: lv, after: b * 0.5 }); }
  function opts(arr) { var ls = wrapOpts(arr, maxEm, true); for (var i = 0; i < ls.length; i++) para(blanks(ls[i]), S.body); }
  function sub(rows) {
    for (var i = 0; i < rows.length; i++) {
      var ls = wrapOpts(rows[i][1], maxEm - 9, true);
      for (var j = 0; j < ls.length; j++) para((j ? '' : rows[i][0]) + '\t' + blanks(ls[j]), S.body, { tabs: [[KW, 'L']], label: !j, sb: (!j && i) ? b * 0.4 : 0 });
    }
  }
  para(d.n, S.item);
  para('작성자 이름 · 연락처', S.writer, { sb: b * 0.3 });
  sec('소재', d.R['소재']); opts(d.mat);
  sec('소재 세부', d.R['소재 세부']); sub(d.det);
  sec('인쇄 · 가공', d.R['인쇄 · 가공']); opts(d.proc);
  sec('컬러', d.R['컬러 안내']); var CL = ['PANTONE 231C (백그라운드 판)', 'PANTONE C ()', 'PANTONE C ()']; for (var c = 0; c < 3; c++) para('●\t' + CL[c], S.body, { chip: true, tabs: [[U * 2.4 * MM, 'L']], sb: c ? b * 0.3 : 0 });
  sec('치수 (정수 mm)', d.R['치수']);
  var dk = 0; for (var dj = 0; dj < d.dims.length; dj++) dk = Math.max(dk, emw(d.dims[dj]));
  for (var di = 0; di < d.dims.length; di++) para(d.dims[di] + '\t______ mm', S.body, { tabs: [[(dk + 2) * U * MM, 'L']], val: S.dim });
  sec('부자재', d.R['부자재']); sub(d.acc);
  sec('포장', 'o'); opts(d.pack);
  sec('주의사항', d.R['주의사항']);
  for (var w = 0; w < d.warn.length; w++) { var wl = wrapText(d.warn[w], maxEm - 2); for (var k = 0; k < wl.length; k++) para((k ? '' : '•') + '\t' + wl[k], S.body, { tabs: [[U * 1.4 * MM, 'L']] }); }
  sec('발주 전 확인');
  for (var q = 0; q < d.chk.length; q++) para('□\t' + d.chk[q], S.body, { tabs: [[U * 1.6 * MM, 'L']] });
  var lg = [['——', C_LEN, '길이'], ['——', C_FOLD, '접지'], ['- - -', C_MAR, '여백 · 안전'], ['——', C_CUT, '재단 · 칼선']];
  for (var g = 0; g < lg.length; g++) para(lg[g][0] + '\t' + lg[g][2], S.body, { lineCol: lg[g][1], tabs: [[U * 3.4 * MM, 'L']], sb: g ? 0 : GAPPT });
  var hasNet = false; for (var z = 0; z < d.views.length; z++) if (d.views[z].t == '전개도') hasNet = true;
  para((hasNet ? '전개도는 조립도와 함께 · ' : '') + '치수 0.5 올림 · 가이드 · 후가공 별색 오버프린트', S.hint, { sb: b * 0.8 });
  para('기준: 작업 기초 지침 › ' + d.src, S.hint);

  var all = []; for (var pi = 0; pi < P.length; pi++) all.push(P[pi].text);
  var tf = CT.textFrames.pointText([px(x), py(y)]); tf.contents = all.join('\r'); tf.name = '정보';
  S.body.applyTo(tf.textRange, true);
  var pars = tf.paragraphs;
  if (pars.length != P.length) NOTE.push(d.n + ': 단락 수 다름 ' + pars.length + '/' + P.length);
  for (var i2 = 0; i2 < P.length && i2 < pars.length; i2++) {
    var o = P[i2], pr = pars[i2], tx = o.text;
    o.st.applyTo(pr, true);
    var pa = pr.paragraphAttributes;
    pa.spaceBefore = o.sb || 0; pa.spaceAfter = o.after || 0;
    if (o.tabs) { var arr = []; for (var ti = 0; ti < o.tabs.length; ti++) { var ts = new TabStopInfo(); ts.position = o.tabs[ti][0]; ts.alignment = o.tabs[ti][1] == 'R' ? TabStopAlignment.Right : TabStopAlignment.Left; arr.push(ts); } pa.tabStops = arr; }
    var tab = tx.indexOf('\t');
    try {
      if (o.label && tab > 0) for (var c1 = 0; c1 < tab; c1++) S.label.applyTo(pr.characters[c1], true);
      if (o.val && tab > 0) for (var c2 = tab + 1; c2 < tx.length; c2++) o.val.applyTo(pr.characters[c2], true);
      if (o.tag) { var tl = 2; for (var c3 = tx.length - tl; c3 < tx.length; c3++) (o.tag == 'r' ? S.req : S.opt).applyTo(pr.characters[c3], true); }
      if (o.chip) S.chip.applyTo(pr.characters[0], true);
      if (o.lineCol) for (var c4 = 0; c4 < tab; c4++) { var ch4 = pr.characters[c4]; S.label.applyTo(ch4, true); ch4.characterAttributes.fillColor = o.lineCol; ch4.characterAttributes.overprintFill = true; }
      for (var c5 = 0; c5 < tx.length; c5++) if (tx.charAt(c5) == '□') S.box.applyTo(pr.characters[c5], true);
    } catch (eS) { NOTE.push(d.n + ' 글자 스타일: ' + eS); }
  }
  var infoBottom = y + tf.height / MM + M;

  // 오른쪽: 디자인 자리 (1:1)
  var dx = M + IW + Math.max(15, U * 6), vy = M + U, vw = D * 1.35, right = dx, viewBottom = 0;
  for (var v = 0; v < d.views.length; v++) {
    var V = d.views[v], vx = dx + v * (vw + Math.max(10, U * 4));
    ptext(vx, vy, '디자인 ' + (v + 1) + ' · ' + V.t + (V.note ? '  (' + V.note + ')' : ''), S.label);
    ptext(vx, vy + LH, '실제 크기 1:1로 배치', S.hint);
    var h = placeSvg(V.f, vx, vy + LH * 1.8, vw, S);
    if (vy + LH * 1.8 + h > viewBottom) viewBottom = vy + LH * 1.8 + h;
    right = vx + vw;
  }
  ptext(dx, viewBottom + LH * 1.5, '디자인이 여러 개면 오른쪽 · 아래로 이어서 배치하고, 이 대지를 늘려 쓰기', S.hint);
  var W = right + M, H = Math.max(infoBottom, viewBottom + LH * 3 + M);
  var ab = doc.artboards.add([px(0), py(0), px(W), py(H)]); ab.name = d.k;
  return [W, H, CT];
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
    sz[2].translate(mdx, mdy);
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
