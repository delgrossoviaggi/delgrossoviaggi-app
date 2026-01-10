let selected = new Set();
let occupied = new Set();
let currentBus = null;

function $(id) { return document.getElementById(id); }

function renderLegend(container) {
  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <span><i class="dot"></i> libero</span>
    <span><i class="dot sel"></i> selezionato</span>
    <span><i class="dot occ"></i> occupato</span>
  `;
  container.appendChild(legend);
}

function updateSelectedBox() {
  const box = $("selectedSeats");
  if (!box) return;
  const arr = [...selected].sort((a,b)=>a-b);
  box.textContent = arr.length ? arr.join(", ") : "Nessuno";
}

function makeSeatButton(n) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "seat";
  btn.textContent = String(n);

  const refreshClass = () => {
    btn.classList.toggle("occupied", occupied.has(n));
    btn.classList.toggle("selected", selected.has(n));
    btn.disabled = occupied.has(n);
  };

  btn.addEventListener("click", () => {
    if (occupied.has(n)) return;
    if (selected.has(n)) selected.delete(n);
    else selected.add(n);
    refreshClass();
    updateSelectedBox();
  });

  refreshClass();
  return btn;
}

function makeCell(text, cls) {
  const d = document.createElement("div");
  d.className = `cell ${cls || ""}`.trim();
  d.textContent = text;
  return d;
}

function makeBlank() {
  const d = document.createElement("div");
  d.className = "blank";
  return d;
}

/**
 * Layout engine:
 * - seatmap-gt53.js e seatmap-gt63.js esportano buildLayout()
 * - buildLayout() ritorna un array di "righe", ogni riga è array di 6 celle:
 *   [L1, L2, AISLE, R1, R2, SIDE]
 *   dove ogni cella può essere:
 *   { type:"seat", n: 12 } | { type:"door"} | {type:"blank"} | {type:"label", text:"PORTA"}
 */
async function buildSeatmap(busType) {
  const seatmap = $("seatmap");
  if (!seatmap) return;

  seatmap.innerHTML = "";
  selected = new Set();
  updateSelectedBox();

  const coach = document.createElement("div");
  coach.className = "coach gt-2x2-door";

  const head = document.createElement("div");
  head.className = "coach-head";
  head.innerHTML = `<span>Bus: <b>${busType}</b></span><span>Seleziona i posti</span>`;
  coach.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "grid";
  coach.appendChild(grid);

  const mod = await import(busType === "GT63" ? "./seatmap-gt63.js" : "./seatmap-gt53.js");
  const rows = mod.buildLayout();

  rows.forEach((row) => {
    row.forEach((cell) => {
      if (!cell || cell.type === "blank") return grid.appendChild(makeBlank());
      if (cell.type === "aisle") return grid.appendChild(makeBlank()); // spazio corridoio
      if (cell.type === "door") return grid.appendChild(makeCell("PORTA", "door"));
      if (cell.type === "label") return grid.appendChild(makeCell(cell.text || "", ""));
      if (cell.type === "seat") return grid.appendChild(makeSeatButton(Number(cell.n)));
      return grid.appendChild(makeBlank());
    });
  });

  seatmap.appendChild(coach);
  renderLegend(seatmap);
}

export function initSeatmap(busType) {
  currentBus = busType;
  return buildSeatmap(busType);
}

export function clearSeatmap() {
  const seatmap = $("seatmap");
  if (seatmap) seatmap.innerHTML = "";
  selected = new Set();
  occupied = new Set();
  updateSelectedBox();
}

export function getSelectedSeats() {
  return [...selected].sort((a,b)=>a-b);
}

export function setOccupiedSeats(seats) {
  occupied = new Set((seats || []).map(Number));
  // ricarico layout per applicare disabled/class su bottoni
  if (currentBus) buildSeatmap(currentBus);
}
