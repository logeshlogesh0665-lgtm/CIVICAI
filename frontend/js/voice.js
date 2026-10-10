// Voice layer: read-aloud, voice typing on every field, and the "Civic Guide" talking agent.
const AGENT_TEXT = {
  English: {
    title: "Civic Guide", read: "Read aloud", fill: "Fill my profile by voice", talk: "Talk to me", stopTalk: "Stop",
    hello: "Hi, I'm Civic Guide. I can fill in your profile by voice, or answer questions about schemes. What would you like?",
    got: (v) => `Got it: ${v}.`, retry: "Sorry, I didn't catch that. Please say it again.",
    confirm: "All done. Shall I show your schemes? Say yes or no.", ok: "Okay, you can edit anything on the form.",
    missing: "Some details are still missing. Please fill them in and continue.", shown: "Here are the schemes for you.",
    talkIntro: "Go ahead, I'm listening. Say stop when you're done.", nomic: "Voice input needs Chrome or Edge.",
    ph: "Type a question…", match: "Likely match", nomatch: "May not qualify", listening: "Listening…",
    note: "Matches are a quick estimate. Confirm eligibility on the official portal or at an e-Sevai centre.",
    yes: /\b(yes|yeah|yep|ok|okay|sure|show|go ahead)\b/i, stop: /\b(stop|exit|quit|bye|done)\b/i
  },
  Tamil: {
    title: "சிவிக் வழிகாட்டி", read: "குரலில் வாசி", fill: "குரலில் விவரம் நிரப்பு", talk: "என்னுடன் பேசு", stopTalk: "நிறுத்து",
    hello: "வணக்கம், நான் சிவிக் வழிகாட்டி. குரலில் உங்கள் விவரங்களை நிரப்பவும், திட்டங்கள் பற்றிக் கேட்கவும் உதவுவேன்.",
    got: (v) => `சரி: ${v}.`, retry: "மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்லுங்கள்.",
    confirm: "எல்லாம் முடிந்தது. திட்டங்களைக் காட்டலாமா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.", ok: "சரி, படிவத்தில் மாற்றிக்கொள்ளலாம்.",
    missing: "சில விவரங்கள் விடுபட்டுள்ளன. நிரப்பிவிட்டுத் தொடரவும்.", shown: "இதோ உங்களுக்கான திட்டங்கள்.",
    talkIntro: "கேளுங்கள், நான் கேட்கிறேன். முடிந்ததும் நிறுத்து என்று சொல்லுங்கள்.", nomic: "குரல் உள்ளீட்டிற்கு Chrome அல்லது Edge தேவை.",
    ph: "கேள்வியை டைப் செய்யவும்…", match: "பொருந்த வாய்ப்பு உள்ளது", nomatch: "பொருந்தாமல் போகலாம்", listening: "கேட்கிறது…",
    note: "இது தோராய மதிப்பீடு மட்டுமே. அதிகாரப்பூர்வ தளத்தில் அல்லது இ-சேவை மையத்தில் உறுதிசெய்யவும்.",
    yes: /(ஆம்|ஆமாம்|சரி|காட்டு|yes|ok)/i, stop: /(நிறுத்து|போதும்|stop)/i
  },
  Hindi: {
    title: "सिविक गाइड", read: "ज़ोर से पढ़ें", fill: "आवाज़ से प्रोफ़ाइल भरें", talk: "मुझसे बात करें", stopTalk: "रोकें",
    hello: "नमस्ते, मैं सिविक गाइड हूं। मैं आवाज़ से आपकी प्रोफ़ाइल भर सकता हूं और योजनाओं के बारे में बता सकता हूं।",
    got: (v) => `ठीक है: ${v}।`, retry: "माफ़ कीजिए, समझ नहीं आया। कृपया दोहराएं।",
    confirm: "सब हो गया। क्या योजनाएं दिखाऊं? हां या नहीं कहें।", ok: "ठीक है, आप फ़ॉर्म में बदलाव कर सकते हैं।",
    missing: "कुछ जानकारी छूट गई है। भरकर आगे बढ़ें।", shown: "ये रहीं आपके लिए योजनाएं।",
    talkIntro: "पूछिए, मैं सुन रहा हूं। पूरा होने पर रुको कहें।", nomic: "आवाज़ इनपुट के लिए Chrome या Edge चाहिए।",
    ph: "प्रश्न टाइप करें…", match: "पात्र होने की संभावना", nomatch: "शायद पात्र नहीं", listening: "सुन रहा है…",
    note: "यह केवल अनुमान है। आधिकारिक पोर्टल या e-Sevai केंद्र पर पात्रता की पुष्टि करें।",
    yes: /(हाँ|हां|जी|ठीक|दिखाओ|yes|ok)/i, stop: /(रुको|बंद|बस|stop)/i
  }
};
const A = () => AGENT_TEXT[state.lang];

const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  let rec = null;
  const api = {
    supported: !!SR, enabled: false,
    speak(text, force) {
      if (!synth || !text || (!api.enabled && !force)) return Promise.resolve();
      synth.cancel();
      return new Promise((res) => {
        const u = new SpeechSynthesisUtterance(String(text).replace(/[*#_`🔊]/g, ""));
        u.lang = t().code; u.rate = u.lang.startsWith("ta") ? 0.9 : 1;
        const v = synth.getVoices().find((x) => x.lang.replace("_", "-").startsWith(u.lang.slice(0, 2)));
        if (v) u.voice = v;
        const end = () => { document.body.classList.remove("speaking"); res(); };
        u.onend = end; u.onerror = end;
        document.body.classList.add("speaking");
        synth.speak(u);
      });
    },
    listen() {
      return new Promise((res, rej) => {
        if (!SR) return rej(new Error(A().nomic));
        if (synth) synth.cancel();
        if (rec) rec.abort();
        rec = new SR(); rec.lang = t().code; rec.interimResults = false;
        let done = false;
        rec.onresult = (e) => { done = true; res(e.results[0][0].transcript.trim()); };
        rec.onerror = (e) => { if (!done) { done = true; e.error === "no-speech" ? res("") : rej(new Error(e.error)); } };
        rec.onend = () => { if (!done) res(""); };
        rec.start();
      });
    },
    stop() { if (rec) rec.abort(); if (synth) synth.cancel(); }
  };
  return api;
})();

// ---------- toast ----------
let toastTimer;
function toast(msg) {
  const el = $("toast"); el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

// ---------- fill a field from speech ----------
function setField(id, spoken) {
  const el = $(id);
  if (el.tagName === "SELECT") {
    const opts = [...el.options].slice(1), s = spoken.toLowerCase();
    const n = (s.match(/^(?:option|number|no\.?)?\s*(\d)\.?$/) || [])[1];
    let best = -1, top = 0;
    if (n && +n >= 1 && +n <= opts.length) best = +n - 1;
    else opts.forEach((o, i) => {
      const txt = o.text.toLowerCase();
      let sc = s.includes(txt) ? 10 : 0;
      txt.split(/[\s/()\-,.]+/).filter((w) => w.length > 2).forEach((w) => s.includes(w) && sc++);
      if (sc > top) { top = sc; best = i; }
    });
    if (best < 0) return false;
    el.selectedIndex = best + 1; el.dispatchEvent(new Event("change"));
    return opts[best].text;
  }
  let v = spoken;
  if (id === "phone" || id === "age") v = spoken.replace(/\D/g, "");
  if (id === "phone") v = v.slice(0, 10);
  if (!v) return false;
  el.value = v;
  return v;
}

// ---------- mic button on every input ----------
function mkMic(id) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "mic"; b.textContent = "🎙️"; b.setAttribute("aria-label", "Voice input");
  b.addEventListener("click", async () => {
    b.classList.add("rec"); toast(A().listening);
    try {
      const s = await Voice.listen();
      if (!s) toast(A().retry);
      else if (!setField(id, s)) toast(A().retry);
      else if (id === "query") askHelpdesk();
    } catch (e) { toast(e.message); }
    b.classList.remove("rec");
  });
  return b;
}
function addMics() {
  document.querySelectorAll("#viewForm .field").forEach((f) => {
    const input = f.querySelector("input,select");
    const w = document.createElement("div"); w.className = "inwrap";
    input.replaceWith(w); w.append(input, mkMic(input.id));
  });
  $("query").after(mkMic("query"));
}

// ---------- read aloud ----------
function readView(v) {
  if (!Voice.enabled) return;
  const text = v === "viewDetail"
    ? $("viewDetail").querySelector("h1").textContent + ". " + $("viewDetail").querySelector(".gov-header p").textContent
    : $("headTitle").textContent + ". " + $("headSub").textContent;
  Voice.speak(text);
}
const _show = show;
show = function (v) { _show(v); readView(v); };

document.addEventListener("focusin", (e) => {
  const f = e.target.closest && e.target.closest("#viewForm .field");
  if (Voice.enabled && f) Voice.speak(f.querySelector("span").textContent);
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-say]");
  if (b) Voice.speak(b.closest(".card").innerText, true);
});

// ---------- Civic Guide agent ----------
const agent = { run: false };
const FIELDS = ["name", "phone", "age", "gender", "school", "course", "income", "marks"];
function log(who, text) {
  const d = document.createElement("div"); d.className = "bubble " + who; d.textContent = text;
  $("agentLog").append(d); d.scrollIntoView({ block: "end" });
}
async function say(text) { log("bot", text); await Voice.speak(text); }
function setRunning(on) {
  agent.run = on;
  $("agentTalk").textContent = on ? A().stopTalk : A().talk;
  $("agentFill").disabled = on;
}
async function listenOnce() {
  try { return await Voice.listen(); }
  catch (e) { log("bot", e.message); agent.run = false; return null; }
}
async function intake() {
  if (state.user) logout();
  setRunning(true);
  for (const id of FIELDS) {
    if (!agent.run) break;
    const el = $(id), label = el.closest(".field").querySelector("span").textContent;
    const opts = el.tagName === "SELECT" ? ". " + [...el.options].slice(1).map((o) => o.text).join(", ") : "";
    el.scrollIntoView({ block: "center" });
    for (let tries = 0; tries < 2 && agent.run; tries++) {
      await say(tries ? A().retry : label + "?" + opts);
      const s = await listenOnce();
      if (s === null) break;
      if (!s) continue;
      log("me", s);
      const r = setField(id, s);
      if (r) { await say(A().got(r)); break; }
    }
  }
  if (agent.run) {
    await say(A().confirm);
    const s = await listenOnce();
    if (s) log("me", s);
    if (s && A().yes.test(s)) {
      submitProfile();
      await say(state.user ? A().shown : A().missing);
    } else if (s !== null) await say(A().ok);
  }
  setRunning(false);
}
async function ask(q) {
  try { await say(await helpdeskCall(q)); } catch (e) { log("bot", e.message); }
}
async function talk() {
  setRunning(true);
  await say(A().talkIntro);
  let misses = 0;
  while (agent.run) {
    const s = await listenOnce();
    if (s === null) break;
    if (!s) { if (++misses >= 3) break; continue; }
    misses = 0; log("me", s);
    if (A().stop.test(s)) break;
    await ask(s);
  }
  setRunning(false);
}
function openAgent(open) {
  $("agent").hidden = !open; $("agentFab").setAttribute("aria-expanded", open);
  if (open) {
    if (!Voice.enabled) { $("readToggle").checked = true; Voice.enabled = true; }
    if (!$("agentLog").children.length) say(A().hello);
  } else { agent.run = false; Voice.stop(); setRunning(false); }
}
function labels() {
  const a = A();
  $("readLbl").textContent = "🔊 " + a.read;
  $("agentFab").textContent = "🎙️ " + a.title; $("agentTitle").textContent = a.title;
  $("agentFill").textContent = a.fill; $("agentTalk").textContent = agent.run ? a.stopTalk : a.talk;
  $("agentInput").placeholder = a.ph;
}

$("readToggle").addEventListener("change", (e) => {
  Voice.enabled = e.target.checked;
  Voice.enabled ? Voice.speak(A().read, true) : Voice.stop();
});
$("agentFab").addEventListener("click", () => openAgent($("agent").hidden));
$("agentClose").addEventListener("click", () => openAgent(false));
$("agentFill").addEventListener("click", intake);
$("agentTalk").addEventListener("click", () => (agent.run ? (agent.run = false, Voice.stop()) : talk()));
$("agentSend").addEventListener("click", sendTyped);
$("agentInput").addEventListener("keydown", (e) => e.key === "Enter" && sendTyped());
function sendTyped() {
  const q = $("agentInput").value.trim();
  if (!q) return;
  $("agentInput").value = ""; log("me", q); ask(q);
}
$("langSelect").addEventListener("change", labels);

addMics();
labels();
