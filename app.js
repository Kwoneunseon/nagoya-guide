const D = window.GUIDE;
const $ = (s, r = document) => r.querySelector(s);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// [[용어]] 또는 [[보이는 말|사전 키]] → 용어 버튼. 사전에 없으면 그냥 글자로 둔다.
function fmt(text) {
  return esc(text).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, shown, key) => {
    key = (key || shown).trim();
    if (!D.glossary[key]) { console.warn("용어 사전에 없음:", key); return shown; }
    return `<button class="term" data-term="${key}">${shown}</button>`;
  });
}
const paras = list => (list || []).map(p => `<p>${fmt(p)}</p>`).join("");

const chev = `<svg class="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

function accItem(kind, label, title, body) {
  return `<div class="acc-item ${kind}">
    <button class="acc-btn" aria-expanded="false"><span class="k">${label}</span><span class="t">${fmt(title)}</span>${chev}</button>
    <div class="acc-body"><div>${body}</div></div>
  </div>`;
}

function photo(p, time) {
  const chip = time ? `<span class="time">${esc(time)}</span>` : "";
  if (!p || !p.src) return "";
  const cap = p.credit ? `<figcaption><a href="${esc(p.link || p.src)}" target="_blank" rel="noopener">${esc(p.credit)}</a></figcaption>` : "";
  return `<figure><img src="${esc(p.src)}" alt="${esc(p.alt || "")}" loading="lazy">${chip}${cap}</figure>`;
}

function spotCard(s, extra = "") {
  const hasPhoto = s.photo && s.photo.src;
  const quiz = (s.quiz || []).map(x => accItem("quiz", "QUIZ", x.q, `<p><span class="reveal">정답</span>${fmt(x.a)}</p>`));
  const missions = (s.missions || []).map(x => accItem("mission", "MISSION", x.title, `<p>${fmt(x.detail)}</p>`));
  const acc = quiz.length + missions.length ? `<div class="acc">${quiz.join("")}${missions.join("")}</div>` : "";
  return `<article class="spot" id="${esc(s.id)}">
    ${hasPhoto ? photo(s.photo, s.time) : ""}
    <div class="body">
      ${!hasPhoto && s.time ? `<span class="time">${esc(s.time)}</span>` : ""}
      <h3>${fmt(s.title)}</h3>
      ${s.question ? `<p class="q">${fmt(s.question)}</p>` : ""}
      ${paras(s.body)}${extra}
      ${s.tip ? `<p class="tip"><b>TIP</b>${fmt(s.tip)}</p>` : ""}
      ${s.tags ? `<div class="tags">${s.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
      ${acc}
    </div>
  </article>`;
}

function themeCard(t) {
  const sections = (t.sections || []).map(x => `<h4>${fmt(x.title)}</h4>${paras(x.body)}`).join("");
  return spotCard({ ...t, id: "theme-" + t.id, title: `${t.name} · ${t.ko}`, question: t.summary, body: t.intro }, sections);
}

const tabs = [
  { id: "prologue", label: "프롤로그" },
  ...D.days.map(d => ({ id: d.id, label: d.label })),
  { id: "themes", label: "테마별 스토리" }
];

function head(eyebrow, title, sub) {
  return `<div class="dayhead"><p class="eyebrow">${esc(eyebrow)}</p><h2>${fmt(title)}</h2>${sub ? `<p>${fmt(sub)}</p>` : ""}</div>`;
}

function renderPanel(id) {
  if (id === "prologue") {
    const p = D.prologue;
    return head(p.eyebrow, p.title, p.sub) + `<div class="timeline">${p.cards.map(s => spotCard(s)).join("")}</div>`;
  }
  if (id === "themes") {
    return head("Themes", "테마별 스토리", "Roots · Industry · Culture & Nature · Flavors") + `<div class="timeline">${D.themes.map(themeCard).join("")}</div>`;
  }
  const d = D.days.find(x => x.id === id);
  return head(d.eyebrow, d.title, d.summary) + `<div class="timeline">${d.spots.map(s => spotCard(s)).join("")}</div>`;
}

let current = null;
function showTab(id) {
  if (!tabs.some(t => t.id === id)) id = tabs[0].id;
  if (id !== current) {
    current = id;
    $("#panel").innerHTML = `<section class="panel" role="tabpanel">${renderPanel(id)}</section>`;
    document.querySelectorAll(".tab").forEach(t => {
      const on = t.dataset.tab === id;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on);
    });
    history.replaceState(null, "", "#" + id);
  }
  $(`.tab[data-tab="${id}"]`).scrollIntoView({ inline: "center", block: "nearest" });
}

function goSpot(tab, spotId) {
  showTab(tab);
  const el = document.getElementById(spotId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
}

function renderStatic() {
  const m = D.meta;
  document.title = m.pageTitle || document.title;
  $("#hero-eyebrow").textContent = m.eyebrow;
  $("#hero-title").textContent = m.title;
  $("#hero-lead").textContent = m.lead;
  $("#hero-places").innerHTML = m.places.map(p => `<span>${esc(p)}</span>`).join("");
  $("#footer").innerHTML = esc(m.footer || "");

  $("#theme-cards").innerHTML = D.themes.map(t => `
    <button class="theme" data-theme-id="${esc(t.id)}">
      ${t.photo && t.photo.src ? `<img src="${esc(t.photo.src)}" alt="${esc(t.photo.alt || "")}">` : `<div class="noimg"></div>`}
      <div class="tb"><b>${esc(t.name)} <small>${esc(t.ko)}</small></b><span>${esc(t.card)}</span></div>
    </button>`).join("");

  $("#map-pins").innerHTML = D.map.map(p => {
    const left = p.align === "left";
    const tx = left ? p.x - 16 : p.x + 16, anchor = left ? "end" : "start";
    return `<g class="pin" tabindex="0" role="button" aria-label="${esc(p.label)}, ${esc(p.dayLabel)}" data-tab="${esc(p.day)}" data-spot="${esc(p.spot)}">
      <circle class="hit" cx="${p.x}" cy="${p.y}" r="22"/>
      <circle class="dot" cx="${p.x}" cy="${p.y}" r="9"/>
      <text x="${tx}" y="${p.y - 2}" text-anchor="${anchor}">${esc(p.label)}</text>
      <text class="day" x="${tx}" y="${p.y + 14}" text-anchor="${anchor}">${esc(p.dayLabel)}</text>
    </g>`;
  }).join("");

  $("#tab-list").innerHTML = tabs.map(t => `<button class="tab" role="tab" data-tab="${t.id}">${esc(t.label)}</button>`).join("");
}

const sheet = $("#sheet"), scrim = $("#scrim");
let lastFocus = null;
function openTerm(key) {
  const g = D.glossary[key];
  lastFocus = document.activeElement;
  $("#sheet-title").textContent = g.name || key;
  $("#sheet-jp").textContent = g.jp || "";
  $("#sheet-desc").textContent = g.desc;
  sheet.classList.add("on"); scrim.classList.add("on");
  $("#sheet-close").focus();
}
function closeTerm() {
  if (!sheet.classList.contains("on")) return;
  sheet.classList.remove("on"); scrim.classList.remove("on");
  if (lastFocus) lastFocus.focus();
}

document.addEventListener("click", e => {
  const t = e.target.closest(".term, .acc-btn, .tab, .pin, .theme");
  if (!t) return;
  if (t.matches(".term")) return openTerm(t.dataset.term);
  if (t.matches(".acc-btn")) {
    const open = t.parentElement.classList.toggle("open");
    return t.setAttribute("aria-expanded", open);
  }
  if (t.matches(".tab")) {
    showTab(t.dataset.tab);
    const nav = $("#tabs");
    if (nav.getBoundingClientRect().top <= 1) window.scrollTo({ top: nav.offsetTop, behavior: "smooth" });
    return;
  }
  if (t.matches(".pin")) return goSpot(t.dataset.tab, t.dataset.spot);
  if (t.matches(".theme")) return goSpot("themes", "theme-" + t.dataset.themeId);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeTerm();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".pin")) {
    e.preventDefault();
    goSpot(e.target.dataset.tab, e.target.dataset.spot);
  }
});
scrim.addEventListener("click", closeTerm);
$("#sheet-close").addEventListener("click", closeTerm);

renderStatic();
showTab(location.hash.slice(1) || D.meta.startTab || "prologue");
