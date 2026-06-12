// ============================================================
// NUBA INCIDENCIAS — Tab: Prevenciones v2
// ============================================================
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { TAREAS_PREVENTIVAS_BASE } from "../../data/data";
import { useAuth } from "../../lib/AuthContext";
import BannerOcupacion from "../layout/BannerOcupacion";

export default function Prevenciones({ apartamento }) {
  const { esAdmin } = useAuth();
  const [tareas, setTareas]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [nuevaTarea, setNueva]    = useState("");
  const [uploading, setUploading] = useState(null);

  useEffect(() => { if (apartamento) cargar(); }, [apartamento]);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tareas_preventivas").select("*")
      .eq("apartamento_id", apartamento.id).order("created_at");

    if (!data || data.length === 0) {
      for (const tarea of TAREAS_PREVENTIVAS_BASE) {
        await supabase.from("tareas_preventivas").insert({ apartamento_id: apartamento.id, tarea, estado: "pendiente" });
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

  const eliminarTarea = async (id) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await supabase.from("tareas_preventivas").delete().eq("id", id);
    setTareas(prev => prev.filter(t => t.id !== id));
  };

  const diasDesde = (fecha) => {
    if (!fecha) return null;
    const diff = Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (!apartamento) return <div className="flex items-center justify-center h-64 text-slate-400">Selecciona un apartamento</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-nuba-cyan/20 border-t-nuba-cyan rounded-full animate-spin" /></div>;

  const completadas = tareas.filter(t => t.estado === "completada").length;
  const progresoPct = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Banner ocupación */}
      <BannerOcupacion apartamentoId={apartamento.id} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-nuba-blue">{apartamento.nombre} — Prevenciones</h2>
          <p className="text-slate-400 text-sm">{completadas}/{tareas.length} tareas completadas</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-nuba-cyan">{progresoPct}%</div>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-nuba-cyan rounded-full transition-all" style={{ width: `${progresoPct}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tareas.map(t => {
          const dias = diasDesde(t.fecha);
          const antigua = t.estado === "completada" && dias !== null && dias > 30;
          return (
            <div key={t.id} className={`bg-white rounded-2xl border p-4 transition
              ${t.estado === "completada" ? "border-nuba-cyan/30 bg-cyan-50/20" : antigua ? "border-orange-200" : "border-slate-200"}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleEstado(t)}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition flex items-center justify-center mt-0.5
                    ${t.estado === "completada" ? "bg-nuba-cyan border-nuba-cyan" : "border-slate-300 hover:border-nuba-cyan"}`}>
                  {t.estado === "completada" && <span className="text-white text-xs font-bold">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.estado === "completada" ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {t.tarea}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {t.fecha && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${antigua ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"}`}>
                        {antigua ? `⚠️ Hace ${dias} días` : `Realizada: ${t.fecha}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Foto */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="cursor-pointer text-xs text-nuba-cyan hover:underline flex items-center gap-1">
                    📷 {t.foto_url ? "Ver/cambiar" : "Foto"}
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(t, f); }} />
                  </label>
                  {t.foto_url && (
                    <a href={t.foto_url} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg overflow-hidden border border-nuba-cyan/30 flex-shrink-0">
                      <img src={t.foto_url} className="w-full h-full object-cover" />
                    </a>
                  )}
                  {uploading === t.id && <span className="text-xs text-slate-400 animate-pulse">⏳</span>}
                  {esAdmin && (
                    <button onClick={() => eliminarTarea(t.id)} className="text-xs text-red-300 hover:text-red-500 transition">✕</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nueva tarea */}
      <div className="mt-4 flex gap-2">
        <input type="text" value={nuevaTarea} onChange={e => setNueva(e.target.value)}
          onKeyDown={e => e.key === "Enter" && agregarTarea()}
          placeholder="Nueva tarea preventiva…"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nuba-cyan/30" />
        <button onClick={agregarTarea} className="bg-nuba-cyan text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-nuba-cyan/90 transition">
          + Añadir
        </button>
      </div>
    </div>
  );
}
