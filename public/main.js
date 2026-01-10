imimport { supabase } from "./supabase.js";
import { initSeatmap, getSelectedSeats, setOccupiedSeats, clearSeatmap } from "./seatmap-core.js";
import { loadOccupiedSeats, createBooking } from "./bookings-store.js";
import { loadPostersForTrip } from "./locandine.js";

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

function setMsg(text, ok = true) {
  msgBox.textContent = text || "";
  msgBox.style.color = ok ? "green" : "crimson";
}

function normalizeBus(v) {
  const s = (v || "").toString().toUpperCase().replace(/\s+/g, "");
  if (s.includes("GT53") || s.includes("53")) return "GT53";
  if (s.includes("GT63") || s.includes("63")) return "GT63";
  return "";
}

async function loadTrips() {
  try {
    setMsg("");

    const { data, error } = await supabase
      .from("percorsi")
      .select("id,viaggio,data,partenza,tipo_bus,attivo")
      .eq("attivo", true)
      .order("data", { ascending: true });

    if (error) throw error;

    const trips = data || [];
    tripSelect.innerHTML = `<option value="">Seleziona...</option>`;

    if (!trips.length) {
      setMsg("Nessun viaggio attivo trovato. Inseriscilo da Admin o da SQL.", false);
      return;
    }

    for (const t of trips) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.viaggio} — ${t.data} — ${t.partenza}`;
      opt.dataset.bus = t.tipo_bus;
      opt.dataset.date = t.data;
      opt.dataset.dep = t.partenza;
      tripSelect.appendChild(opt);
    }

    setMsg("Viaggi caricati ✅");
  } catch (e) {
    console.error("loadTrips error:", e);
    setMsg("Errore caricamento viaggi (vedi console).", false);
  }
}

async function onTripChange() {
  try {
    setMsg("");

    const id = tripSelect.value;
    if (!id) {
      currentTrip = null;
      clearSeatmap();
      selectedBox.textContent = "Nessuno";
      dateInput.value = "";
      depInput.value = "";
      busInput.value = "";
      return;
    }

    const opt = tripSelect.options[tripSelect.selectedIndex];
    const tipo_bus = normalizeBus(opt.dataset.bus);
    const data = opt.dataset.date || "";
    const partenza = opt.dataset.dep || "";

    currentTrip = { id, tipo_bus, data, partenza };

    dateInput.value = data;
    depInput.value = partenza;
    busInput.value = tipo_bus;

    if (!tipo_bus) {
      clearSeatmap();
      return setMsg("Tipo bus non valido sul viaggio (usa GT53 o GT63).", false);
    }

    // 1) Piantina
    initSeatmap(tipo_bus);

    // 2) Occupati
    const occ = await loadOccupiedSeats(id);
    setOccupiedSeats(occ);

    // 3) Locandine del viaggio
    await loadPostersForTrip(id);

    selectedBox.textContent = "Nessuno";
    setMsg("Viaggio caricato ✅");
  } catch (e) {
    console.error("onTripChange error:", e);
    setMsg("Errore caricamento viaggio (vedi console).", false);
  }
}

tripSelect.addEventListener("change", onTripChange);

bookBtn.addEventListener("click", async () => {
  try {
    setMsg("");

    if (!currentTrip?.id) return setMsg("Seleziona prima un viaggio.", false);

    const full_name = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const seats = getSelectedSeats();

    if (!full_name || !phone) return setMsg("Inserisci Nome e Telefono.", false);
    if (!seats.length) return setMsg("Seleziona almeno 1 posto.", false);

    // anti-conflitto
    const occ = await loadOccupiedSeats(currentTrip.id);
    const conflict = seats.find((s) => occ.includes(s));
    if (conflict) {
      setOccupiedSeats(occ);
      return setMsg(`Il posto ${conflict} è già occupato. Seleziona altri posti.`, false);
    }

    const res = await createBooking({
      percorso_id: currentTrip.id,
      nome_cognome: full_name,
      telefono: phone,
      posti: seats
    });

    if (!res.ok) return setMsg(res.error || "Errore prenotazione.", false);

    const occ2 = await loadOccupiedSeats(currentTrip.id);
    setOccupiedSeats(occ2);

    selectedBox.textContent = "Nessuno";
    setMsg("Prenotazione confermata ✅");
  } catch (e) {
    console.error("booking error:", e);
    setMsg("Errore prenotazione (vedi console).", false);
  }
});

loadTrips();
