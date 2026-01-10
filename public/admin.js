import { supabase } from "./supabase.js";

/**
 * CONFIG COERENTE con le tue tabelle/colonne attuali
 */
const CFG = {
  TABLE_TRIPS: "percorsi",
  TABLE_POSTERS: "manifesti",
  TABLE_BOOKINGS: "prenotazioni",
  BUCKET_POSTERS: "locandine",

  COL_TRIP: {
    id: "id",
    createdAt: "creato_a",
    name: "viaggio",
    date: "data",
    departure: "partenza",
    bus: "tipo_bus",
    active: "attivo",
  },

  COL_POSTER: {
    id: "id",
    createdAt: "creato_a",
    tripId: "percorso_id",
    title: "titolo",
    imageUrl: "image_url",
    active: "attivo",
  },

  COL_BOOK: {
    id: "id",
    createdAt: "creato_a",
    tripId: "percorso_id",
    fullName: "nome_cognome",
    phone: "telefono",
    seats: "posti_a_sedere", // jsonb array
  },
};

/**
 * DOM
 */
const $ = (id) => document.getElementById(id);

const authBox = $("authBox");
const panel = $("panel");
const adminPass = $("adminPass");
const loginBtn = $("loginBtn");
const adminMsg = $("adminMsg");

const tripId = $("tripId");
const tripName = $("tripName");
const tripDate = $("tripDate");
const tripDeparture = $("tripDeparture");
const tripBus = $("tripBus");
const tripActive = $("tripActive");
const saveTripBtn = $("saveTripBtn");
const resetTripBtn = $("resetTripBtn");
const tripMsg = $("tripMsg");
const tripsList = $("tripsList");

const posterTrip = $("posterTrip");
const posterTitle = $("posterTitle");
const posterFile = $("posterFile");
const uploadPosterBtn = $("uploadPosterBtn");
const posterMsg = $("posterMsg");
const postersList = $("postersList");

const bookingsTrip = $("bookingsTrip");
const bookingsMsg = $("bookingsMsg");
const bookingsList = $("bookingsList");
const participantsList = $("participantsList");
const exportBookingsBtn = $("exportBookingsBtn");
const exportParticipantsBtn = $("exportParticipantsBtn");

/**
 * Utils
 */
function setMsg(el, text, ok = true) {
  if (!el) return;
  el.textContent = text || "";
  el.style.color = ok ? "green" : "crimson";
}

function normalizeBus(v) {
  const s = (v || "").toString().toUpperCase().replace(/\s+/g, "");
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  if (s === "GT53" || s === "GT63") return s;
  return "GT53";
}

function safeFileName(name) {
  return (name || "file")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows, headers) {
  const esc = (v) => {
    const s = (v ?? "").toString().replace(/\r?\n/g, " ").trim();
    if (s.includes('"') || s.includes(",") || s.includes(";")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // separatore ; (Excel IT lo apre meglio)
  const sep = ";";
  const lines = [];
  lines.push(headers.map(esc).join(sep));
  rows.forEach((r) => lines.push(r.map(esc).join(sep)));
  return lines.join("\n");
}

function seatsToArray(seats) {
  if (!seats) return [];
  if (Array.isArray(seats)) return seats;
  try {
    const v = JSON.parse(seats);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * AUTH semplice (come prima, ma pulito)
 */
function isLogged() {
  return localStorage.getItem("dg_admin_ok") === "1";
}
function setLogged(v) {
  localStorage.setItem("dg_admin_ok", v ? "1" : "0");
}
function showPanel() {
  if (authBox) authBox.style.display = "none";
  if (panel) panel.style.display = "grid";
}
function showLogin() {
  if (authBox) authBox.style.display = "block";
  if (panel) panel.style.display = "none";
}

function initAuth() {
  if (!authBox || !panel) return;

  if (isLogged()) {
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);
  } else {
    showLogin();
  }

  loginBtn?.addEventListener("click", async () => {
    const p = (adminPass?.value || "").trim();
    if (!p) return setMsg(adminMsg, "Inserisci la password.", false);

    // Accesso semplice (non sicuro)
    setLogged(true);
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);

    await bootAdmin();
  });
}

/**
 * LOAD TRIPS
 */
async function loadTrips() {
  const c = CFG.COL_TRIP;

  const { data, error } = await supabase
    .from(CFG.TABLE_TRIPS)
    .select(`${c.id},${c.name},${c.date},${c.departure},${c.bus},${c.active}`)
    .order(c.date, { ascending: true });

  if (error) throw error;
  return data || [];
}

function fillTripSelect(selectEl, trips, placeholder = "Seleziona...") {
  if (!selectEl) return;
  const c = CFG.COL_TRIP;

  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  trips.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t[c.id];
    opt.textContent = `${t[c.name]} — ${t[c.date] || ""}`;
    selectEl.appendChild(opt);
  });
}

function resetTripForm() {
  if (tripId) tripId.value = "";
  if (tripName) tripName.value = "";
  if (tripDate) tripDate.value = "";
  if (tripDeparture) tripDeparture.value = "";
  if (tripBus) tripBus.value = "GT53";
  if (tripActive) tripActive.value = "true";
  setMsg(tripMsg, "");
}

function renderTripsList(trips) {
  if (!tripsList) return;
  const c = CFG.COL_TRIP;

  if (!trips.length) {
    tripsList.innerHTML = `<div class="msg">Nessun viaggio inserito.</div>`;
    return;
  }

  tripsList.innerHTML = trips.map((t) => `
    <div class="selected-box" style="margin-top:10px">
      <div style="font-weight:900">${t[c.name]} — ${t[c.date] || ""}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">
        Partenze: ${t[c.departure] || "-"}<br/>
        Bus: <b>${t[c.bus] || "-"}</b> — Attivo: <b>${t[c.active] ? "TRUE" : "FALSE"}</b>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn ghost" type="button" data-edit="${t[c.id]}">Modifica</button>
        <button class="btn" type="button" data-toggle="${t[c.id]}" data-active="${t[c.active] ? "true" : "false"}">
          ${t[c.active] ? "Disattiva" : "Attiva"}
        </button>
      </div>
    </div>
  `).join("");

  tripsList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const t = trips.find((x) => x[c.id] === id);
      if (!t) return;

      if (tripId) tripId.value = t[c.id];
      if (tripName) tripName.value = t[c.name] || "";
      if (tripDate) tripDate.value = t[c.date] || "";
      if (tripDeparture) tripDeparture.value = t[c.departure] || "";
      if (tripBus) tripBus.value = normalizeBus(t[c.bus]);
      if (tripActive) tripActive.value = String(!!t[c.active]);

      setMsg(tripMsg, "Modifica pronta ✅", true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  tripsList.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-toggle");
      const curr = btn.getAttribute("data-active") === "true";
      const next = !curr;

      const { error } = await supabase
        .from(CFG.TABLE_TRIPS)
        .update({ [c.active]: next })
        .eq(c.id, id);

      if (error) {
        console.error(error);
        return setMsg(tripMsg, "Errore cambio stato (vedi console).", false);
      }

      setMsg(tripMsg, "Stato aggiornato ✅", true);
      await refreshAll();
    });
  });
}

async function saveTrip() {
  const c = CFG.COL_TRIP;

  const payload = {
    [c.name]: (tripName?.value || "").trim(),
    [c.date]: tripDate?.value || null,
    [c.departure]: (tripDeparture?.value || "").trim(),
    [c.bus]: normalizeBus(tripBus?.value),
    [c.active]: (tripActive?.value || "true") === "true",
  };

  if (!payload[c.name] || !payload[c.date] || !payload[c.departure]) {
    return setMsg(tripMsg, "Compila: Nome viaggio, Data, Partenze.", false);
  }

  let res;
  if (tripId?.value) {
    res = await supabase.from(CFG.TABLE_TRIPS).update(payload).eq(c.id, tripId.value);
  } else {
    res = await supabase.from(CFG.TABLE_TRIPS).insert(payload);
  }

  if (res.error) {
    console.error(res.error);
    return setMsg(tripMsg, "Errore salvataggio (vedi console).", false);
  }

  setMsg(tripMsg, "Viaggio salvato ✅", true);
  resetTripForm();
  await refreshAll();
}

/**
 * POSTERS: upload + insert DB + list + toggle
 */
async function uploadPoster() {
  const p = CFG.COL_POSTER;

  const trip_id = posterTrip?.value || "";
  const title = (posterTitle?.value || "").trim();
  const file = posterFile?.files?.[0];

  if (!trip_id) return setMsg(posterMsg, "Seleziona un viaggio.", false);
  if (!file) return setMsg(posterMsg, "Scegli un file immagine.", false);

  setMsg(posterMsg, "Caricamento...", true);

  // 1) upload storage
  const filename = `${trip_id}/${Date.now()}-${safeFileName(file.name)}`;

  const up = await supabase.storage
    .from(CFG.BUCKET_POSTERS)
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (up.error) {
    console.error("Storage upload error:", up.error);
    return setMsg(posterMsg, "Errore upload su Storage (vedi console).", false);
  }

  // 2) public URL
  const pub = supabase.storage.from(CFG.BUCKET_POSTERS).getPublicUrl(filename);
  const imageUrl = pub?.data?.publicUrl;

  if (!imageUrl) {
    return setMsg(posterMsg, "Errore: URL pubblico non disponibile.", false);
  }

  // 3) insert manifesti
  const payload = {
    [p.tripId]: trip_id,
    [p.title]: title || "Locandina",
    [p.imageUrl]: imageUrl,
    [p.active]: true,
  };

  const ins = await supabase.from(CFG.TABLE_POSTERS).insert(payload);

  if (ins.error) {
    console.error("DB insert poster error:", ins.error);
    return setMsg(posterMsg, "Errore DB locandina (vedi console).", false);
  }

  setMsg(posterMsg, "Locandina caricata ✅", true);
  if (posterTitle) posterTitle.value = "";
  if (posterFile) posterFile.value = "";
  await refreshAll();
}

async function loadPostersAdmin() {
  if (!postersList) return;

  const p = CFG.COL_POSTER;

  const { data, error } = await supabase
    .from(CFG.TABLE_POSTERS)
    .select(`${p.id},${p.tripId},${p.title},${p.imageUrl},${p.active},${p.createdAt}`)
    .order(p.createdAt, { ascending: false });

  if (error) {
    console.error(error);
    postersList.innerHTML = `<div class="msg">Errore caricamento locandine (console).</div>`;
    return;
  }

  const posters = data || [];
  if (!posters.length) {
    postersList.innerHTML = `<div class="msg">Nessuna locandina caricata.</div>`;
    return;
  }

  postersList.innerHTML = posters.map((x) => `
    <div class="selected-box" style="margin-top:10px">
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${x[p.imageUrl]}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px;border:1px solid rgba(15,23,42,.12)" />
        <div style="flex:1">
          <div style="font-weight:900">${x[p.title] || "Locandina"}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px">
            Attivo: <b>${x[p.active] ? "TRUE" : "FALSE"}</b>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn" type="button" data-poster-toggle="${x[p.id]}" data-active="${x[p.active] ? "true" : "false"}">
          ${x[p.active] ? "Disattiva" : "Attiva"}
        </button>
      </div>
    </div>
  `).join("");

  postersList.querySelectorAll("[data-poster-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-poster-toggle");
      const curr = btn.getAttribute("data-active") === "true";
      const next = !curr;

      const { error } = await supabase
        .from(CFG.TABLE_POSTERS)
        .update({ [p.active]: next })
        .eq(p.id, id);

      if (error) {
        console.error(error);
        return setMsg(posterMsg, "Errore cambio stato locandina (console).", false);
      }

      setMsg(posterMsg, "Locandina aggiornata ✅", true);
      await refreshAll();
    });
  });
}

/**
 * BOOKINGS + PARTICIPANTS + EXPORT
 */
async function loadBookingsForTrip(trip_id) {
  const b = CFG.COL_BOOK;

  const { data, error } = await supabase
    .from(CFG.TABLE_BOOKINGS)
    .select(`${b.id},${b.fullName},${b.phone},${b.seats},${b.createdAt}`)
    .eq(b.tripId, trip_id)
    .order(b.createdAt, { ascending: false });

  if (error) throw error;
  return data || [];
}

function renderBookings(bookings) {
  const b = CFG.COL_BOOK;

  // prenotazioni
  if (bookingsList) {
    if (!bookings.length) {
      bookingsList.innerHTML = `<div class="msg">Nessuna prenotazione per questo viaggio.</div>`;
    } else {
      bookingsList.innerHTML = bookings.map((x) => {
        const seatsArr = seatsToArray(x[b.seats]);
        return `
          <div class="selected-box" style="margin-top:10px">
            <div style="font-weight:900">${x[b.fullName] || "-"}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">
              Tel: ${x[b.phone] || "-"}<br/>
              Posti (${seatsArr.length}): <b>${seatsArr.join(", ") || "-"}</b>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // partecipanti (1 riga = 1 persona)
  if (participantsList) {
    const rows = bookings.map((x) => {
      const seatsArr = seatsToArray(x[b.seats]);
      return {
        name: x[b.fullName] || "",
        phone: x[b.phone] || "",
        seats: seatsArr,
      };
    }).filter(r => r.name);

    if (!rows.length) {
      participantsList.innerHTML = `<div class="msg">Nessun partecipante.</div>`;
    } else {
      const totalSeats = rows.reduce((sum, r) => sum + (r.seats?.length || 0), 0);

      participantsList.innerHTML = `
        <div class="msg" style="margin-bottom:10px">
          Partecipanti: <b>${rows.length}</b> — Posti totali: <b>${totalSeats}</b>
        </div>
        ${rows.map(r => `
          <div class="selected-box" style="margin-top:10px">
            <div style="font-weight:900">${r.name}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">
              Tel: ${r.phone || "-"}<br/>
              Posti: <b>${(r.seats || []).join(", ") || "-"}</b>
            </div>
          </div>
        `).join("")}
      `;
    }
  }
}

async function onBookingsTripChange() {
  const trip_id = bookingsTrip?.value || "";
  if (!trip_id) {
    if (bookingsList) bookingsList.innerHTML = `<div class="msg">Seleziona un viaggio.</div>`;
    if (participantsList) participantsList.innerHTML = `<div class="msg">Seleziona un viaggio.</div>`;
    setMsg(bookingsMsg, "");
    return;
  }

  setMsg(bookingsMsg, "Caricamento...", true);
  try {
    const bookings = await loadBookingsForTrip(trip_id);
    renderBookings(bookings);
    setMsg(bookingsMsg, "OK ✅", true);
  } catch (e) {
    console.error(e);
    setMsg(bookingsMsg, "Errore caricamento (console).", false);
  }
}

async function exportBookingsCSV() {
  const trip_id = bookingsTrip?.value || "";
  if (!trip_id) return alert("Seleziona un viaggio.");

  const b = CFG.COL_BOOK;
  const bookings = await loadBookingsForTrip(trip_id);

  const rows = bookings.map((x) => {
    const seatsArr = seatsToArray(x[b.seats]);
    return [
      x[b.fullName] || "",
      x[b.phone] || "",
      seatsArr.join(", "),
      seatsArr.length,
      x[b.createdAt] || "",
    ];
  });

  const csv = toCSV(rows, ["Nome e Cognome", "Telefono", "Posti", "N Posti", "Creato il"]);
  downloadTextFile(`prenotazioni_${trip_id}.csv`, csv, "text/csv;charset=utf-8");
}

async function exportParticipantsCSV() {
  const trip_id = bookingsTrip?.value || "";
  if (!trip_id) return alert("Seleziona un viaggio.");

  const b = CFG.COL_BOOK;
  const bookings = await loadBookingsForTrip(trip_id);

  // stesso contenuto ma “pensato” per Excel
  const rows = bookings.map((x) => {
    const seatsArr = seatsToArray(x[b.seats]);
    return [
      x[b.fullName] || "",
      x[b.phone] || "",
      seatsArr.join(", "),
      seatsArr.length,
    ];
  });

  const csv = toCSV(rows, ["Partecipante", "Telefono", "Posti", "N Posti"]);
  downloadTextFile(`partecipanti_${trip_id}.csv`, csv, "text/csv;charset=utf-8");
}

/**
 * REFRESH UNICO
 */
async function refreshAll() {
  const trips = await loadTrips();

  renderTripsList(trips);
  fillTripSelect(posterTrip, trips, "Seleziona viaggio...");
  fillTripSelect(bookingsTrip, trips, "Seleziona viaggio...");

  await loadPostersAdmin();

  if (bookingsTrip?.value) await onBookingsTripChange();
}

/**
 * BOOT
 */
async function bootAdmin() {
  // viaggi
  saveTripBtn?.addEventListener("click", () => saveTrip().catch(console.error));
  resetTripBtn?.addEventListener("click", resetTripForm);

  // locandine
  uploadPosterBtn?.addEventListener("click", () => uploadPoster().catch(console.error));

  // prenotazioni
  bookingsTrip?.addEventListener("change", () => onBookingsTripChange().catch(console.error));

  // export
  exportBookingsBtn?.addEventListener("click", () => exportBookingsCSV().catch(console.error));
  exportParticipantsBtn?.addEventListener("click", () => exportParticipantsCSV().catch(console.error));

  await refreshAll();
}

/**
 * INIT
 */
initAuth();

// se sei già loggato: avvio diretto
if (!authBox || !panel || isLogged()) {
  showPanel();
  bootAdmin().catch(console.error);
}
