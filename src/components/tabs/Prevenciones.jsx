// ============================================================
// NUBA INCIDENCIAS — Tab: Prevenciones
// ============================================================
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { TAREAS_PREVENTIVAS_BASE } from "../../data/data";
import { useAuth } from "../../lib/AuthContext";

export default function Prevenciones({ apartamento }) {
  const { esAdmin } = useAuth();
  const [tareas, setTareas]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [nuevaTarea, setNueva]  = useState("");
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef(null);
  const [fileTarget, setFileTarget] = useState(null);

  useEffect(() => { if (apartamento) cargar(); }, [apartamento]);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tareas_preventivas")
      .select("*")
      .eq("apartamento_id", apartamento.id)
      .order("created_at");

    if (!data || data.length === 0) {
      // Crear tareas base si no existen
      for (const tarea of TAREAS_PREVENTIVAS_BASE) {
        await supabase.from("tareas_preventivas").insert({
          apartamento_id: apartamento.id, tarea, estado: "pendiente"
        });
      }
      const { data: d2 } = await supabase.from("tareas_preventivas").select("*").eq("apartamento_id", apartamento.id).order("created_at");
      setTareas(d2 || []);
    } else {
      setTareas(data);
    }
    setLoading(false);
  };

  const toggleEstado = async (t) => {
    const nuevo = t.estado === "completada" ? "pendiente" : "completada";
    const fecha = nuevo === "completada" ? new Date().toISOString().split("T")[0] : null;
    await supabase.from("tareas_preventivas").update({ estado: nuevo, fecha }).eq("id", t.id);
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, estado: nuevo, fecha } : x));
  };

  const subirFoto = async (t, file) => {
    setUploading(t.id);
    const ext = file.name.split(".").pop();
    const path = `prevenciones/${apartamento.id}/${t.id}_${Date.now()}.${ext}`;
    await supabase.storage.from("evidencias-incidencias").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("evidencias-incidencias").getPublicUrl(path);
    await supabase.from("tareas_preventivas").update({ foto_url: urlData.publicUrl }).eq("id", t.id);
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, foto_url: urlData.publicUrl } : x));
    setUploading(null);
  };

  const agregarTarea = async () => {
    if (!nuevaTarea.trim()) return;
    const { data } = await supabase.from("tareas_preventivas").insert({
      apartamento_id: apartamento.id, tarea: nuevaTarea.trim(), estado: "pendiente"
    }).select().single();
    if (data) setTareas(prev => [...prev, data]);
    setNueva("");
  };

  if (!apartamento) return <Placeholder texto="Selecciona un apartamento" />;
  if (loading) return <Spinner />;

  const completadas = tareas.filter(t => t.estado === "completada").length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-nuba-blue">{apartamento.nombre} — Prevenciones</h2>
          <p className="text-slate-400 text-sm">{completadas}/{tareas.length} tareas completadas</p>
        </div>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-nuba-cyan rounded-full transition-all" style={{ width: `${tareas.length ? (completadas/tareas.length)*100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {tareas.map(t => (
          <div key={t.id} className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 transition
            ${t.estado === "completada" ? "border-nuba-cyan/30 bg-cyan-50/30" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleEstado(t)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition flex items-center justify-center
                  ${t.estado === "completada" ? "bg-nuba-cyan border-nuba-cyan" : "border-slate-300 hover:border-nuba-cyan"}`}>
                {t.estado === "completada" && <span className="text-white text-xs">✓</span>}
              </button>
              <span className={`text-sm font-medium ${t.estado === "completada" ? "line-through text-slate-400" : "text-slate-700"}`}>
                {t.tarea}
              </span>
              {t.fecha && <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{t.fecha}</span>}
            </div>

            <div className="flex items-center gap-3 pl-9">
              <input type="file" className="hidden" ref={el => { if (fileTarget === t.id) fileRef.current = el; }}
                accept="image/*" capture="environment"
                onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(t, f); }} />
              <button
                onClick={() => { setFileTarget(t.id); setTimeout(() => document.getElementById(`foto-prev-${t.id}`)?.click(), 50); }}
                className="text-xs text-nuba-cyan hover:underline flex items-center gap-1">
                📷 {t.foto_url ? "Cambiar foto" : "Añadir foto"}
              </button>
              <input id={`foto-prev-${t.id}`} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(t, f); }} />
              {uploading === t.id && <span className="text-xs text-slate-400 animate-pulse">Subiendo…</span>}
              {t.foto_url && (
                <a href={t.foto_url} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg overflow-hidden border border-nuba-cyan/30 flex-shrink-0">
                  <img src={t.foto_url} className="w-full h-full object-cover" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {esAdmin && (
        <div className="mt-4 flex gap-2">
          <input type="text" value={nuevaTarea} onChange={e => setNueva(e.target.value)}
            onKeyDown={e => e.key === "Enter" && agregarTarea()}
            placeholder="Nueva tarea preventiva…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nuba-cyan/30" />
          <button onClick={agregarTarea} className="bg-nuba-cyan text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-nuba-cyan/90 transition">
            + Añadir
          </button>
        </div>
      )}
    </div>
  );
}

function Placeholder({ texto }) {
  return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">{texto}</div>;
}
function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-nuba-cyan/20 border-t-nuba-cyan rounded-full animate-spin" /></div>;
}
