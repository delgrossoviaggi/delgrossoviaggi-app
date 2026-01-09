import { supabase } from "./supabase.js";
import { listBookings } from "./bookings-store.js";

const PASS = "del2025bus"; // cambia qui

const authBox = document.getElementById("authBox");
const panel = document.getElementById("panel");
const adminPass = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminMsg = document.getElementById("adminMsg");

const posterTrip = document.getElementById("posterTrip");
const posterTitle = document.getElementById("posterTitle");
const posterFile = document.getElementById("posterFile");
const uploadPosterBtn = document.getElementById("uploadPosterBtn");
const posterMsg = document.getElementById("posterMsg");

const bookTrip = document.getElementById("bookTrip");
const refreshBtn = document.getElementById("refreshBtn");
const stats = document.getElementById("stats");
const bookingsList = document.getElementById("bookingsList");
const participants = document.getElementById("participants");

function msg(el, t, ok=false){
  el.textContent = t || "";
  el.style.color = ok ? "green" : "crimson";
}

function setAuthed(v){
  authBox.style.display = v ? "none" : "block";
  panel.style.display = v ? "grid" : "none";
  sessionStorage.setItem("dg_admin", v ? "1" : "0");
}

loginBtn.addEventListener("click", async ()=>{
  if ((adminPass.value||"").trim() !== PASS) return msg(adminMsg, "Password errata ❌");
  msg(adminMsg, "Accesso OK ✅", true);
  setAuthed(true);
  await boot();
});

logoutBtn.addEventListener("click", ()=>{
  sessionStorage.removeItem("dg_admin");
  setAuthed(false);
  adminPass.value = "";
  msg(adminMsg, "");
});

if (sessionStorage.getItem("dg_admin")==="1"){
  setAuthed(true);
  boot();
}

async function loadRoutes(){
  const { data, error } = await supabase.from("routes").select("*").order("created_at",{ascending:false});
  if (error) throw error;
  return data || [];
}

async function renderRoutes(){
  const routes = await loadRoutes();
  const act = routes.filter(r=>r.active);

  const optsPoster = `<option value="">Seleziona…</option>` + act.map(r=>`<option value="${r.name}">${r.name}</option>`).join("");
  const optsBook = `<option value="">Tutti</option>` + act.map(r=>`<option value="${r.name}">${r.name}</option>`).join("");

  posterTrip.innerHTML = optsPoster;
  bookTrip.innerHTML = optsBook;
}

async function uploadToStorage(file){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `locandine/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("locandine").upload(path, file, { upsert:false });
  if (error) throw error;
  const { data } = supabase.storage.from("locandine").getPublicUrl(path);
  return data.publicUrl;
}

uploadPosterBtn.addEventListener("click", async ()=>{
  msg(posterMsg,"");
  const trip = posterTrip.value;
  const title = (posterTitle.value||"").trim() || "Locandina";
  const file = posterFile.files?.[0];

  if (!trip) return msg(posterMsg,"Seleziona un viaggio.");
  if (!file) return msg(posterMsg,"Scegli un'immagine dal PC.");

  try{
    const url = await uploadToStorage(file);
    const { error } = await supabase.from("posters").insert({ trip_key: trip, title, image_url: url, active:true });
    if (error) throw error;

    posterTitle.value="";
    posterFile.value="";
    msg(posterMsg,"Locandina caricata ✅", true);
  }catch(e){
    console.error(e);
    msg(posterMsg,"Errore upload (console).");
  }
});

function calcCap(bookings){
  const any63 = bookings.some(b => (b.bus_type||"").includes("63"));
  return any63 ? 63 : 53;
}

async function renderBookings(){
  const trip = bookTrip.value || undefined;
  const bookings = await listBookings({ tripKey: trip });

  // lista prenotazioni
  bookingsList.innerHTML = bookings.map(b=>{
    const seats = (b.seats||[]).join(", ");
    const n = (b.seats||[]).length;
    const when = b.created_at ? new Date(b.created_at).toLocaleString() : "";
    return `• <b>${b.full_name}</b> (${b.phone}) — <b>${n}</b> posti [${seats}] <span style="color:#6b7280">(${when})</span>`;
  }).join("<br/>") || "Nessuna prenotazione.";

  // partecipanti per posto
  const parts = [];
  bookings.forEach(b => (b.seats||[]).forEach(s => parts.push({ seat:Number(s), name:b.full_name, phone:b.phone })));
  parts.sort((a,b)=>a.seat-b.seat);

  participants.innerHTML = parts.map(p=>`• Posto <b>${p.seat}</b> — ${p.name} (${p.phone})`).join("<br/>") || "Nessun partecipante.";

  // stats + alert 90%
  const cap = calcCap(bookings);
  const taken = bookings.reduce((acc,b)=>acc + ((b.seats||[]).length), 0);
  const pct = cap ? Math.round((taken/cap)*100) : 0;

  stats.innerHTML = `<b>Totale:</b> ${taken}/${cap} — <b>${pct}%</b>` + (pct>=90 ? `<br><span style="color:crimson;font-weight:900">⚠️ Oltre 90% posti occupati</span>` : "");
}

refreshBtn.addEventListener("click", ()=> renderBookings().catch(console.error));
bookTrip.addEventListener("change", ()=> renderBookings().catch(console.error));

async function boot(){
  await renderRoutes();
  await renderBookings();
}
