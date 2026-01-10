import { supabase } from "./supabase.js";

// Carica locandine (manifesti) del viaggio selezionato
export async function loadPostersForTrip(percorso_id) {
  const grid = document.getElementById("locandineGrid");
  const msg = document.getElementById("locandineMsg");
  if (!grid) return;

  grid.innerHTML = "";
  if (msg) msg.textContent = "Caricamento locandine...";

  const { data, error } = await supabase
    .from("manifesti")
    .select("id, creato_a, percorso_id, titolo, url_immagine, attivo")
    .eq("attivo", true)
    .eq("percorso_id", percorso_id)
    .order("creato_a", { ascending: false });

  if (error) {
    console.error("Errore manifesti:", error);
    if (msg) msg.textContent = "Errore caricamento locandine (vedi console).";
    return;
  }

  const posters = data || [];
  if (!posters.length) {
    if (msg) msg.textContent = "Nessuna locandina per questo viaggio (caricala da Admin).";
    return;
  }

  if (msg) msg.textContent = "";

  posters.forEach((p) => {
    const card = document.createElement("div");
    card.className = "locandina";
    card.innerHTML = `
      <img src="${p.url_immagine}" alt="${p.titolo || "Locandina"}">
      <div class="cap">${p.titolo || "Locandina"}</div>
    `;
    grid.appendChild(card);
  });
}
