// MD 상품 작업지시서 포맷 v2 — 품목별 대지 (PLYSH 디자인4팀)
// 왼쪽 = 정보 (일반 글자, 표 · 글상자 없음) / 오른쪽 = 디자인 1:1 자리.
// 글자 크기는 품목 크기에 따라 단계별 HYONA_ 문자 스타일 (XS · S · M · L · XL). 스타일 크기만 바꾸면 한 번에 조절됨.
#target illustrator
(function () {
var DATA = [{"D":60,"k":"acrKey","n":"아크릴 키링","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"앞면","note":"","f":"acrKey_0.svg"},{"t":"인쇄 층","note":"","f":"acrKey_1.svg"}],"vs":[["인쇄면","앞 · 뒤 · 양면"],["화이트","전체 · 부분 · 없음"],["칼선","그림 밖 2~3mm"]],"mat":["투명","유백 (반투명)","글리터","홀로그램","미러","야광"],"det":[["두께",["2T","3T","5T","____T"]],["인쇄면",["앞","뒤","양면 (화이트 샌드위치)"]],["화이트",["전체","부분","없음 (투명)"]]],"proc":["UV 인쇄","레이저 커팅","고리 구멍 타공","보호 필름 (출고 양면)"],"col":["CMYK","화이트 판","PANTONE C (별색 요청 시)"],"dims":["가로","세로","두께","고리 구멍 지름","구멍 위치 (끝에서)","칼선 여백"],"acc":[["고리",["O링","볼체인","D링","카라비너","랍스터"]],["고리 색",["은","금","블랙","____"]],["체인 길이",["____mm"]]],"pack":["OPP 개별","보호 필름 유지","대지 (헤더 카드)"],"warn":["인쇄는 칼선 2mm 안쪽까지 (UV 까짐)","폭 3mm 이하 · 뾰족한 돌기는 부러짐","고리 구멍은 칼선 끝에서 2mm 이상 안쪽","키링 긴 변 25~30mm 이상"],"chk":["종류 · 크기 · 두께 · 수량 · 고리","인쇄면과 화이트 범위","칼선 여백 · 가는 부분 · 구멍 위치","보호 필름 (촬영 땐 떼기)"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":150,"k":"acrStand","n":"아크릴 스탠드","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"전개도","note":"본체 + 받침 한 판","f":"acrStand_0.svg"},{"t":"조립도","note":"","f":"acrStand_1.svg"}],"vs":[["본체","____T · 인쇄면 ____"],["받침","____T · 인쇄 유무"],["탭 · 홈","업체 템플릿 값"]],"mat":["투명","유백 (반투명)","글리터","홀로그램","미러"],"det":[["본체 두께",["3T","5T","____T"]],["받침 두께",["3T","5T"]],["인쇄면",["앞","뒤","양면"]],["화이트",["전체","부분","없음"]]],"proc":["UV 인쇄","레이저 커팅","받침 인쇄","보호 필름"],"col":["CMYK","화이트 판"],"dims":["본체 가로 · 세로","받침 가로 · 세로","탭 폭 (본체 1/3↑)","탭 높이","홈 폭 (두께 + 0.1~0.2)","홈 길이 (탭 + 0.2~0.5)","전체 높이"],"acc":[["받침",["일체형 (끼움)","별도 받침 판","받침 없음"]]],"pack":["OPP 개별","본체 · 받침 분리 포장","조립 안내 카드"],"warn":["본체 긴 변 50mm 이상 (작으면 흔들림)","탭 · 홈은 업체 템플릿 그대로","받침에 묻히는 높이는 디자인 비움","디오라마는 판 사이 5mm 이상"],"chk":["종류 · 크기 · 두께 · 수량","인쇄면 · 화이트 범위","탭 · 홈 = 업체 템플릿","조립도로 앞뒤 · 겹침 확인"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":70,"k":"acrShaker","n":"아크릴 셰이커","g":"아크릴","src":"아크릴 굿즈 디자인","views":[{"t":"층 구성","note":"","f":"acrShaker_0.svg"},{"t":"조립도","note":"","f":"acrShaker_1.svg"}],"vs":[["앞판","____T · 인쇄"],["테두리","____T"],["뒤판","____T · 인쇄"]],"mat":["투명","글리터","홀로그램"],"det":[["층 두께",["앞 ____T","테두리 ____T","뒤 ____T"]],["충전물",["글리터","비즈","아크릴 조각","오일 (액체)"]],["충전 양",["____g · ____개"]]],"proc":["UV 인쇄 (앞 · 뒤)","레이저 커팅","층 접착"],"col":["CMYK","화이트 판","충전물 색 (실물 사진)"],"dims":["가로","세로","층별 두께","속 빈 칸 크기","고리 구멍 (있으면)"],"acc":[["고리",["없음","O링","볼체인"]],["스탠드",["없음","받침"]]],"pack":["OPP 개별","보호 필름"],"warn":["층마다 1~3mm","충전물이 비치는 칸에 화이트 넣지 않기","액체는 새는지 업체 확인"],"chk":["층 수 · 두께","충전물 종류 · 양","앞뒤 인쇄 위치 겹침"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":35,"k":"metalBadge","n":"메탈 뱃지","g":"금속","src":"메탈 뱃지 디자인","views":[{"t":"앞면","note":"","f":"metalBadge_0.svg"},{"t":"뒷면","note":"","f":"metalBadge_1.svg"}],"vs":[["방식","하드 · 소프트 · 에폭시"],["도금","____"],["색 수","____색"]],"mat":["아연 합금","철","구리","스테인리스 (에칭)"],"det":[["방식",["하드 에나멜","소프트 에나멜","소프트 + 에폭시","인쇄 + 에폭시","에칭","다이캐스팅 3D"]],["도금",["금","은","니켈","블랙 니켈","로즈골드","앤틱"]],["두께",["____mm"]]],"proc":["금형","도금","에나멜 채움","에폭시","뒷면 각인","뒷면 무늬"],"col":["PANTONE C (에나멜)","도금 색","CMYK (인쇄형)"],"dims":["가로","세로","두께","금속선 (0.3mm↑)","가장 좁은 색 칸 (0.5mm↑)","침 위치"],"acc":[["침 개수",["1개","2개 (25mm↑ · 가로 긴 뱃지)"]],["클러치",["나비","고무","잠금 (디럭스)","안전핀","자석"]],["클러치 색",["____"]],["뒷면 무늬",["민무늬","샌드","와플","동심원"]]],"pack":["OPP 개별","백카드 (대지)"],"warn":["모든 색 칸은 금속선으로 닫혀야 함","20mm 이하는 글자 · 칸이 거의 못 들어감","각인은 테두리 1mm 안쪽 · 침 둘레 3mm 비움"],"chk":["방식 · 크기 · 수량","도금 색 · 에나멜 팬톤 · 색 수","금속선 · 색 칸 · 글자 최소 크기","침 개수 · 클러치 · 뒷면 마감","샘플 실물 사진 확인 후 양산"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"r","치수":"r","부자재":"r","주의사항":"o"}},{"D":45,"k":"metalKey","n":"메탈 키링","g":"금속","src":"메탈 뱃지 디자인","views":[{"t":"앞면","note":"","f":"metalKey_0.svg"},{"t":"뒷면","note":"","f":"metalKey_1.svg"}],"vs":[["방식","하드 · 소프트 · 에폭시"],["도금","____"],["고리","____"]],"mat":["아연 합금","철","스테인리스"],"det":[["방식",["하드 에나멜","소프트 에나멜","에폭시","양면 금형"]],["도금",["금","은","니켈","블랙 니켈"]],["두께",["____mm"]]],"proc":["금형","도금","에나멜","고리 구멍"],"col":["PANTONE C (에나멜)","도금 색"],"dims":["가로","세로","두께","고리 구멍 지름"],"acc":[["고리",["O링","볼체인","카라비너","랍스터"]],["고리 색",["도금과 같음","____"]]],"pack":["OPP 개별","백카드"],"warn":["고리 구멍 둘레 금속 2mm 이상","양면이면 뒷면 도면 따로"],"chk":["방식 · 도금 · 색 수","고리 종류 · 색","샘플 확인"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"r","치수":"r","부자재":"r","주의사항":"o"}},{"D":58,"k":"canBadge","n":"캔뱃지","g":"금속","src":"캔뱃지 디자인","views":[{"t":"앞면","note":"재단 · 완성 · 안전","f":"canBadge_0.svg"},{"t":"단면","note":"","f":"canBadge_1.svg"}],"vs":[["완성 지름","____mm"],["필름","유광 · 무광"],["뒷면","____"]],"mat":["금속 쉘 + 인쇄 종이 + 필름"],"det":[["완성 지름",["25","32","38","44","58","75mm"]],["모양",["원형","사각","하트","타원","별"]],["필름",["유광","무광","홀로그램","글리터"]],["종이",["아트지","홀로그램지","펄지","크라프트"]]],"proc":["디지털 인쇄 (CMYK)","압착"],"col":["CMYK"],"dims":["완성 지름","재단 지름 (업체 템플릿)","안전 영역 (완성 − 약 6mm)"],"acc":[["뒷면",["안전핀","자석","거울","병따개","키링 고리","스탠드"]]],"pack":["OPP 개별","백카드"],"warn":["배경은 재단선까지 꽉 (흰 띠 방지)","완성 지름에 딱 붙은 테두리 선 금지","얼굴 사진엔 유광 · 무광 (홀로그램 X)","그림 위쪽 = 핀 방향 표시"],"chk":["완성 지름 · 수량 · 뒷면 · 필름","글자 · 얼굴 · 로고가 안전 영역 안","300ppi · CMYK · 아웃라인","세트는 같은 템플릿 · 같은 위치"],"R":{"소재":"o","소재 세부":"r","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":100,"k":"tin","n":"틴케이스","g":"금속","src":"틴케이스 디자인","views":[{"t":"전개도","note":"업체 다이 라인","f":"tin_0.svg"},{"t":"조립도","note":"","f":"tin_1.svg"}],"vs":[["윗면","____"],["옆면","배경 · 단순 패턴"],["형압","위치 · 크기"]],"mat":["양철 (틴 플레이트)"],"det":[["종류",["사각 경첩","뚜껑 끼움","원통","창 틴","슬라이드"]],["표면",["유광","무광","펄"]],["화이트 베이스",["전체","부분 (금속 살림)"]]],"proc":["평판 옵셋 (성형 전)","UV 디지털 (윗면만)","엠보 · 디보 (형압)"],"col":["CMYK","PANTONE C","화이트 베이스 판"],"dims":["가로","세로","높이","윗면 디자인 영역","성형선 위치","형압 위치"],"acc":[["속",["없음","스펀지","속지 · 트레이"]]],"pack":["OPP 개별","개별 박스"],"warn":["윗면은 성형선 3~5mm 안쪽","옆면 말림 2~3mm 비움","원통 이음선 양옆 3mm 글자 금지"],"chk":["종류 · 크기 · 수량 · 인쇄 방식","업체 전개도에 작업 · 성형선 표시","화이트 베이스 범위","이음선 · 경첩 위치"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":60,"k":"pvcKey","n":"PVC · 실리콘 키링","g":"PVC · 실리콘","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"pvcKey_0.svg"},{"t":"단면","note":"층 높이","f":"pvcKey_1.svg"}],"vs":[["소재","PVC · 실리콘"],["층","____층"],["색 수","____색"]],"mat":["소프트 PVC","실리콘","러버"],"det":[["면",["단면","양면"]],["층 수",["1층","2층","3층"]],["두께",["____mm"]],["특수",["야광","반투명","글리터"]]],"proc":["몰드 (금형)","칸마다 색 채움","인쇄 (작은 부분)"],"col":["PANTONE C (칸마다)"],"dims":["가로","세로","두께 (층별)","고리 구멍","칸막이 (0.8~1mm)"],"acc":[["고리",["O링","볼체인","D링","카라비너"]],["고리 색",["은","금","블랙"]]],"pack":["OPP 개별"],"warn":["칸마다 단색 · 그라데이션 불가","글자 3mm · 획 1mm 이상"],"chk":["층 · 색 수 · 팬톤","금형 도면 확인","샘플 색 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":250,"k":"doll","n":"봉제 인형","g":"봉제","src":"봉제 인형 · 봉제류 디자인","views":[{"t":"전개도","note":"패턴 조각","f":"doll_0.svg"},{"t":"조립도","note":"","f":"doll_1.svg"}],"vs":[["원단","____ · 털 ____mm"],["자수","눈 · 입 · 글자"],["라벨","위치 ____"]],"mat":["미니소프트 (단모 1~2mm)","밍크 (3~5mm)","보아 · 장모 (10mm↑)","면","펠트"],"det":[["원단 색",["원단 스와치 번호"]],["털 방향",["위 → 아래","____"]],["솜",["폴리 솜","알갱이 (비즈)","____g"]]],"proc":["재봉","자수 (눈 · 입)","승화 인쇄","아플리케"],"col":["원단 스와치","실색 스와치 (자수실 번호)","PANTONE TCX"],"dims":["완성 가로 · 세로","앉은 키 / 선 키","시접 (5~7mm)","자수 크기 · 위치","라벨 · 고리 위치"],"acc":[["라벨",["봉제 라벨","KC 라벨","케어 라벨"]],["고리",["없음","볼체인","O링"]],["부속",["눈 (자수 권장)","리본","옷"]]],"pack":["OPP 개별","택 (행택)"],"warn":["박음선 10mm 안쪽에 얼굴 · 글자","자수 글자 6mm↑ (밍크 · 보아 10mm↑)","작은 부품 · KC · 사용 연령 확인"],"chk":["크기 · 원단 · 털 길이 · 수량","자수 선 · 글자 최소","라벨 · 고리 위치","샘플 확인 후 수정 1~2회"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"r"}},{"D":110,"k":"dollKey","n":"인형 키링","g":"봉제","src":"봉제 인형 · 봉제류 디자인","views":[{"t":"전개도","note":"","f":"dollKey_0.svg"},{"t":"조립도","note":"","f":"dollKey_1.svg"}],"vs":[["원단","____"],["자수","____"],["고리","____"]],"mat":["미니소프트","밍크","보아","면"],"det":[["원단 색",["원단 스와치 번호"]],["솜",["폴리 솜","____g"]]],"proc":["재봉","자수","승화 인쇄"],"col":["원단 스와치","실색 스와치 (자수실 번호)"],"dims":["완성 가로 · 세로","시접 (3~5mm)","자수 크기","고리 달림 위치"],"acc":[["고리",["볼체인","O링","카라비너","D링"]],["고리 색",["은","금","____"]],["라벨",["봉제 라벨","KC 라벨"]]],"pack":["OPP 개별","헤더 택"],"warn":["작은 인형은 자수 위주 (인쇄 결 보임)","고리 달림 부분 보강 박음"],"chk":["크기 · 원단 · 고리","라벨 · KC","샘플 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":80,"k":"wappen","n":"와펜","g":"봉제","src":"와펜 디자인","views":[{"t":"앞면","note":"","f":"wappen_0.svg"},{"t":"뒷면","note":"","f":"wappen_1.svg"}],"vs":[["종류","평자수 · 입체 · 직조 · PVC"],["테두리","메로우 · 히트컷"],["색 수","____색"]],"mat":["자수 (평자수)","입체 자수 (3D 퍼프)","시닐","직조","프린트","PVC"],"det":[["바탕 원단",["트윌","펠트","원단 스와치 번호"]],["자수 비율",["100%","75%"]]],"proc":["자수","직조","인쇄"],"col":["실색 스와치 (실 번호)","원단 스와치","PANTONE C (PVC)"],"dims":["가로 · 세로 / 지름","테두리 폭 (메로우 3~4mm)","글자 높이 (평자수 5mm↑)"],"acc":[["뒷면",["열접착","벨크로","안전핀","박음용 (처리 없음)"]],["테두리",["메로우","새틴","히트컷"]]],"pack":["OPP 개별","백카드"],"warn":["테두리 안쪽에만 디자인","메로우는 단순한 모양만 (25~30mm↑)","평자수 9~12색이 보통"],"chk":["종류 · 크기 · 수량 · 테두리","실 번호 · 원단색 · 자수 비율","뒷면 · 부착 원단","자수 스와치 사진 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"r","치수":"r","부자재":"r","주의사항":"o"}},{"D":200,"k":"pouch","n":"파우치","g":"봉제","src":"인조가죽 · 봉제류","views":[{"t":"앞면","note":"","f":"pouch_0.svg"},{"t":"옆면","note":"마치","f":"pouch_1.svg"}],"vs":[["원단","____"],["지퍼","____"],["가공","인쇄 · 자수 · ____"]],"mat":["캔버스","옥스포드","나일론","PU · PVC","퍼 · 보아","면"],"det":[["원단 색",["원단 스와치 번호"]],["두께",["____수 · ____oz"]],["안감",["있음","없음"]],["심",["있음","없음"]]],"proc":["실크 인쇄","디지털 인쇄","자수","박","형압"],"col":["원단 스와치","PANTONE C (인쇄)","PANTONE TCX (원단)","실색 스와치 (자수)"],"dims":["가로","세로","마치 (바닥 폭)","지퍼 길이","인쇄 · 자수 위치 (끝에서)"],"acc":[["지퍼",["코일","금속","비슬론"]],["지퍼 색",["____"]],["풀러",["기본","가죽 끈","커스텀 메탈"]],["라벨",["루프폴드","맨하탄폴드","행택"]]],"pack":["OPP 개별","행택"],"warn":["박음선 · 시접 위 인쇄 금지","안감 색 · 지퍼 색 함께 지정"],"chk":["원단 · 색 · 크기 · 수량","지퍼 종류 · 색 · 풀러","라벨 위치","샘플 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":400,"k":"bag","n":"에코백 · 가방","g":"봉제","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"bag_0.svg"},{"t":"옆면","note":"마치","f":"bag_1.svg"}],"vs":[["원단","____"],["손잡이","____"],["가공","____"]],"mat":["캔버스 (면)","옥스포드","나일론","부직포","데님"],"det":[["원단 두께",["10수","16수","20수","____oz"]],["원단 색",["원단 스와치 번호"]],["안감 · 주머니",["없음","안주머니","안감"]]],"proc":["실크 인쇄","DTF 전사","자수","디지털 인쇄"],"col":["원단 스와치","PANTONE C (인쇄)","실색 스와치 (자수)"],"dims":["가로","세로","마치","손잡이 길이 · 폭","인쇄 크기 · 위치"],"acc":[["손잡이",["같은 원단","웨빙","가죽"]],["여밈",["없음","똑딱이","지퍼","자석"]],["라벨",["루프폴드","맨하탄폴드","행택"]]],"pack":["OPP 개별","접기 방법"],"warn":["인쇄 판 크기 업체 최대 확인","진한 원단 위 인쇄는 화이트 하판"],"chk":["원단 · 색 · 크기","손잡이 길이","인쇄 위치 · 도수","샘플"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":1000,"k":"blanket","n":"담요 · 쿠션 · 타월","g":"봉제","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"blanket_0.svg"},{"t":"옆면 · 두께","note":"","f":"blanket_1.svg"}],"vs":[["원단","____"],["끝 처리","____"],["가공","____"]],"mat":["극세사","플리스","면 타월","폴리 (승화)","자카드 직조"],"det":[["원단 색",["원단 스와치 번호"]],["중량",["____g · ____gsm"]],["속 (쿠션)",["솜","____g","지퍼 커버"]]],"proc":["승화 인쇄","자카드 직조","자수","나염"],"col":["CMYK (승화)","원단 스와치","실색 스와치"],"dims":["가로","세로","두께 (쿠션)","끝 처리 폭"],"acc":[["끝 처리",["오버록","바이어스","술 (프린지)","말아박기"]],["라벨",["케어 라벨","봉제 라벨"]]],"pack":["OPP 개별","띠지","개별 박스"],"warn":["디자인은 끝 처리 폭 안쪽","타월은 표면 결 때문에 작은 글자 뭉개짐"],"chk":["원단 · 크기 · 중량","끝 처리","케어 라벨"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":600,"k":"tee","n":"의류 (티 · 맨투맨 · 후디)","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"tee_0.svg"},{"t":"뒷면","note":"","f":"tee_1.svg"}],"vs":[["원단","____수 · ____"],["컬러","원단 스와치"],["가공","____"]],"mat":["면 100%","면 · 폴리 혼방","기모","쭈리","폴리 (기능성)"],"det":[["원단 두께",["20수","30수","____g"]],["원단 색",["원단 스와치 번호"]],["핏",["레귤러","오버핏","____"]]],"proc":["실크 인쇄","DTF","DTG","자수","승화"],"col":["원단 스와치","PANTONE C (인쇄)","실색 스와치 (자수)"],"dims":["총장","가슴 단면","어깨","소매 길이 (팔길이)","소매 너비","하단 너비","진동","소매 시보리 높이","밑단 시보리 높이","인쇄 크기 · 위치 (목에서)"],"acc":[["라벨",["목 라벨 (직조 · 인쇄)","케어 라벨","루프폴드","맨하탄폴드"]],["행택",["있음 (타공 위치)","없음"]],["후디",["끈 · 끈 끝","지퍼"]]],"pack":["OPP 개별 (접기)","사이즈 스티커"],"warn":["사이즈별 치수표 (S · M · L · XL) 함께","인쇄 위치는 목 밑에서 ____mm","원단 컬러와 자수 컬러는 범례 따로"],"chk":["원단 · 색 · 사이즈별 수량","치수표","인쇄 위치 · 크기","라벨 · 행택"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"r","치수":"r","부자재":"o","주의사항":"o"}},{"D":700,"k":"pajama","n":"파자마 (긴바지 · 반바지)","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"상의","note":"","f":"pajama_0.svg"},{"t":"하의","note":"","f":"pajama_1.svg"}],"vs":[["원단","____"],["컬러","원단 스와치"],["가공","____"]],"mat":["면","레이온","모달","극세사","플란넬"],"det":[["원단 색",["원단 스와치 번호"]],["패턴",["단색","전체 프린트 (반복)"]]],"proc":["나염 (전체 프린트)","자수","실크 인쇄"],"col":["원단 스와치","PANTONE TCX","CMYK (디지털 나염)"],"dims":["상의: 총장 · 가슴 단면 · 소매 길이","하의: 허리 단면 · 엉덩이 · 밑위 · 총장 · 밑단","반바지: 총장 · 밑단 너비"],"acc":[["허리",["밴드","밴드 + 끈"]],["단추",["____"]],["라벨",["케어 라벨","목 라벨"]]],"pack":["OPP 세트","파우치"],"warn":["반복 무늬는 리피트 크기 표기","상 · 하의 원단 색 맞춤"],"chk":["원단 · 색 · 사이즈별 수량","상하의 치수표","단추 · 밴드"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"r","치수":"r","부자재":"o","주의사항":"o"}},{"D":300,"k":"cap","n":"모자","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"앞면","note":"","f":"cap_0.svg"},{"t":"뒷면","note":"","f":"cap_1.svg"}],"vs":[["원단","____"],["자수","____"],["조절","____"]],"mat":["면 트윌","코듀로이","나일론","니트 (비니)"],"det":[["종류",["볼캡","버킷햇","비니","스냅백"]],["원단 색",["원단 스와치 번호"]],["챙",["일자","곡선"]]],"proc":["자수","입체 자수","실크 인쇄","와펜"],"col":["원단 스와치","실색 스와치 (자수실 번호)"],"dims":["머리 둘레","앞판 자수 크기","자수 위치 (챙에서)","챙 길이"],"acc":[["조절",["스트랩 버클","스냅","벨크로","없음 (피티드)"]],["라벨",["안쪽 라벨","케어 라벨"]]],"pack":["OPP 개별","모양 유지 속지"],"warn":["앞판 가운데 솔기 위 자수 주의","곡면이라 자수 크기 작게 잡기"],"chk":["종류 · 원단 · 색","자수 실 번호 · 위치","조절 방식"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"r","치수":"o","부자재":"o","주의사항":"o"}},{"D":300,"k":"socks","n":"양말","g":"의류 · 잡화","src":"양말 디자인","views":[{"t":"옆면","note":"부위","f":"socks_0.svg"}],"vs":[["편직","자카드 · ____N"],["색 수","____색"],["배색","뒤꿈치 · 발끝 · 고무단"]],"mat":["면 혼방","폴리","울 혼방"],"det":[["종류",["크루","스포츠","발목 · 덧신","니삭스","아기"]],["바늘 수",["168N","200N"]],["사이즈",["____mm"]]],"proc":["자카드 편직","자수 (포인트)","승화","360 디지털","논슬립 인쇄"],"col":["실색 스와치 (실 번호)","PANTONE TCX"],"dims":["목 길이","발 길이 (사이즈)","무늬 칸 수 (가로 × 세로)","논슬립 위치"],"acc":[["라벨 · 택",["헤더 택","띠지","행택"]]],"pack":["헤더 택 + OPP","세트 박스"],"warn":["뒤꿈치 · 발끝은 그림 불가 (배색만)","신으면 가로로 늘어남","아기 양말 KC"],"chk":["종류 · 길이 · 사이즈 · 수량","바늘 수 · 색 수 · 뜬실","배색","샘플 신어 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"r","치수":"r","부자재":"o","주의사항":"o"}},{"D":280,"k":"slipper","n":"슬리퍼","g":"의류 · 잡화","src":"용어·견본 MD","views":[{"t":"위 · 바닥","note":"","f":"slipper_0.svg"}],"vs":[["갑피","____"],["바닥","____"],["가공","____"]],"mat":["극세사","보아","EVA","PU"],"det":[["원단 색",["원단 스와치 번호"]],["바닥",["EVA","논슬립 고무"]]],"proc":["자수","인쇄","와펜"],"col":["원단 스와치","실색 스와치"],"dims":["사이즈별 길이","갑피 자수 크기 · 위치"],"acc":[["라벨",["안쪽 라벨","택"]]],"pack":["OPP 한 켤레","택"],"warn":["사이즈별 수량 표","좌우 대칭 확인"],"chk":["소재 · 사이즈","자수 위치","바닥 논슬립"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":200,"k":"leather","n":"인조가죽 소품","g":"의류 · 잡화","src":"인조가죽 (PVC · PU) 디자인","views":[{"t":"전개도","note":"","f":"leather_0.svg"},{"t":"조립도","note":"","f":"leather_1.svg"}],"vs":[["소재","PU · PVC"],["가공","박 · 형압 · ____"],["엣지","____"]],"mat":["PU","PVC","사피아노","리치 무늬","스웨이드"],"det":[["색",["원단 스와치 번호"]],["표면",["무늬 없음","사피아노","리치","____"]],["두께",["____mm"]]],"proc":["박 (핫스탬핑)","형압 (디보싱)","엠보싱","실크 · UV 인쇄","레이저 각인 (PU만)","고주파 (PVC)"],"col":["원단 스와치","박 색 (번호)","PANTONE C (인쇄)"],"dims":["전개 가로 · 세로","완성 가로 · 세로","박음선 (끝에서 3~5mm)","가공 위치 (mm)","카드 칸 · 구멍"],"acc":[["실 색",["____"]],["엣지 색",["____"]],["부속",["똑딱이","고리","지퍼"]]],"pack":["OPP 개별","종이 띠"],"warn":["접는 선 양옆 5mm 비움","PVC는 레이저 각인 금지","박 글자 2mm · 형압 3mm 이상"],"chk":["소재 · 색 · 표면 무늬","가공 · 박 색 · 위치 치수","박음선 · 접는 선 비움","실 색 · 엣지 색"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":100,"k":"magsafe","n":"맥세이프 카드지갑","g":"의류 · 잡화","src":"맥세이프 카드지갑 디자인","views":[{"t":"앞 (밖)","note":"","f":"magsafe_0.svg"},{"t":"뒤 (폰 쪽)","note":"","f":"magsafe_1.svg"}],"vs":[["소재","____"],["가공","____"],["자석","____"]],"mat":["PU","실리콘","PVC"],"det":[["색",["원단 스와치 번호"]],["카드 장수",["1장","2장","3장"]]],"proc":["박","형압","UV 디지털 인쇄","레이저 각인"],"col":["원단 스와치","PANTONE C","박 색"],"dims":["전체 (약 63~65 × 95~97mm)","박음선 (3~4mm)","엄지 구멍 지름","자석 링 지름"],"acc":[["자석",["맥세이프 링"]],["안내문",["자기띠 카드 · 무선 충전 주의"]]],"pack":["개별 박스","안내 카드"],"warn":["자석 링 위 가공 · 두꺼운 형압 없음","엄지 구멍 둘레 5mm 비움"],"chk":["크기 · 소재 · 색 · 수량","카드 장수 · 자력 테스트","안내문","실제 폰에 붙여 확인"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":280,"k":"mug","n":"머그 · 텀블러","g":"식기 · 소품","src":"용어·견본 MD","views":[{"t":"인쇄 펼침","note":"","f":"mug_0.svg"},{"t":"옆면","note":"","f":"mug_1.svg"}],"vs":[["소재","____"],["인쇄","____"],["용량","____ml"]],"mat":["도자기","유리","스테인리스","에나멜"],"det":[["용량",["____ml"]],["안쪽 색",["흰색","____"]],["손잡이 색",["____"]]],"proc":["전사 (데칼)","승화","UV","레이저 각인","실크"],"col":["PANTONE C","CMYK","도자기 색 견본"],"dims":["높이","지름 (위 · 아래)","인쇄 영역 (둘레 × 높이)","손잡이 쪽 비움"],"acc":[["뚜껑",["없음","실리콘","스테인리스"]]],"pack":["개별 박스","에어캡"],"warn":["식품 접촉 — 식품 안전 검사 확인","손잡이 양옆 인쇄 불가 범위 업체 확인"],"chk":["소재 · 용량 · 인쇄 방식","인쇄 영역","포장 · 파손"],"R":{"소재":"r","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"o","치수":"o","부자재":"o","주의사항":"o"}},{"D":500,"k":"lanyard","n":"랜야드 · 스트랩","g":"식기 · 소품","src":"용어·견본 MD","views":[{"t":"펼침","note":"","f":"lanyard_0.svg"}],"vs":[["소재","____"],["인쇄","____"],["고리","____"]],"mat":["폴리 (승화)","나일론","면","실리콘 (폰 스트랩)"],"det":[["폭",["10","15","20mm"]],["길이",["____mm"]]],"proc":["승화 인쇄","실크","직조"],"col":["CMYK (승화)","PANTONE C"],"dims":["폭","전체 길이","인쇄 반복 간격"],"acc":[["고리",["훅","카라비너","분리 버클","폰 고리"]],["고리 색",["은","블랙"]]],"pack":["OPP 개별"],"warn":["양면 인쇄면 앞뒤 방향 표시"],"chk":["폭 · 길이","고리 종류","반복 무늬 방향"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}},{"D":45,"k":"grip","n":"스마트톡 · 그립톡","g":"식기 · 소품","src":"용어·견본 MD","views":[{"t":"윗면 · 옆면","note":"","f":"grip_0.svg"}],"vs":[["소재","____"],["인쇄","____"],["받침","____"]],"mat":["아크릴","PC (플라스틱)","에폭시"],"det":[["모양",["원형","칼선 (모양)"]],["받침 색",["흰색","투명","블랙"]]],"proc":["UV 인쇄","에폭시"],"col":["CMYK","화이트 판"],"dims":["지름 / 가로 · 세로","안전 영역","두께"],"acc":[["받침",["접이식","링"]]],"pack":["OPP + 대지"],"warn":["칼선형은 받침이 밖으로 보이지 않게"],"chk":["모양 · 크기","받침 색","인쇄면"],"R":{"소재":"r","소재 세부":"o","인쇄 · 가공":"o","컬러 안내":"o","치수":"r","부자재":"o","주의사항":"o"}},{"D":60,"k":"sewlabel","n":"봉제 라벨","g":"식기 · 소품","src":"봉제 라벨 디자인","views":[{"t":"전개도","note":"","f":"sewlabel_0.svg"},{"t":"조립도","note":"","f":"sewlabel_1.svg"}],"vs":[["방식","직조 · 인쇄"],["다는 법","____"],["실 색","____"]],"mat":["다마스크 직조","고밀도 직조","새틴 인쇄","면 인쇄","TPU"],"det":[["종류",["목 라벨","케어 라벨","루프폴드","맨하탄폴드","깃발"]],["바탕 색",["____"]]],"proc":["직조","인쇄","레이저 컷","열 컷"],"col":["실색 스와치 (실 번호)","PANTONE C"],"dims":["보이는 크기","전체 크기 (접는 여유 · 시접 포함)","박음 여백 (1.5~2mm)","글자 높이 (2mm↑)"],"acc":[["다는 법",["사면박이","양면박이","반 접기","깃발"]],["땀",["땀실 색","땀 길이 ____mm"]]],"pack":["롤 · 낱장"],"warn":["보이는 크기와 전개 크기 둘 다 표기","색직조는 업체 최대 색 수"],"chk":["실제 크기 (mm)","박음선 · 접는 선 레이어 분리","실 색 · 팬톤","수량 · 여유분"],"R":{"소재":"o","소재 세부":"r","인쇄 · 가공":"r","컬러 안내":"o","치수":"r","부자재":"r","주의사항":"o"}}];
var MM = 2.834645669;
var HERE = File($.fileName).parent;
var OUTNAME = '[PLYSH]MDWorkOrderFormat_Template(261123)';
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
    right = Math.max(right, vx + cw); vx += cw + Math.max(20, 60 * k);
  }
  var c3 = ptext(dx, viewBottom + VL * 1.2, '디자인이 여러 개면 오른쪽 · 아래로 이어서 배치하고, 이 대지를 늘려 쓰기', S.vhint);
  right = Math.max(right, dx + c3.width / MM);
  var W = right + M, H = Math.max(infoBottom, viewBottom + VL * 2 + M);
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
var sub = Folder(HERE + '/ByItem'); if (!sub.exists) sub.create();
try { var ai2 = new IllustratorSaveOptions(); ai2.pdfCompatible = true; ai2.compressed = true; ai2.saveMultipleArtboards = true; ai2.artboardRange = '1-' + DATA.length;
  doc.saveAs(File(sub + '/[PLYSH]MDWorkOrder.ai'), ai2); } catch (e) { NOTE.push('품목별 저장 실패: ' + e); }
var log = File(HERE + '/build_log.txt'); log.encoding = 'UTF-8'; log.open('w'); log.write('v2 done ' + DATA.length + '\n' + NOTE.join('\n')); log.close();
})();
