import { supabase } from "../supabaseClient.js";
import { obtenerTodosLosHitos } from "../content/milestones.js";

// Datos para "El primer año de mi bebé": las 13 etapas
// (mes 0 a mes 12) junto con los hitos que caen en cada una,
// y cuál es el mes actual del bebé para resaltarlo visualmente.
export async function construirLineaDeTiempo(edadMeses) {
  const { data: etapas, error } = await supabase
    .from("monthly_stages")
    .select("*")
    .order("mes", { ascending: true });
  if (error) throw error;

  const hitos = await obtenerTodosLosHitos();

  const mesActual = Math.min(12, Math.max(0, Math.floor(edadMeses)));

  const etapasConHitos = (etapas ?? []).map((etapa) => {
    const hitosDelMes = hitos.filter((h) => {
      const mesDelHito = Math.round(h.edad_semanas_aprox / 4.345);
      return mesDelHito === etapa.mes;
    });
    return {
      ...etapa,
      hitos: hitosDelMes,
      completado: etapa.mes < mesActual,
      esActual: etapa.mes === mesActual,
    };
  });

  return { etapas: etapasConHitos, mesActual };
}
