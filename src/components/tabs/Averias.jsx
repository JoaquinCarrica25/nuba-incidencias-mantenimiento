// ============================================================
// NUBA INCIDENCIAS — Tab: Averías v2 (con edición)
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { RESPONSABLES, URGENCIAS } from "../../data/data";

export default function Averias({ apartamento, apartamentos }) {
  const [sub, setSub]         = useState("nueva");
  const [averias, setAverias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ apartamento_id: apartamento?.id || "", descripcion: "", urgencia: "baja", patron_accion: "", responsable: "", alerta_horas: 48 });
  const [foto, setFoto]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [ok, setOk]           = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});

  useEffect(() => { cargarAverias(); }, []);
  useEffect(() => { if (apartamento) setForm(f => ({ ...f, apartamento_id: apartamento.id })); }, [apartamento]);

  const cargarAverias = async () => {
    setLoading(true);
    const { data } = await supabase.from("averias").select("*, apartamentos(nombre)")
      .eq("estado", "pendiente").order("fecha_apertura", { ascending: false });
    setAverias(data || []);
    setLoading(false);
  };

  const guardar = async () => {
    if (!form.apartamento_id || !form.descripcion) return;
    setSaving(true);
    const { data } = await supabase.from("averias").insert({ ...form, estado: "pendiente", fecha_apertura: new Date().toISOString() }).select().single();
    if (data && foto) {
      const ext = foto.name.split(".").pop();
      const path = `averias/${data.id}/apertura_${Date.now()}.${ext}`;
      await supabase.storage.from("evidencias-incidencias").upload(path, foto, { upsert: true });
      const { data: urlData } = supabase.storage.from("evidencias-incidencias").getPublicUrl(path);
      await supabase.from("averias").update({ foto_apertura_url: urlData.publicUrl }).eq("id", data.id);
    }
    setSaving(false); setOk(true); setFoto(null);
    setForm(f => ({ ...f, descripcion: "", patron_accion: "", responsable: "" }));
    setTimeout(() => setOk(false), 2500);
    await cargarAverias();
  };

  const iniciarEdicion = (a) => {
    setEditando(a.id);
    setFormEdit({ descripcion: a.descripcion, urgencia: a.urgencia, patron_accion: a.patron_accion || "", responsable: a.responsable || "", alerta_horas: a.alerta_horas || 48 });
  };

  const guardarEdicion = async (id) => {
    await supabase.from("averias").update(formEdit).eq("id", id);
    setEditando(null);
    await cargarAverias();
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta avería?")) return;
    await supabase.from("averias").delete().eq("id", id);
    setAverias(prev => prev.filter(a => a.id !== id));
  };

  const urgObj = (v) => URGENCIAS.find(u => u.value === v) || URGENCIAS[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {[{ key: "nueva", label: "➕ Nueva avería" }, { key: "listado", label: "📋 Listado" }].map(t => (
          <button key={t.key} onClick={() => setSub(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${sub === t.key ? "bg-white text-nuba-blue shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === "nueva" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-nuba-blue">Nueva Avería</h2>
          <div>
            <label className="field-label">Apartamento</label>
            <select value={form.apartamento_id} onChange={e => setForm(f => ({ ...f, apartamento_id: e.target.value }))} className="field-input">
              <option value="">— Seleccionar —</option>
              {apartamentos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Descripción</label>
            <textarea rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Describe el problema…" className="field-input resize-none" />
          </div>
          <div>
            <label className="field-label">Urgencia</label>
            <div className="flex gap-2">
              {URGENCIAS.map(u => (
                <button key={u.value} onClick={() => setForm(f => ({ ...f, urgencia: u.value }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${form.urgencia === u.value ? `${u.bg} ${u.text} ${u.border}` : "border-slate-200 text-slate-400"}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${u.color} mr-1.5`}></span>{u.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Patrón de acción</label>
            <input type="text" value={form.patron_accion} onChange={e => setForm(f => ({ ...f, patron_accion: e.target.value }))} placeholder="Ej: Comprar repuesto, llamar técnico…" className="field-input" />
          </div>
          <div>
            <label className="field-label">Responsable</label>
            <select value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} className="field-input">
              <option value="">— Asignar —</option>
              {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Alerta antes del check-out</label>
            <div className="flex gap-2">
              {[24, 48, 72].map(h => (
                <button key={h} onClick={() => setForm(f => ({ ...f, alerta_horas: h }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition ${form.alerta_horas === h ? "border-nuba-cyan bg-nuba-cyan/10 text-nuba-cyan" : "border-slate-200 text-slate-400"}`}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Foto de evidencia</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="bg-nuba-cyan/10 text-nuba-cyan px-4 py-2 rounded-xl text-sm font-medium hover:bg-nuba-cyan/20 transition">
                📷 {foto ? foto.name : "Adjuntar foto"}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFoto(e.target.files?.[0] || null)} />
            </label>
          </div>
          {ok && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm">✓ Avería registrada.</div>}
          <button onClick={guardar} disabled={saving || !form.apartamento_id || !form.descripcion}
            className="w-full bg-nuba-blue text-white font-semibold py-3 rounded-xl text-sm hover:bg-nuba-blue/90 transition disabled:opacity-50">
            {saving ? "Guardando…" : "Registrar avería"}
          </button>
        </div>
      )}

      {sub === "listado" && (
        <div>
          <h2 className="text-lg font-bold text-nuba-blue mb-4">Averías activas</h2>
          {loading ? <div className="text-center text-slate-400 py-10">Cargando…</div> :
            averias.length === 0 ? (
              <div className="text-center py-20 text-slate-400"><p className="text-3xl mb-2">🎉</p><p>No hay averías activas.</p></div>
            ) : (
              <div className="space-y-3">
                {averias.map(a => {
                  const u = urgObj(a.urgencia);
                  const isEditing = editando === a.id;
                  return (
                    <div key={a.id} className={`bg-white rounded-2xl border ${u.border} p-4`}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea rows={2} value={formEdit.descripcion} onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))} className="field-input text-sm resize-none" />
                          <div className="flex gap-2">
                            {URGENCIAS.map(u2 => (
                              <button key={u2.value} onClick={() => setFormEdit(f => ({ ...f, urgencia: u2.value }))}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 ${formEdit.urgencia === u2.value ? `${u2.bg} ${u2.text} ${u2.border}` : "border-slate-200 text-slate-400"}`}>
                                {u2.label}
                              </button>
                            ))}
                          </div>
                          <input type="text" value={formEdit.patron_accion} onChange={e => setFormEdit(f => ({ ...f, patron_accion: e.target.value }))} placeholder="Patrón de acción…" className="field-input text-sm" />
                          <select value={formEdit.responsable} onChange={e => setFormEdit(f => ({ ...f, responsable: e.target.value }))} className="field-input text-sm">
                            <option value="">— Responsable —</option>
                            {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={() => guardarEdicion(a.id)} className="bg-nuba-cyan text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Guardar</button>
                            <button onClick={() => setEditando(null)} className="text-slate-400 text-sm px-3">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${u.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-sm text-nuba-blue">{a.apartamentos?.nombre}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.bg} ${u.text}`}>{u.label}</span>
                              {a.responsable && <span className="text-xs text-slate-400">👤 {a.responsable}</span>}
                            </div>
                            <p className="text-sm text-slate-600">{a.descripcion}</p>
                            {a.patron_accion && <p className="text-xs text-slate-400 mt-1">→ {a.patron_accion}</p>}
                            <p className="text-xs text-slate-400 mt-1">{new Date(a.fecha_apertura).toLocaleDateString("es-ES")}</p>
                            <div className="flex gap-3 mt-2">
                              <button onClick={() => iniciarEdicion(a)} className="text-xs text-nuba-cyan hover:underline">✏️ Editar</button>
                              <button onClick={() => eliminar(a.id)} className="text-xs text-red-400 hover:underline">🗑️ Eliminar</button>
                            </div>
                          </div>
                          {a.foto_apertura_url && (
                            <a href={a.foto_apertura_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                              <img src={a.foto_apertura_url} className="w-full h-full object-cover" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
