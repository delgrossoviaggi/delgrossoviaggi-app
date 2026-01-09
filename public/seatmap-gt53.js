import { seat } from "./seatmap-core.js";

export function renderGT53(container, onClick) {
  const wrap = document.createElement("div");
  wrap.className = "coach grid gt";

  let n = 1;
  for (; n <= 53; n++) {
    wrap.appendChild(seat(n, onClick));
  }

  container.appendChild(wrap);
}
