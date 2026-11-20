/* PLYSH 검수 엔진 (2026-11-18)
 * PDF / PDF 호환 .ai 의 페이지 내용을 직접 읽어서 색·오버프린트·선 두께·글자 크기·이미지 해상도 등을 모은다.
 * 화면(렌더링)이 필요 없는 검사만 여기서 하고, 픽셀이 필요한 검사(도련 채움, 얼굴, 중복 사진)는 index.html 에서 한다.
 * pdf-lib(PDFLib) 위에서 동작. 브라우저와 node 모두에서 쓸 수 있게 UMD 형태.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('pdf-lib'));
  else root.PRV = factory(root.PDFLib);
})(this, function (L) {
  'use strict';
  var PDFName = L.PDFName, PDFDict = L.PDFDict, PDFArray = L.PDFArray, PDFRef = L.PDFRef, PDFNumber = L.PDFNumber,
    PDFStream = L.PDFStream, PDFRawStream = L.PDFRawStream, PDFString = L.PDFString, PDFHexString = L.PDFHexString, PDFBool = L.PDFBool;
  var MM = 72 / 25.4; // 1mm = 2.8346pt
  function mm(pt) { return pt / MM; }

  // ── 후가공(별색) 이름 판별 ──
  var FIN_RE = /(die|cut|kiss|knife|trim|contour|crop|guide|커팅|칼\s*선|칼라인|재단선|thomson|dieline|crease|fold|perf|score|foil|hot.?stamp|stamp|emboss|deboss|varnish|spot.?uv|uv|epoxy|glitter|white|laser|hologram|칼선|도무송|톰슨|재단|접지|오시|미싱|타공|박|금박|은박|홀로그램|형압|엠보|에폭시|부분.?코팅|코팅|화이트|백색|글리터|투명|레이저)/i;
  var REG_NAMES = { All: 1, all: 1 };
  var PROC = { Cyan: 0, Magenta: 1, Yellow: 2, Black: 3 };

  // ── 작은 도우미 ──
  function N(x) { return x instanceof PDFNumber ? x.asNumber() : (typeof x === 'number' ? x : 0); }
  function nm(x) { return x instanceof PDFName ? x.decodeText ? x.decodeText() : x.asString().slice(1) : ''; }
  function nameOf(x) { if (!(x instanceof PDFName)) return ''; var s = x.asString(); return decodeName(s.charAt(0) === '/' ? s.slice(1) : s); }
  function decodeName(s) { return s.replace(/#([0-9a-fA-F]{2})/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); }); }
  function utf8(s) { try { return decodeURIComponent(escape(s)); } catch (e) { return s; } }
  function mul(a, b) { // [a b c d e f] × [a b c d e f]
    return [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
      a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
  }
  function tp(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
  function bboxPts(m, pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < pts.length; i += 2) { var p = tp(m, pts[i], pts[i + 1]); if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return [x0, y0, x1, y1];
  }
  function isect(a, b) { if (!a) return b; if (!b) return a; var r = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]; return r; }
  function empty(b) { return !b || b[2] <= b[0] || b[3] <= b[1]; }
  function scaleOf(m) { return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])); }

  function hashBytes(u8) { // FNV-1a 32bit ×2 (길이 포함)
    var h1 = 0x811c9dc5, h2 = 0x01000193 ^ u8.length, n = u8.length;
    for (var i = 0; i < n; i++) { h1 ^= u8[i]; h1 = Math.imul(h1, 16777619); }
    for (var j = 0; j < n; j += 7) { h2 ^= u8[j]; h2 = Math.imul(h2, 2246822519); }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16) + ':' + n;
  }

  // ── PDF 객체 접근 ──
  function Doc(pdf) { this.pdf = pdf; this.ctx = pdf.context; this.fontCache = new Map(); this.csCache = new Map(); this.imgHash = new Map(); this.ocgName = new Map(); this.fontsSeen = new Map(); }
  Doc.prototype.get = function (x) { return x instanceof PDFRef ? this.ctx.lookup(x) : x; };
  Doc.prototype.dget = function (d, k) { d = this.get(d); if (!d || !d.get) return undefined; return this.get(d.get(PDFName.of(k))); };
  Doc.prototype.bytes = function (s) {
    s = this.get(s);
    if (s instanceof PDFRawStream) { try { return L.decodePDFRawStream(s).decode(); } catch (e) { return null; } }
    if (s && s.getContents) { try { return s.getContents(); } catch (e) { return null; } }
    return null;
  };
  Doc.prototype.contents = function (pageNode) {
    var c = this.get(pageNode.get(PDFName.of('Contents')));
    if (!c) return new Uint8Array(0);
    var parts = [];
    if (c instanceof PDFArray) { for (var i = 0; i < c.size(); i++) { var b = this.bytes(c.get(i)); if (b) parts.push(b); } }
    else { var b2 = this.bytes(c); if (b2) parts.push(b2); }
    var len = parts.reduce(function (a, p) { return a + p.length + 1; }, 0), out = new Uint8Array(len), o = 0;
    parts.forEach(function (p) { out.set(p, o); o += p.length; out[o++] = 10; });
    return out;
  };

  // 색공간 → { k: 'cmyk'|'gray'|'rgb'|'lab'|'sep'|'devn'|'pattern'|'idx'|'none', n, names, base }
  Doc.prototype.cs = function (obj, res) {
    var self = this, o = this.get(obj);
    if (o instanceof PDFName) {
      var s = nameOf(o);
      if (s === 'DeviceCMYK' || s === 'CMYK') return { k: 'cmyk', n: 4 };
      if (s === 'DeviceRGB' || s === 'RGB') return { k: 'rgb', n: 3 };
      if (s === 'DeviceGray' || s === 'G') return { k: 'gray', n: 1 };
      if (s === 'Pattern') return { k: 'pattern', n: 0 };
      var rcs = res && this.dget(res, 'ColorSpace'), def = rcs && this.dget(rcs, s);
      if (def) return this.cs(def, res);
      return { k: 'unknown', n: 1, name: s };
    }
    if (o instanceof PDFArray) {
      if (obj instanceof PDFRef && this.csCache.has(obj.toString())) return this.csCache.get(obj.toString());
      var t = nameOf(o.get(0)), r;
      if (t === 'ICCBased') { var st = this.get(o.get(1)), n = N(st && st.dict ? this.get(st.dict.get(PDFName.of('N'))) : 3); r = { k: n === 4 ? 'cmyk' : n === 1 ? 'gray' : 'rgb', n: n, icc: true }; }
      else if (t === 'CalRGB') r = { k: 'rgb', n: 3 };
      else if (t === 'CalGray') r = { k: 'gray', n: 1 };
      else if (t === 'Lab') r = { k: 'lab', n: 3 };
      else if (t === 'Separation') { var sn = nameOf(o.get(1)); r = sn === 'All' ? { k: 'reg', n: 1, names: ['All'] } : sn === 'None' ? { k: 'none', n: 1 } : (PROC[sn] !== undefined ? { k: 'devn', n: 1, names: [sn] } : { k: 'sep', n: 1, names: [sn] }); }
      else if (t === 'DeviceN') { var na = this.get(o.get(1)), names = []; for (var i = 0; i < na.size(); i++) names.push(nameOf(na.get(i))); r = { k: 'devn', n: names.length, names: names }; }
      else if (t === 'Indexed' || t === 'I') { var base = this.cs(o.get(1), res); r = { k: 'idx', n: 1, base: base, lookup: o.get(3), hival: N(this.get(o.get(2))) }; }
      else if (t === 'Pattern') r = { k: 'pattern', n: 0, under: o.size() > 1 ? this.cs(o.get(1), res) : null };
      else r = { k: 'unknown', n: 1, name: t };
      if (obj instanceof PDFRef) this.csCache.set(obj.toString(), r);
      return r;
    }
    return { k: 'unknown', n: 1 };
  };

  // 색 값 → 잉크 { c,m,y,k (0~1), spots:{name:tint}, rgb:bool, white:bool, reg:bool }
  function inks(cs, v) {
    var r = { c: 0, m: 0, y: 0, k: 0, spots: null, rgb: false, lab: false, reg: false, none: false, pattern: false };
    if (!cs) return r;
    switch (cs.k) {
      case 'cmyk': r.c = v[0] || 0; r.m = v[1] || 0; r.y = v[2] || 0; r.k = v[3] || 0; break;
      case 'gray': r.k = 1 - (v[0] === undefined ? 0 : v[0]); r.gray = true; break;
      case 'rgb': r.rgb = true; r.rgbv = [v[0] || 0, v[1] || 0, v[2] || 0]; break;
      case 'lab': r.lab = true; break;
      case 'reg': r.reg = true; r.c = r.m = r.y = r.k = v[0] === undefined ? 1 : v[0]; break;
      case 'none': r.none = true; break;
      case 'sep': case 'devn':
        cs.names.forEach(function (n, i) {
          var t = v[i] === undefined ? 1 : v[i];
          if (PROC[n] !== undefined) r['cmyk'.charAt(PROC[n])] = t;
          else if (n === 'None') {}
          else if (n === 'All') { r.reg = true; }
          else if (t > 0.0001) { (r.spots = r.spots || {})[n] = t; }
        });
        break;
      case 'idx': var b = inks(cs.base, []); if (b.rgb) r.rgb = true; if (b.spots) r.spots = b.spots; r.idx = true; break;
      case 'pattern': r.pattern = true; break;
    }
    r.tac = (r.c + r.m + r.y + r.k) * 100;
    r.white = !r.rgb && !r.lab && !r.pattern && !r.spots && !r.reg && !r.none && r.tac < 0.5 && cs.k !== 'idx';
    if (r.rgb) r.white = r.rgbv[0] > 0.995 && r.rgbv[1] > 0.995 && r.rgbv[2] > 0.995;
    r.inkN = (r.c > 0.004) + (r.m > 0.004) + (r.y > 0.004) + (r.k > 0.004);
    r.k100 = !r.rgb && !r.spots && r.k > 0.995 && r.c < 0.004 && r.m < 0.004 && r.y < 0.004;
    r.pure = !r.rgb && !r.spots && r.inkN === 1 && Math.max(r.c, r.m, r.y, r.k) > 0.995;
    return r;
  }

  // 글꼴 정보 (폭 계산 + 임베드 여부)
  Doc.prototype.font = function (ref, res) {
    var key = ref instanceof PDFRef ? ref.toString() : null;
    if (key && this.fontCache.has(key)) return this.fontCache.get(key);
    var d = this.get(ref), self = this, f = { name: '?', two: false, w: {}, dw: 1000, embedded: true, type: '', fm: 0.001, std: false };
    if (d instanceof PDFDict) {
      f.type = nameOf(this.dget(d, 'Subtype'));
      f.name = nameOf(this.dget(d, 'BaseFont')) || f.type;
      f.name = utf8(f.name.replace(/^[A-Z]{6}\+/, ''));
      if (f.type === 'Type0') {
        var enc = this.dget(d, 'Encoding'); f.two = !(enc instanceof PDFName) || /Identity|UCS2|UTF16|H$|V$/.test(nameOf(enc)) ? true : true;
        var df = this.dget(d, 'DescendantFonts'); var cid = df instanceof PDFArray ? this.get(df.get(0)) : null;
        if (cid) {
          f.dw = this.dget(cid, 'DW') ? N(this.dget(cid, 'DW')) : 1000;
          var W = this.dget(cid, 'W');
          if (W instanceof PDFArray) {
            for (var i = 0; i < W.size();) {
              var a = N(this.get(W.get(i))), b = this.get(W.get(i + 1));
              if (b instanceof PDFArray) { for (var j = 0; j < b.size(); j++) f.w[a + j] = N(this.get(b.get(j))); i += 2; }
              else { var c2 = N(b), wv = N(this.get(W.get(i + 2))); if (c2 - a < 70000) for (var k = a; k <= c2; k++) f.w[k] = wv; i += 3; }
            }
          }
          f.embedded = !!this.fontFile(this.dget(cid, 'FontDescriptor'));
        }
      } else {
        var fc = N(this.dget(d, 'FirstChar')), Wd = this.dget(d, 'Widths');
        if (Wd instanceof PDFArray) for (var m = 0; m < Wd.size(); m++) f.w[fc + m] = N(this.get(Wd.get(m)));
        else f.dw = 550;
        if (f.type === 'Type3') { f.embedded = true; var fmx = this.dget(d, 'FontMatrix'); f.fm = fmx instanceof PDFArray ? N(this.get(fmx.get(0))) : 0.001; }
        else { var fd = this.dget(d, 'FontDescriptor'); f.embedded = !!this.fontFile(fd); if (!fd && /^(Times|Helvetica|Courier|Symbol|ZapfDingbats)/.test(f.name)) { f.std = true; } }
        f.dw = f.dw || 500;
      }
    }
    var fd2 = d instanceof PDFDict ? (f.type === 'Type0' ? null : this.dget(d, 'FontDescriptor')) : null;
    f.serif = /serif|myeongjo|myungjo|batang|명조|바탕|mincho|song|garamond|times|minion|caslon|bodoni|didot|baskerville|georgia/i.test(f.name) && !/sans/i.test(f.name);
    f.thin = /thin|light|hairline|extralight|ultralight|\bxl\b|-l$|_l$|35|25|45/i.test(f.name) && !/bold|black|heavy/i.test(f.name);
    if (key) this.fontCache.set(key, f);
    var seenKey = f.name + '|' + f.type;
    if (!this.fontsSeen.has(seenKey)) this.fontsSeen.set(seenKey, { name: f.name, type: f.type, embedded: f.embedded, std: f.std, pages: new Set() });
    f.seen = this.fontsSeen.get(seenKey);
    return f;
  };
  Doc.prototype.fontFile = function (fd) {
    fd = this.get(fd); if (!(fd instanceof PDFDict)) return null;
    return this.dget(fd, 'FontFile') || this.dget(fd, 'FontFile2') || this.dget(fd, 'FontFile3');
  };
  Doc.prototype.ocg = function (prop, res) { // BDC /OC /MC0 → 레이어 이름
    var props = res && this.dget(res, 'Properties'), o = prop instanceof PDFName && props ? this.dget(props, nameOf(prop)) : this.get(prop);
    if (!(o instanceof PDFDict)) return null;
    var n = this.dget(o, 'Name');
    if (n instanceof PDFString || n instanceof PDFHexString) return n.decodeText();
    var ocgs = this.dget(o, 'OCGs');
    if (ocgs) { var f = ocgs instanceof PDFArray ? this.get(ocgs.get(0)) : ocgs; var n2 = this.dget(f, 'Name'); if (n2 && n2.decodeText) return n2.decodeText(); }
    return null;
  };

  // ── 내용 스트림 토큰 읽기 ──
  var WS = new Uint8Array(256); [0, 9, 10, 12, 13, 32].forEach(function (c) { WS[c] = 1; });
  var DL = new Uint8Array(256); '()<>[]{}/%'.split('').forEach(function (c) { DL[c.charCodeAt(0)] = 1; });
  function Lexer(b) { this.b = b; this.p = 0; }
  var OPMARK = { op: true };
  Lexer.prototype.next = function () { // 반환: number | {n:name} | {s:bytes} | Array | {d:dict} | {op:'xx'} | null(끝)
    var b = this.b, n = b.length, p = this.p, c;
    for (;;) {
      while (p < n && WS[b[p]]) p++;
      if (p >= n) { this.p = p; return null; }
      c = b[p];
      if (c === 37) { while (p < n && b[p] !== 10 && b[p] !== 13) p++; continue; }
      break;
    }
    if (c === 47) { // /name
      var s = ++p; while (p < n && !WS[b[p]] && !DL[b[p]]) p++;
      this.p = p; return { n: decodeName(latin(b, s, p)) };
    }
    if ((c >= 48 && c <= 57) || c === 45 || c === 43 || c === 46) {
      var s2 = p; p++; while (p < n && ((b[p] >= 48 && b[p] <= 57) || b[p] === 46 || b[p] === 45)) p++;
      this.p = p; var v = parseFloat(latin(b, s2, p)); return isNaN(v) ? 0 : v;
    }
    if (c === 40) { // (string)
      var out = [], depth = 1; p++;
      while (p < n) {
        var ch = b[p++];
        if (ch === 92) {
          var e = b[p++];
          if (e === 110) out.push(10); else if (e === 114) out.push(13); else if (e === 116) out.push(9); else if (e === 98) out.push(8); else if (e === 102) out.push(12);
          else if (e >= 48 && e <= 55) { var o = e - 48; for (var k = 0; k < 2 && b[p] >= 48 && b[p] <= 55; k++) o = o * 8 + b[p++] - 48; out.push(o & 255); }
          else if (e === 13) { if (b[p] === 10) p++; } else if (e === 10) {} else out.push(e);
        } else if (ch === 40) { depth++; out.push(ch); } else if (ch === 41) { if (--depth === 0) break; out.push(ch); } else out.push(ch);
      }
      this.p = p; return { s: out };
    }
    if (c === 60) {
      if (b[p + 1] === 60) { this.p = p + 2; return { op: '<<' }; }
      var hs = ++p, hex = ''; while (p < n && b[p] !== 62) p++;
      hex = latin(b, hs, p).replace(/[^0-9a-fA-F]/g, ''); if (hex.length % 2) hex += '0';
      var arr = []; for (var i = 0; i < hex.length; i += 2) arr.push(parseInt(hex.substr(i, 2), 16));
      this.p = p + 1; return { s: arr };
    }
    if (c === 62 && b[p + 1] === 62) { this.p = p + 2; return { op: '>>' }; }
    if (c === 91) { this.p = p + 1; return { op: '[' }; }
    if (c === 93) { this.p = p + 1; return { op: ']' }; }
    if (c === 123 || c === 125) { this.p = p + 1; return this.next(); }
    var s3 = p; while (p < n && !WS[b[p]] && !DL[b[p]]) p++;
    if (p === s3) p++;
    this.p = p; var w = latin(b, s3, p);
    if (w === 'true') return true; if (w === 'false') return false; if (w === 'null') return null === null ? 0 : 0;
    return { op: w };
  };
  function latin(b, s, e) { var r = ''; for (var i = s; i < e; i++) r += String.fromCharCode(b[i]); return r; }

  // ── 페이지 해석 ──
  // emit(kind, info) 로 결과를 알려 준다. kind: fill/stroke/text/image/shade
  function GS() {
    this.ctm = [1, 0, 0, 1, 0, 0]; this.fcs = { k: 'gray', n: 1 }; this.scs = { k: 'gray', n: 1 }; this.fc = [0]; this.sc = [0];
    this.OP = false; this.op = false; this.lw = 1; this.clip = null; this.font = null; this.fs = 0; this.Tc = 0; this.Tw = 0; this.Th = 1; this.TL = 0; this.Tr = 0; this.Ts = 0; this.smask = false; this.ca = 1; this.CA = 1;
  }
  GS.prototype.clone = function () { var g = new GS(); for (var k in this) if (this.hasOwnProperty(k)) g[k] = this[k]; return g; };

  function Interp(doc, emit, opt) { this.doc = doc; this.emit = emit; this.opBudget = (opt && opt.opBudget) || 4e6; this.ops = 0; this.truncated = false; this.layers = []; this.pageNo = 0; }

  Interp.prototype.run = function (bytes, res, gs, depth) {
    var doc = this.doc, lx = new Lexer(bytes), st = [], self = this, gstack = [], path = [], pbox = null, pendingClip = 0, inText = false, Tm = null, Tlm = null, mcStack = [];
    var cx = 0, cy = 0, sx = 0, sy = 0, segs = [];
    function addPt(x, y) { var p = tp(gs.ctm, x, y); if (!pbox) pbox = [p[0], p[1], p[0], p[1]]; else { if (p[0] < pbox[0]) pbox[0] = p[0]; if (p[0] > pbox[2]) pbox[2] = p[0]; if (p[1] < pbox[1]) pbox[1] = p[1]; if (p[1] > pbox[3]) pbox[3] = p[1]; } return p; }
    function seg(p0, p1) { if (segs.length < 400) segs.push([p0[0], p0[1], p1[0], p1[1]]); }
    var last = null;
    function endPath(fill, stroke) {
      if (pbox) {
        if (fill || stroke) self.paint(gs, pbox, fill, stroke, segs, mcStack);
        if (pendingClip) gs.clip = isect(gs.clip, pbox);
      } else if (pendingClip) gs.clip = isect(gs.clip, [0, 0, 0, 0]);
      pbox = null; pendingClip = 0; segs = []; last = null;
    }
    function nums(k) { var a = st.slice(-k); return a.map(function (x) { return typeof x === 'number' ? x : 0; }); }
    for (;;) {
      if (++this.ops > this.opBudget) { this.truncated = true; return; }
      var t = lx.next();
      if (t === null) break;
      if (typeof t !== 'object' || !t.op) { st.push(t); continue; }
      var op = t.op;
      switch (op) {
        case '[': st.push(OPMARK); break;
        case ']': { var i = st.lastIndexOf(OPMARK), arr = st.splice(i); arr.shift(); st.push(arr); break; }
        case '<<': st.push('<<'); break;
        case '>>': { var j = st.lastIndexOf('<<'), dd = st.splice(j); dd.shift(); var o = {}; for (var q = 0; q + 1 < dd.length; q += 2) o[dd[q] && dd[q].n] = dd[q + 1]; st.push({ d: o }); break; }
        case 'q': gstack.push(gs); gs = gs.clone(); st = []; break;
        case 'Q': if (gstack.length) gs = gstack.pop(); st = []; break;
        case 'cm': { var m = nums(6); gs.ctm = mul(m, gs.ctm); st = []; break; }
        case 'w': gs.lw = nums(1)[0]; st = []; break;
        case 'gs': { var gn = st[st.length - 1]; this.extg(gs, gn && gn.n, res); st = []; break; }
        case 'm': { var a = nums(2); cx = sx = a[0]; cy = sy = a[1]; last = addPt(cx, cy); st = []; break; }
        case 'l': { var a2 = nums(2); var p0 = last || tp(gs.ctm, cx, cy); cx = a2[0]; cy = a2[1]; last = addPt(cx, cy); seg(p0, last); st = []; break; }
        case 'c': { var a3 = nums(6); addPt(a3[0], a3[1]); addPt(a3[2], a3[3]); var p1 = last || tp(gs.ctm, cx, cy); cx = a3[4]; cy = a3[5]; last = addPt(cx, cy); seg(p1, last); st = []; break; }
        case 'v': case 'y': { var a4 = nums(4); addPt(a4[0], a4[1]); var p2 = last || tp(gs.ctm, cx, cy); cx = a4[2]; cy = a4[3]; last = addPt(cx, cy); seg(p2, last); st = []; break; }
        case 'h': { var p3 = last || tp(gs.ctm, cx, cy); cx = sx; cy = sy; last = tp(gs.ctm, cx, cy); seg(p3, last); st = []; break; }
        case 're': { var r = nums(4); var c1 = addPt(r[0], r[1]), c2 = addPt(r[0] + r[2], r[1]), c3 = addPt(r[0] + r[2], r[1] + r[3]), c4 = addPt(r[0], r[1] + r[3]); seg(c1, c2); seg(c2, c3); seg(c3, c4); seg(c4, c1); cx = sx = r[0]; cy = sy = r[1]; last = c1; st = []; break; }
        case 'n': endPath(false, false); st = []; break;
        case 'S': case 's': endPath(false, true); st = []; break;
        case 'f': case 'F': case 'f*': endPath(true, false); st = []; break;
        case 'B': case 'B*': case 'b': case 'b*': endPath(true, true); st = []; break;
        case 'W': case 'W*': pendingClip = 1; st = []; break;
        case 'CS': gs.scs = doc.cs(PDFName.of(st[st.length - 1].n), res); gs.sc = gs.scs.k === 'cmyk' ? [0, 0, 0, 1] : gs.scs.k === 'rgb' ? [0, 0, 0] : [gs.scs.k === 'gray' ? 0 : 1]; st = []; break;
        case 'cs': gs.fcs = doc.cs(PDFName.of(st[st.length - 1].n), res); gs.fc = gs.fcs.k === 'cmyk' ? [0, 0, 0, 1] : gs.fcs.k === 'rgb' ? [0, 0, 0] : [gs.fcs.k === 'gray' ? 0 : 1]; gs.fpat = null; st = []; break;
        case 'SC': case 'SCN': gs.sc = st.filter(function (x) { return typeof x === 'number'; }); if (st.length && st[st.length - 1].n) gs.spat = st[st.length - 1].n; st = []; break;
        case 'sc': case 'scn': gs.fc = st.filter(function (x) { return typeof x === 'number'; }); gs.fpat = st.length && st[st.length - 1] && st[st.length - 1].n ? st[st.length - 1].n : null; st = []; break;
        case 'G': gs.scs = { k: 'gray', n: 1 }; gs.sc = nums(1); st = []; break;
        case 'g': gs.fcs = { k: 'gray', n: 1 }; gs.fc = nums(1); st = []; break;
        case 'RG': gs.scs = { k: 'rgb', n: 3 }; gs.sc = nums(3); st = []; break;
        case 'rg': gs.fcs = { k: 'rgb', n: 3 }; gs.fc = nums(3); st = []; break;
        case 'K': gs.scs = { k: 'cmyk', n: 4 }; gs.sc = nums(4); st = []; break;
        case 'k': gs.fcs = { k: 'cmyk', n: 4 }; gs.fc = nums(4); st = []; break;
        case 'BT': inText = true; Tm = [1, 0, 0, 1, 0, 0]; Tlm = Tm; st = []; break;
        case 'ET': inText = false; st = []; break;
        case 'Tc': gs.Tc = nums(1)[0]; st = []; break;
        case 'Tw': gs.Tw = nums(1)[0]; st = []; break;
        case 'Tz': gs.Th = nums(1)[0] / 100; st = []; break;
        case 'TL': gs.TL = nums(1)[0]; st = []; break;
        case 'Ts': gs.Ts = nums(1)[0]; st = []; break;
        case 'Tr': gs.Tr = nums(1)[0]; st = []; break;
        case 'Tf': { var fnm = st[st.length - 2]; gs.fs = nums(1)[0]; var fres = res && doc.dget(res, 'Font'); var fref = fres && fnm && fnm.n ? fres.get(PDFName.of(fnm.n)) : null; gs.font = fref ? doc.font(fref, res) : { name: '?', w: {}, dw: 500, embedded: true, fm: 0.001 }; st = []; break; }
        case 'Td': { var d1 = nums(2); Tlm = mul([1, 0, 0, 1, d1[0], d1[1]], Tlm || [1, 0, 0, 1, 0, 0]); Tm = Tlm; st = []; break; }
        case 'TD': { var d2 = nums(2); gs.TL = -d2[1]; Tlm = mul([1, 0, 0, 1, d2[0], d2[1]], Tlm || [1, 0, 0, 1, 0, 0]); Tm = Tlm; st = []; break; }
        case 'Tm': Tm = Tlm = nums(6); st = []; break;
        case 'T*': Tlm = mul([1, 0, 0, 1, 0, -gs.TL], Tlm || [1, 0, 0, 1, 0, 0]); Tm = Tlm; st = []; break;
        case 'Tj': case "'": case '"': case 'TJ': {
          if (op === "'" || op === '"') { if (op === '"') { gs.Tw = st[0]; gs.Tc = st[1]; } Tlm = mul([1, 0, 0, 1, 0, -gs.TL], Tlm || [1, 0, 0, 1, 0, 0]); Tm = Tlm; }
          var arg = st[st.length - 1];
          Tm = this.text(gs, Tm || [1, 0, 0, 1, 0, 0], Array.isArray(arg) ? arg : [arg], mcStack);
          st = []; break;
        }
        case 'Do': { var xn = st[st.length - 1]; if (xn && xn.n) this.xobj(xn.n, res, gs, depth, mcStack); st = []; break; }
        case 'BI': this.inlineImage(lx, gs, res, mcStack); st = []; break;
        case 'sh': { var shn = st[st.length - 1]; this.shade(shn && shn.n, res, gs, null, mcStack); st = []; break; }
        case 'BDC': { var tag = st[st.length - 2], prop = st[st.length - 1], ln = null; if (tag && tag.n === 'OC' && prop && prop.n) ln = doc.ocg(PDFName.of(prop.n), res); mcStack.push(ln); st = []; break; }
        case 'BMC': mcStack.push(null); st = []; break;
        case 'EMC': mcStack.pop(); st = []; break;
        default: st = [];
      }
    }
  };

  Interp.prototype.layer = function (mc) { for (var i = mc.length - 1; i >= 0; i--) if (mc[i]) return mc[i]; return this.baseLayer || null; };

  Interp.prototype.extg = function (gs, name, res) {
    var doc = this.doc, eg = res && doc.dget(res, 'ExtGState'), d = eg && name ? doc.dget(eg, name) : null;
    if (!(d instanceof PDFDict)) return;
    var OP = doc.dget(d, 'OP'), op = doc.dget(d, 'op'), lw = doc.dget(d, 'LW'), sm = doc.dget(d, 'SMask'), ca = doc.dget(d, 'ca'), CA = doc.dget(d, 'CA');
    if (OP instanceof PDFBool) { gs.OP = OP.asBoolean(); if (!(op instanceof PDFBool)) gs.op = gs.OP; }
    if (op instanceof PDFBool) gs.op = op.asBoolean();
    if (lw instanceof PDFNumber) gs.lw = lw.asNumber();
    if (sm !== undefined) gs.smask = !(sm instanceof PDFName && nameOf(sm) === 'None');
    if (ca instanceof PDFNumber) gs.ca = ca.asNumber();
    if (CA instanceof PDFNumber) gs.CA = CA.asNumber();
    var font = doc.dget(d, 'Font');
    if (font instanceof PDFArray) { gs.font = doc.font(font.get(0), res); gs.fs = N(doc.get(font.get(1))); }
  };

  Interp.prototype.paint = function (gs, box, fill, stroke, segs, mc) {
    var vis = gs.clip ? isect(box, gs.clip) : box;
    if (fill) {
      var fi = this.patInks(gs, true);
      var rect = segs.length >= 3 && segs.length <= 5 && segs.every(function (s) { return Math.abs(s[0] - s[2]) < 0.05 || Math.abs(s[1] - s[3]) < 0.05; }); // 네모 칠 (가림 판정용)
      this.emit('fill', { box: box, vis: vis, ink: fi, op: gs.op, ca: gs.ca, rect: rect, layer: this.layer(mc), segs: fi.spots ? segs.slice() : null });
    }
    if (stroke) {
      var si = this.patInks(gs, false), w = gs.lw * scaleOf(gs.ctm), hw = Math.max(w / 2, 0.25), sb = [box[0] - hw, box[1] - hw, box[2] + hw, box[3] + hw];
      this.emit('stroke', { box: sb, vis: gs.clip ? isect(sb, gs.clip) : sb, ink: si, op: gs.OP, w: w, w0: gs.lw, ca: gs.CA, layer: this.layer(mc), segs: segs.slice() });
    }
  };
  Interp.prototype.patInks = function (gs, fill) {
    var cs = fill ? gs.fcs : gs.scs, v = fill ? gs.fc : gs.sc;
    if (cs.k === 'pattern') {
      var pn = fill ? gs.fpat : gs.spat, res = this.res, i = { c: 0, m: 0, y: 0, k: 0, tac: 0, pattern: true, inkN: 0 };
      if (pn && res) {
        var pats = this.doc.dget(res, 'Pattern'), p = pats && this.doc.dget(pats, pn);
        var sh = p && this.doc.dget(p.dict || p, 'Shading');
        if (sh) { var scs = this.doc.cs((sh.dict || sh).get(PDFName.of('ColorSpace')), res); var r = inks(scs, []); r.pattern = true; r.shade = true; r.tac = 0; r.white = false; return r; }
      }
      if (cs.under) { var u = inks(cs.under, v); u.pattern = true; return u; }
      return i;
    }
    return inks(cs, v);
  };

  Interp.prototype.text = function (gs, Tm, items, mc) {
    var f = gs.font || { w: {}, dw: 500, fm: 0.001, name: '?' }, fs = gs.fs, Th = gs.Th, tx = 0, n = 0, chars = 0, sp = 0;
    var fm = f.type === 'Type3' ? f.fm : 0.001;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (typeof it === 'number') { tx -= it / 1000 * fs * Th; continue; }
      if (!it || !it.s) continue;
      var b = it.s;
      if (f.two) {
        for (var k = 0; k + 1 < b.length; k += 2) { var cid = (b[k] << 8) | b[k + 1], w = f.w[cid] !== undefined ? f.w[cid] : f.dw; tx += (w * 0.001 * fs + gs.Tc) * Th; chars++; }
      } else {
        for (var k2 = 0; k2 < b.length; k2++) { var code = b[k2], w2 = f.w[code] !== undefined ? f.w[code] : f.dw; tx += (w2 * fm * fs + gs.Tc + (code === 32 ? gs.Tw : 0)) * Th; chars++; if (code === 32) sp++; }
      }
    }
    var trm = mul(Tm, gs.ctm);
    if (gs.Tr !== 3 && gs.Tr !== 7 && chars) {
      var box = bboxPts(trm, [0, -0.22 * fs + gs.Ts, tx, -0.22 * fs + gs.Ts, tx, 0.88 * fs + gs.Ts, 0, 0.88 * fs + gs.Ts]);
      var vy = Math.sqrt(trm[2] * trm[2] + trm[3] * trm[3]), size = Math.abs(fs) * vy;
      var fill = gs.Tr === 0 || gs.Tr === 2 || gs.Tr === 4 || gs.Tr === 6, stroke = gs.Tr === 1 || gs.Tr === 2 || gs.Tr === 5 || gs.Tr === 6;
      if (f.seen) f.seen.pages.add(this.pageNo);
      this.emit('text', { box: box, vis: gs.clip ? isect(box, gs.clip) : box, size: size, font: f, ink: fill ? inks(gs.fcs, gs.fc) : null, sink: stroke ? inks(gs.scs, gs.sc) : null, op: gs.op, OP: gs.OP, sw: gs.lw * scaleOf(gs.ctm), chars: chars, layer: this.layer(mc), Tr: gs.Tr, mir: (trm[0] * trm[3] - trm[1] * trm[2]) < 0 });
    }
    return mul([1, 0, 0, 1, tx, 0], Tm);
  };

  Interp.prototype.xobj = function (name, res, gs, depth, mc) {
    var doc = this.doc, xo = res && doc.dget(res, 'XObject'), ref = xo && xo.get(PDFName.of(name)), s = doc.get(ref);
    if (!s || !s.dict) return;
    var d = s.dict, sub = nameOf(doc.get(d.get(PDFName.of('Subtype'))));
    if (sub === 'Image') return this.image(d, ref, s, gs, mc);
    if (sub !== 'Form' || depth > 14) return;
    var g2 = gs.clone(), m = doc.get(d.get(PDFName.of('Matrix')));
    if (m instanceof PDFArray) g2.ctm = mul([0, 1, 2, 3, 4, 5].map(function (i) { return N(doc.get(m.get(i))); }), g2.ctm);
    var bb = doc.get(d.get(PDFName.of('BBox')));
    if (bb instanceof PDFArray) { var b = [0, 1, 2, 3].map(function (i) { return N(doc.get(bb.get(i))); }); g2.clip = isect(g2.clip, bboxPts(g2.ctm, [b[0], b[1], b[2], b[1], b[2], b[3], b[0], b[3]])); }
    var r2 = doc.get(d.get(PDFName.of('Resources'))) || res, bytes = doc.bytes(s);
    var oc = doc.get(d.get(PDFName.of('OC'))), keepBase = this.baseLayer;
    if (oc) { var ln = doc.ocg(oc, r2); if (ln) this.baseLayer = ln; }
    var keepRes = this.res; this.res = r2;
    if (bytes) this.run(bytes, r2, g2, depth + 1);
    this.res = keepRes; this.baseLayer = keepBase;
  };

  Interp.prototype.image = function (d, ref, s, gs, mc) {
    var doc = this.doc, get = function (k) { return doc.get(d.get(PDFName.of(k))); };
    var w = N(get('Width') || get('W')), h = N(get('Height') || get('H')), mask = get('ImageMask') || get('IM');
    var isMask = mask instanceof PDFBool ? mask.asBoolean() : mask === true;
    var csObj = d.get(PDFName.of('ColorSpace')) || d.get(PDFName.of('CS')), cs = csObj ? doc.cs(csObj, this.res) : null;
    var filt = get('Filter') || get('F'), fname = filt instanceof PDFArray ? nameOf(doc.get(filt.get(filt.size() - 1))) : nameOf(filt);
    var m = gs.ctm, box = bboxPts(m, [0, 0, 1, 0, 1, 1, 0, 1]);
    var wIn = Math.sqrt(m[0] * m[0] + m[1] * m[1]) / 72, hIn = Math.sqrt(m[2] * m[2] + m[3] * m[3]) / 72;
    var key = ref instanceof PDFRef ? ref.toString() : null, hash = null;
    if (key) { if (this.doc.imgHash.has(key)) hash = this.doc.imgHash.get(key); else { var raw = s.contents || (s.getContents && s.getContents()); hash = raw ? hashBytes(raw) : key; this.doc.imgHash.set(key, hash); } }
    var smask = !!get('SMask') || gs.smask;
    this.emit('image', { box: box, vis: gs.clip ? isect(box, gs.clip) : box, pw: w, ph: h, ppiX: wIn ? w / wIn : 0, ppiY: hIn ? h / hIn : 0, mask: isMask, cs: cs, ink: cs ? inks(cs, []) : null, filter: fname, ref: key, hash: hash, smask: smask, op: gs.op, ca: gs.ca, layer: this.layer(mc), rot: Math.abs(m[1]) > 1e-3 || Math.abs(m[2]) > 1e-3, ctm: m.slice() });
  };

  Interp.prototype.inlineImage = function (lx, gs, res, mc) {
    var d = {}, b = lx.b, key = null;
    for (;;) { var t = lx.next(); if (t === null) return; if (t.op === 'ID') break; if (key === null) key = t.n || ''; else { d[key] = t; key = null; } }
    var p = lx.p + 1, n = b.length;
    while (p < n - 2) { if (WS[b[p - 1]] && b[p] === 69 && b[p + 1] === 73 && (p + 2 >= n || WS[b[p + 2]])) break; p++; }
    lx.p = p + 2;
    var w = d.W || d.Width || 0, h = d.H || d.Height || 0, m = gs.ctm, csv = d.CS || d.ColorSpace, cs = null;
    if (csv && csv.n) { var ab = { G: 'DeviceGray', RGB: 'DeviceRGB', CMYK: 'DeviceCMYK', I: 'Indexed' }; cs = this.doc.cs(PDFName.of(ab[csv.n] || csv.n), res); }
    var wIn = Math.sqrt(m[0] * m[0] + m[1] * m[1]) / 72, hIn = Math.sqrt(m[2] * m[2] + m[3] * m[3]) / 72, box = bboxPts(m, [0, 0, 1, 0, 1, 1, 0, 1]);
    this.emit('image', { box: box, vis: gs.clip ? isect(box, gs.clip) : box, pw: w, ph: h, ppiX: wIn ? w / wIn : 0, ppiY: hIn ? h / hIn : 0, mask: d.IM === true || d.ImageMask === true, cs: cs, ink: cs ? inks(cs, []) : null, inline: true, ref: null, hash: null, layer: this.layer(mc), ctm: m.slice() });
  };

  Interp.prototype.shade = function (name, res, gs, _, mc) {
    var doc = this.doc, shs = res && doc.dget(res, 'Shading'), sh = shs && name ? doc.dget(shs, name) : null;
    if (!sh) return;
    var dict = sh.dict || sh, cs = doc.cs(dict.get(PDFName.of('ColorSpace')), res), ink = inks(cs, []);
    ink.shade = true; ink.white = false; ink.tac = 0;
    var box = gs.clip || [0, 0, 0, 0];
    this.emit('fill', { box: box, vis: box, ink: ink, op: gs.op, shade: true, layer: this.layer(mc) });
  };

  // ── 페이지 상자 ──
  function boxOf(doc, node, k) {
    var a = node.get(PDFName.of(k));
    if (!a && (k === 'MediaBox' || k === 'CropBox')) { var p = node; while (!a && p) { p = doc.get(p.get(PDFName.of('Parent'))); a = p && p.get && p.get(PDFName.of(k)); } }
    a = doc.get(a);
    if (!(a instanceof PDFArray)) return null;
    var v = [0, 1, 2, 3].map(function (i) { return N(doc.get(a.get(i))); });
    return [Math.min(v[0], v[2]), Math.min(v[1], v[3]), Math.max(v[0], v[2]), Math.max(v[1], v[3])];
  }

  // ── 문서 전체 해석 ──
  // 결과: { pages:[{ i, media, crop, trim, bleed, hasTrim, hasBleed, rot, objs:{...}, ... }], fonts, spots, layers }
  function analyzeDoc(pdf, opt, progress) {
    opt = opt || {};
    var doc = new Doc(pdf), pages = pdf.getPages(), out = [];
    for (var i = 0; i < pages.length; i++) {
      out.push(analyzePage(doc, pages[i].node, i, opt));
      if (progress) progress(i + 1, pages.length);
    }
    var fonts = []; doc.fontsSeen.forEach(function (f) { fonts.push({ name: f.name, type: f.type, embedded: f.embedded, std: f.std, pages: Array.from(f.pages).sort(function (a, b) { return a - b; }) }); });
    return { pages: out, fonts: fonts, doc: doc };
  }

  function analyzePage(doc, node, i, opt) {
    var media = boxOf(doc, node, 'MediaBox') || [0, 0, 595, 842], crop = boxOf(doc, node, 'CropBox'), trim = boxOf(doc, node, 'TrimBox'), bleed = boxOf(doc, node, 'BleedBox'), art = boxOf(doc, node, 'ArtBox');
    var P = {
      i: i, media: media, crop: crop ? isect(crop, media) : media, trim: trim || (crop ? isect(crop, media) : media), bleed: bleed, hasTrim: !!trim, hasBleed: !!bleed, art: art,
      rot: N(doc.get(node.get(PDFName.of('Rotate')))) || 0,
      fills: [], strokes: [], texts: [], images: [], spots: {}, rgb: { fill: 0, stroke: 0, text: 0, image: 0, shade: 0, boxes: [] }, lab: 0, reg: [], truncated: false, opCount: 0
    };
    var keepF = 0;
    var seqN = 0;
    function emit(kind, o) {
      o.seq = ++seqN; // 그려지는 순서 (위에 덮였는지 판정)
      if (kind === 'image') { P.images.push(o); }
      else if (kind === 'text') { if (P.texts.length < 6000) P.texts.push(o); }
      else if (kind === 'stroke') { if (P.strokes.length < 30000) P.strokes.push(o); }
      else if (kind === 'fill') { if (P.fills.length < 30000) P.fills.push(o); }
      var ink = o.ink;
      [ink, o.sink].forEach(function (k) {
        if (!k) return;
        if (k.spots) for (var s in k.spots) P.spots[s] = (P.spots[s] || 0) + 1;
        if (k.rgb) { P.rgb[kind === 'fill' && o.shade ? 'shade' : kind]++; if (P.rgb.boxes.length < 40 && o.vis && !empty(o.vis)) P.rgb.boxes.push(o.vis); }
        if (k.lab) P.lab++;
        if (k.reg && P.reg.length < 400 && o.vis) { var rb = o.vis.slice(), rw = rb[2] - rb[0], rh = rb[3] - rb[1]; rb.seq = o.seq; rb.line = kind === 'stroke' || (kind === 'fill' && Math.min(rw, rh) < 0.6 * 72 / 25.4); P.reg.push(rb); } // 선(칼선·가이드)과 면·글자 구분
      });
    }
    var it = new Interp(doc, emit, opt); it.pageNo = i;
    var res = doc.get(node.get(PDFName.of('Resources')));
    if (!res) { var p = node; while (!res && p) { p = doc.get(p.get(PDFName.of('Parent'))); res = p && doc.get(p.get(PDFName.of('Resources'))); } }
    it.res = res;
    var gs = new GS(); gs.clip = P.crop;
    try { it.run(doc.contents(node), res, gs, 0); } catch (e) { P.error = String(e && e.message || e); }
    P.truncated = it.truncated; P.opCount = it.ops;
    // 주석(Annotation) 중 인쇄되는 것 (메모, 도장 등)
    var an = doc.get(node.get(PDFName.of('Annots'))), annots = 0;
    if (an instanceof PDFArray) for (var a = 0; a < an.size(); a++) { var ad = doc.get(an.get(a)), st = ad && nameOf(doc.dget(ad, 'Subtype')); if (st && st !== 'Link' && st !== 'Popup' && st !== 'Widget' && st !== 'PrinterMark' && st !== 'TrapNet') annots++; }
    P.annots = annots;
    return P;
  }

  function isFin(name) { return FIN_RE.test(name || ''); }

  function open(pdf) { return new Doc(pdf); }
  function page(doc, i, opt) { return analyzePage(doc, doc.pdf.getPage(i).node, i, opt || {}); }
  function fonts(doc) { var r = []; doc.fontsSeen.forEach(function (f) { r.push({ name: f.name, type: f.type, embedded: f.embedded, std: f.std, pages: Array.from(f.pages).sort(function (a, b) { return a - b; }) }); }); return r; }
  return { analyzeDoc: analyzeDoc, open: open, page: page, fonts: fonts, inks: inks, MM: MM, mm: mm, isect: isect, empty: empty, isFin: isFin, FIN_RE: FIN_RE, hashBytes: hashBytes, Lexer: Lexer };
});
