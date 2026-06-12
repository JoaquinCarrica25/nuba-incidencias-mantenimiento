// ============================================================
// NUBA INCIDENCIAS — Tab: Reparaciones v2 (con métricas)
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { URGENCIAS } from "../../data/data";

export default function Reparaciones({ apartamentos }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [fechaDesde, setDesde]    = useState("");
  const [fechaHasta, setHasta]    = useState("");
  const [expandida, setExpandida] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    let query = supabase.from("averias").select("*, apartamentos(nombre)")
      .eq("estado", "resuelta").order("fecha_cierre", { ascending: false });
    if (fechaDesde) query = query.gte("fecha_apertura", fechaDesde);
    if (fechaHasta) query = query.lte("fecha_cierre", fechaHasta + "T23:59:59");
    const { data } = await query;
    setHistorial(data || []);
    setLoading(false);
  };

  const filtrados = historial.filter(a =>
    a.apartamentos?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const duracion = (apertura, cierre) => {
    if (!apertura || !cierre) return "—";
    const diff = new Date(cierre) - new Date(apertura);
    const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (dias > 0) return `${dias}d ${horas}h`;
    return `${horas}h`;
  };

  const urgObj = (v) => URGENCIAS.find(u => u.value === v) || URGENCIAS[0];

  // Métricas
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const finMesAnterior    = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

  const esteMes    = historial.filter(a => a.fecha_cierre && new Date(a.fecha_cierre) >= inicioMes);
  const mesAnterior = historial.filter(a => a.fecha_cierre && new Date(a.fecha_cierre) >= inicioMesAnterior && new Date(a.fecha_cierre) <= finMesAnterior);

  const costeMes    = esteMes.reduce((s, a) => s + (a.coste || 0), 0);
  const costeTotal  = filtrados.reduce((s, a) => s + (a.coste || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Métricas del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Este mes" valor={esteMes.length} unidad="reparac." color="text-nuba-cyan" />
        <MetricCard label="Mes anterior" valor={mesAnterior.length} unidad="reparac." color="text-slate-500" />
        <MetricCard label="Coste este mes" valor={`${costeMes.toFixed(0)}€`} color="text-nuba-blue" />
        <MetricCard label="Coste total filtro" valor={`${costeTotal.toFixed(0)}€`} color="text-slate-500" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-nuba-blue">Reparaciones</h2>
        <span className="text-sm text-slate-400">{filtrados.length} registros</span>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Buscar apartamento o descripción…" value={busqueda}
          onChange={e => setBusqueda(e.target.value)} className="field-input flex-1 text-sm" />
        <input type="date" value={fechaDesde} onChange={e => setDesde(e.target.value)} className="field-input text-sm w-auto" />
        <input type="date" value={fechaHasta} onChange={e => setHasta(e.target.value)} className="field-input text-sm w-auto" />
        <button onClick={cargar} className="bg-nuba-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-nuba-blue/90 transition">
          Filtrar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-nuba-cyan/20 border-t-nuba-cyan rounded-full animate-spin" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400"><p className="text-3xl mb-2">📂</p><p>Sin reparaciones registradas.</p></div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(a => {
            const u = urgObj(a.urgencia);
            const open = expandida === a.id;
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 transition"
                  onClick={() => setExpandida(open ? null : a.id)}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${u.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-nuba-blue">{a.apartamentos?.nombre}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.bg} ${u.text}`}>{u.label}</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ {duracion(a.fecha_apertura, a.fecha_cierre)}</span>
                      {a.coste > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a.coste.toFixed(2)}€</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{a.descripcion}</p>
                  </div>
                  <span className="text-slate-300 text-sm flex-shrink-0">{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Timeline */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trazabilidad</p>
                      <div className="flex flex-col gap-2 pl-2 border-l-2 border-nuba-cyan/30">
                        <TimelineItem color="bg-nuba-blue" label="Apertura" valor={new Date(a.fecha_apertura).toLocaleString("es-ES")} />
                        {a.responsable && <TimelineItem color="bg-yellow-400" label="Asignado a" valor={a.responsable} />}
                        {a.fecha_cierre && <TimelineItem color="bg-green-500" label="Cierre" valor={`${new Date(a.fecha_cierre).toLocaleString("es-ES")}${a.quien_reparo ? ` · ${a.quien_reparo}` : ""}`} />}
                      </div>
                    </div>

                    {/* Fotos */}
                    {(a.foto_apertura_url || a.foto_cierre_url) && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidencias</p>
                        <div className="flex gap-3">
                          {a.foto_apertura_url && (
                            <a href={a.foto_apertura_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200"><img src={a.foto_apertura_url} className="w-full h-full object-cover" /></div>
                              <span className="text-xs text-slate-400">Antes</span>
                            </a>
                          )}
                          {a.foto_cierre_url && (
                            <a href={a.foto_cierre_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-green-200"><img src={a.foto_cierre_url} className="w-full h-full object-cover" /></div>
                              <span className="text-xs text-slate-400">Después</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Datos finales */}
                    <div className="grid grid-cols-2 gap-3">
                      {a.coste > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400">Coste total</p>
                          <p className="text-lg font-black text-nuba-blue">{a.coste.toFixed(2)}€</p>
                        </div>
                      )}
                      {a.patron_accion && (
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400">Acción tomada</p>
                          <p className="text-sm text-slate-600">{a.patron_accion}</p>
                        </div>
                      )}
                    </div>
                    {a.observaciones && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-1">Observaciones técnicas</p>
                        <p className="text-sm text-slate-600">{a.observaciones}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, valor, unidad, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{valor}</p>
      {unidad && <p className="text-xs text-slate-400">{unidad}</p>}
    </div>
  );
}

function TimelineItem({ color, label, valor }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0 mt-1 -ml-[5px]`} />
      <span className="text-xs text-slate-500"><strong>{label}:</strong> {valor}</span>
    </div>
  );
}
