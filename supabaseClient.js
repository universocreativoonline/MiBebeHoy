// Inicializa un único cliente de Supabase para toda la app.
// Se carga desde un CDN en index.html (sin npm, sin build).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
