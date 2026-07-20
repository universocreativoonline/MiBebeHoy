-- =========================================================
-- Mi Bebé Crece — esquema de base de datos para Supabase
-- =========================================================
-- Cómo usar este archivo:
-- 1. Entrá a tu proyecto de Supabase → SQL Editor → New query.
-- 2. Pegá todo este archivo y ejecutalo una sola vez.
-- 3. Repetirlo no debería romper nada (usa "if not exists" /
--    "on conflict") pero no hace falta correrlo dos veces.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Extensiones necesarias
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 2. Tabla de perfiles (una fila por usuaria)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  pais text not null default 'CO',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: la usuaria ve su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: la usuaria edita su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: la usuaria crea su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------
-- 3. Tabla de bebés (una mamá puede tener uno o más)
-- ---------------------------------------------------------
create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  nombre text not null,
  fecha_nacimiento date not null,
  created_at timestamptz not null default now()
);

alter table public.babies enable row level security;

create policy "babies: la usuaria ve sus propios bebés"
  on public.babies for select
  using (auth.uid() = profile_id);

create policy "babies: la usuaria administra sus propios bebés"
  on public.babies for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------------------------------------------------------
-- 4. Suscripciones / estado Premium
-- ---------------------------------------------------------
create table if not exists public.subscriptions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  estado text not null default 'gratuita'
    check (estado in ('gratuita', 'trial_ebook', 'activa', 'vencida')),
  premium_desde date,
  premium_hasta date,
  origen_activacion text,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: la usuaria ve su propia suscripción"
  on public.subscriptions for select
  using (auth.uid() = profile_id);

-- La escritura normal de esta tabla la hace la Edge Function
-- "activar-premium" con la service_role key, no el frontend.
-- Por eso no hay política de insert/update para usuarias comunes.

-- Función para saber si una usuaria tiene Premium activo hoy
create or replace function public.is_premium(p_profile_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.subscriptions
    where profile_id = p_profile_id
      and estado in ('trial_ebook', 'activa')
      and premium_hasta >= current_date
  );
$$;

-- Trigger: al crear una usuaria en auth.users, crear su perfil
-- y su fila de suscripción gratuita automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.subscriptions (profile_id, estado)
  values (new.id, 'gratuita')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 5. Módulos de contenido (editables sin publicar la app)
-- ---------------------------------------------------------

-- 5a. Desarrollo semanal
create table if not exists public.weekly_development (
  id uuid primary key default gen_random_uuid(),
  edad_semanas int not null,
  titulo text not null,
  que_esta_pasando text not null,
  que_esperar_esta_etapa text not null
);

-- 5b. Actividades (estructura fija: qué / cómo / duración / beneficios / qué observar)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  edad_semanas_desde int not null,
  edad_semanas_hasta int not null,
  titulo text not null,
  como_hacerla text not null,
  duracion_min int not null,
  beneficios text not null,
  que_observar text not null,
  es_premium boolean not null default false
);

-- 5c. Hitos del desarrollo
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  edad_semanas_aprox int not null,
  titulo text not null,
  descripcion text not null
);

-- 5d. Consejos para mamá
create table if not exists public.mom_tips (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  edad_semanas_desde int default 0,
  edad_semanas_hasta int default 52
);

-- 5e. Mensajes motivacionales (rotan independientes de la edad)
create table if not exists public.motivational_messages (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  es_premium boolean not null default false
);

-- 5f. Etapas del primer año (para la pantalla "El primer año de mi bebé")
create table if not exists public.monthly_stages (
  mes int primary key check (mes between 0 and 12),
  nombre_etapa text not null,
  descripcion_corta text not null
);

-- 5g. Calendario de vacunas, por país
create table if not exists public.vaccines_schedule (
  id uuid primary key default gen_random_uuid(),
  pais text not null default 'CO',
  edad_meses numeric not null,
  nombre_vacuna text not null,
  dosis text,
  fuente text
);

-- 5h. Configuración de países soportados
create table if not exists public.countries_config (
  pais text primary key,
  nombre text not null,
  fuente_calendario_oficial text,
  activo boolean not null default true
);

-- Todas las tablas de contenido son de solo lectura pública
-- (no tienen datos personales). La escritura la hacés vos desde
-- el editor de tablas de Supabase Studio.
alter table public.weekly_development enable row level security;
alter table public.activities enable row level security;
alter table public.milestones enable row level security;
alter table public.mom_tips enable row level security;
alter table public.motivational_messages enable row level security;
alter table public.monthly_stages enable row level security;
alter table public.vaccines_schedule enable row level security;
alter table public.countries_config enable row level security;

create policy "contenido público de lectura" on public.weekly_development for select using (true);
create policy "contenido público de lectura" on public.activities for select using (true);
create policy "contenido público de lectura" on public.milestones for select using (true);
create policy "contenido público de lectura" on public.mom_tips for select using (true);
create policy "contenido público de lectura" on public.motivational_messages for select using (true);
create policy "contenido público de lectura" on public.monthly_stages for select using (true);
create policy "contenido público de lectura" on public.vaccines_schedule for select using (true);
create policy "contenido público de lectura" on public.countries_config for select using (true);

-- ---------------------------------------------------------
-- 6. Datos de ejemplo (demo) para poder probar la app ya mismo
-- ---------------------------------------------------------

insert into public.countries_config (pais, nombre, fuente_calendario_oficial, activo)
values ('CO', 'Colombia', 'https://vacunacion.minsalud.gov.co', true)
on conflict (pais) do nothing;

insert into public.weekly_development (edad_semanas, titulo, que_esta_pasando, que_esperar_esta_etapa) values
(1, 'Bienvenido al mundo', 'Tu bebé está aprendiendo a reconocer tu voz y tu olor.', 'Es normal que duerma la mayor parte del día y despierte para alimentarse cada pocas horas.'),
(4, 'Primeras sonrisas', 'El sistema nervioso empieza a madurar y aparecen los primeros movimientos más suaves.', 'Puede empezar a sostener la cabeza por instantes cortos cuando está boca abajo.'),
(8, 'Más alerta cada día', 'Tu bebé empieza a seguir objetos con la mirada y a responder a sonidos conocidos.', 'Es normal que las siestas se acorten un poco y esté más despierto durante el día.'),
(12, 'Descubriendo sus manos', 'Empieza a mirarse las manos y a llevárselas a la boca.', 'Puede sonreír de forma más clara en respuesta a tu voz o tu cara.')
on conflict do nothing;

insert into public.activities (edad_semanas_desde, edad_semanas_hasta, titulo, como_hacerla, duracion_min, beneficios, que_observar, es_premium) values
(0, 4, 'Tiempo boca abajo', 'Acostá a tu bebé boca abajo sobre tu pecho o una manta, siempre despierto y bajo supervisión.', 5, 'Fortalece el cuello y los hombros, y prepara el cuerpo para sostener la cabeza.', 'Si levanta la cabeza aunque sea un segundo, o si se cansa y llora antes de tiempo.', false),
(4, 8, 'Seguimiento visual', 'Movete lentamente de un lado a otro frente a su cara, a unos 30 cm de distancia.', 5, 'Estimula la vista y el seguimiento con los ojos, base para la coordinación futura.', 'Si sus ojos te siguen o si prefiere mirar hacia un solo lado.', false),
(8, 12, 'Conversación de sonidos', 'Cuando tu bebé haga un sonido, respondé imitándolo y hacé una pausa para que responda.', 8, 'Sienta las bases del lenguaje y del turno para hablar.', 'Los sonidos que empieza a repetir y si espera tu respuesta.', true)
on conflict do nothing;

insert into public.milestones (edad_semanas_aprox, titulo, descripcion) values
(6, 'Primera sonrisa social', 'Tu bebé sonríe en respuesta a tu voz o tu cara, no solo por reflejo.'),
(16, 'Sostiene la cabeza con firmeza', 'Puede mantener la cabeza erguida sin apoyo mientras está sentado en tu brazo.'),
(26, 'Se sienta con apoyo', 'Empieza a mantenerse sentado usando las manos como apoyo.'),
(40, 'Primeras palabras con sentido', 'Puede empezar a decir "mamá" o "papá" dirigido a vos.')
on conflict do nothing;

insert into public.mom_tips (texto, edad_semanas_desde, edad_semanas_hasta) values
('Está bien no tener todas las respuestas hoy. Vas aprendiendo junto con tu bebé.', 0, 52),
('Si podés, descansá cuando tu bebé descansa. El resto puede esperar.', 0, 12),
('Pedir ayuda no es una debilidad, es una forma de cuidarte para poder cuidar mejor.', 0, 52)
on conflict do nothing;

insert into public.motivational_messages (texto, es_premium) values
('Hoy no necesitás ser una mamá perfecta, solo la mamá de tu bebé.', false),
('Cada pequeño momento de hoy es parte de algo que están construyendo juntos.', false),
('Vas mejor de lo que creés. Tu bebé no necesita perfección, te necesita a vos.', true)
on conflict do nothing;

insert into public.monthly_stages (mes, nombre_etapa, descripcion_corta) values
(0, 'Recién nacido', 'Conociéndose mutuamente, sueño y alimentación frecuentes.'),
(1, 'Primer mes', 'Empiezan las primeras sonrisas y más tiempo despierto.'),
(2, 'Segundo mes', 'Mayor seguimiento visual y sonidos más variados.'),
(3, 'Tercer mes', 'Más control de cabeza y cuello.'),
(4, 'Cuarto mes', 'Curiosidad creciente por manos y objetos cercanos.'),
(5, 'Quinto mes', 'Puede empezar a girar sobre su cuerpo.'),
(6, 'Sexto mes', 'Se acerca el momento de sentarse con apoyo.'),
(7, 'Séptimo mes', 'Explora sonidos y texturas con más intención.'),
(8, 'Octavo mes', 'Empieza a desplazarse o gatear.'),
(9, 'Noveno mes', 'Se sostiene de pie con apoyo.'),
(10, 'Décimo mes', 'Entiende palabras simples y gestos.'),
(11, 'Undécimo mes', 'Puede dar sus primeros pasos con apoyo.'),
(12, 'Primer año', 'Un año de crecimiento enorme, ¡felicitaciones!')
on conflict (mes) do nothing;

-- Calendario oficial de vacunación de Colombia (PAI, Ministerio de Salud).
-- Verificá siempre las fechas y dosis vigentes en
-- https://vacunacion.minsalud.gov.co antes de usar esta tabla en producción,
-- porque el esquema puede actualizarse.
insert into public.vaccines_schedule (pais, edad_meses, nombre_vacuna, dosis, fuente) values
('CO', 0, 'BCG y Hepatitis B', 'Dosis única al nacer', 'PAI - MinSalud Colombia'),
('CO', 2, 'Pentavalente, Polio, Rotavirus, Neumococo', '1ª dosis', 'PAI - MinSalud Colombia'),
('CO', 4, 'Pentavalente, Polio, Rotavirus, Neumococo', '2ª dosis', 'PAI - MinSalud Colombia'),
('CO', 6, 'Pentavalente, Polio', '3ª dosis', 'PAI - MinSalud Colombia'),
('CO', 12, 'Triple viral, Neumococo (refuerzo)', 'Dosis única / refuerzo', 'PAI - MinSalud Colombia')
on conflict do nothing;

-- =========================================================
-- Fin del esquema. Recordá revisar y actualizar el contenido
-- editorial y el calendario de vacunas desde Supabase Studio
-- (Table Editor) sin necesidad de tocar código ni republicar.
-- =========================================================
