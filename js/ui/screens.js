// Plantillas de HTML para cada pantalla. Se mantienen separadas
// de la lógica (app.js) para que el diseño se pueda ajustar sin
// tocar las llamadas a Supabase.

export function pantallaBienvenida() {
  return `
    <section class="pantalla pantalla--centrada">
      <div class="marca">
        <div class="marca__icono" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="40" height="40">
            <circle cx="24" cy="24" r="22" fill="var(--color-violeta)"/>
            <path d="M24 14c-5 0-8 4-8 9 0 6 4 10 8 12 4-2 8-6 8-12 0-5-3-9-8-9z" fill="var(--color-crema)"/>
          </svg>
        </div>
        <h1>Mi Bebé Crece</h1>
      </div>
      <p class="subtitulo">Una pequeña guía diaria para acompañarte en el primer año de tu bebé.</p>
      <button id="btn-comenzar" class="boton boton--principal">Comenzar</button>
    </section>
  `;
}

export function pantallaAuth(modo = "login") {
  const esLogin = modo === "login";
  return `
    <section class="pantalla pantalla--centrada">
      <h1 class="titulo-mediano">${esLogin ? "Bienvenida de nuevo" : "Creá tu cuenta"}</h1>
      <p class="subtitulo">${esLogin ? "Ingresá para continuar tu guía diaria." : "Empecemos a acompañarte, un día a la vez."}</p>
      <form id="form-auth" class="formulario">
        <label class="campo">
          <span>Correo electrónico</span>
          <input type="email" id="input-email" required autocomplete="email" />
        </label>
        <label class="campo">
          <span>Contraseña</span>
          <input type="password" id="input-password" required minlength="6" autocomplete="${esLogin ? "current-password" : "new-password"}" />
        </label>
        <p id="auth-error" class="texto-error" role="alert" hidden></p>
        <button type="submit" class="boton boton--principal">${esLogin ? "Ingresar" : "Crear cuenta"}</button>
      </form>
      <button id="btn-cambiar-modo" class="enlace">
        ${esLogin ? "¿Todavía no tenés cuenta? Creala acá" : "¿Ya tenés cuenta? Ingresá acá"}
      </button>
    </section>
  `;
}

export function pantallaOnboardingBebe() {
  return `
    <section class="pantalla pantalla--centrada">
      <h1 class="titulo-mediano">Contanos sobre tu bebé</h1>
      <p class="subtitulo">Así podemos preparar contenido para su edad exacta.</p>
      <form id="form-bebe" class="formulario">
        <label class="campo">
          <span>Nombre del bebé</span>
          <input type="text" id="input-nombre-bebe" required />
        </label>
        <label class="campo">
          <span>Fecha de nacimiento</span>
          <input type="date" id="input-fecha-bebe" required />
        </label>
        <button type="submit" class="boton boton--principal">Comenzar mi guía diaria</button>
      </form>
    </section>
  `;
}

export function tarjetaCargando(texto = "Preparando la guía de hoy…") {
  return `<div class="tarjeta tarjeta--cargando"><p>${texto}</p></div>`;
}

function tarjetaPremiumBloqueada(titulo) {
  return `
    <article class="tarjeta tarjeta--bloqueada">
      <h3>${titulo}</h3>
      <p>Este contenido es parte de Mi Bebé Crece Premium.</p>
      <span class="etiqueta etiqueta--premium">Premium</span>
    </article>
  `;
}

export function pantallaHome({ babyName, guia }) {
  const {
    edadTexto,
    desarrolloSemanal,
    actividadDeHoy,
    proximoHito,
    consejoDelDia,
    mensajeDelDia,
    proximaVacuna,
    esPremium,
  } = guia;

  const actividadBloqueada = actividadDeHoy?.es_premium && !esPremium;
  const mensajeBloqueado = mensajeDelDia?.es_premium && !esPremium;

  return `
    <section class="pantalla">
      <header class="encabezado-home">
        <div>
          <p class="saludo">Hola, mamá de ${babyName}</p>
          <p class="edad-actual">${edadTexto}</p>
        </div>
        <button id="btn-config" class="boton-icono" aria-label="Configuración">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14 3h-4l-.6 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
        </button>
      </header>

      <article class="tarjeta tarjeta--desarrollo">
        <span class="etiqueta">Esta semana</span>
        <h2>${desarrolloSemanal?.titulo ?? "Cada semana trae algo nuevo"}</h2>
        <p>${desarrolloSemanal?.que_esta_pasando ?? "Muy pronto vamos a tener contenido para esta etapa."}</p>
        ${desarrolloSemanal ? `<p class="texto-secundario"><strong>Qué esperar:</strong> ${desarrolloSemanal.que_esperar_esta_etapa}</p>` : ""}
      </article>

      <article class="tarjeta tarjeta--actividad">
        <span class="etiqueta">Actividad de hoy</span>
        ${
          !actividadDeHoy
            ? "<p>Todavía no hay una actividad cargada para esta edad.</p>"
            : actividadBloqueada
            ? tarjetaPremiumBloqueada(actividadDeHoy.titulo)
            : `
              <h2>${actividadDeHoy.titulo}</h2>
              <dl class="lista-actividad">
                <dt>Cómo hacerlo</dt><dd>${actividadDeHoy.como_hacerla}</dd>
                <dt>Duración</dt><dd>${actividadDeHoy.duracion_min} minutos</dd>
                <dt>Beneficios</dt><dd>${actividadDeHoy.beneficios}</dd>
                <dt>Qué observar después</dt><dd>${actividadDeHoy.que_observar}</dd>
              </dl>
            `
        }
      </article>

      <div class="fila-tarjetas">
        <article class="tarjeta tarjeta--chica">
          <span class="etiqueta">Consejo para mamá</span>
          <p>${consejoDelDia?.texto ?? "Vas a encontrar un consejo nuevo cada día."}</p>
        </article>
        <article class="tarjeta tarjeta--chica">
          <span class="etiqueta">Mensaje del día</span>
          ${
            mensajeBloqueado
              ? tarjetaPremiumBloqueada("Mensaje del día")
              : `<p>${mensajeDelDia?.texto ?? "Hoy es un buen día para disfrutar a tu bebé."}</p>`
          }
        </article>
      </div>

      <div class="fila-tarjetas">
        <article class="tarjeta tarjeta--chica">
          <span class="etiqueta">Próximo hito</span>
          <p>${proximoHito ? proximoHito.titulo : "Vas a ver acá el próximo paso en su desarrollo."}</p>
        </article>
        <article class="tarjeta tarjeta--chica">
          <span class="etiqueta">Próxima vacuna</span>
          <p>${proximaVacuna ? `${proximaVacuna.nombre_vacuna} (${proximaVacuna.dosis ?? ""})` : "Al día según el calendario."}</p>
        </article>
      </div>

      <p class="aviso-legal">Mi Bebé Crece acompaña y organiza información. No reemplaza el control médico ni brinda diagnósticos.</p>
    </section>
  `;
}

export function pantallaLineaDeTiempo({ babyName, etapas }) {
  const items = etapas
    .map((e) => {
      const estado = e.esActual ? "actual" : e.completado ? "completado" : "pendiente";
      const hitosHtml = e.hitos.length
        ? `<ul class="hitos-del-mes">${e.hitos.map((h) => `<li>${h.titulo}</li>`).join("")}</ul>`
        : "";
      return `
        <li class="etapa etapa--${estado}">
          <div class="etapa__punto" aria-hidden="true"></div>
          <div class="etapa__contenido">
            <p class="etapa__mes">Mes ${e.mes}</p>
            <h3>${e.nombre_etapa}</h3>
            <p class="texto-secundario">${e.descripcion_corta}</p>
            ${hitosHtml}
          </div>
        </li>
      `;
    })
    .join("");

  return `
    <section class="pantalla">
      <header class="encabezado-simple">
        <h1 class="titulo-mediano">El primer año de ${babyName}</h1>
        <p class="subtitulo">Así se ve el camino, mes a mes.</p>
      </header>
      <ol class="linea-de-tiempo">${items}</ol>
    </section>
  `;
}

export function pantallaConfiguracion({ email, babyName, fechaNacimiento, estadoSuscripcion }) {
  return `
    <section class="pantalla">
      <header class="encabezado-simple">
        <h1 class="titulo-mediano">Configuración</h1>
      </header>

      <article class="tarjeta">
        <span class="etiqueta">Tu cuenta</span>
        <p>${email}</p>
      </article>

      <article class="tarjeta">
        <span class="etiqueta">Tu bebé</span>
        <form id="form-editar-bebe" class="formulario">
          <label class="campo">
            <span>Nombre</span>
            <input type="text" id="input-editar-nombre" value="${babyName}" required />
          </label>
          <label class="campo">
            <span>Fecha de nacimiento</span>
            <input type="date" id="input-editar-fecha" value="${fechaNacimiento}" required />
          </label>
          <button type="submit" class="boton boton--secundario">Guardar cambios</button>
        </form>
      </article>

      <article class="tarjeta">
        <span class="etiqueta">Suscripción</span>
        <p>Estado actual: <strong>${estadoSuscripcion}</strong></p>
        <p class="texto-secundario">La activación de Mi Bebé Crece Premium se gestiona por ahora de forma manual mientras validamos el producto.</p>
      </article>

      <article class="tarjeta">
        <p class="texto-secundario">Mi Bebé Crece es una herramienta de acompañamiento y organización. No brinda diagnósticos ni reemplaza la consulta con profesionales de la salud.</p>
      </article>

      <button id="btn-cerrar-sesion" class="boton boton--texto">Cerrar sesión</button>
    </section>
  `;
}

export function navegacionInferior(pantallaActiva) {
  const item = (id, etiqueta, ruta) => `
    <button class="nav-item ${pantallaActiva === ruta ? "nav-item--activo" : ""}" data-ruta="${ruta}">
      <span>${etiqueta}</span>
    </button>
  `;
  return `
    <nav class="nav-inferior" aria-label="Navegación principal">
      ${item("inicio", "Inicio", "home")}
      ${item("timeline", "Mi año", "timeline")}
      ${item("config", "Configuración", "settings")}
    </nav>
  `;
}
