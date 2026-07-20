import { supabase } from "../supabaseClient.js";

// Crea o actualiza el perfil del bebé para la usuaria actual.
export async function guardarBebe(profileId, nombre, fechaNacimiento) {
  const existente = await obtenerBebe(profileId);

  if (existente) {
    const { data, error } = await supabase
      .from("babies")
      .update({ nombre, fecha_nacimiento: fechaNacimiento })
      .eq("id", existente.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("babies")
    .insert({ profile_id: profileId, nombre, fecha_nacimiento: fechaNacimiento })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Trae el primer (y por ahora único) bebé de la usuaria.
export async function obtenerBebe(profileId) {
  const { data, error } = await supabase
    .from("babies")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// -----------------------------------------------------------
// Cálculo de edad. Internamente todo el contenido se maneja en
// semanas, pero la mamá SIEMPRE ve meses, semanas y días — la
// forma natural en que habla de la edad de su bebé.
// -----------------------------------------------------------

// Devuelve { meses, semanas, dias, totalDias, totalSemanas }
export function calcularEdad(fechaNacimientoISO, hoy = new Date()) {
  const nacimiento = new Date(fechaNacimientoISO + "T00:00:00");
  const hoyLimpio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const nacLimpio = new Date(
    nacimiento.getFullYear(),
    nacimiento.getMonth(),
    nacimiento.getDate()
  );

  const totalDias = Math.max(
    0,
    Math.round((hoyLimpio - nacLimpio) / (1000 * 60 * 60 * 24))
  );
  const totalSemanas = Math.floor(totalDias / 7);

  // Meses y días "de calendario" (más natural para la mamá que
  // simplemente dividir por 30).
  let meses =
    (hoyLimpio.getFullYear() - nacLimpio.getFullYear()) * 12 +
    (hoyLimpio.getMonth() - nacLimpio.getMonth());
  let fechaMasMeses = new Date(nacLimpio);
  fechaMasMeses.setMonth(fechaMasMeses.getMonth() + meses);
  if (fechaMasMeses > hoyLimpio) {
    meses -= 1;
    fechaMasMeses = new Date(nacLimpio);
    fechaMasMeses.setMonth(fechaMasMeses.getMonth() + meses);
  }
  const diasRestantes = Math.round(
    (hoyLimpio - fechaMasMeses) / (1000 * 60 * 60 * 24)
  );
  const semanasRestantes = Math.floor(diasRestantes / 7);
  const diasSueltos = diasRestantes % 7;

  return {
    meses: Math.max(0, meses),
    semanas: semanasRestantes,
    dias: diasSueltos,
    totalDias,
    totalSemanas,
  };
}

// Texto amigable para mostrar en el Home, ej: "3 meses y 2 semanas"
export function formatearEdad(edad) {
  const partes = [];
  if (edad.meses > 0) {
    partes.push(`${edad.meses} ${edad.meses === 1 ? "mes" : "meses"}`);
  }
  if (edad.semanas > 0 || edad.meses === 0) {
    partes.push(`${edad.semanas} ${edad.semanas === 1 ? "semana" : "semanas"}`);
  }
  if (edad.meses === 0 && edad.semanas === 0) {
    return `${edad.dias} ${edad.dias === 1 ? "día" : "días"}`;
  }
  return partes.join(" y ");
}
