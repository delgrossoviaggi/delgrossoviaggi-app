import { supabase } from "./supabase.js";
import {
  initSeatmap,
  getSelectedSeats,
  setOccupiedSeats,
  clearSeatmap,
} from "./seatmap-core.js";

/**
 * =========================
 * CONFIG (se cambi nomi in Supabase, modifichi solo qui)
 * =========================
 */
const CFG = {
  TABLE_TRIPS: "percorsi",
  TABLE_POSTERS: "manifesti",
  TABLE_BOOKINGS: "prenotazioni",

  COL_TRIP: {
    id: "id",
    name: "viaggio",
    date: "data",
    departure: "partenza",
    bus: "tipo_bus",
    active: "attivo",
  },

  COL_POSTER: {
    id: "id",
    tripId: "percorso_id",
    title: "titolo",
    imageUrl: "url_immagine",
    active: "attivo",
  },

  COL_BOOK: {
    id: "id",
    tripId: "percorso_id",
    fullName: "nome_cognome",
    phone: "telefono",
    seats: "posti_a_sedere", // jsonb array
    createdAt: "creato_a",
  },
};

/**
 * =========================
 * DOM
 * =========================
 */
const tripSelect = document.getElementById("tripSelect");
const dateInput = document.getElementById("tripDate");
const depInput = document.getElementById("departure");
const busInput = document.getElementById("busType"); // readonly input

const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const bookBtn = document.getElementById("bookBtn");
const msgBox = document.getElementById("msgBox");
const selectedBox = document.getElementById("selectedSeats");

const locGrid = document.getElementById("locandineGrid");
const locMsg = document.getElementById("locandineMsg");

let currentTrip = null;

/**
 * =========================
 * HELPERS
 * =========================
 */
function setMsg(text, ok = true) {
  if (!msgBox) return;
  msgBox.textContent = text || "";
  msgBox.style.color = ok ? "green" : "crimson";
}

function normalizeBus(v) {
  const s = String(v || "").toUpperCase().replace(/\s+/g, "");
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  if (s === "GT53" || s === "GT63") return s;
  return ""; // se non riconosciuto
}

function setReadonlyField(el, val) {
  if (!el) return;
  el.value = val || "";
}

function safeText(v) {
  return String(v || "").replace(/[<>]/g, "");
}

/**
 * =========================
 * SUPABASE QUERIES
 * =========================
 */
async function fetchTrips() {
  const c = CFG.COL_TRIP;
  const { data, error } = await supabase
    .from(CFG.TABLE_TRIPS)
    .select(`${c.id},${c.name},${c.date},${c.departure},${c.bus},${c.active}`)
    .eq(c.active, true)
    .order(c.date, { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchOccupiedSeats(tripId) {
  const b = CFG.COL_BOOK;

  const { data, error } = await supabase
    .from(CFG.TABLE_BOOKINGS)
    .select(`${b.seats}`)
    .eq(b.tripId, tripId);

  if (error) throw error;

  const occ = [];
  (data || []).forEach((row) => {
    const seats = row?.[b.seats];
    if (Array.isArray(seats)) occ.push(...seats);
    else if (typeof seats === "string") {
      try {
        const parsed = JSON.parse(seats);
        if (Array.isArray(parsed)) occ.push(...parsed);
      } catch {}
    }
  });

  // normalizza in stringhe
  return occ.map((x) => String(x));
}

async function createBooking(tripId, full_name, phone, seats) {
  const b = CFG.COL_BOOK;

  const payload = {
    [b.tripId]: tripId,
    [b.fullName]: full_name,
    [b.phone]: phone,
    [b.seats]: seats, // array -> jsonb
  };

  const { error } = await supabase.from(CFG.TABLE_BOOKINGS).insert(payload);
  if (error) throw error;
}

async function fetchPosters(tripId) {
  const p = CFG.COL_POSTER;

  const { data, error } = await supabase
    .from(CFG.TABLE_POSTERS)
    .select(`${p.id},${p.tripId},${p.title},${p.imageUrl},${p.active}`)
    .eq(p.active, true)
    .eq(p.tripId, tripId)
    .order("creato_a", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * =========================
 * UI: TRIPS
 * =========================
 */
async function loadTripsIntoSelect() {
  setMsg("");

  try {
    const trips = await fetchTrips();

    // reset select
    tripSelect.innerHTML = `<option value="">Seleziona...</option>`;

    if (!trips.length) {
      setMsg("Nessun viaggio attivo trovato in Supabase.", false);
      return;
    }

    const c = CFG.COL_TRIP;

    trips.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t[c.id];

      // testo user-friendly
      opt.textContent = `${t[c.name]} — ${t[c.date]} — ${t[c.departure]}`;

      // dataset per riempire i campi
      opt.dataset.bus = t[c.bus] || "";
      opt.dataset.date = t[c.date] || "";
      opt.dataset.dep = t[c.departure] || "";

      tripSelect.appendChild(opt);
    });

    setMsg("Viaggi caricati ✅");
  } catch (e) {
    console.error("Errore loadTrips:", e);
    setMsg("Errore caricamento viaggi (vedi console).", false);
  }
}

/**
 * =========================
 * UI: LOCANDINE
 * =========================
 */
async function renderPosters(tripId) {
  if (!locGrid) return;

  locGrid.innerHTML = "";
  if (locMsg) locMsg.textContent = "";

  try {
    const posters = await fetchPosters(tripId);
    if (!posters.length) {
      locGrid.innerHTML = `<div class="msg">Nessuna locandina per questo viaggio (caricala da Admin).</div>`;
      return;
    }

    const p = CFG.COL_POSTER;

    posters.forEach((x) => {
      const card = document.createElement("div");
      card.className = "locandina";
      card.innerHTML = `
        <img src="${safeText(x[p.imageUrl])}" alt="${safeText(x[p.title] || "Locandina")}">
        <div class="cap">${safeText(x[p.title] || "Locandina")}</div>
      `;
      locGrid.appendChild(card);
    });
  } catch (e) {
    console.error("Errore locandine:", e);
    locGrid.innerHTML = `<div class="msg">Errore caricamento locandine (vedi console).</div>`;
  }
}

/**
 * =========================
 * ON CHANGE TRIP
 * =========================
 */
async function onTripChange() {
  setMsg("");

  const id = tripSelect.value;
  if (!id) {
    currentTrip = null;
    clearSeatmap();
    if (selectedBox) selectedBox.textContent = "Nessuno";
    setReadonlyField(dateInput, "");
    setReadonlyField(depInput, "");
    setReadonlyField(busInput, "");
    if (locGrid) locGrid.innerHTML = "";
    return;
  }

  const opt = tripSelect.options[tripSelect.selectedIndex];

  const tipo_bus = normalizeBus(opt.dataset.bus);
  const data = opt.dataset.date || "";
  const partenza = opt.dataset.dep || "";

  currentTrip = { id, tipo_bus, data, partenza };

  setReadonlyField(dateInput, data);
  setReadonlyField(depInput, partenza);
  setReadonlyField(busInput, tipo_bus);

  if (!tipo_bus) {
    clearSeatmap();
    setMsg("Errore: tipo_bus non valido (usa GT53 o GT63).", false);
    return;
  }

  try {
    // 1) seatmap base
    await initSeatmap(tipo_bus);

    // 2) posti occupati
    const occ = await fetchOccupiedSeats(id);
    setOccupiedSeats(occ);

    // 3) locandine
    await renderPosters(id);

    setMsg("Viaggio caricato ✅");
  } catch (e) {
    console.error("Errore onTripChange:", e);
    setMsg("Errore caricamento viaggio (vedi console).", false);
  }
}

tripSelect.addEventListener("change", onTripChange);

/**
 * =========================
 * SEAT SELECTION (evento dal core)
 * =========================
 */
window.addEventListener("seatSelectionChanged", (e) => {
  const seats = e.detail?.seats || [];
  if (selectedBox) selectedBox.textContent = seats.length ? seats.join(", ") : "Nessuno";
});

/**
 * =========================
 * BOOKING
 * =========================
 */
bookBtn?.addEventListener("click", async () => {
  setMsg("");

  if (!currentTrip?.id) return setMsg("Seleziona prima un viaggio.", false);

  const full_name = (fullNameInput?.value || "").trim();
  const phone = (phoneInput?.value || "").trim();
  const seats = getSelectedSeats(); // già ordinati

  if (!full_name || !phone) return setMsg("Inserisci Nome e Telefono.", false);
  if (!seats.length) return setMsg("Seleziona almeno 1 posto.", false);

  try {
    // controllo conflitto
    const occ = await fetchOccupiedSeats(currentTrip.id);
    const conflict = seats.find((s) => occ.includes(String(s)));
    if (conflict) {
      setOccupiedSeats(occ);
      return setMsg(`Il posto ${conflict} è già occupato. Seleziona altri posti.`, false);
    }

    // inserisci prenotazione
    await createBooking(currentTrip.id, full_name, phone, seats);

    // refresh occupati
    const occ2 = await fetchOccupiedSeats(currentTrip.id);
    setOccupiedSeats(occ2);

    setMsg("Prenotazione confermata ✅");
  } catch (e) {
    console.error("Errore booking:", e);
    setMsg("Errore prenotazione (vedi console).", false);
  }
});

/**
 * =========================
 * BOOT
 * =========================
 */
loadTripsIntoSelect();
