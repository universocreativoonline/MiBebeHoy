import { supabase } from "../supabaseClient.js";

// Crea una cuenta nueva. Supabase se encarga de crear el perfil
// y la suscripción gratuita automáticamente (ver trigger en db/schema.sql).
export async function registrarse(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function obtenerSesionActual() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Ejecuta un callback cada vez que cambia el estado de sesión
// (login, logout, token refrescado).
export function alCambiarSesion(callback) {
  supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
