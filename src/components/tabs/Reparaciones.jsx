// ============================================================
// NUBA INCIDENCIAS — Tab: Reparaciones (Historial)
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
    let query = supabase
      .from("averias")
      .select("*, apartamentos(nombre)")
      .eq("estado", "resuelta")
      .order("fecha_cierre", { ascending: false });

    if (fechaDesde) query = query.gte("fecha_apertura", fechaDesde);
    if (fechaHasta) query = query.lte("fecha_cierre", fechaHasta);

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

  const totalCoste = filtrados.reduce((sum, a) => sum + (a.coste || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-nuba-blue">Reparaciones</h2>
        <div className="text-right">
          <p className="text-xs text-slate-400">{filtrados.length} reparaciones</p>
          <p className="text-sm font-semibold text-nuba-blue">Coste total: {totalCoste.toFixed(2)}€</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Buscar por apartamento o descripción…" value={busqueda}
          onChange={e => setBusqueda(e.target.value)} className="field-input flex-1 text-sm" />
        <input type="date" value={fechaDesde} onChange={e => setDesde(e.target.value)} className="field-input text-sm w-auto" />
        <input type="date" value={fechaHasta} onChange={e => setHasta(e.target.value)} className="field-input text-sm w-auto" />
        <button onClick={cargar} className="bg-nuba-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-nuba-blue/90 transition">
          Filtrar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-nuba-cyan/20 border-t-nuba-cyan rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-3xl mb-2">📂</p>
          <p>Sin reparaciones registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(a => {
            const u = urgObj(a.urgencia);
            const open = expandida === a.id;
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Cabecera */}
                <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 transition"
                  onClick={() => setExpandida(open ? null : a.id)}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${u.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-nuba-blue">{a.apartamentos?.nombre}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.bg} ${u.text}`}>{u.label}</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ Resuelta en {duracion(a.fecha_apertura, a.fecha_cierre)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{a.descripcion}</p>
                  </div>
                  <span className="text-slate-300 text-sm flex-shrink-0">{open ? "▲" : "▼"}</span>
                </button>

                {/* Detalle expandido */}
                {open && (
                  <div className="border-t border-slate-100 p-4 space-y-4">

                    {/* Línea de tiempo */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trazabilidad</p>
                      <div className="flex flex-col gap-2 pl-2 border-l-2 border-nuba-cyan/30">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-nuba-blue flex-shrink-0 -ml-[5px]" />
                          <span className="text-xs text-slate-500">
                            <strong>Apertura:</strong> {new Date(a.fecha_apertura).toLocaleString("es-ES")}
                          </span>
                        </div>
                        {a.responsable && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 -ml-[5px]" />
                            <span className="text-xs text-slate-500"><strong>Asignado a:</strong> {a.responsable}</span>
                          </div>
                        )}
                        {a.fecha_cierre && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 -ml-[5px]" />
                            <span className="text-xs text-slate-500">
                              <strong>Cierre:</strong> {new Date(a.fecha_cierre).toLocaleString("es-ES")}
                              {a.quien_reparo && ` · ${a.quien_reparo}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fotos antes/después */}
                    {(a.foto_apertura_url || a.foto_cierre_url) && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidencias</p>
                        <div className="flex gap-3">
                          {a.foto_apertura_url && (
                            <a href={a.foto_apertura_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                                <img src={a.foto_apertura_url} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-xs text-slate-400">Antes</span>
                            </a>
                          )}
                          {a.foto_cierre_url && (
                            <a href={a.foto_cierre_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-green-200">
                                <img src={a.foto_cierre_url} className="w-full h-full object-cover" />
                              </div>
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
                          <p className="text-lg font-bold text-nuba-blue">{a.coste.toFixed(2)}€</p>
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
