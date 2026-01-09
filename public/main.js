import { supabase } from "./supabase.js";
import { initSeatmap } from "./seatmap-core.js";

const tripSelect = document.getElementById("tripSelect");
const posterBox = document.getElementById("locandine");

async function loadTrips() {
  const { data, error } = await supabase
    .from("percorsi")
    .select("*")
    .eq("attivo", true)
    .order("data");

  if (error) {
    console.error(error);
    return;
  }

  tripSelect.innerHTML = `<option value="">Seleziona viaggio</option>`;

  data.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.viaggio} (${t.data})`;
    opt.dataset.bus = t.tipo_bus;
    tripSelect.appendChild(opt);
  });
}

tripSelect.addEventListener("change", async () => {
  const id = tripSelect.value;
  if (!id) return;

  const busType =
    tripSelect.options[tripSelect.selectedIndex].dataset.bus;

  initSeatmap(busType);

  const { data } = await supabase
    .from("manifesti")
    .select("*")
    .eq("viaggio_id", id)
    .eq("attivo", true);

  posterBox.innerHTML = "";
  data.forEach(p => {
    const img = document.createElement("img");
    img.src = p.url_immagine;
    img.className = "poster";
    posterBox.appendChild(img);
  });
});

loadTrips();
