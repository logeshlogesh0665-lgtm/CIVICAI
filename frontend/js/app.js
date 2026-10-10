// CivicAI frontend: talks to the Flask backend through /api/*.
const API = "";  // same origin; set to "http://127.0.0.1:5000" if hosting the frontend separately
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const state = { lang: "English", schemes: null, user: null, scheme: null, files: {}, checks: {} };
const t = () => I18N[state.lang];

// ---------- helpers ----------
function show(view) {
  ["viewForm", "viewDash", "viewDetail"].forEach((v) => ($(v).hidden = v !== view));
  $("logoutBtn").hidden = view === "viewForm";
  window.scrollTo({ top: 0 });
}
function fillSelect(id, opts) {
  const el = $(id), prev = el.selectedIndex;
  el.innerHTML = `<option value="">${esc(t().select)}</option>` + opts.map((o) => `<option>${esc(o)}</option>`).join("");
  el.selectedIndex = Math.max(prev, 0);
}
async function api(path, options) {
  const res = await fetch(API + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
function notice(el, text, kind) {
  el.className = `msg ${kind || ""}`;
  el.textContent = text;
  el.hidden = !text;
}

// ---------- static text ----------
function applyLang() {
  const L = t();
  document.documentElement.lang = L.code.slice(0, 2);
  const text = { portalName: L.portal, headTitle: L.title, headSub: L.subtitle, sec1: L.sec1, sec2: L.sec2,
    lblName: L.name, lblPhone: L.phone, lblAge: L.age, lblGender: L.gender, lblSchool: L.school,
    lblCourse: L.course, lblIncome: L.income, lblMarks: L.marks, submitBtn: L.submit,
    logoutBtn: L.edit, tabSchemes: L.tabSchemes, tabHelp: L.tabHelp, schemesHead: L.schemesHead,
    helpHead: L.helpHead, askBtn: L.ask };
  Object.entries(text).forEach(([id, v]) => ($(id).textContent = v));
  $("name").placeholder = L.namePh;
  $("phone").placeholder = L.phonePh;
  $("query").placeholder = L.queryPh;
  fillSelect("gender", L.genderOpts); fillSelect("school", L.schoolOpts); fillSelect("course", L.courseOpts);
  fillSelect("income", L.incomeOpts); fillSelect("marks", L.marksOpts);
  if (state.user) {
    $("headTitle").textContent = `${L.greeting}, ${state.user.name}`;
    $("headSub").textContent = L.dashSub;
    renderSchemes();
    if (state.scheme) renderDetail();
  }
}

// ---------- form ----------
function submitProfile() {
  const v = (id) => $(id).value.trim();
  const user = { name: v("name"), phone: v("phone"), age: v("age"), gender: v("gender"), school: v("school"),
    course: v("course"), income: v("income"), marks: v("marks"),
    idx: ["gender", "school", "course", "income", "marks"].reduce((o, k) => ((o[k] = $(k).selectedIndex - 1), o), {}) };
  if (!user.name || !user.age || !user.gender || !user.school || !user.course || !user.income) {
    return notice($("formMsg"), t().required, "warn");
  }
  notice($("formMsg"), "");
  startSession(user);
}
function startSession(user) {
  state.user = user; state.scheme = null;
  applyLang();
  switchTab("schemes");
  show("viewDash");
}
function logout() {
  state.user = null; state.scheme = null; state.files = {}; state.checks = {};
  applyLang();
  $("headTitle").textContent = t().title; $("headSub").textContent = t().subtitle;
  show("viewForm");
}

// ---------- dashboard ----------
function switchTab(tab) {
  $("paneSchemes").hidden = tab !== "schemes";
  $("paneHelp").hidden = tab !== "help";
  document.querySelectorAll(".tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
    b.setAttribute("aria-selected", b.dataset.tab === tab);
  });
}
function isMatch(key, u) {
  const i = u && u.idx;
  if (!i) return false;
  if (key === "post_matric") return i.income <= 1 && i.course <= 3;
  return i.school <= 1 && i.course >= 1 && i.course <= 3 && i.gender <= 1;
}
function renderSchemes() {
  if (!state.schemes) return;
  const lang = state.lang, a = AGENT_TEXT[lang];
  const list = Object.entries(state.schemes).map(([k, s]) => [k, s, isMatch(k, state.user)]).sort((x, y) => y[2] - x[2]);
  $("schemeList").innerHTML = `<p class="caption">${esc(a.note)}</p>` + list.map(([key, s, ok]) => `
    <article class="card scheme-card ${ok ? "is-match" : ""}">
      <button class="say" data-say aria-label="${esc(a.read)}">🔊</button>
      <span class="match ${ok ? "yes" : "no"}">${esc(ok ? a.match : a.nomatch)}</span>
      <span class="benefit-tag">${esc(s.badge[lang])}</span>
      <h3>${esc(s.title[lang])}</h3>
      <p>${esc(s.desc[lang])}</p>
      <button class="btn" data-open="${esc(key)}">${esc(t().view)}</button>
    </article>`).join("");
}
async function helpdeskCall(q) {
  const u = state.user;
  const profile = u && { age: u.age, gender: u.gender, school: u.school, course: u.course, income: u.income, marks: u.marks };
  const d = await api("/api/helpdesk", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: q, language: state.lang, profile }) });
  return d.answer;
}
async function askHelpdesk() {
  const q = $("query").value.trim();
  if (!q) return;
  const btn = $("askBtn"), out = $("helpOut");
  btn.disabled = true; btn.textContent = t().asking;
  try { const a = await helpdeskCall(q); notice(out, a, "ok"); Voice.speak(a); }
  catch (e) { notice(out, e.message, "error"); }
  btn.disabled = false; btn.textContent = t().ask;
}

// ---------- scheme detail ----------
function openScheme(key) {
  state.scheme = key; state.files = {}; state.checks = {};
  renderDetail(); show("viewDetail");
}
function renderDetail() {
  const L = t(), lang = state.lang, s = state.schemes[state.scheme], u = state.user;
  const docs = s.documents.map((d) => `
    <div class="doc-row">
      <label><input type="checkbox" data-check="${esc(d.id)}" ${state.checks[d.id] ? "checked" : ""}> ${esc(d.label[lang])}</label>
      <input type="file" accept="image/jpeg,image/png" data-doc="${esc(d.id)}" aria-label="${esc(L.upload)} ${esc(d.label[lang])}">
    </div>`).join("");
  const packet = { scheme: s.title.English, applicant: u.name, contact: u.phone, age: u.age, gender: u.gender,
    course: u.course, income: u.income, school: u.school };
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(JSON.stringify(packet));

  $("viewDetail").innerHTML = `
    <div class="gov-header">
      <div class="gov-badge">${esc(s.badge[lang])}</div>
      <h1>${esc(s.title[lang])}</h1><p>${esc(s.desc[lang])}</p>
    </div>
    <button class="btn btn-ghost" id="backBtn">${esc(L.back)}</button>
    <div class="detail-layout">
      <div>
        <div class="card"><button class="say" data-say aria-label="Read aloud">🔊</button><h3>${esc(L.benefits)}</h3><ul>${s.benefits[lang].map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
        <div class="card"><button class="say" data-say aria-label="Read aloud">🔊</button><h3>${esc(L.docs)}</h3><p class="caption">${esc(L.docsNote)}</p>${docs}
          <progress id="prog" max="${s.documents.length}" value="0"></progress><p class="caption" id="progText"></p></div>
        <div class="card"><h3>${esc(L.verify)}</h3><p class="caption">${esc(L.verifyDesc)}</p>
          <button class="btn" id="verifyBtn">${esc(L.verifyBtn)}</button><div id="verifyOut" aria-live="polite"></div></div>
      </div>
      <aside class="card qr-card"><h3>${esc(L.qr)}</h3><p class="caption">${esc(L.qrNote)}</p>
        <img src="${qr}" width="200" height="200" alt="QR code with your application details">
        <p><strong>${esc(L.applicant)}:</strong> ${esc(u.name)}<br><strong>${esc(L.contact)}:</strong> ${esc(u.phone)}</p></aside>
    </div>`;
  updateProgress();
}
function updateProgress() {
  const total = state.schemes[state.scheme].documents.length;
  const checked = Object.values(state.checks).filter(Boolean).length;
  $("prog").value = checked;
  $("progText").textContent = t().status(checked, total, Object.keys(state.files).length);
}
async function verifyDocs() {
  const out = $("verifyOut"), btn = $("verifyBtn"), L = t();
  const entries = Object.entries(state.files);
  if (entries.length < 2) return (out.innerHTML = `<p class="msg warn">${esc(L.needTwo)}</p>`);
  const s = state.schemes[state.scheme];
  const form = new FormData();
  form.append("language", state.lang);
  entries.forEach(([id, file]) => {
    form.append("files", file);
    form.append("labels", s.documents.find((d) => d.id === id).label.English);
  });
  btn.disabled = true; out.innerHTML = `<p class="msg">${esc(L.verifying)}</p>`;
  try {
    const r = await api("/api/verify-documents", { method: "POST", body: form });
    const rows = (r.detected_names || []).map((n) => `<tr><td>${esc(n.doc_key)}</td><td>${esc(n.detected_name)}</td></tr>`).join("");
    const kind = { EXACT_MATCH: ["ok", L.exact], INITIAL_EXPANSION: ["warn", L.initial], SPELLING_MISMATCH: ["error", L.mismatch] }[r.overall_match_status] || ["", L.unknown];
    out.innerHTML = `<h4>${esc(L.extracted)}</h4>
      <table><thead><tr><th>${esc(L.docCol)}</th><th>${esc(L.nameCol)}</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="msg ${kind[0]}"><strong>${esc(kind[1])}</strong> ${esc(r.summary_explanation)}</p>
      <p class="msg">${esc(r.compliance_advice)}</p>`;
  } catch (e) { out.innerHTML = `<p class="msg error">${esc(e.message)}</p>`; }
  btn.disabled = false;
}

// ---------- events ----------
document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) return openScheme(open.dataset.open);
  const tab = e.target.closest(".tab");
  if (tab) return switchTab(tab.dataset.tab);
  if (e.target.id === "backBtn") { state.scheme = null; show("viewDash"); }
  if (e.target.id === "verifyBtn") verifyDocs();
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.check) { state.checks[e.target.dataset.check] = e.target.checked; updateProgress(); }
  if (e.target.dataset.doc) {
    const f = e.target.files[0];
    f ? (state.files[e.target.dataset.doc] = f) : delete state.files[e.target.dataset.doc];
    updateProgress();
  }
});
$("langSelect").addEventListener("change", (e) => { state.lang = e.target.value; applyLang(); });
$("submitBtn").addEventListener("click", submitProfile);
$("logoutBtn").addEventListener("click", logout);
$("askBtn").addEventListener("click", askHelpdesk);
$("query").addEventListener("keydown", (e) => e.key === "Enter" && askHelpdesk());

// ---------- boot ----------
(async function init() {
  applyLang();
  try { state.schemes = await api("/api/schemes"); }
  catch (e) { notice($("formMsg"), "Could not reach the backend: " + e.message, "error"); }
})();
