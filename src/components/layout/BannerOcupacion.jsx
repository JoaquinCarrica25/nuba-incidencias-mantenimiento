// ============================================================
// NUBA INCIDENCIAS — Banner de ocupación reutilizable
// ============================================================
import { useOcupacion } from "../../hooks/useOcupacion";

function fmtFecha(f) {
  if (!f) return "—";
  const s = (f || "").slice(0, 16);
  const partes = s.split("T");
  const fecha = partes[0] || "";
  const hora  = partes[1] || "";
  const bits = fecha.split("-");
  const y = bits[0], m = bits[1], d = bits[2];
  if (!d) return f;
  return hora ? d+"/"+m+"/"+y+" a las "+hora : d+"/"+m+"/"+y;
}

export default function BannerOcupacion({ apartamentoId }) {
  const estado = useOcupacion(apartamentoId);

  if (!estado) return (
    <div className="h-10 bg-slate-100 rounded-xl animate-pulse mb-4" />
  );

  if (estado.tipo === "ocupado") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🔴</span>
        <div>
          <p className="text-red-700 font-semibold text-sm">Apartamento OCUPADO</p>
          <p className="text-red-600 text-xs mt-0.5">
            Check-in: <strong>{fmtFecha(estado.desde)}</strong> · Check-out: <strong>{fmtFecha(estado.hasta)}</strong>
          </p>
          <p className="text-red-500 text-xs mt-0.5">
            {estado.huespedes} hués.{estado.notas ? ` · ${estado.notas}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
      <span className="text-xl flex-shrink-0">🟢</span>
      <div>
        <p className="text-green-700 font-semibold text-sm">Apartamento LIBRE</p>
        {estado.proximaEntrada ? (
          <p className="text-green-600 text-xs mt-0.5">
            Próxima entrada: <strong>{fmtFecha(estado.proximaEntrada)}</strong>
            {estado.proximaHuespedes ? ` · ${estado.proximaHuespedes} hués.` : ""}
          </p>
        ) : (
          <p className="text-green-500 text-xs mt-0.5">Sin reservas próximas</p>
        )}
      </div>
    </div>
  );
}
