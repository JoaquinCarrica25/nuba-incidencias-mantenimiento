// ============================================================
// NUBA INCIDENCIAS — Tab: Pendientes + Alarmas v2
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { URGENCIAS } from "../../data/data";

function enviarNotificacion(titulo, cuerpo) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(titulo, { body: cuerpo, icon: "/favicon.ico" });
  }
}

export default function Pendientes({ apartamento, alertas, setAlertas }) {
  const [averias, setAverias]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [resolviendo, setRes]   = useState(null);
  const [formRes, setFormRes]   = useState({ quien_reparo: "", observaciones: "", coste: "" });
  const [fotoRes, setFotoRes]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  useEffect(() => { cargar(); }, [apartamento]);

  const cargar = async () => {
    setLoading(true);
    let query = supabase.from("averias").select("*, apartamentos(nombre)")
      .eq("estado", "pendiente").order("fecha_apertura", { ascending: false });
    if (apartamento) query = query.eq("apartamento_id", apartamento.id);
    const { data } = await query;
    const lista = data || [];
    setAverias(lista);
    await calcularAlertas(lista);
    setLoading(false);
  };

  const calcularAlertas = async (lista) => {
    const nuevas = {};
    const ahora = new Date();
    for (const a of lista) {
      const { data: reservas } = await supabase.from("reservas").select("fecha_salida")
        .eq("apartamento_id", a.apartamento_id).gte("fecha_salida", ahora.toISOString())
        .order("fecha_salida").limit(1);
      if (reservas?.length > 0) {
        const checkout = new Date(reservas[0].fecha_salida);
        const diff = (checkout - ahora) / (1000 * 60 * 60);
        if (diff <= a.alerta_horas) {
          nuevas[a.id] = { activa: true, checkout, diffHoras: Math.round(diff) };
          enviarNotificacion(
            `⚠️ Avería pendiente en ${a.apartamentos?.nombre}`,
            `Check-out en ${Math.round(diff)}h. ${a.descripcion}`
          );
        }
      }
    }
    setAlertas(prev => ({ ...prev, ...nuevas }));
  };

  const resolver = async (averiaId) => {
    setSaving(true);
    let fotoUrl = null;
    if (fotoRes) {
      const ext = fotoRes.name.split(".").pop();
      const path = `averias/${averiaId}/cierre_${Date.now()}.${ext}`;
      await supabase.storage.from("evidencias-incidencias").upload(path, fotoRes, { upsert: true });
      const { data } = supabase.storage.from("evidencias-incidencias").getPublicUrl(path);
      fotoUrl = data.publicUrl;
    }
    await supabase.from("averias").update({
      estado: "resuelta", fecha_cierre: new Date().toISOString(),
      quien_reparo: formRes.quien_reparo, observaciones: formRes.observaciones,
      coste: parseFloat(formRes.coste) || 0, foto_cierre_url: fotoUrl,
    }).eq("id", averiaId);
    setRes(null); setFormRes({ quien_reparo: "", observaciones: "", coste: "" }); setFotoRes(null);
    setSaving(false);
    await cargar();
  };

  const iniciarEdicion = (a) => {
    setEditando(a.id);
    setFormEdit({ descripcion: a.descripcion, urgencia: a.urgencia, patron_accion: a.patron_accion, responsable: a.responsable, alerta_horas: a.alerta_horas });
  };

  const guardarEdicion = async (id) => {
    await supabase.from("averias").update(formEdit).eq("id", id);
    setEditando(null);
    await cargar();
  };

  const urgObj = (v) => URGENCIAS.find(u => u.value === v) || URGENCIAS[0];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-nuba-cyan/20 border-t-nuba-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-nuba-blue">
          {apartamento ? `${apartamento.nombre} — Pendientes` : "Todas las averías pendientes"}
        </h2>
        <span className="text-sm text-slate-400">{averias.length} incidencia{averias.length !== 1 ? "s" : ""}</span>
      </div>

      {averias.length === 0 ? (
        <div className="text-center py-20 text-slate-400"><p className="text-4xl mb-3">✅</p><p>Sin incidencias pendientes.</p></div>
      ) : (
        <div className="space-y-4">
          {averias.map(a => {
            const u = urgObj(a.urgencia);
            const alerta = alertas[a.id];
            const isEditing = editando === a.id;
            return (
              <div key={a.id} className={`bg-white rounded-2xl border-2 overflow-hidden ${alerta?.activa ? "border-red-300" : u.border}`}>
                {alerta?.activa && (
                  <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
                    <span className="text-xl animate-bounce">🔔</span>
                    <p className="text-red-700 text-sm font-semibold">
                      ¡Alarma! Check-out en {alerta.diffHoras}h · {alerta.checkout.toLocaleDateString("es-ES")}
                    </p>
                  </div>
                )}

                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea rows={2} value={formEdit.descripcion} onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))} className="field-input text-sm resize-none" />
                      <div className="flex gap-2">
                        {URGENCIAS.map(u2 => (
                          <button key={u2.value} onClick={() => setFormEdit(f => ({ ...f, urgencia: u2.value }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${formEdit.urgencia === u2.value ? `${u2.bg} ${u2.text} ${u2.border}` : "border-slate-200 text-slate-400"}`}>
                            {u2.label}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={formEdit.patron_accion} onChange={e => setFormEdit(f => ({ ...f, patron_accion: e.target.value }))} placeholder="Patrón de acción…" className="field-input text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => guardarEdicion(a.id)} className="bg-nuba-cyan text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Guardar</button>
                        <button onClick={() => setEditando(null)} className="text-slate-400 text-sm px-3">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 mb-3">
                        <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${u.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-nuba-blue">{a.apartamentos?.nombre}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.bg} ${u.text}`}>{u.label}</span>
                            {a.responsable && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">👤 {a.responsable}</span>}
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{a.descripcion}</p>
                          {a.patron_accion && <p className="text-xs text-slate-400">→ {a.patron_accion}</p>}
                          <p className="text-xs text-slate-400 mt-1">Abierta: {new Date(a.fecha_apertura).toLocaleDateString("es-ES")}</p>
                        </div>
                        {a.foto_apertura_url && (
                          <a href={a.foto_apertura_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                            <img src={a.foto_apertura_url} className="w-full h-full object-cover" />
                          </a>
                        )}
                      </div>

                      <div className="flex gap-3 text-sm">
                        <button onClick={() => iniciarEdicion(a)} className="text-nuba-cyan hover:underline text-xs font-medium">✏️ Editar</button>
                        {resolviendo === a.id ? null : (
                          <button onClick={() => setRes(a.id)} className="text-nuba-blue hover:text-nuba-cyan text-xs font-medium">🔧 Registrar resolución</button>
                        )}
                      </div>

                      {resolviendo === a.id && (
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200 mt-3">
                          <p className="text-sm font-semibold text-nuba-blue">Registrar resolución</p>
                          <input type="text" placeholder="¿Quién lo reparó?" value={formRes.quien_reparo} onChange={e => setFormRes(f => ({ ...f, quien_reparo: e.target.value }))} className="field-input text-sm" />
                          <textarea rows={2} placeholder="Observaciones técnicas…" value={formRes.observaciones} onChange={e => setFormRes(f => ({ ...f, observaciones: e.target.value }))} className="field-input text-sm resize-none" />
                          <input type="number" placeholder="Coste total (€)" value={formRes.coste} onChange={e => setFormRes(f => ({ ...f, coste: e.target.value }))} className="field-input text-sm" />
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-nuba-cyan">
                            📷 {fotoRes ? fotoRes.name : "Foto de cierre"}
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFotoRes(e.target.files?.[0] || null)} />
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => resolver(a.id)} disabled={saving} className="flex-1 bg-nuba-cyan text-white font-semibold py-2 rounded-xl text-sm disabled:opacity-50">
                              {saving ? "Guardando…" : "✓ Marcar resuelta"}
                            </button>
                            <button onClick={() => setRes(null)} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
