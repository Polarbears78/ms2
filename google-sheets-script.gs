/**
 * MS2 과학 활동지 생성기 - Google Sheets Apps Script
 *
 * 사용법:
 * 1. Google Sheets에서 [확장 프로그램] → [Apps Script] 열기
 * 2. 이 코드를 그대로 붙여넣고 저장
 * 3. 시트로 돌아가면 메뉴바에 "📝 활동지 생성" 추가됨
 */


// ============================================================
//  🌐 WEB APP (doGet / doPost)
// ============================================================

function doGet() {
  return HtmlService.createHtmlOutput(HTML_FORM)
    .setTitle('MS2 과학 활동지 생성기')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  const unit = e.parameter.unit;
  const type = e.parameter.type;
  const count = parseInt(e.parameter.count || '5');
  const isTeacher = e.parameter.teacher === 'true';
  
  const html = buildWorksheetHTML(unit, type, count, isTeacher);
  return HtmlService.createHtmlOutput(html)
    .setTitle('📝 활동지')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 메뉴 생성
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📝 활동지 생성')
    .addItem('활동지 생성하기', 'showDialog')
    .addToUi();
}

// 대화상자 표시
function showDialog() {
  const html = HtmlService.createHtmlOutput(HTML_FORM)
    .setWidth(450)
    .setHeight(420)
    .setTitle('MS2 과학 활동지 생성기');
  SpreadsheetApp.getUi().showModalDialog(html, 'MS2 활동지 생성');
}

// === 데이터베이스 ===
const DB = {
  '2': {
    title: 'II. 물질의 구성',
    total: [
      {q:'물질을 구성하는 가장 작은 기본 입자를 (  )라고 한다.', a:'원자'},
      {q:'원자핵을 구성하는 두 입자는 (  )과 (  )이다.', a:'양성자, 중성자'},
      {q:'원자 번호는 원자핵 속의 (  ) 수와 같다.', a:'양성자'},
      {q:'전자가 채워지는 전자껍질은 안쪽부터 (  )껍질, (  )껍질, (  )껍질 순이다.', a:'K, L, M'},
      {q:'1족 원소는 (  ) 금속이라고 하며, 물과 반응하면 수소 기체가 발생한다.', a:'알칼리'},
      {q:'17족 원소를 (  ) 원소라고 하며, 대표적으로 염소(Cl)가 있다.', a:'할로젠'},
      {q:'원소의 주기적 성질에서 같은 주기에서는 오른쪽으로 갈수록 원자 반지름이 (  ).', a:'감소한다'},
      {q:'이온 결합은 (  )이온과 (  )이온 사이의 정전기적 인력으로 형성된다.', a:'양, 음'},
      {q:'NaCl과 같이 이온 결합으로 이루어진 물질은 (  ) 상태에서 전기 전도성이 있다.', a:'액체(용융)'},
      {q:'공유 결합은 원자들이 (  )쌍을 공유하여 형성된다.', a:'전자'},
      {q:'분자식이 CO₂인 물질의 이름은 (  )이다.', a:'이산화탄소'},
      {q:'같은 원소지만 원자량이 다른 원소를 (  )라고 한다.', a:'동위원소'},
      {q:'원소 기호 Na는 (  )을/를 나타낸다.', a:'나트륨'},
      {q:'주기율표에서 세로줄을 (  )이라고 한다.', a:'족'},
      {q:'18족 원소는 반응성이 매우 낮아 (  ) 기체라고 불린다.', a:'비활성(희유)'},
    ],
    essay: [
      {q:'이온 결합과 공유 결합의 차이점을 결합 방식과 예시를 들어 서술하시오.', a:'이온 결합은 양이온과 음이온 사이의 정전기적 인력으로 형성되며 (예: NaCl), 공유 결합은 원자들이 전자쌍을 공유하여 형성된다 (예: H₂O).'},
      {q:'원소의 주기적 성질 중 \'원자 반지름\'이 같은 족에서 아래로 갈수록 증가하는 이유를 설명하시오.', a:'같은 족에서 아래로 갈수록 전자껍질 수가 증가하기 때문에 원자 반지름이 증가한다.'},
      {q:'알칼리 금속(1족)의 공통된 성질 3가지를 쓰고 그 이유를 설명하시오.', a:'①은백색 광택, ②전기전도성, ③물과 반응하여 수소 발생. 모두 최외각 전자가 1개이기 때문에 화학적 성질이 유사하다.'},
      {q:'이온 결합 물질(NaCl)이 고체 상태에서는 전기 전도성이 없지만 액체(용융) 상태에서는 전도성을 가지는 이유를 쓰시오.', a:'고체에서는 이온이 제자리에 고정되어 있지만, 액체(용융) 상태에서는 이온이 자유롭게 이동할 수 있기 때문이다.'},
      {q:'동위원소의 정의를 쓰고, 수소의 동위원소 3가지를 쓰시오.', a:'동위원소: 원자 번호는 같으나 중성자 수가 달라 질량수가 다른 원소. 수소의 동위원소: 프로튬(¹H), 중수소(²H), 삼중수소(³H).'},
    ]
  },
  '3': {
    title: 'III. 우리 주변의 화합물',
    total: [
      {q:'산소와 다른 원소가 결합하여 생성된 물질을 (  )이라고 한다.', a:'산화물'},
      {q:'산화철(Fe₂O₃)의 일반적인 이름은 (  )이다.', a:'녹(산화철)'},
      {q:'탄산칼슘(CaCO₃)은 (  )과 (  )의 주성분이다.', a:'석회석, 대리석'},
      {q:'수용액에서 pH가 7보다 작은 물질을 (  )이라고 한다.', a:'산성'},
      {q:'염산(HCl)과 수산화나트륨(NaOH)이 반응하면 (  )과 물이 생성된다.', a:'염화나트륨(NaCl)'},
      {q:'지시약 중 페놀프탈레인은 염기성에서 (  )색을 나타낸다.', a:'붉은(분홍)'},
      {q:'탄산수소나트륨(NaHCO₃)은 (  )이라고도 하며, 열분해 시 CO₂가 발생한다.', a:'베이킹소다(중조)'},
      {q:'산과 염기가 반응하여 물과 염이 생성되는 반응을 (  ) 반응이라고 한다.', a:'중화'},
      {q:'생활 속에서 사용되는 (  )는 대표적인 염기성 물질로 비누 제조에 쓰인다.', a:'수산화나트륨'},
      {q:'메테인(CH₄)은 가장 간단한 (  )화합물이다.', a:'탄소(유기)'},
      {q:'에탄올(C₂H₅OH)은 (  )의 주요 성분이다.', a:'술(알코올 음료)'},
      {q:'아세트산(CH₃COOH)은 (  )의 주성분이다.', a:'식초'},
      {q:'리트머스 종이는 산성에서 (  )색으로 변한다.', a:'붉은'},
      {q:'중화 반응의 알짜 이온 반응식은 H⁺ + OH⁻ → (  )이다.', a:'H₂O'},
      {q:'일상에서 pH가 약 7인 중성 물질의 예로 (  )이/가 있다.', a:'순수한 물'},
    ],
    essay: [
      {q:'산과 염기의 정의를 각각 쓰고, 중화 반응을 화학 반응식으로 나타내시오.', a:'산: 수용액에서 H⁺를 내놓는 물질. 염기: 수용액에서 OH⁻를 내놓는 물질. 중화 반응: H⁺ + OH⁻ → H₂O'},
      {q:'탄산칼슘(CaCO₃)에 묽은 염산(HCl)을 가하면 어떤 기체가 발생하는지, 반응식과 함께 쓰시오.', a:'CO₂(이산화탄소) 발생. CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂'},
      {q:'우리 생활 속에서 중화 반응이 이용되는 예를 2가지 이상 들어 설명하시오.', a:'①속쓰릴 때 제산제 복용: Mg(OH)₂ 등 염기성 물질로 위산(HCl) 중화, ②산성 토양에 석회(CaO) 뿌리기: 산성 중화'},
      {q:'pH 지시약의 원리를 설명하고, 리트머스 종이와 페놀프탈레인의 색 변화를 비교하시오.', a:'지시약은 용액의 H⁺ 농도에 따라 분자 구조가 변해 색이 달라진다. 리트머스: 산성-붉은색, 염기성-푸른색. 페놀프탈레인: 산성-무색, 염기성-붉은색.'},
      {q:'탄산수소나트륨(NaHCO₃)을 열분해할 때 일어나는 반응식과 생성물질 3가지를 쓰시오.', a:'2NaHCO₃ → Na₂CO₃ + H₂O + CO₂, 생성물질: 탄산나트륨, 물, 이산화탄소'},
    ]
  },
  '4': {
    title: 'IV. 물질 변화와 화학 반응식',
    total: [
      {q:'물질의 상태 변화 중 고체에서 액체로의 변화를 (  )라고 한다.', a:'융해'},
      {q:'화학 반응식에서 반응 물질을 왼쪽에, 생성 물질을 (  )쪽에 쓴다.', a:'오른'},
      {q:'화학 반응식에서 계수는 각 물질의 (  ) 비를 의미한다.', a:'분자 수(몰)'},
      {q:'2H₂ + O₂ → 2H₂O 반응에서 수소와 산소의 반응 분자 수 비는 (  ) : (  )이다.', a:'2, 1'},
      {q:'질량 보존 법칙에 따르면, 화학 반응 전후에 원자의 종류와 (  )가 변하지 않는다.', a:'개수'},
      {q:'일정 성분비 법칙: 같은 화합물에서 구성 원소의 (  ) 비는 항상 일정하다.', a:'질량'},
      {q:'화학 반응에서 에너지를 흡수하는 반응을 (  ) 반응이라고 한다.', a:'흡열'},
      {q:'연소 반응은 대표적인 (  ) 반응이다.', a:'발열'},
      {q:'촉매는 반응 (  ) 에너지를 낮추어 반응 속도를 높인다.', a:'활성화'},
      {q:'농도가 높을수록 반응 속도는 일반적으로 (  ).', a:'빨라진다'},
      {q:'온도가 10°C 올라가면 반응 속도는 약 (  )배 빨라진다.', a:'2'},
      {q:'탄산칼슘과 염산의 반응: CaCO₃ + 2HCl → CaCl₂ + H₂O + (  )', a:'CO₂'},
      {q:'철이 산소와 반응하여 녹스는 반응: 4Fe + 3O₂ → (  )', a:'2Fe₂O₃'},
      {q:'마그네슘이 연소하는 반응: 2Mg + O₂ → (  )', a:'2MgO'},
      {q:'과산화수소 분해 반응: 2H₂O₂ → 2H₂O + (  )', a:'O₂'},
    ],
    essay: [
      {q:'질량 보존 법칙을 설명하고, 이 법칙이 성립하는 이유를 원자 모형의 관점에서 서술하시오.', a:'화학 반응 전후에 물질의 총 질량은 변하지 않는다는 법칙. 화학 반응에서 원자는 새로 생기거나 없어지지 않고 재배열만 되기 때문이다.'},
      {q:'일정 성분비 법칙을 예를 들어 설명하고, 이 법칙이 성립하는 이유를 쓰시오.', a:'같은 화합물에서 구성 원소의 질량 비는 항상 일정하다. 예: H₂O에서 H와 O의 질량비는 항상 1:8. 원자의 종류와 개수 비가 화합물마다 고정되어 있기 때문이다.'},
      {q:'반응 속도에 영향을 미치는 요인 4가지를 쓰고 각각 간단히 설명하시오.', a:'①농도: 높을수록 충돌 횟수 증가, ②온도: 높을수록 분자 운동 활발, ③표면적: 넓을수록 접촉 면적 증가, ④촉매: 활성화 에너지 낮춤'},
      {q:'발열 반응과 흡열 반응의 차이를 에너지 출입 관점에서 설명하고 각각 예를 드시오.', a:'발열 반응: 반응물 > 생성물 에너지, 열 방출 (예: 연소, 중화). 흡열 반응: 반응물 < 생성물 에너지, 열 흡수 (예: 광합성, 탄산칼슘 열분해).'},
      {q:'촉매의 역할과 특징을 쓰고, 실생활에서 촉매가 이용되는 예를 드시오.', a:'촉매: 반응 전후 자신은 변하지 않고 활성화 에너지를 낮춰 반응 속도를 높이는 물질. 예: 자동차 배기가스 정화 장치의 백금 촉매.'},
    ]
  }
};

// 활동지 생성 함수 (대화상자에서 호출)
function generateWorksheet(unit, type, count, isTeacher) {
  const unitData = DB[unit];
  const qList = unitData[type];
  const selected = qList.slice(0, Math.min(count, qList.length));
  const typeLabel = type === 'total' ? '총괄 평가' : '서술형 평가';

  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear();

  // 헤더
  sheet.getRange(1, 1, 1, 3).merge();
  sheet.getRange(1, 1).setValue(unitData.title + ' — ' + typeLabel)
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange(2, 1).setValue('중학교 2학년 과학');
  sheet.getRange(2, 2).setValue('이름: ______________');
  sheet.getRange(2, 3).setValue('점수: ____ / ' + (selected.length * (type === 'total' ? 5 : 10)));

  // 문제
  let row = 4;
  selected.forEach((item, idx) => {
    sheet.getRange(row, 1).setValue((idx + 1) + '. ' + item.q)
      .setFontSize(11);
    sheet.getRange(row, 2).setValue('답:');
    row++;
    if (type === 'essay') {
      // 서술형: 더 많은 공간
      sheet.setRowHeight(row - 1, 60);
    }
    if (isTeacher) {
      const label = type === 'total' ? '✅ 정답: ' : '✅ 모범답안: ';
      sheet.getRange(row, 1).setValue(label + item.a)
        .setFontSize(10).setFontColor('#e67e22');
      sheet.getRange(row, 1, 1, 3).merge();
      row++;
    }
    row++; // 공백
  });

  // 열 너비
  sheet.setColumnWidth(1, 400);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 120);

  SpreadsheetApp.getUi().alert('✅ 활동지가 생성되었습니다!\n단원: ' + unitData.title + '\n평가: ' + typeLabel + '\n문항: ' + selected.length + '개');
}


// ============================================================
//  🖥️ WEB APP HTML 출력 (buildWorksheetHTML)
// ============================================================

function buildWorksheetHTML(unit, type, count, isTeacher) {
  const result = getWorksheetData(unit, type, count);
  if (!result) return '<h2>⚠️ 데이터를 찾을 수 없습니다.</h2>';
  const { unitData, selected } = result;
  const typeLabel = type === 'total' ? '총괄 평가' : '서술형 평가';
  const modeLabel = isTeacher ? '🧑‍🏫 교사용 (정답 포함)' : '👤 학생용';

  let itemsHTML = '';
  selected.forEach((item, i) => {
    itemsHTML += '<div class="q-box"><div class="q-num">' + (i + 1) + '</div>';
    itemsHTML += '<div class="q-text">' + escapeHTML(item.q) + '</div>';
    if (type === 'total') {
      if (isTeacher) {
        itemsHTML += '<div class="answer">✅ 정답: ' + escapeHTML(item.a) + '</div>';
      } else {
        itemsHTML += '<div class="answer-blank">답: ____________________</div>';
      }
    } else {
      if (isTeacher) {
        itemsHTML += '<div class="answer essay">✅ 모범답안:<br>' + escapeHTML(item.a) + '</div>';
      } else {
        itemsHTML += '<div class="essay-box">　</div>';
      }
    }
    itemsHTML += '</div>';
  });

  return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>📝 ' + escapeHTML(unitData.title) + ' - ' + typeLabel + '</title>\n<style>\n  * { margin:0; padding:0; box-sizing:border-box; }\n  body { font-family: \'Nanum Gothic\', sans-serif; max-width:800px; margin:0 auto; padding:20px; background:#f5f5f5; }\n  .paper { background:#fff; padding:40px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }\n  h1 { font-size:22px; text-align:center; margin-bottom:4px; color:#2c3e50; }\n  .sub { text-align:center; font-size:13px; color:#888; margin-bottom:16px; }\n  .info { display:flex; justify-content:space-between; font-size:13px; margin-bottom:20px; padding:8px 0; border-bottom:2px solid #3498db; }\n  .q-box { margin-bottom:14px; padding:12px; background:#fafafa; border-left:4px solid #3498db; border-radius:0 6px 6px 0; }\n  .q-num { font-size:14px; font-weight:bold; color:#3498db; margin-bottom:4px; }\n  .q-text { font-size:14px; line-height:1.7; color:#333; }\n  .answer { font-size:13px; color:#e67e22; margin-top:8px; padding:6px 10px; background:#fff8f0; border-radius:4px; }\n  .answer-blank { font-size:13px; color:#bbb; margin-top:8px; }\n  .essay-box { min-height:80px; border:2px dashed #ccc; border-radius:4px; margin-top:8px; }\n  .answer.essay { font-size:13px; color:#e67e22; margin-top:8px; padding:10px; background:#fff8f0; border-radius:4px; line-height:1.8; }\n  .btn-row { text-align:center; margin-top:24px; }\n  .btn-row button, .btn-row a { display:inline-block; padding:10px 24px; margin:4px; border:none; border-radius:6px; font-size:14px; cursor:pointer; text-decoration:none; }\n  .btn-print { background:#3498db; color:#fff; }\n  .btn-back { background:#ddd; color:#333; }\n  @media print {\n    body { background:#fff; }\n    .paper { box-shadow:none; padding:20px; }\n    .btn-row { display:none; }\n  }\n</style>\n</head>\n<body>\n<div class="paper">\n  <h1>' + escapeHTML(unitData.title) + ' — ' + typeLabel + '</h1>\n  <p class="sub">' + modeLabel + ' ｜ 문항 수: ' + selected.length + '개</p>\n  <div class="info">\n    <span>이름: __________________</span>\n    <span>날짜: ____년 ____월 ____일</span>\n  </div>\n  ' + itemsHTML + '\n</div>\n<div class="btn-row">\n  <button class="btn-print" onclick="window.print()">🖨️ 인쇄하기</button>\n  <a class="btn-back" href="' + ScriptApp.getService().getUrl() + '">↩ 다시 선택</a>\n</div>\n</body>\n</html>';
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function getWorksheetData(unit, type, count) {
  const unitData = DB[unit];
  if (!unitData) return null;
  const qList = unitData[type];
  if (!qList) return null;
  const selected = qList.slice(0, Math.min(count, qList.length));
  return { unitData, selected };
}

// ============================================================
//  🎨 HTML 폼 (공통: Web App + Sheets Dialog)
// ============================================================

const HTML_FORM = '<!DOCTYPE html>\n<html>\n<head>\n<style>\n  * { margin:0; padding:0; box-sizing:border-box; }\n  body { font-family: \'Nanum Gothic\', sans-serif; padding:20px; background:#f5f7fa; }\n  h2 { font-size:18px; text-align:center; color:#2c3e50; margin-bottom:16px; }\n  label { display:block; font-size:13px; font-weight:bold; color:#555; margin-top:12px; margin-bottom:4px; }\n  select, input[type=range] { width:100%; padding:8px; font-size:14px; border:1px solid #ccc; border-radius:6px; }\n  .range-wrap { display:flex; align-items:center; gap:8px; }\n  .range-wrap output { font-weight:bold; color:#3498db; min-width:30px; }\n  .mode-wrap { display:flex; gap:12px; margin-top:6px; }\n  .mode-wrap label { display:flex; align-items:center; gap:4px; font-weight:normal; margin:0; cursor:pointer; }\n  .btn { display:block; width:100%; padding:12px; margin-top:20px; background:#3498db; color:#fff; border:none; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer; }\n  .btn:hover { background:#2980b9; }\n  .desc { font-size:11px; color:#999; text-align:center; margin-top:8px; }\n</style>\n</head>\n<body>\n  <h2>📝 MS2 과학 활동지 생성기</h2>\n  <form id="form" method="post">\n    <label>📚 단원 선택</label>\n    <select name="unit">\n      <option value="2">II. 물질의 구성</option>\n      <option value="3">III. 우리 주변의 화합물</option>\n      <option value="4">IV. 물질 변화와 화학 반응식</option>\n    </select>\n\n    <label>📝 평가 종류</label>\n    <select name="type">\n      <option value="total">총괄 평가 (빈칸 채우기)</option>\n      <option value="essay">서술형 평가</option>\n    </select>\n\n    <label>🔢 문항 수: <output id="cntOut">5</output>개</label>\n    <div class="range-wrap">\n      <input type="range" name="count" min="1" max="15" value="5" oninput="cntOut.textContent=this.value">\n    </div>\n\n    <label>🎯 모드</label>\n    <div class="mode-wrap">\n      <label><input type="radio" name="teacher" value="false" checked> 👤 학생용</label>\n      <label><input type="radio" name="teacher" value="true"> 🧑‍🏫 교사용</label>\n    </div>\n\n    <button class="btn" type="submit">📝 활동지 생성하기</button>\n  </form>\n  <p class="desc">Ctrl+P 또는 인쇄 버튼으로 바로 출력 가능</p>\n\n  <script>\n    document.getElementById(\'form\').addEventListener(\'submit\', function(e) {\n      e.preventDefault();\n      const formData = new FormData(this);\n      const unit = formData.get(\'unit\');\n      const type = formData.get(\'type\');\n      const count = parseInt(formData.get(\'count\') || \'5\');\n      const isTeacher = formData.get(\'teacher\') === \'true\';\n      if (window.google && google.script && google.script.run) {\n        google.script.run\n          .withSuccessHandler(function() { google.script.host.close(); })\n          .withFailureHandler(function(err) { alert(\'오류: \' + err); })\n          .generateWorksheet(unit, type, count, isTeacher);\n      } else {\n        this.submit();\n      }\n    });\n  </script>\n</body>\n</html>';