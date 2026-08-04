/**
 * 과학 활동지 생성기 — Google Sheets Apps Script
 * 
 * 사용법:
 * 1. Google Sheets 열기 → 확장 프로그램 → Apps Script
 * 2. 이 코드를 붙여넣기 → 저장
 * 3. 새로고침하면 메뉴에 "📝 활동지 생성" 나타남
 * 4. 클릭 → 단원/평가 선택 → 시트에 활동지 출력
 */

// ─── 메뉴 생성 ───
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📝 활동지 생성')
    .addItem('활동지 만들기', 'showDialog')
    .addSeparator()
    .addItem('🧪 재결정 실험 기록 생성', 'showRecrystDialog')
    .addToUi();
}

// ─── 데이터 로드 (GitHub raw에서 가져옴) ───
let _dataLoaded = false;

function loadData() {
  if (_dataLoaded) return;
  try {
    const url = 'https://raw.githubusercontent.com/Polarbears78/ms2/main/data.js';
    const response = UrlFetchApp.fetch(url);
    const code = response.getContentText();
    eval(code); // UNITS, ASSESSMENTS, QUESTIONS 전역변수 생성
    _dataLoaded = true;
  } catch (e) {
    throw new Error('데이터 로드 실패: ' + e.message);
  }
}

// ─── 대화상자 ───
function showDialog() {
  loadData();
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: sans-serif; padding: 16px; }
      select, button { font-size: 14px; padding: 8px; margin: 4px 0; width: 100%; }
      button { background: #4f46e5; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
      button:hover { background: #4338ca; }
      label { font-weight: bold; font-size: 13px; display: block; margin-top: 12px; }
      .info { font-size: 12px; color: #666; margin-top: 6px; }
    </style>
    <h3>📝 활동지 만들기</h3>
    <label>단원 선택</label>
    <select id="unitSel">
      ${UNITS.filter(u=>u.available).map(u=>`<option value="${u.id}">${u.roman}. ${u.title}</option>`).join('')}
    </select>
    <label>평가 선택</label>
    <select id="assessSel">
      ${(()=>{
        const u = UNITS.filter(u=>u.available)[0];
        return (u.assessments||[]).map(aid=>{
          const a=ASSESSMENTS[aid];
          return `<option value="${a.id}">${a.title}</option>`;
        }).join('');
      })()}
    </select>
    <label>출력 모드</label>
    <select id="modeSel">
      <option value="student">👤 학생용 (정답 숨김)</option>
      <option value="teacher">👩‍🏫 교사용 (정답+해설)</option>
    </select>
    <div style="margin-top:16px;">
      <button onclick="generate()">✨ 활동지 생성</button>
    </div>
    <div class="info">※ 현재 시트에 활동지가 출력됩니다.</div>
    <script>
      document.getElementById('unitSel').addEventListener('change', function() {
        google.script.run.withSuccessHandler(function(opts) {
          document.getElementById('assessSel').innerHTML = opts;
        }).getAssessmentsForUnit(this.value);
      });

      function generate() {
        const assessId = document.getElementById('assessSel').value;
        const mode = document.getElementById('modeSel').value;
        google.script.run.withSuccessHandler(function(msg) {
          alert(msg);
          google.script.host.close();
        }).generateWorksheet(assessId, mode);
      }
    </script>
  `)
  .setWidth(420).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, '활동지 생성');
}

function showRecrystDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: sans-serif; padding: 16px; }
      button { font-size: 14px; padding: 10px; margin: 4px 0; width: 100%;
               background: #059669; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
      button:hover { background: #047857; }
    </style>
    <h3>🧪 재결정 실험 기록</h3>
    <p style="font-size:13px;color:#666;">중2 과학 '물질의 특성' — 설탕 재결정 실험<br>기록 시트를 생성합니다.</p>
    <button onclick="generate()">📋 기록 시트 생성</button>
    <script>
      function generate() {
        google.script.run.withSuccessHandler(function(msg) {
          alert(msg);
          google.script.host.close();
        }).generateRecrystSheet();
      }
    </script>
  `)
  .setWidth(360).setHeight(220);
  SpreadsheetApp.getUi().showModalDialog(html, '재결정 실험 기록');
}

// ─── 서버 사이드 ───
function getAssessmentsForUnit(unitId) {
  loadData();
  const unit = UNITS.find(u => u.id === unitId);
  return (unit.assessments || []).map(aid => {
    const a = ASSESSMENTS[aid];
    return `<option value="${a.id}">${a.title}</option>`;
  }).join('');
}

function generateWorksheet(assessId, mode) {
  loadData();
  const assessment = ASSESSMENTS[assessId];
  const unit = UNITS.find(u => u.id === assessment.unitId);
  const questions = QUESTIONS[assessment.questions] || [];

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getActiveSheet();

  // 시트 초기화
  sheet.clear();
  sheet.setName(assessment.title.substring(0, 30));

  // ─── 헤더 ───
  sheet.getRange('A1').setValue(assessment.title)
    .setFontSize(18).setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.getRange('A2').setValue(`${unit.roman}. ${unit.title}  |  이름: ____________`)
    .setFontSize(11).setHorizontalAlignment('center');

  // ─── 열 너비 ───
  sheet.setColumnWidth(1, 800);

  let row = 4;

  const typeLabels = { mc: '객관식', multi: '복수정답', short: '단답형', essay: '서술형' };

  questions.forEach((q) => {
    // 번호 + 유형 + 주제
    sheet.getRange(row, 1)
      .setValue(`${q.id}. [${typeLabels[q.type] || q.type}] ${q.stem}`)
      .setFontSize(12).setWrap(true);

    row++;

    // 그림 안내
    if (q.figureNote) {
      sheet.getRange(row, 1).setValue(`   📎 ${q.figureNote}`)
        .setFontSize(10).setFontColor('#888');
      row++;
    }

    // 객관식/복수정답 보기
    if ((q.type === 'mc' || q.type === 'multi') && q.options) {
      q.options.forEach(opt => {
        sheet.getRange(row, 1).setValue(`      ○ ${opt.label} ${opt.text}`)
          .setFontSize(11);
        row++;
      });
    }

    // 단답형 답란
    if (q.type === 'short') {
      sheet.getRange(row, 1).setValue('   답: __________________')
        .setFontSize(11);
      row++;
    }

    // 서술형 답란
    if (q.type === 'essay') {
      for (let i = 0; i < 4; i++) {
        sheet.getRange(row, 1).setValue('   ________________________________________________')
          .setFontSize(10);
        row++;
      }
    }

    // 교사용: 정답+해설
    if (mode === 'teacher') {
      if (q.answer) {
        sheet.getRange(row, 1).setValue(`   ✅ 정답: ${q.answer}`)
          .setFontSize(10).setFontColor('#16a34a').setFontWeight('bold');
        row++;
      }
      if (q.modelAnswer) {
        sheet.getRange(row, 1).setValue(`   ✅ 모범답안: ${q.modelAnswer}`)
          .setFontSize(10).setFontColor('#16a34a');
        row++;
      }
      if (q.explanation) {
        sheet.getRange(row, 1).setValue(`   💡 ${q.explanation}`)
          .setFontSize(10).setFontColor('#4f46e5');
        row++;
      }
    }

    // 문항 사이 간격
    row++;
    sheet.getRange(row, 1).setValue('─'.repeat(60))
      .setFontSize(8).setFontColor('#ccc');
    row++;
  });

  // 열 너비 재조정
  sheet.autoResizeColumn(1);

  return `✅ "${assessment.title}" 활동지 생성 완료! (${questions.length}문항, ${mode === 'teacher' ? '교사용' : '학생용'})`;
}

function generateRecrystSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet('재결정 실험 기록');

  // 헤더
  sheet.getRange('A1:F1').merge().setValue('🧪 설탕 재결정 실험 기록')
    .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange('A2:C2').merge().setValue('중2 과학 · 물질의 특성')
    .setFontSize(11).setFontColor('#666');

  // 기본 정보
  const infoHeaders = [
    ['실험 날짜', '', '실험자', '', '온도(℃)', ''],
    ['설탕(g)', '', '물(mL)', '', '도구', '']
  ];
  let row = 4;
  infoHeaders.forEach(data => {
    sheet.getRange(row, 1, 1, data.length).setValues([data])
      .setFontWeight('bold').setFontSize(11);
    row++;
  });

  // 관찰 기록 표
  row++;
  sheet.getRange(row, 1, 1, 4).merge().setValue('📋 관찰 기록')
    .setFontWeight('bold').setFontSize(14);
  row++;

  const headers = ['시간', '관찰 내용', '온도(℃)', '비고'];
  sheet.getRange(row, 1, 1, 4).setValues([headers])
    .setFontWeight('bold').setBackground('#eef2ff');
  row++;

  // 15줄 관찰 기록
  for (let i = 1; i <= 15; i++) {
    sheet.getRange(row, 1, 1, 4).setValues([['', '', '', '']]);
    sheet.getRange(row, 1).setValue(`${i * 5}분 후`);
    row++;
  }

  // 결과 및 결론
  row++;
  sheet.getRange(row, 1, 1, 4).merge().setValue('📝 결과 및 결론')
    .setFontWeight('bold').setFontSize(14);
  row++;
  const resultLabels = [
    '결정 생성 여부',
    '결정의 크기와 모양',
    '실험 성공/실패 원인 분석',
    '알게 된 점'
  ];
  resultLabels.forEach(label => {
    sheet.getRange(row, 1).setValue(label).setFontWeight('bold');
    sheet.getRange(row, 2, 1, 3).merge().setValue('');
    row++;
  });

  sheet.setColumnWidths(1, 6, 150);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 150);

  return '✅ 재결정 실험 기록 시트 생성 완료!';
}
