/* PLYSH 사용 기록 (2026-11-24 실장님): 검수기 사용 · 다운로드 · 인쇄(PDF 저장) · 복사 · 캡처 의심을 실장님만 보는 기록 시트로 보냄.
 * 모든 페이지(PLYSH 본 화면 + iframe 도구 + 새 탭으로 연 도구)에 넣음. 같은 주소라 localStorage 줄(d4:logq)을 같이 쓰고,
 * 맨 위 창 하나만 서버로 보냄(중복 없음). 누가 · 어느 기기는 서버가 기기 토큰으로 정함.
 * 다른 화면에서 쓰는 법: window.plog('검수', { menu: '인쇄파일 검수기', file: 'a.pdf', res: '경고 2 · 주의 1' })
 * 한계: 브라우저는 OS 캡처(PrintScreen 그림 저장, Mac ⌘⇧3/4/5, 캡처 도구, 휴대폰 화면 캡처)를 직접 알 수 없음 → 잡히는 단축키 · 창 이탈만 '캡처 의심'으로 남김 */
(function () {
  var W = window;
  if (W.plog) return;
  var API = 'https://script.google.com/macros/s/AKfycbzpvNlxuCa95ZxGvg8N4SiPqmsPzyYx_n9ikhmdRlIng7VzWzks_WS6DDyviPXsfoaO/exec';
  var QK = 'd4:logq', LK = 'd4:logl', KINDS = ['검수', '다운로드', '인쇄', '복사', '캡처 의심'];
  function lg(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ls(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function rd() { try { var q = JSON.parse(lg(QK) || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } }
  var T; try { T = W.top; void T.document; } catch (e) { T = W; }
  function cut(s, n) { s = String(s == null ? '' : s).replace(/dv1\.\w+\.\w+/g, '(연결 코드)').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; }
  function menu() {
    try { if (T.plMenu) { var m = T.plMenu(); if (m) return m; } } catch (e) {}
    var p = location.pathname.replace(/^.*?\/plysh\//, '').replace(/index\.html$/, '');
    return cut(document.title || p || 'PLYSH', 40);
  }
  function log(k, o) {
    if (KINDS.indexOf(k) < 0) return;
    o = o || {};
    var it = { t: Date.now(), k: k, m: cut(o.menu || menu(), 60), f: cut(o.file, 300), r: cut(o.res, 300) };
    var q = rd(), last = q[q.length - 1];
    // 같은 화면에서 1분 안에 같은 종류(검수 빼고)가 이어지면 한 줄로 묶고 횟수만 올림
    if (last && k !== '검수' && last.k === k && last.m === it.m && it.t - (last.t2 || last.t) < 60000 && (k !== '다운로드' || last.f === it.f)) {
      last.c = (last.c || 1) + 1; last.t2 = it.t;
      if (it.f && last.f.indexOf(it.f) < 0 && last.f.length < 280) last.f = cut(last.f + ' / ' + it.f, 300);
    } else q.push(it);
    if (q.length > 400) q = q.slice(-400);
    ls(QK, JSON.stringify(q));
    soon();
  }
  W.plog = log;

  /* ── 보내기: 맨 위 창(또는 PLYSH 밖에서 따로 연 도구 창)만 ── */
  var sender = T === W || !(function () { try { return !!T.plog; } catch (e) { return false; } })();
  var tm = null, busy = false;
  function soon() { if (!sender) { try { T.plog && T.plog.flush && T.plog.flush(4000); } catch (e) {} return; } flushIn(4000); }
  function flushIn(ms) { if (!sender || tm) return; tm = setTimeout(function () { tm = null; flush(); }, ms); }
  function flush() {
    if (busy) return;
    var tok = lg('d4:tok'); if (!tok) return;
    var q = rd(); if (!q.length) return;
    var lk = +lg(LK) || 0; if (Date.now() - lk < 20000) return flushIn(20000); // 다른 탭이 보내는 중
    ls(LK, String(Date.now())); busy = true;
    var b = q.slice(0, 80);
    fetch(API, { method: 'POST', body: JSON.stringify({ api: 'appLog', args: [tok, b] }) }).then(function (r) { return r.json(); }).then(function (o) {
      if (o && o.ok) {
        var keys = {}; b.forEach(function (x) { keys[x.t + x.k] = 1; });
        ls(QK, JSON.stringify(rd().filter(function (x) { return !keys[x.t + x.k]; })));
        ls('d4:logsv', '1');
        if (q.length > b.length) flushIn(3000);
      } else if (o && /알 수 없는 요청/.test(o.error || '')) ls('d4:logsv', ''); // 서버 코드 아직 안 붙임 → 쌓아 뒀다가 나중에 보냄
    }).catch(function () {}).then(function () { busy = false; ls(LK, '0'); });
  }
  log.flush = function (ms) { flushIn(ms || 0); };
  if (sender) {
    setInterval(function () { if (!document.hidden) flush(); }, 60000);
    setTimeout(flush, 5000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  }

  /* ── 복사 · 잘라내기 ── */
  function selText() {
    var a = document.activeElement;
    try { if (a && /^(TEXTAREA|INPUT)$/.test(a.tagName) && typeof a.selectionStart === 'number') return a.value.slice(a.selectionStart, a.selectionEnd); } catch (e) {}
    try { return String(W.getSelection() || ''); } catch (e) { return ''; }
  }
  var lastBtnCopy = 0;
  function onCopy(e) {
    if (Date.now() - lastBtnCopy < 800) return; // 복사 단추(아래)에서 이미 남김
    var s = selText(); if (!s.trim()) return;
    log('복사', { file: (e.type === 'cut' ? '잘라내기 · ' : '') + s.length + '자 · ' + cut(s, 60) });
  }
  document.addEventListener('copy', onCopy, true);
  document.addEventListener('cut', onCopy, true);
  try {
    var C = navigator.clipboard;
    if (C && C.writeText) { var wt = C.writeText.bind(C); C.writeText = function (s) { lastBtnCopy = Date.now(); log('복사', { file: '복사 단추 · ' + String(s || '').length + '자 · ' + cut(s, 60) }); return wt(s); }; }
    if (C && C.write) { var wr = C.write.bind(C); C.write = function (d) { lastBtnCopy = Date.now(); log('복사', { file: '복사 단추 · 그림/서식' }); return wr(d); }; }
  } catch (e) {}

  /* ── 다운로드: download 링크 · blob/data 주소 · 파일 주소 · 코드로 누른 링크(jsPDF·SheetJS 등) ── */
  var FILE_RE = /\.(pdf|ai|eps|psd|indd|idml|zip|rar|7z|png|jpe?g|gif|webp|svg|tiff?|xlsx?|csv|docx?|pptx?|hwp|txt|otf|ttf|woff2?|jsx|json|mp4|mov)(\?|#|$)/i;
  function nameOf(a) {
    var n = a.getAttribute('download');
    if (n) return n;
    var h = a.href || '';
    if (/^data:/.test(h)) return '파일 (' + (h.slice(5, h.indexOf(';')) || 'data') + ')';
    if (/^blob:/.test(h)) return '파일';
    try { var u = new URL(h); return decodeURIComponent(u.pathname.split('/').pop() || u.hostname); } catch (e) { return cut(h, 80); }
  }
  function isDl(a) {
    if (!a || !a.href) return false;
    if (a.hasAttribute('download')) return true;
    var h = a.href;
    if (/^(blob|data):/.test(h)) return true;
    if (/drive\.google\.com\/(uc\?|.*export=download)|docs\.google\.com\/.*\/export/.test(h)) return true;
    try { var u = new URL(h); if (u.origin === location.origin && /\.html?$/i.test(u.pathname)) return false; return FILE_RE.test(u.pathname); } catch (e) { return false; }
  }
  var dlAt = new WeakMap();
  function dl(a) { var t = dlAt.get(a) || 0; if (Date.now() - t < 1000) return; dlAt.set(a, Date.now()); log('다운로드', { file: nameOf(a) }); }
  document.addEventListener('click', function (e) { var a = e.target && e.target.closest && e.target.closest('a'); if (isDl(a)) dl(a); }, true);
  document.addEventListener('auxclick', function (e) { var a = e.target && e.target.closest && e.target.closest('a'); if (e.button === 1 && isDl(a)) dl(a); }, true);
  try {
    var AP = HTMLAnchorElement.prototype, ck = AP.click, de = AP.dispatchEvent;
    AP.click = function () { if (isDl(this) && !this.isConnected) dl(this); return ck.apply(this, arguments); };
    AP.dispatchEvent = function (ev) { if (ev && ev.type === 'click' && isDl(this) && !this.isConnected) dl(this); return de.apply(this, arguments); };
  } catch (e) {}

  /* ── 인쇄 · PDF 저장 (단추든 Ctrl/⌘+P든) ── */
  var prAt = 0;
  W.addEventListener('beforeprint', function () { if (Date.now() - prAt < 3000) return; prAt = Date.now(); log('인쇄', { file: cut(document.title, 120) || '이 화면', res: 'PDF 저장 · 인쇄 창 열림' }); });

  /* ── 캡처 의심 ──
   * Windows PrintScreen: keyup만 들어옴 → 확실히 잡힘 (그림이 어디 저장됐는지는 모름)
   * Windows Win+Shift+S / Mac ⌘⇧3·4·5: 숫자 키는 OS가 가져가서 거의 안 들어옴 → ⌘(Win)+Shift를 누른 채 창 포커스가 빠지거나, 다른 키 없이 손을 떼면 '의심'으로 남김 */
  var ms = 0, other = false;
  function cap(how) { log('캡처 의심', { file: how }); }
  document.addEventListener('keydown', function (e) {
    var k = e.key || '';
    if (e.metaKey && e.shiftKey && /^(3|4|5|6|#|\$|%|\^|s|S)$/.test(k)) { cap(/[sS]/.test(k) ? 'Win+Shift+S (캡처 도구)' : '⌘⇧' + ({ '#': 3, '$': 4, '%': 5, '^': 6 }[k] || k) + ' (Mac 캡처)'); ms = 0; return; }
    if ((k === 'Meta' || k === 'OS' || k === 'Shift') && e.metaKey && e.shiftKey) { ms = Date.now(); other = false; return; }
    if (k !== 'Meta' && k !== 'Shift' && k !== 'OS') other = true;
  }, true);
  document.addEventListener('keyup', function (e) {
    var k = e.key || '';
    if (k === 'PrintScreen' || e.code === 'PrintScreen') { cap('PrintScreen 키' + (e.altKey ? ' (Alt · 창 하나)' : '')); return; }
    if (ms && (k === 'Meta' || k === 'OS' || k === 'Shift') && !other && Date.now() - ms < 4000 && Date.now() - ms > 250) { cap('⌘(Win)+Shift 단축키 후 손 뗌 (캡처 단축키일 수 있음)'); ms = 0; }
  }, true);
  W.addEventListener('blur', function () { if (ms && Date.now() - ms < 1500) { cap('⌘(Win)+Shift 누른 채 창 벗어남 (캡처 도구 열림)'); ms = 0; } });
  // 그림 오른쪽 클릭(이미지 저장 · 복사 메뉴) · 그림 끌어내기
  function isImg(el) { if (!el) return false; if (el.tagName === 'IMG' || el.tagName === 'CANVAS') return true; var g = el.closest && el.closest('svg'); if (!g) return false; var r = g.getBoundingClientRect(); return r.width > 120 && r.height > 120; }
  function imgName(el) { var s = el.currentSrc || el.src || ''; try { return decodeURIComponent(new URL(s).pathname.split('/').pop()) || el.alt || '그림'; } catch (e) { return el.alt || el.tagName.toLowerCase(); } }
  document.addEventListener('contextmenu', function (e) { if (isImg(e.target)) cap('그림 오른쪽 클릭 · ' + imgName(e.target)); }, true);
  document.addEventListener('dragstart', function (e) { if (isImg(e.target)) cap('그림 끌어내기 · ' + imgName(e.target)); }, true);
})();
