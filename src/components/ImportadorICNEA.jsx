// ============================================================
// NUBA INCIDENCIAS — Importador ICNEA
// Soporta: calendario .xhtml y incidencias .csv
// ============================================================
import { useState } from "react";
import { supabase } from "../../lib/supabase";

// ── Parser calendario .xhtml ─────────────────────────────────
function parseXhtmlCalendario(content) {
  const reservations = [];
  const rowRegex = /(?=<div[^>]*class="[^"]*calendario-row[^"]*")/g;
  const rows = content.split(rowRegex);

  for (const row of rows.slice(2)) {
    const propMatch = row.match(/class="propiedad"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/s);
    if (!propMatch) continue;
    const propName = propMatch[1].trim();

    const celdaRegex = /<div[^>]*class="([^"]*celda[^"]*)"[^>]*data-date="([^"]+)"[^>]*>(.*?)<\/div>\s*<\/div>/gs;
    let inRes = false;
    let currentCheckin = null;
    let currentGuest = null;
    let prevDate = null;
    let currentColor = null;

    let match;
    while ((match = celdaRegex.exec(row)) !== null) {
      const classes = match[1];
      const date = match[2];
      const inner = match[3];

      const colorMatch = inner.match(/--fondo-color-reserva:\s*([^;"\s]+)/);
      const guestMatch = inner.match(/nombre-huesped[^>]+>([^<]+)</);
      const isInicio = inner.includes("inicio-reserva");
      const isFin = inner.includes("fin-reserva");
      const hasRes = colorMatch && !colorMatch[1].includes("#828C95");

      if (guestMatch) currentGuest = guestMatch[1].trim();

      if (hasRes) {
        if (isInicio || !inRes) {
          if (inRes && currentCheckin) {
            reservations.push({ propiedad: propName, checkin: currentCheckin, checkout: prevDate, huesped: currentGuest || "?" });
          }
          currentCheckin = date;
          currentColor = colorMatch[1];
          inRes = true;
        }
        if (isFin && inRes) {
          reservations.push({ propiedad: propName, checkin: currentCheckin, checkout: date, huesped: currentGuest || "?" });
          inRes = false; currentCheckin = null; currentGuest = null;
        }
      } else {
        if (inRes && currentCheckin) {
          reservations.push({ propiedad: propName, checkin: currentCheckin, checkout: prevDate, huesped: currentGuest || "?" });
        }
        inRes = false; currentCheckin = null;
      }
      prevDate = date;
    }
  }
  return reservations;
}

// ── Parser incidencias .csv ──────────────────────────────────
function parseCsvIncidencias(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const incidencias = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    if (cols.length < 5) continue;
    const [propiedad, fecha, , titulo, descripcion, informe, tipo, , , estado] = cols;
    if (!propiedad || !titulo) continue;
    incidencias.push({
      propiedad: propiedad.trim(),
      fecha: fecha.trim(),
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || "",
      informe: informe?.trim() || "",
      tipo: tipo?.trim() || "",
      estado: estado?.trim() || "Pending",
    });
  }
  return incidencias;
}

// ── Normalizar nombre de apartamento ────────────────────────
function normalizarApartamento(nombre) {
  return nombre
    .toUpperCase()
    .replace(/-\d+$/g, "")        // quitar número final (CARRETAS-21 → CARRETAS)
    .replace(/[-_]/g, " ")        // guiones a espacios
    .replace(/\s+/g, " ")
    .trim();
}

export default function ImportadorICNEA({ apartamentos, onImportado }) {
  const [loading, setLoading]   = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError]       = useState(null);
  const [modo, setModo]         = useState("calendario"); // "calendario" | "incidencias"

  const buscarApartamentoId = (nombreRaw) => {
    const norm = normalizarApartamento(nombreRaw);
    const apt = apartamentos.find(a => {
      const n = normalizarApartamento(a.nombre);
      return n === norm || norm.startsWith(n) || n.startsWith(norm);
    });
    return apt?.id || null;
  };

  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    setError(null);
    setResultado(null);

    let totalImportados = 0;
    let totalOmitidos = 0;
    let errores = [];

    for (const file of files) {
      const content = await file.text();

      if (modo === "calendario" && file.name.endsWith(".xhtml")) {
        const reservas = parseXhtmlCalendario(content);

        for (const res of reservas) {
          const aptId = buscarApartamentoId(res.propiedad);
          if (!aptId) { totalOmitidos++; continue; }

          // Verificar si ya existe (mismo apartamento + fecha entrada)
          const { data: existe } = await supabase.from("reservas")
            .select("id")
            .eq("apartamento_id", aptId)
            .eq("fecha_entrada", res.checkin + " 14:00:00")
            .maybeSingle();

          if (existe) { totalOmitidos++; continue; }

          const { error: err } = await supabase.from("reservas").insert({
            apartamento_id: aptId,
            fecha_entrada:  res.checkin + " 14:00:00",
            fecha_salida:   res.checkout + " 10:00:00",
            huespedes:      1,
            notas:          res.huesped !== "?" ? `Huésped: ${res.huesped}` : "",
          });

          if (err) errores.push(`${res.propiedad}: ${err.message}`);
          else totalImportados++;
        }

      } else if (modo === "incidencias" && file.name.endsWith(".csv")) {
        const incidencias = parseCsvIncidencias(content);

        for (const inc of incidencias) {
          const aptId = buscarApartamentoId(inc.propiedad);
          if (!aptId) { totalOmitidos++; continue; }

          // Verificar si ya existe (mismo apartamento + titulo + fecha)
          const { data: existe } = await supabase.from("averias")
            .select("id")
            .eq("apartamento_id", aptId)
            .eq("descripcion", inc.titulo)
            .maybeSingle();

          if (existe) { totalOmitidos++; continue; }

          const descripcionCompleta = inc.descripcion
            ? `${inc.titulo}\n\n${inc.descripcion}${inc.informe ? `\n\nInforme: ${inc.informe}` : ""}`
            : inc.titulo;

          const { error: err } = await supabase.from("averias").insert({
            apartamento_id: aptId,
            descripcion:    descripcionCompleta,
            urgencia:       "media",
            estado:         inc.estado === "Pending" ? "pendiente" : "resuelto",
            fecha_apertura: inc.fecha ? new Date(inc.fecha).toISOString() : new Date().toISOString(),
            patron_accion:  inc.tipo || "",
          });

          if (err) errores.push(`${inc.propiedad}: ${err.message}`);
          else totalImportados++;
        }
      } else {
        errores.push(`Formato no reconocido: ${file.name}`);
      }
    }

    setLoading(false);
    setResultado({ importados: totalImportados, omitidos: totalOmitidos, errores });
    if (totalImportados > 0 && onImportado) onImportado();
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
      <p className="text-sm font-bold text-nuba-blue mb-3">📥 Importar desde ICNEA</p>

      {/* Selector tipo */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "calendario",   label: "📅 Calendario (.xhtml)" },
          { key: "incidencias",  label: "⚠️ Incidencias (.csv)" },
        ].map(m => (
          <button key={m.key} onClick={() => setModo(m.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 transition
              ${modo === m.key ? "border-nuba-cyan bg-nuba-cyan/10 text-nuba-cyan" : "border-slate-200 text-slate-400 hover:border-slate-300"}`}>
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-3">
        {modo === "calendario"
          ? "Sube los archivos .xhtml descargados desde ICNEA → Bookings → Download. Puedes subir varios meses a la vez."
          : "Sube el archivo .csv de incidencias exportado desde ICNEA → Administration → Incidents."}
      </p>

      <label className={`flex items-center gap-3 cursor-pointer w-fit ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-nuba-cyan/10 text-nuba-cyan px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-nuba-cyan/20 transition flex items-center gap-2">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-nuba-cyan/30 border-t-nuba-cyan rounded-full animate-spin" /> Importando…</>
          ) : (
            <>{modo === "calendario" ? "📅" : "📋"} Seleccionar archivo{modo === "calendario" ? "s" : ""}</>
          )}
        </div>
        <input
          type="file"
          multiple={modo === "calendario"}
          accept={modo === "calendario" ? ".xhtml" : ".csv"}
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {resultado && (
        <div className={`mt-3 rounded-xl px-4 py-3 text-sm ${resultado.errores.length > 0 && resultado.importados === 0 ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          <p className="font-semibold">
            ✅ {resultado.importados} importado{resultado.importados !== 1 ? "s" : ""}
            {resultado.omitidos > 0 ? ` · ${resultado.omitidos} omitidos (ya existían)` : ""}
          </p>
          {resultado.errores.length > 0 && (
            <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
              {resultado.errores.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
