import { supabase } from "../supabaseClient.js";

// Consulta el estado real de la suscripción de la usuaria.
export async function obtenerSuscripcion(profileId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Usa la función SQL is_premium(), que es la única fuente de
// verdad sobre si el acceso Premium está activo hoy. La misma
// regla se refuerza además con RLS en el contenido marcado
// es_premium, así que aunque el frontend se equivoque, el
// contenido protegido no se filtra.
export async function tienePremiumActivo(profileId) {
  const { data, error } = await supabase.rpc("is_premium", {
    p_profile_id: profileId,
  });
  if (error) throw error;
  return Boolean(data);
}
