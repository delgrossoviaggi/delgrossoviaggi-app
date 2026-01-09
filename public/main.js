import { supabase } from "./supabase.js";
import { loadPosters } from "./locandine.js";
import { addBooking, getOccupiedSeats } from "./bookings-store.js";
import { renderSeatMapGT53 } from "./seatmap-gt53.js";
import { renderSeatMapGT63 } from "./seatmap-gt63.js";

const seatMapEl = document.getElementById("seatMap");
const seatErr = document.getElementById("seatErr");
const selectedSeatsEl = document.getElementById("selectedSeats");
const msgEl = document.getElementById("msg");
const locandineMsg = document.getElementById("locandineMsg");

const tripSelect = document.getElementById("tripSelect");
const travelDate = document.getElementById("travelDate");
const departure = document.getElementById("departure");
const busType = document.getElementById("busType");

const fullName = document.getElementById("fullName");
const phone = document.getElementById("phone");
const bookBtn = document.getElementById("bookBtn");

function showSeatErr(e) {
  if (!seatErr) return;
  seatErr.textContent = "ERRORE: " + (e?.message || e);
  seatErr.style.color = "crimson";
  console.error(e);
}
window.addEventListener("error", (e) => showSeatErr(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => showSeatErr(e.reason));

function setMsg(text, ok = false) {
  msgEl.textContent = text || "";
  msgEl.style.color = ok ? "green" : "crimson";
}

const selected = new Set();
let occupied = new Set();

function updateSelected() {
  const arr = [...selected].sort((a, b) => a - b);
  selectedSeatsEl.textContent = arr.length ? arr.join(", ") : "Nessuno";
}

function toggleSeat(n) {
  if (occupied.has(n)) return;
  if (selected.has(n)) selected.delete(n);
  else selected.add(n);
  updateSelected();
  renderSeat();
}

function renderSeat() {
  if (seatErr) seatErr.textContent = "";
  const options = { selected, occupied, onToggleSeat: toggleSeat };
  if ((busType.value || "").includes("63")) renderSeatMapGT63(seatMapEl, options);
  else renderSeatMapGT53(seatMapEl, options);
}

async function loadRoutes() {
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;

  tripSelect.innerHTML = `<option value="">Seleziona…</option>`;
  (data || []).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.name;
    opt.textContent = r.name;
    tripSelect.appendChild(opt);
  });
}

async function refreshOccupied() {
  if (!tripSelect.value) {
    occupied = new Set();
    renderSeat();
    return;
  }
  occupied = await getOccupiedSeats({
    tripKey: tripSelect.value,
    travelDate: travelDate.value || null,
    busType: busType.value || null,
  });

  for (const s of [...selected]) if (occupied.has(s)) selected.delete(s);
  updateSelected();
  renderSeat();
}

bookBtn.addEventListener("click", async () => {
  setMsg("");
  const trip = tripSelect.value;
  const name = (fullName.value || "").trim();
  const tel = (phone.value || "").trim();
  const seats = [...selected].sort((a, b) => a - b);

  if (!trip) return setMsg("Seleziona un viaggio.");
  if (!name) return setMsg("Inserisci Nome e Cognome.");
  if (!tel) return setMsg("Inserisci telefono.");
  if (!seats.length) return setMsg("Seleziona almeno 1 posto.");

  await refreshOccupied();
  const clash = seats.find(s => occupied.has(s));
  if (clash) return setMsg(`Il posto ${clash} è già occupato.`);

  try {
    await addBooking({
      trip_key: trip,
      travel_date: travelDate.value || null,
      departure: (departure.value || "").trim() || null,
      bus_type: busType.value || null,
      full_name: name,
      phone: tel,
      seats,
    });
    setMsg("Prenotazione salvata ✅", true);
    selected.clear();
    updateSelected();
    await refreshOccupied();
  } catch (e) {
    setMsg("Errore salvataggio (vedi console).");
    console.error(e);
  }
});

tripSelect.addEventListener("change", async () => {
  selected.clear(); updateSelected(); await refreshOccupied();
});
travelDate.addEventListener("change", refreshOccupied);
busType.addEventListener("change", async () => {
  selected.clear(); updateSelected(); await refreshOccupied();
});

window.addEventListener("posterChosen", async (e) => {
  const p = e.detail;
  if (p?.trip_key) {
    tripSelect.value = p.trip_key;
    selected.clear(); updateSelected();
    await refreshOccupied();
  }
});

async function boot() {
  renderSeat();
  updateSelected();

  await loadRoutes();

  try {
    await loadPosters();
    locandineMsg.textContent = "";
  } catch (e) {
    locandineMsg.textContent = "Errore locandine (console).";
    locandineMsg.style.color = "crimson";
    console.error(e);
  }

  await refreshOccupied();
}
boot().catch(showSeatErr);
