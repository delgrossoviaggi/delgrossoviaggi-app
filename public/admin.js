import { supabase } from "./supabase.js";

/* ===== LOGIN ADMIN ===== */
const PASSWORD = "admin123"; // cambiala dopo

document.getElementById("loginBtn").onclick = () => {
  const pass = document.getElementById("adminPass").value;
  if (pass === admin123) {
    document.getElementById("authBox").style.display = "none";
    document.getElementById("panel").style.display = "grid";
    loadTrips();
  } else {
    alert("Password errata");
  }
};

/* ===== CARICA VIAGGI ===== */
async function loadTrips() {
  const { data } = await supabase
    .from("percorsi")
    .select("id, viaggio")
    .eq("attivo", true);

  const select = document.getElementById("posterTrip");
  select.innerHTML = "";

  data.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.viaggio;
    select.appendChild(opt);
  });
}

/* ===== UPLOAD LOCANDINA ===== */
document.getElementById("uploadPosterBtn").onclick = async () => {
  const tripId = posterTrip.value;
  const title = posterTitle.value;
  const file = posterFile.files[0];

  if (!tripId || !file) return alert("Dati mancanti");

  const fileName = `${Date.now()}-${file.name}`;

  await supabase.storage
    .from("locandine")
    .upload(fileName, file);

  const { data } = supabase.storage
    .from("locandine")
    .getPublicUrl(fileName);

  await supabase.from("manifesti").insert({
    titolo: title,
    viaggio_id: tripId,
    url_immagine: data.publicUrl,
    attivo: true
  });

  alert("Locandina caricata");
};
