import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ==============================
   CONFIG SUPABASE
============================== */
const SUPABASE_URL = "https://anecuxbekhdkxcwblhtm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZWN1eGJla2hka3hjd2JsaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTc0ODgsImV4cCI6MjA4MjkzMzQ4OH0.DkxoFpEdoZZ8aOi_asRbhobJOpFVaog8lGzTfMKyATo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ==============================
   ELEMENTI DOM
============================== */
const authBox = document.getElementById("authBox");
const panel = document.getElementById("panel");
const loginBtn = document.getElementById("loginBtn");
const adminMsg = document.getElementById("adminMsg");

const posterTrip = document.getElementById("posterTrip");
const posterTitle = document.getElementById("posterTitle");
const posterFile = document.getElementById("posterFile");
const uploadPosterBtn = document.getElementById("uploadPosterBtn");
const posterMsg = document.getElementById("posterMsg");

/* ==============================
   LOGIN ADMIN (semplice)
============================== */
loginBtn.addEventListener("click", () => {
  const pass = document.getElementById("adminPass").value;
  if (pass === "admin123") {
    authBox.style.display = "none";
    panel.style.display = "grid";
    loadViaggi();
  } else {
    adminMsg.textContent = "Password errata ❌";
    adminMsg.style.color = "red";
  }
});

/* ==============================
   CARICA VIAGGI NEL SELECT
============================== */
async function loadViaggi() {
  posterTrip.innerHTML = "<option>Caricamento...</option>";

  const { data, error } = await supabase
    .from("viaggi")
    .select("*")
    .order("data", { ascending: true });

  if (error) {
    console.error(error);
    posterTrip.innerHTML = "<option>Errore caricamento</option>";
    return;
  }

  posterTrip.innerHTML = `<option value="">Seleziona viaggio</option>`;

  data.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = `${v.titolo} – ${v.data}`;
    posterTrip.appendChild(opt);
  });
}

/* ==============================
   UPLOAD LOCANDINA
============================== */
uploadPosterBtn.addEventListener("click", async () => {
  const tripId = posterTrip.value;
  const title = posterTitle.value;
  const file = posterFile.files[0];

  if (!tripId || !file) {
    posterMsg.textContent = "Seleziona viaggio e immagine";
    posterMsg.style.color = "red";
    return;
  }

  const fileName = `${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("locandine")
    .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    posterMsg.textContent = "Errore upload";
    posterMsg.style.color = "red";
    return;
  }

  const { data: urlData } = supabase.storage
    .from("locandine")
    .getPublicUrl(fileName);

  const { error: insertError } = await supabase
    .from("locandine")
    .insert({
      viaggio_id: tripId,
      titolo: title || "",
      image_url: urlData.publicUrl
    });

  if (insertError) {
    console.error(insertError);
    posterMsg.textContent = "Errore salvataggio DB";
    posterMsg.style.color = "red";
    return;
  }

  posterMsg.textContent = "Locandina caricata ✅";
  posterMsg.style.color = "green";
  posterFile.value = "";
  posterTitle.value = "";
});
