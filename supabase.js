import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Faltan las variables de entorno de Supabase. Revisa tu .env");
}

export const supabase = createClient(url, key);
