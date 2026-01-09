import { renderSeatMap } from "./seatmap-core.js";

const rowStd = (side = "_") => ["S", "S", "|", "S", "S", side];
const rowBack5 = () => ["S", "S", "S", "S", "S", "_"]; // 1+1+1+1+1

// Dopo 6 righe standard = 24 posti → la riga successiva parte con 25-28
const LAYOUT = [
  ["D", "_", "|", "_", "_", "_"],
  ...Array.from({ length: 12 }, (_, i) => rowStd(i === 6 ? "P" : "_")),
  rowBack5(),
  ["W", "_", "|", "_", "_", "_"],
];

export function renderSeatMapGT53(container, options) {
  return renderSeatMap(
    container,
    { title: "GT 53 posti", subtitle: "tocca un posto per selezionare", layout: LAYOUT, colsClass: "gt-2x2-door" },
    options
  );
}
