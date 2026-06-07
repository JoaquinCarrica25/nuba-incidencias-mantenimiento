// ============================================================
// NUBA INCIDENCIAS — Sidebar v2 (Nuba brand)
// ============================================================
import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";

export default function Sidebar({ apartamentos, activo, onSelect, pestana, onPestana, alertas = {} }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = apartamentos.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const TABS = [
    { key: "prevenciones", label: "Prevenciones", icon: "🛡️" },
    { key: "averias",      label: "Averías",       icon: "⚠️" },
    { key: "pendientes",   label: "Pendientes",    icon: "🔔" },
    { key: "reparaciones", label: "Reparaciones",  icon: "✅" },
    { key: "calendario",   label: "Calendario",    icon: "📅" },
  ];

  const hayAlertas = Object.values(alertas).some(Boolean);

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-nuba-blue rounded-xl flex items-center justify-center shadow-lg"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white text-xl">{open ? "✕" : "☰"}</span>
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`
        fixed md:relative top-0 left-0 h-full z-40
        w-72 flex-shrink-0 bg-nuba-blue flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        shadow-2xl
      `}>

        {/* Logo Nuba */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-nuba-cyan flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-black text-sm tracking-tight">NUBA</span>
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide">NUBA</p>
              <p className="text-white/40 text-xs italic">Apartamentos</p>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="px-3 py-3 border-b border-white/10 space-y-0.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { onPestana(t.key); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition
                ${pestana === t.key ? "bg-nuba-cyan text-white shadow-md" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <span>{t.icon}</span>
              <span className="flex-1">{t.label}</span>
              {t.key === "pendientes" && hayAlertas && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="px-3 py-2">
          <input type="text" placeholder="Buscar apartamento…" value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-nuba-cyan/40 transition" />
        </div>

        {/* Lista apartamentos */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 scrollbar-thin">
          {filtrados.map(a => (
            <button key={a.id} onClick={() => { onSelect(a); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition
                ${activo?.id === a.id ? "bg-white/20 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <span className="truncate">{a.nombre}</span>
              {alertas[a.id] && <span className="text-base flex-shrink-0">🔔</span>}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white text-xs font-semibold">{user?.nombre}</p>
            <p className="text-white/30 text-xs">{user?.rol === "admin" ? "Administrador" : "Logística"}</p>
          </div>
          <button onClick={logout} className="text-white/40 hover:text-white text-xs transition">↩ Salir</button>
        </div>
      </aside>
    </>
  );
}
