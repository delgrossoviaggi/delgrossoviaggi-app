import { supabase } from "./supabase.js";

export async function loadOccupiedSeats(percorso_id) {
  const { data, error } = await supabase
    .from("prenotazioni")
    .select("posti")
    .eq("percorso_id", percorso_id)
    .eq("stato", "confermato");

  if (error) {
    console.error("loadOccupiedSeats:", error);
    return [];
  }

  const set = new Set();
  (data || []).forEach((r) => (r.posti || []).forEach((s) => set.add(Number(s))));
  return [...set].sort((a, b) => a - b);
}

export async function createBooking({ percorso_id, nome_cognome, telefono, posti }) {
  const { error } = await supabase.from("prenotazioni").insert({
    percorso_id,
    nome_cognome,
    telefono,
    posti,              // ✅ colonna corretta
    stato: "confermato"
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
