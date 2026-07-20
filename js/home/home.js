import { calcularEdad, formatearEdad } from "../baby/baby.js";
import { obtenerDesarrolloSemanal } from "../content/weeklyDevelopment.js";
import { obtenerActividadDeHoy } from "../content/activities.js";
import { obtenerProximoHito } from "../content/milestones.js";
import { obtenerConsejoDelDia } from "../content/momTips.js";
import { obtenerMensajeDelDia } from "../content/motivationalMessages.js";
import { obtenerProximaVacuna } from "../content/vaccines.js";
import { tienePremiumActivo } from "../premium/premium.js";

// El corazón de la aplicación: junta todos los módulos de
// contenido según la edad exacta del bebé y arma un solo objeto
// listo para pintar en la pantalla de Home. Cada pieza de
// contenido es independiente — si una falla, el resto de la
// guía del día se sigue mostrando igual.
export async function construirGuiaDelDia({ profileId, baby, hoy = new Date() }) {
  const edad = calcularEdad(baby.fecha_nacimiento, hoy);
  const edadTexto = formatearEdad(edad);

  const resultados = await Promise.allSettled([
    obtenerDesarrolloSemanal(edad.totalSemanas),
    obtenerActividadDeHoy(edad.totalSemanas, hoy),
    obtenerProximoHito(edad.totalSemanas),
    obtenerConsejoDelDia(edad.totalSemanas, hoy),
    obtenerMensajeDelDia(hoy),
    obtenerProximaVacuna("CO", Math.floor(edad.totalSemanas / 4.345)),
    tienePremiumActivo(profileId),
  ]);

  const valor = (r) => (r.status === "fulfilled" ? r.value : null);

  return {
    edad,
    edadTexto,
    desarrolloSemanal: valor(resultados[0]),
    actividadDeHoy: valor(resultados[1]),
    proximoHito: valor(resultados[2]),
    consejoDelDia: valor(resultados[3]),
    mensajeDelDia: valor(resultados[4]),
    proximaVacuna: valor(resultados[5]),
    esPremium: Boolean(valor(resultados[6])),
  };
}
