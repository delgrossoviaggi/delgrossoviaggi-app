import { supabase } from "./supabase.js";
import { renderGT53 } from "./seatmap-gt53.js";
import { renderGT63 } from "./seatmap-gt63.js";

const viaggioSelect = document.getElementById("viaggioSelect");
const seatmapBox = document.getElementById("seatmap");
const postiBox = document.getElementById("postiSelezionati");
const locandineBox = document.getElementById("locandine");

let postiSelezionati = [];

/* =============================
   CARICA VIAGGI
============================= */
async function loadViaggi() {
  const { data } = await supabase.from("viaggi").select("*").order("data");

  viaggioSelect.innerHTML = `<option value="">Seleziona</option>`;

  data.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.dataset.bus = v.bus; // GT53 / GT63
    opt.textContent = v.titolo;
    viaggioSelect.appendChild(opt);
  });
}
loadViaggi();

/* =============================
   CAMBIO VIAGGIO
============================= */
viaggioSelect.addEventListener("change", e => {
  seatmapBox.innerHTML = "";
  postiSelezionati = [];
  postiBox.textContent = "Nessuno";

  const bus = e.target.selectedOptions[0]?.dataset.bus;
  if (bus === "GT53") renderGT53(seatmapBox, onSeatClick);
  if (bus === "GT63") renderGT63(seatmapBox, onSeatClick);
});

/* =============================
   CLICK POSTO
============================= */
function onSeatClick(num, el) {
  if (postiSelezionati.includes(num)) {
    postiSelezionati = postiSelezionati.filter(p => p !== num);
    el.classList.remove("selected");
  } else {
    postiSelezionati.push(num);
    el.classList.add("selected");
  }
  postiBox.textContent = postiSelezionati.join(", ") || "Nessuno";
}

/* =============================
   LOCANDINE
============================= */
async function loadLocandine() {
  const { data } = await supabase.from("locandine").select("*");

  locandineBox.innerHTML = "";
  data.forEach(l => {
    const div = document.createElement("div");
    div.className = "locandina";
    div.innerHTML = `<img src="${l.image_url}"><div class="cap">${l.titolo}</div>`;
    locandineBox.appendChild(div);
  });
}
loadLocandine();
