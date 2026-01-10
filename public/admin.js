import { supabase } from "./supabase.js";

const PASSWORD = "del2025bus";

// DOM
const authBox = document.getElementById("authBox");
const panel = document.getElementById("panel");
const adminPass = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");
const adminMsg = document.getElementById("adminMsg");
const logoutBtn = document.getElementById("logoutBtn");

// admin panel dom
const tripId = document.getElementById("tripId");
const tripName = document.getElementById("tripName");
const tripDate = document.getElementById("tripDate");
const tripDeparture = document.getElementById("tripDeparture");
const tripBus = document.getElementById("tripBus");
const tripActive = document.getElementById("tripActive");
const saveTripBtn = document.getElementById("saveTripBtn");
const resetTripBtn = document.getElementById("resetTripBtn");
const tripMsg = document.getElementById("tripMsg");
const tripsList = document.getElementById("tripsList");

const posterTrip = document.getElementById("posterTrip");
const posterTitle = document.getElementById("posterTitle");
const posterFile = document.getElementById("posterFile");
const uploadPosterBtn = document.getElementById("uploadPosterBtn");
const posterMsg = document.getElementById("posterMsg");
const postersList = document.getElementById("postersList");

const bookingsTrip = document.getElementById("bookingsTrip");
const bookingsMsg = document.getElementById("bookingsMsg");
const bookingsList = document.getElementById("bookingsList");
const participantsList = document.getElementById("participantsList");

const exportXlsxBtn = document.getElementById("exportXlsxBtn");
const copyPhonesBtn = document.getElementById("copyPhonesBtn");
const copyPeopleBtn = document.getElementById("copyPeopleBtn");

let currentBookings = [];
let currentTripLabel = "";

// helpers
function msg(el, text, ok = true) {
  if (!el) return;
  el.textContent = text || "";
  el.style.color = ok ? "green" : "crimson";
}

function showLogin() {
  if (authBox) authBox.style.display = "block";
  if (panel) panel.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";
}
function showPanel() {
  if (authBox) authBox.style.display = "none";
  if (panel) panel.style.display = "grid";
  if (logoutBtn) logoutBtn.style.display = "inline-flex";
}

function isLogged() {
  return sessionStorage.getItem("dg_admin_ok") === "1";
}
function setLogged(v) {
  sessionStorage.setItem("dg_admin_ok", v ? "1" : "0");
}

function safeFileName(name) {
  return (name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

async function loadTripsAll() {
  const { data, error } = await supabase
    .from("percorsi")
    .select("id, viaggio, data, partenza, tipo_bus, attivo")
    .order("data", { ascending: true });

  if (error) throw error;
  return data || [];
}

function fillTripSelect(selectEl, trips, placeholder = "Seleziona...") {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  trips.forEach((t) => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = `${t.viaggio} — ${t.data || ""}`;
    selectEl.appendChild(o);
  });
}

function resetTripForm() {
  if (tripId) tripId.value = "";
  if (tripName) tripName.value = "";
  if (tripDate) tripDate.value = "";
  if (tripDeparture) tripDeparture.value = "";
  if (tripBus) tripBus.value = "GT53";
  if (tripActive) tripActive.value = "true";
  msg(tripMsg, "");
}

async function saveTrip() {
  const payload = {
    viaggio: (tripName?.value || "").trim(),
    data: tripDate?.value || null,
    partenza: (tripDeparture?.value || "").trim(),
    tipo_bus: tripBus?.value || "GT53",
    attivo: (tripActive?.value || "true") === "true",
  };

  if (!payload.viaggio || !payload.data || !payload.partenza) {
    return msg(tripMsg, "Compila: Nome viaggio, Data, Partenze.", false);
  }

  const id = (tripId?.value || "").trim();
  const res = id
    ? await supabase.from("percorsi").update(payload).eq("id", id)
    : await supabase.from("percorsi").insert(payload);

  if (res.error) {
    console.error(res.error);
    return msg(tripMsg, "Errore salvataggio (console).", false);
  }

  msg(tripMsg, "Viaggio salvato ✅", true);
  resetTripForm();
  await refreshAll();
}

async function uploadPoster() {
  const percorso_id = posterTrip?.value || "";
  const titolo = (posterTitle?.value || "").trim() || "Locandina";
  const file = posterFile?.files?.[0];

  if (!percorso_id) return msg(posterMsg, "Seleziona un viaggio.", false);
  if (!file) return msg(posterMsg, "Scegli un file immagine.", false);

  msg(posterMsg, "Caricamento...", true);

  const path = `${percorso_id}/${Date.now()}-${safeFileName(file.name)}`;

  const up = await supabase.storage.from("locandine").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (up.error) {
    console.error(up.error);
    return msg(posterMsg, "Errore upload Storage (console).", false);
  }

  const pub = supabase.storage.from("locandine").getPublicUrl(path);
  const image_url = pub?.data?.publicUrl;

  const ins = await supabase.from("manifesti").insert({
    percorso_id,
    titolo,
    image_url,
    attivo: true,
  });

  if (ins.error) {
    console.error(ins.error);
    return msg(posterMsg, "Errore DB manifesti (console).", false);
  }

  msg(posterMsg, "Locandina caricata ✅", true);
  if (posterTitle) posterTitle.value = "";
  if (posterFile) posterFile.value = "";
  await refreshAll();
}

async function loadBookingsForTrip(percorso_id) {
  const { data, error } = await supabase
    .from("prenotazioni")
    .select("nome_cognome, telefono, posti, creato_a")
    .eq("percorso_id", percorso_id)
    .order("creato_a", { ascending: false });

  if (error) throw error;
  return data || [];
}

function renderBookings(bookings) {
  currentBookings = bookings || [];

  if (bookingsList) {
    if (!currentBookings.length) {
      bookingsList.innerHTML = `<div class="msg">Nessuna prenotazione.</div>`;
    } else {
      bookingsList.innerHTML = currentBookings.map(b => {
        const posti = Array.isArray(b.posti) ? b.posti : [];
        return `
          <div class="selected-box" style="margin-top:10px">
            <div style="font-weight:900">${b.nome_cognome || "-"}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">
              Tel: ${b.telefono || "-"}<br>
              Posti (${posti.length}): <b>${posti.join(", ")}</b>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  if (participantsList) {
    const totalSeats = currentBookings.reduce((sum, b) => sum + ((Array.isArray(b.posti) ? b.posti.length : 0)), 0);
    participantsList.innerHTML = `
      <div class="msg" style="margin-bottom:10px">
        Partecipanti: <b>${currentBookings.length}</b> — Posti totali: <b>${totalSeats}</b>
      </div>
    `;
  }
}

async function onBookingsTripChange() {
  const id = bookingsTrip?.value || "";
  if (!id) return;

  currentTripLabel = bookingsTrip?.options?.[bookingsTrip.selectedIndex]?.textContent || "";

  msg(bookingsMsg, "Caricamento...", true);
  try {
    const bookings = await loadBookingsForTrip(id);
    renderBookings(bookings);
    msg(bookingsMsg, "OK ✅", true);
  } catch (e) {
    console.error(e);
    msg(bookingsMsg, "Errore prenotazioni (console).", false);
  }
}

async function refreshAll() {
  const trips = await loadTripsAll();

  // lista viaggi in admin
  if (tripsList) {
    tripsList.innerHTML = trips.map(t => `
      <div class="selected-box" style="margin-top:10px">
        <div style="font-weight:900">${t.viaggio} — ${t.data || ""}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          Partenze: ${t.partenza || "-"}<br>
          Bus: <b>${t.tipo_bus || "-"}</b> — Attivo: <b>${t.attivo ? "TRUE" : "FALSE"}</b>
        </div>
      </div>
    `).join("");
  }

  fillTripSelect(posterTrip, trips, "Seleziona viaggio...");
  fillTripSelect(bookingsTrip, trips, "Seleziona viaggio...");
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

function exportXlsx() {
  if (!window.XLSX) return alert("XLSX non caricato.");
  if (!currentBookings.length) return alert("Nessuna prenotazione.");

  const rows = currentBookings.map(b => ({
    Partecipante: b.nome_cognome || "",
    Telefono: b.telefono || "",
    Posti: (Array.isArray(b.posti) ? b.posti.join(", ") : ""),
    NumeroPosti: (Array.isArray(b.posti) ? b.posti.length : 0),
    CreatoIl: b.creato_a ? String(b.creato_a).slice(0, 19).replace("T", " ") : "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Partecipanti");
  XLSX.writeFile(wb, `partecipanti_${(currentTripLabel || "viaggio").replace(/[^\w-]+/g,"_")}.xlsx`);
}

// BOOT ADMIN (solo dopo login)
async function bootAdmin() {
  await refreshAll();

  saveTripBtn?.addEventListener("click", () => saveTrip().catch(console.error));
  resetTripBtn?.addEventListener("click", resetTripForm);
  uploadPosterBtn?.addEventListener("click", () => uploadPoster().catch(console.error));

  bookingsTrip?.addEventListener("change", () => onBookingsTripChange().catch(console.error));

  exportXlsxBtn?.addEventListener("click", exportXlsx);

  copyPhonesBtn?.addEventListener("click", async () => {
    const phones = currentBookings.map(x => x.telefono).filter(Boolean);
    if (!phones.length) return alert("Nessun telefono.");
    await copyToClipboard(phones.join("\n"));
    alert("Telefoni copiati ✅");
  });

  copyPeopleBtn?.addEventListener("click", async () => {
    const lines = currentBookings.map(x => `${x.nome_cognome || ""} — ${x.telefono || ""}`).filter(s => s.trim() !== "—");
    if (!lines.length) return alert("Nessun partecipante.");
    await copyToClipboard(lines.join("\n"));
    alert("Partecipanti copiati ✅");
  });
}

// AUTH INIT
function initAuth() {
  showLogin();

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("dg_admin_ok");
    location.reload();
  });

  if (isLogged()) {
    showPanel();
    msg(adminMsg, "Accesso OK ✅", true);
    bootAdmin().catch(console.error);
    return;
  }

  loginBtn?.addEventListener("click", () => {
    const p = (adminPass?.value || "").trim();
    if (!p) return msg(adminMsg, "Inserisci la password.", false);
    if (p !== PASSWORD) return msg(adminMsg, "Password errata.", false);

    setLogged(true);
    showPanel();
    msg(adminMsg, "Accesso OK ✅", true);
    bootAdmin().catch(console.error);
  });
}

initAuth();
