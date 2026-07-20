# Mi Bebé Crece

Una pequeña guía diaria para acompañar a las mamás durante el primer año de vida de su bebé: desarrollo semanal, actividades, hitos, consejos y calendario de vacunas — todo personalizado según la edad exacta del bebé.

Aplicación web estática (HTML, CSS y JavaScript, sin build ni Node) que se conecta a **Supabase** para autenticación y base de datos, y se publica gratis en **GitHub Pages**.

---

## 1. Creá tu proyecto de Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo (gratis).
2. Andá a **SQL Editor → New query**, pegá todo el contenido del archivo `db/schema.sql` de este proyecto y ejecutalo. Esto crea todas las tablas, la seguridad (RLS) y algunos datos de ejemplo para poder probar la app enseguida.
3. Andá a **Settings → API** y copiá:
   - **Project URL**
   - **anon public key**
4. Abrí el archivo `js/config.js` y reemplazá `SUPABASE_URL` y `SUPABASE_ANON_KEY` con esos valores.
5. Opcional pero recomendado: en **Authentication → Providers**, revisá que "Email" esté habilitado. Si no querés pedir confirmación de correo mientras probás, podés desactivar "Confirm email" en **Authentication → Settings**.

## 2. Probá la app localmente (opcional)

No hace falta ningún build. Podés simplemente abrir `index.html` en el navegador, o usar un servidor local simple, por ejemplo:

```
python3 -m http.server 8080
```

y entrar a `http://localhost:8080`.

## 3. Publicalo en GitHub Pages

1. Descomprimí este ZIP.
2. Creá un repositorio nuevo en GitHub y subí **todo** el contenido de la carpeta `mi-bebe-crece/` (el archivo `index.html` debe quedar en la raíz del repositorio, no dentro de una subcarpeta).
3. En el repositorio: **Settings → Pages → Deploy from a branch → Branch: main → /(root) → Save**.
4. Esperá uno o dos minutos y tu app va a estar disponible en `https://tu-usuario.github.io/nombre-del-repositorio/`.

## 4. Agregala a la pantalla de inicio (para que se sienta como una app)

- **iPhone (Safari):** abrí el enlace → botón de compartir → "Agregar a pantalla de inicio".
- **Android (Chrome):** abrí el enlace → menú (⋮) → "Agregar a pantalla de inicio" o "Instalar app".

## Estructura del proyecto

```
mi-bebe-crece/
├── index.html
├── styles.css
├── manifest.webmanifest
├── service-worker.js
├── db/
│   └── schema.sql          → esquema completo de Supabase (tablas, RLS, datos de ejemplo)
├── icons/
└── js/
    ├── config.js            → tus claves de Supabase (URL + anon key)
    ├── supabaseClient.js
    ├── auth/                → registro, login, sesión
    ├── baby/                → perfil del bebé y cálculo de edad (meses/semanas/días)
    ├── premium/              → estado de la suscripción
    ├── content/               → un archivo por cada módulo de contenido editorial
    ├── home/                   → arma la guía diaria combinando todos los módulos
    ├── timeline/                → arma "El primer año de mi bebé"
    └── ui/                        → plantillas de pantallas
```

## Cómo editar el contenido (sin tocar código ni republicar)

Todo el contenido editorial vive en Supabase, en tablas separadas por tipo:

- `weekly_development` — desarrollo semana a semana
- `activities` — actividades (siempre con: qué, cómo, duración, beneficios, qué observar)
- `milestones` — hitos del desarrollo
- `mom_tips` — consejos para mamá
- `motivational_messages` — mensajes del día
- `monthly_stages` — las 13 etapas de "El primer año de mi bebé"
- `vaccines_schedule` — calendario de vacunas, por país (`pais = 'CO'` para Colombia)

Para agregar o editar contenido, andá a **Supabase → Table Editor** y modificá las filas directamente. Los cambios se reflejan en la app al instante, sin necesidad de volver a publicar nada.

> **Importante sobre vacunas:** la tabla `vaccines_schedule` viene con algunas dosis de ejemplo del esquema colombiano (PAI). Antes de usarla en producción, verificá y completá las edades y dosis exactas contra la fuente oficial vigente: https://vacunacion.minsalud.gov.co — el esquema puede actualizarse con el tiempo.

## Cómo funciona el acceso Premium (por ahora, manual)

En esta primera versión no hay ninguna pasarela de pago conectada. El estado de cada usuaria vive en la tabla `subscriptions` (`estado`, `premium_desde`, `premium_hasta`, `origen_activacion`). Para darle acceso Premium a alguien manualmente mientras validás el producto, actualizá esa fila desde el Table Editor de Supabase.

Cuando quieras conectar un cobro real (por ejemplo desde Shopify, Hotmart o cualquier otra plataforma), la arquitectura ya está preparada: solo hace falta crear una Supabase Edge Function que reciba la activación desde un webhook externo y actualice `subscriptions` — no hace falta modificar el resto de la aplicación.

## Aviso importante

Mi Bebé Crece es una herramienta de acompañamiento y organización. No brinda diagnósticos médicos ni reemplaza la consulta con profesionales de la salud.

## Límites de esta primera versión (a propósito)

Para lanzar rápido y validar el producto, esta versión no incluye: registro de sueño/alimentación/pañales, cobro de suscripciones, multi-país activo en simultáneo, ni notificaciones. La base de datos ya está diseñada para agregar todo eso más adelante sin rehacer el proyecto.
