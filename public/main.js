import { supabase } from "./supabase.js";
import {
  initSeatmap,
  getSelectedSeats,
  setOccupiedSeats,
  clearSeatmap,
} from "./seatmap-core.js";
import { loadOccupiedSeats, createBooking } from "./bookings-store.js";
import { loadPostersForTrip } from "./locandine.js";

// DOM
const tripSelect = document.getElementById("tripSelect");
const dateInput = document.getElementById("tripDate");
const depInput = document.getElementById("departure");
const busInput = document.getElementById("busType");

const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const bookBtn = document.getElementById("bookBtn");
const msgBox = document.getElementById("msgBox");
const selectedBox = document.getElementById("selectedSeats");

let currentTrip = null;

// Utils
function setMsg(text = "", ok = true) {
  if (!msgBox) return;
  msgBox.textContent = text;
  msgBox.style.color = ok ? "green" : "crimson";
}

function normalizeBus(v) {
  const s = (v || "")
    .toString()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  return "";
}

function setReadOnlyFields({ data = "", partenza = "", tipo_bus = "" } = {}) {
  if (dateInput) dateInput.value = data || "";
  if (depInput) depInput.value = partenza || "";
  if (busInput) busInput.value = tipo_bus || "";
}

function clearUI() {
  currentTrip = null;
  setReadOnlyFields({ data: "", partenza: "", tipo_bus: "" });
  if (selectedBox) selectedBox.textContent = "Nessuno";
  clearSeatmap();
  setMsg("");
}

// 1) Load Trips
async function loadTrips() {
  try {
    setMsg("Caricamento viaggi...");
    if (tripSelect) tripSelect.innerHTML = `<option value="">Seleziona...</option>`;

    const { data, error } = await supabase
      .from("percorsi")
      .select("id, viaggio, data, partenza, tipo_bus, attivo")
      .eq("attivo", true)
      .order("data", { ascending: true });

    if (error) throw error;

    const trips = data || [];
    if (!trips.length) {
      setMsg("Nessun viaggio attivo trovato. Verifica tabella 'percorsi'.", false);
      return;
    }

    trips.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.viaggio} — ${t.data} — ${t.partenza}`;
      opt.dataset.bus = t.tipo_bus || "";
      opt.dataset.date = t.data || "";
      opt.dataset.dep = t.partenza || "";
      tripSelect.appendChild(opt);
    });

    setMsg(""); // ok
  } catch (e) {
    console.error("Errore loadTrips:", e);
    setMsg("Errore caricamento viaggi (vedi console).", false);
  }
}

// 2) On Trip Change
async function onTripChange() {
  const id = tripSelect?.value;

  if (!id) {
    clearUI();
    return;
  }

  const opt = tripSelect.options[tripSelect.selectedIndex];
  const tipo_bus = normalizeBus(opt.dataset.bus);
  const data = opt.dataset.date || "";
  const partenza = opt.dataset.dep || "";

  currentTrip = { id, tipo_bus, data, partenza };

  setReadOnlyFields({ data, partenza, tipo_bus });

  try {
    setMsg("Caricamento viaggio...");

    // A) Seatmap
    initSeatmap(tipo_bus);

    // B) Occupati
    const occ = await loadOccupiedSeats(id);
    setOccupiedSeats(occ);

    // C) Locandine collegate al percorso
    await loadPostersForTrip(id);

    setMsg("Viaggio caricato ✅");
  } catch (e) {
    console.error("Errore onTripChange:", e);
    setMsg("Errore caricamento viaggio (vedi console).", false);
  }
}

// 3) Booking
async function onBook() {
  try {
    setMsg("");

    if (!currentTrip?.id) return setMsg("Seleziona prima un viaggio.", false);

    const full_name = (fullNameInput?.value || "").trim();
    const phone = (phoneInput?.value || "").trim();
    const seats = getSelectedSeats();

    if (!full_name) return setMsg("Inserisci Nome e Cognome.", false);
    if (!phone) return setMsg("Inserisci il Telefono.", false);
    if (!seats.length) return setMsg("Seleziona almeno 1 posto.", false);

    setMsg("Verifica posti...");

    // blocco doppia prenotazione
    const occ = await loadOccupiedSeats(currentTrip.id);
    const conflict = seats.find((s) => occ.includes(s));
    if (conflict) {
      setOccupiedSeats(occ);
      return setMsg(`Il posto ${conflict} è già occupato.`, false);
    }

    setMsg("Salvataggio prenotazione...");

    const res = await createBooking({
      percorso_id: currentTrip.id,
      nome_cognome: full_name,
      telefono: phone,
      posti: seats,
    });

    if (!res?.ok) return setMsg(res?.error || "Errore prenotazione.", false);

    // refresh posti occupati
    const occ2 = await loadOccupiedSeats(currentTrip.id);
    setOccupiedSeats(occ2);

    if (selectedBox) selectedBox.textContent = "Nessuno";
    if (fullNameInput) fullNameInput.value = "";
    if (phoneInput) phoneInput.value = "";

    setMsg("Prenotazione confermata ✅");
  } catch (e) {
    console.error("Errore prenotazione:", e);
    setMsg("Errore prenotazione (vedi console).", false);
  }
}

// Wiring
tripSelect?.addEventListener("change", onTripChange);
bookBtn?.addEventListener("click", onBook);

// Init
clearUI();
loadTrips();
