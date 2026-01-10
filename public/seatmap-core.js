/**
 * seatmap-core.js
 * Core "renderer + state" per la piantina posti.
 *
 * Dipende da:
 *  - seatmap-gt53.js
 *  - seatmap-gt63.js
 *
 * Ogni seatmap-gtXX.js può esportare UNO di questi formati:
 *  1) export function getLayout() { return [...rows] }
 *  2) export const LAYOUT = [...rows]
 *  3) export default [...rows]
 *
 * Formato layout atteso (rows):
 *  [
 *    [1, 2, "AISLE", 3, 4, null],
 *    ["DOOR", null, "AISLE", 25, 26, null],
 *    ...
 *  ]
 *
 * Celle possibili:
 *  - numero => posto
 *  - "AISLE" => corridoio
 *  - "DOOR" => porta
 *  - "WC" => bagno
 *  - "DRIVER" => autista
 *  - null => vuoto
 */

const ROOT_ID = "seatmap";

let currentBus = "";
let selected = new Set(); // string/number seat ids
let occupied = new Set(); // string/number seat ids

function rootEl() {
  return document.getElementById(ROOT_ID);
}

function normalizeSeatId(v) {
  // seat possono arrivare come number o string. Uniformiamo.
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
}

function sortSeats(arr) {
  // ordina numeri bene (1,2,10) e lascia eventuali stringhe
  return arr
    .map((x) => String(x))
    .sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      const aIsNum = !Number.isNaN(na);
      const bIsNum = !Number.isNaN(nb);
      if (aIsNum && bIsNum) return na - nb;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.localeCompare(b);
    });
}

function dispatchSelectionChanged() {
  window.dispatchEvent(
    new CustomEvent("seatSelectionChanged", {
      detail: { seats: getSelectedSeats() },
    })
  );
}

async function loadLayout(busType) {
  const bus = String(busType || "").toUpperCase().replace(/\s+/g, "");
  if (bus !== "GT53" && bus !== "GT63") return null;

  const modPath = bus === "GT53" ? "./seatmap-gt53.js" : "./seatmap-gt63.js";
  const mod = await import(modPath);

  // Prova: funzione getLayout()
  if (typeof mod.getLayout === "function") {
    const res = mod.getLayout();
    return Array.isArray(res) ? res : null;
  }

  // Prova: export const LAYOUT
  if (Array.isArray(mod.LAYOUT)) return mod.LAYOUT;

  // Prova: export const layout
  if (Array.isArray(mod.layout)) return mod.layout;

  // Prova: default export
  if (Array.isArray(mod.default)) return mod.default;

  return null;
}

function clearRoot() {
  const el = rootEl();
  if (!el) return;
  el.innerHTML = "";
}

/**
 * RENDER
 */
function render(layout) {
  const el = rootEl();
  if (!el) return;

  el.innerHTML = "";

  if (!layout || !Array.isArray(layout) || !layout.length) {
    el.innerHTML = `<div class="msg">Piantina non disponibile.</div>`;
    return;
  }

  // Wrapper coerente con il CSS che mi hai incollato
  const wrap = document.createElement("div");
  wrap.className = "coach gt-2x2-door";

  const head = document.createElement("div");
  head.className = "coach-head";
  head.innerHTML = `
    <div>Bus: <b>${currentBus || "-"}</b></div>
    <div>Seleziona i posti</div>
  `;

  const grid = document.createElement("div");
  grid.className = "grid";

  // Render cell-by-cell
  layout.forEach((row) => {
    (row || []).forEach((cell) => {
      const node = renderCell(cell);
      grid.appendChild(node);
    });
  });

  // Legend
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <span><span class="dot"></span> Libero</span>
    <span><span class="dot sel"></span> Selezionato</span>
    <span><span class="dot occ"></span> Occupato</span>
  `;

  wrap.appendChild(head);
  wrap.appendChild(grid);
  wrap.appendChild(legend);
  el.appendChild(wrap);
}

function renderCell(cell) {
  // Corridoio
  if (cell === "AISLE") {
    const d = document.createElement("div");
    d.className = "aisle blank";
    return d;
  }

  // Vuoto
  if (cell === null || cell === undefined || cell === "") {
    const d = document.createElement("div");
    d.className = "blank";
    return d;
  }

  // Speciali
  if (cell === "DOOR" || cell === "WC" || cell === "DRIVER") {
    const d = document.createElement("div");
    d.className = `cell ${String(cell).toLowerCase()}`;
    d.textContent = cell === "DOOR" ? "PORTA" : cell === "WC" ? "WC" : "AUTISTA";
    return d;
  }

  // Posto (numero o stringa)
  const seatId = normalizeSeatId(cell);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "seat";
  btn.dataset.seat = seatId;
  btn.textContent = seatId;

  // Stato iniziale
  if (occupied.has(seatId)) btn.classList.add("occupied");
  if (selected.has(seatId)) btn.classList.add("selected");

  btn.addEventListener("click", () => {
    if (occupied.has(seatId)) return;

    if (selected.has(seatId)) {
      selected.delete(seatId);
      btn.classList.remove("selected");
    } else {
      selected.add(seatId);
      btn.classList.add("selected");
    }

    dispatchSelectionChanged();
  });

  return btn;
}

/**
 * PUBLIC API
 */
export async function initSeatmap(busType) {
  currentBus = String(busType || "").toUpperCase().replace(/\s+/g, "");

  selected.clear(); // reset selezione quando cambi bus/viaggio
  dispatchSelectionChanged();

  const layout = await loadLayout(currentBus);

  if (!layout) {
    clearRoot();
    const el = rootEl();
    if (el) el.innerHTML = `<div class="msg">Errore: layout ${currentBus} mancante.</div>`;
    return;
  }

  render(layout);
}

export function getSelectedSeats() {
  return sortSeats(Array.from(selected));
}

export function setOccupiedSeats(seats) {
  occupied = new Set((seats || []).map(normalizeSeatId));

  // aggiorna UI se già renderizzata
  const el = rootEl();
  if (!el) return;

  el.querySelectorAll("[data-seat]").forEach((btn) => {
    const seatId = btn.getAttribute("data-seat");
    const isOcc = occupied.has(seatId);

    btn.classList.toggle("occupied", isOcc);
    if (isOcc) {
      // se è diventato occupato, non può restare selezionato
      selected.delete(seatId);
      btn.classList.remove("selected");
    }
  });

  dispatchSelectionChanged();
}

export function clearSeatmap() {
  currentBus = "";
  selected.clear();
  occupied.clear();
  clearRoot();
  dispatchSelectionChanged();
}
