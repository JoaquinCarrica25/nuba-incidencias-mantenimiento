// ============================================================
// NUBA INCIDENCIAS — Panel de Configuración (Admin)
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthContext";

export default function PanelConfig({ apartamento, onUpdate }) {
  const { esAdmin } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({
    fecha_entrada: "", fecha_salida: "", huespedes: 1, notas: ""
  });
  const [saving, setSaving] = useState(false);
  const [capacidad, setCapacidad] = useState(apartamento?.capacidad || 2);
  const [editCap, setEditCap] = useState(false);

  useEffect(() => { if (apartamento) cargarReservas(); }, [apartamento]);

  const cargarReservas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reservas")
      .select("*")
      .eq("apartamento_id", apartamento.id)
      .order("fecha_entrada");
    setReservas(data || []);
    setLoading(false);
  };

  const guardarReserva = async () => {
    if (!form.fecha_entrada || !form.fecha_salida) return;
    setSaving(true);
    await supabase.from("reservas").insert({
      apartamento_id: apartamento.id, ...form, huespedes: parseInt(form.huespedes)
    });
    setForm({ fecha_entrada: "", fecha_salida: "", huespedes: 1, notas: "" });
    await cargarReservas();
    setSaving(false);
  };

  const eliminarReserva = async (id) => {
    await supabase.from("reservas").delete().eq("id", id);
    setReservas(prev => prev.filter(r => r.id !== id));
  };

  const guardarCapacidad = async () => {
    await supabase.from("apartamentos").update({ capacidad }).eq("id", apartamento.id);
    setEditCap(false);
    onUpdate?.();
  };

  const formatFecha = (f) => {
    if (!f) return "—";
    return new Date(f).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (!apartamento) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-nuba-blue">⚙️ Configuración — {apartamento.nombre}</h3>
        {!esAdmin && <span className="text-xs text-slate-400">Solo lectura</span>}
      </div>

      {/* Capacidad */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-slate-500">Capacidad:</span>
        {editCap && esAdmin ? (
          <>
            <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)}
              className="field-input w-20 text-sm" min={1} max={20} />
            <button onClick={guardarCapacidad} className="text-xs bg-nuba-cyan text-white px-3 py-1.5 rounded-lg">Guardar</button>
            <button onClick={() => setEditCap(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
          </>
        ) : (
          <>
            <span className="font-semibold text-nuba-blue">{apartamento.capacidad || 2} huéspedes</span>
            {esAdmin && <button onClick={() => setEditCap(true)} className="text-xs text-nuba-cyan hover:underline">Editar</button>}
          </>
        )}
      </div>

      {/* Formulario nueva reserva */}
      {esAdmin && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nueva reserva</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Entrada</label>
              <input type="datetime-local" value={form.fecha_entrada} onChange={e => setForm(f => ({ ...f, fecha_entrada: e.target.value }))} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Salida</label>
              <input type="datetime-local" value={form.fecha_salida} onChange={e => setForm(f => ({ ...f, fecha_salida: e.target.value }))} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Huéspedes reales</label>
              <input type="number" value={form.huespedes} min={1} onChange={e => setForm(f => ({ ...f, huespedes: e.target.value }))} className="field-input text-sm" />
            </div>
            <div>
              <label className="field-label">Notas</label>
              <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Opcional…" className="field-input text-sm" />
            </div>
          </div>
          <button onClick={guardarReserva} disabled={saving}
            className="bg-nuba-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-nuba-blue/90 transition disabled:opacity-50">
            {saving ? "Guardando…" : "➕ Añadir reserva"}
          </button>
        </div>
      )}

      {/* Lista reservas */}
      {loading ? <p className="text-sm text-slate-400">Cargando…</p> : (
        <div className="space-y-2">
          {reservas.length === 0 && <p className="text-sm text-slate-400">Sin reservas registradas.</p>}
          {reservas.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-nuba-cyan">📅</span>
              <div className="flex-1 min-w-0">
                <span className="text-slate-700">{formatFecha(r.fecha_entrada)}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="text-slate-700">{formatFecha(r.fecha_salida)}</span>
                <span className="text-slate-400 ml-2">· {r.huespedes} hués.</span>
              </div>
              {esAdmin && (
                <button onClick={() => eliminarReserva(r.id)} className="text-slate-300 hover:text-red-400 transition text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
