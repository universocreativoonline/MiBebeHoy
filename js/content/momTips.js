import { supabase } from "../supabaseClient.js";

export async function obtenerConsejoDelDia(edadSemanas, fecha = new Date()) {
  const { data, error } = await supabase
    .from("mom_tips")
    .select("*")
    .lte("edad_semanas_desde", edadSemanas)
    .gte("edad_semanas_hasta", edadSemanas);
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const diaDelAnio = Math.floor(
    (fecha - new Date(fecha.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return data[diaDelAnio % data.length];
}
