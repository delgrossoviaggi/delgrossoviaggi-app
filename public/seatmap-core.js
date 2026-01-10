// seatmap-core.js
import { buildGT53Layout } from "./seatmap-gt53.js";
import { buildGT63Layout } from "./seatmap-gt63.js";

let currentBus = null;
let selected = new Set();
let occupied = new Set();

function findMount() {
  return (
    document.getElementById("seatmapMount") ||
    document.getElementById("seatmap") ||
    document.getElementById("seatmapBox") ||
    document.getElementById("seatmapContainer")
  );
}

function updateSelectedUI() {
  const arr = Array.from(selected).sort((a, b) => Number(a) - Number(b));
  const box = document.getElementById("selectedSeats");
  if (box) box.textContent = arr.length ? arr.join(", ") : "Nessuno";

  // utile a main.js o altre parti se vuoi ascoltare eventi
  window.dispatchEvent(
    new CustomEvent("seatSelectionChanged", { detail: { seats: arr } })
  );
}

function cellEl(cell) {
  // AISLE / blank
  if (!cell) {
    const d = document.createElement("div");
    d.className = "blank";
    return d;
  }

  // DOOR
  if (cell.type === "door") {
    const d = document.createElement("div");
    d.className = "cell door";
    d.textContent = "PORTA";
    return d;
  }

  // DRIVER (se lo userai in futuro)
  if (cell.type === "driver") {
    const d = document.createElement("div");
    d.className = "cell driver";
    d.textContent = "GUIDA";
    return d;
  }

  // SEAT
  if (cell.type === "seat") {
    const n = String(cell.n);
    const btn = document.createElement("div");
    btn.className = "seat";
    btn.dataset.seat = n;
    btn.textContent = n;

    if (occupied.has(n)) btn.classList.add("occupied");
    if (selected.has(n)) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      if (occupied.has(n)) return;

      if (selected.has(n)) selected.delete(n);
      else selected.add(n);

      btn.classList.toggle("selected");
      updateSelectedUI();
    });

    return btn;
  }

  // fallback
  const d = document.createElement("div");
  d.className = "blank";
  return d;
}

function renderLayout(busType, layout) {
  const mount = findMount();
  if (!mount) {
    console.warn("Seatmap mount non trovato: crea un div con id='seatmapMount' (o seatmap).");
    return;
  }

  mount.innerHTML = "";

  // wrapper coerente col tuo CSS
  const wrap = document.createElement("div");
  wrap.className = "seatmap";

  const coach = document.createElement("div");
  coach.className = `coach gt-2x2-door ${busType === "GT63" ? "gt63" : "gt53"}`;

  const head = document.createElement("div");
  head.className = "coach-head";
  head.innerHTML = `<span>Bus: <b>${busType}</b></span><span>Seleziona i posti</span>`;

  const grid = document.createElement("div");
  grid.className = "grid";

  // costruzione righe/colonne
  layout.forEach((row) => {
    // row deve avere 6 celle
    const fixed = Array.isArray(row) ? row.slice(0, 6) : [null, null, null, null, null, null];
    while (fixed.length < 6) fixed.push(null);

    fixed.forEach((cell, idx) => {
      // la colonna 3 (index 2) è corridoio => la lasciamo blank (22px) via CSS
      const el = cellEl(cell);
      if (idx === 2) el.classList.add("aisle");
      grid.appendChild(el);
    });
  });

  // legenda
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <span><span class="dot"></span> Libero</span>
    <span><span class="dot sel"></span> Selezionato</span>
    <span><span class="dot occ"></span> Occupato</span>
  `;

  coach.appendChild(head);
  coach.appendChild(grid);
  coach.appendChild(legend);
  wrap.appendChild(coach);
  mount.appendChild(wrap);

  updateSelectedUI();
}

/**
 * API usata da main.js
 */
export function initSeatmap(busType) {
  currentBus = busType;
  selected = new Set(); // reset selezione al cambio viaggio/bus

  if (busType === "GT63") {
    renderLayout("GT63", buildGT63Layout());
  } else {
    renderLayout("GT53", buildGT53Layout());
  }
}

export function clearSeatmap() {
  currentBus = null;
  selected = new Set();
  occupied = new Set();
  const mount = findMount();
  if (mount) mount.innerHTML = "";
  updateSelectedUI();
}

export function getSelectedSeats() {
  return Array.from(selected).sort((a, b) => Number(a) - Number(b));
}

export function setOccupiedSeats(seats) {
  occupied = new Set((seats || []).map(String));

  // se un posto selezionato è diventato occupato => lo rimuovo
  selected.forEach((s) => {
    if (occupied.has(s)) selected.delete(s);
  });

  // re-render se abbiamo già un bus
  if (currentBus) initSeatmap(currentBus);
  updateSelectedUI();
}
