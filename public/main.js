import { supabase } from "./supabase.js";
import { initSeatmap, getSelectedSeats, setOccupiedSeats, clearSeatmap } from "./seatmap-core.js";
import { loadOccupiedSeats, createBooking } from "./bookings-store.js";
import { loadPostersForTrip } from "./locandine.js";

const tripSelect = document.getElementById("tripSelect");
const dateInput = document.getElementById("tripDate");
const depInput  = document.getElementById("departure");
const busInput  = document.getElementById("busType");

const fullNameInput = document.getElementById("fullName");
const phoneInput    = document.getElementById("phone");
const bookBtn       = document.getElementById("bookBtn");

const msgBox     = document.getElementById("msgBox");
const selectedEl = document.getElementById("selectedSeats");

// Modal locandina
const posterModal    = document.getElementById("posterModal");
const posterClose    = document.getElementById("posterClose");
const posterImg      = document.getElementById("posterImg");
const posterTitle    = document.getElementById("posterTitle");
const posterInfo     = document.getElementById("posterInfo");
const posterDownload = document.getElementById("posterDownload");

let currentTrip = null;

function setMsg(text, ok = true) {
  if (!msgBox) return;
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

async function loadTrips() {
  setMsg("");

  const { data, error } = await supabase
    .from("percorsi")
    .select("id, viaggio, data, partenza, tipo_bus, attivo")
    .eq("attivo", true)
    .order("data", { ascending: true });

  if (error) {
    console.error("loadTrips error:", error);
    setMsg("Errore caricamento viaggi (vedi console).", false);
    if (tripSelect) tripSelect.innerHTML = `<option value="">Seleziona...</option>`;
    return;
  }

  if (!tripSelect) return;
  tripSelect.innerHTML = `<option value="">Seleziona...</option>`;

  (data || []).forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.viaggio} — ${t.data} — ${t.partenza}`;
    opt.dataset.bus  = t.tipo_bus || "";
    opt.dataset.date = t.data || "";
    opt.dataset.dep  = t.partenza || "";
    tripSelect.appendChild(opt);
  });
}

async function onTripChange() {
  const id = tripSelect?.value;

  if (!id) {
    currentTrip = null;
    clearSeatmap();
    if (selectedEl) selectedEl.textContent = "Nessuno";
    if (dateInput) dateInput.value = "";
    if (depInput) depInput.value = "";
    if (busInput) busInput.value = "";
    setMsg("");
    return;
  }

  const opt = tripSelect.options[tripSelect.selectedIndex];
  const tipo_bus = normalizeBus(opt.dataset.bus);
  const data = opt.dataset.date || "";
  const partenza = opt.dataset.dep || "";

  currentTrip = { id, tipo_bus, data, partenza };

  if (dateInput) dateInput.value = data;
  if (depInput) depInput.value = partenza;
  if (busInput) busInput.value = tipo_bus;

  // 1) piantina
  await initSeatmap(tipo_bus);

  // 2) blocca posti già prenotati
  const occ = await loadOccupiedSeats(id);
  setOccupiedSeats(occ);

  // 3) locandine del viaggio (cliccabili)
  await loadPostersForTrip(id);

  setMsg("Viaggio caricato ✅");
}

tripSelect?.addEventListener("change", () => onTripChange().catch(console.error));

bookBtn?.addEventListener("click", async () => {
  setMsg("");

  if (!currentTrip?.id) return setMsg("Seleziona prima un viaggio.", false);

  const nome_cognome = (fullNameInput?.value || "").trim();
  const telefono     = (phoneInput?.value || "").trim();
  const posti        = getSelectedSeats();

  if (!nome_cognome || !telefono) return setMsg("Inserisci Nome e Telefono.", false);
  if (!posti.length) return setMsg("Seleziona almeno 1 posto.", false);

  // anti-conflitto
  const occ = await loadOccupiedSeats(currentTrip.id);
  const conflict = posti.find((s) => occ.includes(s));
  if (conflict) {
    setOccupiedSeats(occ);
    return setMsg(`Il posto ${conflict} è già occupato. Seleziona altri posti.`, false);
  }

  const res = await createBooking({
    percorso_id: currentTrip.id,
    nome_cognome,
    telefono,
    posti
  });

  if (!res.ok) return setMsg(res.error || "Errore prenotazione.", false);

  // refresh posti occupati
  const occ2 = await loadOccupiedSeats(currentTrip.id);
  setOccupiedSeats(occ2);

  if (selectedEl) selectedEl.textContent = "Nessuno";
  setMsg("Prenotazione confermata ✅");
});

// Modal locandine
function openPoster(p) {
  if (!posterModal) return;
  posterImg.src = p.image_url;
  posterTitle.textContent = p.titolo || "Locandina";
  posterInfo.textContent = "";
  posterDownload.onclick = () => window.open(p.image_url, "_blank");
  posterModal.classList.remove("hidden");
  posterModal.setAttribute("aria-hidden", "false");
}
function closePoster() {
  if (!posterModal) return;
  posterModal.classList.add("hidden");
  posterModal.setAttribute("aria-hidden", "true");
}

window.addEventListener("posterOpen", (e) => openPoster(e.detail));
posterClose?.addEventListener("click", closePoster);
posterModal?.addEventListener("click", (e) => {
  if (e.target === posterModal) closePoster();
});

loadTrips().catch(console.error);
