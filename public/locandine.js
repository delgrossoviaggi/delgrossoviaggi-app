import { supabase } from "./supabase.js";

/**
 * Carica locandine (manifesti) del viaggio selezionato
 * Tabella: manifesti
 * Colonne: id, percorso_id, titolo, image_url, attivo, creato_a
 */
export async function loadPostersForTrip(percorso_id) {
  const grid = document.getElementById("locandineGrid");
  const msg = document.getElementById("locandineMsg");
  if (!grid) return;

  grid.innerHTML = "";
  if (msg) msg.textContent = "Caricamento locandine...";

  const { data, error } = await supabase
    .from("manifesti")
    .select("id, titolo, image_url, attivo, creato_a, percorso_id")
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
      <img src="${p.image_url}" alt="${p.titolo || "Locandina"}">
      <div class="cap">${p.titolo || "Locandina"}</div>
    `;

    // ✅ CLICK → apre il modal in index.html (evento posterChosen)
    card.addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent("posterChosen", {
          detail: {
            image_url: p.image_url,
            titolo: p.titolo || "Locandina",
            extra: p.creato_a ? `Caricata il: ${String(p.creato_a).slice(0, 10)}` : "",
          },
        })
      );
    });

    grid.appendChild(card);
  });
}
