import { supabase } from "./supabase.js";
import { initSeatmap, getSelectedSeats, setOccupiedSeats, clearSeatmap } from "./seatmap-core.js";
import { loadOccupiedSeats, createBooking } from "./bookings-store.js";
import { loadPostersForTrip } from "./locandine.js";

const tripSelect = document.getElementById("tripSelect");
const dateInput = document.getElementById("tripDate");
const depInput = document.getElementById("departure");
const busSelect = document.getElementById("busType");

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
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  return "";
}

async function loadTrips() {
  setMsg("");
  const { data, error } = await supabase
    .from("percorsi")
    .select("*")
    .eq("attivo", true)
    .order("data", { ascending: true });

  if (error) {
    console.error(error);
    setMsg("Errore caricamento viaggi (vedi console).", false);
    return;
  }

  tripSelect.innerHTML = `<option value="">Seleziona...</option>`;
  data.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.viaggio} — ${t.data} — ${t.partenza}`;
    opt.dataset.bus = t.tipo_bus;
    opt.dataset.date = t.data;
    opt.dataset.dep = t.partenza;
    tripSelect.appendChild(opt);
  });
}

async function onTripChange() {
  const id = tripSelect.value;
  if (!id) {
    currentTrip = null;
    clearSeatmap();
    selectedBox.textContent = "Nessuno";
    return;
  }

  const opt = tripSelect.options[tripSelect.selectedIndex];
  const tipo_bus = normalizeBus(opt.dataset.bus);
  const data = opt.dataset.date || "";
  const partenza = opt.dataset.dep || "";

  currentTrip = { id, tipo_bus, data, partenza };

  dateInput.value = data;
  depInput.value = partenza;
  busSelect.value = tipo_bus;

  // 1) seatmap
  initSeatmap(tipo_bus);

  // 2) posti occupati
  const occ = await loadOccupiedSeats(id);
  setOccupiedSeats(occ);

  // 3) locandine
  await loadPostersForTrip(id);

  setMsg("Viaggio caricato ✅");
}

tripSelect.addEventListener("change", onTripChange);

bookBtn.addEventListener("click", async () => {
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
    posti: seats
  });

  if (!res.ok) return setMsg(res.error || "Errore prenotazione.", false);

  // refresh posti occupati
  const occ2 = await loadOccupiedSeats(currentTrip.id);
  setOccupiedSeats(occ2);

  selectedBox.textContent = "Nessuno";
  setMsg("Prenotazione confermata ✅");

  // chiamata WhatsApp (Vercel Function)
  try {
    await fetch("/api/notifica-prenotazione", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        percorso_id: currentTrip.id,
        full_name,
        phone,
        seats,
        data: currentTrip.data,
        partenza: currentTrip.partenza
      })
    });
  } catch (e) {
    console.warn("WhatsApp non inviato:", e);
  }
});

loadTrips();
