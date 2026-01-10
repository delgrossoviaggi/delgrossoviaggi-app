import { supabase } from "./supabase.js";

// Carica locandine del viaggio selezionato
export async function loadPostersForTrip(percorsoId) {
  const grid = document.getElementById("locandineGrid");
  const msg = document.getElementById("locandineMsg");
  if (!grid) return;

  if (!percorsoId) {
    grid.innerHTML = `<div class="msg">Seleziona un viaggio per vedere le locandine.</div>`;
    if (msg) msg.textContent = "";
    return;
  }

  const { data, error } = await supabase
    .from("manifesti")
    .select("id, creato_a, titolo, url_immagine, attivo")
    .eq("percorso_id", percorsoId)
    .eq("attivo", true)
    .order("creato_a", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = `<div class="msg">Errore caricamento locandine.</div>`;
    if (msg) msg.textContent = "Errore locandine (console).";
    if (msg) msg.style.color = "crimson";
    return;
  }

  const posters = data || [];
  grid.innerHTML = "";

  if (!posters.length) {
    grid.innerHTML = `<div class="msg">Nessuna locandina per questo viaggio.</div>`;
    if (msg) msg.textContent = "";
    return;
  }

  posters.forEach((p) => {
    const card = document.createElement("div");
    card.className = "locandina";
    card.innerHTML = `
      <img src="${p.url_immagine}" alt="${p.titolo || "Locandina"}">
      <div class="cap">${p.titolo || "Locandina"}</div>
    `;
    grid.appendChild(card);
  });

  if (msg) msg.textContent = "";
}
