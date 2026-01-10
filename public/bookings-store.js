import { supabase } from "./supabase.js";

const COL_SEATS = "posti"; // ✅ colonna reale in tabella prenotazioni

function toArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const x = JSON.parse(v);
      return Array.isArray(x) ? x : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function loadOccupiedSeats(percorso_id) {
  const { data, error } = await supabase
    .from("prenotazioni")
    .select(COL_SEATS)
    .eq("percorso_id", percorso_id);

  if (error) {
    console.error("loadOccupiedSeats error:", error);
    return [];
  }

  const set = new Set();
  (data || []).forEach((r) => {
    toArray(r[COL_SEATS]).forEach((s) => set.add(String(s)));
  });

  return [...set].sort((a, b) => Number(a) - Number(b));
}

export async function createBooking({ percorso_id, nome_cognome, telefono, posti }) {
  const payload = {
    percorso_id,
    nome_cognome,
    telefono,
    posti: (posti || []).map(String), // ✅ salva sempre stringhe
  };

  const { error } = await supabase.from("prenotazioni").insert(payload);

  if (error) {
    console.error("createBooking error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
