// MD 상품 작업지시서 포맷 — 22품목 A3 가로 대지 생성 (PLYSH 디자인4팀)
// 표 = 선(사각형) + 영역 문자 상자. 글자 = HYONA_ 문자 스타일, 표기 색 = HYONA_ 별색.
#target illustrator
(function () {
var DATA = [{"k":"acrKey","n":"아크릴 키링","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"앞면","note":"","f":"acrKey_0.svg"},{"t":"인쇄 층","note":"","f":"acrKey_1.svg"}],"vs":[["인쇄면","앞 · 뒤 · 양면"],["화이트","전체 · 부분 · 없음"],["칼선","그림 밖 2~3mm"]],"mat":["투명","유백 (반투명)","글리터","홀로그램","미러","야광"],"det":[["두께",["2T","3T","5T","____T"]],["인쇄면",["앞","뒤","양면 (화이트 샌드위치)"]],["화이트",["전체","부분","없음 (투명)"]]],"proc":["UV 인쇄","레이저 커팅","고리 구멍 타공","보호 필름 (출고 양면)"],"col":["CMYK","화이트 판","PANTONE C (별색 요청 시)"],"dims":["가로","세로","두께","고리 구멍 지름","구멍 위치 (끝에서)","칼선 여백"],"acc":[["고리",["O링","볼체인","D링","카라비너","랍스터"]],["고리 색",["은","금","블랙","____"]],["체인 길이",["____mm"]]],"pack":["OPP 개별","보호 필름 유지","대지 (헤더 카드)"],"warn":["인쇄는 칼선 2mm 안쪽까지 (UV 까짐)","폭 3mm 이하 · 뾰족한 돌기는 부러짐","고리 구멍은 칼선 끝에서 2mm 이상 안쪽","키링 긴 변 25~30mm 이상"],"chk":["종류 · 크기 · 두께 · 수량 · 고리","인쇄면과 화이트 범위","칼선 여백 · 가는 부분 · 구멍 위치","보호 필름 (촬영 땐 떼기)"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"acrStand","n":"아크릴 스탠드","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"전개도","note":"본체 + 받침 한 판","f":"acrStand_0.svg"},{"t":"조립도","note":"","f":"acrStand_1.svg"}],"vs":[["본체","____T · 인쇄면 ____"],["받침","____T · 인쇄 유무"],["탭 · 홈","업체 템플릿 값"]],"mat":["투명","유백 (반투명)","글리터","홀로그램","미러"],"det":[["본체 두께",["3T","5T","____T"]],["받침 두께",["3T","5T"]],["인쇄면",["앞","뒤","양면"]],["화이트",["전체","부분","없음"]]],"proc":["UV 인쇄","레이저 커팅","받침 인쇄","보호 필름"],"col":["CMYK","화이트 판"],"dims":["본체 가로 · 세로","받침 가로 · 세로","탭 폭 (본체 1/3↑)","탭 높이","홈 폭 (두께 + 0.1~0.2)","홈 길이 (탭 + 0.2~0.5)","전체 높이"],"acc":[["받침",["일체형 (끼움)","별도 받침 판","받침 없음"]]],"pack":["OPP 개별","본체 · 받침 분리 포장","조립 안내 카드"],"warn":["본체 긴 변 50mm 이상 (작으면 흔들림)","탭 · 홈은 업체 템플릿 그대로","받침에 묻히는 높이는 디자인 비움","디오라마는 판 사이 5mm 이상"],"chk":["종류 · 크기 · 두께 · 수량","인쇄면 · 화이트 범위","탭 · 홈 = 업체 템플릿","조립도로 앞뒤 · 겹침 확인"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"acrShaker","n":"아크릴 셰이커","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"층 구성","note":"","f":"acrShaker_0.svg"},{"t":"조립도","note":"","f":"acrShaker_1.svg"}],"vs":[["앞판","____T · 인쇄"],["테두리","____T"],["뒤판","____T · 인쇄"]],"mat":["투명","글리터","홀로그램"],"det":[["층 두께",["앞 ____T","테두리 ____T","뒤 ____T"]],["충전물",["글리터","비즈","아크릴 조각","오일 (액체)"]],["충전 양",["____g · ____개"]]],"proc":["UV 인쇄 (앞 · 뒤)","레이저 커팅","층 접착"],"col":["CMYK","화이트 판","충전물 색 (실물 사진)"],"dims":["가로","세로","층별 두께","속 빈 칸 크기","고리 구멍 (있으면)"],"acc":[["고리",["없음","O링","볼체인"]],["스탠드",["없음","받침"]]],"pack":["OPP 개별","보호 필름"],"warn":["층마다 1~3mm","충전물이 비치는 칸에 화이트 넣지 않기","액체는 새는지 업체 확인"],"chk":["층 수 · 두께","충전물 종류 · 양","앞뒤 인쇄 위치 겹침"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"metalBadge","n":"메탈 뱃지","g":"금속","src":"메탈 뱃지 디자인","views":[{"t":"앞면","note":"","f":"metalBadge_0.svg"},{"t":"뒷면","note":"","f":"metalBadge_1.svg"}],"vs":[["방식","하드 · 소프트 · 에폭시"],["도금","____"],["색 수","____색"]],"mat":["아연 합금","철","구리","스테인리스 (에칭)"],"det":[["방식",["하드 에나멜","소프트 에나멜","소프트 + 에폭시","인쇄 + 에폭시","에칭","다이캐스팅 3D"]],["도금",["금","은","니켈","블랙 니켈","로즈골드","앤틱"]],["두께",["____mm"]]],"proc":["금형","도금","에나멜 채움","에폭시","뒷면 각인","뒷면 무늬"],"col":["PANTONE C (에나멜)","도금 색","CMYK (인쇄형)"],"dims":["가로","세로","두께","금속선 (0.3mm↑)","가장 좁은 색 칸 (0.5mm↑)","침 위치"],"acc":[["침 개수",["1개","2개 (25mm↑ · 가로 긴 뱃지)"]],["클러치",["나비","고무","잠금 (디럭스)","안전핀","자석"]],["클러치 색",["____"]],["뒷면 무늬",["민무늬","샌드","와플","동심원"]]],"pack":["OPP 개별","백카드 (대지)"],"warn":["모든 색 칸은 금속선으로 닫혀야 함","20mm 이하는 글자 · 칸이 거의 못 들어감","각인은 테두리 1mm 안쪽 · 침 둘레 3mm 비움"],"chk":["방식 · 크기 · 수량","도금 색 · 에나멜 팬톤 · 색 수","금속선 · 색 칸 · 글자 최소 크기","침 개수 · 클러치 · 뒷면 마감","샘플 실물 사진 확인 후 양산"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"r","치수":"r","부자재":"r","주의사항":"o"}},{"k":"metalKey","n":"메탈 키링","g":"금속","src":"메탈 뱃지 디자인","views":[{"t":"앞면","note":"","f":"metalKey_0.svg"},{"t":"뒷면","note":"","f":"metalKey_1.svg"}],"vs":[["방식","하드 · 소프트 · 에폭시"],["도금","____"],["고리","____"]],"mat":["아연 합금","철","스테인리스"],"det":[["방식",["하드 에나멜","소프트 에나멜","에폭시","양면 금형"]],["도금",["금","은","니켈","블랙 니켈"]],["두께",["____mm"]]],"proc":["금형","도금","에나멜","고리 구멍"],"col":["PANTONE C (에나멜)","도금 색"],"dims":["가로","세로","두께","고리 구멍 지름"],"acc":[["고리",["O링","볼체인","카라비너","랍스터"]],["고리 색",["도금과 같음","____"]]],"pack":["OPP 개별","백카드"],"warn":["고리 구멍 둘레 금속 2mm 이상","양면이면 뒷면 도면 따로"],"chk":["방식 · 도금 · 색 수","고리 종류 · 색","샘플 확인"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"r","치수":"r","부자재":"r","주의사항":"o"}},{"k":"canBadge","n":"캔뱃지","g":"금속","src":"캔뱃지 디자인","views":[{"t":"앞면","note":"재단 · 완성 · 안전","f":"canBadge_0.svg"},{"t":"단면","note":"","f":"canBadge_1.svg"}],"vs":[["완성 지름","____mm"],["필름","유광 · 무광"],["뒷면","____"]],"mat":["금속 쉘 + 인쇄 종이 + 필름"],"det":[["완성 지름",["25","32","38","44","58","75mm"]],["모양",["원형","사각","하트","타원","별"]],["필름",["유광","무광","홀로그램","글리터"]],["종이",["아트지","홀로그램지","펄지","크라프트"]]],"proc":["디지털 인쇄 (CMYK)","압착"],"col":["CMYK"],"dims":["완성 지름","재단 지름 (업체 템플릿)","안전 영역 (완성 − 약 6mm)"],"acc":[["뒷면",["안전핀","자석","거울","병따개","키링 고리","스탠드"]]],"pack":["OPP 개별","백카드"],"warn":["배경은 재단선까지 꽉 (흰 띠 방지)","완성 지름에 딱 붙은 테두리 선 금지","얼굴 사진엔 유광 · 무광 (홀로그램 X)","그림 위쪽 = 핀 방향 표시"],"chk":["완성 지름 · 수량 · 뒷면 · 필름","글자 · 얼굴 · 로고가 안전 영역 안","300ppi · CMYK · 아웃라인","세트는 같은 템플릿 · 같은 위치"],"R":{"소재":"o","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"tin","n":"틴케이스","g":"금속","src":"틴케이스 디자인","views":[{"t":"전개도","note":"업체 다이 라인","f":"tin_0.svg"},{"t":"조립도","note":"","f":"tin_1.svg"}],"vs":[["윗면","____"],["옆면","배경 · 단순 패턴"],["형압","위치 · 크기"]],"mat":["양철 (틴 플레이트)"],"det":[["종류",["사각 경첩","뚜껑 끼움","원통","창 틴","슬라이드"]],["표면",["유광","무광","펄"]],["화이트 베이스",["전체","부분 (금속 살림)"]]],"proc":["평판 옵셋 (성형 전)","UV 디지털 (윗면만)","엠보 · 디보 (형압)"],"col":["CMYK","PANTONE C","화이트 베이스 판"],"dims":["가로","세로","높이","윗면 디자인 영역","성형선 위치","형압 위치"],"acc":[["속",["없음","스펀지","속지 · 트레이"]]],"pack":["OPP 개별","개별 박스"],"warn":["윗면은 성형선 3~5mm 안쪽","옆면 말림 2~3mm 비움","원통 이음선 양옆 3mm 글자 금지"],"chk":["종류 · 크기 · 수량 · 인쇄 방식","업체 전개도에 작업 · 성형선 표시","화이트 베이스 범위","이음선 · 경첩 위치"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"pvcKey","n":"PVC · 실리콘 키링","g":"PVC · 실리콘","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"pvcKey_0.svg"},{"t":"단면","note":"층 높이","f":"pvcKey_1.svg"}],"vs":[["소재","PVC · 실리콘"],["층","____층"],["색 수","____색"]],"mat":["소프트 PVC","실리콘","러버"],"det":[["면",["단면","양면"]],["층 수",["1층","2층","3층"]],["두께",["____mm"]],["특수",["야광","반투명","글리터"]]],"proc":["몰드 (금형)","칸마다 색 채움","인쇄 (작은 부분)"],"col":["PANTONE C (칸마다)"],"dims":["가로","세로","두께 (층별)","고리 구멍","칸막이 (0.8~1mm)"],"acc":[["고리",["O링","볼체인","D링","카라비너"]],["고리 색",["은","금","블랙"]]],"pack":["OPP 개별"],"warn":["칸마다 단색 · 그라데이션 불가","글자 3mm · 획 1mm 이상"],"chk":["층 · 색 수 · 팬톤","금형 도면 확인","샘플 색 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"doll","n":"봉제 인형","g":"봉제","src":"봉제 인형 · 봉제류 디자인","views":[{"t":"전개도","note":"패턴 조각","f":"doll_0.svg"},{"t":"조립도","note":"","f":"doll_1.svg"}],"vs":[["원단","____ · 털 ____mm"],["자수","눈 · 입 · 글자"],["라벨","위치 ____"]],"mat":["미니소프트 (단모 1~2mm)","밍크 (3~5mm)","보아 · 장모 (10mm↑)","면","펠트"],"det":[["원단 색",["원단 스와치 번호"]],["털 방향",["위 → 아래","____"]],["솜",["폴리 솜","알갱이 (비즈)","____g"]]],"proc":["재봉","자수 (눈 · 입)","승화 인쇄","아플리케"],"col":["원단 스와치","실색 스와치 (자수실 번호)","PANTONE TCX"],"dims":["완성 가로 · 세로","앉은 키 / 선 키","시접 (5~7mm)","자수 크기 · 위치","라벨 · 고리 위치"],"acc":[["라벨",["봉제 라벨","KC 라벨","케어 라벨"]],["고리",["없음","볼체인","O링"]],["부속",["눈 (자수 권장)","리본","옷"]]],"pack":["OPP 개별","택 (행택)"],"warn":["박음선 10mm 안쪽에 얼굴 · 글자","자수 글자 6mm↑ (밍크 · 보아 10mm↑)","작은 부품 · KC · 사용 연령 확인"],"chk":["크기 · 원단 · 털 길이 · 수량","자수 선 · 글자 최소","라벨 · 고리 위치","샘플 확인 후 수정 1~2회"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"r"}},{"k":"dollKey","n":"인형 키링","g":"봉제","src":"봉제 인형 · 봉제류 디자인","views":[{"t":"전개도","note":"","f":"dollKey_0.svg"},{"t":"조립도","note":"","f":"dollKey_1.svg"}],"vs":[["원단","____"],["자수","____"],["고리","____"]],"mat":["미니소프트","밍크","보아","면"],"det":[["원단 색",["원단 스와치 번호"]],["솜",["폴리 솜","____g"]]],"proc":["재봉","자수","승화 인쇄"],"col":["원단 스와치","실색 스와치 (자수실 번호)"],"dims":["완성 가로 · 세로","시접 (3~5mm)","자수 크기","고리 달림 위치"],"acc":[["고리",["볼체인","O링","카라비너","D링"]],["고리 색",["은","금","____"]],["라벨",["봉제 라벨","KC 라벨"]]],"pack":["OPP 개별","헤더 택"],"warn":["작은 인형은 자수 위주 (인쇄 결 보임)","고리 달림 부분 보강 박음"],"chk":["크기 · 원단 · 고리","라벨 · KC","샘플 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"wappen","n":"와펜","g":"봉제","src":"와펜 디자인","views":[{"t":"앞면","note":"","f":"wappen_0.svg"},{"t":"뒷면","note":"","f":"wappen_1.svg"}],"vs":[["종류","평자수 · 입체 · 직조 · PVC"],["테두리","메로우 · 히트컷"],["색 수","____색"]],"mat":["자수 (평자수)","입체 자수 (3D 퍼프)","시닐","직조","프린트","PVC"],"det":[["바탕 원단",["트윌","펠트","원단 스와치 번호"]],["자수 비율",["100%","75%"]]],"proc":["자수","직조","인쇄"],"col":["실색 스와치 (실 번호)","원단 스와치","PANTONE C (PVC)"],"dims":["가로 · 세로 / 지름","테두리 폭 (메로우 3~4mm)","글자 높이 (평자수 5mm↑)"],"acc":[["뒷면",["열접착","벨크로","안전핀","박음용 (처리 없음)"]],["테두리",["메로우","새틴","히트컷"]]],"pack":["OPP 개별","백카드"],"warn":["테두리 안쪽에만 디자인","메로우는 단순한 모양만 (25~30mm↑)","평자수 9~12색이 보통"],"chk":["종류 · 크기 · 수량 · 테두리","실 번호 · 원단색 · 자수 비율","뒷면 · 부착 원단","자수 스와치 사진 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"r","치수":"r","부자재":"r","주의사항":"o"}},{"k":"pouch","n":"파우치","g":"봉제","src":"인조가죽 · 봉제류","views":[{"t":"앞면","note":"","f":"pouch_0.svg"},{"t":"옆면","note":"마치","f":"pouch_1.svg"}],"vs":[["원단","____"],["지퍼","____"],["가공","인쇄 · 자수 · ____"]],"mat":["캔버스","옥스포드","나일론","PU · PVC","퍼 · 보아","면"],"det":[["원단 색",["원단 스와치 번호"]],["두께",["____수 · ____oz"]],["안감",["있음","없음"]],["심",["있음","없음"]]],"proc":["실크 인쇄","디지털 인쇄","자수","박","형압"],"col":["원단 스와치","PANTONE C (인쇄)","PANTONE TCX (원단)","실색 스와치 (자수)"],"dims":["가로","세로","마치 (바닥 폭)","지퍼 길이","인쇄 · 자수 위치 (끝에서)"],"acc":[["지퍼",["코일","금속","비슬론"]],["지퍼 색",["____"]],["풀러",["기본","가죽 끈","커스텀 메탈"]],["라벨",["루프폴드","맨하탄폴드","행택"]]],"pack":["OPP 개별","행택"],"warn":["박음선 · 시접 위 인쇄 금지","안감 색 · 지퍼 색 함께 지정"],"chk":["원단 · 색 · 크기 · 수량","지퍼 종류 · 색 · 풀러","라벨 위치","샘플 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"bag","n":"에코백 · 가방","g":"봉제","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"bag_0.svg"},{"t":"옆면","note":"마치","f":"bag_1.svg"}],"vs":[["원단","____"],["손잡이","____"],["가공","____"]],"mat":["캔버스 (면)","옥스포드","나일론","부직포","데님"],"det":[["원단 두께",["10수","16수","20수","____oz"]],["원단 색",["원단 스와치 번호"]],["안감 · 주머니",["없음","안주머니","안감"]]],"proc":["실크 인쇄","DTF 전사","자수","디지털 인쇄"],"col":["원단 스와치","PANTONE C (인쇄)","실색 스와치 (자수)"],"dims":["가로","세로","마치","손잡이 길이 · 폭","인쇄 크기 · 위치"],"acc":[["손잡이",["같은 원단","웨빙","가죽"]],["여밈",["없음","똑딱이","지퍼","자석"]],["라벨",["루프폴드","맨하탄폴드","행택"]]],"pack":["OPP 개별","접기 방법"],"warn":["인쇄 판 크기 업체 최대 확인","진한 원단 위 인쇄는 화이트 하판"],"chk":["원단 · 색 · 크기","손잡이 길이","인쇄 위치 · 도수","샘플"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"blanket","n":"담요 · 쿠션 · 타월","g":"봉제","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"blanket_0.svg"},{"t":"옆면 · 두께","note":"","f":"blanket_1.svg"}],"vs":[["원단","____"],["끝 처리","____"],["가공","____"]],"mat":["극세사","플리스","면 타월","폴리 (승화)","자카드 직조"],"det":[["원단 색",["원단 스와치 번호"]],["중량",["____g · ____gsm"]],["속 (쿠션)",["솜","____g","지퍼 커버"]]],"proc":["승화 인쇄","자카드 직조","자수","나염"],"col":["CMYK (승화)","원단 스와치","실색 스와치"],"dims":["가로","세로","두께 (쿠션)","끝 처리 폭"],"acc":[["끝 처리",["오버록","바이어스","술 (프린지)","말아박기"]],["라벨",["케어 라벨","봉제 라벨"]]],"pack":["OPP 개별","띠지","개별 박스"],"warn":["디자인은 끝 처리 폭 안쪽","타월은 표면 결 때문에 작은 글자 뭉개짐"],"chk":["원단 · 크기 · 중량","끝 처리","케어 라벨"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"tee","n":"의류 (티 · 맨투맨 · 후디)","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"tee_0.svg"},{"t":"뒷면","note":"","f":"tee_1.svg"}],"vs":[["원단","____수 · ____"],["컬러","원단 스와치"],["가공","____"]],"mat":["면 100%","면 · 폴리 혼방","기모","쭈리","폴리 (기능성)"],"det":[["원단 두께",["20수","30수","____g"]],["원단 색",["원단 스와치 번호"]],["핏",["레귤러","오버핏","____"]]],"proc":["실크 인쇄","DTF","DTG","자수","승화"],"col":["원단 스와치","PANTONE C (인쇄)","실색 스와치 (자수)"],"dims":["총장","가슴 단면","어깨","소매 길이 (팔길이)","소매 너비","하단 너비","진동","소매 시보리 높이","밑단 시보리 높이","인쇄 크기 · 위치 (목에서)"],"acc":[["라벨",["목 라벨 (직조 · 인쇄)","케어 라벨","루프폴드","맨하탄폴드"]],["행택",["있음 (타공 위치)","없음"]],["후디",["끈 · 끈 끝","지퍼"]]],"pack":["OPP 개별 (접기)","사이즈 스티커"],"warn":["사이즈별 치수표 (S · M · L · XL) 함께","인쇄 위치는 목 밑에서 ____mm","원단 컬러와 자수 컬러는 범례 따로"],"chk":["원단 · 색 · 사이즈별 수량","치수표","인쇄 위치 · 크기","라벨 · 행택"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"r","치수":"r","부자재":"o","주의사항":"o"}},{"k":"pajama","n":"파자마 (긴바지 · 반바지)","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"상의","note":"","f":"pajama_0.svg"},{"t":"하의","note":"","f":"pajama_1.svg"}],"vs":[["원단","____"],["컬러","원단 스와치"],["가공","____"]],"mat":["면","레이온","모달","극세사","플란넬"],"det":[["원단 색",["원단 스와치 번호"]],["패턴",["단색","전체 프린트 (반복)"]]],"proc":["나염 (전체 프린트)","자수","실크 인쇄"],"col":["원단 스와치","PANTONE TCX","CMYK (디지털 나염)"],"dims":["상의: 총장 · 가슴 단면 · 소매 길이","하의: 허리 단면 · 엉덩이 · 밑위 · 총장 · 밑단","반바지: 총장 · 밑단 너비"],"acc":[["허리",["밴드","밴드 + 끈"]],["단추",["____"]],["라벨",["케어 라벨","목 라벨"]]],"pack":["OPP 세트","파우치"],"warn":["반복 무늬는 리피트 크기 표기","상 · 하의 원단 색 맞춤"],"chk":["원단 · 색 · 사이즈별 수량","상하의 치수표","단추 · 밴드"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"r","치수":"r","부자재":"o","주의사항":"o"}},{"k":"cap","n":"모자","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"cap_0.svg"},{"t":"뒷면","note":"","f":"cap_1.svg"}],"vs":[["원단","____"],["자수","____"],["조절","____"]],"mat":["면 트윌","코듀로이","나일론","니트 (비니)"],"det":[["종류",["볼캡","버킷햇","비니","스냅백"]],["원단 색",["원단 스와치 번호"]],["챙",["일자","곡선"]]],"proc":["자수","입체 자수","실크 인쇄","와펜"],"col":["원단 스와치","실색 스와치 (자수실 번호)"],"dims":["머리 둘레","앞판 자수 크기","자수 위치 (챙에서)","챙 길이"],"acc":[["조절",["스트랩 버클","스냅","벨크로","없음 (피티드)"]],["라벨",["안쪽 라벨","케어 라벨"]]],"pack":["OPP 개별","모양 유지 속지"],"warn":["앞판 가운데 솔기 위 자수 주의","곡면이라 자수 크기 작게 잡기"],"chk":["종류 · 원단 · 색","자수 실 번호 · 위치","조절 방식"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"r","치수":"o","부자재":"o","주의사항":"o"}},{"k":"socks","n":"양말","g":"의류 · 잡화","src":"양말 디자인","views":[{"t":"옆면","note":"부위","f":"socks_0.svg"}],"vs":[["편직","자카드 · ____N"],["색 수","____색"],["배색","뒤꿈치 · 발끝 · 고무단"]],"mat":["면 혼방","폴리","울 혼방"],"det":[["종류",["크루","스포츠","발목 · 덧신","니삭스","아기"]],["바늘 수",["168N","200N"]],["사이즈",["____mm"]]],"proc":["자카드 편직","자수 (포인트)","승화","360 디지털","논슬립 인쇄"],"col":["실색 스와치 (실 번호)","PANTONE TCX"],"dims":["목 길이","발 길이 (사이즈)","무늬 칸 수 (가로 × 세로)","논슬립 위치"],"acc":[["라벨 · 택",["헤더 택","띠지","행택"]]],"pack":["헤더 택 + OPP","세트 박스"],"warn":["뒤꿈치 · 발끝은 그림 불가 (배색만)","신으면 가로로 늘어남","아기 양말 KC"],"chk":["종류 · 길이 · 사이즈 · 수량","바늘 수 · 색 수 · 뜬실","배색","샘플 신어 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"r","치수":"r","부자재":"o","주의사항":"o"}},{"k":"slipper","n":"슬리퍼","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"위 · 바닥","note":"","f":"slipper_0.svg"}],"vs":[["갑피","____"],["바닥","____"],["가공","____"]],"mat":["극세사","보아","EVA","PU"],"det":[["원단 색",["원단 스와치 번호"]],["바닥",["EVA","논슬립 고무"]]],"proc":["자수","인쇄","와펜"],"col":["원단 스와치","실색 스와치"],"dims":["사이즈별 길이","갑피 자수 크기 · 위치"],"acc":[["라벨",["안쪽 라벨","택"]]],"pack":["OPP 한 켤레","택"],"warn":["사이즈별 수량 표","좌우 대칭 확인"],"chk":["소재 · 사이즈","자수 위치","바닥 논슬립"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"leather","n":"인조가죽 소품","g":"의류 · 잡화","src":"인조가죽 (PVC · PU) 디자인","views":[{"t":"전개도","note":"","f":"leather_0.svg"},{"t":"조립도","note":"","f":"leather_1.svg"}],"vs":[["소재","PU · PVC"],["가공","박 · 형압 · ____"],["엣지","____"]],"mat":["PU","PVC","사피아노","리치 무늬","스웨이드"],"det":[["색",["원단 스와치 번호"]],["표면",["무늬 없음","사피아노","리치","____"]],["두께",["____mm"]]],"proc":["박 (핫스탬핑)","형압 (디보싱)","엠보싱","실크 · UV 인쇄","레이저 각인 (PU만)","고주파 (PVC)"],"col":["원단 스와치","박 색 (번호)","PANTONE C (인쇄)"],"dims":["전개 가로 · 세로","완성 가로 · 세로","박음선 (끝에서 3~5mm)","가공 위치 (mm)","카드 칸 · 구멍"],"acc":[["실 색",["____"]],["엣지 색",["____"]],["부속",["똑딱이","고리","지퍼"]]],"pack":["OPP 개별","종이 띠"],"warn":["접는 선 양옆 5mm 비움","PVC는 레이저 각인 금지","박 글자 2mm · 형압 3mm 이상"],"chk":["소재 · 색 · 표면 무늬","가공 · 박 색 · 위치 치수","박음선 · 접는 선 비움","실 색 · 엣지 색"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"magsafe","n":"맥세이프 카드지갑","g":"의류 · 잡화","src":"맥세이프 카드지갑 디자인","views":[{"t":"앞 (밖)","note":"","f":"magsafe_0.svg"},{"t":"뒤 (폰 쪽)","note":"","f":"magsafe_1.svg"}],"vs":[["소재","____"],["가공","____"],["자석","____"]],"mat":["PU","실리콘","PVC"],"det":[["색",["원단 스와치 번호"]],["카드 장수",["1장","2장","3장"]]],"proc":["박","형압","UV 디지털 인쇄","레이저 각인"],"col":["원단 스와치","PANTONE C","박 색"],"dims":["전체 (약 63~65 × 95~97mm)","박음선 (3~4mm)","엄지 구멍 지름","자석 링 지름"],"acc":[["자석",["맥세이프 링"]],["안내문",["자기띠 카드 · 무선 충전 주의"]]],"pack":["개별 박스","안내 카드"],"warn":["자석 링 위 가공 · 두꺼운 형압 없음","엄지 구멍 둘레 5mm 비움"],"chk":["크기 · 소재 · 색 · 수량","카드 장수 · 자력 테스트","안내문","실제 폰에 붙여 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"mug","n":"머그 · 텀블러","g":"식기 · 소품","src":"용어·견본 MD","views":[{"t":"인쇄 펼침","note":"","f":"mug_0.svg"},{"t":"옆면","note":"","f":"mug_1.svg"}],"vs":[["소재","____"],["인쇄","____"],["용량","____ml"]],"mat":["도자기","유리","스테인리스","에나멜"],"det":[["용량",["____ml"]],["안쪽 색",["흰색","____"]],["손잡이 색",["____"]]],"proc":["전사 (데칼)","승화","UV","레이저 각인","실크"],"col":["PANTONE C","CMYK","도자기 색 견본"],"dims":["높이","지름 (위 · 아래)","인쇄 영역 (둘레 × 높이)","손잡이 쪽 비움"],"acc":[["뚜껑",["없음","실리콘","스테인리스"]]],"pack":["개별 박스","에어캡"],"warn":["식품 접촉 — 식품 안전 검사 확인","손잡이 양옆 인쇄 불가 범위 업체 확인"],"chk":["소재 · 용량 · 인쇄 방식","인쇄 영역","포장 · 파손"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"o","치수":"o","부자재":"o","주의사항":"o"}},{"k":"lanyard","n":"랜야드 · 스트랩","g":"식기 · 소품","src":"용어·견본 MD","views":[{"t":"펼침","note":"","f":"lanyard_0.svg"}],"vs":[["소재","____"],["인쇄","____"],["고리","____"]],"mat":["폴리 (승화)","나일론","면","실리콘 (폰 스트랩)"],"det":[["폭",["10","15","20mm"]],["길이",["____mm"]]],"proc":["승화 인쇄","실크","직조"],"col":["CMYK (승화)","PANTONE C"],"dims":["폭","전체 길이","인쇄 반복 간격"],"acc":[["고리",["훅","카라비너","분리 버클","폰 고리"]],["고리 색",["은","블랙"]]],"pack":["OPP 개별"],"warn":["양면 인쇄면 앞뒤 방향 표시"],"chk":["폭 · 길이","고리 종류","반복 무늬 방향"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"k":"grip","n":"스마트톡 · 그립톡","g":"식기 · 소품","src":"용어·견본 MD","views":[{"t":"윗면 · 옆면","note":"","f":"grip_0.svg"}],"vs":[["소재","____"],["인쇄","____"],["받침","____"]],"mat":["아크릴","PC (플라스틱)","에폭시"],"det":[["모양",["원형","칼선 (모양)"]],["받침 색",["흰색","투명","블랙"]]],"proc":["UV 인쇄","에폭시"],"col":["CMYK","화이트 판"],"dims":["지름 / 가로 · 세로","안전 영역","두께"],"acc":[["받침",["접이식","링"]]],"pack":["OPP + 대지"],"warn":["칼선형은 받침이 밖으로 보이지 않게"],"chk":["모양 · 크기","받침 색","인쇄면"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"k":"sewlabel","n":"봉제 라벨","g":"식기 · 소품","src":"봉제 라벨 디자인","views":[{"t":"전개도","note":"","f":"sewlabel_0.svg"},{"t":"조립도","note":"","f":"sewlabel_1.svg"}],"vs":[["방식","직조 · 인쇄"],["다는 법","____"],["실 색","____"]],"mat":["다마스크 직조","고밀도 직조","새틴 인쇄","면 인쇄","TPU"],"det":[["종류",["목 라벨","케어 라벨","루프폴드","맨하탄폴드","깃발"]],["바탕 색",["____"]]],"proc":["직조","인쇄","레이저 컷","열 컷"],"col":["실색 스와치 (실 번호)","PANTONE C"],"dims":["보이는 크기","전체 크기 (접는 여유 · 시접 포함)","박음 여백 (1.5~2mm)","글자 높이 (2mm↑)"],"acc":[["다는 법",["사면박이","양면박이","반 접기","깃발"]],["땀",["땀실 색","땀 길이 ____mm"]]],"pack":["롤 · 낱장"],"warn":["보이는 크기와 전개 크기 둘 다 표기","색직조는 업체 최대 색 수"],"chk":["실제 크기 (mm)","박음선 · 접는 선 레이어 분리","실 색 · 팬톤","수량 · 여유분"],"R":{"소재":"o","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}}];
var MM = 2.834645669;
var AW = 420 * MM, AH = 297 * MM;
var HERE = File($.fileName).parent;
var OUTNAME = '[PLYSH]MDWorkOrderFormat_Template(261123)';
var NOTE = [];

app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
var cols = 5;
var doc = app.documents.add(DocumentColorSpace.CMYK, AW, AH, DATA.length, DocumentArtboardLayout.GridByRow, 40 * MM, cols);

/* ── 별색 ── */
function spot(name, c, m, y, k) {
  var s; try { s = doc.spots.getByName(name); } catch (e) { s = doc.spots.add(); s.name = name; }
  var cc = new CMYKColor(); cc.cyan = c; cc.magenta = m; cc.yellow = y; cc.black = k;
  s.color = cc; s.colorType = ColorModel.SPOT;
  var sc = new SpotColor(); sc.spot = s; sc.tint = 100; return sc;
}
var C_LEN = spot('HYONA_Length', 0, 100, 0, 0);     // 길이 · 치수
var C_FOLD = spot('HYONA_Fold', 100, 0, 0, 0);      // 접지
var C_MAR = spot('HYONA_Margin', 100, 0, 100, 0);   // 여백 가이드
var C_CUT = spot('HYONA_Cut', 0, 100, 100, 0);      // 재단 · 톰슨 · 칼선
var C_TXT = spot('HYONA_Text', 0, 0, 0, 100);       // 설명 글자
var C_CHIP = spot('HYONA_ChipLine', 0, 0, 0, 40);   // 컬러칩 테두리 · 표 선
var C_REQ = spot('HYONA_Required', 0, 90, 80, 0);   // 필수 표시
function tint(sc, t) { var n = new SpotColor(); n.spot = sc.spot; n.tint = t; return n; }
var C_FILL = tint(C_CHIP, 12), C_SOFT = tint(C_CHIP, 6), C_MUTE = tint(C_TXT, 60);
var NOC = new NoColor();

/* ── 문자 스타일 ── */
function font(names) { for (var i = 0; i < names.length; i++) { try { return app.textFonts.getByName(names[i]); } catch (e) {} } NOTE.push('폰트 없음: ' + names[0]); return null; }
var F_R = font(['Pretendard-Regular', 'PretendardVariable-Regular', 'AppleSDGothicNeo-Regular']);
var F_B = font(['Pretendard-Bold', 'PretendardVariable-Bold', 'Pretendard-SemiBold', 'AppleSDGothicNeo-Bold']);
var F_S = font(['Pretendard-SemiBold', 'Pretendard-Bold', 'AppleSDGothicNeo-SemiBold']) || F_B;
function cstyle(name, f, size, color) {
  var st; try { st = doc.characterStyles.getByName(name); } catch (e) { st = doc.characterStyles.add(name); }
  var a = st.characterAttributes;
  if (f) a.textFont = f; a.size = size; a.tracking = -15;
  try { a.kerningMethod = AutoKernType.OPTICAL; } catch (e1) {}
  a.autoLeading = false; a.leading = size * 1.35; a.fillColor = color; return st;
}
var S = {
  title: cstyle('HYONA_Title', F_B, 22, C_TXT),
  eye: cstyle('HYONA_Eyebrow', F_R, 7, C_MUTE),
  head: cstyle('HYONA_Head', F_B, 8.5, C_TXT),
  label: cstyle('HYONA_Label', F_B, 7.5, C_TXT),
  body: cstyle('HYONA_Body', F_R, 7.5, C_TXT),
  hint: cstyle('HYONA_Hint', F_R, 6.5, C_MUTE),
  req: cstyle('HYONA_Req', F_S, 6.5, C_REQ),
  opt: cstyle('HYONA_Opt', F_S, 6.5, C_MUTE),
  dim: cstyle('HYONA_Dim', F_R, 7, C_LEN)
};

/* ── 그리기 도우미 (mm, 대지 왼쪽 위 기준) ── */
var L = 0, T = 0, layer, BUF = null;
function keep(it) { if (BUF) BUF.push(it); return it; }
function rowStart() { BUF = []; }
function rowEnd(name) { var b = BUF; BUF = null; if (!b || b.length < 2) return; var g = layer.groupItems.add(); g.name = name || 'row'; for (var i = b.length - 1; i >= 0; i--) b[i].move(g, ElementPlacement.PLACEATBEGINNING); }
function px(x) { return L + x * MM; } function py(y) { return T - y * MM; }
function rect(x, y, w, h, stroke, fill, sw) {
  var r = layer.pathItems.rectangle(py(y), px(x), w * MM, h * MM);
  r.filled = !!fill; if (fill) r.fillColor = fill;
  r.stroked = !!stroke; if (stroke) { r.strokeColor = stroke; r.strokeWidth = sw || 0.4; }
  return keep(r);
}
function line(x1, y1, x2, y2, col, sw, dash) {
  var p = layer.pathItems.add(); p.setEntirePath([[px(x1), py(y1)], [px(x2), py(y2)]]);
  p.filled = false; p.stroked = true; p.strokeColor = col; p.strokeWidth = sw || 0.5;
  if (dash) p.strokeDashes = dash; return keep(p);
}
function ptext(x, y, s, st, just) {
  var t = layer.textFrames.pointText([px(x), py(y)]); t.contents = s; st.applyTo(t.textRange, true);
  if (just) t.textRange.paragraphAttributes.justification = just; return keep(t);
}
// 영역 문자: 높이 0 이면 내용에 맞춰 높이 계산 → 실제 높이(mm) 반환
function atext(x, y, w, h, s, st, inset) {
  inset = inset == null ? 1.6 : inset;
  var hh = h || 60;
  var r = layer.pathItems.rectangle(py(y + inset * 0.6), px(x + inset), (w - inset * 2) * MM, hh * MM);
  var t = keep(layer.textFrames.areaText(r)); t.contents = s; st.applyTo(t.textRange, true);
  if (!h) {
    var n = 1; try { n = Math.max(1, t.lines.length); } catch (e) {}
    var need = n * st.characterAttributes.leading / MM + 1.2;
    t.textPath.height = need * MM; return need + inset * 1.2;
  }
  return h;
}
function nb(s) { return String(s).replace(/ /g, ' '); }
function opts(a) { var o = []; for (var i = 0; i < a.length; i++) o.push('□ ' + nb(a[i])); return o.join('    '); }
function blanks(s) { return String(s).replace(/____/g, '______'); }

/* 표: 머리 행 (회색) */
function headRow(x, y, w, title, lv) {
  rowStart(); var h = 6.5; rect(x, y, w, h, C_CHIP, C_FILL, 0.4);
  ptext(x + 1.8, y + 4.4, title, S.head);
  if (lv) { var tx = x + w - 2; ptext(tx, y + 4.3, lv == 'r' ? '필수' : '권장', lv == 'r' ? S.req : S.opt, Justification.RIGHT); }
  rowEnd('head ' + title); return h;
}
/* 표: 내용 한 칸 (전체 폭) */
function fullRow(x, y, w, s, st) {
  rowStart();
  var h = atext(x, y + 0.8, w, 0, s, st || S.body); h = Math.max(h + 0.8, 6.5);
  rect(x, y, w, h, C_CHIP, null, 0.4); rowEnd('row'); return h;
}
/* 표: 이름 | 내용 */
function kvRow(x, y, w, kw, k, s, st) {
  rowStart();
  var h = atext(x + kw, y + 0.8, w - kw, 0, s, st || S.body); h = Math.max(h + 0.8, 6.5);
  atext(x, y + 0.8, kw, h - 1, k, S.label);
  rect(x, y, kw, h, C_CHIP, C_SOFT, 0.4); rect(x + kw, y, w - kw, h, C_CHIP, null, 0.4); rowEnd(k); return h;
}

/* SVG 도면 → 별색으로 다시 칠하기 */
function near(c, a) { return Math.abs(c.cyan - a[0]) < 25 && Math.abs(c.magenta - a[1]) < 25 && Math.abs(c.yellow - a[2]) < 25 && Math.abs(c.black - a[3]) < 25; }
function mapCol(c) {
  if (!c || c.typename != 'CMYKColor') return null;
  if (c.magenta > 70 && c.yellow > 70 && c.cyan < 30) return C_CUT;
  if (c.magenta > 70 && c.yellow < 40 && c.cyan < 30) return C_LEN;
  if (c.cyan > 60 && c.yellow > 60 && c.magenta < 30) return C_MAR;
  if (c.cyan > 60 && c.magenta < 30 && c.yellow < 30) return C_FOLD;
  return null;
}
function recolor(it) {
  if (it.typename == 'GroupItem') { for (var i = 0; i < it.pageItems.length; i++) recolor(it.pageItems[i]); return; }
  if (it.typename == 'CompoundPathItem') { for (var j = 0; j < it.pathItems.length; j++) recolor(it.pathItems[j]); return; }
  if (it.typename == 'PathItem') {
    if (it.stroked) { var m = mapCol(it.strokeColor); if (m) { it.strokeColor = m; it.strokeOverprint = true; } }
    if (it.filled && it.fillColor.typename == 'CMYKColor' && it.fillColor.black > 70 && it.fillColor.cyan > 50) it.fillColor = C_TXT;
  }
  if (it.typename == 'TextFrame') {
    var fc = null; try { fc = it.textRange.characterAttributes.fillColor; } catch (e) {}
    var m2 = mapCol(fc); (m2 == C_LEN ? S.dim : S.hint).applyTo(it.textRange, true);
    if (m2 && m2 != C_LEN) it.textRange.characterAttributes.fillColor = m2;
  }
}
function placeSvg(f, x, y, w, h) {
  var file = File(HERE + '/svg/' + f);
  if (!file.exists) { NOTE.push('도면 파일 없음: ' + f); return; }
  var g = layer.groupItems.createFromFile(file);
  var sc = Math.min(w * MM / g.width, h * MM / g.height) * 100; g.resize(sc, sc);
  g.left = px(x + (w - g.width / MM) / 2); g.top = py(y + (h - g.height / MM) / 2);
  recolor(g);
}

/* ── 대지 하나 ── */
function board(i, d) {
  var ab = doc.artboards[i]; ab.name = d.k;
  var r = ab.artboardRect; L = r[0]; T = r[1];
  layer = doc.layers[0];
  var M = 15, W = 390;
  // 머리
  ptext(M, 18, 'SOUND CONTENTS 디자인4팀 · 상품 작업지시서 · ' + d.g, S.eye);
  ptext(M, 28, d.n, S.title);
  ptext(M + W, 22, '파일명  [Artist]ProjectName_Item(yymmdd)', S.body, Justification.RIGHT);
  ptext(M + W, 27, '깬 파일(_Outline) · 안 깬 파일 · PDF 3종 저장', S.hint, Justification.RIGHT);
  line(M, 31.5, M + W, 31.5, C_TXT, 1.2);
  var meta = ['아티스트', '프로젝트', '품목 · 버전', '업체', '담당', '작성일', '납기', '수량 (합계)', '멤버 · 버전별 수량', '샘플'];
  var cw = W / 5;
  for (var m = 0; m < 10; m++) {
    var cx = M + (m % 5) * cw, cy = 33 + Math.floor(m / 5) * 11;
    rect(cx, cy, cw, 11, C_CHIP, null, 0.4); ptext(cx + 1.8, cy + 3.8, meta[m], S.label);
  }
  // 왼쪽: 도면
  var LX = M, LW = 232, TOP = 61, nv = Math.min(d.views.length, 2), gap = 6;
  var vw = (LW - gap * (nv - 1)) / nv, yEnd = TOP;
  for (var v = 0; v < d.views.length && v < 2; v++) {
    var vx = LX + v * (vw + gap), vy = TOP, V = d.views[v];
    ptext(vx, vy + 4, V.t, S.head);
    if (V.note) ptext(vx + vw, vy + 4, V.note, S.hint, Justification.RIGHT);
    rect(vx, vy + 6, vw, 74, null, C_SOFT);
    placeSvg(V.f, vx + 2, vy + 8, vw - 4, 70);
    var sy = vy + 82, rows = (V.t == '조립도') ? [['조립 순서', ''], ['완성 크기', '']] : d.vs;
    for (var s = 0; s < rows.length; s++) sy += kvRow(vx, sy, vw, 20, rows[s][0], blanks(rows[s][1]), S.hint);
    if (sy > yEnd) yEnd = sy;
  }
  // 왼쪽 아래: 포장 · 주의사항 | 발주 전 확인
  var ly = yEnd + 6, hw = (LW - gap) / 2, ry;
  ry = ly + headRow(LX, ly, hw, '포장', 'o'); ry += fullRow(LX, ry, hw, opts(d.pack));
  ry += 3; ry += headRow(LX, ry, hw, '주의사항', d.R['주의사항']);
  var w2 = []; for (var a = 0; a < d.warn.length; a++) w2.push('• ' + d.warn[a]);
  ry += fullRow(LX, ry, hw, w2.join('\r'));
  var cy2 = ly + headRow(LX + hw + gap, ly, hw, '발주 전 확인');
  var c2 = []; for (var b = 0; b < d.chk.length; b++) c2.push('□  ' + d.chk[b]);
  cy2 += fullRow(LX + hw + gap, cy2, hw, c2.join('\r'));
  var leftBottom = Math.max(ry, cy2);

  // 오른쪽: 사양 표
  var RX = M + LW + 8, RW = W - LW - 8, KW = 24, y = TOP;
  y += headRow(RX, y, RW, '소재', d.R['소재']); y += fullRow(RX, y, RW, opts(d.mat)); y += 2.5;
  y += headRow(RX, y, RW, '소재 세부', d.R['소재 세부']);
  for (var e = 0; e < d.det.length; e++) y += kvRow(RX, y, RW, KW, d.det[e][0], blanks(opts(d.det[e][1])));
  y += 2.5;
  y += headRow(RX, y, RW, '인쇄 · 가공', d.R['인쇄 · 가공']); y += fullRow(RX, y, RW, opts(d.proc)); y += 2.5;
  y += headRow(RX, y, RW, '컬러 안내', d.R['컬러 안내']); y += fullRow(RX, y, RW, opts(d.col));
  for (var c = 0; c < 3; c++) {
    rect(RX, y, RW, 9, C_CHIP, null, 0.4);
    var ch = layer.pathItems.ellipse(py(y + 1.5), px(RX + 2), 6 * MM, 6 * MM); ch.filled = false; ch.stroked = true; ch.strokeColor = C_CHIP; ch.strokeWidth = 0.5;
    ptext(RX + 10, y + 4.2, 'PANTONE ________    영문 컬러명 ________', S.body);
    ptext(RX + 10, y + 7.6, '용도 (인쇄 · 원단 · 자수실 · 도금)', S.hint);
    y += 9;
  }
  y += 2.5;
  y += headRow(RX, y, RW, '치수 (mm · 정수)', d.R['치수']);
  var hw2 = RW / 2;
  for (var di = 0; di < d.dims.length; di += 2) {
    var h1 = kvRow(RX, y, hw2, hw2 - 16, d.dims[di], '____ mm', S.dim);
    var h2 = d.dims[di + 1] ? kvRow(RX + hw2, y, hw2, hw2 - 16, d.dims[di + 1], '____ mm', S.dim) : (rect(RX + hw2, y, hw2, h1, C_CHIP, null, 0.4), h1);
    y += Math.max(h1, h2);
  }
  y += 2.5;
  y += headRow(RX, y, RW, '부자재', d.R['부자재']);
  for (var q = 0; q < d.acc.length; q++) y += kvRow(RX, y, RW, KW, d.acc[q][0], blanks(opts(d.acc[q][1])));
  if (y > 279 || leftBottom > 279) NOTE.push(d.n + ': 아래 여백 넘침 (오른쪽 ' + Math.round(y) + 'mm · 왼쪽 ' + Math.round(leftBottom) + 'mm)');

  // 바닥: 표기 색 범례
  line(M, 282, M + W, 282, C_CHIP, 0.4);
  var lg = [['길이', C_LEN, null], ['접지', C_FOLD, null], ['여백 · 안전', C_MAR, [2, 1.5]], ['재단 · 칼선', C_CUT, null]], lx = M;
  for (var g = 0; g < lg.length; g++) { line(lx, 286.3, lx + 7, 286.3, lg[g][1], 1, lg[g][2]); ptext(lx + 9, 287.5, lg[g][0], S.hint); lx += 26; }
  var hasNet = false; for (var z = 0; z < d.views.length; z++) if (d.views[z].t == '전개도') hasNet = true;
  ptext(M + W, 287.5, (hasNet ? '전개도 + 조립도 함께 · ' : '') + '치수는 정수 mm (0.5 올림) · 가이드 · 후가공 별색 오버프린트 · 기준: 작업 기초 지침 › ' + d.src, S.hint, Justification.RIGHT);
}

for (var i = 0; i < DATA.length; i++) board(i, DATA[i]);
doc.layers[0].name = 'HYONA_WorkOrder';

// 저장: .ai (PDF 호환) + PDF
var ai = new IllustratorSaveOptions(); ai.pdfCompatible = true; ai.embedICCProfile = false; ai.compressed = true;
doc.saveAs(File(HERE + '/' + OUTNAME + '.ai'), ai);
var pdf = new PDFSaveOptions(); pdf.preserveEditability = false; pdf.viewAfterSaving = false;
doc.saveAs(File(HERE + '/' + OUTNAME + '.pdf'), pdf);
doc.saveAs(File(HERE + '/' + OUTNAME + '.ai'), ai);
// 품목별 .ai (대지 하나씩)
var sub = Folder(HERE + '/ByItem'); if (!sub.exists) sub.create();
try { var ai2 = new IllustratorSaveOptions(); ai2.pdfCompatible = true; ai2.compressed = true; ai2.saveMultipleArtboards = true; ai2.artboardRange = '1-' + DATA.length;
  doc.saveAs(File(sub + '/[PLYSH]MDWorkOrder.ai'), ai2); } catch (e) { NOTE.push('품목별 저장 실패: ' + e); }
var log = File(HERE + '/build_log.txt'); log.encoding = 'UTF-8'; log.open('w'); log.write('done ' + DATA.length + '\n' + NOTE.join('\n')); log.close();
})();
