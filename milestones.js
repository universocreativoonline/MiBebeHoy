import { supabase } from "../supabaseClient.js";

// Próximo hito: el primero cuya edad aproximada sea mayor o
// igual a la edad actual del bebé.
export async function obtenerProximoHito(edadSemanas) {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .gte("edad_semanas_aprox", edadSemanas)
    .order("edad_semanas_aprox", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Todos los hitos ordenados, usados en "El primer año de mi bebé"
// para marcar cuáles ya se alcanzaron.
export async function obtenerTodosLosHitos() {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .order("edad_semanas_aprox", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
