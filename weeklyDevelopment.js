import { supabase } from "../supabaseClient.js";

// Devuelve el contenido de desarrollo semanal más cercano
// (sin pasarse) a la edad actual del bebé, en semanas.
export async function obtenerDesarrolloSemanal(edadSemanas) {
  const { data, error } = await supabase
    .from("weekly_development")
    .select("*")
    .lte("edad_semanas", edadSemanas)
    .order("edad_semanas", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
