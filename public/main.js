import { supabase } from "./supabase.js";
import { initSeatmap, setOccupiedSeats, clearSeatmap } from "./seatmap-core.js";
import { loadOccupiedSeats } from "./bookings-store.js";
import { loadPostersForTrip } from "./locandine.js";

const tripSelect = document.getElementById("tripSelect");
const dateInput = document.getElementById("tripDate");
const depInput = document.getElementById("departure");
const busInput = document.getElementById("busType");
const msgBox = document.getElementById("msgBox");

function setMsg(t, ok = true) {
  if (!msgBox) return;
  msgBox.textContent = t || "";
  msgBox.style.color = ok ? "green" : "crimson";
}

function normalizeBus(v) {
  const s = (v || "").toString().toUpperCase().replace(/\s+/g, "");
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  if (s === "GT53" || s === "GT63") return s;
  return "GT53";
}

async function loadTrips() {
  try {
    setMsg("Caricamento viaggi...", true);

    // ✅ test connessione
    const { data, error } = await supabase
      .from("percorsi")
      .select("id, viaggio, data, partenza, tipo_bus, attivo")
      .eq("attivo", true)
      .order("data", { ascending: true });

    if (error) {
      console.error("SUPABASE loadTrips error:", error);
      setMsg(`Errore viaggi: ${error.message}`, false);
      if (tripSelect) tripSelect.innerHTML = `<option value="">(errore)</option>`;
      return;
    }

    if (!tripSelect) return;

    tripSelect.innerHTML = `<option value="">Seleziona...</option>`;

    if (!data || !data.length) {
      setMsg("Nessun viaggio attivo trovato (controlla 'attivo' = true).", false);
      return;
    }

    data.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.viaggio} — ${t.data} — ${t.partenza}`;
      opt.dataset.bus = t.tipo_bus || "GT53";
      opt.dataset.date = t.data || "";
      opt.dataset.dep = t.partenza || "";
      tripSelect.appendChild(opt);
    });

    setMsg("Viaggi caricati ✅");
  } catch (e) {
    console.error("loadTrips crash:", e);
    setMsg("Errore JS: main.js si è bloccato (vedi console).", false);
  }
}

async function onTripChange() {
  try {
    const id = tripSelect?.value || "";
    if (!id) {
      clearSeatmap();
      if (dateInput) dateInput.value = "";
      if (depInput) depInput.value = "";
      if (busInput) busInput.value = "";
      return;
    }

    const opt = tripSelect.options[tripSelect.selectedIndex];
    const tipo_bus = normalizeBus(opt.dataset.bus);
    const data = opt.dataset.date || "";
    const partenza = opt.dataset.dep || "";

    if (dateInput) dateInput.value = data;
    if (depInput) depInput.value = partenza;
    if (busInput) busInput.value = tipo_bus;

    // ✅ seatmap (se fallisce non blocca i viaggi)
    try {
      initSeatmap(tipo_bus);
      const occ = await loadOccupiedSeats(id);
      setOccupiedSeats(occ);
    } catch (e) {
      console.warn("Seatmap/occupied error:", e);
    }

    // ✅ locandine (se fallisce non blocca)
    try {
      await loadPostersForTrip(id);
    } catch (e) {
      console.warn("Locandine error:", e);
    }
  } catch (e) {
    console.error("onTripChange crash:", e);
    setMsg("Errore JS su cambio viaggio (vedi console).", false);
  }
}

tripSelect?.addEventListener("change", () => onTripChange());

loadTrips();
