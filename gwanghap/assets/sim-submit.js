/* ═══════════════════════════════════════════════════════════
 * 가상 실험 제출 기능 (sim-submit.js)
 * ───────────────────────────────────────────────────────────
 * ms2/gwanghap/sim.html 에 얹는 확장 모듈입니다.
 * sim.html 본문 코드는 고치지 않고, 아래 세 줄만 추가합니다.
 *
 *   <script src="assets/config.js"><\/script>
 *   <script src="assets/sim-config.js"><\/script>
 *   <script src="assets/sim-submit.js"><\/script>
 *
 * 제출 대상 서버
 *   assets/sim-config.js 의 SIM_URL(교사용 대시보드)로 보냅니다.
 *   없으면 기존 SCRIPT_URL(학생용)로 보냅니다.
 *
 * 평가 관점
 *   결과값의 정확성보다 "다른 조건을 고정했는가"가 핵심입니다.
 *   통제변인 변경 여부를 자동 판정해 함께 저장합니다.
 *   단, 이는 사실 기록일 뿐이며 점수화 여부는 교사가 판단합니다.
 * ═══════════════════════════════════════════════════════════ */
'use strict';

(function () {

  /* ── 제출 대상 URL 결정 ───────────────────────────── */
  var POST_URL =
    (typeof SIM_URL !== 'undefined' && SIM_URL) ? SIM_URL :
    (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) ? SCRIPT_URL : '';

  if (!POST_URL) {
    console.error('[sim-submit] SIM_URL 또는 SCRIPT_URL이 필요합니다.');
    return;
  }
  if (typeof VARS === 'undefined' || typeof results === 'undefined') {
    console.error('[sim-submit] sim.html 본문 스크립트 뒤에 놓여야 합니다.');
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  /* ── 화면 삽입 ────────────────────────────────────── */
  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'submitCard';
  card.innerHTML =
    '<h2>④ 실험 결과 제출</h2>' +

    '<p class="note" style="margin:0 0 10px">' +
      '측정을 <b>3회 이상</b> 마친 뒤 제출하세요. 여러 번 제출할 수 있으며, ' +
      '조작변인을 바꿔 다시 실험한 결과도 각각 제출하면 됩니다.</p>' +

    '<div id="designBox" class="msg show" style="background:#eef4fa;border:1px solid #c3d5e6;color:#234"></div>' +

    '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">' +
      '<label style="font-size:.86rem">학번 (5자리)<br>' +
        '<input id="sm-sid" type="text" inputmode="numeric" placeholder="예: 20103" ' +
        'style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px"></label>' +
      '<label style="font-size:.86rem">이름<br>' +
        '<input id="sm-name" type="text" autocomplete="off" ' +
        'style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px"></label>' +
    '</div>' +

    '<label style="font-size:.86rem;display:block;margin-top:10px">' +
      '1. 가설 — 조작변인을 바꾸면 광합성량이 어떻게 될 것이라고 예상했나요?<br>' +
      '<textarea id="sm-hypo" rows="2" placeholder="예: 빛의 세기가 셀수록 광합성량이 계속 늘어날 것이다." ' +
      'style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font-family:inherit"></textarea></label>' +

    '<label style="font-size:.86rem;display:block;margin-top:8px">' +
      '2. 다른 두 조건을 고정한 까닭은 무엇인가요?<br>' +
      '<textarea id="sm-why" rows="2" placeholder="무엇을 알아보기 위해 나머지를 고정했는지 써 보세요." ' +
      'style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font-family:inherit"></textarea></label>' +

    '<label style="font-size:.86rem;display:block;margin-top:8px">' +
      '3. 결론 — 측정 결과에서 알아낸 것을 쓰세요. 예상과 달랐다면 그 점도 함께 쓰세요.<br>' +
      '<textarea id="sm-concl" rows="3" ' +
      'style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font-family:inherit"></textarea></label>' +

    '<button class="run" id="sm-send" style="margin-top:12px">제출하기</button>' +
    '<div class="msg" id="sm-msg"></div>';

  document.querySelector('.wrap').appendChild(card);

  /* ── 실험 설계 요약 (실시간) ──────────────────────── */

  function controlKeys() {
    return Object.keys(VARS).filter(function (k) { return k !== iv; });
  }

  /** 첫 측정 때 고정한 통제변인 값이 이후 바뀌었는지 판정 */
  function controlCheck() {
    if (typeof ctrlLockKeys === 'undefined' || !ctrlLockKeys) {
      return { locked: false, changed: [], ok: null };
    }
    var changed = [];
    controlKeys().forEach(function (k) {
      if (Number(ctrl[k]) !== Number(ctrlLockKeys[k])) {
        changed.push({
          key: k, name: VARS[k].name, unit: VARS[k].unit,
          from: ctrlLockKeys[k], to: ctrl[k]
        });
      }
    });
    return { locked: true, changed: changed, ok: changed.length === 0 };
  }
  function designSummary() {
    var cc = controlCheck();
    var ctrlText = controlKeys().map(function (k) {
      return VARS[k].name + ' ' + ctrl[k] + VARS[k].unit;
    }).join(' · ');

    var html =
      '<b>조작변인</b> ' + VARS[iv].name +
      ' &nbsp;/&nbsp; <b>통제변인</b> ' + ctrlText +
      ' &nbsp;/&nbsp; <b>측정</b> ' + results.length + '회';

    if (cc.locked && cc.changed.length) {
      html += '<br><span style="color:var(--no)">⚠ 측정 도중 통제변인이 바뀌었습니다 — ' +
        cc.changed.map(function (c) {
          return c.name + ' ' + c.from + '→' + c.to + c.unit;
        }).join(', ') +
        '. 이대로 제출하면 그 사실도 함께 기록됩니다.</span>';
    }
    return html;
  }

  function refreshDesign() {
    var box = $('designBox');
    if (box) box.innerHTML = designSummary();
  }
  refreshDesign();
  setInterval(refreshDesign, 800);   // 슬라이더 조작을 따라가도록 주기 갱신

  /* ── 제출 ─────────────────────────────────────────── */

  function say(kind, html) {
    var m = $('sm-msg');
    if (!html) { m.className = 'msg'; m.innerHTML = ''; return; }
    m.className = 'msg show ' + kind;
    m.innerHTML = html;
  }

  $('sm-send').addEventListener('click', function () {
    var sid  = $('sm-sid').value.trim();
    var name = $('sm-name').value.trim();

    if (!/^\d{4,5}$/.test(sid)) return say('warn', '학번을 정확히 입력하세요. (예: 1반 3번 → 20103)');
    if (name.length < 2)        return say('warn', '이름을 입력하세요.');
    if (results.length < 3)     return say('warn', '측정을 3회 이상 한 뒤 제출하세요. 현재 ' + results.length + '회입니다.');

    var concl = $('sm-concl').value.trim();
    if (concl.length < 10) return say('warn', '결론을 한 문장 이상 써 주세요.');

    var cc = controlCheck();
    if (cc.changed.length &&
        !confirm('측정 도중 통제변인이 바뀐 기록이 있습니다.\n\n' +
                 cc.changed.map(function (c) { return '· ' + c.name + ' ' + c.from + ' → ' + c.to + c.unit; }).join('\n') +
                 '\n\n이 사실도 함께 제출됩니다. 계속할까요?')) return;

    var payload = {
      action: 'simRecord',
      sid: sid,
      name: name,
      iv: iv,
      ivName: VARS[iv].name,
      ivUnit: VARS[iv].unit,
      controls: controlKeys().map(function (k) {
        return { key: k, name: VARS[k].name, value: ctrl[k], unit: VARS[k].unit };
      }),
      controlLocked: cc.locked,
      controlKept: cc.ok,
      controlChanged: cc.changed,
      results: results.map(function (r) { return { x: r.x, y: r.y }; }),
      hypothesis: $('sm-hypo').value.trim(),
      whyControl: $('sm-why').value.trim(),
      conclusion: concl
    };
    var btn = $('sm-send');
    btn.disabled = true; btn.textContent = '제출 중…';
    say('', '');

    fetch(POST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.message || '제출에 실패했습니다.');
        say('ok',
          '<b>제출 완료!</b> ' + VARS[iv].name + '을(를) 조작변인으로 한 실험 ' +
          results.length + '회 측정 결과가 기록되었습니다.<br>' +
          '<span class="note">조작변인을 바꿔 다시 실험한 뒤 또 제출할 수 있습니다. ' +
          '결과를 지우고 새 실험을 시작하려면 [결과 지우기]를 누르세요.</span>');
      })
      .catch(function (e) {
        say('warn', '제출하지 못했습니다: ' + e.message +
          '<br><span class="note">인터넷 연결을 확인하고 다시 시도하세요. ' +
          '계속 실패하면 측정값을 공책에 적어 두고 선생님께 알리세요.</span>');
      })
      .then(function () {
        btn.disabled = false; btn.textContent = '제출하기';
      });
  });

})();

