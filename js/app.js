import { supabase } from "./supabaseClient.js";
import { registrarse, iniciarSesion, cerrarSesion, obtenerSesionActual } from "./auth/auth.js";
import { guardarBebe, obtenerBebe, calcularEdad } from "./baby/baby.js";
import { construirGuiaDelDia } from "./home/home.js";
import { construirLineaDeTiempo } from "./timeline/timeline.js";
import { obtenerSuscripcion } from "./premium/premium.js";
import {
  pantallaBienvenida,
  pantallaAuth,
  pantallaOnboardingBebe,
  pantallaHome,
  pantallaLineaDeTiempo,
  pantallaConfiguracion,
  tarjetaCargando,
  navegacionInferior,
} from "./ui/screens.js";

const app = document.getElementById("app");
const navContainer = document.getElementById("nav-inferior-contenedor");

const estado = {
  session: null,
  profile: null,
  baby: null,
  authMode: "login",
};

async function iniciar() {
  estado.session = await obtenerSesionActual();
  await enrutar();
}

async function enrutar() {
  if (!estado.session) {
    navContainer.innerHTML = "";
    return mostrarBienvenidaOAuth();
  }

  if (!estado.baby) {
    estado.baby = await obtenerBebe(estado.session.user.id);
  }

  if (!estado.baby) {
    navContainer.innerHTML = "";
    return mostrarOnboardingBebe();
  }

  const ruta = location.hash.replace("#", "") || "home";
  navContainer.innerHTML = navegacionInferior(ruta);
  cablearNavegacion();

  if (ruta === "timeline") return mostrarLineaDeTiempo();
  if (ruta === "settings") return mostrarConfiguracion();
  return mostrarHome();
}

function cablearNavegacion() {
  navContainer.querySelectorAll(".nav-item").forEach((boton) => {
    boton.addEventListener("click", () => {
      location.hash = boton.dataset.ruta;
    });
  });
}

// -------------------- Pantalla: bienvenida / auth --------------------

function mostrarBienvenidaOAuth() {
  if (!estado.mostrandoAuth) {
    app.innerHTML = pantallaBienvenida();
    document.getElementById("btn-comenzar").addEventListener("click", () => {
      estado.mostrandoAuth = true;
      mostrarBienvenidaOAuth();
    });
    return;
  }

  app.innerHTML = pantallaAuth(estado.authMode);

  document.getElementById("form-auth").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("input-email").value.trim();
    const password = document.getElementById("input-password").value;
    const errorBox = document.getElementById("auth-error");
    errorBox.hidden = true;

    try {
      if (estado.authMode === "login") {
        const { session } = await iniciarSesion(email, password);
        estado.session = session;
      } else {
        const { session } = await registrarse(email, password);
        estado.session = session;
        if (!session) {
          errorBox.hidden = false;
          errorBox.textContent =
            "Te enviamos un correo para confirmar tu cuenta. Confirmalo y volvé a ingresar.";
          return;
        }
      }
      await enrutar();
    } catch (err) {
      errorBox.hidden = false;
      errorBox.textContent = traducirErrorAuth(err.message);
    }
  });

  document.getElementById("btn-cambiar-modo").addEventListener("click", () => {
    estado.authMode = estado.authMode === "login" ? "signup" : "login";
    mostrarBienvenidaOAuth();
  });
}

function traducirErrorAuth(mensaje) {
  if (mensaje.includes("Invalid login")) return "Correo o contraseña incorrectos.";
  if (mensaje.includes("already registered")) return "Ese correo ya tiene una cuenta.";
  return "Ocurrió un problema. Intentá de nuevo en un momento.";
}

// -------------------- Pantalla: onboarding del bebé --------------------

function mostrarOnboardingBebe() {
  app.innerHTML = pantallaOnboardingBebe();
  document.getElementById("form-bebe").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("input-nombre-bebe").value.trim();
    const fecha = document.getElementById("input-fecha-bebe").value;
    estado.baby = await guardarBebe(estado.session.user.id, nombre, fecha);
    location.hash = "home";
    await enrutar();
  });
}

// -------------------- Pantalla: Home --------------------

async function mostrarHome() {
  app.innerHTML = tarjetaCargando("Preparando la guía de hoy…");
  try {
    const guia = await construirGuiaDelDia({
      profileId: estado.session.user.id,
      baby: estado.baby,
    });
    app.innerHTML = pantallaHome({ babyName: estado.baby.nombre, guia });
    document.getElementById("btn-config")?.addEventListener("click", () => {
      location.hash = "settings";
    });
  } catch (err) {
    app.innerHTML = `<section class="pantalla"><p class="texto-error">No pudimos cargar la guía de hoy. Revisá tu conexión e intentá de nuevo.</p></section>`;
    console.error(err);
  }
}

// -------------------- Pantalla: El primer año --------------------

async function mostrarLineaDeTiempo() {
  app.innerHTML = tarjetaCargando("Armando el camino de tu bebé…");
  const edad = calcularEdad(estado.baby.fecha_nacimiento);
  const { etapas } = await construirLineaDeTiempo(edad.meses);
  app.innerHTML = pantallaLineaDeTiempo({ babyName: estado.baby.nombre, etapas });
}

// -------------------- Pantalla: Configuración --------------------

async function mostrarConfiguracion() {
  const suscripcion = await obtenerSuscripcion(estado.session.user.id);
  app.innerHTML = pantallaConfiguracion({
    email: estado.session.user.email,
    babyName: estado.baby.nombre,
    fechaNacimiento: estado.baby.fecha_nacimiento,
    estadoSuscripcion: suscripcion?.estado ?? "gratuita",
  });

  document.getElementById("form-editar-bebe").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("input-editar-nombre").value.trim();
    const fecha = document.getElementById("input-editar-fecha").value;
    estado.baby = await guardarBebe(estado.session.user.id, nombre, fecha);
    mostrarConfiguracion();
  });

  document.getElementById("btn-cerrar-sesion").addEventListener("click", async () => {
    await cerrarSesion();
    estado.session = null;
    estado.baby = null;
    estado.mostrandoAuth = false;
    location.hash = "";
    await enrutar();
  });
}

// -------------------- Arranque --------------------

window.addEventListener("hashchange", enrutar);

supabase.auth.onAuthStateChange((_event, session) => {
  estado.session = session;
});

iniciar();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("No se pudo registrar el service worker:", err);
    });
  });
}
