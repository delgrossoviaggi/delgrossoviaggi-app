import { supabase } from "./supabase.js";
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
  if (!msgBox) return;
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

    // ✅ tabella corretta: percorsi
    const { data, error } = await supabase
      .from("percorsi")
      .select("id,viaggio,data,partenza,tipo_bus,attivo")
      .eq("attivo", true)
      .order("data", { ascending: true });

    if (error) throw error;

    tripSelect.innerHTML = `<option value="">Seleziona...</option>`;

    if (!data || !data.length) {
      setMsg("Nessun viaggio attivo in Supabase. Inseriscilo da Admin o Table Editor.", false);
      clearSeatmap();
      if (selectedBox) selectedBox.textContent = "Nessuno";
      return;
    }

    for (const t of data) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.viaggio} — ${t.data} — ${t.partenza}`;
      opt.dataset.bus = t.tipo_bus;     // GT53 / GT63
      opt.dataset.date = t.data;        // YYYY-MM-DD
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
      if (selectedBox) selectedBox.textContent = "Nessuno";
      return;
    }

    const opt = tripSelect.options[tripSelect.selectedIndex];
    const tipo_bus = normalizeBus(opt.dataset.bus);
    const data = opt.dataset.date || "";
    const partenza = opt.dataset.dep || "";

    if (!tipo_bus) {
      clearSeatmap();
      return setMsg("Tipo bus non valido (deve essere GT53 o GT63).", false);
    }

    currentTrip = { id, tipo_bus, data, partenza };

    dateInput.value = data;
    depInput.value = partenza;
    busInput.value = tipo_bus;

    // 1) seatmap
    initSeatmap(tipo_bus);

    // 2) posti occupati
    const occ = await loadOccupiedSeats(id);
    setOccupiedSeats(occ);

    // 3) locandine
    await loadPostersForTrip(id);

    setMsg("Viaggio caricato ✅");
  } catch (e) {
    console.error("onTripChange error:", e);
    setMsg("Errore caricamento viaggio (vedi console).", false);
  }
}

tripSelect?.addEventListener("change", onTripChange);

bookBtn?.addEventListener("click", async () => {
  try {
    setMsg("");

    if (!currentTrip?.id) return setMsg("Seleziona prima un viaggio.", false);

    const full_name = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const seats = getSelectedSeats();

    if (!full_name || !phone) return setMsg("Inserisci Nome e Telefono.", false);
    if (!seats.length) return setMsg("Seleziona almeno 1 posto.", false);

    // blocco doppia prenotazione
    const occ = await loadOccupiedSeats(currentTrip.id);
    const conflict = seats.find(s => occ.includes(s));
    if (conflict) {
      setOccupiedSeats(occ);
      return setMsg(`Il posto ${conflict} è già occupato. Seleziona altri posti.`, false);
    }

    const res = await createBooking({
      percorso_id: currentTrip.id,
      nome_cognome: full_name,
      telefono: phone,
      posti: seats,
      partenza: currentTrip.partenza
    });

    if (!res.ok) return setMsg(res.error || "Errore prenotazione.", false);

    // refresh posti occupati
    const occ2 = await loadOccupiedSeats(currentTrip.id);
    setOccupiedSeats(occ2);

    if (selectedBox) selectedBox.textContent = "Nessuno";
    setMsg("Prenotazione confermata ✅");
  } catch (e) {
    console.error("booking error:", e);
    setMsg("Errore prenotazione (vedi console).", false);
  }
});

loadTrips();
