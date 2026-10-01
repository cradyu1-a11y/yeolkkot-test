/**
 * 열꽃 8인 닮은꼴 테스트 — 결과 집계 (Google Apps Script)
 *
 * 하는 일
 *  - POST: 테스트를 끝낸 사람의 결과 한 줄을 「응답」 시트에 적는다. 이름·연락처·IP는 받지 않는다.
 *  - GET ?action=stats: 지금까지 인원과 캐릭터별 인원을 돌려준다(5분 캐시). 페이지가 「지금까지 N명」에 쓴다.
 *
 * 설치
 *  1. 구글 시트를 새로 만들고 [확장 프로그램 → Apps Script]를 연다.
 *  2. 이 파일 내용을 Code.gs에 붙여 넣고 저장한다.
 *  3. [배포 → 새 배포 → 유형: 웹 앱], 실행: 나, 액세스: 모든 사용자 → 배포. 권한 승인 창에서 승인.
 *  4. 나온 웹 앱 URL(…/exec)을 data.js의 API_URL에 넣는다.
 */
const SHEET = '응답';
const AXES = ['H','E','X','A','C','O'];
const IDS = ['C01','C02','C03','C04','C05','C06','C07','C08'];
const HEAD = ['시각','버전','세션','유입','친구결과','1위','1위%','2위']
  .concat(AXES.map(a => '축_' + a))
  .concat(IDS.map(i => '겹침_' + i))
  .concat(Array.from({length:24}, (_, i) => 'Q' + (i + 1)))
  .concat(['걸린초','모바일']);

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (!IDS.includes(d.top) || !Array.isArray(d.answers) || d.answers.length !== 24) return out_({ok:false});
    const lock = LockService.getScriptLock(); lock.waitLock(5000);
    const sh = sheet_();
    // 같은 세션이 10분 안에 같은 답을 다시 보내면 버린다(새로고침 중복 방지).
    const key = 'dup_' + d.sid + '_' + d.answers.join('');
    const cache = CacheService.getScriptCache();
    if (cache.get(key)) { lock.releaseLock(); return out_({ok:true, dup:true}); }
    cache.put(key, '1', 600);
    const row = [new Date(), s_(d.v), s_(d.sid), s_(d.from), s_(d.friend), d.top, n_(d.top_pct), s_(d.second)]
      .concat(AXES.map(a => n_(d.scores && d.scores[a])))
      .concat(IDS.map(i => n_(d.match && d.match[i])))
      .concat(d.answers.map(n_))
      .concat([n_(d.secs), d.mobile ? 1 : 0]);
    sh.appendRow(row);
    cache.remove('stats');
    lock.releaseLock();
    return out_({ok:true});
  } catch (err) {
    return out_({ok:false});
  }
}

function doGet(e) {
  if ((e.parameter.action || '') !== 'stats') return out_({ok:true});
  const cache = CacheService.getScriptCache();
  const hit = cache.get('stats');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const sh = sheet_();
  const n = Math.max(sh.getLastRow() - 1, 0);
  const byTop = {}; IDS.forEach(i => byTop[i] = 0);
  if (n > 0) sh.getRange(2, 6, n, 1).getValues().forEach(r => { if (byTop[r[0]] != null) byTop[r[0]]++; });
  const body = JSON.stringify({n: n, byTop: byTop});
  cache.put('stats', body, 300);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function s_(v) { return v == null ? '' : String(v).slice(0, 64); }
function n_(v) { const x = Number(v); return isFinite(x) ? Math.round(x * 1000) / 1000 : ''; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** 한 번만 실행: 「요약」 시트를 만들어 캐릭터별·유입별 인원과 축 평균을 수식으로 보여 준다. */
function setupSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet_();
  const sh = ss.getSheetByName('요약') || ss.insertSheet('요약');
  sh.clear();
  sh.getRange('A1').setValue('전체 인원'); sh.getRange('B1').setFormula("=COUNTA('응답'!F2:F)");
  sh.getRange('A3:C3').setValues([['1위 캐릭터','인원','비율']]);
  IDS.forEach((id, i) => {
    const r = 4 + i;
    sh.getRange(r, 1).setValue(id);
    sh.getRange(r, 2).setFormula(`=COUNTIF('응답'!F2:F,"${id}")`);
    sh.getRange(r, 3).setFormula(`=IFERROR(B${r}/$B$1,0)`).setNumberFormat('0.0%');
  });
  sh.getRange('E3:F3').setValues([['축','평균(-1~1)']]);
  AXES.forEach((a, i) => {
    const col = String.fromCharCode('I'.charCodeAt(0) + i); // 응답 시트 축_H는 I열부터
    sh.getRange(4 + i, 5).setValue(a);
    sh.getRange(4 + i, 6).setFormula(`=IFERROR(AVERAGE('응답'!${col}2:${col}),"")`);
  });
  sh.getRange('H3').setValue('유입별 인원');
  sh.getRange('H4').setFormula("=IFERROR(QUERY('응답'!D2:D,\"select D, count(D) where D is not null group by D order by count(D) desc label count(D) ''\",0),\"\")");
  sh.setFrozenRows(3);
}
