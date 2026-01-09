import { supabase } from "./supabase.js";

export async function loadPosters() {
  const grid = document.getElementById("locandineGrid");
  if (!grid) return;

  const { data, error } = await supabase
    .from("posters")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const posters = data || [];
  grid.innerHTML = "";

  if (!posters.length) {
    grid.innerHTML = `<div class="msg">Nessuna locandina (caricale da Admin).</div>`;
    return;
  }

  posters.forEach(p => {
    const card = document.createElement("div");
    card.className = "locandina";
    card.innerHTML = `
      <img src="${p.image_url}" alt="${p.title || "Locandina"}">
      <div class="cap">${p.title || p.trip_key || "Locandina"}</div>
    `;
    card.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("posterChosen", { detail: p }));
    });
    grid.appendChild(card);
  });
}
