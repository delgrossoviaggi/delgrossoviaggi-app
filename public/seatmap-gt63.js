import { seat } from "./seatmap-core.js";

export function renderGT63(container, onClick) {
  const wrap = document.createElement("div");
  wrap.className = "coach grid gt";

  let n = 1;
  for (; n <= 63; n++) {
    wrap.appendChild(seat(n, onClick));
  }

  container.appendChild(wrap);
}
