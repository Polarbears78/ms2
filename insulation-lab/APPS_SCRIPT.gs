/**
 * 보온 컵 설계 탐구 — 학생 제출 수신용 Google Apps Script
 * ------------------------------------------------------------------
 * 이 코드는 index.html의 ‘📊 구글 시트로 제출’ 버튼이 보내는 데이터를
 * 구글 시트에 한 줄씩 자동으로 기록합니다.
 *
 * [배포 방법]  (자세한 내용은 같은 폴더의 '구글시트_연동_설정가이드.md' 참고)
 *  1) 새 Google Sheet 생성
 *  2) 확장 프로그램 → Apps Script → 이 코드 전체를 붙여넣고 저장
 *  3) 배포 → 새 배포 → 유형: 웹 앱
 *       - 실행 대상: 나
 *       - 액세스 권한: 모든 사용자
 *  4) 배포 후 표시되는 '웹 앱 URL'을 복사
 *  5) index.html의 SHEET_ENDPOINT = "" 안에 그 URL을 붙여넣기
 */

var SHEET_NAME = "보온컵제출";
var HEADERS = [
  "submittedAt", "jo",
  "designConduction", "designConvection", "designRadiation", "layout",
  "predictDelta", "predictReason",
  "t0", "t3", "t6", "t9", "t12", "t15",
  "startTemp", "endTemp", "deltaT",
  "bestFactor", "predVsResult", "redesign"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }
    var data = JSON.parse(e.postData.contents);
    var row = HEADERS.map(function (h) { return data[h] != null ? data[h] : ""; });
    sheet.appendRow(row);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("보온 컵 제출 수신 엔드포인트 (정상 동작 중)");
}
