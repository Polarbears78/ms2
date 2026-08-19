/* 단원 평가 웹앱 로직 */

const views = {
  units: document.getElementById("view-units"),
  assessments: document.getElementById("view-assessments"),
  quiz: document.getElementById("view-quiz"),
  result: document.getElementById("view-result"),
};
const breadcrumbEl = document.getElementById("breadcrumb");

// 현재 진행 중인 시험 상태
let state = null;

function showView(name) {
  Object.values(views).forEach((v) => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setBreadcrumb(items) {
  breadcrumbEl.innerHTML = items
    .map((it, i) => {
      const sep = i > 0 ? '<span class="sep">›</span>' : "";
      if (it.onClick) {
        return `${sep}<a href="#" data-crumb="${i}">${it.label}</a>`;
      }
      return `${sep}<span class="current">${it.label}</span>`;
    })
    .join("");
  breadcrumbEl.querySelectorAll("a[data-crumb]").forEach((a) => {
    const idx = Number(a.dataset.crumb);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      items[idx].onClick();
    });
  });
}

/* ---------- 1. 단원 선택 화면 ---------- */
function renderUnits() {
  state = null;
  setBreadcrumb([{ label: "단원 선택" }]);
  const cards = UNITS.map((u) => {
    const cls = u.available ? "unit-card available" : "unit-card locked";
    const badge = u.available
      ? '<span class="badge ok">평가 가능</span>'
      : '<span class="badge soon">준비 중</span>';
    const meta = u.pages ? `<p class="unit-pages">${u.pages}</p>` : "";
    return `
      <button class="${cls}" data-unit="${u.id}" ${u.available ? "" : "disabled"}>
        <div class="unit-roman">${u.roman}</div>
        <div class="unit-body">
          <h3>${u.title}</h3>
          ${meta}
        </div>
        ${badge}
      </button>`;
  }).join("");

  views.units.innerHTML = `
    <div class="page-head">
      <h2>단원을 선택하세요</h2>
      <p class="muted">학습할 단원을 고르면 평가 목록이 나타납니다.</p>
    </div>
    <div class="unit-grid">${cards}</div>
    <div class="tool-section">
      <h3 class="tool-heading">실험·기록</h3>
      <a class="tool-card" href="recryst-record.html">
        <div class="tool-icon">🧪</div>
        <div class="tool-body">
          <h3>재결정 실험 기록</h3>
          <p class="muted">설탕 재결정 실험 기록 시스템 (중2 · 물질의 특성)</p>
        </div>
        <span class="start-arrow">열기 →</span>
      </a>
      <a class="tool-card" href="worksheet.html">
        <div class="tool-icon">📝</div>
        <div class="tool-body">
          <h3>활동지 생성기 · 평가기록</h3>
          <p class="muted">단원별 활동지 출력 · 응답 기기 저장 · 교사용 채점표</p>
        </div>
        <span class="start-arrow">열기 →</span>
      </a>
    </div>`;

  views.units.querySelectorAll(".unit-card.available").forEach((btn) => {
    btn.addEventListener("click", () => renderAssessments(btn.dataset.unit));
  });
  showView("units");
}

/* ---------- 2. 평가 목록 화면 ---------- */
function renderAssessments(unitId) {
  const unit = UNITS.find((u) => u.id === unitId);
  setBreadcrumb([
    { label: "단원 선택", onClick: renderUnits },
    { label: `${unit.roman}. ${unit.title}` },
  ]);

  const list = (unit.assessments || [])
    .map((aid) => {
      const a = ASSESSMENTS[aid];
      const total = QUESTIONS[a.questions].length;
      const locked = a.password && !unlockedAssessments.has(aid);
      return `
        <button class="assessment-card" data-assessment="${a.id}">
          <div class="assessment-icon">${locked ? "🔒" : "📝"}</div>
          <div class="assessment-body">
            <h3>${a.title}</h3>
            <p class="muted">${a.subtitle}</p>
            <span class="q-count">총 ${total}문항</span>
            ${a.password ? `<span class="lock-tag">${locked ? "🔒 비밀번호 필요" : "🔓 잠금 해제됨"}</span>` : ""}
          </div>
          <span class="start-arrow">${locked ? "잠금 →" : "시작 →"}</span>
        </button>`;
    })
    .join("");

  views.assessments.innerHTML = `
    <div class="page-head">
      <h2>${unit.roman}. ${unit.title}</h2>
      <p class="muted">평가를 선택해 한 문제씩 풀어 보세요.</p>
    </div>
    <div class="assessment-list">${list}</div>`;

  views.assessments.querySelectorAll(".assessment-card").forEach((btn) => {
    btn.addEventListener("click", () => openAssessment(btn.dataset.assessment));
  });
  showView("assessments");
}

// 비밀번호가 걸린 평가는 잠금 해제 후 시작
const unlockedAssessments = new Set();

function openAssessment(assessmentId) {
  const a = ASSESSMENTS[assessmentId];
  if (a.password && !unlockedAssessments.has(assessmentId)) {
    showPasswordPrompt(assessmentId);
  } else {
    startQuiz(assessmentId);
  }
}

function showPasswordPrompt(assessmentId) {
  const a = ASSESSMENTS[assessmentId];
  // 기존 모달 제거
  const old = document.getElementById("pwOverlay");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "pwOverlay";
  overlay.className = "pw-overlay";
  overlay.innerHTML = `
    <div class="pw-modal" role="dialog" aria-modal="true">
      <div class="pw-icon">🔒</div>
      <h3>${escapeHtml(a.title)}</h3>
      <p class="muted">이 평가는 비밀번호가 필요합니다.</p>
      <input type="password" id="pwInput" inputmode="numeric" placeholder="비밀번호 입력" autocomplete="off" />
      <p class="pw-error hidden" id="pwError">비밀번호가 올바르지 않습니다.</p>
      <div class="pw-actions">
        <button class="btn ghost" id="pwCancel">취소</button>
        <button class="btn primary" id="pwSubmit">확인</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const input = document.getElementById("pwInput");
  const error = document.getElementById("pwError");
  const close = () => overlay.remove();
  const submit = () => {
    if (input.value === String(a.password)) {
      unlockedAssessments.add(assessmentId);
      close();
      startQuiz(assessmentId);
    } else {
      error.classList.remove("hidden");
      input.value = "";
      input.focus();
    }
  };
  document.getElementById("pwSubmit").addEventListener("click", submit);
  document.getElementById("pwCancel").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") close();
  });
  input.focus();
}

/* ---------- 3. 문제 풀이 화면 ---------- */
function startQuiz(assessmentId) {
  const assessment = ASSESSMENTS[assessmentId];
  const questions = QUESTIONS[assessment.questions];
  state = {
    assessment,
    questions,
    index: 0,
    answers: new Array(questions.length).fill(null), // {value, correct}
  };
  renderQuestion();
}

function normalize(str) {
  return (str || "")
    .toString()
    .replace(/\s/g, "")
    .replace(/[.,·]/g, "")
    .replace(/[()（）]/g, "")
    .replace(/도/g, "°")
    .toLowerCase();
}

function renderQuestion() {
  const { assessment, questions, index } = state;
  const q = questions[index];
  const unit = UNITS.find((u) => u.id === assessment.unitId);
  const saved = state.answers[index];

  setBreadcrumb([
    { label: "단원 선택", onClick: renderUnits },
    { label: `${unit.roman}. ${unit.title}`, onClick: () => renderAssessments(unit.id) },
    { label: `${index + 1}번 문제` },
  ]);

  const typeLabel = {
    mc: "객관식",
    multi: "객관식 · 복수 정답",
    short: "단답형",
    essay: "서술형",
  }[q.type];

  const progressPct = Math.round((index / questions.length) * 100);

  // 그림: q.image(이미지 파일 경로)가 있으면 이미지를, 없으면 안내 문구를 표시
  let figure = "";
  if (q.image) {
    figure = `<figure class="q-figure">
        <img src="${q.image}" alt="${escapeHtml(q.topic)} 그림" loading="lazy" />
        ${q.figureNote ? `<figcaption>${escapeHtml(q.figureNote)}</figcaption>` : ""}
      </figure>`;
  } else if (q.figureNote) {
    figure = `<div class="figure-note">🖼️ ${q.figureNote}</div>`;
  }

  let body = "";
  if (q.type === "mc" || q.type === "multi") {
    const hasImageOpts = q.options.some((o) => o.image);
    const hint =
      q.type === "multi"
        ? `<p class="select-hint">정답 ${q.answer.length}개를 고른 뒤 확인을 누르세요.</p>`
        : `<p class="select-hint">보기를 선택한 뒤 확인을 누르세요.</p>`;
    body = `<div class="options${hasImageOpts ? " image-options" : ""}">${q.options
      .map(
        (o) => `
        <button class="option" data-label="${o.label}">
          <span class="opt-label">${o.label}</span>
          <span class="opt-text">${
            o.image
              ? `<img class="opt-img" src="${o.image}" alt="보기 ${o.label}" loading="lazy" />`
              : escapeHtml(o.text)
          }</span>
        </button>`
      )
      .join("")}</div>
      ${hint}
      <button class="btn primary confirm-btn" id="confirmBtn" disabled>확인</button>`;
  } else if (q.type === "short") {
    body = `
      <div class="answer-input">
        <input type="text" id="shortAnswer" placeholder="정답을 입력하세요" autocomplete="off" />
        <button class="btn primary" id="submitShort">제출</button>
      </div>`;
  } else if (q.type === "essay") {
    body = `
      <div class="answer-input essay">
        <textarea id="essayAnswer" rows="4" placeholder="자신의 답을 자유롭게 작성해 보세요"></textarea>
        <button class="btn primary" id="submitEssay">모범 답안 확인</button>
      </div>`;
  }

  views.quiz.innerHTML = `
    <div class="quiz-progress">
      <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
      <span class="progress-text">${index + 1} / ${questions.length}</span>
    </div>
    <article class="question-card">
      <div class="q-meta">
        <span class="q-topic">${escapeHtml(q.topic)}</span>
        <span class="q-type">${typeLabel}</span>
      </div>
      <h2 class="q-stem">${index + 1}. ${escapeHtml(q.stem).replace(/\n/g, "<br>")}</h2>
      ${figure}
      ${body}
      <div class="feedback hidden" id="feedback"></div>
    </article>
    <div class="quiz-nav">
      <button class="btn ghost" id="prevBtn" ${index === 0 ? "disabled" : ""}>← 이전</button>
      <button class="btn ghost" id="nextBtn">${
        index === questions.length - 1 ? "결과 보기 →" : "다음 →"
      }</button>
    </div>`;

  // 이벤트 연결
  if (q.type === "mc" || q.type === "multi") {
    state._sel = []; // 현재 문제의 선택(아직 미채점)
    views.quiz.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => toggleSelect(btn.dataset.label));
    });
    document
      .getElementById("confirmBtn")
      .addEventListener("click", () => submitChoice());
  } else if (q.type === "short") {
    const input = document.getElementById("shortAnswer");
    const submit = document.getElementById("submitShort");
    submit.addEventListener("click", () => handleShort(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleShort(input.value);
    });
    input.focus();
  } else if (q.type === "essay") {
    document
      .getElementById("submitEssay")
      .addEventListener("click", () =>
        handleEssay(document.getElementById("essayAnswer").value)
      );
  }

  document.getElementById("prevBtn").addEventListener("click", () => {
    if (state.index > 0) {
      state.index--;
      renderQuestion();
    }
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (state.index === questions.length - 1) {
      renderResult();
    } else {
      state.index++;
      renderQuestion();
    }
  });

  // 이미 푼 문제면 결과 복원
  if (saved) restoreAnswer(q, saved);
  showView("quiz");
}

function restoreAnswer(q, saved) {
  if (q.type === "mc" || q.type === "multi") {
    const labels = Array.isArray(saved.value) ? saved.value : [saved.value];
    views.quiz.querySelectorAll(".option").forEach((btn) => {
      const lbl = btn.dataset.label;
      const correctSet = Array.isArray(q.answer) ? q.answer : [q.answer];
      if (correctSet.includes(lbl)) btn.classList.add("correct");
      else if (labels.includes(lbl)) btn.classList.add("wrong");
      btn.disabled = true;
    });
    const confirmBtn = document.getElementById("confirmBtn");
    if (confirmBtn) confirmBtn.classList.add("hidden");
    const hint = views.quiz.querySelector(".select-hint");
    if (hint) hint.classList.add("hidden");
    showFeedback(q, saved.correct);
  } else if (q.type === "short") {
    const input = document.getElementById("shortAnswer");
    input.value = saved.value;
    input.disabled = true;
    document.getElementById("submitShort").disabled = true;
    showFeedback(q, saved.correct);
  } else if (q.type === "essay") {
    document.getElementById("essayAnswer").value = saved.value || "";
    document.getElementById("essayAnswer").disabled = true;
    document.getElementById("submitEssay").disabled = true;
    showFeedback(q, null);
  }
}

// 보기 선택(채점하지 않고 선택만 토글)
function toggleSelect(label) {
  const q = state.questions[state.index];
  if (state.answers[state.index]) return; // 이미 채점됨

  const sel = state._sel || [];
  if (q.type === "multi") {
    const i = sel.indexOf(label);
    if (i >= 0) sel.splice(i, 1);
    else sel.push(label);
  } else {
    // 객관식: 한 개만 선택(다시 누르면 해제)
    if (sel.length === 1 && sel[0] === label) sel.length = 0;
    else {
      sel.length = 0;
      sel.push(label);
    }
  }
  state._sel = sel;

  views.quiz.querySelectorAll(".option").forEach((b) => {
    b.classList.toggle("selected", sel.includes(b.dataset.label));
  });
  document.getElementById("confirmBtn").disabled = sel.length === 0;
}

// 확인 버튼: 현재 선택을 채점
function submitChoice() {
  const q = state.questions[state.index];
  if (state.answers[state.index]) return;
  const sel = state._sel || [];
  if (sel.length === 0) return;

  let value, correct;
  if (q.type === "multi") {
    value = [...sel].sort();
    correct = arraysEqual(value, [...q.answer].sort());
  } else {
    value = sel[0];
    correct = value === q.answer;
  }
  finalizeChoice(q, value, correct);
  state._sel = [];
}

function finalizeChoice(q, value, correct) {
  state.answers[state.index] = { value, correct };
  const labels = Array.isArray(value) ? value : [value];
  const correctSet = Array.isArray(q.answer) ? q.answer : [q.answer];
  views.quiz.querySelectorAll(".option").forEach((btn) => {
    const lbl = btn.dataset.label;
    btn.disabled = true;
    btn.classList.remove("selected");
    if (correctSet.includes(lbl)) btn.classList.add("correct");
    else if (labels.includes(lbl)) btn.classList.add("wrong");
  });
  const confirmBtn = document.getElementById("confirmBtn");
  if (confirmBtn) confirmBtn.classList.add("hidden");
  const hint = views.quiz.querySelector(".select-hint");
  if (hint) hint.classList.add("hidden");
  showFeedback(q, correct);
}

function handleShort(raw) {
  const q = state.questions[state.index];
  if (state.answers[state.index]) return;
  const value = raw.trim();
  if (!value) return;
  const candidates = [q.answer, ...(q.acceptable || [])].map(normalize);
  const correct = candidates.includes(normalize(value));
  state.answers[state.index] = { value, correct };
  document.getElementById("shortAnswer").disabled = true;
  document.getElementById("submitShort").disabled = true;
  showFeedback(q, correct);
}

function handleEssay(raw) {
  const q = state.questions[state.index];
  const value = (raw || "").trim();
  // 서술형은 자동 채점 대신 모범 답안 제공 (자기 평가)
  state.answers[state.index] = { value, correct: null };
  document.getElementById("essayAnswer").disabled = true;
  document.getElementById("submitEssay").disabled = true;
  showFeedback(q, null);
}

function showFeedback(q, correct) {
  const el = document.getElementById("feedback");
  el.classList.remove("hidden", "correct", "wrong", "neutral");

  let html = "";
  if (correct === true) {
    el.classList.add("correct");
    html += `<div class="fb-head">✅ 정답입니다!</div>`;
  } else if (correct === false) {
    el.classList.add("wrong");
    const ans = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
    html += `<div class="fb-head">❌ 틀렸어요. 정답: <strong>${escapeHtml(
      ans
    )}</strong></div>`;
  } else {
    el.classList.add("neutral");
    html += `<div class="fb-head">📝 모범 답안을 확인하세요</div>`;
  }

  if (q.explanation) {
    html += `<div class="fb-body"><span class="fb-tag">해설</span> ${escapeHtml(
      q.explanation
    )}</div>`;
  }
  if (q.modelAnswer) {
    html += `<div class="fb-body"><span class="fb-tag">모범 답안</span> ${escapeHtml(
      q.modelAnswer
    )}</div>`;
  }
  el.innerHTML = html;
}

/* ---------- 4. 결과 화면 ---------- */
function renderResult() {
  const { assessment, questions, answers } = state;
  const unit = UNITS.find((u) => u.id === assessment.unitId);

  const gradable = questions.filter((q) => q.type !== "essay");
  const essayCount = questions.length - gradable.length;
  let correctCount = 0;
  questions.forEach((q, i) => {
    if (q.type !== "essay" && answers[i] && answers[i].correct) correctCount++;
  });
  const score =
    gradable.length > 0
      ? Math.round((correctCount / gradable.length) * 100)
      : 0;

  setBreadcrumb([
    { label: "단원 선택", onClick: renderUnits },
    { label: `${unit.roman}. ${unit.title}`, onClick: () => renderAssessments(unit.id) },
    { label: "결과" },
  ]);

  const rows = questions
    .map((q, i) => {
      const a = answers[i];
      let status, cls;
      if (q.type === "essay") {
        status = a ? "작성함" : "미작성";
        cls = "essay";
      } else if (!a) {
        status = "미응답";
        cls = "skip";
      } else if (a.correct) {
        status = "정답";
        cls = "ok";
      } else {
        status = "오답";
        cls = "no";
      }
      const ans = Array.isArray(q.answer) ? (q.answer || []).join(", ") : q.answer;
      const ansText = q.type === "essay" ? "서술형" : ans;
      return `<tr class="${cls}">
        <td>${i + 1}</td>
        <td class="topic-cell">${escapeHtml(q.topic)}</td>
        <td><span class="status-pill ${cls}">${status}</span></td>
        <td>${escapeHtml(ansText || "-")}</td>
        <td><button class="btn link" data-goto="${i}">다시 보기</button></td>
      </tr>`;
    })
    .join("");

  views.result.innerHTML = `
    <div class="result-hero">
      <div class="score-circle">
        <span class="score-num">${score}</span><span class="score-unit">점</span>
      </div>
      <div class="score-detail">
        <h2>${assessment.title}</h2>
        <p>객관식·단답형 <strong>${gradable.length}문항</strong> 중 <strong>${correctCount}문항</strong> 정답</p>
        ${essayCount > 0 ? `<p class="muted">서술형 ${essayCount}문항은 모범 답안과 스스로 비교해 보세요.</p>` : ""}
      </div>
    </div>
    <div class="result-table-wrap">
      <table class="result-table">
        <thead><tr><th>번호</th><th>주제</th><th>채점</th><th>정답</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="result-actions">
      <button class="btn primary" id="retryBtn">다시 풀기</button>
      <button class="btn ghost" id="backUnitsBtn">다른 단원 선택</button>
    </div>`;

  views.result.querySelectorAll("button[data-goto]").forEach((b) => {
    b.addEventListener("click", () => {
      state.index = Number(b.dataset.goto);
      renderQuestion();
    });
  });
  document
    .getElementById("retryBtn")
    .addEventListener("click", () => startQuiz(assessment.id));
  document
    .getElementById("backUnitsBtn")
    .addEventListener("click", renderUnits);

  showView("result");
}

/* ---------- 유틸 ---------- */
function escapeHtml(str) {
  return (str || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

document.getElementById("homeLink").addEventListener("click", renderUnits);

// 시작
renderUnits();
