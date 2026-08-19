// ============================================================
// NUBA INCIDENCIAS — Vista de Calendario Visual (estilo ICNEA)
// ============================================================
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["D","L","M","X","J","V","S"];

function diasEnMes(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function diaSemana(year, month, day) {
  return new Date(year, month, day).getDay();
}

function esFinDeSemana(year, month, day) {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

export default function CalendarioVisual({ apartamentos }) {
  const now = new Date();
  const [mes, setMes]         = useState(now.getMonth());
  const [año, setAño]         = useState(now.getFullYear());
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading]  = useState(false);
  const [tooltip, setTooltip]  = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { cargarReservas(); }, [mes, año]);

  // Auto-scroll al día de hoy
  useEffect(() => {
    if (scrollRef.current && mes === now.getMonth() && año === now.getFullYear()) {
      const todayCol = scrollRef.current.querySelector(".hoy-col");
      if (todayCol) todayCol.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  }, [reservas]);

  const cargarReservas = async () => {
    setLoading(true);
    const inicio = `${año}-${String(mes + 1).padStart(2, "0")}-01`;
    const fin    = `${año}-${String(mes + 1).padStart(2, "0")}-${String(diasEnMes(año, mes)).padStart(2, "0")}`;

    const { data } = await supabase.from("reservas")
      .select("*, apartamentos(id, nombre)")
      .lte("fecha_entrada", fin + " 23:59:59")
      .gte("fecha_salida",  inicio + " 00:00:00")
      .order("fecha_entrada");

    setReservas(data || []);
    setLoading(false);
  };

  const numDias = diasEnMes(año, mes);
  const today   = new Date();
  const todayDay = today.getDate();
  const isCurrentMonth = today.getMonth() === mes && today.getFullYear() === año;

  // Build reservation map: aptId -> [{start, end, notas, huespedes}]
  const resMap = {};
  for (const r of reservas) {
    const aptId = r.apartamento_id;
    if (!resMap[aptId]) resMap[aptId] = [];

    const startDate = new Date(r.fecha_entrada.replace(" ", "T"));
    const endDate   = new Date(r.fecha_salida.replace(" ", "T"));

    const startDay = startDate.getMonth() === mes && startDate.getFullYear() === año
      ? startDate.getDate()
      : 1;
    const endDay = endDate.getMonth() === mes && endDate.getFullYear() === año
      ? endDate.getDate()
      : numDias;

    resMap[aptId].push({
      startDay,
      endDay,
      notas: r.notas || "",
      huespedes: r.huespedes || 1,
      id: r.id,
      fechaEntrada: r.fecha_entrada,
      fechaSalida: r.fecha_salida,
    });
  }

  // Get cell state for a given apt and day
  const getCellState = (aptId, day) => {
    const apts = resMap[aptId] || [];
    for (const res of apts) {
      if (day >= res.startDay && day <= res.endDay) {
        return {
          occupied: true,
          isStart: day === res.startDay,
          isEnd: day === res.endDay,
          isStartEnd: day === res.startDay && day === res.endDay,
          res,
        };
      }
    }
    return { occupied: false };
  };

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAño(a => a - 1); }
    else setMes(m => m - 1);
  };
  const mesSiguiente = () => {
    if (mes === 11) { setMes(0); setAño(a => a + 1); }
    else setMes(m => m + 1);
  };

  const fmtFecha = (f) => {
    if (!f) return "—";
    const s = f.slice(0, 16).replace("T", " ");
    const [fecha, hora] = s.split(" ");
    if (!fecha) return f;
    const [y, m, d] = fecha.split("-");
    return hora ? `${d}/${m}/${y} ${hora}` : `${d}/${m}/${y}`;
  };

  return (
    <div className="w-full">
      {/* Header navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={mesAnterior}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:border-nuba-cyan hover:text-nuba-cyan transition text-slate-500">
          ‹
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-nuba-blue">{MESES[mes]} {año}</h3>
          {loading && <p className="text-xs text-slate-400 animate-pulse">Cargando…</p>}
        </div>
        <button onClick={mesSiguiente}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:border-nuba-cyan hover:text-nuba-cyan transition text-slate-500">
          ›
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-3 rounded bg-emerald-500 inline-block"></span>Ocupado</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-3 rounded bg-blue-100 inline-block border border-blue-300"></span>Hoy</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-3 rounded bg-slate-100 inline-block"></span>Fin de semana</span>
      </div>

      {/* Tabla calendario */}
      <div ref={scrollRef} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="border-collapse" style={{ minWidth: `${150 + numDias * 32}px` }}>
          <thead>
            <tr className="bg-slate-50">
              {/* Columna nombre */}
              <th className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500 w-36 min-w-36">
                Apartamento
              </th>
              {/* Columnas días */}
              {Array.from({ length: numDias }, (_, i) => {
                const day = i + 1;
                const dow = diaSemana(año, mes, day);
                const isWeekend = dow === 0 || dow === 6;
                const isToday = isCurrentMonth && day === todayDay;
                return (
                  <th key={day}
                    className={`border-b border-l border-slate-200 text-center py-1 min-w-8 w-8
                      ${isWeekend ? "bg-slate-100" : "bg-slate-50"}
                      ${isToday ? "hoy-col bg-blue-50 border-blue-300" : ""}
                    `}>
                    <div className={`text-xs font-semibold ${isToday ? "text-blue-600" : "text-slate-400"}`}>
                      {DIAS_SEMANA[dow]}
                    </div>
                    <div className={`text-xs font-bold ${isToday ? "text-blue-700 bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center mx-auto" : "text-slate-600"}`}>
                      {day}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {apartamentos.map((apt, idx) => (
              <tr key={apt.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {/* Nombre apartamento */}
                <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap
                  ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                  {apt.nombre}
                </td>
                {/* Celdas días */}
                {Array.from({ length: numDias }, (_, i) => {
                  const day = i + 1;
                  const isWeekend = esFinDeSemana(año, mes, day);
                  const isToday = isCurrentMonth && day === todayDay;
                  const cell = getCellState(apt.id, day);

                  let bg = "";
                  let rounded = "";
                  let cursor = "";

                  if (cell.occupied) {
                    cursor = "cursor-pointer";
                    if (cell.isStartEnd) {
                      bg = "bg-emerald-500";
                      rounded = "rounded-sm";
                    } else if (cell.isStart) {
                      bg = "bg-emerald-500";
                      rounded = "rounded-l-sm";
                    } else if (cell.isEnd) {
                      bg = "bg-emerald-500";
                      rounded = "rounded-r-sm";
                    } else {
                      bg = "bg-emerald-500";
                    }
                  }

                  return (
                    <td key={day}
                      className={`border-l border-b border-slate-100 p-0 h-8 relative
                        ${isWeekend && !cell.occupied ? "bg-slate-100/70" : ""}
                        ${isToday && !cell.occupied ? "bg-blue-50/70 hoy-col" : ""}
                        ${cursor}
                      `}
                      onClick={() => cell.occupied && setTooltip(tooltip?.id === cell.res?.id ? null : { ...cell.res, aptNombre: apt.nombre })}
                    >
                      {cell.occupied && (
                        <div className={`absolute inset-y-0.5 inset-x-0 ${bg} ${rounded} opacity-90`} />
                      )}
                      {/* Nombre huésped en inicio */}
                      {cell.isStart && cell.res?.notas && (
                        <div className="absolute inset-y-0 left-1 right-0 flex items-center z-10 pointer-events-none">
                          <span className="text-white text-xs font-semibold truncate max-w-[80px]" style={{ fontSize: "9px" }}>
                            {cell.res.notas.replace("Huésped: ", "")}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip reserva */}
      {tooltip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setTooltip(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-nuba-blue text-base">{tooltip.aptNombre}</span>
              <button onClick={() => setTooltip(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0">Entrada:</span>
                <span className="font-semibold text-slate-700">{fmtFecha(tooltip.fechaEntrada)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0">Salida:</span>
                <span className="font-semibold text-slate-700">{fmtFecha(tooltip.fechaSalida)}</span>
              </div>
              {tooltip.notas && (
                <div className="flex gap-2">
                  <span className="text-slate-400 w-20 flex-shrink-0">Huésped:</span>
                  <span className="text-slate-700">{tooltip.notas.replace("Huésped: ", "")}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0">Huéspedes:</span>
                <span className="text-slate-700">{tooltip.huespedes}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
