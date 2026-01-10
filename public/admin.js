import { supabase } from "./supabase.js";

/**
 * ==========================================================
 * CONFIG (allineato al tuo Supabase)
 * ==========================================================
 */
const CFG = {
  TABLE_TRIPS: "percorsi",
  TABLE_POSTERS: "manifesti",
  TABLE_BOOKINGS: "prenotazioni",
  BUCKET_POSTERS: "locandine",

  COL_TRIP: {
    id: "id",
    name: "viaggio",
    date: "data",
    departure: "partenza",
    bus: "tipo_bus",
    active: "attivo",
    createdAt: "creato_a",
  },

  COL_POSTER: {
    id: "id",
    tripId: "percorso_id",
    title: "titolo",
    imageUrl: "url_immagine",
    active: "attivo",
    createdAt: "creato_a",
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
 * ==========================================================
 * DOM helpers
 * ==========================================================
 */
const $ = (id) => document.getElementById(id);

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

function fmtTripLabel(t) {
  const c = CFG.COL_TRIP;
  const d = t[c.date] ? String(t[c.date]) : "";
  return `${t[c.name]} — ${d}`;
}

function asBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return !!v;
}

function seatsToArray(seats) {
  if (!seats) return [];
  if (Array.isArray(seats)) return seats;
  try {
    const x = JSON.parse(seats);
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

/**
 * ==========================================================
 * AUTH (semplice lato browser)
 * ==========================================================
 */
const authBox = $("authBox");
const panel = $("panel");
const adminPass = $("adminPass");
const loginBtn = $("loginBtn");
const adminMsg = $("adminMsg");

// 🔒 Cambiala quando vuoi
const ADMIN_PASSWORD = "1234";

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
    if (p !== ADMIN_PASSWORD) return setMsg(adminMsg, "Password errata.", false);

    setLogged(true);
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);
    await bootAdmin();
  });
}

/**
 * ==========================================================
 * ELEMENTI UI
 * ==========================================================
 */
// Viaggi
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

// Locandine
const posterTrip = $("posterTrip");
const posterTitle = $("posterTitle");
const posterFile = $("posterFile");
const uploadPosterBtn = $("uploadPosterBtn");
const posterMsg = $("posterMsg");
const postersList = $("postersList");

// Prenotazioni
const bookingsTrip = $("bookingsTrip");
const bookingsList = $("bookingsList");
const participantsList = $("participantsList");
const bookingsMsg = $("bookingsMsg");

/**
 * ==========================================================
 * VIAGGI (CRUD)
 * ==========================================================
 */
function resetTripForm() {
  if (tripId) tripId.value = "";
  if (tripName) tripName.value = "";
  if (tripDate) tripDate.value = "";
  if (tripDeparture) tripDeparture.value = "";
  if (tripBus) tripBus.value = "GT53";
  if (tripActive) tripActive.value = "true";
  setMsg(tripMsg, "");
}

async function dbLoadTrips() {
  const c = CFG.COL_TRIP;

  const { data, error } = await supabase
    .from(CFG.TABLE_TRIPS)
    .select(`${c.id},${c.name},${c.date},${c.departure},${c.bus},${c.active},${c.createdAt}`)
    .order(c.date, { ascending: true });

  if (error) throw error;
  return data || [];
}

function renderTripsList(trips) {
  if (!tripsList) return;

  if (!trips.length) {
    tripsList.innerHTML = `<div class="msg">Nessun viaggio inserito.</div>`;
    return;
  }

  const c = CFG.COL_TRIP;

  tripsList.innerHTML = trips
    .map((t) => {
      const active = asBool(t[c.active]);
      return `
      <div class="selected-box" style="margin-top:10px">
        <div style="font-weight:900">${t[c.name]} — ${t[c.date] || ""}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          Partenze: ${t[c.departure] || "-"}<br>
          Bus: <b>${t[c.bus] || "-"}</b> — Attivo: <b>${active ? "TRUE" : "FALSE"}</b>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="btn ghost" data-edit="${t[c.id]}" type="button">Modifica</button>
          <button class="btn" data-toggle="${t[c.id]}" data-active="${active ? "true" : "false"}" type="button">
            ${active ? "Disattiva" : "Attiva"}
          </button>
        </div>
      </div>`;
    })
    .join("");

  tripsList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const t = trips.find((x) => x[c.id] === id);
      if (!t) return;

      tripId.value = t[c.id];
      tripName.value = t[c.name] || "";
      tripDate.value = t[c.date] || "";
      tripDeparture.value = t[c.departure] || "";
      tripBus.value = normalizeBus(t[c.bus]);
      tripActive.value = String(asBool(t[c.active]));

      setMsg(tripMsg, "Modifica viaggio pronta ✅", true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  tripsList.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-toggle");
      const curr = btn.getAttribute("data-active") === "true";
      const next = !curr;

      try {
        const { error } = await supabase
          .from(CFG.TABLE_TRIPS)
          .update({ [c.active]: next })
          .eq(c.id, id);

        if (error) throw error;

        setMsg(tripMsg, "Stato aggiornato ✅", true);
        await refreshAll();
      } catch (e) {
        console.error(e);
        setMsg(tripMsg, "Errore cambio stato (vedi console).", false);
      }
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

  try {
    if (tripId?.value) {
      const { error } = await supabase.from(CFG.TABLE_TRIPS).update(payload).eq(c.id, tripId.value);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(CFG.TABLE_TRIPS).insert(payload);
      if (error) throw error;
    }

    setMsg(tripMsg, "Viaggio salvato ✅", true);
    resetTripForm();
    await refreshAll();
  } catch (e) {
    console.error(e);
    setMsg(tripMsg, "Errore salvataggio (vedi console).", false);
  }
}

/**
 * ==========================================================
 * SELECT viaggi (usati in locandine e prenotazioni)
 * ==========================================================
 */
function fillTripSelect(selectEl, trips, placeholder = "Seleziona...") {
  if (!selectEl) return;
  const c = CFG.COL_TRIP;

  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  trips.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t[c.id];
    opt.textContent = fmtTripLabel(t);
    selectEl.appendChild(opt);
  });
}

/**
 * ==========================================================
 * LOCANDINE (upload + lista)
 * ==========================================================
 */
async function uploadPoster() {
  const p = CFG.COL_POSTER;

  const trip_id = posterTrip?.value || "";
  const title = (posterTitle?.value || "").trim();
  const file = posterFile?.files?.[0];

  if (!trip_id) return setMsg(posterMsg, "Seleziona un viaggio.", false);
  if (!file) return setMsg(posterMsg, "Scegli un file immagine.", false);

  setMsg(posterMsg, "Caricamento...", true);

  try {
    // 1) Upload su Storage
    const filename = `${trip_id}/${Date.now()}-${safeFileName(file.name)}`;

    const up = await supabase.storage.from(CFG.BUCKET_POSTERS).upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    if (up.error) throw up.error;

    // 2) URL pubblico
    const pub = supabase.storage.from(CFG.BUCKET_POSTERS).getPublicUrl(filename);
    const imageUrl = pub?.data?.publicUrl;
    if (!imageUrl) throw new Error("URL pubblico non disponibile");

    // 3) Inserisci in tabella manifesti
    const payload = {
      [p.tripId]: trip_id,
      [p.title]: title || "Locandina",
      [p.imageUrl]: imageUrl,
      [p.active]: true,
    };

    const ins = await supabase.from(CFG.TABLE_POSTERS).insert(payload);
    if (ins.error) throw ins.error;

    setMsg(posterMsg, "Locandina caricata ✅", true);
    if (posterTitle) posterTitle.value = "";
    if (posterFile) posterFile.value = "";
    await refreshAll();
  } catch (e) {
    console.error("UPLOAD LOCANDINA ERROR:", e);
    // messaggio più utile
    const hint =
      (e?.message || "").includes("row-level security") ? " (RLS: controlla policy!)" : "";
    setMsg(posterMsg, `Errore DB locandina${hint} (vedi console).`, false);
  }
}

async function loadPostersAdmin() {
  if (!postersList) return;

  const p = CFG.COL_POSTER;

  try {
    const { data, error } = await supabase
      .from(CFG.TABLE_POSTERS)
      .select(`${p.id},${p.tripId},${p.title},${p.imageUrl},${p.active},${p.createdAt}`)
      .order(p.createdAt, { ascending: false });

    if (error) throw error;

    const posters = data || [];
    if (!posters.length) {
      postersList.innerHTML = `<div class="msg">Nessuna locandina caricata.</div>`;
      return;
    }

    postersList.innerHTML = posters
      .map((x) => {
        const active = asBool(x[p.active]);
        return `
        <div class="selected-box" style="margin-top:10px">
          <div style="display:flex;gap:10px;align-items:center">
            <img src="${x[p.imageUrl]}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px;border:1px solid rgba(15,23,42,.12)" />
            <div style="flex:1">
              <div style="font-weight:900">${x[p.title] || "Locandina"}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">
                Attivo: <b>${active ? "TRUE" : "FALSE"}</b>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="btn" data-poster-toggle="${x[p.id]}" data-active="${active ? "true" : "false"}" type="button">
              ${active ? "Disattiva" : "Attiva"}
            </button>
          </div>
        </div>`;
      })
      .join("");

    postersList.querySelectorAll("[data-poster-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-poster-toggle");
        const curr = btn.getAttribute("data-active") === "true";
        const next = !curr;

        try {
          const { error } = await supabase
            .from(CFG.TABLE_POSTERS)
            .update({ [p.active]: next })
            .eq(p.id, id);

          if (error) throw error;

          setMsg(posterMsg, "Locandina aggiornata ✅", true);
          await refreshAll();
        } catch (e) {
          console.error(e);
          setMsg(posterMsg, "Errore cambio stato locandina (console).", false);
        }
      });
    });
  } catch (e) {
    console.error(e);
    postersList.innerHTML = `<div class="msg">Errore caricamento locandine (console).</div>`;
  }
}

/**
 * ==========================================================
 * PRENOTAZIONI + PARTECIPANTI
 * ==========================================================
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
  // Prenotazioni
  if (bookingsList) {
    if (!bookings.length) {
      bookingsList.innerHTML = `<div class="msg">Nessuna prenotazione per questo viaggio.</div>`;
    } else {
      bookingsList.innerHTML = bookings
        .map((x) => {
          const seatsArr = seatsToArray(x[CFG.COL_BOOK.seats]);
          const seatsTxt = seatsArr.length ? seatsArr.join(", ") : "-";
          return `
          <div class="selected-box" style="margin-top:10px">
            <div style="font-weight:900">${x[CFG.COL_BOOK.fullName] || "-"}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">
              Tel: ${x[CFG.COL_BOOK.phone] || "-"}<br />
              Posti (${seatsArr.length}): <b>${seatsTxt}</b>
            </div>
          </div>`;
        })
        .join("");
    }
  }

  // Partecipanti (riassunto)
  if (participantsList) {
    const rows = bookings
      .map((x) => ({
        name: x[CFG.COL_BOOK.fullName] || "",
        phone: x[CFG.COL_BOOK.phone] || "",
        seats: seatsToArray(x[CFG.COL_BOOK.seats]),
      }))
      .filter((x) => x.name);

    if (!rows.length) {
      participantsList.innerHTML = `<div class="msg">Nessun partecipante.</div>`;
      return;
    }

    const totalSeats = rows.reduce((sum, r) => sum + (r.seats?.length || 0), 0);

    participantsList.innerHTML = `
      <div class="msg" style="margin-bottom:10px">
        Partecipanti: <b>${rows.length}</b> — Posti totali: <b>${totalSeats}</b>
      </div>
      ${rows
        .map(
          (r) => `
        <div class="selected-box" style="margin-top:10px">
          <div style="font-weight:900">${r.name}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">
            Tel: ${r.phone || "-"}<br />
            Posti: <b>${r.seats.length ? r.seats.join(", ") : "-"}</b>
          </div>
        </div>`
        )
        .join("")}
    `;
  }
}

async function onBookingsTripChange() {
  if (!bookingsTrip?.value) {
    if (bookingsList) bookingsList.innerHTML = `<div class="msg">Seleziona un viaggio.</div>`;
    if (participantsList) participantsList.innerHTML = `<div class="msg">Seleziona un viaggio.</div>`;
    return;
  }

  setMsg(bookingsMsg, "Caricamento prenotazioni...", true);

  try {
    const bookings = await loadBookingsForTrip(bookingsTrip.value);
    renderBookings(bookings);
    setMsg(bookingsMsg, "OK ✅", true);
  } catch (e) {
    console.error(e);
    setMsg(bookingsMsg, "Errore caricamento prenotazioni (console).", false);
  }
}

/**
 * ==========================================================
 * REFRESH unico (riempie select + liste)
 * ==========================================================
 */
async function refreshAll() {
  const trips = await dbLoadTrips();

  renderTripsList(trips);
  fillTripSelect(posterTrip, trips, "Seleziona viaggio...");
  fillTripSelect(bookingsTrip, trips, "Seleziona viaggio...");

  await loadPostersAdmin();

  if (bookingsTrip?.value) {
    await onBookingsTripChange();
  }
}

/**
 * ==========================================================
 * BOOT
 * ==========================================================
 */
async function bootAdmin() {
  // Viaggi
  saveTripBtn?.addEventListener("click", () => saveTrip());
  resetTripBtn?.addEventListener("click", resetTripForm);

  // Locandine
  uploadPosterBtn?.addEventListener("click", () => uploadPoster());

  // Prenotazioni
  bookingsTrip?.addEventListener("change", () => onBookingsTripChange());

  // Carica tutto
  await refreshAll();
}

/**
 * INIT
 */
initAuth();

if (!authBox || !panel) {
  // se non esiste login UI, comunque avviamo
  bootAdmin().catch(console.error);
} else if (isLogged()) {
  showPanel();
  bootAdmin().catch(console.error);
}
