function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function mkSeat(n, { selected, occupied, onToggleSeat }) {
  const s = el("button", "seat", String(n));
  s.type = "button";
  if (occupied?.has?.(n)) s.classList.add("occupied");
  if (selected?.has?.(n)) s.classList.add("selected");
  s.addEventListener("click", () => {
    if (occupied?.has?.(n)) return;
    onToggleSeat?.(n);
  });
  return s;
}

function mkCell(kind, label) {
  return el("div", "cell " + kind, label || "");
}

function legend(root) {
  const lg = el("div", "legend");
  lg.innerHTML = `
    <span><span class="dot"></span> Libero</span>
    <span><span class="dot sel"></span> Selezionato</span>
    <span><span class="dot occ"></span> Occupato</span>
  `;
  root.appendChild(lg);
}

// Tokens: S seat, _ blank, | aisle, D driver, W wc, P door
export function renderSeatMap(container, { title, subtitle, layout, colsClass }, options) {
  if (!container) return 0;

  container.innerHTML = "";
  const wrap = el("div", `coach ${colsClass || "gt-2x2-door"}`);

  const head = el("div", "coach-head");
  head.appendChild(el("div", "", title || "Bus"));
  head.appendChild(el("div", "", subtitle || "tocca un posto per selezionare"));
  wrap.appendChild(head);

  const grid = el("div", "grid");
  let seatN = 1;

  for (const row of layout) {
    for (const tok of row) {
      if (tok === "S") grid.appendChild(mkSeat(seatN++, options));
      else if (tok === "|") grid.appendChild(el("div", "aisle", ""));
      else if (tok === "_") grid.appendChild(el("div", "blank", ""));
      else if (tok === "D") grid.appendChild(mkCell("driver", "AUTISTA"));
      else if (tok === "W") grid.appendChild(mkCell("wc", "WC"));
      else if (tok === "P") grid.appendChild(mkCell("door", "PORTA"));
      else grid.appendChild(el("div", "blank", ""));
    }
  }

  wrap.appendChild(grid);
  legend(wrap);
  container.appendChild(wrap);

  return seatN - 1;
}
