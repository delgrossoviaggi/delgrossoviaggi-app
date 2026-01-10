import { supabase } from "./supabase.js";
import {
  initSeatmap,
  getSelectedSeats,
  setOccupiedSeats,
  clearSeatmap
} from "./seatmap-core.js";

import { loadOccupiedSeats, createBooking } from "./bookings-store.js";
import * as Posters from "./locandine.js";

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
const seatmapEl = document.getElementById("seatmap");

let currentTrip = null;

// UI helpers
function setMsg(text, ok = true) {
  msgBox.textContent = text || "";
  msgBox.style.color = ok ? "green" : "crimson";
}

function normalizeBus(v) {
  const s = (v || "").toString().toUpperCase().replace(/\s+/g, "");
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  if (s === "GT53" || s === "GT63") return s;
  return "";
}

function fmtDate(d) {
  // se Supabase restituisce YYYY-MM-DD, lasciamo così (pulito)
  return d || "";
}

function updateSelectedBox() {
  const seats = getSelectedSeats();
  selectedBox.textContent = seats.length ? seats.join(", ") : "Nessuno";
}

// carica viaggi (percorsi)
async function loadTrips() {
  setMsg("");

  const { data, error } = await supabase
    .from("percorsi")
    .select("id,viaggio,data,partenza,tipo_bus,attivo")
    .eq("attivo", true)
    .order("data", { ascending: true });

  if (error) {
    console.error("Errore loadTrips:", error);
    tripSelect.innerHTML = `<option value="">Errore caricamento viaggi</option>`;
    return setMsg("Errore caricamento viaggi (vedi console).", false);
  }

  const trips = data || [];
  if (!trips.length) {
    tripSelect.innerHTML = `<option value="">Nessun viaggio disponibile</option>`;
    clearSeatmap();
    return setMsg("Nessun viaggio attivo trovato.", false);
  }

  tripSelect.innerHTML = `<option value="">Seleziona...</option>`;
  trips.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.viaggio} — ${fmtDate(t.data)} — ${t.partenza}`;
    opt.dataset.bus = t.tipo_bus || "";
    opt.dataset.date = t.data || "";
    opt.dataset.dep = t.partenza || "";
    tripSelect.appendChild(opt);
  });

  // carica locandine generiche (se esiste la funzione)
  try {
    if (typeof Posters.loadPosters === "function") {
      await Posters.loadPosters();
    }
  } catch (e) {
    console.warn("Locandine loadPosters warning:", e);
  }
}

// quando scelgo un viaggio
async function onTripChange() {
  setMsg("");

  const id = tripSelect.value;
  if (!id) {
    currentTrip = null;
    dateInput.value = "";
    depInput.value = "";
    busInput.value = "";
    clearSeatmap();
    updateSelectedBox();
    return;
  }

  const opt = tripSelect.options[tripSelect.selectedIndex];
  const bus = normalizeBus(opt.dataset.bus);
  const data = opt.dataset.date || "";
  const dep = opt.dataset.dep || "";

  currentTrip = { id, bus, data, dep };

  dateInput.value = fmtDate(data);
  depInput.value = dep;
  busInput.value = bus;

  // 1) piantina
  if (!bus) {
    clearSeatmap();
    return setMsg("Bus non valido sul viaggio (GT53/GT63). Controlla in Admin.", false);
  }
  initSeatmap(bus);

  // 2) occupati
  try {
    const occ = await loadOccupiedSeats(id);
    setOccupiedSeats(occ || []);
  } catch (e) {
    console.error("Errore loadOccupiedSeats:", e);
    setMsg("Errore caricamento posti occupati (console).", false);
  }

  // 3) locandine del viaggio (se esiste)
  try {
    if (typeof Posters.loadPostersForTrip === "function") {
      await Posters.loadPostersForTrip(id);
    }
  } catch (e) {
    console.warn("Locandine loadPostersForTrip warning:", e);
  }

  updateSelectedBox();
  setMsg("Viaggio caricato ✅");
}

// prenota
async function onBook() {
  setMsg("");

  if (!currentTrip?.id) return setMsg("Seleziona prima un viaggio.", false);

  const nome_cognome = (fullNameInput.value || "").trim();
  const telefono = (phoneInput.value || "").trim();
  const posti = getSelectedSeats();

  if (!nome_cognome) return setMsg("Inserisci Nome e Cognome.", false);
  if (!telefono) return setMsg("Inserisci Telefono.", false);
  if (!posti.length) return setMsg("Seleziona almeno 1 posto.", false);

  // controllo conflitti
  const occ = await loadOccupiedSeats(currentTrip.id);
  const conflict = posti.find((s) => (occ || []).includes(s));
  if (conflict) {
    setOccupiedSeats(occ || []);
    updateSelectedBox();
    return setMsg(`Il posto ${conflict} è già occupato. Seleziona altri posti.`, false);
  }

  const res = await createBooking({
    percorso_id: currentTrip.id,
    nome_cognome,
    telefono,
    posti
  });

  if (!res?.ok) return setMsg(res?.error || "Errore prenotazione.", false);

  // refresh occupati
  const occ2 = await loadOccupiedSeats(currentTrip.id);
  setOccupiedSeats(occ2 || []);

  updateSelectedBox();
  setMsg("Prenotazione confermata ✅");
}

// listeners
tripSelect.addEventListener("change", () => onTripChange().catch(console.error));
bookBtn.addEventListener("click", () => onBook().catch(console.error));

// aggiorna box posti al click sulla seatmap (robusto anche se seatmap-core non emette eventi)
seatmapEl?.addEventListener("click", () => {
  updateSelectedBox();
});

// boot
loadTrips().catch(console.error);
updateSelectedBox();
