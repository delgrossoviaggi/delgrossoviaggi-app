import { renderSeatMap } from "./seatmap-core.js";

const rowStd = (side = "_") => ["S", "S", "|", "S", "S", side];
const rowBack5 = () => ["S", "S", "S", "S", "S", "_"]; // 1+1+1+1+1

// Dopo 7 righe = 28 posti → la riga successiva parte con 29-32
const LAYOUT = [
  ["D", "_", "|", "_", "_", "_"],
  ...Array.from({ length: 14 }, (_, i) => rowStd(i === 7 ? "P" : "_")),
  ["S", "S", "|", "_", "_", "_"], // +2 posti
  rowBack5(),                     // ultimi 5
  ["W", "_", "|", "_", "_", "_"],
];

export function renderSeatMapGT63(container, options) {
  return renderSeatMap(
    container,
    { title: "GT 63 posti", subtitle: "tocca un posto per selezionare", layout: LAYOUT, colsClass: "gt-2x2-door" },
    options
  );
}
