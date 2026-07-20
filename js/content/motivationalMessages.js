import { supabase } from "../supabaseClient.js";

// Los mensajes motivacionales rotan por día, independientes de
// la edad del bebé. Los marcados es_premium solo se muestran si
// la usuaria tiene acceso Premium activo (el gating se aplica en
// el módulo home/, no acá).
export async function obtenerMensajeDelDia(fecha = new Date()) {
  const { data, error } = await supabase
    .from("motivational_messages")
    .select("*");
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const diaDelAnio = Math.floor(
    (fecha - new Date(fecha.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return data[diaDelAnio % data.length];
}
