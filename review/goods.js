/* PLYSH 상품 작업지시서 검수 (2026-11-22)
   작업지시서 글자(직접 쓰기 · PDF · AI · 엑셀)를 품목별로 나눠서
   1) 품목 종류마다 꼭 들어가야 할 사양(소재 · 두께 · 부자재 …)이 있는지
   2) 서로 안 맞는 값(도수와 별색 수, 핀 개수, 두께 두 가지, 수량 합계 …)
   3) 오탈자 · 표기
   를 본다. 순수 함수 check(text, opt) → { items, groups, pass } */
(function (root) {
'use strict';
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

/* ── 사양 칸 ── re = 값이 있는지 찾는 식 (라벨 글자는 빼고 찾음) */
var MAT_ACR = /(투명|유백|미러|거울|글리터|오로라|홀로그램|컬러|색|프로스트|반투명|형광|야광|마블|우드|캐스트|압출|불투명)\s*아크릴|아크릴\s*(투명|유백|미러|글리터|오로라|홀로)|PMMA/i;
var F = {
  size:   { n: '사이즈', re: /\d+(?:\.\d+)?\s*[x×X*]\s*\d+(?:\.\d+)?|(?:지름|직경|Ø|ø|φ|폭|높이|길이|가로|세로)\s*[:：]?\s*\d+|\d+(?:\.\d+)?\s*(?:mm|cm|㎜|㎝|inch|인치)/, ex: '50×50mm' },
  qty:    { n: '수량', re: /\d[\d,]*\s*(?:개|ea|EA|pcs|PCS|Pcs|세트|set|SET|족|벌|장|매|입)(?![별월식])|수량\s*[:：]?\s*\d/, ex: '500개' },
  matAcr: { n: '소재', re: MAT_ACR, ex: '투명 아크릴 (캐스트)', loose: /아크릴/ },
  thick:  { n: '두께', re: /\d+(?:\.\d+)?\s*(?:T|t|티)(?![a-zA-Z가-힣])|두께\s*[:：]?\s*\d|\d+(?:\.\d+)?\s*mm\s*두께/, ex: '3T (3mm)' },
  ring:   { n: '부자재 (고리)', re: /O\s*링|오\s*링|D\s*링|디\s*링|볼\s*체인|볼체인|키\s*링\s*고리|랍스[터타]|카라비[너나]|스플릿\s*링|군번줄|체인|9자\s*핀|T\s*핀|휴대폰\s*줄|스트랩|와이어\s*링|키홀더\s*고리|고리/, ex: '볼체인 (실버)' },
  ringCol:{ n: '고리 색', re: /골드|실버|니켈|블랙\s*니켈|흑니켈|로즈\s*골드|금색|은색|무도금|도금|크롬|건메탈|화이트|블랙/, ex: '실버' },
  print:  { n: '인쇄 방식', re: /UV|인쇄|실크|전사|승화|프린트|오프셋|나염|DTP|DTF|자수|에칭|각인|레이저/i, ex: 'UV 인쇄' },
  side:   { n: '인쇄 면', re: /단면|양면|이중\s*인쇄|앞뒤|앞면|뒷면|한\s*면/, ex: '양면 (이중 인쇄)' },
  white:  { n: '화이트 판', re: /화이트|백판|흰색\s*(인쇄|판)|백색|W\s*판|white/i, ex: '화이트 1도 (백판)' },
  hole:   { n: '구멍 위치·지름', re: /구멍|타공|홀(?![로])|hole/i, ex: '구멍 지름 3mm · 위쪽 가운데' },
  pack:   { n: '포장', re: /OPP|opp|포장|폴리백|비닐|헤더\s*카드|대지|블리스터|박스|파우치\s*포장|봉투/, ex: '개별 OPP' },
  base:   { n: '받침', re: /받침|베이스|바닥\s*판|스탠드\s*판|base/i, ex: '받침 60×20mm 3T' },
  fill:   { n: '셰이커 내용물', re: /글리터|비즈|파츠|내용물|충전물|액체|오일|모래|별\s*조각|하트\s*조각/, ex: '글리터 + 별 파츠' },
  metal:  { n: '소재', re: /아연\s*합금|아연|황동|브라스|철|스테인|스텐|알루미늄|구리|동판|zinc|brass|iron/i, ex: '아연합금' },
  plate:  { n: '도금', re: /도금|골드|실버|니켈|로즈\s*골드|금색|은색|구리색|동색|앤틱|블랙\s*니켈|흑니켈|건메탈|무광\s*금|유광\s*금/, ex: '골드 도금 (유광)' },
  enamel: { n: '컬러 방식', re: /하드\s*에나멜|소프트\s*에나멜|에나멜|에폭시|칠|오프셋\s*인쇄|UV|인쇄|에칭|컬러\s*없음|무채색/, ex: '소프트 에나멜 + 에폭시' },
  pin:    { n: '잠금 (핀)', re: /나비\s*(?:침|클러치|핀)|버터플라이|고무\s*(?:클러치|마개|캡)|러버\s*(?:클러치|캡)|안전\s*핀|옷핀|자석|마그넷|집게|클립|침\s*\d|[12]\s*(?:핀|침)|핀\s*[12]\s*개|잠금|클러치/, ex: '나비 클러치 2핀 (골드)' },
  canBack:{ n: '뒷면 부속', re: /안전\s*핀|옷핀|핀\s*타입|자석|마그넷|미러|거울|병따개|오프너|키링|고리|스탠드|클립|핀/, ex: '안전핀' },
  finish: { n: '표면 마감', re: /유광|무광|홀로그램|글리터|펄|매트|코팅/, ex: '유광' },
  pvc:    { n: '소재', re: /소프트\s*PVC|PVC|실리콘|러버|고무|TPU/i, ex: '소프트 PVC' },
  colors: { n: '컬러 수', re: /\d+\s*(?:도|색|컬러)(?![가-힣])|PANTONE|팬톤/i, ex: 'PANTONE 5색' },
  fabric: { n: '원단', re: /면\s*\d|순면|면\s*100|코튼|cotton|폴리|캔버스|옥스포드|극세사|밍크|스판|펠트|부직포|벨벳|벨루어|코듀로이|골덴|린넨|데님|저지|쭈리|플리스|후리스|인조\s*퍼|퍼|스웨이드|나일론|테리|메쉬|니트|쉐르파|원단|가죽|PU|타프타|새틴|오간자|\d+\s*수|\d+\s*oz/i, ex: '면 100% 20수 싱글' },
  mix:    { n: '혼용률', re: /\d+\s*%|혼용/, ex: '면 100%' },
  color:  { n: '컬러', re: /컬러|색상|PANTONE|팬톤|화이트|블랙|네이비|그레이|회색|아이보리|크림|베이지|핑크|레드|빨강|블루|파랑|그린|초록|옐로|노랑|퍼플|보라|민트|브라운|차콜|멜란지|black|white|navy|gray|grey|ivory|pink|red|blue|green|yellow/i, ex: '화이트 (원단) · PANTONE 186C (인쇄)' },
  method: { n: '인쇄·가공 방식', re: /실크|나염|DTP|DTF|전사|자수|프린트|인쇄|승화|아플리케|와펜|패치|퀼팅|열\s*프레스|플록|고무\s*나염/i, ex: '실크 나염 2도' },
  sizes:  { n: '사이즈별 수량', re: /(?:^|[^A-Za-z])(?:XS|S|M|L|XL|XXL|2XL|3XL|FREE|F)(?![A-Za-z])\s*[:：(]?\s*\d|프리\s*사이즈|FREE|free|원\s*사이즈/, ex: 'S 50 / M 100 / L 100 / XL 50' },
  pos:    { n: '인쇄 위치', re: /위치|앞면|뒷면|가슴|등판|등\s|소매|왼쪽|오른쪽|중앙|가운데|밑단|상단|하단/, ex: '앞면 왼쪽 가슴 · 가로 80mm' },
  care:   { n: '케어라벨', re: /케어\s*라벨|세탁\s*라벨|품질\s*표시|라벨|택|tag/i, ex: '케어라벨 (옆선)' },
  stuff:  { n: '충전재', re: /솜|충전|PP\s*솜|펠렛|비즈|필링|cotton\s*fill/i, ex: 'PP 솜' },
  kc:     { n: 'KC 인증', re: /KC|어린이\s*제품|안전\s*확인|공급자\s*적합|인증/, ex: 'KC 인증 (어린이 제품 안전 확인)' },
  zip:    { n: '지퍼', re: /지퍼|쟈크|자크|YKK|zipper/i, ex: '5호 코일 지퍼 · 화이트 · D풀러' },
  zipDet: { n: '지퍼 사양', re: /\d\s*호|코일|금속\s*지퍼|메탈\s*지퍼|비슬론|풀러|지퍼\s*(?:색|컬러)/, ex: '5호 코일 · 화이트 · 풀러 모양' },
  strap:  { n: '손잡이·끈', re: /끈|손잡이|핸들|스트랩|웨빙|어깨|숄더|handle/i, ex: '손잡이 웨빙 25mm × 60cm' },
  lining: { n: '안감', re: /안감|홑겹|단겹|이중|lining/i, ex: '안감 없음 (홑겹)' },
  adjust: { n: '사이즈 조절', re: /스트랩|스냅|벨크로|찍찍이|버클|조절|밴드|사이즈\s*\d/, ex: '뒤 스냅백 조절' },
  mugMat: { n: '소재', re: /세라믹|도자기|본차이나|자기|유리|글라스|스테인|스텐|PP|트라이탄|PET|에나멜|법랑|대나무/i, ex: '세라믹 (화이트)' },
  cap:    { n: '용량', re: /\d+\s*(?:ml|mL|ML|㎖|oz|cc|L)(?![a-zA-Z])/, ex: '350ml' },
  food:   { n: '식품용 확인', re: /식품|식약처|기구\s*용기|식품용|food/i, ex: '식품용 기구 기준 적합' },
  hook:   { n: '연결 부속', re: /고리|후크|훅|카라비[너나]|랍스[터타]|D\s*링|O\s*링|버클|분리|클립|스냅/, ex: '랍스터 고리 + 분리 버클' },
  lmat:   { n: '소재', re: /폴리|나일론|새틴|면|코튼|웨빙|실리콘|가죽|PU/i, ex: '폴리 새틴' },
  smat:   { n: '소재', re: /EVA|PVC|극세사|퍼|고무|TPR|PU|면|폴리|밍크/i, ex: 'EVA 바닥 + 극세사 갑피' },
  hem:    { n: '마감', re: /오버록|바이어스|휘갑|마감|시접|프린지|술/, ex: '테두리 오버록 (화이트)' },
  grip:   { n: '부착 방식', re: /양면|테이프|3M|접착|부착|자석/, ex: '3M 양면 테이프' },
  wfab:   { n: '소재 (방식)', re: /평자수|자수|입체\s*자수|직조|인쇄\s*와펜|PVC\s*와펜|쉐닐|chenille/i, ex: '평자수 · 트윌 바탕' },
  wback:  { n: '뒷면', re: /열\s*접착|아이롱|벨크로|찍찍이|핀|스티커|접착|봉제|박음|안전핀/, ex: '열접착' },
  border: { n: '테두리', re: /메로우|새틴|레이저|컷\s*테두리|테두리/, ex: '메로우 3mm' },
  tinMat: { n: '소재', re: /양철|틴|알루미늄|tin/i, ex: '양철 (틴 플레이트)' },
  tinPr:  { n: '인쇄 방식', re: /옵셋|오프셋|UV|인쇄|각인|형압/, ex: '평판 옵셋 (성형 전)' },
  knit:   { n: '편직 · 가공', re: /자카드|편직|자수|인쇄|승화|프린트/, ex: '자카드 편직' },
  footSz: { n: '사이즈 (발 길이)', re: /\d{3}\s*(?:mm|~)|발\s*길이|사이즈\s*\d|FREE|프리/, ex: '230~250mm' },
  ltMat:  { n: '소재', re: /PU|PVC|사피아노|가죽|레더|leather/i, ex: 'PU (사피아노)' },
  ltPr:   { n: '가공', re: /박|형압|디보싱|엠보|각인|인쇄|UV|실크/, ex: '금박 + 형압' },
  magnet: { n: '자석', re: /자석|맥세이프|마그넷|magsafe/i, ex: '맥세이프 링 (N52)' },
  lbKind: { n: '라벨 종류', re: /목\s*라벨|케어|직조|인쇄\s*라벨|다마스크|새틴|면\s*라벨|고밀도/, ex: '다마스크 직조 목 라벨' },
  attach: { n: '다는 법', re: /사면|양면|박음|루프|맨하탄|접기|폴드|센터\s*폴드|엔드\s*폴드/, ex: '루프폴드 · 사면박이' },
  mat:    { n: '소재', re: /아크릴|PVC|실리콘|아연|황동|스테인|스텐|알루미늄|철|면|폴리|캔버스|나일론|가죽|PU|세라믹|유리|도자기|PET|PP|ABS|우드|나무|원목|종이|레진|에폭시|자석|EVA/i, ex: '소재 이름' }
};

/* ── 품목 종류 ── kw = 품목명에서 찾는 식. need = [칸, 단계(r 경고 · o 주의 · p 조언)] */
var TYPES = [
  { k: 'acrShaker', n: '아크릴 셰이커', g: '아크릴', kw: /셰이커|쉐이커|shaker/i, need: [['matAcr', 'r'], ['thick', 'r'], ['fill', 'r'], ['size', 'r'], ['print', 'o'], ['white', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'acrStand', n: '아크릴 스탠드', g: '아크릴', kw: /아크릴\s*스탠드|아크릴\s*스텐드|스탠드\s*아크릴|아크릴\s*디오라마|acrylic\s*stand/i, need: [['matAcr', 'r'], ['thick', 'r'], ['base', 'r'], ['size', 'r'], ['print', 'o'], ['side', 'o'], ['white', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'metalBadge', n: '메탈 뱃지', g: '금속', kw: /메탈\s*[뱃배]지|핀\s*[뱃배]지|금속\s*[뱃배]지|에나멜\s*[뱃배]지|enamel\s*pin|pin\s*badge/i, need: [['metal', 'r'], ['plate', 'r'], ['enamel', 'r'], ['pin', 'r'], ['size', 'r'], ['thick', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'canBadge', n: '캔뱃지', g: '금속', kw: /캔\s*[뱃배]지|핀\s*버튼|can\s*badge|button\s*badge/i, need: [['size', 'r'], ['canBack', 'r'], ['finish', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'metalKey', n: '메탈 키링', g: '금속', kw: /메탈\s*키\s*링|금속\s*키\s*링|메탈\s*키홀더/i, need: [['metal', 'r'], ['plate', 'r'], ['enamel', 'r'], ['ring', 'r'], ['size', 'r'], ['ringCol', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'pvcKey', n: 'PVC · 실리콘 키링', g: 'PVC·실리콘', kw: /(PVC|실리콘|러버|고무)\s*키\s*링|(PVC|실리콘|러버)\s*키홀더/i, need: [['pvc', 'r'], ['colors', 'o'], ['thick', 'o'], ['ring', 'r'], ['size', 'r'], ['ringCol', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'dollKey', n: '인형 키링', g: '봉제', kw: /인형\s*키\s*링|봉제\s*키\s*링|누이\s*키\s*링|마스코트\s*키\s*링|플러시\s*키\s*링/i, need: [['fabric', 'r'], ['size', 'r'], ['ring', 'r'], ['method', 'o'], ['stuff', 'o'], ['kc', 'o'], ['care', 'o'], ['ringCol', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'acrKey', n: '아크릴 키링', g: '아크릴', kw: /아크릴\s*키\s*링|아크릴\s*키홀더|아크릴\s*참|acrylic\s*key/i, need: [['matAcr', 'r'], ['thick', 'r'], ['ring', 'r'], ['size', 'r'], ['print', 'o'], ['side', 'o'], ['white', 'o'], ['hole', 'p'], ['ringCol', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'acr', n: '아크릴 (그 밖)', g: '아크릴', kw: /아크릴|포카\s*홀더|아크릴\s*블록|아크릴\s*집게|코스터/i, need: [['matAcr', 'r'], ['thick', 'r'], ['size', 'r'], ['print', 'o'], ['white', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'key', n: '키링 (소재 미상)', g: '키링', kw: /키\s*링|키홀더|keyring|key\s*ring/i, need: [['mat', 'r'], ['thick', 'r'], ['ring', 'r'], ['size', 'r'], ['print', 'o'], ['ringCol', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'sewlabel', n: '봉제 라벨', g: '봉제', kw: /봉제\s*라벨|직조\s*라벨|우븐\s*라벨|목\s*라벨|woven\s*label/i, need: [['lbKind', 'r'], ['size', 'r'], ['attach', 'o'], ['color', 'o'], ['qty', 'o']] },
  { k: 'wappen', n: '와펜', g: '봉제', kw: /와펜|자수\s*패치|패치|wappen|patch/i, need: [['wfab', 'r'], ['size', 'r'], ['wback', 'r'], ['border', 'o'], ['colors', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'tin', n: '틴케이스', g: '금속', kw: /틴\s*케이스|틴케이스|틴\s*박스|tin\s*case/i, need: [['tinMat', 'r'], ['size', 'r'], ['tinPr', 'r'], ['finish', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'socks', n: '양말', g: '의류', kw: /양말|socks/i, need: [['fabric', 'r'], ['footSz', 'r'], ['knit', 'r'], ['color', 'o'], ['kc', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'leather', n: '인조가죽 소품', g: '가죽', kw: /인조\s*가죽|가죽\s*소품|카드\s*지갑|카드\s*케이스|여권\s*케이스|leather/i, need: [['ltMat', 'r'], ['size', 'r'], ['ltPr', 'r'], ['color', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'magsafe', n: '맥세이프 카드 지갑', g: '가죽', kw: /맥세이프|magsafe/i, need: [['ltMat', 'r'], ['size', 'r'], ['magnet', 'r'], ['ltPr', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'doll', n: '인형', g: '봉제', kw: /인형|누이|plush|doll|봉제/i, need: [['fabric', 'r'], ['size', 'r'], ['method', 'o'], ['stuff', 'o'], ['color', 'o'], ['kc', 'o'], ['care', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'cloth', n: '의류', g: '의류', kw: /티셔츠|반팔|긴팔|맨투맨|후디|후드\s*티|후드\s*집업|집업|파자마|잠옷|반바지|긴바지|트레이닝|져지|저지\s*상의|t-?shirt|hoodie|sweatshirt/i, need: [['fabric', 'r'], ['color', 'r'], ['method', 'r'], ['sizes', 'r'], ['pos', 'o'], ['mix', 'o'], ['care', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'cap', n: '모자', g: '의류', kw: /모자|볼캡|버킷햇|비니|스냅백|cap|beanie/i, need: [['fabric', 'r'], ['color', 'r'], ['method', 'r'], ['adjust', 'o'], ['pos', 'o'], ['care', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'pouch', n: '파우치', g: '봉제', kw: /파우치|필통|pouch/i, need: [['fabric', 'r'], ['size', 'r'], ['method', 'r'], ['zip', 'r'], ['zipDet', 'o'], ['color', 'o'], ['lining', 'p'], ['care', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'bag', n: '가방', g: '봉제', kw: /에코백|토트백|가방|숄더백|크로스백|백팩|bag/i, need: [['fabric', 'r'], ['size', 'r'], ['method', 'r'], ['strap', 'o'], ['color', 'o'], ['lining', 'p'], ['care', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'fabricEtc', n: '담요 · 쿠션 · 타월', g: '봉제', kw: /담요|블랭킷|쿠션|타월|수건|손수건|반다나|스카프|blanket|cushion|towel/i, need: [['fabric', 'r'], ['size', 'r'], ['method', 'r'], ['hem', 'o'], ['color', 'o'], ['care', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'slipper', n: '슬리퍼', g: '봉제', kw: /슬리퍼|실내화|slipper/i, need: [['smat', 'r'], ['sizes', 'r'], ['method', 'o'], ['color', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'mug', n: '머그 · 컵 · 텀블러', g: '식기', kw: /머그|컵|텀블러|유리잔|글라스|보틀|mug|cup|tumbler/i, need: [['mugMat', 'r'], ['cap', 'r'], ['print', 'r'], ['color', 'o'], ['food', 'p'], ['pack', 'o'], ['qty', 'o']] },
  { k: 'lanyard', n: '랜야드 · 스트랩', g: '부자재', kw: /랜야드|렌야드|넥\s*스트랩|폰\s*스트랩|휴대폰\s*스트랩|lanyard/i, need: [['lmat', 'r'], ['size', 'r'], ['print', 'o'], ['hook', 'r'], ['color', 'o'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'grip', n: '스마트톡 · 그립톡', g: '플라스틱', kw: /스마트\s*톡|그립\s*톡|폰\s*그립|grip/i, need: [['mat', 'r'], ['size', 'r'], ['print', 'o'], ['grip', 'p'], ['qty', 'o'], ['pack', 'p']] },
  { k: 'etc', n: '그 밖의 상품', g: '기타', kw: /$^/, need: [['mat', 'r'], ['size', 'r'], ['print', 'o'], ['qty', 'o'], ['pack', 'p']] }
];
var TMAP = {}; TYPES.forEach(function (t) { TMAP[t.k] = t; });
function typeOf(s) { for (var i = 0; i < TYPES.length - 1; i++) if (TYPES[i].kw.test(s)) return TYPES[i].k; return ''; }

/* 칸이 비었을 때 해결 문구에 붙는 설명 */
var WHY = {
  matAcr: '아크릴 종류 (투명 · 유백 · 미러 · 글리터 · 오로라 …) 를 써야 원판을 고름',
  thick: '두께 (T · mm) 에 따라 단가 · 무게가 바뀜',
  ring: '고리 종류 (볼체인 · O링 · D링 · 랍스터 · 카라비너) 와 개수',
  print: '인쇄 방식 (UV · 실크 · 전사 …)',
  side: '단면 · 양면 · 이중 인쇄 (앞 컬러 + 화이트 + 뒤 컬러)',
  white: '투명 아크릴은 화이트 판 (백판) 이 없으면 색이 비침',
  base: '받침 크기 · 두께 · 꽂는 홈 위치',
  fill: '셰이커 안에 들어갈 파츠 · 글리터 종류와 양',
  metal: '아연합금 · 황동 · 철 · 스테인리스 중 무엇인지',
  plate: '도금 색 (골드 · 실버 · 블랙 니켈 · 로즈 골드) 과 유광 · 무광',
  enamel: '하드 · 소프트 에나멜, 에폭시, 인쇄 중 무엇으로 색을 넣는지',
  pin: '잠금 종류 (나비 클러치 · 고무 클러치 · 자석) 와 핀 개수',
  canBack: '뒷면 부속 (안전핀 · 자석 · 미러 · 병따개 · 키링)',
  pvc: '소프트 PVC · 실리콘 중 무엇인지',
  colors: '사출 · 몰딩 컬러 수와 PANTONE 번호',
  fabric: '원단 이름 · 두께 (수 · oz · 털 길이)',
  method: '실크 · 나염 · DTP · 전사 · 자수 등 방식과 도수',
  sizes: '사이즈마다 수량 (예: S 50 / M 100)',
  care: '케어라벨 · 품질 표시 위치와 내용',
  kc: '어린이 사용 가능 제품이면 KC 인증 대상',
  zip: '지퍼 유무 · 위치',
  zipDet: '지퍼 호수 · 종류 · 색 · 풀러',
  mugMat: '세라믹 · 유리 · 스테인리스 등',
  cap: '용량 (ml)',
  hook: '끝 부속 (랍스터 고리 · D링 · 분리 버클)',
  food: '음식이 닿는 면이면 식품용 기구 기준 확인',
  mat: '소재 이름'
};

/* ── 오탈자 · 표기 ── [틀린 표기 식, 바른 표기, 'r'=오탈자 'p'=조언(표기 통일)] */
var TYPO = [
  [/아크랄|악크릴|아크릴릭(?!\s*물감)|아크린/g, '아크릴', 't'], [/키랑|킹링|키린그|키잉/g, '키링', 't'], [/볼채인|볼췌인|볼 채인/g, '볼체인', 't'],
  [/카라비나/g, '카라비너', 't'], [/랍스타/g, '랍스터', 't'], [/스테인레스|스텐레스|스테인래스/g, '스테인리스', 't'], [/에나맬|에나매|애나멜/g, '에나멜', 't'],
  [/레이져/g, '레이저', 't'], [/컷팅/g, '커팅', 't'], [/실리컨|씰리콘/g, '실리콘', 't'], [/홀로그렘|홀로그래|홀러그램/g, '홀로그램', 't'], [/글리타|그리터/g, '글리터', 't'],
  [/쉐이커/g, '셰이커', 't'], [/스텐드|스탠더/g, '스탠드', 't'], [/렌야드|랜야트/g, '랜야드', 't'], [/짚퍼|지펴|쟈크|자크(?![가-힣])/g, '지퍼', 't'], [/싸이즈|사이스/g, '사이즈', 't'],
  [/두깨|두꼐/g, '두께', 't'], [/수랑/g, '수량', 't'], [/부자제/g, '부자재', 't'], [/재잴|재짙/g, '재질', 't'], [/도굼|도긍/g, '도금', 't'], [/패톤|펜톤|팬턴/g, '팬톤', 't'],
  [/폴리에스테르/g, '폴리에스터', 'p'], [/후드티/g, '후디', 'p'], [/오링/g, 'O링', 'p'], [/디링/g, 'D링', 'p'], [/스텐(?![드실])/g, '스테인리스', 'p'], [/맨투멘/g, '맨투맨', 't'], [/티샤츠|티셔쯔/g, '티셔츠', 't'],
  [/뱃찌|벳지|빼지/g, '뱃지', 't'], [/key\s?ling|keyirng|kyering/gi, 'keyring', 't'], [/acrylik|acryllic|arcylic/gi, 'acrylic', 't'], [/badeg|bagde/gi, 'badge', 't'], [/stiker|stickre/gi, 'sticker', 't'], [/pouc(?!h)|poutch/gi, 'pouch', 't'], [/hologram{2}|holgram/gi, 'hologram', 't'], [/lanyrad|laynard/gi, 'lanyard', 't'], [/코팅지/g, '코팅지', ''], [/미싱/g, '미싱', ''], [/칼라(?![비])/g, '컬러', 'p'], [/쿳션/g, '쿠션', 't'], [/파우취/g, '파우치', 't']
];

/* ── 줄 → 라벨/값 ── */
var LAB = /^\s*[-·•▶■□●◆*]?\s*([가-힣A-Za-z][가-힣A-Za-z0-9 ·/()]{0,14}?)\s*[:：]\s*(.*)$/;
var EMPTY = /^\s*(?:-|—|–|\?|？|x|X|미정|추후|TBD|tbd|확인\s*필요|협의|빈칸|없음\s*\?)?\s*$/;
var TBD = /미정|추후\s*(?:결정|확정|전달)|TBD|확인\s*필요|협의\s*(?:예정|필요)|\?\?|(?:^|\s)\?(?:\s|$)/;
/* 라벨 글자 → 칸 */
var LABF = [
  [/소재|재질|원단|원자재|material/i, ['matAcr', 'metal', 'pvc', 'fabric', 'mugMat', 'lmat', 'smat', 'mat']], [/두께|thick/i, ['thick']], [/부자재|고리|링|체인|부속/, ['ring', 'hook', 'canBack']],
  [/수량|qty|수 량/i, ['qty']], [/사이즈|크기|규격|치수|size/i, ['size']], [/인쇄|가공|방식|print/i, ['print', 'method', 'enamel']], [/포장|pack/i, ['pack']], [/도금|plating/i, ['plate']],
  [/잠금|핀|침|뒷면|후면/, ['pin', 'canBack']], [/컬러|색상|color/i, ['color', 'colors']], [/용량/, ['cap']], [/지퍼/, ['zip', 'zipDet']], [/받침|베이스/, ['base']], [/마감/, ['finish', 'hem']]
];
function labFields(l) { for (var i = 0; i < LABF.length; i++) if (LABF[i][0].test(l)) return LABF[i][1]; return []; }

var HEAD_NAME = /^(?:품목|품명|상품명|제품명|아이템|item|product)\s*$/i;
var FIELD_WORD = /구멍|고리|두께|소재|재질|사이즈|크기|수량|인쇄|포장|도금|핀|침|부자재|원단|컬러|색상|위치|받침|용량|지퍼|라벨|마감|체인|링\s*\d/;
var NUM_HEAD = /^\s*(?:\d{1,2}\s*[.)]|\[\s*\d{1,2}\s*\]|[■●▶◆□#]|\(\s*\d{1,2}\s*\))\s*/;

/* 글 → 품목 구역 */
function split(text) {
  var lines = String(text || '').replace(/\r/g, '').split('\n'), secs = [], cur = { name: '', head: '', lines: [], start: 1, common: true };
  function push() { if (cur.lines.length || cur.name) secs.push(cur); }
  lines.forEach(function (raw, i) {
    var l = raw.replace(/\t/g, '  ').replace(/\s+$/, ''); if (!l.trim()) { cur.lines.push({ t: '', n: i + 1 }); return; }
    var m = l.match(LAB), nm = '';
    if (m && HEAD_NAME.test(m[1].trim()) && m[2].trim()) nm = m[2].trim();
    else if (!m && l.trim().length <= 40 && typeOf(l) && !F.thick.re.test(l) && !F.size.re.test(l) && !(typeOf(l) === 'acr' && MAT_ACR.test(l)) && !FIELD_WORD.test(l.replace(typeOf(l) ? TMAP[typeOf(l)].kw : /$^/, ''))) nm = l.replace(NUM_HEAD, '').trim();
    else if (NUM_HEAD.test(l) && typeOf(l) && !m) nm = l.replace(NUM_HEAD, '').trim();
    if (nm) { push(); cur = { name: nm, head: l.trim(), lines: [], start: i + 1, common: false }; cur.lines.push({ t: l, n: i + 1, head: 1 }); return; }
    cur.lines.push({ t: l, n: i + 1 });
  });
  push();
  return secs.map(function (s) { s.lines = s.lines.filter(function (x) { return x.t.trim(); }); return s; }).filter(function (s) { return s.lines.length; });
}

/* 구역 하나 읽기 */
function parse(sec) {
  var labs = [], vals = [], all = [];
  sec.lines.forEach(function (x) {
    all.push(x.t);
    var m = x.head ? null : x.t.match(LAB);
    if (m) { var lb = { l: m[1].trim(), v: m[2].trim(), n: x.n, f: labFields(m[1]) }; labs.push(lb); if (!EMPTY.test(m[2])) vals.push({ t: m[2].trim(), n: x.n, lab: lb }); }
    else vals.push({ t: x.t, n: x.n });
  });
  return { labs: labs, vals: vals, text: vals.map(function (v) { return v.t; }).join('\n'), raw: all.join('\n') };
}
function show(t) { t = String(t).trim(); return t.length > 40 ? t.slice(0, 38) + '…' : t; }
function findF(fk, P) {
  var f = F[fk]; if (!f) return null;
  var NUMF = { thick: 1, size: 1, qty: 1, cap: 1 };
  for (var i = 0; i < P.vals.length; i++) {
    var V = P.vals[i], t = V.t, m = t.match(f.re), lab = V.lab && V.lab.f.indexOf(fk) >= 0;
    if (!m && lab && NUMF[fk] && /\d/.test(t)) m = [t];
    if (m) return { v: show(V.lab ? t : t.length > 36 ? m[0] : t), line: V.n };
  }
  return null;
}

/* ── PLYSH 작업지시서 양식 (도구 > 작업지시서 양식) 읽기 ── */
var TSEC = /^(가이드별색|소재 세부|소재|인쇄 · 가공|컬러|치수(?:\s*\([^)]*\))?|부자재|포장|발주 전 확인|작성 주의사항)\s*(필수|권장|필독.*)?$/;
var TPL_K = [[/아크릴\s*키링/, 'acrKey'], [/아크릴\s*스탠드/, 'acrStand'], [/셰이커/, 'acrShaker'], [/메탈\s*뱃지/, 'metalBadge'], [/메탈\s*키링/, 'metalKey'], [/캔\s*뱃지/, 'canBadge'], [/틴/, 'tin'], [/PVC|실리콘/i, 'pvcKey'],
  [/인형\s*키링/, 'dollKey'], [/인형/, 'doll'], [/와펜/, 'wappen'], [/파우치/, 'pouch'], [/가방|에코백/, 'bag'], [/담요|쿠션|타월/, 'fabricEtc'], [/의류|티셔츠|맨투맨|후디|파자마/, 'cloth'], [/모자/, 'cap'],
  [/양말/, 'socks'], [/슬리퍼/, 'slipper'], [/인조\s*가죽/, 'leather'], [/맥세이프/, 'magsafe'], [/머그|텀블러/, 'mug'], [/랜야드|스트랩/, 'lanyard'], [/스마트\s*톡|그립/, 'grip'], [/봉제\s*라벨|라벨/, 'sewlabel']];
function isTpl(t) { var n = 0; String(t || '').split('\n').forEach(function (l) { if (TSEC.test(l.trim())) n++; }); return n >= 4 && /^\s*품목\s*$/m.test(t); }
function blank(t) { t = String(t || '').replace(/PANTONE\s*C\s*\(\s*\)/gi, '').replace(/원단\s*스와치\s*번호/g, '').replace(/mm|cm|ml|gsm|oz/gi, ''); for (var i = 0; i < 3; i++) t = t.replace(/(^|[\s·(\/])(?:g|T|개|수|색|호)(?=$|[\s·)\/])/g, '$1'); return !t.replace(/[\s·()\/×x~:：\-↑]/g, ''); }
function opts(v) { if (!/[■□]/.test(v)) return null; var sel = [], uns = []; v.split(/(?=[■□])/).forEach(function (p) { p = p.trim(); if (!p || !/^[■□]/.test(p)) return; var t = p.slice(1).trim(); (p[0] === '■' ? sel : uns).push(t); }); return { sel: sel, uns: uns }; }
function nums(v) { return (String(v).match(/\d+(?:\.\d+)?/g) || []).map(parseFloat); }
function tsplit(text) {
  var L = String(text || '').replace(/\r/g, '').split('\n'), docs = [], d = null, sec = null, hdr = [];
  for (var i = 0; i < L.length; i++) {
    var l = L[i].trim(); if (!l || /^[—\-]{4,}$/.test(l)) continue;
    if (/^\[[^\]]*\]/.test(l) && d) { d = null; sec = null; hdr = []; }
    if (l === '품목' && i + 1 < L.length) { d = { name: L[i + 1].trim(), start: i + 1, hdr: hdr, secs: [], memo: '' }; hdr = []; docs.push(d); sec = null; i++; continue; }
    if (!d) { hdr.push({ t: l, n: i + 1 }); continue; }
    var mm = l.match(/^도면 메모\s*[:：]\s*(.*)$/); if (mm) { d.memo += (d.memo ? ' · ' : '') + mm[1]; continue; }
    var m = l.match(TSEC);
    if (m) { sec = { k: m[1].replace(/\s*\(.*$/, ''), full: m[1], req: m[2] && /필수/.test(m[2]) ? 'r' : m[2] && /권장/.test(m[2]) ? 'p' : '', n: i + 1, lines: [] }; d.secs.push(sec); continue; }
    if (!sec) continue;
    var last = sec.lines[sec.lines.length - 1];
    if (/^[□■]/.test(l) && last && (last.lab || /[■□]/.test(last.v)) && sec.k !== '발주 전 확인') { last.v += ' ' + l; continue; }
    var lm = l.match(/^([^■□●�:：]{1,30}?)\s*[:：]\s*(.*)$/) || (sec.k === '치수' ? l.match(/^(.*?\S)\s+((?:[\d.,×x~·\s]*)mm)$/) : null);
    sec.lines.push(lm ? { lab: lm[1].trim(), v: lm[2].trim(), n: i + 1 } : { lab: '', v: l.replace(/^[●�]\s*/, ''), n: i + 1, raw: l });
  }
  return docs;
}
/* 칸 하나 → 값 · 빈 칸 */
function cell(sec, x) {
  var o = opts(x.v), val, empty;
  if (o) { var real = o.sel.filter(function (t) { return !blank(t); }); val = real.join(' · '); empty = !real.length; }
  else { val = x.v; empty = blank(x.v) || (sec.k === '치수' && !/\d/.test(x.v)); }
  if (sec.k === '컬러') { empty = /^PANTONE\s*C\s*\(\s*\)$/i.test(x.v) || blank(x.v); }
  return { lab: x.lab || sec.k, v: val, empty: empty, o: o, n: x.n };
}
/* 숫자 기준 (작업지시서 양식 '작성 주의사항' + 인쇄파일 검수기 기준을 상품에 맞춤) */
function numRules(C, tk, sel, add) {
  var get = function (re) { for (var i = 0; i < C.length; i++) if (re.test(C[i].lab) && !C[i].empty) { var ns = nums(C[i].v); if (ns.length) return { ns: ns, c: C[i] }; } return null; };
  C.forEach(function (c) {
    if (c.empty) return; var ns = nums(c.v); if (!ns.length) return;
    var th = c.lab.match(/\((?:[^)]*?\s)?(\d+(?:\.\d+)?)\s*mm\s*↑/), rg = c.lab.match(/\((?:[^)\d]*)(\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)\s*mm\)/);
    if (th && ns[0] < +th[1]) add('r', c.lab.replace(/\s*\(.*$/, '') + ' 기준보다 작음', c.lab + ' · ' + ns[0] + 'mm', '권장 ' + th[1] + 'mm 이상', c.n);
    else if (rg && (ns[0] < +rg[1] || ns[0] > +rg[2])) add('o', c.lab.replace(/\s*\(.*$/, '') + ' 범위 밖', c.lab + ' · ' + ns[0] + 'mm', '권장 ' + rg[1] + '~' + rg[2] + 'mm', c.n);
  });
  var W = get(/^(?:완성\s*)?가로|^본체 가로|^가로 · 세로|^완성 가로|^지름/), H = get(/^세로/), long = W ? Math.max.apply(null, W.ns.concat(H ? H.ns : [])) : 0;
  var hp = get(/구멍 위치|구멍.*끝에서/), cm = get(/칼선 여백/), hole = get(/고리 구멍(?: 지름)?/);
  if (/^acr/.test(tk)) {
    if (cm && cm.ns[0] < 2) add('r', '칼선 여백 좁음', '칼선 여백 ' + cm.ns[0] + 'mm', ['인쇄는 칼선 2mm 안쪽까지 (UV 까짐)', '권장 2mm 이상'], cm.c.n);
    if (hp && hp.ns[0] < 2) add('r', '고리 구멍이 끝에 붙음', '구멍 위치 끝에서 ' + hp.ns[0] + 'mm', '권장 칼선 끝에서 2mm 이상 안쪽', hp.c.n);
    if (hole && hole.ns[0] < 2) add('o', '고리 구멍이 작음', '구멍 지름 ' + hole.ns[0] + 'mm', '권장 지름 2.5~3mm 이상 (고리 · 볼체인 통과)', hole.c.n);
  }
  if (tk === 'acrKey' && long && long < 25) add('o', '키링이 작음', '긴 변 ' + long + 'mm', '권장 긴 변 25~30mm 이상', W.c.n);
  if (tk === 'acrStand' && W && Math.max.apply(null, W.ns) < 50) add('o', '스탠드 본체가 작음', '본체 긴 변 ' + Math.max.apply(null, W.ns) + 'mm', '권장 50mm 이상 (작으면 흔들림)', W.c.n);
  var tab = get(/^탭 폭/); if (tk === 'acrStand' && tab && W && tab.ns[0] < W.ns[0] / 3) add('o', '탭 폭 좁음', '탭 폭 ' + tab.ns[0] + 'mm · 본체 가로 ' + W.ns[0] + 'mm', '권장 본체 가로의 1/3 이상', tab.c.n);
  var ly = get(/층별 두께/); if (tk === 'acrShaker' && ly && ly.ns.some(function (v) { return v < 1 || v > 3; })) add('o', '층 두께 범위 밖', '층별 두께 ' + ly.ns.join(' · ') + 'mm', '권장 층마다 1~3mm', ly.c.n);
  if (tk === 'metalBadge' && long) {
    if (long <= 20) add('p', '작은 메탈 뱃지', '긴 변 ' + long + 'mm', '20mm 이하는 글자 · 색 칸이 거의 못 들어감 · 디자인 단순하게', W.c.n);
    if (long >= 25 && /(?:^|·\s*)1\s*개/.test(sel.pins || '')) add('p', '큰 뱃지에 침 1개', '긴 변 ' + long + 'mm · 침 1개', '권장 침 2개 (25mm 이상 · 가로 긴 뱃지 · 돌아감 방지)');
  }
  var cd = get(/완성 지름/), sa = get(/안전 영역/);
  if (tk === 'canBadge' && cd) { if ([25, 32, 38, 44, 50, 56, 58, 75].indexOf(cd.ns[0]) < 0) add('p', '캔뱃지 규격 아님', '완성 지름 ' + cd.ns[0] + 'mm', ['권장 규격 32 · 38 · 44 · 58 · 75mm', '업체 몰드 규격 확인'], cd.c.n); if (sa && sa.ns[0] > cd.ns[0] - 6) add('o', '캔뱃지 안전 영역 넓음', '안전 영역 ' + sa.ns[0] + 'mm · 완성 ' + cd.ns[0] + 'mm', '권장 완성 지름 − 약 6mm', sa.c.n); }
  if (tk === 'wappen' && long && long < 25 && /메로우/.test(sel.all || '')) add('o', '메로우 와펜이 작음', '크기 ' + long + 'mm · 메로우 테두리', '권장 메로우는 25~30mm 이상 · 단순한 모양만', W.c.n);
  var vis = get(/보이는 크기/), full = get(/전체 크기/);
  if (tk === 'sewlabel' && vis && full && Math.max.apply(null, full.ns) < Math.max.apply(null, vis.ns)) add('r', '라벨 전체 크기가 더 작음', '보이는 크기 ' + vis.c.v + ' · 전체 크기 ' + full.c.v, '전체 크기 = 보이는 크기 + 접는 여유 · 시접', full.c.n);
  var ex = get(/^전개/), fin = get(/^완성 가로/);
  if (tk === 'leather' && ex && fin && Math.max.apply(null, fin.ns) > Math.max.apply(null, ex.ns)) add('r', '완성 크기가 전개 크기보다 큼', '전개 ' + ex.c.v + ' · 완성 ' + fin.c.v, '전개 · 완성 크기 바꿔 적었는지 확인', fin.c.n);
  var ms = get(/^전체/); if (tk === 'magsafe' && ms && ms.ns.length >= 2) { var a = Math.min(ms.ns[0], ms.ns[1]), b = Math.max(ms.ns[0], ms.ns[1]); if (a < 63 || a > 65 || b < 95 || b > 97) add('o', '맥세이프 지갑 크기 확인', '전체 ' + ms.c.v, '권장 약 63~65 × 95~97mm (휴대폰 뒷면)', ms.c.n); }
  // 정수 mm
  C.forEach(function (c) { if (c.sec !== '치수' || c.empty || /0\.\d\s*mm\s*↑|0\.\d\s*~/.test(c.lab)) return; if (/\d\.\d/.test(c.v) && !/\d\.5(?!\d)/.test(c.v)) add('p', '치수 소수점', c.lab + ' · ' + c.v, '권장 정수 mm (0.5는 올림)', c.n); });
}
/* 양식 한 장 → 품목 구역 (검사용 P 는 고른 값만) */
function tplSec(d) {
  var tk = ''; for (var i = 0; i < TPL_K.length; i++) if (TPL_K[i][0].test(d.name)) { tk = TPL_K[i][1]; break; }
  var labs = [], vals = [], C = [], skip = { '가이드별색': 1, '발주 전 확인': 1, '작성 주의사항': 1 };
  d.secs.forEach(function (sec) {
    if (skip[sec.k]) return;
    sec.cells = sec.lines.map(function (x) { var c = cell(sec, x); c.sec = sec.k; c.req = sec.req; C.push(c); return c; });
    sec.cells.forEach(function (c) { var lb = { l: c.lab, v: c.empty ? '' : c.v, n: c.n, f: labFields(c.lab) }; labs.push(lb); if (!c.empty) vals.push({ t: (c.lab !== sec.k ? c.lab + ': ' : sec.k === '소재' ? '소재: ' : '') + c.v, n: c.n, lab: lb }); });
  });
  var P = { labs: labs, vals: vals, text: vals.map(function (v) { return v.t; }).join('\n') };
  P.raw = d.name + '\n' + P.text;
  return { name: d.name, head: d.name, start: d.start, lines: [], tpl: d, tk: tk || typeOf(d.name), P: P, C: C };
}
function tplChecks(s, g, tk, add) {
  var d = s.tpl, C = s.C, sel = { all: s.P.text, pins: (C.filter(function (c) { return /침 개수/.test(c.lab); })[0] || {}).v };
  // 머리글
  var hd = d.hdr.map(function (x) { return x.t; }).join(' ');
  if (/\[\s*아티스트\s*\]|프로젝트 이름/.test(hd)) add('r', '머리글 그대로', '"[아티스트] 프로젝트 이름" 안 바꿈', '아티스트 · 프로젝트 이름 넣기', '머리글');
  if (/작성자 이름|연락처/.test(hd) && /작성자 이름 · 연락처|작성자 이름\s*$/.test(hd)) add('o', '작성자 · 연락처 없음', '"작성자 이름 · 연락처" 그대로', '작성자 이름 · 연락처 넣기 (업체 문의용)', '머리글');
  if (!d.hdr.length) add('o', '머리글 없음', '아티스트 · 프로젝트 · 작성자 줄이 없음', '양식 맨 위 머리글 채우기', '머리글');
  // 칸마다
  d.secs.forEach(function (sec) {
    if (sec.k === '가이드별색') return;
    if (sec.k === '작성 주의사항') { add('o', '작성 주의사항 안 지움', '"작성 주의사항 · 읽고 삭제" 칸이 남아 있음', '읽고 지운 뒤 업체에 보내기', sec.k); return; }
    if (sec.k === '발주 전 확인') {
      var un = sec.lines.filter(function (x) { return /^□/.test((x.raw || x.v).trim()) || /^□/.test(x.v); }).map(function (x) { return x.v.replace(/^[□■]\s*/, ''); });
      if (un.length) add('p', '발주 전 확인 ' + un.length + '개 체크 안 함', un, '확인한 항목은 ■ 로 바꾸기', sec.k);
      return;
    }
    var cells = sec.cells || [], fill = cells.filter(function (c) { return !c.empty; });
    var ph = sec.k === '컬러' ? cells.filter(function (c) { return !/^PANTONE\s*C\s*\(\s*\)$/i.test(c.v); }) : cells;
    if (sec.k === '컬러') {
      var exa = cells.filter(function (c) { return /PANTONE\s*231\s*C\s*\(\s*백그라운드 판\s*\)/i.test(c.v); });
      if (exa.length) add('o', '양식 예시 색 그대로', '"PANTONE 231C (백그라운드 판)" 안 바꿈', '실제 색 번호 · 쓰는 곳으로 바꾸기 · 안 쓰면 지우기', exa[0].n);
      var real = cells.filter(function (c) { return !c.empty && !/백그라운드 판/.test(c.v); });
      g.fields.push(real.length ? { k: 'col', n: '컬러', v: show(real.map(function (c) { return c.v.replace(/\s*\(\s*\)$/, ''); }).join(' · ')) } : { k: 'col', n: '컬러', miss: 1, lv: sec.req || 'p' });
      if (!real.length && sec.req) add(sec.req, '컬러 칸 비어 있음', '별색 번호 없음', ['PANTONE 번호 · C/U · 쓰는 곳 넣기', '예: PANTONE 186 C (글자)'], sec.k);
      return;
    }
    var empt = cells.filter(function (c) { return c.empty; });
    var nm = sec.k === '소재 세부' ? '소재 세부' : sec.k;
    var sum = fill.map(function (c) { return (c.lab !== sec.k ? c.lab.replace(/\s*\(.*$/, '') + ' ' : '') + c.v; }).join(' · ');
    if (!fill.length) g.fields.push({ k: sec.k, n: nm, miss: 1, lv: sec.req || 'p' });
    else g.fields.push({ k: sec.k, n: nm, v: show(sum) + (empt.length ? ' (빈 칸 ' + empt.length + ')' : ''), lv: empt.length ? (sec.req === 'r' ? 'o' : '') : '' });
    if (empt.length && sec.req) {
      var opt = empt.some(function (c) { return c.o; });
      add(sec.req, nm + ' 빈 칸 ' + empt.length + '개', empt.map(function (c) { return c.lab + (c.o && c.o.sel.length ? ' (■ 뒤 값 없음)' : ''); }).join(' · '), sec.k === '치수' ? ['정수 mm로 채우기 (0.5 올림)', '안 쓰는 칸이면 지우기'] : opt ? ['쓰는 것을 ■ 로 고르고 값 넣기', '안 쓰는 줄이면 지우기'] : ['값 넣기'], empt[0].n);
    }
    // 하나만 골라야 하는 칸에 여러 개
    cells.forEach(function (c) {
      if (!c.o || c.o.sel.filter(function (t) { return !blank(t); }).length < 2) return;
      if (/두께|인쇄면|화이트|도금|침 개수|핏|방식|^고리$|고리 색|종류|모양|클러치$|^소재$/.test(c.lab)) add('o', c.lab + ' 여러 개 고름', c.lab + ': ' + c.v, '하나만 ■ · 부위가 다르면 부위 이름 같이', c.n);
    });
  });
  // 화이트 없음 + 투명 소재
  var wh = C.filter(function (c) { return /^화이트/.test(c.lab) && !c.empty; })[0], mt = C.filter(function (c) { return c.sec === '소재' && !c.empty; })[0];
  if (/^acr/.test(tk) && wh && /없음/.test(wh.v) && mt && /투명|글리터|홀로|미러|오로라/.test(mt.v)) add('p', '화이트 판 없음', '소재 ' + mt.v + ' · 화이트 없음', '투명 · 글리터 위 컬러는 비침 · 의도한 거면 통과', wh.n);
  // 도면 치수 그대로
  if (/(?:^|·\s)(?:가로|세로|높이|지름|폭)\s*mm(?:\s|·|$)|아크릴\s*T(?:\s|·|$)/.test(d.memo)) add('p', '도면 치수 표기 비어 있음', '도면에 "가로 mm" · "세로 mm" 같은 빈 치수', '도면 치수선에 숫자 넣기', '도면');
  numRules(C, tk, sel, add);
}

/* 글자 · 선 최소 (방식별) — 글로 쓴 작업지시서에도 */
function minRules(tx, tk, add) {
  var emb = /자수/.test(tx), fur = /밍크|보아|장모/.test(tx);
  var re = /(글자|텍스트|문구|레터링|선|획|금속선|박\s*글자|형압\s*글자)\s*(?:높이|크기|굵기|두께|폭)?\s*[:：]?\s*(?:최소\s*)?(\d+(?:\.\d+)?)\s*mm/g, m;
  while ((m = re.exec(tx))) {
    var w = m[1].replace(/\s/g, ''), v = parseFloat(m[2]), min = 0, why = '';
    if (/선|획/.test(w)) { if (/^metal/.test(tk) || w === '금속선') { min = 0.3; why = '금속선 0.3mm 이상 (얇으면 끊김)'; } else if (tk === 'pvcKey') { min = 1; why = 'PVC 획 1mm 이상'; } }
    else if (/박/.test(w)) { min = 2; why = '박 글자 2mm 이상'; }
    else if (/형압/.test(w)) { min = 3; why = '형압 글자 3mm 이상'; }
    else if (emb || tk === 'wappen') { min = fur ? 10 : tk === 'wappen' ? 5 : 6; why = fur ? '밍크 · 보아 위 자수 글자 10mm 이상' : tk === 'wappen' ? '평자수 글자 5mm 이상' : '자수 글자 6mm 이상 (뭉개짐)'; }
    else if (tk === 'pvcKey') { min = 3; why = 'PVC 글자 3mm 이상'; }
    else if (tk === 'sewlabel') { min = 2; why = '라벨 글자 2mm 이상'; }
    if (min && v < min) add('r', /선|획/.test(w) ? '선이 너무 가늘음' : '글자가 너무 작음', m[0].trim(), '권장 ' + why);
  }
}

var LV = { t: ['오탈자', '#e0263a', '수정함'], r: ['경고', '#e0263a', '수정함'], o: ['주의', '#ff7300', '확인함'], p: ['조언', '#6546b9', '확인'] };

function check(text, opt) {
  opt = opt || {};
  var TPL = isTpl(text), secs = TPL ? tsplit(text).map(tplSec) : split(text), common = null, groups = [], items = [], pass = [], manual = [];
  /* 품목 이름 없는 앞부분 = 공통 정보 (포장 · 납기 · 아티스트 등) */
  if (secs.length > 1 && secs[0].common) common = secs.shift();
  if (secs.length === 1 && secs[0].common) { var s0 = secs[0], k0 = typeOf(s0.lines.map(function (x) { return x.t; }).join(' ')); s0.name = s0.name || (k0 ? TMAP[k0].n : '상품'); }
  var CP = common ? parse(common) : null;
  secs.forEach(function (s, gi) {
    var P = s.P || parse(s), ov = (opt.types || {})[gi], tk = ov || s.tk || typeOf(s.name) || typeOf(P.raw) || 'etc', T = TMAP[tk] || TMAP.etc;
    var g = { i: gi, name: s.name || T.n, type: tk, tn: T.n, line: s.start, fields: [], n: { t: 0, r: 0, o: 0, p: 0 } };
    var where = function (ln) { return g.name + (ln ? ' · ' + ln + '줄' : ''); };
    var add = function (lv, title, prob, fix, ln) { var it = { g: gi, lv: lv, where: typeof ln === 'string' ? g.name + ' · ' + ln : where(ln), title: title, prob: [].concat(prob), fix: [].concat(fix) }; items.push(it); g.n[lv]++; };

    /* 1) 꼭 들어가야 할 칸 — 양식이면 양식 칸 그대로, 아니면 품목별 필수 칸 */
    if (s.tpl) tplChecks(s, g, tk, add);
    else T.need.forEach(function (nd) {
      var fk = nd[0], lv = nd[1], f = F[fk], hit = findF(fk, P), lab = P.labs.filter(function (l) { return l.f.indexOf(fk) >= 0; })[0];
      if (!hit && fk === 'pack' && CP) hit = findF('pack', CP);
      if (!hit && fk === 'qty' && CP) hit = findF('qty', CP);
      if (fk === 'kc' && /어린이|아동|키즈|kids|유아/i.test(P.raw)) lv = 'r';
      if (fk === 'white' && !hit) { // 투명 · 미러 · 오로라 아크릴일 때만 화이트 판 필요
        if (/불투명|유백/.test(P.text)) { g.fields.push({ k: fk, n: f.n, skip: '해당 없음 (불투명 소재)' }); return; }
        if (!/투명|미러|거울|오로라|홀로|글리터|반투명|프로스트|형광/.test(P.text)) lv = 'p';
      }
      if (fk === 'matAcr' && !hit && f.loose.test(s.name + P.text)) { // '아크릴'만 있고 종류가 없음
        var lm = findF('mat', P);
        g.fields.push({ k: fk, n: f.n, v: '아크릴 (종류 없음)', line: lm && lm.line, lv: 'o' });
        add('o', '아크릴 종류 없음', '소재에 "아크릴"만 있음', ['아크릴 종류 추가 · 권장 투명 · 유백 · 미러 · 글리터 · 오로라 중 하나', '예: ' + f.ex], lm && lm.line);
        return;
      }
      if (!hit && lab && !EMPTY.test(lab.v) && !{ thick: 1, size: 1, qty: 1, cap: 1 }[fk]) hit = { v: show(lab.v), line: lab.n }; // 라벨 칸에 적힌 값은 인정 (숫자 칸은 숫자 필요)
      if (hit) { g.fields.push({ k: fk, n: f.n, v: hit.v, line: hit.line }); return; }
      g.fields.push({ k: fk, n: f.n, miss: 1, lv: lv });
      var emptyLab = lab && EMPTY.test(lab.v);
      add(lv, f.n + (emptyLab ? ' 칸 비어 있음' : ' 없음'),
        emptyLab ? '"' + lab.l + '" 칸에 값이 없음' + (lab.v ? ' (' + lab.v + ')' : '') : T.n + ' 작업지시서에 ' + f.n + ' 표기 없음',
        [f.n + ' 추가' + (WHY[fk] ? ' · ' + WHY[fk] : ''), '예: ' + f.ex], emptyLab ? lab.n : 0);
    });

    /* 2) 서로 안 맞는 값 */
    var tx = P.raw;
    // 품목명 소재 vs 소재 칸
    var matLab = P.labs.filter(function (l) { return /소재|재질/.test(l.l) && !EMPTY.test(l.v); })[0];
    if (matLab) {
      var nameG = /아크릴/.test(s.name) ? '아크릴' : /PVC|실리콘|러버/i.test(s.name) ? 'PVC' : /메탈|금속/.test(s.name) ? '금속' : '';
      var valG = /아크릴/.test(matLab.v) ? '아크릴' : /PVC|실리콘|러버/i.test(matLab.v) ? 'PVC' : /아연|황동|철|스테인|스텐|알루미늄|메탈/.test(matLab.v) ? '금속' : '';
      if (nameG && valG && nameG !== valG) add('r', '품목명과 소재 다름', '품목명 "' + s.name + '" · 소재 칸 "' + matLab.v + '"', ['둘 중 맞는 쪽으로 통일', '품목명 = 실제 소재'], matLab.n);
    }
    // 두께 두 가지 (받침 · 베이스 줄은 빼고)
    var th = []; P.vals.forEach(function (v) { if (/받침|베이스|바닥|base|받침대|포장|박스|대지/i.test(v.t)) return; var re = /(\d+(?:\.\d+)?)\s*(?:T|t)(?![a-zA-Z가-힣])|두께\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?/g, m; while ((m = re.exec(v.t))) th.push({ v: parseFloat(m[1] || m[2]), n: v.n }); });
    var thv = uniq(th.map(function (x) { return x.v; }));
    if (thv.length > 1 && T.g !== '봉제' && T.g !== '의류') add('r', '두께 값이 여러 개', '두께 ' + thv.map(function (v) { return v + 'T'; }).join(' · ') + ' (' + uniq(th.map(function (x) { return x.n + '줄'; })).join(', ') + ')', ['한 가지로 통일', '부위가 다르면 부위 이름을 같이 표기 (예: 본체 3T · 받침 5T)'], th[1].n);
    // 두께 표기 섞임 (3T 와 3mm)
    if (!s.tpl && /\d\s*[Tt](?![a-zA-Z가-힣])/.test(tx) && /두께\s*[:：]?\s*\d+(?:\.\d+)?\s*mm|\d+(?:\.\d+)?\s*mm\s*두께/.test(tx)) add('p', '두께 표기 섞임', 'T 표기와 mm 표기가 같이 있음', '한 가지로 통일 · 권장 "3T (3mm)"');
    // 단면 · 양면 같이
    if (/단면/.test(tx) && /양면/.test(tx) && !/(단면|양면)[^\n]{0,12}(또는|or|\/|중)/.test(tx)) { var ln = P.vals.filter(function (v) { return /단면|양면/.test(v.t); }).map(function (v) { return v.n; }); add('r', '단면 · 양면 같이 표기', '단면과 양면이 둘 다 있음 (' + ln.map(function (n) { return n + '줄'; }).join(', ') + ')', '인쇄 면 하나로 정리', ln[0]); }
    // 도수 vs 별색 수 (판 수)
    var dm = tx.match(/(\d)\s*도(?![가-힣])/), pms = uniq((tx.match(/(?:PANTONE|팬톤|PMS)\s*[\w -]{1,22}?\s*[CU](?![a-zA-Z])/gi) || []).map(function (x) { return x.replace(/\s+/g, '').toUpperCase().replace('팬톤', 'PANTONE').replace('PMS', 'PANTONE'); }));
    if (dm && pms.length) {
      var dn = +dm[1], wh = /화이트|백판/.test(tx) ? 1 : 0, cmyk = /CMYK|4\s*원색|원색/.test(tx) ? 4 : 0;
      if (!cmyk && pms.length + wh !== dn && pms.length !== dn) add('r', '도수와 별색 수 다름', dn + '도 표기 · 별색 ' + pms.length + '개 (' + pms.join(', ') + ')' + (wh ? ' + 화이트' : ''), ['도수와 별색 판 수 맞추기', '화이트 판을 도수에 넣는지 같이 표기'], (P.vals.filter(function (v) { return /\d\s*도(?![가-힣])/.test(v.t); })[0] || {}).n);
    }
    // 색 수 vs 별색 수 (사출 · 실크)
    var cm = tx.match(/(\d)\s*(?:색|컬러)(?![가-힣])/);
    if (cm && pms.length && +cm[1] !== pms.length && !dm) add('o', '컬러 수와 별색 수 다름', cm[1] + '색 표기 · PANTONE ' + pms.length + '개', '컬러 수와 별색 목록 맞추기');
    // 핀
    if (tk === 'metalBadge' || tk === 'canBadge') {
      var pinN = uniq((tx.match(/([12])\s*(?:핀|침)|핀\s*([12])\s*개|(원|투)\s*핀/g) || []).map(function (x) { return /2|투/.test(x) ? 2 : 1; }));
      if (pinN.length > 1) add('r', '핀 개수가 서로 다름', '1핀과 2핀이 같이 있음', '핀 개수 하나로 정리');
      if (tk === 'metalBadge' && /안전\s*핀|옷핀/.test(tx)) add('o', '메탈 뱃지에 안전핀', '메탈 뱃지인데 안전핀 표기', ['안전핀은 보통 캔뱃지용', '메탈 뱃지는 권장 나비 클러치 · 고무 클러치 · 자석']);
      if (tk === 'canBadge' && /나비|버터플라이|클러치/.test(tx)) add('o', '캔뱃지에 클러치 핀', '캔뱃지인데 나비 · 고무 클러치 표기', ['캔뱃지 뒷면은 보통 안전핀 · 자석 · 미러', '클러치 핀이면 메탈 뱃지인지 확인']);
      var sz = tx.match(/(\d+(?:\.\d+)?)\s*[x×X*]\s*(\d+(?:\.\d+)?)/) || tx.match(/(?:지름|직경|Ø|ø|φ)\s*(\d+(?:\.\d+)?)/);
      var big = sz ? Math.max(parseFloat(sz[1]), parseFloat(sz[2] || 0)) : 0;
      if (!s.tpl && tk === 'metalBadge' && big && big <= 20) add('p', '작은 메탈 뱃지', '긴 변 ' + big + 'mm', '20mm 이하는 글자 · 색 칸이 거의 못 들어감 · 디자인 단순하게');
      if (!s.tpl && tk === 'metalBadge' && big >= 25 && pinN[0] === 1) add('p', '큰 뱃지에 1핀', '긴 변 ' + big + 'mm · 핀 1개', '권장 2핀 (25mm 이상 · 돌아감 방지)');
      if (!s.tpl && tk === 'canBadge' && big && [25, 32, 38, 44, 50, 56, 58, 75].indexOf(big) < 0) add('p', '캔뱃지 규격 아님', '지름 ' + big + 'mm', ['권장 규격 지름 32 · 38 · 44 · 58 · 75mm 중 하나', '업체 몰드 규격 확인']);
    }
    // 키링 구멍 지름 vs 고리
    var hd = tx.match(/(?:구멍|타공|홀)[^\n\d]{0,8}(\d+(?:\.\d+)?)\s*mm/);
    if (!s.tpl && hd && /키\s*링|키홀더/.test(s.name + tx) && parseFloat(hd[1]) < 2) add('o', '고리 구멍이 작음', '구멍 지름 ' + hd[1] + 'mm', '권장 지름 2.5~3mm 이상 (고리 · 볼체인 통과)', 0);
    // 수량 합계
    var tot = tx.match(/(?:총|합계|전체|Total|TOTAL)\s*[:：]?\s*(\d[\d,]*)\s*(?:개|ea|EA|pcs|PCS|세트|set|벌|족)?/), parts = [];
    P.vals.forEach(function (v) { v = { t: v.t.replace(/(?:총|합계|전체|Total|TOTAL)\s*[:：]?\s*\d[\d,]*\s*(?:개|ea|EA|pcs|PCS|세트|set|벌|족)?/g, ''), n: v.n }; var re = /(\d[\d,]*)\s*(?:개|ea|EA|pcs|PCS|세트|벌|족)(?![별월])/g, m; while ((m = re.exec(v.t))) parts.push(+m[1].replace(/,/g, '')); if (T.g === '의류' || tk === 'slipper') { var re2 = /(?:^|[\s/,(])(?:XS|S|M|L|XL|XXL|2XL|3XL|FREE|\d{3})\s*[:：]?\s*(\d{1,5})(?![\dmx×])/g; while ((m = re2.exec(v.t))) parts.push(+m[1]); } });
    if (tot && parts.length >= 2) { var sum = parts.reduce(function (a, b) { return a + b; }, 0), T0 = +tot[1].replace(/,/g, ''); if (sum !== T0) add('r', '수량 합계 안 맞음', '총 ' + T0.toLocaleString() + ' · 나눈 수량 합 ' + sum.toLocaleString() + ' (' + parts.join(' + ') + ')', '총 수량 또는 나눈 수량 고치기'); }
    // 사이즈 칸 두 번 · 값 다름
    var sl = P.labs.filter(function (l) { return /사이즈|크기|규격/.test(l.l) && !/받침|베이스|포장|박스|구멍|라벨|대지|인쇄|칼선/.test(l.l) && !EMPTY.test(l.v); });
    var svals = uniq(sl.map(function (l) { return (l.v.match(/\d+(?:\.\d+)?\s*[x×X*]\s*\d+(?:\.\d+)?/) || [''])[0].replace(/\s/g, '').replace(/[xX*]/g, '×'); }).filter(Boolean));
    if (svals.length > 1) add('r', '사이즈 값이 여러 개', '사이즈 ' + svals.join(' · ') + ' (' + sl.map(function (l) { return l.n + '줄'; }).join(', ') + ')', ['한 가지로 통일', '부위가 다르면 부위 이름 표기'], sl[1].n);
    // 단위 없는 크기
    if (!s.tpl) P.vals.forEach(function (v) { var m = v.t.match(/(\d+(?:\.\d+)?)\s*[x×X*]\s*(\d+(?:\.\d+)?)(?!\s*(?:[x×X*]\s*\d)|\s*(?:mm|cm|㎜|㎝|m|inch|in|px|"))/); if (m && !/mm|cm|㎜|㎝/.test(v.t)) add('o', '크기 단위 없음', '"' + m[0] + '" 단위 표기 없음', '단위 추가 · 권장 mm (예: 50×50mm)', v.n); });
    // mm · cm 섞임
    if (/\d\s*mm/.test(tx) && /\d\s*cm/.test(tx)) add('p', 'mm · cm 섞임', '한 품목에 mm와 cm가 같이 있음', '권장 mm로 통일');
    // 미정
    P.vals.forEach(function (v) { if (TBD.test(v.t)) add('o', '미정 · 확인 필요 항목', '"' + v.t.trim().slice(0, 40) + '"', '확정 값으로 바꾼 뒤 발주', v.n); });
    P.labs.forEach(function (l) { if (l.v && TBD.test(l.v) && !P.vals.some(function (v) { return v.n === l.n; })) add('o', '미정 · 확인 필요 항목', '"' + l.l + ': ' + l.v + '"', '확정 값으로 바꾼 뒤 발주', l.n); });
    // 품목별 조언
    if (/투명/.test(tx) && /아크릴/.test(tx) && !/보호\s*필름|필름/.test(tx) && T.g === '아크릴') add('p', '보호 필름 표기 없음', '투명 아크릴 · 보호 필름 언급 없음', '보호 필름 제거 여부 · 개별 포장 전 제거 표기 권장');
    if (/(반지|목걸이|귀걸이|팔찌|이어링|피어싱)/.test(s.name + tx) && /메탈|금속|도금|아연|황동/.test(tx) && !/니켈\s*프리|nickel\s*free/i.test(tx)) add('p', '니켈 프리 표기 없음', '피부에 닿는 금속 · 니켈 프리 언급 없음', '권장 니켈 프리 도금 표기');
    if (T.g === '의류' && F.sizes.re.test(tx) === false && /S\s*\/\s*M|S,\s*M/.test(tx)) add('o', '사이즈별 수량 없음', '사이즈 이름만 있고 수량 없음', '사이즈마다 수량 표기 (예: S 50 / M 100)');
    /* 3) 인쇄파일 검수 기준을 상품에 맞춘 것 */
    // 색 · 잉크
    var pn = tx.match(/(?:PANTONE|팬톤|PMS)\s*(?:\d{2,4}|[A-Za-z]+(?:\s[A-Za-z]+)?)(?:\s*(?:C|U|CP|UP|TCX|TPX|TPG|XGC|M)(?![A-Za-z]))?/gi) || [];
    var noCU = uniq(pn.filter(function (x) { return !/\d/.test(x) ? false : !/(?:C|U|CP|UP|TCX|TPX|TPG|XGC|M)$/i.test(x.trim()); }).map(function (x) { return x.trim(); }));
    if (noCU.length) add('o', 'PANTONE C · U 표기 없음', noCU.join(', '), ['코팅 (C) · 비코팅 (U) 표기 · 원단은 TCX · TPX', '예: PANTONE 186 C']);
    var cre = /C\s*(\d{1,3})\s*M\s*(\d{1,3})\s*Y\s*(\d{1,3})\s*K\s*(\d{1,3})/g, cmk;
    while ((cmk = cre.exec(tx))) { var su = +cmk[1] + +cmk[2] + +cmk[3] + +cmk[4]; if (su > 300) add('r', '잉크 총량 많음', cmk[0] + ' · 합 ' + su + '%', '권장 300% 이하 (번짐 · 안 마름)'); else if (su > 0 && su <= 10) add('r', '잉크가 거의 없음', cmk[0] + ' · 합 ' + su + '%', '10% 이하는 인쇄가 거의 안 보임 · 진하게 또는 빼기'); }
    if (/블랙|검정|네이비|차콜|다크|진한|딥\s*그린|버건디|와인/.test(tx) && (T.g === '의류' || T.g === '봉제' || /원단/.test(tx)) && /실크|나염|DTF|DTG|인쇄|프린트/.test(tx) && !/화이트\s*(?:하판|베이스|언더|판)|백판|하지/.test(tx)) add('o', '진한 원단에 화이트 하판 없음', '진한 원단 + 인쇄 · 화이트 하판 표기 없음', '권장 화이트 하판 (언더베이스) 추가 · 없으면 색이 어둡게 나옴');
    if ((T.g === '의류' || T.g === '봉제') && /자수/.test(tx) && /원단\s*색|원단\s*컬러/.test(tx) && !/실\s*색|실\s*컬러|자수\s*(?:색|컬러)|사\s*번호/.test(tx)) add('p', '자수 실 색 따로 없음', '원단 색만 있고 자수 실 색 표기 없음', '원단 컬러와 자수 실 컬러는 범례 따로');
    // 글자 · 선 최소
    minRules(tx, tk, add);
    // 뒷면 인쇄 반전
    if (/^acr/.test(tk) && (/뒷면\s*인쇄|뒤\s*인쇄|역\s*인쇄|이면\s*인쇄|인쇄면\s*[:：]\s*뒤/.test(tx))) add('p', '뒷면 인쇄 · 그림 방향', '인쇄가 뒷면 (보이는 쪽 앞)', '그림 좌우 반전을 누가 할지 업체와 정하기 · 글자 거꾸로 보임 방지');
    // 수량 · 종
    var jm = tx.match(/(\d+)\s*종\s*[×xX*]\s*(\d[\d,]*)\s*(?:개|ea|EA|pcs)?\s*=\s*(\d[\d,]*)/);
    if (jm && +jm[1] * +jm[2].replace(/,/g, '') !== +jm[3].replace(/,/g, '')) add('r', '종 × 수량 계산 틀림', jm[0], jm[1] + '종 × ' + jm[2] + ' = ' + (+jm[1] * +jm[2].replace(/,/g, '')).toLocaleString());
    // 표시사항 · 바코드 · FSC
    if (/바코드|barcode/i.test(tx) && !/K\s*100|먹\s*1도|블랙\s*단색/i.test(tx)) add('p', '바코드 색 표기 없음', '바코드 언급 · 색 표기 없음', '권장 K100 단색 · 흰 바탕 · 오버프린트 · 읽힘 테스트');
    if (/FSC/i.test(tx)) add('p', 'FSC 로고 크기', 'FSC 로고 사용', '권장 높이 14mm 이상 · 흑백처럼 대비 뚜렷하게');
    g.spec = {}; g.fields.forEach(function (f) { if (!f.miss && !f.skip && f.v) g.spec[f.n] = f.v; });
    groups.push(g);
  });
  /* 같은 품목끼리 사양 다름 (디자인 규칙 통일) */
  var byT = {}; groups.forEach(function (g) { (byT[g.type] = byT[g.type] || []).push(g); });
  Object.keys(byT).forEach(function (k) {
    var gs = byT[k]; if (gs.length < 2) return;
    ['소재', '두께', '고리 · 부자재', '고리', '도금', '잠금 · 핀', '인쇄 방식', '포장'].forEach(function (fn) {
      var vs = uniq(gs.map(function (g) { return g.spec[fn]; }).filter(Boolean)); if (vs.length < 2) return;
      items.push({ g: -1, lv: 'o', where: gs.map(function (g) { return g.name; }).join(' · '), title: '같은 품목 ' + fn + ' 다름', prob: gs.filter(function (g) { return g.spec[fn]; }).map(function (g) { return g.name + ': ' + g.spec[fn]; }), fix: ['의도한 차이면 통과', '아니면 한 가지로 통일'] });
    });
  });
  /* 직접 확인 (검수기는 안내만) */
  manual.push('아트워크 파일은 인쇄파일 검수기로 (해상도 · RGB · 도련 · 칼선 여백 · 후가공 별색 오버프린트)');
  manual.push('PANTONE 칩과 실물 색 대조');
  var gt = groups.map(function (g) { return g.type; }).join(' ');
  if (/acr/.test(gt)) manual.push('아크릴 인쇄면 · 화이트 범위 · 칼선을 도면과 대조');
  if (/doll|wappen|cloth|cap|socks|slipper|pouch|bag|fabricEtc|sewlabel/.test(gt)) manual.push('원단 스와치 · 자수 실 색 실물 대조');
  if (/cloth|slipper|socks/.test(gt)) manual.push('사이즈별 치수표 · 사이즈별 수량 첨부');
  if (/doll|socks/.test(gt) || /어린이|아동|키즈|유아|아기/.test(text)) manual.push('KC · 사용 연령 · 작은 부품 표시');
  if (/mug/.test(gt)) manual.push('식품 접촉 · 식품 안전 검사 서류');
  manual.push('부자재 (고리 · 체인 · 지퍼 · 라벨) 색 · 종류 실물 확인');
  manual.push('양산 전 샘플 · 실물 사진 확인 (멤버별 · 디자인별)');

  /* 3) 오탈자 · 표기 (글 전체) */
  var lines = String(text || '').replace(/\r/g, '').split('\n');
  function gOfLine(n) { var gi = -1; secs.forEach(function (s, i) { if (s.start <= n) gi = i; }); return gi; }
  var seen = {};
  lines.forEach(function (l, i) {
    var n = i + 1, gi = gOfLine(n), nm = gi >= 0 ? groups[gi].name : '공통';
    TYPO.forEach(function (tp) {
      if (!tp[2]) return; tp[0].lastIndex = 0; var m = l.match(tp[0]); if (!m) return;
      var key = tp[1] + '|' + m[0] + '|' + (tp[2] === 'p' ? '' : n); if (seen[key]) return; seen[key] = 1;
      var it = { g: gi, lv: tp[2] === 't' ? 't' : 'p', where: nm + ' · ' + n + '줄', title: tp[2] === 't' ? '오탈자 "' + m[0] + '"' : '표기 "' + m[0] + '"', prob: '"' + l.trim().slice(0, 50) + '"', fix: tp[2] === 't' ? '"' + tp[1] + '"로 수정' : '권장 "' + tp[1] + '"로 통일' };
      it.prob = [it.prob]; it.fix = [it.fix]; items.push(it); if (gi >= 0) groups[gi].n[it.lv]++;
    });
    if (!opt.noDbl && /\S {2,}\S/.test(l) && !/\t/.test(l) && !/ {4,}/.test(l)) { var it2 = { g: gi, lv: 't', where: nm + ' · ' + n + '줄', title: '띄어쓰기 두 번', prob: ['"' + l.trim().replace(/ {2,}/g, '␣␣').slice(0, 50) + '"'], fix: ['한 칸으로'] }; items.push(it2); if (gi >= 0) groups[gi].n.t++; }
    var lone = l.match(/(?:^|[\s가-힣])([vzwVZW])(?=[\s가-힣]|$)/);
    if (lone && !/[vV]\s*\d|w\s*\d/.test(l)) { var it3 = { g: gi, lv: 't', where: nm + ' · ' + n + '줄', title: '혼자 떨어진 글자 "' + lone[1] + '"', prob: ['"' + l.trim().slice(0, 50) + '"'], fix: ['단축키로 잘못 들어간 글자인지 확인 후 삭제'] }; items.push(it3); if (gi >= 0) groups[gi].n.t++; }
  });
  // 반복 단어
  lines.forEach(function (l, i) { var m = l.match(/(^|\s)([가-힣A-Za-z]{2,})\s+\2(?=\s|$|[.,])/); if (m && !/^[■□]/.test(l.trim())) { var gi = gOfLine(i + 1); items.push({ g: gi, lv: 't', where: (gi >= 0 ? groups[gi].name : '공통') + ' · ' + (i + 1) + '줄', title: '같은 단어 두 번 "' + m[2] + '"', prob: ['"' + l.trim().slice(0, 50) + '"'], fix: ['하나 지우기'] }); if (gi >= 0) groups[gi].n.t++; } });
  // 단위 · 숫자 표기 섞임
  var AT = String(text || '');
  if (/\d\s*mm/.test(AT) && /㎜/.test(AT)) items.push({ g: -1, lv: 'p', where: '전체', title: 'mm · ㎜ 섞임', prob: ['"mm"와 "㎜"가 같이 있음'], fix: ['권장 "mm"로 통일'] });
  if (/(?:^|[^\d,.])\d{1,3}(?:,\d{3})+(?![\d])/.test(AT) && /(?:^|[^\d,.])\d{4,}(?![\d.,]|\s*(?:mm|년|C|U|TCX|TPX|-))/.test(AT.replace(/PANTONE\s*\d+|\d{4}[.\-]\d{1,2}/gi, ''))) items.push({ g: -1, lv: 'p', where: '전체', title: '수량 쉼표 표기 섞임', prob: ['"1,000"과 "1000" 같은 표기가 같이 있음'], fix: ['권장 쉼표 넣어 통일 (1,000)'] });
  if (/\d\s*(?:"|″|inch|인치)/i.test(AT)) items.push({ g: -1, lv: 'p', where: '전체', title: '인치 표기', prob: ['인치 (") 표기 있음'], fix: ['권장 mm로 바꿔 표기'] });
  // × 표기
  var xs = String(text || '').match(/\d+(?:\.\d+)?\s*[xX*]\s*\d+(?:\.\d+)?/g);
  if (xs) items.push({ g: -1, lv: 'p', where: '전체', title: '크기 곱하기 표기', prob: ['"x" 표기 ' + xs.length + '곳 (' + uniq(xs).slice(0, 3).join(', ') + ')'], fix: ['권장 "×" (예: 50×50mm)'] });
  // 품목명 표기 섞임 (뱃지/배지)
  var all = String(text || '');
  if (/뱃지/.test(all) && /배지/.test(all)) items.push({ g: -1, lv: 'p', where: '전체', title: '뱃지 · 배지 섞임', prob: ['"뱃지"와 "배지"가 같이 있음'], fix: ['한 가지로 통일'] });
  if (/키링/.test(all) && /키홀더/.test(all)) items.push({ g: -1, lv: 'p', where: '전체', title: '키링 · 키홀더 섞임', prob: ['"키링"과 "키홀더"가 같이 있음'], fix: ['한 가지로 통일'] });

  /* 순서: 오탈자 → 경고 → 주의 → 조언 */
  var ord = { t: 0, r: 1, o: 2, p: 3 };
  items.sort(function (a, b) { return ord[a.lv] - ord[b.lv] || a.g - b.g; });
  groups.forEach(function (g) { var ok = g.fields.filter(function (f) { return !f.miss && !f.skip && !f.lv; }).length; if (ok) pass.push(g.name + ' 필수 사양 ' + ok + '개'); });
  if (!items.some(function (x) { return x.lv === 't'; })) pass.push('오탈자 없음');
  return { items: items, groups: groups, pass: pass, manual: manual, tpl: TPL, common: common ? common.lines.map(function (x) { return x.t; }) : [] };
}

/* 결과지 (지류 사양서 검수 결과지와 같은 모양) */
function render(R, opt) {
  opt = opt || {};
  var c = { t: 0, r: 0, o: 0, p: 0 }; R.items.forEach(function (x) { c[x.lv]++; });
  var now = new Date(), stamp = now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate();
  var h = '<div class="spk gdk">';
  h += '<div class="spk-mast"><b>PLYSH 검수</b><span>상품 작업지시서 검수 · ' + stamp + '</span></div>';
  h += '<p class="spk-eye">상품 작업지시서 검수 결과</p><h1>' + esc(opt.title || '상품 작업지시서') + '</h1>';
  h += '<div class="spk-file">' + (opt.file ? esc(opt.file) + ' · ' : '') + '품목 ' + R.groups.length + '개</div>';
  h += '<div class="spk-stat">' + ['t', 'r', 'o', 'p'].map(function (k) { return '<span class="' + k + '"><b>' + c[k] + '</b>' + LV[k][0] + '</span>'; }).join('') + '<span class="g"><b>' + R.pass.length + '</b>통과</span></div>';
  /* 품목별 사양 표 */
  h += '<h2>품목별 사양</h2><div class="gdk-gr">' + R.groups.map(function (g) {
    return '<div class="gdk-g" data-g="' + g.i + '"><div class="gdk-gh"><b>' + esc(g.name) + '</b><span>' + esc(g.tn) + '</span></div><table>' + g.fields.map(function (f) {
      var st = f.skip ? '<td class="s na">' + esc(f.skip) + '</td>' : f.miss ? '<td class="s ' + f.lv + '">없음</td>' : '<td class="s' + (f.lv ? ' ' + f.lv : '') + '">' + esc(f.v) + '</td>';
      return '<tr><th>' + esc(f.n) + '</th>' + st + '</tr>';
    }).join('') + '</table></div>';
  }).join('') + '</div>';
  if (R.items.length) {
    h += '<h2>요약</h2><table class="spk-sum"><tr><th>번호</th><th>단계</th><th>위치</th><th>내용</th></tr>' + R.items.map(function (x, i) {
      return '<tr data-lv="' + x.lv + '" data-g="' + x.g + '"><td class="n">' + (i + 1) + '</td><td><i class="lv ' + x.lv + '">' + LV[x.lv][0] + '</i></td><td>' + esc(x.where) + '</td><td>' + esc(x.title) + '</td></tr>';
    }).join('') + '</table>';
    h += '<h2>자세히</h2>' + R.items.map(function (x, i) {
      return '<div class="spk-it ' + x.lv + '" data-lv="' + x.lv + '" data-g="' + x.g + '"><div class="spk-no">' + (i + 1) + '</div><div class="spk-bd"><div class="spk-h"><i class="lv ' + x.lv + '">' + LV[x.lv][0] + '</i><b>' + esc(x.title) + '</b><label class="spk-cb"><input type="checkbox"><span>' + LV[x.lv][2] + '</span></label></div>' +
        '<dl><dt>위치</dt><dd>' + esc(x.where) + '</dd><dt>문제</dt><dd>' + (x.prob.length > 1 ? '<ul>' + x.prob.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : esc(x.prob[0] || '')) + '</dd>' +
        '<dt>해결</dt><dd class="fx"><ul>' + x.fix.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></dd></dl></div></div>';
    }).join('');
  } else h += '<p class="spk-ok">고칠 곳이 없어요.</p>';
  if (R.manual && R.manual.length) h += '<h2>직접 확인</h2><div class="gdk-man">' + R.manual.map(function (p) { return '<label class="spk-cb"><input type="checkbox"><span>' + esc(p) + '</span></label>'; }).join('') + '</div>';
  if (R.pass.length) h += '<h2>통과</h2><div class="spk-pass">' + R.pass.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>';
  h += '<div class="spk-foot"><span>PLYSH 검수 · 상품 작업지시서</span><span>' + stamp + '</span></div></div>';
  return h;
}

var api = { check: check, render: render, split: split, typeOf: typeOf, TYPES: TYPES, F: F, LV: LV };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PLYSH_GOODS = api;
})(typeof window !== 'undefined' ? window : globalThis);
