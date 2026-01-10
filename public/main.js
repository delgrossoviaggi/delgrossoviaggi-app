import { supabase } from "./supabase.js";
import { initSeatmap, getSelectedSeats, setOccupiedSeats, clearSeatmap } from "./seatmap-core.js";
import { loadOccupiedSeats, createBooking } from "./bookings-store.js";
import { loadPostersForTrip } from "./locandine.js";

const tripSelect = document.getElementById("tripSelect");
const selectedBox = document.getElementById("selectedSeats");
const msgBox = document.getElementById("msgBox");

let currentTrip = null;

window.addEventListener("seatsChanged", e => {
  selectedBox.textContent = e.detail.length ? e.detail.join(", ") : "Nessuno";
});

async function loadTrips() {
  const { data } = await supabase
    .from("percorsi")
    .select("*")
    .eq("attivo", true)
    .order("data");

  tripSelect.innerHTML = `<option value="">Seleziona...</option>`;
  data.forEach(t => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = `${t.viaggio} — ${t.data}`;
    o.dataset.bus = t.tipo_bus;
    tripSelect.appendChild(o);
  });
}

tripSelect.addEventListener("change", async () => {
  const id = tripSelect.value;
  if (!id) return clearSeatmap();

  const opt = tripSelect.selectedOptions[0];
  currentTrip = { id, bus: opt.dataset.bus };

  initSeatmap(currentTrip.bus);
  setOccupiedSeats(await loadOccupiedSeats(id));
  loadPostersForTrip(id);
});

document.getElementById("bookBtn").addEventListener("click", async () => {
  const nome = document.getElementById("fullName").value.trim();
  const tel = document.getElementById("phone").value.trim();
  const posti = getSelectedSeats();

  if (!currentTrip || !nome || !tel || !posti.length) {
    msgBox.textContent = "Compila tutto e seleziona i posti.";
    msgBox.style.color = "crimson";
    return;
  }

  const res = await createBooking({
    percorso_id: currentTrip.id,
    nome_cognome: nome,
    telefono: tel,
    posti
  });

  if (!res.ok) {
    msgBox.textContent = res.error;
    msgBox.style.color = "crimson";
    return;
  }

  setOccupiedSeats(await loadOccupiedSeats(currentTrip.id));
  msgBox.textContent = "Prenotazione confermata ✅";
  msgBox.style.color = "green";
});

loadTrips();
