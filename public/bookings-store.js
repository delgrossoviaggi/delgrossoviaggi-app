import { supabase } from "./supabase.js";

export async function addBooking(payload) {
  const { data, error } = await supabase.from("bookings").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function getOccupiedSeats({ tripKey, travelDate, busType }) {
  let q = supabase.from("bookings").select("seats");
  if (tripKey) q = q.eq("trip_key", tripKey);
  if (travelDate) q = q.eq("travel_date", travelDate);
  if (busType) q = q.eq("bus_type", busType);

  const { data, error } = await q;
  if (error) throw error;

  const occ = new Set();
  (data || []).forEach(r => (r.seats || []).forEach(s => occ.add(Number(s))));
  return occ;
}

export async function listBookings({ tripKey } = {}) {
  let q = supabase.from("bookings").select("*").order("created_at", { ascending: false });
  if (tripKey) q = q.eq("trip_key", tripKey);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
