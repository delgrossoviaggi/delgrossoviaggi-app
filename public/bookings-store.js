import { supabase } from "./supabase.js";

export async function addBooking(payload) {
  const { data, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listBookings({ routeId } = {}) {
  let q = supabase
    .from("bookings")
    .select("id,created_at,route_id,full_name,phone,seats,bus_type,routes(name)")
    .order("created_at", { ascending: false });

  if (routeId) q = q.eq("route_id", routeId);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getOccupiedSeats({ routeId, busType }) {
  let q = supabase.from("bookings").select("seats");
  if (routeId) q = q.eq("route_id", routeId);
  if (busType) q = q.eq("bus_type", busType);

  const { data, error } = await q;
  if (error) throw error;

  const occ = new Set();
  (data || []).forEach((r) => {
    (r.seats || []).forEach((s) => occ.add(Number(s)));
  });
  return occ;
}
