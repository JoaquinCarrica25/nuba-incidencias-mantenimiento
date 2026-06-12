// ============================================================
// NUBA INCIDENCIAS — Tab: Calendario (pestaña independiente)
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";

export default function Calendario({ apartamento, apartamentos }) {
  const { esAdmin } = useAuth();
  const [reservas, setReservas]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [apto, setApto]           = useState(apartamento?.id || "");
  const [form, setForm] = useState({ fecha_entrada: "", fecha_salida: "", huespedes: 1, notas: "" });
  const [saving, setSaving]       = useState(false);
  const [editando, setEditando]   = useState(null);
  const [formEdit, setFormEdit]   = useState({});

  useEffect(() => { if (apartamento) setApto(apartamento.id); }, [apartamento]);
  useEffect(() => { if (apto) cargar(); }, [apto]);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from("reservas").select("*, apartamentos(nombre)")
      .eq("apartamento_id", apto).order("fecha_entrada");
    setReservas(data || []);
    setLoading(false);
  };

  const guardar = async () => {
    if (!form.fecha_entrada || !form.fecha_salida || !apto) return;
    setSaving(true);
    // Guardamos la fecha exacta como texto sin conversion UTC
    const payload = {
      apartamento_id: apto,
      fecha_entrada: form.fecha_entrada + ":00",
      fecha_salida: form.fecha_salida + ":00",
      huespedes: parseInt(form.huespedes),
      notas: form.notas,
    };
    await supabase.from("reservas").insert(payload);
    setForm({ fecha_entrada: "", fecha_salida: "", huespedes: 1, notas: "" });
    await cargar();
    setSaving(false);
  };

  const eliminar = async (id) => {
    await supabase.from("reservas").delete().eq("id", id);
    setReservas(prev => prev.filter(r => r.id !== id));
  };

  const iniciarEdicion = (r) => {
    setEditando(r.id);
    setFormEdit({
      fecha_entrada: r.fecha_entrada?.slice(0, 16),
      fecha_salida:  r.fecha_salida?.slice(0, 16),
      huespedes:     r.huespedes,
      notas:         r.notas || "",
    });
  };

  const guardarEdicion = async (id) => {
    await supabase.from("reservas").update({ ...formEdit, huespedes: parseInt(formEdit.huespedes) }).eq("id", id);
    setEditando(null);
    await cargar();
  };

  // Mostrar hora exacta sin conversion de zona horaria
  const fmt = (f) => {
    if (!f) return "—";
    const s = f.slice(0, 16);
    const [fecha, hora] = s.split("T");
    const [y, m, d] = fecha.split("-");
    return d + "/" + m + "/" + y + " " + hora;
  };
  const ahoraISO = new Date().toISOString().slice(0, 16);
  const proximas = reservas.filter(r => (r.fecha_salida || "").slice(0, 16) >= ahoraISO);
  const pasadas  = reservas.filter(r => (r.fecha_salida || "").slice(0, 16) < ahoraISO);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-nuba-blue">📅 Calendario de ocupación</h2>
      </div>

      {/* Selector apartamento */}
      <div className="mb-4">
        <label className="field-label">Apartamento</label>
        <select value={apto} onChange={e => setApto(e.target.value)} className="field-input max-w-xs">
          <option value="">— Seleccionar —</option>
          {apartamentos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      {/* Formulario nueva reserva */}
      {esAdmin && apto && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <p className="text-sm font-bold text-nuba-blue mb-4">➕ Nueva reserva</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Entrada</label>
              <input type="datetime-local" value={form.fecha_entrada} onChange={e => setForm(f => ({ ...f, fecha_entrada: e.target.value }))} className="field-input" />
            </div>
            <div>
              <label className="field-label">Salida (Check-out)</label>
              <input type="datetime-local" value={form.fecha_salida} onChange={e => setForm(f => ({ ...f, fecha_salida: e.target.value }))} className="field-input" />
            </div>
            <div>
              <label className="field-label">Nº huéspedes</label>
              <input type="number" min={1} value={form.huespedes} onChange={e => setForm(f => ({ ...f, huespedes: e.target.value }))} className="field-input" />
            </div>
            <div>
              <label className="field-label">Notas</label>
              <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Opcional…" className="field-input" />
            </div>
          </div>
          <button onClick={guardar} disabled={saving || !form.fecha_entrada || !form.fecha_salida}
            className="mt-4 bg-nuba-cyan text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-nuba-cyan/90 transition disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar reserva"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-nuba-cyan/20 border-t-nuba-cyan rounded-full animate-spin" />
        </div>
      ) : !apto ? (
        <div className="text-center py-16 text-slate-400">Selecciona un apartamento para ver sus reservas.</div>
      ) : (
        <>
          {/* Próximas */}
          {proximas.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Próximas / Activas</p>
              <div className="space-y-2">
                {proximas.map(r => (
                  <ReservaCard key={r.id} r={r} fmt={fmt} esAdmin={esAdmin}
                    editando={editando} formEdit={formEdit} setFormEdit={setFormEdit}
                    onEdit={iniciarEdicion} onSave={guardarEdicion}
                    onCancel={() => setEditando(null)} onDelete={eliminar} activa />
                ))}
              </div>
            </div>
          )}

          {/* Pasadas */}
          {pasadas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Historial</p>
              <div className="space-y-2 opacity-60">
                {pasadas.map(r => (
                  <ReservaCard key={r.id} r={r} fmt={fmt} esAdmin={esAdmin}
                    editando={editando} formEdit={formEdit} setFormEdit={setFormEdit}
                    onEdit={iniciarEdicion} onSave={guardarEdicion}
                    onCancel={() => setEditando(null)} onDelete={eliminar} />
                ))}
              </div>
            </div>
          )}

          {reservas.length === 0 && (
            <div className="text-center py-16 text-slate-400">Sin reservas registradas para este apartamento.</div>
          )}
        </>
      )}
    </div>
  );
}

function ReservaCard({ r, fmt, esAdmin, editando, formEdit, setFormEdit, onEdit, onSave, onCancel, onDelete, activa, averiasCount = 0 }) {
  const isEditing = editando === r.id;
  return (
    <div className={`bg-white rounded-2xl border p-4 ${activa ? "border-nuba-cyan/30" : "border-slate-200"}`}>
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Entrada</label>
              <input type="datetime-local" value={formEdit.fecha_entrada} onChange={e => setFormEdit(f => ({ ...f, fecha_entrada: e.target.value }))} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Salida</label>
              <input type="datetime-local" value={formEdit.fecha_salida} onChange={e => setFormEdit(f => ({ ...f, fecha_salida: e.target.value }))} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Huéspedes</label>
              <input type="number" min={1} value={formEdit.huespedes} onChange={e => setFormEdit(f => ({ ...f, huespedes: e.target.value }))} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Notas</label>
              <input type="text" value={formEdit.notas} onChange={e => setFormEdit(f => ({ ...f, notas: e.target.value }))} className="field-input text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSave(r.id)} className="bg-nuba-cyan text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Guardar</button>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm px-3">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className={`text-xl ${activa ? "text-nuba-cyan" : "text-slate-300"}`}>📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{fmt(r.fecha_entrada)}</span>
              <span className="text-slate-400 mx-1.5">→</span>
              <span className="font-semibold">{fmt(r.fecha_salida)}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {r.huespedes} hués.{r.notas ? ` · ${r.notas}` : ""}
            </p>
          </div>
          {esAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => onEdit(r)} className="text-xs text-nuba-cyan hover:underline">Editar</button>
              <button onClick={() => onDelete(r.id)} className="text-xs text-red-400 hover:underline">Borrar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
