let historyChart = null;
let currentDate = new Date();
let viewMode = "day";
let chartTypeMode = "bars";
const chartTypeDefaults = { day: "bars", week: "bars", month: "lines" };

function updateChartTypeActive() {
  const sel = document.getElementById("chartType");
  if (!sel) return;
  sel.classList.toggle("active", sel.value !== (chartTypeDefaults[viewMode] || "bars"));
}

document.addEventListener("DOMContentLoaded", () => {

  const btnLive = document.getElementById("btnLive");
  const btnHistory = document.getElementById("btnHistory");
  const logDiv = document.getElementById("log");
  const chartWrap = document.getElementById("chartWrap");


  const datePicker = document.getElementById("datePicker");
  datePicker.valueAsDate = currentDate;

  const today = new Date();
  datePicker.max = today.toISOString().split("T")[0];


function loadCurrentView() {
  if (viewMode === "day")   loadHistoryForDate(currentDate);
  else if (viewMode === "week")  loadHistoryForWeek(currentDate);
  else if (viewMode === "month") loadHistoryForMonth(currentDate);
}

function setViewMode(mode) {
  viewMode = mode;
  document.getElementById("btnDay").classList.toggle("active",   mode === "day");
  document.getElementById("btnWeek").classList.toggle("active",  mode === "week");
  document.getElementById("btnMonth").classList.toggle("active", mode === "month");
  document.getElementById("datePicker").style.display = mode === "month" ? "none" : "";
  chartTypeMode = chartTypeDefaults[mode] || "bars";
  const sel = document.getElementById("chartType");
  if (sel) {
    sel.value = chartTypeMode;
    sel.style.display = mode === "day" ? "none" : "";
    updateChartTypeActive();
  }
  loadCurrentView();
}

document.getElementById("btnDay").onclick   = () => setViewMode("day");
document.getElementById("btnWeek").onclick  = () => setViewMode("week");
document.getElementById("btnMonth").onclick = () => setViewMode("month");

document.getElementById("todayBtn").onclick = () => {
  currentDate = new Date();
  datePicker.valueAsDate = currentDate;
  loadCurrentView();
  updateTodayHighlight();
};

document.getElementById("chartType").onchange = (e) => {
  chartTypeMode = e.target.value;
  updateChartTypeActive();
  applyChartTypeMode();
};

  function switchToGraph() {
    if (window.stopLive) window.stopLive();
    document.body.classList.add("history-mode");

    document.getElementById("powerChart").style.display = "none";
    document.getElementById("historyWrap").style.display = "block";
    document.getElementById("historyHeader").style.display = "block";
    document.getElementById("historyControls").style.display = "flex";

    document.querySelector(".line2").style.display = "none";
    document.querySelector(".wide").style.display = "none";
    document.querySelector(".metrics").style.display = "none";

    window.currentMode = "history";
    btnHistory.classList.add("active");
    btnLive.classList.remove("active");

    logDiv.style.display = "none";
    chartWrap.classList.add("fullscreen");

    loadHistoryForDate(currentDate);
  }

  function switchToLive() {
    if (window.startLive) window.startLive();
    document.body.classList.remove("history-mode");

    document.getElementById("powerChart").style.display = "block";
    document.getElementById("historyWrap").style.display = "none";
    document.getElementById("historyHeader").style.display = "none";
    document.getElementById("historyControls").style.display = "none";

    document.querySelector(".line2").style.display = "";
    document.querySelector(".wide").style.display = "";
    document.querySelector(".metrics").style.display = "";

    window.currentMode = "live";
    btnLive.classList.add("active");
    btnHistory.classList.remove("active");

    chartWrap.classList.remove("fullscreen");
    logDiv.style.display = "block";

    if (historyChart) historyChart.destroy();
    load();
  }

  btnHistory.onclick = switchToGraph;
  btnLive.onclick = switchToLive;

  if (window.OCPP_DEFAULT_VIEW === "graph") switchToGraph();

  document.getElementById("prevDay").onclick = () => {
    if (viewMode === "week")       currentDate.setDate(currentDate.getDate() - 7);
    else if (viewMode === "month") currentDate.setMonth(currentDate.getMonth() - 1);
    else                           currentDate.setDate(currentDate.getDate() - 1);
    datePicker.valueAsDate = currentDate;
    loadCurrentView();
    updateTodayHighlight();
  };

  document.getElementById("nextDay").onclick = () => {
    const today = new Date();
    const next = new Date(currentDate);
    if (viewMode === "week")       next.setDate(next.getDate() + 7);
    else if (viewMode === "month") next.setMonth(next.getMonth() + 1);
    else                           next.setDate(next.getDate() + 1);

    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextOnly  = new Date(next.getFullYear(), next.getMonth(), next.getDate());
    if (nextOnly > todayOnly) return;

    currentDate = next;
    datePicker.valueAsDate = currentDate;
    loadCurrentView();
    updateTodayHighlight();
  };

  datePicker.onchange = () => {
    const selected = datePicker.valueAsDate;
    const today = new Date();
    const selectedOnly = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    const todayOnly    = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (selectedOnly > todayOnly) {
      datePicker.valueAsDate = todayOnly;
      currentDate = todayOnly;
    } else {
      currentDate = selectedOnly;
    }
    loadCurrentView();
    updateTodayHighlight();
  };


  
});


window.zeroLinePlugin = {
  id: "zeroLine",
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const y = scales.yPower;
    const x = scales.x;

    if (!y || !x) return;

    const yZero = y.getPixelForValue(0);

    if (yZero < chartArea.top || yZero > chartArea.bottom) return;

    ctx.save();
    ctx.setLineDash([6,4]);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(chartArea.left, yZero);
    ctx.lineTo(chartArea.right, yZero);
    ctx.stroke();
    ctx.setLineDash([]);

    // su mobile non c'è spazio per le etichette orarie
    if (chart.width < 520) {
      ctx.restore();
      return;
    }

    // etichette orarie sulla linea dello 0
    const ticks = x.ticks;
    if (ticks && ticks.length) {
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      for (const tick of ticks) {
        const xPx = x.getPixelForValue(tick.value);
        if (xPx < chartArea.left || xPx > chartArea.right) continue;

        const label = new Date(tick.value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // piccolo tick mark
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xPx, yZero - 3);
        ctx.lineTo(xPx, yZero + 3);
        ctx.stroke();

        // testo sopra la linea
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(label, xPx, yZero - 5);
      }
    }

    ctx.restore();
  }
};



// ===== WEEKLY / MONTHLY VIEW =====

async function computeDailyTotals(d) {
  const { y, ymd } = ymdParts(d);
  const bust = `?_=${Date.now()}`;
  try {
    const [chargeResp, meterResp, solarResp] = await Promise.all([
      fetch(`data/${y}/${ymd}_charge.dat${bust}`, { cache: "no-store" }),
      fetch(`data/${y}/${ymd}_meter.dat${bust}`,  { cache: "no-store" }),
      fetch(`data/${y}/${ymd}_solar.dat${bust}`,  { cache: "no-store" })
    ]);
    if (!meterResp.ok) return { chargeKwh: 0, solarKwh: 0, importKwh: 0, exportKwh: 0, hasData: false };

    const chargeTxt = chargeResp.ok ? await chargeResp.text() : "";
    const meterTxt  = await meterResp.text();
    const solarTxt  = solarResp?.ok ? await solarResp.text() : "";

    const charge = parseChargeDat(chargeTxt);
    const meter  = parseMeterDat(meterTxt);
    const solar  = parseSolarDat(solarTxt);

    const evEnergyRaw  = normalizeSeries(charge.evEnergy);
    const sessions     = parseChargeSessions(chargeTxt).map(s => ({ start: s.start, end: s.end }));
    const sessionsMeta = buildSessionsMeta(sessions, evEnergyRaw);
    const chargeKwh    = sessionsMeta.reduce((acc, s) => acc + (s.kwh || 0), 0);

    const solarArr = normalizeSeries(solar.solarKw);
    let solarKwh = 0;
    for (let i = 1; i < solarArr.length; i++) {
      const dtH = (solarArr[i].x - solarArr[i-1].x) / 3600000;
      solarKwh += (solarArr[i].y + solarArr[i-1].y) / 2 * dtH;
    }

    const gridArr = normalizeSeries(meter.gridKw);
    let importKwh = 0, exportKwh = 0;
    for (let i = 1; i < gridArr.length; i++) {
      const dtH = (gridArr[i].x - gridArr[i-1].x) / 3600000;
      const avg = (gridArr[i].y + gridArr[i-1].y) / 2;
      if (avg > 0) importKwh += avg * dtH;
      else exportKwh += Math.abs(avg) * dtH;
    }

    const evMaxKw = minMax(normalizeSeries(charge.evPower))?.max ?? 0;
    const pvMaxKw = minMax(normalizeSeries(solar.solarKw))?.max ?? 0;

    return { chargeKwh, solarKwh, importKwh, exportKwh, evMaxKw, pvMaxKw, sessionCount: sessionsMeta.length, hasData: true };
  } catch {
    return { chargeKwh: 0, solarKwh: 0, importKwh: 0, exportKwh: 0, evMaxKw: 0, pvMaxKw: 0, hasData: false };
  }
}

async function loadHistoryForWeek(date) {
  const monday = new Date(date);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const totals = await Promise.all(days.map(d => computeDailyTotals(d)));
  const labels = days.map(d => d.toLocaleDateString([], { weekday: "short", day: "numeric" }));
  const title  = `Week ${monday.toLocaleDateString([], { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}`;

  drawBarChart(labels, totals, title);
  updatePeriodStats(totals);
}

async function loadHistoryForMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  const totals = await Promise.all(days.map(d => computeDailyTotals(d)));
  const labels = days.map(d => d.getDate().toString());
  const title  = date.toLocaleDateString([], { month: "long", year: "numeric" });

  drawBarChart(labels, totals, title);
  updatePeriodStats(totals);
}

function applyChartTypeMode() {
  if (!historyChart) return;
  const isBarChart = historyChart.data.datasets.some(ds => ds.label?.startsWith("_trend_"));
  if (!isBarChart) return;
  historyChart.data.datasets.forEach(ds => {
    const isTrend = ds.label?.startsWith("_trend_");
    if (chartTypeMode === "bars")       ds.hidden = isTrend;
    else if (chartTypeMode === "lines") ds.hidden = !isTrend;
    else                                ds.hidden = false;
  });
  historyChart.update();
}

function drawBarChart(labels, totals, title) {
  const canvas = document.getElementById("historyChart");
  const ctx = canvas.getContext("2d");
  if (historyChart) historyChart.destroy();

  const win = labels.length <= 7 ? 3 : 5;

  historyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "EV Charged (kWh)",
          data: totals.map(t => t.hasData ? +t.chargeKwh.toFixed(2) : null),
          backgroundColor: "rgba(34,197,94,0.75)",
          borderColor: "#22c55e", borderWidth: 1
        },
        {
          label: "Solar (kWh)",
          data: totals.map(t => t.hasData ? +t.solarKwh.toFixed(2) : null),
          backgroundColor: "rgba(56,189,248,0.75)",
          borderColor: "#38bdf8", borderWidth: 1
        },
        {
          label: "Grid Import (kWh)",
          data: totals.map(t => t.hasData ? +t.importKwh.toFixed(2) : null),
          backgroundColor: "rgba(244,63,94,0.75)",
          borderColor: "#f43f5e", borderWidth: 1
        },
        {
          label: "Grid Export (kWh)",
          data: totals.map(t => t.hasData ? +t.exportKwh.toFixed(2) : null),
          backgroundColor: "rgba(139,92,246,0.75)",
          borderColor: "#8b5cf6", borderWidth: 1
        },
        { type:"line", label:"_trend_ev",     data: totals.map(t => t.hasData ? +t.chargeKwh.toFixed(2) : null), borderColor:"#22c55e", borderWidth:2, pointRadius:3, pointHoverRadius:7, fill:false, tension:0.2, order:0 },
        { type:"line", label:"_trend_solar",  data: totals.map(t => t.hasData ? +t.solarKwh.toFixed(2)  : null), borderColor:"#38bdf8", borderWidth:2, pointRadius:3, pointHoverRadius:7, fill:false, tension:0.2, order:0 },
        { type:"line", label:"_trend_import", data: totals.map(t => t.hasData ? +t.importKwh.toFixed(2) : null), borderColor:"#f43f5e", borderWidth:2, pointRadius:3, pointHoverRadius:7, fill:false, tension:0.2, order:0 },
        { type:"line", label:"_trend_export", data: totals.map(t => t.hasData ? +t.exportKwh.toFixed(2) : null), borderColor:"#8b5cf6", borderWidth:2, pointRadius:3, pointHoverRadius:7, fill:false, tension:0.2, order:0 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { bottom: 24 } },
      plugins: {
        title: { display: true, text: title, color: "#e5e7eb", font: { size: 14 } },
        legend: {
          labels: {
            color: "#9ca3af",
            boxWidth: 12,
            filter: (item) => !item.text.startsWith("_trend_"),
            generateLabels(chart) {
              const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              labels.forEach(label => { label.hidden = false; });
              return labels;
            }
          }
        },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
          pan: { enabled: true, mode: "x" }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const lbl = context.dataset.label;
              if (lbl?.startsWith("_trend_")) {
                if (chartTypeMode !== "lines") return null;
                const names = { _trend_ev: "EV Charged (kWh)", _trend_solar: "Solar (kWh)", _trend_import: "Grid Import (kWh)", _trend_export: "Grid Export (kWh)" };
                return names[lbl] || lbl;
              }
              return lbl || "";
            },
            afterLabel(context) {
              const lbl = context.dataset.label;
              if (lbl?.startsWith("_trend_") && chartTypeMode !== "lines") return null;
              const dataIndex = context.dataIndex;
              const val = context.parsed.y;
              const t = totals[dataIndex];
              if (!t) return "";
              const trendOrigIdx = { _trend_ev: 0, _trend_solar: 1, _trend_import: 2, _trend_export: 3 };
              const dsIndex = lbl?.startsWith("_trend_") ? (trendOrigIdx[lbl] ?? -1) : context.datasetIndex;
              const lines = [`Total: ${val !== null ? val.toFixed(2) + " kWh" : "—"}`];
              if (dsIndex === 0 && t.evMaxKw) lines.push(`Max: ${t.evMaxKw.toFixed(2)} kW`);
              if (dsIndex === 1 && t.pvMaxKw) lines.push(`Max: ${t.pvMaxKw.toFixed(2)} kW`);
              return lines;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { beginAtZero: true, ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    }
  });

  applyChartTypeMode();
  setTimeout(() => historyChart.resize(), 50);
}

function updatePeriodStats(totals) {
  document.getElementById("historyError").style.display = "none";
  const sum = key => totals.reduce((acc, t) => acc + (t[key] || 0), 0);
  const maxVal = key => {
    const vals = totals.filter(t => t.hasData && t[key]).map(t => t[key]);
    return vals.length ? Math.max(...vals) : null;
  };

  const evMax = maxVal("evMaxKw");
  const pvMax = maxVal("pvMaxKw");
  const sessions = sum("sessionCount");

  document.getElementById("statEv").textContent       = evMax ? evMax.toFixed(2) + " kW" : "—";
  document.getElementById("statCharged").textContent  = sum("chargeKwh").toFixed(2) + " kWh";
  document.getElementById("statSessions").textContent = sessions || "—";
  document.getElementById("statPvMax").textContent    = pvMax ? pvMax.toFixed(2) + " kW" : "—";
  document.getElementById("statSolar").textContent    = sum("solarKwh").toFixed(2) + " kWh";
  document.getElementById("statGridImport").textContent = sum("importKwh").toFixed(2) + " kWh";
  document.getElementById("statGridExport").textContent = sum("exportKwh").toFixed(2) + " kWh";
}

function updateTodayHighlight() {
  const today = new Date();
  const isToday =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();

  document.getElementById("todayBtn").classList.toggle("active", isToday);
}

// === Helper: energia al timestamp (nearest previous) ===
function energyAt(evEnergy, tsMs) {
  if (!evEnergy?.length) return null;
  // evEnergy: [{x: ms, y: kWh}] ordinato per x
  let last = null;
  for (let i = 0; i < evEnergy.length; i++) {
    if (evEnergy[i].x > tsMs) break;
    last = evEnergy[i].y;
  }
  return (typeof last === "number" && isFinite(last)) ? last : null;
}

// === Precalcola meta sessioni: #, durata, kWh ===
function buildSessionsMeta(sessions, evEnergy) {
  return sessions.map((s, idx) => {
    const e0 = energyAt(evEnergy, s.start);
    const e1 = energyAt(evEnergy, s.end);
        console.log("session", idx, "start:", s.start, "end:", s.end, "e0:", e0, "e1:", e1); // ← aggiungi

    let kwh = null;
    if (e0 != null && e1 != null) {
      kwh = e1 - e0;
      // se per qualche motivo resetta, fallback a abs
      if (!isFinite(kwh)) kwh = null;
      else if (kwh < 0) kwh = Math.abs(kwh);
    }

    const durMs = Math.max(0, s.end - s.start);
    const durMin = Math.round(durMs / 60000);

    return {
      n: idx + 1,
      start: s.start,
      end: s.end,
      durMin,
      kwh
    };
  });
}


// === Trova sessione in cui cade un timestamp ===
window.findSessionMetaAt = function findSessionMetaAt(sessionsMeta, tsMs) {
  if (!sessionsMeta?.length) return null;
  for (const s of sessionsMeta) {
    if (tsMs >= s.start && tsMs <= s.end) return s;
  }
  return null;
};



function normalizeSeries(arr){
  const out = (arr || [])
    .map(p => ({ x: p.x, y: Number(p.y) }))
    .filter(p => isFinite(p.x) && isFinite(p.y))
    .sort((a,b) => a.x - b.x);

  // dedup stesso timestamp: tieni ultimo
  const dedup = [];
  for (const p of out){
    const last = dedup[dedup.length - 1];
    if (last && last.x === p.x) dedup[dedup.length - 1] = p;
    else dedup.push(p);
  }
  return dedup;
}

// HOLD (step): valore ultimo noto <= t
function valueHold(series, t){
  if (!series.length) return null;
  // avanzamento lineare con indice esterno sarebbe più veloce, qui ok per pochi punti
  let v = null;
  for (let i = 0; i < series.length; i++){
    if (series[i].x > t) break;
    v = series[i].y;
  }
  return v;
}

function movingAverage(data, win) {
  return data.map((_, i) => {
    const half = Math.floor(win / 2);
    const slice = data.slice(Math.max(0, i - half), Math.min(data.length, i + half + 1))
                      .filter(v => v !== null);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

function minMax(series){
  const vals = (series || []).map(p => p.y).filter(v => Number.isFinite(v));
  if (!vals.length) return null;
  return { min: Math.min(...vals), max: Math.max(...vals) };
}


// crea griglia temporale comune e resample con hold
function resampleHold(series, t0, t1, stepMs){
  const out = [];
  if (!series?.length) return out;
  series = normalizeSeries(series);

  // indice per scorrere veloce
  let j = 0;
  let last = null;

  for (let t = t0; t <= t1; t += stepMs){
    while (j < series.length && series[j].x <= t){
      last = series[j].y;
      j++;
    }
    if (last != null) out.push({ x: t, y: last });
    else out.push({ x: t, y: null }); // niente prima
  }
  return out;
}

function showNoDataMessage(){
  document.getElementById("historyError").style.display = "block";

  document.getElementById("statEv").textContent = "—";
  document.getElementById("statCharged").textContent = "—";
  document.getElementById("statPvMax").textContent = "—";
  document.getElementById("statSolar").textContent = "—";
  document.getElementById("statGridExport").textContent = "—";
  document.getElementById("statGridImport").textContent = "—";
  document.getElementById("statSessions").textContent = "—";


  if (historyChart) {
    historyChart.destroy();
    historyChart = null;
  }
}

// calcola range comune (min..max) tra più serie
function commonRange(seriesList){
  const mins = [];
  const maxs = [];
  for (const s of seriesList){
    const ss = normalizeSeries(s);
    if (!ss.length) continue;
    mins.push(ss[0].x);
    maxs.push(ss[ss.length - 1].x);
  }
  if (!mins.length) return null;
  return { t0: Math.min(...mins), t1: Math.max(...maxs) };
}


function ymdParts(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return { y, ymd: `${y}${m}${day}` };
}

async function loadHistoryForDate(d){

  const { y, ymd } = ymdParts(d);
  const bust = `?_=${Date.now()}`;

  const chargePath = `data/${y}/${ymd}_charge.dat`;
  const meterPath  = `data/${y}/${ymd}_meter.dat`;
  const solarPath  = `data/${y}/${ymd}_solar.dat`;

let chargeResp, meterResp, solarResp;

try {
  [chargeResp, meterResp, solarResp] = await Promise.all([
    fetch(chargePath + bust, { cache: "no-store" }),
    fetch(meterPath  + bust, { cache: "no-store" }),
    fetch(solarPath  + bust, { cache: "no-store" })
  ]);
} catch (err) {
  showNoDataMessage();
  return;
}

if (!meterResp.ok) {
  showNoDataMessage();
  return;
}

document.getElementById("historyError").style.display = "none";

const chargeTxt = chargeResp.ok ? await chargeResp.text() : "";
const meterTxt  = await meterResp.text();
const solarTxt  = (solarResp && solarResp.ok) ? await solarResp.text() : "";


  const charge = parseChargeDat(chargeTxt);
  const meter  = parseMeterDat(meterTxt);
  const solar  = parseSolarDat(solarTxt);

  // === NORMALIZZA DATI ===
  charge.evPower  = normalizeSeries(charge.evPower);
  charge.evEnergy = normalizeSeries(charge.evEnergy);
  meter.gridKw    = normalizeSeries(meter.gridKw);
  solar.solarKw   = normalizeSeries(solar.solarKw);

  // salva evEnergy raw (prima del resampling) per calcolo kWh sessioni
  const evEnergyRaw = charge.evEnergy;

  const r = commonRange([charge.evPower, charge.evEnergy, meter.gridKw]);
  if (!r) return;

  const STEP_MS = 30 * 1000;

  charge.evPower  = resampleHold(charge.evPower,  r.t0, r.t1, STEP_MS);
  meter.gridKw    = resampleHold(meter.gridKw,    r.t0, r.t1, STEP_MS);
  charge.evEnergy = resampleHold(charge.evEnergy, r.t0, r.t1, STEP_MS);
  if (solar.solarKw.length) {
    solar.solarKw = resampleHold(solar.solarKw, r.t0, r.t1, STEP_MS);
  }


  const evMM   = minMax(charge.evPower);
  const gridMM = minMax(meter.gridKw);
  const pvMM   = minMax(solar.solarKw);


  // === SESSIONI (UNA SOLA VOLTA) ===
  const sessions = parseChargeSessions(chargeTxt)
    .map(s => ({ start: s.start, end: s.end }));

  // usa evEnergy raw (timestamp esatti) per evitare problemi di allineamento griglia
  const sessionsMeta = buildSessionsMeta(sessions, evEnergyRaw);


/*document.getElementById("statEv").textContent =
  evMM ? `${evMM.min.toFixed(2)} / ${evMM.max.toFixed(2)} kW` : "—";*/
document.getElementById("statEv").textContent =
  evMM ? `${evMM.max.toFixed(2)} kW` : "—";

const totalKwh = sessionsMeta.reduce((acc,s)=>acc+(s.kwh||0),0);
document.getElementById("statCharged").textContent =
  totalKwh > 0 ? totalKwh.toFixed(2)+" kWh" : "—";

document.getElementById("statPvMax").textContent =
  pvMM ? pvMM.max.toFixed(2)+" kW" : "—";

// energia solare totale: integrazione trapezoidale (dati resampled a 30s)
let solarKwh = 0;
for (let i = 1; i < solar.solarKw.length; i++) {
  const dtH = (solar.solarKw[i].x - solar.solarKw[i-1].x) / 3600000;
  solarKwh += (solar.solarKw[i].y + solar.solarKw[i-1].y) / 2 * dtH;
}
document.getElementById("statSolar").textContent =
  solarKwh > 0 ? solarKwh.toFixed(2)+" kWh" : "—";

// grid export giornaliero: integra solo i valori negativi (negativo = immissione)
let gridExportKwh = 0;
let gridImportKwh = 0;
for (let i = 1; i < meter.gridKw.length; i++) {
  const dtH = (meter.gridKw[i].x - meter.gridKw[i-1].x) / 3600000;
  const avg = (meter.gridKw[i].y + meter.gridKw[i-1].y) / 2;
  if (avg < 0) gridExportKwh += Math.abs(avg) * dtH;
  else gridImportKwh += avg * dtH;
}
document.getElementById("statGridExport").textContent =
  gridExportKwh > 0 ? gridExportKwh.toFixed(2)+" kWh" : "—";
document.getElementById("statGridImport").textContent =
  gridImportKwh > 0 ? gridImportKwh.toFixed(2)+" kWh" : "—";

document.getElementById("statSessions").textContent =
  sessionsMeta.length;


  drawHistoryChart(charge, meter, solar, sessions, sessionsMeta);
}

function totalKwhFromSessions(sessionsMeta){
  let tot = 0;
  for (const s of sessionsMeta){
    if (Number.isFinite(s.kwh)) tot += s.kwh;
  }
  return tot;
}

function parseChargeSessions(txt) {
  const lines = txt.split("\n").filter(Boolean);

  const sessions = [];
  let openStart = null;

  // primo timestamp valido del file (per sessioni cross-day)
  let firstEpoch = null;
  for (const line of lines) {
    const p = line.trim().split(/\s+/);
    const e = parseInt(p[0], 10);
    if (Number.isFinite(e)) { firstEpoch = e; break; }
  }

  let crossDayUsed = false; // evita doppia sessione cross-day (Transaction.End + StopTransaction)

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;

    const epoch = parseInt(parts[0], 10);
    if (!Number.isFinite(epoch)) continue;

    const hasBegin = line.includes("Transaction.Begin");
    const hasEnd   = line.includes("Transaction.End") || line.includes("StopTransaction");

    if (hasBegin) {
      openStart = epoch;
      crossDayUsed = false;
      continue;
    }

    if (hasEnd) {
      if (openStart != null) {
        // sessione normale (Begin e End nello stesso file)
        const start = openStart * 1000;
        const end   = epoch * 1000;
        if (end > start) sessions.push({ start, end });
        openStart = null;
        crossDayUsed = true; // evita che il paired StopTransaction crei una phantom cross-day
      } else if (!crossDayUsed && firstEpoch != null) {
        // sessione cross-day: Begin era nel file del giorno precedente
        const start = firstEpoch * 1000;
        const end   = epoch * 1000;
        if (end > start) sessions.push({ start, end });
        crossDayUsed = true;
      }
    }
  }

  // se resta aperta (sessione ancora in corso) la chiudiamo "a fine file"
  if (openStart != null) {
    // prendo l’ultimo timestamp valido del file
    for (let i = lines.length - 1; i >= 0; i--) {
      const p = lines[i].trim().split(/\s+/);
      const last = parseInt(p[0], 10);
      if (Number.isFinite(last) && last > openStart) {
        sessions.push({ start: openStart * 1000, end: last * 1000 });
        break;
      }
    }
  }

  return sessions;
}


function parseChargeDat(text){
  const lines = text.split("\n").filter(Boolean);

  const evPower = [];
  const evEnergy = [];

  for(const line of lines){

    const parts = line.split("\t");

    if (parts.length < 9) continue;

    const ts = parseInt(parts[0],10);
    if (!Number.isFinite(ts)) continue;

    const powerRaw = parts[6];
    const energySession = parts[7];         // "2496/8535"

    // se parts[6] contiene "/" non è potenza (es. StopTransaction sposta le colonne)
    if (powerRaw && !powerRaw.includes("/")) {
      const powerW = parseFloat(powerRaw);
      if (Number.isFinite(powerW)){
        evPower.push({ x: ts * 1000, y: powerW / 1000 });  // kW
      }
    }

    // segna fine sessione con 0 W così resampleHold non estende l'ultimo valore
    if (line.includes("Transaction.End") || line.includes("StopTransaction")) {
      evPower.push({ x: ts * 1000, y: 0 });
    }

    if (energySession && energySession.includes("/")){
      const totalEnergy = parseFloat(energySession.split("/")[0]);

      if (Number.isFinite(totalEnergy)){
        evEnergy.push({ x: ts * 1000, y: totalEnergy / 1000 }); // kWh
      }
    }
  }

  return { evPower, evEnergy };
}

function parseSolarDat(text){
  const lines = text.split("\n").filter(Boolean);
  const solarKw = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;

    const ts = parseInt(parts[0], 10);
    const w  = parseFloat(parts[3]);

    if (!Number.isFinite(ts) || !Number.isFinite(w)) continue;

    solarKw.push({ x: ts * 1000, y: w / 1000 });
  }

  return { solarKw };
}

function parseMeterDat(text){
  const lines = text.split("\n").filter(Boolean);

  const gridKw = [];

  for(const line of lines){

    const parts = line.trim().split(/\s+/);

    if (parts.length < 6) continue;

    const ts = parseInt(parts[0],10);
    const gridW = parseFloat(parts[5]);

    if (!Number.isFinite(ts) || !Number.isFinite(gridW)) continue;

    gridKw.push({ x: ts * 1000, y: gridW / 1000 });
  }

  return { gridKw };
}


function drawHistoryChart(charge, meter, solar, sessions, sessionsMeta){

  const canvas = document.getElementById("historyChart");
  const ctx = canvas.getContext("2d");

  if (historyChart) historyChart.destroy();

  historyChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "EV Power (kW)",
          data: charge.evPower,
          order: 2,
          borderWidth: 2,
          tension: 0.2,
          yAxisID: "yPower",
          parsing: false,
          pointRadius: 0,
          fill: true,
          backgroundColor: "rgba(34,197,94,0.25)",
          borderColor: "#22c55e",
          borderWidth: 2
        },
        {
          label: "Grid Power (kW)",
          data: meter.gridKw,
          order: 3,
          tension: 0.2,
          yAxisID: "yPower",
          parsing: false,
          pointRadius: 0,
          borderColor: "#f43f5e",
          borderWidth: 2,
          fill: false
        },
        ...(solar.solarKw.length ? [{
          label: "Solar Power (kW)",
          data: solar.solarKw,
          order: 1,
          tension: 0.2,
          yAxisID: "yPower",
          parsing: false,
          pointRadius: 0,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56,189,248,0.15)",
          borderWidth: 2,
          fill: true
        }] : [])
      ]
    },

    plugins: [window.zeroLinePlugin],

    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },

      plugins: {
        sessionBands: { sessions },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x"
          },
          pan: {
            enabled: true,
            mode: "x",
            modifierKey: null
          },
          limits: {
            x: { min: "original", max: "original" }
          }
        },
        tooltip: {
          callbacks: {
            // Riga extra nel tooltip: Sessione #, durata, kWh
            afterBody: (items) => {
              const ts = items?.[0]?.parsed?.x;
              if (!ts) return "";

              const s = window.findSessionMetaAt(sessionsMeta, ts);
              if (!s) return "";

              const kwhStr = (s.kwh == null) ? "—" : s.kwh.toFixed(2) + " kWh";
              const fmt = (ms) => new Date(ms).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
              const h = Math.floor(s.durMin / 60);
              const m = s.durMin % 60;
              const durStr = h > 0 ? `${h}h ${String(m).padStart(2,"0")}min` : `${m}min`;
              return `Sessione #${s.n} · ${fmt(s.start)} → ${fmt(s.end)} · ${durStr} · ${kwhStr}`;
            }

          }
        }
      },

      scales: {
        x: {
          type: "time",
          time: { unit: "hour" },
          ticks: { display: false }
        },
        yPower: {
          position: "left",
          title: { display: true, text: "kW" },
          beginAtZero: false,
          afterDataLimits(scale) {
            if (scale.max > 0) scale.max *= 1.05;
            scale._dataMin = scale.min;
          },
          afterBuildTicks(scale) {
            if ((scale._dataMin ?? 0) < 0) {
              scale.ticks = scale.ticks.filter(t => t.value >= scale._dataMin);
              scale.min = scale._dataMin;
            }
          }
        }
      }
    }
  });

  setTimeout(() => historyChart.resize(), 50);
}
