// ============================================================
// NUBA INCIDENCIAS — Supabase Client
// ============================================================
// Variables de entorno (.env.local / Vercel):
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=tu_anon_key
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: { persistSession: true, storageKey: "nuba-incidencias-session" },
});

// ============================================================
// SQL — Ejecutar en Supabase SQL Editor (una sola vez)
// ============================================================
//
// -- APARTAMENTOS
// CREATE TABLE IF NOT EXISTS apartamentos (
//   id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   nombre      TEXT NOT NULL UNIQUE,
//   capacidad   INTEGER DEFAULT 2,
//   created_at  TIMESTAMPTZ DEFAULT now()
// );
// ALTER TABLE apartamentos ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON apartamentos FOR ALL USING (true);
//
// -- RESERVAS / CALENDARIO
// CREATE TABLE IF NOT EXISTS reservas (
//   id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   apartamento_id  UUID REFERENCES apartamentos(id) ON DELETE CASCADE,
//   fecha_entrada   TIMESTAMPTZ NOT NULL,
//   fecha_salida    TIMESTAMPTZ NOT NULL,
//   huespedes       INTEGER DEFAULT 1,
//   notas           TEXT DEFAULT '',
//   created_at      TIMESTAMPTZ DEFAULT now()
// );
// ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON reservas FOR ALL USING (true);
//
// -- TAREAS PREVENTIVAS
// CREATE TABLE IF NOT EXISTS tareas_preventivas (
//   id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   apartamento_id  UUID REFERENCES apartamentos(id) ON DELETE CASCADE,
//   tarea           TEXT NOT NULL,
//   fecha           DATE,
//   estado          TEXT DEFAULT 'pendiente',
//   foto_url        TEXT,
//   notas           TEXT DEFAULT '',
//   created_at      TIMESTAMPTZ DEFAULT now()
// );
// ALTER TABLE tareas_preventivas ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON tareas_preventivas FOR ALL USING (true);
//
// -- AVERÍAS
// CREATE TABLE IF NOT EXISTS averias (
//   id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   apartamento_id    UUID REFERENCES apartamentos(id) ON DELETE CASCADE,
//   descripcion       TEXT NOT NULL,
//   urgencia          TEXT DEFAULT 'baja',
//   patron_accion     TEXT DEFAULT '',
//   responsable       TEXT DEFAULT '',
//   estado            TEXT DEFAULT 'pendiente',
//   foto_apertura_url TEXT,
//   foto_cierre_url   TEXT,
//   fecha_apertura    TIMESTAMPTZ DEFAULT now(),
//   fecha_cierre      TIMESTAMPTZ,
//   quien_reparo      TEXT DEFAULT '',
//   coste             NUMERIC DEFAULT 0,
//   observaciones     TEXT DEFAULT '',
//   alerta_horas      INTEGER DEFAULT 48,
//   created_at        TIMESTAMPTZ DEFAULT now()
// );
// ALTER TABLE averias ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON averias FOR ALL USING (true);
//
// -- STORAGE bucket "evidencias-incidencias"
// INSERT INTO storage.buckets (id, name, public)
// VALUES ('evidencias-incidencias', 'evidencias-incidencias', true)
// ON CONFLICT DO NOTHING;
// CREATE POLICY "Allow all storage" ON storage.objects
//   FOR ALL USING (bucket_id = 'evidencias-incidencias');
//
// ============================================================
