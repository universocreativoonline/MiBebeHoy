import { supabase } from "../supabaseClient.js";

// Próxima vacuna según el país de la usuaria y la edad del bebé
// en meses. El calendario es por país para poder sumar otros
// países en el futuro sin tocar código (ver countries_config).
export async function obtenerProximaVacuna(pais, edadMeses) {
  const { data, error } = await supabase
    .from("vaccines_schedule")
    .select("*")
    .eq("pais", pais)
    .gte("edad_meses", edadMeses)
    .order("edad_meses", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function obtenerCalendarioCompleto(pais) {
  const { data, error } = await supabase
    .from("vaccines_schedule")
    .select("*")
    .eq("pais", pais)
    .order("edad_meses", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
