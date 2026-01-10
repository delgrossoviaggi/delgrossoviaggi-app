import { supabase } from "./supabase.js";

/**
 * Prenotazioni
 * Tabella: prenotazioni
 * Colonne: percorso_id, nome_cognome, telefono, posti_a_sedere (jsonb array), creato_a
 */

export async function loadOccupiedSeats(percorso_id) {
  const { data, error } = await supabase
    .from("prenotazioni")
    .select("posti_a_sedere")
    .eq("percorso_id", percorso_id);

  if (error) {
    console.error("loadOccupiedSeats error:", error);
    return [];
  }

  const set = new Set();

  (data || []).forEach((r) => {
    const seats = r?.posti_a_sedere;

    // jsonb array atteso
    if (Array.isArray(seats)) {
      seats.forEach((s) => set.add(String(s)));
      return;
    }

    // fallback: se per qualche motivo arrivasse stringa JSON
    if (typeof seats === "string") {
      try {
        const arr = JSON.parse(seats);
        if (Array.isArray(arr)) arr.forEach((s) => set.add(String(s)));
      } catch {}
    }
  });

  // ordina numericamente se possibile
  return [...set].sort((a, b) => Number(a) - Number(b));
}

export async function createBooking({ percorso_id, nome_cognome, telefono, posti_a_sedere }) {
  const payload = {
    percorso_id,
    nome_cognome,
    telefono,
    posti_a_sedere, // array -> jsonb
  };

  const { error } = await supabase.from("prenotazioni").insert(payload);

  if (error) {
    console.error("createBooking error:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
