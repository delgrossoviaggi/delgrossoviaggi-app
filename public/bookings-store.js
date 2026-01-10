import { supabase } from "./supabase.js";

// ✅ prova a leggere sia "posti_a_sedere" che "posti" (per evitare mismatch)
const COL_SEATS_A = "posti_a_sedere";
const COL_SEATS_B = "posti";

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
    .select(`${COL_SEATS_A},${COL_SEATS_B}`)
    .eq("percorso_id", percorso_id);

  if (error) {
    console.error("loadOccupiedSeats error:", error);
    return [];
  }

  // ✅ DEBUG utile: vedi cosa torna davvero
  console.log("prenotazioni raw:", data);

  const set = new Set();
  (data || []).forEach((r) => {
    const seats = toArray(r[COL_SEATS_A]).length ? r[COL_SEATS_A] : r[COL_SEATS_B];
    toArray(seats).forEach((s) => set.add(String(s)));
  });

  return [...set].sort((a, b) => Number(a) - Number(b));
}

export async function createBooking({ percorso_id, nome_cognome, telefono, posti_a_sedere }) {
  const payload = {
    percorso_id,
    nome_cognome,
    telefono,
    posti_a_sedere: (posti_a_sedere || []).map(String), // ✅ salva sempre stringhe
  };

  const { error } = await supabase.from("prenotazioni").insert(payload);

  if (error) {
    console.error("createBooking error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
