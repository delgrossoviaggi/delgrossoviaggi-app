import { supabase } from "./supabase.js";

const PASSWORD = "admin123"; // cambiala

// login
document.getElementById("loginBtn").onclick = () => {
  const pass = document.getElementById("adminPass").value;
  if (pass === PASSWORD) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("panel").style.display = "grid";
    boot();
  } else alert("Password errata");
};

function normalizeBus(v) {
  const s = (v || "").toString().toUpperCase().replace(/\s+/g, "");
  if (s.includes("53")) return "GT53";
  if (s.includes("63")) return "GT63";
  return "";
}

async function boot() {
  await loadTrips();
  await loadBookings();
}

async function loadTrips() {
  const { data, error } = await supabase
    .from("percorsi")
    .select("id, viaggio, data, partenza, tipo_bus, attivo")
    .order("data", { ascending: true });

  if (error) return console.error(error);

  // select per locandine
  const sel = document.getElementById("posterTrip");
  sel.innerHTML = "";
  data.filter(t => t.attivo).forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.viaggio} — ${t.data}`;
    sel.appendChild(opt);
  });

  // tabella viaggi admin (se esiste)
  const list = document.getElementById("tripsList");
  if (list) {
    list.innerHTML = data.map(t =>
      `<div style="padding:8px;border:1px solid #ddd;border-radius:10px;margin:6px 0">
        <b>${t.viaggio}</b><br/>
        ${t.data} — ${t.partenza} — <b>${t.tipo_bus}</b> — attivo: ${t.attivo}
      </div>`
    ).join("");
  }
}

// crea viaggio
document.getElementById("createTripBtn")?.addEventListener("click", async () => {
  const viaggio = document.getElementById("newTripName").value.trim();
  const data = document.getElementById("newTripDate").value;
  const partenza = document.getElementById("newTripDep").value.trim();
  const tipo_bus = normalizeBus(document.getElementById("newTripBus").value);
  const attivo = document.getElementById("newTripActive").checked;

  if (!viaggio || !data || !partenza || !tipo_bus) return alert("Compila tutti i campi.");

  const { error } = await supabase.from("percorsi").insert({ viaggio, data, partenza, tipo_bus, attivo });
  if (error) return alert("Errore creazione viaggio: " + error.message);

  alert("Viaggio creato ✅");
  await loadTrips();
});

// upload locandina (bucket: locandine)
document.getElementById("uploadPosterBtn").onclick = async () => {
  const tripId = document.getElementById("posterTrip").value;
  const title = document.getElementById("posterTitle").value.trim() || "Locandina";
  const file = document.getElementById("posterFile").files[0];

  if (!tripId || !file) return alert("Seleziona viaggio e file.");

  const safeName = `${tripId}/${Date.now()}-${file.name}`.replace(/\s+/g, "_");

  const up = await supabase.storage.from("locandine").upload(safeName, file, {
    cacheControl: "3600",
    upsert: true
  });

  if (up.error) return alert("Upload fallito: " + up.error.message);

  const { data: pub } = supabase.storage.from("locandine").getPublicUrl(safeName);

  const { error } = await supabase.from("manifesti").insert({
    percorso_id: tripId,
    titolo: title,
    url_immagine: pub.publicUrl,
    attivo: true
  });

  if (error) return alert("Errore DB: " + error.message);

  alert("Locandina caricata ✅");
};

// lista prenotazioni + avviso 90%
async function loadBookings() {
  const tripId = document.getElementById("bookingsTrip")?.value || null;

  let q = supabase
    .from("prenotazioni")
    .select("id, creato_a, percorso_id, nome_cognome, telefono, posti, stato")
    .order("creato_a", { ascending: false });

  if (tripId) q = q.eq("percorso_id", tripId);

  const { data, error } = await q;
  if (error) return console.error(error);

  const list = document.getElementById("bookingsList");
  if (list) {
    list.innerHTML = data.map(b => {
      const seats = Array.isArray(b.posti) ? b.posti.join(", ") : JSON.stringify(b.posti);
      return `<div style="padding:10px;border:1px solid #ddd;border-radius:10px;margin:6px 0">
        <b>${b.nome_cognome}</b> (${b.telefono})<br/>
        Posti: <b>${seats}</b><br/>
        Data: ${new Date(b.creato_a).toLocaleString()} — Stato: ${b.stato || "confermato"}
      </div>`;
    }).join("");
  }

  // avviso 90% (se hai select bus)
  // calcolo riempimento per ogni viaggio selezionato
  // (semplificato) se bookingsTrip selezionato
  if (tripId) {
    const { data: trip } = await supabase.from("percorsi").select("tipo_bus").eq("id", tripId).single();
    const cap = (trip?.tipo_bus === "GT63") ? 63 : 53;
    const occupied = new Set();
    data.forEach(b => (b.posti || []).forEach(s => occupied.add(s)));

    const ratio = occupied.size / cap;
    const warn = document.getElementById("fillWarn");
    if (warn) {
      warn.textContent = ratio >= 0.9
        ? `⚠️ Bus quasi pieno: ${occupied.size}/${cap} (${Math.round(ratio * 100)}%)`
        : `Riempimento: ${occupied.size}/${cap} (${Math.round(ratio * 100)}%)`;
      warn.style.color = ratio >= 0.9 ? "crimson" : "green";
    }
  }
}

document.getElementById("refreshBookingsBtn")?.addEventListener("click", loadBookings);
document.getElementById("bookingsTrip")?.addEventListener("change", loadBookings);
