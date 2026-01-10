// public/seatmap-core.js
import { layoutGT53 } from "./seatmap-gt53.js";
import { layoutGT63 } from "./seatmap-gt63.js";

let selected = new Set();
let occupied = new Set();
let container = null;

export function initSeatmap(tipoBus) {
  container = document.getElementById("seatmap");
  if (!container) return;

  container.innerHTML = "";
  selected.clear();
  occupied.clear();

  const layout = tipoBus === "GT63" ? layoutGT63 : layoutGT53;

  layout.forEach(row => {
    const r = document.createElement("div");
    r.className = "seat-row";

    row.forEach(cell => {
      if (cell === "aisle") {
        const a = document.createElement("div");
        a.className = "aisle";
        r.appendChild(a);
        return;
      }

      if (cell === "door") {
        const d = document.createElement("div");
        d.className = "door";
        d.textContent = "🚪";
        r.appendChild(d);
        return;
      }

      const s = document.createElement("div");
      s.className = "seat";
      s.textContent = cell;
      s.dataset.seat = cell;

      s.addEventListener("click", () => {
        const n = Number(cell);
        if (occupied.has(n)) return;

        if (selected.has(n)) {
          selected.delete(n);
          s.classList.remove("selected");
        } else {
          selected.add(n);
          s.classList.add("selected");
        }

        window.dispatchEvent(
          new CustomEvent("seatsChanged", {
            detail: [...selected].sort((a, b) => a - b)
          })
        );
      });

      r.appendChild(s);
    });

    container.appendChild(r);
  });
}

export function setOccupiedSeats(list) {
  occupied = new Set(list.map(Number));

  document.querySelectorAll(".seat").forEach(el => {
    const n = Number(el.dataset.seat);
    el.classList.remove("selected");
    el.classList.toggle("occupied", occupied.has(n));
    selected.delete(n);
  });

  window.dispatchEvent(new CustomEvent("seatsChanged", { detail: [] }));
}

export function getSelectedSeats() {
  return [...selected].sort((a, b) => a - b);
}

export function clearSeatmap() {
  if (container) container.innerHTML = "";
  selected.clear();
  occupied.clear();
}
