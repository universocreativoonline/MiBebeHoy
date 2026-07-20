import { supabase } from "../supabaseClient.js";

// Todas las actividades siguen siempre la misma estructura fija:
// qué vas a hacer, cómo hacerlo, duración, beneficios y qué observar.
// Esa estructura vive directamente en las columnas de la tabla
// "activities" (ver db/schema.sql), así que cualquier actividad
// nueva que cargues respeta el mismo formato sin esfuerzo extra.

// Trae todas las actividades apropiadas para la edad actual.
async function obtenerActividadesPorEdad(edadSemanas) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .lte("edad_semanas_desde", edadSemanas)
    .gte("edad_semanas_hasta", edadSemanas);
  if (error) throw error;
  return data ?? [];
}

// Elige la actividad de HOY de forma determinística: misma
// actividad todo el día, pero puede variar entre las opciones
// disponibles día a día, usando la fecha como semilla.
export async function obtenerActividadDeHoy(edadSemanas, fecha = new Date()) {
  const candidatas = await obtenerActividadesPorEdad(edadSemanas);
  if (candidatas.length === 0) return null;

  const diaDelAnio = Math.floor(
    (fecha - new Date(fecha.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const indice = diaDelAnio % candidatas.length;
  return candidatas[indice];
}
